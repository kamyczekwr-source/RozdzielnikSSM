import React, { useState, useRef } from 'react';
import { Camera, Upload, Loader2, X, Check, AlertTriangle, Trash2, ImageIcon } from 'lucide-react';
import { Employee, Material } from '../types';
import { extractRozdzielnikFromImage, matchByName, ExtractedEntry } from '../geminiImport';

interface ReviewRow {
  localId: string;
  employeeRaw: string;
  materialRaw: string;
  employeeId: string;
  materialId: string;
  quantity: number;
  confidence: 'exact' | 'fuzzy' | 'none';
}

interface PhotoImportModalProps {
  employees: Employee[];
  materials: Material[];
  existingDistributions: Record<string, Record<string, number>>;
  onApply: (rows: { employeeId: string; materialId: string; quantity: number }[]) => void;
  onClose: () => void;
}

type Step = 'select' | 'analyzing' | 'review' | 'error';

function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, data] = result.split(',');
      const mimeType = header.match(/data:(.*);base64/)?.[1] || file.type || 'image/jpeg';
      resolve({ data, mimeType });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function PhotoImportModal({
  employees,
  materials,
  existingDistributions,
  onApply,
  onClose
}: PhotoImportModalProps) {
  const [step, setStep] = useState<Step>('select');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewRow[]>([]);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;
    setStep('analyzing');
    setErrorMsg('');

    try {
      const { data, mimeType } = await fileToBase64(selectedFile);
      const extracted: ExtractedEntry[] = await extractRozdzielnikFromImage(
        data,
        mimeType,
        employees.map((e) => e.name),
        materials.map((m) => m.name)
      );

      if (extracted.length === 0) {
        setErrorMsg('Nie znaleziono żadnych wypełnionych komórek na zdjęciu. Spróbuj z wyraźniejszym, lepiej oświetlonym zdjęciem.');
        setStep('error');
        return;
      }

      const reviewRows: ReviewRow[] = extracted.map((entry, i) => {
        const empMatch = matchByName(entry.employeeRaw, employees);
        const matMatch = matchByName(entry.materialRaw, materials);
        let confidence: 'exact' | 'fuzzy' | 'none' = 'exact';
        if (!empMatch || !matMatch) confidence = 'none';
        else if (empMatch.confidence === 'fuzzy' || matMatch.confidence === 'fuzzy') confidence = 'fuzzy';

        return {
          localId: `row_${i}_${Date.now()}`,
          employeeRaw: entry.employeeRaw,
          materialRaw: entry.materialRaw,
          employeeId: empMatch?.id || '',
          materialId: matMatch?.id || '',
          quantity: entry.quantity,
          confidence
        };
      });

      setRows(reviewRows);
      setStep('review');
    } catch (e: any) {
      setErrorMsg(e?.message || 'Wystąpił nieznany błąd podczas odczytu zdjęcia.');
      setStep('error');
    }
  };

  const updateRow = (localId: string, patch: Partial<ReviewRow>) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.localId !== localId) return r;
        const updated = { ...r, ...patch };
        updated.confidence = updated.employeeId && updated.materialId ? 'exact' : 'none';
        return updated;
      })
    );
  };

  const removeRow = (localId: string) => {
    setRows((prev) => prev.filter((r) => r.localId !== localId));
  };

  const validRowsCount = rows.filter((r) => r.employeeId && r.materialId && r.quantity > 0).length;
  const unmatchedCount = rows.filter((r) => !r.employeeId || !r.materialId).length;

  const handleApply = () => {
    const toApply = rows
      .filter((r) => r.employeeId && r.materialId && r.quantity > 0)
      .map((r) => ({ employeeId: r.employeeId, materialId: r.materialId, quantity: r.quantity }));
    onApply(toApply);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-gray-100 overflow-hidden max-h-[90vh] flex flex-col">
        <div className="p-5 border-b border-gray-100 bg-indigo-50 flex items-center justify-between shrink-0">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Camera className="w-5 h-5 text-indigo-600" />
            Import rozdzielnika ze zdjęcia
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto flex-1">
          {/* STEP: SELECT IMAGE */}
          {step === 'select' && (
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Zrób zdjęcie wypełnionego papierowego rozdzielnika (albo wybierz z galerii). Po odczytaniu
                będziesz mógł sprawdzić i poprawić wartości, zanim trafią do systemu - nic nie zapisuje się automatycznie.
              </p>

              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="Podgląd" className="w-full max-h-80 object-contain rounded-lg border border-gray-200 bg-slate-50" />
                  <button
                    onClick={() => { setSelectedFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-white/90 hover:bg-white text-slate-700 rounded-full p-1.5 shadow-sm cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-indigo-200 rounded-xl p-10 flex flex-col items-center gap-3 text-indigo-500 hover:bg-indigo-50/50 transition-colors cursor-pointer"
                >
                  <ImageIcon className="w-10 h-10" />
                  <span className="text-sm font-semibold">Kliknij, aby zrobić zdjęcie lub wybrać plik</span>
                </button>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelected(file);
                }}
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer">
                  Anuluj
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={!selectedFile}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Analizuj zdjęcie
                </button>
              </div>
            </div>
          )}

          {/* STEP: ANALYZING */}
          {step === 'analyzing' && (
            <div className="p-12 flex flex-col items-center gap-4 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
              <p className="text-sm font-semibold">Odczytuję zdjęcie... To może potrwać kilkanaście sekund.</p>
            </div>
          )}

          {/* STEP: ERROR */}
          {step === 'error' && (
            <div className="p-6 space-y-4">
              <div className="bg-rose-50 border border-rose-100 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <p className="text-sm text-rose-700">{errorMsg}</p>
              </div>
              <div className="flex items-center justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 border border-gray-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer">
                  Zamknij
                </button>
                <button onClick={() => setStep('select')} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold cursor-pointer">
                  Spróbuj ponownie
                </button>
              </div>
            </div>
          )}

          {/* STEP: REVIEW */}
          {step === 'review' && (
            <div className="p-5 space-y-4">
              <div className={`rounded-lg p-3 text-xs flex items-start gap-2 ${unmatchedCount > 0 ? 'bg-amber-50 border border-amber-100 text-amber-800' : 'bg-emerald-50 border border-emerald-100 text-emerald-800'}`}>
                {unmatchedCount > 0 ? <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" /> : <Check className="w-4 h-4 shrink-0 mt-0.5" />}
                <span>
                  Odczytano {rows.length} {rows.length === 1 ? 'pozycję' : 'pozycji'}.
                  {unmatchedCount > 0 && ` ${unmatchedCount} wymaga ręcznego dopasowania (podświetlone na czerwono) - wybierz pracownika i materiał z listy.`}
                  {' '}Sprawdź wartości przed zatwierdzeniem.
                </span>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {rows.map((row) => {
                  const hasIssue = !row.employeeId || !row.materialId;
                  const existingVal = row.employeeId && row.materialId ? existingDistributions[row.employeeId]?.[row.materialId] : undefined;

                  return (
                    <div
                      key={row.localId}
                      className={`rounded-lg border p-3 grid grid-cols-1 sm:grid-cols-[1fr_1fr_70px_auto] gap-2 items-center ${
                        hasIssue ? 'border-rose-200 bg-rose-50/40' : 'border-gray-100 bg-slate-50/50'
                      }`}
                    >
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          Pracownik {row.employeeId ? '' : `(odczytano: "${row.employeeRaw}")`}
                        </label>
                        <select
                          value={row.employeeId}
                          onChange={(e) => updateRow(row.localId, { employeeId: e.target.value })}
                          className={`w-full text-xs rounded-lg border px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!row.employeeId ? 'border-rose-300' : 'border-gray-200'}`}
                        >
                          <option value="">-- wybierz --</option>
                          {employees.map((e) => (
                            <option key={e.id} value={e.id}>{e.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">
                          Materiał {row.materialId ? '' : `(odczytano: "${row.materialRaw}")`}
                        </label>
                        <select
                          value={row.materialId}
                          onChange={(e) => updateRow(row.localId, { materialId: e.target.value })}
                          className={`w-full text-xs rounded-lg border px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 ${!row.materialId ? 'border-rose-300' : 'border-gray-200'}`}
                        >
                          <option value="">-- wybierz --</option>
                          {materials.map((m) => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase block mb-0.5">Ilość</label>
                        <input
                          type="number"
                          min="0"
                          value={row.quantity}
                          onChange={(e) => updateRow(row.localId, { quantity: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                          className="w-full text-xs text-center font-bold rounded-lg border border-gray-200 px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        {existingVal !== undefined && existingVal !== row.quantity && (
                          <p className="text-[9px] text-amber-600 mt-0.5">nadpisze: {existingVal}</p>
                        )}
                      </div>

                      <button
                        onClick={() => removeRow(row.localId)}
                        title="Usuń tę pozycję z importu"
                        className="text-slate-400 hover:text-rose-600 p-1.5 cursor-pointer justify-self-end sm:justify-self-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <button onClick={() => setStep('select')} className="px-4 py-2 border border-gray-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer">
                  Wróć
                </button>
                <button
                  onClick={handleApply}
                  disabled={validRowsCount === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg text-sm font-bold shadow-sm transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  Zastosuj {validRowsCount} {validRowsCount === 1 ? 'pozycję' : 'pozycji'} do rozdzielnika
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
