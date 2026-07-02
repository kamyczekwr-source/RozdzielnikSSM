import React, { useState, useMemo } from 'react';
import { Material, HistoryEntry } from '../types';
import { 
  FileText, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  FileDown, 
  Package, 
  AlertCircle
} from 'lucide-react';

interface MaterialCardsProps {
  materials: Material[];
  history: HistoryEntry[];
  addHistoryEntry: (materialId: string, date: string, docName: string, income: number, expense: number) => void;
  deleteHistoryEntry: (entryId: string) => void;
  addMaterial: (name: string, unit: string, initialStock: number) => string;
  lowStockThreshold: number;
  initialFilterLowStock?: boolean;
  onFilterConsumed?: () => void;
}

export function MaterialCards({
  materials,
  history,
  addHistoryEntry,
  deleteHistoryEntry,
  addMaterial,
  lowStockThreshold,
  initialFilterLowStock,
  onFilterConsumed
}: MaterialCardsProps) {
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>(() => {
    return materials.length > 0 ? materials[0].id : '';
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterLowStock, setFilterLowStock] = useState(initialFilterLowStock ?? false);

  // Jeśli wejście na tę zakładkę nastąpiło przez kliknięcie kafelka "Niski stan
  // zapasów" na stronie głównej, filtr włącza się automatycznie - raz, przy
  // pierwszym renderze. Informujemy rodzica, że sygnał został zużyty, żeby
  // przy zwykłej nawigacji zakładką filtr nie włączał się sam.
  React.useEffect(() => {
    if (initialFilterLowStock) {
      onFilterConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Modal State for creating a new material
  const [showNewMaterialModal, setShowNewMaterialModal] = useState(false);
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('szt.');
  const [newMatBO, setNewMatBO] = useState<number>(0);

  const handleCreateMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    const newId = addMaterial(newMatName, newMatUnit, newMatBO || 0);
    setNewMatName('');
    setNewMatBO(0);
    setNewMatUnit('szt.');
    setShowNewMaterialModal(false);
    if (newId) {
      setSelectedMaterialId(newId);
    }
  };

  // Manual transaction form state
  const [txDate, setTxDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [txDocName, setTxDocName] = useState('');
  const [txType, setTxType] = useState<'income' | 'expense'>('income');
  const [txQty, setTxQty] = useState<number>(0);

  // Filter material list on the sidebar/dropdown
  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (filterLowStock) return m.currentStock <= lowStockThreshold;
      return true;
    });
  }, [materials, searchQuery, filterLowStock, lowStockThreshold]);

  // Selected Material
  const activeMaterial = useMemo(() => {
    return materials.find(m => m.id === selectedMaterialId) || filteredMaterials[0];
  }, [materials, selectedMaterialId, filteredMaterials]);

  // Keep selected material updated if list changes
  React.useEffect(() => {
    if (activeMaterial && activeMaterial.id !== selectedMaterialId) {
      setSelectedMaterialId(activeMaterial.id);
    }
  }, [activeMaterial, selectedMaterialId]);

  // History entries for the active material, sorted chronologically to build accurate running balances
  const materialHistory = useMemo(() => {
    if (!activeMaterial) return [];
    
    // Filter history for this material
    const filtered = history.filter(h => h.materialId === activeMaterial.id);

    // Sort: 1st by Date. If dates are equal, put 'BO' (Bilans otwarcia) first.
    // If dates and BO status are same, sort by ID or keep order.
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      
      // 'BO' documents go first on same day
      if (a.documentName === 'BO' && b.documentName !== 'BO') return -1;
      if (b.documentName === 'BO' && a.documentName !== 'BO') return 1;
      
      // Fallback
      return a.id.localeCompare(b.id);
    });
  }, [history, activeMaterial]);

  // Recalculate dynamic running balance for accurate card ledger representation
  const ledgerEntries = useMemo(() => {
    let runningBalance = 0;
    return materialHistory.map((entry, index) => {
      if (entry.documentName === 'BO') {
        // If it's the opening balance, it sets the starting point
        runningBalance = entry.income || entry.balanceAfter || activeMaterial.initialStock;
      } else {
        runningBalance = runningBalance + entry.income - entry.expense;
      }
      
      return {
        ...entry,
        lp: index + 1,
        runningBalance
      };
    });
  }, [materialHistory, activeMaterial]);

  const handleAddTxSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMaterial) return;
    if (txQty <= 0) {
      alert('Ilość musi być większa od zera!');
      return;
    }

    const income = txType === 'income' ? txQty : 0;
    const expense = txType === 'expense' ? txQty : 0;

    addHistoryEntry(activeMaterial.id, txDate, txDocName || 'Dokument wewnętrzny', income, expense);
    
    // Reset state
    setTxDocName('');
    setTxQty(0);
  };

  // Export card to text / print layout
  const handleExportCardCSV = () => {
    if (!activeMaterial) return;

    const headers = ['L.p.', 'Data', 'Nazwa dokumentu', 'Przychód', 'Rozchód', 'Stan końcowy'];
    const rows = ledgerEntries.map(e => [
      e.lp,
      e.date,
      `"${e.documentName}"`,
      e.income || '',
      e.expense || '',
      e.runningBalance
    ].join(';'));

    const csvContent = '\uFEFF' + [
      `"Karta kartoteczna materiału: ${activeMaterial.name} [Jednostka: ${activeMaterial.unit}]"`,
      `"Aktualny stan magazynowy: ${activeMaterial.currentStock}"`,
      '',
      headers.join(';'),
      ...rows
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Kartoteka_${activeMaterial.name.replace(/[\/\\?%*:|"<>\s]/g, '_')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="kartoteki-panel">
      
      {/* LEFT SIDEBAR: Material list & search */}
      <div className="lg:col-span-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col h-[700px]">
        <div className="space-y-3 mb-4">
          <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 uppercase tracking-wide">
            <Package className="w-4 h-4 text-indigo-600" />
            Wykaz materiałów
          </h3>
          
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                id="material-list-search"
                type="text"
                placeholder="Szukaj materiału..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs rounded-lg pl-9 pr-3 py-2 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowNewMaterialModal(true)}
              className="px-2.5 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-bold shrink-0 transition-colors cursor-pointer flex items-center gap-1"
              title="Dodaj nowy materiał do bazy danych"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nowy</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="checkbox-low-stock"
              type="checkbox"
              checked={filterLowStock}
              onChange={(e) => setFilterLowStock(e.target.checked)}
              className="w-3.5 h-3.5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
            />
            <label htmlFor="checkbox-low-stock" className="text-xs font-semibold text-slate-600 cursor-pointer flex items-center gap-1 select-none">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              Tylko niski stan (≤ {lowStockThreshold} szt.)
            </label>
          </div>
        </div>

        {/* Material Scrollable List */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 border border-gray-100 rounded-lg">
          {filteredMaterials.length === 0 ? (
            <div className="p-6 text-center text-xs text-gray-400">
              Brak materiałów o podanej nazwie.
            </div>
          ) : (
            filteredMaterials.map(m => {
              const isSelected = selectedMaterialId === m.id;
              const isLow = m.currentStock <= lowStockThreshold;
              
              return (
                <button
                  key={m.id}
                  id={`material-btn-${m.id}`}
                  onClick={() => setSelectedMaterialId(m.id)}
                  className={`w-full text-left p-3 flex items-center justify-between text-xs transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-indigo-600 text-white font-semibold rounded-md shadow-sm' 
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="space-y-0.5 max-w-[80%]">
                    <div className="truncate font-medium text-sm">{m.name}</div>
                    <div className={`text-[10px] ${isSelected ? 'text-indigo-200' : 'text-slate-400'}`}>
                      j.m: <span className="font-mono">{m.unit}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-0.5 rounded-full font-mono text-xs font-bold ${
                      isSelected 
                        ? 'bg-indigo-700 text-white' 
                        : isLow 
                          ? 'bg-amber-100 text-amber-800 border border-amber-200' 
                          : 'bg-slate-100 text-slate-800'
                    }`}>
                      {m.currentStock}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT WORKSPACE: Card details & transactions */}
      <div className="lg:col-span-8 space-y-6">
        
        {activeMaterial ? (
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header / Summary */}
            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-50 to-white">
              <div className="space-y-1">
                <div className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Karta ewidencji materiałowej</div>
                <h2 className="text-xl font-black text-slate-800">{activeMaterial.name}</h2>
                <p className="text-xs text-slate-500">
                  Jednostka miary: <span className="font-semibold text-slate-700">{activeMaterial.unit}</span> | Początkowy stan BO: <span className="font-mono font-bold text-slate-700">{activeMaterial.initialStock}</span>
                </p>
              </div>

              {/* Massive Stock indicator */}
              <div className="flex items-center gap-3 bg-slate-100 border border-gray-200 px-4 py-2.5 rounded-xl shrink-0">
                <Package className="w-5 h-5 text-indigo-600" />
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none">Stan magazynowy</div>
                  <div className="text-xl font-extrabold text-slate-800 leading-none mt-1">
                    {activeMaterial.currentStock} <span className="text-xs font-medium text-slate-500">{activeMaterial.unit}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick manual entry form */}
            <div className="p-5 border-b border-gray-100 bg-amber-50/10">
              <form onSubmit={handleAddTxSubmit} className="space-y-3">
                <div className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
                  <Plus className="w-4 h-4 text-amber-600" />
                  Zarejestruj nową operację magazynową (przychód / rozchód)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                  <div className="space-y-1">
                    <label htmlFor="tx-date" className="text-[10px] font-bold text-slate-500">Data operacji:</label>
                    <input
                      id="tx-date"
                      type="date"
                      value={txDate}
                      onChange={(e) => setTxDate(e.target.value)}
                      required
                      className="w-full text-xs rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-1.5">
                    <label htmlFor="tx-doc" className="text-[10px] font-bold text-slate-500">Nazwa dokumentu:</label>
                    <input
                      id="tx-doc"
                      type="text"
                      placeholder="np. FV 12/2026, PZ..."
                      value={txDocName}
                      onChange={(e) => setTxDocName(e.target.value)}
                      className="w-full text-xs rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="tx-type" className="text-[10px] font-bold text-slate-500">Typ ruchu:</label>
                    <select
                      id="tx-type"
                      value={txType}
                      onChange={(e) => setTxType(e.target.value as 'income' | 'expense')}
                      className="w-full text-xs rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-medium"
                    >
                      <option value="income">Przychód (+)</option>
                      <option value="expense">Rozchód (-)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="tx-qty" className="text-[10px] font-bold text-slate-500">Ilość ({activeMaterial.unit}):</label>
                    <input
                      id="tx-qty"
                      type="number"
                      min="1"
                      placeholder="Ilość"
                      value={txQty || ''}
                      onChange={(e) => setTxQty(parseInt(e.target.value, 10) || 0)}
                      required
                      className="w-full text-xs rounded-lg border border-gray-200 p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-white font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    id="btn-add-tx"
                    className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer shadow-xs transition-colors h-9"
                  >
                    Dodaj wpis
                  </button>
                </div>
              </form>
            </div>

            {/* LEDGER TABLE - mimics the paper card perfectly */}
            <div className="p-5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  Karta ewidencji przychodów i rozchodów (Zapisy)
                </h4>

                <button
                  id="btn-export-card"
                  onClick={handleExportCardCSV}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                  title="Eksportuj tę kartotekę do pliku CSV"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  Eksportuj kartę
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-150 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-gray-200 text-[10px]">
                    <tr>
                      <th className="px-3 py-3 text-center w-12 border-r border-gray-150">L.p.</th>
                      <th className="px-4 py-3 w-32 border-r border-gray-150">Data</th>
                      <th className="px-4 py-3 border-r border-gray-150">Nazwa dokumentu</th>
                      <th className="px-3 py-3 text-right text-emerald-800 bg-emerald-50/20 w-24 border-r border-gray-150">Przychód</th>
                      <th className="px-3 py-3 text-right text-rose-800 bg-rose-50/20 w-24 border-r border-gray-150">Rozchód</th>
                      <th className="px-4 py-3 text-right font-bold text-slate-900 w-28 bg-indigo-50/10">Stan</th>
                      <th className="px-2 py-3 text-center w-12">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-medium text-slate-700">
                    {ledgerEntries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                          Brak wpisów dla tego materiału. Zarejestruj pierwszą operację powyżej.
                        </td>
                      </tr>
                    ) : (
                      ledgerEntries.map((e) => {
                        const isBO = e.documentName === 'BO';
                        const isAutoRozchod = e.documentName.startsWith('Rozchód Rozdzielnik -');

                        return (
                          <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="px-3 py-2.5 text-center font-mono border-r border-gray-150 text-slate-400">{e.lp}</td>
                            <td className="px-4 py-2.5 font-mono text-slate-600 border-r border-gray-150">{e.date}</td>
                            <td className="px-4 py-2.5 border-r border-gray-150 font-mono text-slate-800">
                              {isAutoRozchod ? (
                                <span className="text-slate-700" title={e.documentName}>
                                  📋 {e.documentName.replace('Rozchód Rozdzielnik -', '').trim()}
                                </span>
                              ) : (
                                e.documentName
                              )}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-600 bg-emerald-50/10 border-r border-gray-150">
                              {e.income > 0 ? `+${e.income}` : '-'}
                            </td>
                            <td className="px-3 py-2.5 text-right font-mono font-bold text-rose-600 bg-rose-50/10 border-r border-gray-150">
                              {e.expense > 0 ? `-${e.expense}` : '-'}
                            </td>
                            <td className="px-4 py-2.5 text-right font-mono font-extrabold text-slate-900 bg-indigo-50/5 text-sm">
                              {e.runningBalance}
                            </td>
                            <td className="px-2 py-2.5 text-center">
                              {isBO ? (
                                <span className="text-slate-300 text-[10px] italic select-none">BO</span>
                              ) : isAutoRozchod ? (
                                <span className="text-slate-300 cursor-help" title="To jest automatyczny wpis wygenerowany z rozliczenia miesięcznego. Aby go zmienić lub usunąć, odblokuj i edytuj miesięczny rozdzielnik.">🔒</span>
                              ) : (
                                <button
                                  id={`btn-del-entry-${e.id}`}
                                  onClick={() => {
                                    if (confirm('Czy na pewno chcesz usunąć ten ręczny zapis? Spowoduje to cofnięcie aktualizacji stanu magazynowego.')) {
                                      deleteHistoryEntry(e.id);
                                    }
                                  }}
                                  className="text-rose-500 hover:text-rose-700 p-1 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                                  title="Usuń wpis"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white p-12 rounded-xl border border-gray-100 shadow-sm text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Brak materiału</h3>
            <p className="text-sm text-slate-500">Wybierz materiał z listy po lewej stronie, aby wyświetlić jego kartę magazynową.</p>
          </div>
        )}

      </div>

      {/* New Material Modal */}
      {showNewMaterialModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full border border-gray-100 overflow-hidden text-left">
            <div className="p-5 border-b border-gray-100 bg-indigo-50">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
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
                * Po dodaniu materiału, w jego nowej karcie magazynowej zostanie automatycznie wygenerowany wpis "BO" z podanym stanem początkowym. Nowy materiał zostanie automatycznie zaznaczony na liście.
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

    </div>
  );
}
