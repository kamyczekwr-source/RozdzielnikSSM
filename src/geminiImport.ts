import { GoogleGenAI, Type } from '@google/genai';

export interface ExtractedEntry {
  employeeRaw: string;
  materialRaw: string;
  quantity: number;
}

/**
 * Wysyła zdjęcie papierowego rozdzielnika do Gemini i prosi o odczytanie
 * niepustych komórek (pracownik / materiał / ilość). Model dostaje znane
 * listy pracowników i materiałów z systemu, żeby lepiej dopasować odczytany
 * tekst (odręczne pismo bywa niedoskonałe) do istniejących nazw.
 */
export async function extractRozdzielnikFromImage(
  base64Data: string,
  mimeType: string,
  employeeNames: string[],
  materialNames: string[]
): Promise<ExtractedEntry[]> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Brak klucza VITE_GEMINI_API_KEY. Dodaj go w .env.local (lokalnie) lub w GitHub Secrets (produkcja).'
    );
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Jesteś asystentem odczytującym polski dokument "Rozdzielnik materiałów" na podstawie zdjęcia.
Dokument to tabela: wiersze to nazwiska pracowników, kolumny to nazwy materiałów (często w formie pionowego, obróconego tekstu w nagłówku), a w komórkach wpisane są ręcznie lub na maszynie ilości wydanych materiałów (liczby całkowite). Puste komórki lub kreski "-" oznaczają brak wydania i należy je pominąć.

Znana lista pracowników w systemie (dopasuj do najbliższej z tej listy, jeśli to możliwe, zwracając ją DOKŁADNIE tak jak tu zapisana):
${employeeNames.map((n) => `- ${n}`).join('\n')}

Znana lista materiałów w systemie (dopasuj do najbliższej z tej listy, jeśli to możliwe, zwracając ją DOKŁADNIE tak jak tu zapisana):
${materialNames.map((n) => `- ${n}`).join('\n')}

Zwróć WYŁĄCZNIE listę niepustych komórek, w których wpisano ilość większą od zera. Jeśli nie masz pewności co do dopasowania nazwiska lub materiału do powyższych list, zwróć odczytany tekst dokładnie tak jak widnieje na zdjęciu - nie zgaduj na siłę.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }, { inlineData: { mimeType, data: base64Data } }],
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            employeeName: { type: Type.STRING, description: 'Odczytane nazwisko pracownika' },
            materialName: { type: Type.STRING, description: 'Odczytana nazwa materiału' },
            quantity: { type: Type.NUMBER, description: 'Odczytana ilość (liczba całkowita > 0)' },
          },
          required: ['employeeName', 'materialName', 'quantity'],
        },
      },
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error('Model nie zwrócił żadnej odpowiedzi. Spróbuj z wyraźniejszym zdjęciem.');
  }

  let parsed: any[];
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Nie udało się przetworzyć odpowiedzi modelu. Spróbuj ponownie.');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Nieoczekiwany format odpowiedzi modelu.');
  }

  return parsed
    .filter((r) => r && typeof r.employeeName === 'string' && typeof r.materialName === 'string')
    .map((r) => ({
      employeeRaw: String(r.employeeName).trim(),
      materialRaw: String(r.materialName).trim(),
      quantity: Math.max(0, Math.round(Number(r.quantity) || 0)),
    }))
    .filter((r) => r.quantity > 0);
}

// --- Dopasowywanie odczytanych nazw do istniejących rekordów w bazie ---

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // usuń diakrytyki do porównań
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

/**
 * Próbuje dopasować odczytany tekst do jednego z kandydatów po nazwie.
 * Zwraca id najlepszego kandydata, albo null jeśli żadne dopasowanie
 * nie jest wystarczająco pewne (wtedy użytkownik musi wybrać ręcznie).
 */
export function matchByName<T extends { id: string; name: string }>(
  raw: string,
  candidates: T[]
): { id: string; confidence: 'exact' | 'fuzzy' } | null {
  const normRaw = normalize(raw);
  if (!normRaw) return null;

  // Dopasowanie dokładne (po normalizacji)
  const exact = candidates.find((c) => normalize(c.name) === normRaw);
  if (exact) return { id: exact.id, confidence: 'exact' };

  // Dopasowanie przez zawieranie się tekstu
  const contains = candidates.find(
    (c) => normalize(c.name).includes(normRaw) || normRaw.includes(normalize(c.name))
  );
  if (contains) return { id: contains.id, confidence: 'fuzzy' };

  // Dopasowanie przez odległość Levenshteina (tolerancja proporcjonalna do długości)
  let best: { id: string; distance: number } | null = null;
  for (const c of candidates) {
    const normC = normalize(c.name);
    const distance = levenshtein(normRaw, normC);
    if (!best || distance < best.distance) {
      best = { id: c.id, distance };
    }
  }
  if (best) {
    const threshold = Math.max(2, Math.floor(normRaw.length * 0.3));
    if (best.distance <= threshold) {
      return { id: best.id, confidence: 'fuzzy' };
    }
  }

  return null;
}
