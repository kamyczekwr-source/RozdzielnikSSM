import React, { useState, useMemo } from 'react';
import { Employee, Material, RozdzielnikPeriod } from '../types';
import { Printer, ArrowLeft, Eye, EyeOff, Layout, FileText } from 'lucide-react';

interface PrintRozdzielnikProps {
  periodId: string;
  employees: Employee[];
  materials: Material[];
  periods: RozdzielnikPeriod[];
  onBack: () => void;
}

const MONTHS_PL_GENITIVE = [
  'STYCZEŃ', 'LUTY', 'MARZEC', 'KWIECIEŃ', 'MAJ', 'CZERWIEC',
  'LIPIEC', 'SIERPIEŃ', 'WRZESIEŃ', 'PAŹDZIERNIK', 'LISTOPAD', 'GRUDZIEŃ'
];

export function PrintRozdzielnik({
  periodId,
  employees,
  materials,
  periods,
  onBack
}: PrintRozdzielnikProps) {
  const period = useMemo(() => {
    return periods.find(p => p.id === periodId);
  }, [periods, periodId]);

  // Options
  const [printPage, setPrintPage] = useState<'page1' | 'page2' | 'all'>('page1');
  const [hideEmptyRows, setHideEmptyRows] = useState(false);
  const [hideEmptyCols, setHideEmptyCols] = useState(false);
  const [layoutType, setLayoutType] = useState<'transposed' | 'classic'>('transposed');

  // Divide materials like the physical paper
  // First 25 materials (from Domestos to Wózek do sprzątania)
  const materialsPage1 = useMemo(() => materials.slice(0, 25), [materials]);
  // Remaining materials (from Płyn do okien Karcher onwards)
  const materialsPage2 = useMemo(() => materials.slice(25), [materials]);

  const selectedMaterials = useMemo(() => {
    let list = materials;
    if (printPage === 'page1') list = materialsPage1;
    if (printPage === 'page2') list = materialsPage2;

    if (hideEmptyCols && period) {
      list = list.filter(m => {
        // Check if any employee received this
        return Object.values(period.distributions).some(empDist => (empDist[m.id] || 0) > 0);
      });
    }

    return list;
  }, [materials, materialsPage1, materialsPage2, printPage, hideEmptyCols, period]);

  const selectedEmployees = useMemo(() => {
    if (!period) return [];
    let list = employees;

    if (hideEmptyRows) {
      list = list.filter(emp => {
        const empDist = period.distributions[emp.id] || {};
        return Object.keys(empDist).some(key => (empDist[key] || 0) > 0);
      });
    }

    return list;
  }, [employees, hideEmptyRows, period]);

  // Calculations for sums
  const employeeTotals = useMemo(() => {
    if (!period) return {};
    const totals: Record<string, number> = {};
    selectedEmployees.forEach(emp => {
      let sum = 0;
      selectedMaterials.forEach(mat => {
        sum += period.distributions[emp.id]?.[mat.id] || 0;
      });
      totals[emp.id] = sum;
    });
    return totals;
  }, [period, selectedEmployees, selectedMaterials]);

  const materialTotals = useMemo(() => {
    if (!period) return {};
    const totals: Record<string, number> = {};
    selectedMaterials.forEach(mat => {
      let sum = 0;
      selectedEmployees.forEach(emp => {
        sum += period.distributions[emp.id]?.[mat.id] || 0;
      });
      totals[mat.id] = sum;
    });
    return totals;
  }, [period, selectedEmployees, selectedMaterials]);

  const handlePrintTrigger = () => {
    window.print();
  };

  if (!period) {
    return (
      <div className="bg-white p-6 rounded-xl border border-gray-150 text-center">
        <p className="text-sm text-slate-500 mb-4">Nie odnaleziono wybranego okresu.</p>
        <button onClick={onBack} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold">
          Wróć
        </button>
      </div>
    );
  }

  const formattedMonth = MONTHS_PL_GENITIVE[period.month - 1];

  return (
    <div className="space-y-6">
      
      {/* PRINT OPTIONS BAR - Hidden during physical print */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div className="space-y-1">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-indigo-600 mb-1 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Powrót do programu
          </button>
          <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600" />
            Podgląd wydruku rozdzielnika
          </h2>
          <p className="text-xs text-slate-500">Dostosuj widok przed wydrukiem. Tabela została zoptymalizowana do druku w orientacji poziomej (Landscape).</p>
        </div>

        {/* Configurations */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Layout type selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Układ tabeli:</span>
            <select
              value={layoutType}
              onChange={(e) => setLayoutType(e.target.value as 'transposed' | 'classic')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-900 border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="transposed">Pracownicy w kolumnach (Taki jak na zdjęciu)</option>
              <option value="classic">Materiały w kolumnach (Szeroki)</option>
            </select>
          </div>

          {/* Page Split selector */}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase">
              {layoutType === 'transposed' ? 'Zakres wierszy (materiałów):' : 'Zakres kolumn (materiałów):'}
            </span>
            <select
              value={printPage}
              onChange={(e) => setPrintPage(e.target.value as 'page1' | 'page2' | 'all')}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold bg-slate-50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="page1">Strona 1 (Domestos - Wózek)</option>
              <option value="page2">Strona 2 (Płyn Karcher - Ręcznik MAXI)</option>
              <option value="all">Wszystkie 49 materiałów (szeroka)</option>
            </select>
          </div>

          {/* Hide Empty elements */}
          <div className="flex flex-wrap items-center gap-4 pt-4">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideEmptyRows}
                onChange={(e) => setHideEmptyRows(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              Ukryj pustych pracowników
            </label>

            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-700 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hideEmptyCols}
                onChange={(e) => setHideEmptyCols(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              {layoutType === 'transposed' ? 'Ukryj nieużywane materiały (wiersze)' : 'Ukryj nieużywane materiały (kolumny)'}
            </label>
          </div>

          {/* Trigger Print Button */}
          <button
            onClick={handlePrintTrigger}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 cursor-pointer self-end"
          >
            <Printer className="w-4 h-4" />
            Drukuj teraz
          </button>
        </div>
      </div>

      {/* PRINT ADVISORY BOX - Hidden during print */}
      <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-xl text-xs text-indigo-800 flex items-start gap-2 print:hidden">
        <FileText className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Wskazówka dotycząca drukowania w systemie Windows:</p>
          <ul className="list-disc pl-4 space-y-1 text-indigo-700 leading-relaxed">
            <li>W oknie wydruku zmień orientację na <b>Poziomą (Landscape)</b>.</li>
            <li>Włącz opcję <b>"Marginesy: Minimalne"</b> lub <b>"Dopasuj do strony"</b>, aby cała tabela zmieściła się idealnie.</li>
            <li>Zalecamy wyłączenie opcji drukowania nagłówków i stopek przeglądarki (daty i adresu URL w marginesach).</li>
          </ul>
        </div>
      </div>

      {/* ACTUAL PRINT SHEET AREA - This mimics paper sheet */}
      <div className="bg-white p-8 rounded-xl border border-gray-150 shadow-md print:shadow-none print:border-none print:p-0 font-sans print:bg-white text-black overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header */}
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-xl font-bold tracking-widest text-black print:text-lg">
              ROZDZIELNIK ZA {formattedMonth} {period.year}
            </h1>
            <div className="text-xs font-mono text-gray-500 print:text-black">
              Dokument odniesienia: <span className="font-bold">{period.documentNo}</span>
            </div>
          </div>

          {/* Table */}
          {layoutType === 'transposed' ? (
            <table className="w-full text-[10px] border-collapse border-2 border-black text-black">
              <thead>
                <tr className="bg-gray-150/50 print:bg-transparent border-b-2 border-black">
                  <th className="border border-black px-2 py-3 text-left font-bold w-52 align-middle text-xs">
                    Nazwa materiału (j.m.)
                  </th>
                  {selectedEmployees.map(emp => (
                    <th 
                      key={emp.id} 
                      className="border border-black p-1 text-center font-bold vertical-text-header"
                      style={{ minWidth: '40px', maxWidth: '55px' }}
                    >
                      <div className="writing-mode-vertical leading-none tracking-tight py-1 font-bold text-[10px] whitespace-nowrap">
                        {emp.name}
                      </div>
                    </th>
                  ))}
                  <th className="border-l-2 border-black border-r border-t border-b p-1 text-center font-bold w-14 bg-gray-100/50 print:bg-transparent align-middle text-xs">
                    Suma
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedMaterials.map((mat) => {
                  const total = materialTotals[mat.id] || 0;

                  return (
                    <tr key={mat.id} className="border-b border-black hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="border border-black px-2 py-1.5 font-bold text-black text-xs">
                        {mat.name} <span className="text-[10px] text-gray-500 font-normal">({mat.unit})</span>
                      </td>
                      {selectedEmployees.map(emp => {
                        const val = period.distributions[emp.id]?.[mat.id];
                        return (
                          <td key={emp.id} className="border border-black p-1 text-center font-bold text-sm">
                            {val || ''}
                          </td>
                        );
                      })}
                      <td className="border-l-2 border-black border-r border-t border-b p-1 text-center font-black text-xs bg-gray-50 print:bg-transparent">
                        {total > 0 ? total : ''}
                      </td>
                    </tr>
                  );
                })}

                {/* Summary Row */}
                <tr className="border-t-2 border-black bg-gray-100 font-bold print:bg-transparent">
                  <td className="border border-black px-2 py-2.5 font-bold text-xs uppercase bg-gray-150">
                    Razem pobranych pozycji
                  </td>
                  {selectedEmployees.map(emp => {
                    const total = employeeTotals[emp.id] || 0;
                    return (
                      <td key={emp.id} className="border border-black p-1 text-center font-extrabold text-xs">
                        {total > 0 ? total : ''}
                      </td>
                    );
                  })}
                  <td className="border-l-2 border-black border-r border-t border-b p-1 text-center font-black text-xs bg-gray-200 print:bg-transparent">
                    {(Object.values(employeeTotals) as number[]).reduce((a, b) => a + b, 0)}
                  </td>
                </tr>

                {/* Signatures Row */}
                <tr className="border-t border-black bg-white font-normal print:bg-transparent h-16">
                  <td className="border border-black px-2 py-2 font-bold text-xs italic text-slate-700 align-middle">
                    Podpis pracownika
                  </td>
                  {selectedEmployees.map(emp => (
                    <td key={emp.id} className="border border-black p-1 text-center text-[8px] italic text-gray-300 align-bottom pb-1">
                      {/* Signature line space */}
                    </td>
                  ))}
                  <td className="border-l-2 border-black border-r border-t border-b bg-gray-100 print:bg-transparent"></td>
                </tr>
              </tbody>
            </table>
          ) : (
            <table className="w-full text-[10px] border-collapse border-2 border-black text-black">
              <thead>
                <tr className="bg-gray-150/50 print:bg-transparent border-b-2 border-black">
                  <th className="border border-black px-2 py-3 text-left font-bold w-48 align-middle">
                    Nazwisko pracownika
                  </th>
                  {selectedMaterials.map(mat => (
                    <th 
                      key={mat.id} 
                      className="border border-black p-1 text-center font-bold vertical-text-header"
                      style={{ minWidth: '28px', maxWidth: '35px' }}
                    >
                      <div className="writing-mode-vertical leading-none tracking-tight py-1 font-semibold text-[9px] break-all max-h-32 overflow-hidden text-ellipsis">
                        {mat.name}
                      </div>
                      <div className="text-[8px] font-normal text-gray-600 mt-1">
                        {mat.unit}
                      </div>
                    </th>
                  ))}
                  <th className="border-l-2 border-black border-r border-t border-b p-1 text-center font-bold w-14 bg-gray-100/50 print:bg-transparent align-middle">
                    Suma
                  </th>
                  <th className="border border-black px-2 py-1 text-center font-bold w-28 align-middle">
                    Podpis pracownika
                  </th>
                </tr>
              </thead>
              <tbody>
                {selectedEmployees.map((emp) => {
                  const empDist = period.distributions[emp.id] || {};
                  const total = employeeTotals[emp.id] || 0;

                  return (
                    <tr key={emp.id} className="border-b border-black hover:bg-slate-50 print:hover:bg-transparent">
                      <td className="border border-black px-2 py-2 font-bold text-black text-xs">
                        {emp.name}
                      </td>
                      {selectedMaterials.map(mat => {
                        const val = empDist[mat.id];
                        return (
                          <td key={mat.id} className="border border-black p-1 text-center font-bold text-sm">
                            {val || ''}
                          </td>
                        );
                      })}
                      <td className="border-l-2 border-black border-r border-t border-b p-1 text-center font-black text-xs bg-gray-50 print:bg-transparent">
                        {total > 0 ? total : ''}
                      </td>
                      <td className="border border-black p-2 text-center text-gray-300 italic text-[9px]">
                        {/* For signature on physical paper */}
                      </td>
                    </tr>
                  );
                })}

                {/* Summary Bottom Row */}
                <tr className="border-t-2 border-black bg-gray-100 font-bold print:bg-transparent">
                  <td className="border border-black px-2 py-2.5 font-bold text-xs uppercase">
                    Podsumowanie / Razem
                  </td>
                  {selectedMaterials.map(mat => {
                    const total = materialTotals[mat.id] || 0;
                    return (
                      <td key={mat.id} className="border border-black p-1 text-center font-extrabold text-xs">
                        {total > 0 ? total : ''}
                      </td>
                    );
                  })}
                  <td className="border-l-2 border-black border-r border-t border-b p-1 text-center font-black text-xs bg-gray-200 print:bg-transparent">
                    {(Object.values(employeeTotals) as number[]).reduce((a, b) => a + b, 0)}
                  </td>
                  <td className="border border-black bg-gray-100 print:bg-transparent"></td>
                </tr>
              </tbody>
            </table>
          )}

          {/* Footer declaration and Signatures */}
          <div className="mt-8 space-y-8">
            <p className="text-xs text-black italic font-semibold leading-relaxed border-b border-gray-200 pb-2 text-center">
              Wymienione towary oraz ilości zostały zużyte, zamontowane lub dokompletowane w SSM Radom.
            </p>

            <div className="grid grid-cols-3 gap-8 pt-6">
              <div className="text-center space-y-10">
                <div className="border-b border-dashed border-black w-48 mx-auto h-12"></div>
                <div className="text-[10px] uppercase font-bold text-slate-800">Podpis Sporządzającego / Magazyniera</div>
              </div>

              <div className="text-center space-y-10">
                <div className="border-b border-dashed border-black w-48 mx-auto h-12"></div>
                <div className="text-[10px] uppercase font-bold text-slate-800">Zatwierdził pod względem merytorycznym</div>
              </div>

              <div className="text-center space-y-10">
                <div className="border-b border-solid border-black w-48 mx-auto h-12 flex items-end justify-center">
                  <span className="text-[8px] text-gray-400 font-mono tracking-widest pb-1 uppercase">Podpis Dyrektora</span>
                </div>
                <div className="text-[10px] uppercase font-black text-black tracking-wider">PODPIS DYREKTORA</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Vertical headers style injector for print view */}
      <style>{`
        @media print {
          body {
            background-color: white !important;
            color: black !important;
          }
          #root {
            padding: 0 !important;
            margin: 0 !important;
          }
          header, nav, #app-navbar {
            display: none !important;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
        
        /* vertical text utilities if browser supports */
        .writing-mode-vertical {
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          display: inline-block;
        }
        
        .vertical-text-header {
          height: 140px;
          vertical-align: bottom;
          padding-bottom: 8px;
        }
      `}</style>
    </div>
  );
}
