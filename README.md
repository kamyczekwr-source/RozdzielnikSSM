# Rozdzielnik — Ewidencja Materiałów

Aplikacja PWA do miesięcznego rozdzielnika i kartotek materiałowych. Dane
synchronizują się na żywo między urządzeniami przez Firebase Firestore.

## 1. Konfiguracja Firebase (raz, na start)

1. Wejdź na https://console.firebase.google.com i utwórz nowy projekt (plan
   darmowy Spark wystarczy).
2. W projekcie: **Build → Firestore Database → Create database** (tryb
   produkcyjny, region np. `eur3`).
3. W **Firestore Database → Rules** wklej zawartość pliku `firestore.rules`
   z tego repo i opublikuj.
4. W **Build → Authentication → Sign-in method** włącz dostawcę **Anonymous**.
5. W **Project settings → Twoje aplikacje** dodaj aplikację webową (ikona
   `</>`) i skopiuj wygenerowany obiekt `firebaseConfig`.
6. Skopiuj `.env.local.example` do `.env.local` i wklej tam wartości z kroku 5.

## 1b. Konfiguracja Gemini API (funkcja "Import ze zdjęcia")

Ta funkcja pozwala zrobić zdjęcie papierowego rozdzielnika i automatycznie
odczytać wpisane wartości (do zatwierdzenia przed zapisem).

1. Wejdź na https://aistudio.google.com/apikey i wygeneruj darmowy klucz API.
2. Wklej go jako `VITE_GEMINI_API_KEY` w `.env.local`.
3. **Ważne (bezpieczeństwo):** w Google Cloud Console ogranicz ten klucz do
   Twojej domeny GitHub Pages (Google AI Studio → klucz → Edit → Website
   restrictions), żeby nikt inny nie mógł go użyć, nawet jeśli go zobaczy w
   kodzie źródłowym strony (klucze frontendowe zawsze są tam widoczne).
4. Ta funkcja korzysta z darmowego limitu Gemini - przy sporadycznym użyciu
   (raz w miesiącu) nie powinieneś go przekroczyć.

## 2. Uruchomienie lokalne

**Wymagania:** Node.js 20+

```bash
npm install
npm run dev
```

Apka wystartuje pod `http://localhost:3000`.

## 3. Wdrożenie na GitHub Pages

1. Wrzuć repo na GitHub (branch `main`).
2. W ustawieniach repo: **Settings → Pages → Source → GitHub Actions**
   (workflow `.github/workflows/deploy.yml` jest już gotowy).
3. W **Settings → Secrets and variables → Actions** dodaj 6 sekretów o
   nazwach identycznych jak zmienne w `.env.local.example`
   (`VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, itd.) z tymi
   samymi wartościami co w `.env.local`. Dodaj też `VITE_GEMINI_API_KEY`,
   jeśli chcesz mieć działającą funkcję "Import ze zdjęcia".
4. Każdy `git push` na `main` automatycznie zbuduje apkę i opublikuje ją na
   GitHub Pages.

## 4. Instalacja jako aplikacja (PWA)

Po wejściu na opublikowany adres, w Chrome/Edge kliknij ikonę instalacji w
pasku adresu (lub menu → „Zainstaluj aplikację"). Na telefonie: menu
przeglądarki → „Dodaj do ekranu głównego".

## Backup danych

Zakładka **Zarządzanie i Baza** pozwala wyeksportować/zaimportować pełną
bazę jako plik `.json` — warto robić to okresowo jako dodatkowe
zabezpieczenie, niezależnie od synchronizacji z Firestore.
