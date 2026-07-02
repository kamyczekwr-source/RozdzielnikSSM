import React, { useState, useMemo } from 'react';
import { Employee, Material } from '../types';
import { 
  Users, 
  Package2, 
  Database, 
  Trash2, 
  Edit, 
  Plus, 
  Download, 
  Upload, 
  RefreshCw, 
  Check, 
  X, 
  AlertTriangle,
  Info
} from 'lucide-react';

interface DatabaseSettingsProps {
  employees: Employee[];
  materials: Material[];
  addEmployee: (name: string) => void;
  updateEmployee: (id: string, name: string) => void;
  deleteEmployee: (id: string) => void;
  addMaterial: (name: string, unit: string, initialStock: number) => void;
  updateMaterial: (id: string, name: string, unit: string) => void;
  deleteMaterial: (id: string) => void;
  exportDatabase: () => void;
  importDatabase: (jsonContent: string) => boolean;
  resetToDemo: () => void;
  lowStockThreshold: number;
  updateLowStockThreshold: (value: number) => void;
}

export function DatabaseSettings({
  employees,
  materials,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  exportDatabase,
  importDatabase,
  resetToDemo,
  lowStockThreshold,
  updateLowStockThreshold
}: DatabaseSettingsProps) {
  const [subTab, setSubTab] = useState<'employees' | 'materials' | 'backup'>('employees');

  // Employee manager states
  const [newEmpName, setNewEmpName] = useState('');
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [editingEmpName, setEditingEmpName] = useState('');

  // Material manager states
  const [newMatName, setNewMatName] = useState('');
  const [newMatUnit, setNewMatUnit] = useState('szt.');
  const [newMatBO, setNewMatBO] = useState<number>(0);
  const [editingMatId, setEditingMatId] = useState<string | null>(null);
  const [editingMatName, setEditingMatName] = useState('');
  const [editingMatUnit, setEditingMatUnit] = useState('szt.');

  // Import state
  const [importStatus, setImportStatus] = useState<{ success?: boolean; msg?: string } | null>(null);

  // Sorting and search states
  const [empSearch, setEmpSearch] = useState('');
  const [matSearch, setMatSearch] = useState('');

  // Low stock threshold editor state
  const [thresholdInput, setThresholdInput] = useState<string>(String(lowStockThreshold));
  const [thresholdSaved, setThresholdSaved] = useState(false);

  React.useEffect(() => {
    setThresholdInput(String(lowStockThreshold));
  }, [lowStockThreshold]);

  const handleSaveThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseInt(thresholdInput, 10);
    if (isNaN(value) || value < 0) return;
    updateLowStockThreshold(value);
    setThresholdSaved(true);
    setTimeout(() => setThresholdSaved(false), 1800);
  };

  // Handlers for Employees
  const handleAddEmployeeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;
    addEmployee(newEmpName);
    setNewEmpName('');
  };

  const startEditEmployee = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setEditingEmpName(emp.name);
  };

  const handleSaveEmployeeEdit = (id: string) => {
    if (!editingEmpName.trim()) return;
    updateEmployee(id, editingEmpName);
    setEditingEmpId(null);
  };

  // Handlers for Materials
  const handleAddMaterialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatName.trim()) return;
    addMaterial(newMatName, newMatUnit, newMatBO || 0);
    setNewMatName('');
    setNewMatBO(0);
  };

  const startEditMaterial = (mat: Material) => {
    setEditingMatId(mat.id);
    setEditingMatName(mat.name);
    setEditingMatUnit(mat.unit);
  };

  const handleSaveMaterialEdit = (id: string) => {
    if (!editingMatName.trim()) return;
    updateMaterial(id, editingMatName, editingMatUnit);
    setEditingMatId(null);
  };

  // File import handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const success = importDatabase(content);
      if (success) {
        setImportStatus({ success: true, msg: 'Dane zostały pomyślnie zaimportowane!' });
      } else {
        setImportStatus({ success: false, msg: 'Błąd podczas importu. Upewnij się, że plik jest prawidłowym plikiem JSON rozdzielnika.' });
      }
    };
    reader.readAsText(file);
  };

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => e.name.toLowerCase().includes(empSearch.toLowerCase()));
  }, [employees, empSearch]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => m.name.toLowerCase().includes(matSearch.toLowerCase()));
  }, [materials, matSearch]);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" id="konfiguracja-panel">
      {/* Sub tabs navigation */}
      <div className="border-b border-gray-100 bg-slate-50 flex items-center p-2 gap-1 flex-wrap">
        <button
          id="btn-subtab-employees"
          onClick={() => setSubTab('employees')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'employees'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <Users className="w-4 h-4" />
          Zarządzanie Pracownikami
        </button>

        <button
          id="btn-subtab-materials"
          onClick={() => setSubTab('materials')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'materials'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <Package2 className="w-4 h-4" />
          Zarządzanie Materiałami
        </button>

        <button
          id="btn-subtab-backup"
          onClick={() => setSubTab('backup')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
            subTab === 'backup'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-200/50'
          }`}
        >
          <Database className="w-4 h-4" />
          Kopia Zapasowa i Reset
        </button>
      </div>

      {/* SUB-TAB 1: EMPLOYEES */}
      {subTab === 'employees' && (
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Add Employee Form */}
            <div className="md:col-span-4 bg-slate-50 p-5 rounded-xl border border-gray-150 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4 text-indigo-600" />
                Dodaj nowego pracownika
              </h3>
              
              <form onSubmit={handleAddEmployeeSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="input-emp-name" className="text-xs font-semibold text-slate-600">Imię i Nazwisko / Nazwa:</label>
                  <input
                    id="input-emp-name"
                    type="text"
                    required
                    placeholder="np. Kowalski Jan"
                    value={newEmpName}
                    onChange={(e) => setNewEmpName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-save-new-emp"
                  className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  Zarejestruj pracownika
                </button>
              </form>
            </div>

            {/* Employee List Table */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Zarejestrowani pracownicy ({employees.length})</h3>
                <input
                  id="search-emp-input"
                  type="text"
                  placeholder="Filtruj pracowników..."
                  value={empSearch}
                  onChange={(e) => setEmpSearch(e.target.value)}
                  className="text-xs rounded-lg px-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>

              <div className="border border-gray-150 rounded-xl overflow-hidden overflow-y-auto max-h-[450px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">L.p.</th>
                      <th className="px-4 py-3">Imię i nazwisko (Zapis w nagłówku tabeli)</th>
                      <th className="px-4 py-3 text-center w-36">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-medium text-slate-700">
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-gray-400">
                          Brak pracowników spełniających kryteria wyszukiwania.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            {editingEmpId === emp.id ? (
                              <input
                                id={`edit-emp-name-input-${emp.id}`}
                                type="text"
                                value={editingEmpName}
                                onChange={(e) => setEditingEmpName(e.target.value)}
                                className="w-full text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <span className="font-semibold text-slate-900">{emp.name}</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {editingEmpId === emp.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  id={`btn-save-emp-edit-${emp.id}`}
                                  onClick={() => handleSaveEmployeeEdit(emp.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="Zapisz"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  id={`btn-cancel-emp-edit-${emp.id}`}
                                  onClick={() => setEditingEmpId(null)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Anuluj"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  id={`btn-start-emp-edit-${emp.id}`}
                                  onClick={() => startEditEmployee(emp)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Edytuj nazwę"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-del-emp-${emp.id}`}
                                  onClick={() => {
                                    if (confirm(`Czy na pewno chcesz usunąć pracownika "${emp.name}"?\n\nUsunięcie pracownika wyczyści także jego przypisane ilości w rozdzielnikach we wszystkich miesiącach.`)) {
                                      deleteEmployee(emp.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Usuń pracownika"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 2: MATERIALS */}
      {subTab === 'materials' && (
        <div className="p-6 space-y-6">
          {/* Low Stock Threshold Settings */}
          <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Próg "niskiego stanu magazynowego"</h3>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-md">
                  Materiał jest oznaczany jako "niski stan" gdy jego ilość spadnie do tej wartości lub poniżej. Dotyczy to kafelka na stronie głównej oraz filtra w Kartach Magazynowych.
                </p>
              </div>
            </div>
            <form onSubmit={handleSaveThreshold} className="flex items-center gap-2 shrink-0">
              <input
                id="input-low-stock-threshold"
                type="number"
                min="0"
                value={thresholdInput}
                onChange={(e) => setThresholdInput(e.target.value)}
                className="w-20 text-sm text-center font-bold rounded-lg border border-gray-200 p-2 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="submit"
                id="btn-save-low-stock-threshold"
                className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg cursor-pointer transition-colors shrink-0"
              >
                {thresholdSaved ? 'Zapisano ✓' : 'Zapisz'}
              </button>
            </form>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Add Material Form */}
            <div className="md:col-span-4 bg-slate-50 p-5 rounded-xl border border-gray-150 space-y-4">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1">
                <Plus className="w-4 h-4 text-indigo-600" />
                Dodaj nowy materiał do bazy
              </h3>
              
              <form onSubmit={handleAddMaterialSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label htmlFor="input-mat-name" className="text-xs font-semibold text-slate-600">Nazwa materiału:</label>
                  <input
                    id="input-mat-name"
                    type="text"
                    required
                    placeholder="np. Domestos 5l., Papier duży"
                    value={newMatName}
                    onChange={(e) => setNewMatName(e.target.value)}
                    className="w-full text-xs rounded-lg border border-gray-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="input-mat-unit" className="text-xs font-semibold text-slate-600">Jednostka miary:</label>
                    <select
                      id="input-mat-unit"
                      value={newMatUnit}
                      onChange={(e) => setNewMatUnit(e.target.value)}
                      className="w-full text-xs rounded-lg border border-gray-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
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
                    <label htmlFor="input-mat-bo" className="text-xs font-semibold text-slate-600">Stan BO (otwarcia):</label>
                    <input
                      id="input-mat-bo"
                      type="number"
                      min="0"
                      value={newMatBO || ''}
                      onChange={(e) => setNewMatBO(parseInt(e.target.value, 10) || 0)}
                      placeholder="np. 15"
                      className="w-full text-xs rounded-lg border border-gray-200 p-2.5 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold"
                    />
                  </div>
                </div>

                <div className="bg-amber-50 text-[10px] text-amber-800 p-3 rounded-lg border border-amber-100/50 leading-relaxed">
                  * Po dodaniu materiału, w jego nowej karcie magazynowej zostanie automatycznie wygenerowany wpis "BO" z podanym stanem początkowym. Materiał pojawi się również jako nowa kolumna w rozdzielnikach.
                </div>

                <button
                  type="submit"
                  id="btn-save-new-mat"
                  className="w-full text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 py-2.5 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                >
                  Utwórz kartę materiału
                </button>
              </form>
            </div>

            {/* Material List Table */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h3 className="font-bold text-slate-800 text-sm">Zapisane karty materiałowe ({materials.length})</h3>
                <input
                  id="search-mat-input"
                  type="text"
                  placeholder="Filtruj materiały..."
                  value={matSearch}
                  onChange={(e) => setMatSearch(e.target.value)}
                  className="text-xs rounded-lg px-3 py-1.5 border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-64"
                />
              </div>

              <div className="border border-gray-150 rounded-xl overflow-hidden overflow-y-auto max-h-[450px]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 w-16 text-center">L.p.</th>
                      <th className="px-4 py-3">Nazwa materiału</th>
                      <th className="px-3 py-3 w-24 text-center">Jedn. miary</th>
                      <th className="px-3 py-3 w-28 text-right">Stan obecny</th>
                      <th className="px-4 py-3 text-center w-28">Akcje</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 font-medium text-slate-700">
                    {filteredMaterials.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                          Brak materiałów w bazie spełniających kryteria.
                        </td>
                      </tr>
                    ) : (
                      filteredMaterials.map((mat, idx) => (
                        <tr key={mat.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-4 py-2.5 text-center font-mono text-slate-400">{idx + 1}</td>
                          <td className="px-4 py-2.5">
                            {editingMatId === mat.id ? (
                              <input
                                id={`edit-mat-name-input-${mat.id}`}
                                type="text"
                                value={editingMatName}
                                onChange={(e) => setEditingMatName(e.target.value)}
                                className="w-full text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <span className="font-semibold text-slate-900">{mat.name}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            {editingMatId === mat.id ? (
                              <select
                                id={`edit-mat-unit-select-${mat.id}`}
                                value={editingMatUnit}
                                onChange={(e) => setEditingMatUnit(e.target.value)}
                                className="text-xs rounded border border-gray-300 px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-full"
                              >
                                <option value="szt.">szt.</option>
                                <option value="op.">op.</option>
                                <option value="l.">l.</option>
                                <option value="kg">kg</option>
                                <option value="rolka">rolka</option>
                                <option value="paczka">paczka</option>
                              </select>
                            ) : (
                              <span className="font-mono text-slate-500 font-bold">{mat.unit}</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-slate-900">
                            {mat.currentStock} {mat.unit}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            {editingMatId === mat.id ? (
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  id={`btn-save-mat-edit-${mat.id}`}
                                  onClick={() => handleSaveMaterialEdit(mat.id)}
                                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                                  title="Zapisz"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button
                                  id={`btn-cancel-mat-edit-${mat.id}`}
                                  onClick={() => setEditingMatId(null)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Anuluj"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  id={`btn-start-mat-edit-${mat.id}`}
                                  onClick={() => startEditMaterial(mat)}
                                  className="p-1 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded cursor-pointer"
                                  title="Edytuj materiał"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  id={`btn-del-mat-${mat.id}`}
                                  onClick={() => {
                                    if (confirm(`Czy na pewno chcesz bezpowrotnie usunąć materiał "${mat.name}"?\n\nUWAGA: Spowoduje to całkowite skasowanie jego kartoteki historycznej oraz wyczyszczenie wpisów rozdzielników we wszystkich miesiącach.`)) {
                                      deleteMaterial(mat.id);
                                    }
                                  }}
                                  className="p-1 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                  title="Usuń materiał"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* SUB-TAB 3: BACKUP & RESTORE */}
      {subTab === 'backup' && (
        <div className="p-6 space-y-6">
          <div className="max-w-2xl space-y-6">
            <div className="space-y-2">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-1.5">
                <Database className="w-5 h-5 text-indigo-600" />
                Archiwizacja i ochrona danych (Kopie bezpieczeństwa)
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Ta aplikacja działa w pełni lokalnie w Twojej przeglądarce i zapisuje dane na dysku twardym Twojego komputera. Aby zapobiec utracie danych przy czyszczeniu przeglądarki, zaleca się regularne pobieranie kopii zapasowej na dysk Windows.
              </p>
            </div>

            {/* Actions Panel */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Export Card */}
              <div className="border border-slate-150 p-5 rounded-xl space-y-4 flex flex-col justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Wyeksportuj Bazę Danych
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Pobiera plik ze wszystkimi pracownikami, materiałami, kompletną historią kartotek magazynowych oraz miesięcznymi rozdzielnikami. Możesz zachować go jako archiwalną kopię bezpieczeństwa.
                  </p>
                </div>
                
                <button
                  onClick={exportDatabase}
                  id="btn-backup-export"
                  className="w-full text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Zapisz kopię zapasową (.json)
                </button>
              </div>

              {/* Import Card */}
              <div className="border border-slate-150 p-5 rounded-xl space-y-4 flex flex-col justify-between bg-slate-50/50">
                <div className="space-y-1">
                  <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
                    <Upload className="w-4 h-4 text-indigo-600" />
                    Przywróć dane z pliku
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Wgraj uprzednio pobrany plik kopii zapasowej <b>.json</b> rozdzielnika, aby przywrócić wszystkie stany magazynowe i rozliczenia z tamtego momentu.
                  </p>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    id="input-backup-file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => document.getElementById('input-backup-file')?.click()}
                    id="btn-backup-import-trigger"
                    className="w-full text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 py-2.5 rounded-lg flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Wybierz plik kopii zapasowej
                  </button>
                </div>
              </div>
            </div>

            {/* Import Status Alert Banner */}
            {importStatus && (
              <div className={`p-4 rounded-xl border text-xs flex items-start gap-2.5 ${
                importStatus.success 
                  ? 'bg-emerald-50 border-emerald-100 text-emerald-800' 
                  : 'bg-rose-50 border-rose-100 text-rose-800'
              }`}>
                {importStatus.success ? <Check className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" /> : <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />}
                <div>{importStatus.msg}</div>
              </div>
            )}

            {/* Danger Zone */}
            <div className="border border-rose-150 p-5 rounded-xl bg-rose-50/20 space-y-4">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="font-bold text-rose-900 text-sm">Strefa Niebezpieczna: Przywrócenie danych demonstracyjnych</div>
                  <p className="text-[11px] text-rose-700 leading-relaxed">
                    Ta operacja usunie wszystkie Twoje obecne zapisy i zastąpi je oryginalnym, gotowym zestawem danych SSM Radom (około 49 materiałów, 10 pracowników oraz gotowy, przykładowy rozdzielnik za Marzec 2026, który widzisz na zdjęciach papierowych).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end">
                <button
                  id="btn-backup-reset-demo"
                  onClick={() => {
                    if (confirm('UWAGA: Spowoduje to całkowite nadpisanie Twoich aktualnych danych i wgranie początkowego zestawu testowego (DOMESTOS, GĄBKI, DRUCIAK, itp.). Czy chcesz kontynuować?')) {
                      resetToDemo();
                      alert('Przywrócono początkowy stan demonstracyjny SSM Radom.');
                    }
                  }}
                  className="text-xs font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 border border-rose-200 px-4 py-2 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Resetuj i załaduj dane SSM Radom
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
