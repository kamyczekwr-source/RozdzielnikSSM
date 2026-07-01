import React, { useState, useMemo } from 'react';
import { Employee, Material, RozdzielnikPeriod } from '../types';
import { 
  Lock, 
  Unlock, 
  Printer, 
  FileSpreadsheet, 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  Save, 
  PlusCircle, 
  Info,
  CheckCircle2,
  HelpCircle
} from 'lucide-react';

interface RozdzielnikGridProps {
  employees: Employee[];
  materials: Material[];
  periods: RozdzielnikPeriod[];
  updateDistribution: (periodId: string, employeeId: string, materialId: string, value: number) => void;
  createPeriod: (year: number, month: number, docNo: string) => void;
  updatePeriodDocumentNo: (periodId: string, docNo: string) => void;
  commitPeriod: (periodId: string) => void;
  uncommitPeriod: (periodId: string) => void;
  onPrint: (periodId: string) => void;
  addMaterial: (name: string, unit: string, initialStock: number) => void;
}

const MONTHS_PL = [
  'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
  'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
];

export function RozdzielnikGrid({
  employees,
  materials,
  periods,
  updateDistribution,
  createPeriod,
  updatePeriodDocumentNo,
  commitPeriod,
  uncommitPeriod,
  onPrint,
  addMaterial
}: RozdzielnikGridProps) {
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(() => {
    return periods.length > 0 ? periods[0].id : '';
  });

  // Modal State for creating a new period
  const [showNewPeriodModal, setShowNewPeriodModal] = useState(false);
  const [newYear, setNewYear] = useState<number>(2026);
  const [newMonth, setNewMonth] = useState<number>(3);
  const [newDocNo, setNewDocNo] = useState('');

  // Modal State for creating a new material
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('szt.');
  const [newMatBO, setNewMatBO] = useState<number>(0);

  // Filtering states
  const [materialSearch, setMaterialSearch] = useState('');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [showOnlyUsed, setShowOnlyUsed] = useState(false);

  // Active period details
  const activePeriod = useMemo(() => {
    return periods.find(p => p.id === selectedPeriodId);
  }, [periods, selectedPeriodId]);

  // Handle document no update
  const handleDocNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (activePeriod) {
      updatePeriodDocumentNo(activePeriod.id, e.target.value);
    }
  };

  // Pre-calculate sums for the grid
  const employeeTotals = useMemo(() => {
    if (!activePeriod) return {};
    const totals: Record<string, number> = {};
    employees.forEach(emp => {
      let sum = 0;
      materials.forEach(mat => {
        const qty = activePeriod.distributions[emp.id]?.[mat.id] || 0;
        sum += qty;
      });
      totals[emp.id] = sum;
    });
    return totals;
  }, [activePeriod, employees, materials]);

  const materialTotals = useMemo(() => {
    if (!activePeriod) return {};
    const totals: Record<string, number> = {};
    materials.forEach(mat => {
      let sum = 0;
      employees.forEach(emp => {
        const qty = activePeriod.distributions[emp.id]?.[mat.id] || 0;
        sum += qty;
      });
      totals[mat.id] = sum;
    });
    return totals;
  }, [activePeriod, employees, materials]);

  // Filter materials based on search & "show only used"
  const filteredMaterials = useMemo(() => {
    return materials.filter(mat => {
      const matchesSearch = mat.name.toLowerCase().includes(materialSearch.toLowerCase());
      if (!matchesSearch) return false;

      if (showOnlyUsed && activePeriod) {
        const totalAllocated = materialTotals[mat.id] || 0;
        return totalAllocated > 0;
      }

      return true;
    });
  }, [materials, materialSearch, showOnlyUsed, materialTotals, activePeriod]);

  // Filter employees
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(employeeSearch.toLowerCase())
    );
  }, [employees, employeeSearch]);

  const handleCellChange = (employeeId: string, materialId: string, valueStr: string) => {
    if (!activePeriod || activePeriod.isCommitted) return;
    const value = parseInt(valueStr, 10);
    // Support clearing cell by backspace or entering invalid values as 0
    const qty = isNaN(value) || value < 0 ? 0 : value;
    updateDistribution(activePeriod.id, employeeId, materialId, qty);
  };

  const handleCreatePeriodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const periodId = `${newYear}-${String(newMonth).padStart(2, '0')}`;
    
    if (periods.some(p => p.id === periodId)) {
      alert('Taki okres już istnieje!');
      return;
    }

    createPeriod(newYear, newMonth, newDocNo || `Rozdzielnik/${newMonth}/${newYear}`);
    setSelectedPeriodId(periodId);
    setShowNewPeriodModal(false);
    setNewDocNo('');
  };

  const handleCreateMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    addMaterial(newMatName, newMatUnit, newMatBO || 0);
    setNewMatName('');
    setNewMatBO(0);
    setNewMatUnit('szt.');
    setShowNewMaterialModal(false);
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (!activePeriod) return;

    // Prepare header row: Employee Name, sum, and then all materials
    const header = [
      'Nazwisko pracownika',
      'Suma pobranych pozycji',
      ...filteredMaterials.map(m => `"${m.name} [${m.unit}]"`)
    ];

    const rows = filteredEmployees.map(emp => {
      const empDist = activePeriod.distributions[emp.id] || {};
      const rowData = [
        `"${emp.name}"`,
        employeeTotals[emp.id] || 0,
        ...filteredMaterials.map(m => empDist[m.id] || '')
      ];
      return rowData.join(';');
    });

    // Add summary row
    const summaryRow = [
      '"Suma ogółem"',
      (Object.values(employeeTotals) as number[]).reduce((a, b) => a + b, 0),
      ...filteredMaterials.map(m => materialTotals[m.id] || '')
    ];
    rows.push(summaryRow.join(';'));

    const csvContent = '\uFEFF' + [header.join(';'), ...rows].join('\n'); // Adding UTF-8 BOM
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rozdzielnik_${activePeriod.id}_${activePeriod.documentNo.replace(/[\/\\?%*:|"<>\s]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6" id="rozdzielnik-panel">
      {/* Top controls section */}
      <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Period selection */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="w-5 h-5 text-indigo-600" />
            <span className="font-semibold text-sm">Okres rozdzielnika:</span>
          </div>
          
          <select
            id="period-selector"
            value={selectedPeriodId}
            onChange={(e) => setSelectedPeriodId(e.target.value)}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="" disabled>-- Wybierz okres --</option>
            {periods.map(p => (
              <option key={p.id} value={p.id}>
                {MONTHS_PL[p.month - 1]} {p.year} {p.isCommitted ? '🔒' : ''}
              </option>
            ))}
          </select>

          <button
            id="btn-add-period"
            onClick={() => setShowNewPeriodModal(true)}
            className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            Utwórz nowy okres
          </button>
        </div>

        {/* Action controls */}
        {activePeriod && (
          <div className="flex flex-wrap items-center gap-2">
            {activePeriod.isCommitted ? (
              <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg border border-emerald-100 text-xs font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Okres zatwierdzony i rozliczony w kartotekach
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-amber-50 text-amber-800 px-3 py-1.5 rounded-lg border border-amber-100 text-xs font-medium">
                <Info className="w-4 h-4 text-amber-600" />
                Wpisujesz dane w trybie szkicu. Niezatwierdzone.
              </div>
            )}

            <button
              id="btn-print-rozdzielnik"
              onClick={() => onPrint(activePeriod.id)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Drukuj czysty lub wypełniony formularz rozdzielnika"
            >
              <Printer className="w-4 h-4" />
              Drukuj
            </button>

            <button
              id="btn-csv-export"
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
              title="Eksportuj rozdzielnik do pliku CSV (Excel)"
            >
              <FileSpreadsheet className="w-4 h-4" />
              CSV
            </button>

            {activePeriod.isCommitted ? (
              <button
                id="btn-uncommit"
                onClick={() => {
                  if (confirm('Czy na pewno chcesz anulować zatwierdzenie? Wydatki z tego okresu zostaną cofnięte z kartotek magazynowych!')) {
                    uncommitPeriod(activePeriod.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-100 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                Odblokuj edycję
              </button>
            ) : (
              <button
                id="btn-commit"
                onClick={() => {
                  if (confirm(`Czy na pewno chcesz zatwierdzić i rozliczyć rozdzielnik za ${MONTHS_PL[activePeriod.month - 1]} ${activePeriod.year}?\n\nSpowoduje to odjęcie tych materiałów ze stanu magazynowego i automatyczne utworzenie wpisów rozchodu w kartotekach.`)) {
                    commitPeriod(activePeriod.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm hover:shadow transition-all cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                Rozlicz i zatwierdź
              </button>
            )}
          </div>
        )}
      </div>

      {activePeriod ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          {/* Document configuration panel */}
          <div className="p-5 border-b border-gray-100 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-500" />
                <label htmlFor="input-doc-no" className="text-sm font-semibold text-slate-700">Nazwa/Nr dokumentu (np. MG):</label>
              </div>
              <input
                id="input-doc-no"
                type="text"
                value={activePeriod.documentNo}
                onChange={handleDocNoChange}
                disabled={activePeriod.isCommitted}
                placeholder="1258/MG/2026"
                className="rounded-lg border border-gray-200 px-3 py-1 text-sm bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-75 disabled:bg-gray-100 font-mono w-full sm:w-64"
              />
            </div>
            
            <div className="text-xs text-slate-500 italic shrink-0">
              * Automatycznie aktualizuje powiązany dokument rozchodu w kartotece.
            </div>
          </div>

          {/* Quick Filters */}
          <div className="p-4 border-b border-gray-100 bg-white grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  id="filter-materials"
                  type="text"
                  placeholder="Filtruj materiały po nazwie..."
                  value={materialSearch}
                  onChange={(e) => setMaterialSearch(e.target.value)}
                  className="w-full text-xs rounded-lg pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button
                type="button"
                onClick={() => setShowNewMaterialModal(true)}
                className="px-2.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
                title="Dodaj nowy materiał do bazy danych"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Nowy</span>
              </button>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="filter-employees"
                type="text"
                placeholder="Filtruj pracowników po nazwisku..."
                value={employeeSearch}
                onChange={(e) => setEmployeeSearch(e.target.value)}
                className="w-full text-xs rounded-lg pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="checkbox-used-only"
                type="checkbox"
                checked={showOnlyUsed}
                onChange={(e) => setShowOnlyUsed(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="checkbox-used-only" className="text-xs font-medium text-slate-700 flex items-center gap-1 cursor-pointer">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                Pokaż tylko rozdane materiały (ukryj puste kolumny)
              </label>
            </div>
          </div>

          {/* Interactive Grid Table */}
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] border-b border-gray-100">
            <table className="text-left border-collapse table-fixed select-none" style={{ width: 'max-content', minWidth: '100%' }}>
              <thead className="bg-slate-50 text-slate-700 text-xs uppercase sticky top-0 z-20">
                <tr className="border-b border-gray-200 shadow-sm">
                  {/* Pinned Employee Name Column */}
                  <th 
                    className="sticky left-0 bg-slate-50 z-30 px-4 py-3 border-r border-gray-200 font-bold"
                    style={{ width: '200px', minWidth: '200px' }}
                  >
                    Nazwisko pracownika
                  </th>
                  <th 
                    className="px-3 py-3 border-r border-gray-200 text-center font-bold text-indigo-800 bg-indigo-50/50"
                    style={{ width: '70px', minWidth: '70px' }}
                  >
                    Suma
                  </th>
                  {filteredMaterials.map(mat => (
                    <th 
                      key={mat.id} 
                      className="px-0.5 py-2 border-r border-gray-200 text-center font-bold vertical-text-header align-bottom"
                      style={{ width: '42px', minWidth: '42px' }}
                      title={`${mat.name} (${mat.unit}) - Stan w magazynie: ${mat.currentStock}`}
                    >
                      <div className="writing-mode-vertical leading-none tracking-tight py-1 font-semibold text-[10px] break-all max-h-[110px] overflow-hidden text-ellipsis text-slate-700">
                        {mat.name}
                      </div>
                      <div className="text-[8px] font-normal text-slate-400 font-mono mt-1 select-none">
                        ({mat.unit})
                      </div>
                      <div className="text-[8px] font-bold text-indigo-600 mt-0.5" title="Stan magazynu">
                        {mat.currentStock}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-xs">
                {filteredEmployees.length === 0 ? (
                  <tr>
                    <td colSpan={filteredMaterials.length + 2} className="px-6 py-12 text-center text-gray-500">
                      Brak pracowników pasujących do filtrów. Dodaj pracowników w zakładce "Zarządzanie".
                    </td>
                  </tr>
                ) : (
                  filteredEmployees.map(emp => {
                    const empDist = activePeriod.distributions[emp.id] || {};
                    const totalItems = employeeTotals[emp.id] || 0;

                    return (
                      <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors group">
                        {/* Pinned Employee Name Cell */}
                        <td 
                          className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 px-4 py-2.5 font-semibold text-slate-900 border-r border-gray-200 flex items-center justify-between"
                          style={{ width: '200px', minWidth: '200px' }}
                        >
                          <span className="truncate">{emp.name}</span>
                        </td>
                        
                        {/* Sum Column */}
                        <td 
                          className="px-3 py-2.5 border-r border-gray-200 text-center font-bold text-indigo-900 bg-indigo-50/20 text-sm"
                          style={{ width: '70px', minWidth: '70px' }}
                        >
                          {totalItems > 0 ? totalItems : <span className="text-gray-300">-</span>}
                        </td>

                        {/* Interactive distribution cells */}
                        {filteredMaterials.map(mat => {
                          const val = empDist[mat.id] || '';

                          return (
                            <td 
                              key={mat.id} 
                              className={`p-0.5 border-r border-gray-200 text-center ${val ? 'bg-amber-50/10' : ''}`}
                              style={{ width: '42px', minWidth: '42px' }}
                            >
                              <input
                                id={`cell-${emp.id}-${mat.id}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                value={val}
                                onChange={(e) => handleCellChange(emp.id, mat.id, e.target.value)}
                                disabled={activePeriod.isCommitted}
                                className={`w-full text-center py-1 px-0.5 rounded border-transparent border font-medium text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 focus:bg-white text-xs ${
                                  activePeriod.isCommitted 
                                    ? 'bg-transparent cursor-not-allowed select-none' 
                                    : 'hover:border-gray-200 cursor-text'
                                }`}
                                placeholder="-"
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}

                {/* Bottom Total Summary Row */}
                {filteredEmployees.length > 0 && (
                  <tr className="bg-slate-100 font-bold text-slate-800 sticky bottom-0 z-20 shadow-[0_-2px_4px_rgba(0,0,0,0.05)]">
                    <td 
                      className="sticky left-0 bg-slate-100 z-10 px-4 py-3 border-r border-gray-200 font-bold"
                      style={{ width: '200px', minWidth: '200px' }}
                    >
                      SUMA OGÓŁEM
                    </td>
                    <td 
                      className="px-3 py-3 border-r border-gray-200 text-center text-sm font-black text-indigo-950 bg-indigo-100/50"
                      style={{ width: '70px', minWidth: '70px' }}
                    >
                      {(Object.values(employeeTotals) as number[]).reduce((a, b) => a + b, 0)}
                    </td>
                    {filteredMaterials.map(mat => {
                      const totalAllocated = materialTotals[mat.id] || 0;
                      return (
                        <td 
                          key={mat.id} 
                          className="px-1 py-3 border-r border-gray-200 text-center text-xs font-bold"
                          style={{ width: '42px', minWidth: '42px' }}
                        >
                          {totalAllocated > 0 ? totalAllocated : <span className="text-slate-400 font-normal">-</span>}
                        </td>
                      );
                    })}
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Guidelines / Tips Footer */}
          <div className="p-4 bg-slate-50 border-t border-gray-100 text-xs text-slate-500 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>Możesz nawigować po tabeli za pomocą klawisza <b>Tab</b>. Puste komórki oznaczają brak pobrania materiału.</span>
            </div>
            <div>
              Zarejestrowano pracowników: <span className="font-bold text-slate-700">{employees.length}</span> | Materiałów w bazie: <span className="font-bold text-slate-700">{materials.length}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 mb-2">Brak utworzonych okresów</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
            Aby rozpocząć prowadzenie rozdzielnika cyfrowego, musisz najpierw utworzyć okres (miesiąc), w którym będziesz wydawać materiały.
          </p>
          <button
            id="btn-create-first-period"
            onClick={() => setShowNewPeriodModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-lg transition-colors cursor-pointer"
          >
            <PlusCircle className="w-5 h-5" />
            Utwórz pierwszy okres
          </button>
        </div>
      )}

      {/* New Period Modal */}
      {showNewPeriodModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-indigo-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Utwórz nowy okres rozliczeniowy
              </h3>
            </div>
            
            <form onSubmit={handleCreatePeriodSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-year" className="text-xs font-semibold text-slate-700">Rok:</label>
                  <select
                    id="modal-year"
                    value={newYear}
                    onChange={(e) => setNewYear(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                    <option value={2027}>2027</option>
                    <option value={2028}>2028</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-month" className="text-xs font-semibold text-slate-700">Miesiąc:</label>
                  <select
                    id="modal-month"
                    value={newMonth}
                    onChange={(e) => setNewMonth(parseInt(e.target.value, 10))}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {MONTHS_PL.map((name, i) => (
                      <option key={i} value={i + 1}>{name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="modal-doc-no" className="text-xs font-semibold text-slate-700">Numer dokumentu rozchodu (opcjonalnie):</label>
                <input
                  id="modal-doc-no"
                  type="text"
                  placeholder="np. 1258/MG/2026"
                  value={newDocNo}
                  onChange={(e) => setNewDocNo(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <p className="text-[10px] text-slate-400">Pojawi się jako identyfikator rozchodu w kartotece materiałowej po zatwierdzeniu.</p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  id="modal-btn-cancel"
                  onClick={() => setShowNewPeriodModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  id="modal-btn-submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Utwórz okres
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Material Modal */}
      {showNewMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden">
            <div className="p-5 border-b border-gray-100 bg-indigo-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-indigo-600" />
                Dodaj nowy materiał do bazy
              </h3>
            </div>
            
            <form onSubmit={handleCreateMaterialSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label htmlFor="modal-mat-name" className="text-xs font-semibold text-slate-700">Nazwa materiału:</label>
                <input
                  id="modal-mat-name"
                  type="text"
                  required
                  placeholder="np. Domestos 5l., Ręcznik papierowy"
                  value={newMatName}
                  onChange={(e) => setNewMatName(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="modal-mat-unit" className="text-xs font-semibold text-slate-700">Jednostka miary:</label>
                  <select
                    id="modal-mat-unit"
                    value={newMatUnit}
                    onChange={(e) => setNewMatUnit(e.target.value)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-800"
                  >
                    <option value="szt.">szt. (sztuka)</option>
                    <option value="op.">op. (opakowanie)</option>
                    <option value="l.">l. (litr)</option>
                    <option value="kg">kg (kilogram)</option>
                    <option value="rolka">rolka</option>
                    <option value="paczka">paczka</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="modal-mat-bo" className="text-xs font-semibold text-slate-700">Stan BO (otwarcia):</label>
                  <input
                    id="modal-mat-bo"
                    type="number"
                    min="0"
                    placeholder="np. 15"
                    value={newMatBO || ''}
                    onChange={(e) => setNewMatBO(parseInt(e.target.value, 10) || 0)}
                    className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-800"
                  />
                </div>
              </div>

              <div className="bg-amber-50 text-[11px] text-amber-800 p-3 rounded-lg border border-amber-100/50 leading-relaxed">
                * Po dodaniu materiału, w jego nowej karcie magazynowej zostanie automatycznie wygenerowany wpis "BO" z podanym stanem początkowym. Materiał pojawi się również jako nowa kolumna w rozdzielnikach.
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-gray-100">
                <button
                  type="button"
                  id="modal-mat-btn-cancel"
                  onClick={() => {
                    setShowNewMaterialModal(false);
                    setNewMatName('');
                    setNewMatBO(0);
                  }}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-slate-700 text-sm hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  id="modal-mat-btn-submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  Utwórz kartę materiału
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Style injector for vertical rotated headers */}
      <style>{`
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
