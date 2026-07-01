/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useAppState } from './useAppState';
import { RozdzielnikGrid } from './components/RozdzielnikGrid';
import { MaterialCards } from './components/MaterialCards';
import { DatabaseSettings } from './components/DatabaseSettings';
import { PrintRozdzielnik } from './components/PrintRozdzielnik';
import { 
  FileText, 
  Package, 
  Settings, 
  Printer, 
  TrendingUp, 
  Sparkles, 
  BookOpen, 
  Database,
  ArrowRight
} from 'lucide-react';

export default function App() {
  const {
    employees,
    materials,
    history,
    periods,
    isSyncing,
    isOnline,
    syncError,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addMaterial,
    updateMaterial,
    deleteMaterial,
    addHistoryEntry,
    deleteHistoryEntry,
    updateDistribution,
    createPeriod,
    updatePeriodDocumentNo,
    commitPeriod,
    uncommitPeriod,
    exportDatabase,
    importDatabase,
    resetToDemo
  } = useAppState();

  const [activeTab, setActiveTab] = useState<'rozdzielnik' | 'kartoteki' | 'zarzadzanie'>('rozdzielnik');
  const [printPeriodId, setPrintPeriodId] = useState<string | null>(null);

  // Quick stats calculations for the top panel
  const totalMaterials = materials.length;
  const totalEmployees = employees.length;
  const lowStockCount = materials.filter(m => m.currentStock <= 5).length;
  const activeMonthName = periods.length > 0 ? `${periods[0].month}/${periods[0].year}` : 'Brak';

  if (isSyncing) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold">Synchronizuję dane...</p>
        </div>
      </div>
    );
  }

  if (printPeriodId) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 print:p-0">
        <div className="max-w-7xl mx-auto">
          <PrintRozdzielnik
            periodId={printPeriodId}
            employees={employees}
            materials={materials}
            periods={periods}
            onBack={() => setPrintPeriodId(null)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white pb-12">
      
      {/* PROFESSIONAL APPLICATION NAVBAR */}
      <header id="app-navbar" className="bg-indigo-900 text-white shadow-md border-b border-indigo-950 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Logo and title */}
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2.5 rounded-xl border border-white/20 shadow-inner flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-indigo-200" />
              </div>
              <div>
                <h1 className="text-lg font-black tracking-tight flex items-center gap-1.5">
                  ROZDELNIK <span className="text-xs bg-indigo-500 text-white font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">System SSM Radom</span>
                </h1>
                <p className="text-[10px] text-indigo-200 uppercase tracking-widest font-bold">Cyfrowa Kartoteka Materiałowa</p>
              </div>
              <span
                title={syncError ?? (isOnline ? 'Dane synchronizowane na żywo' : 'Brak połączenia - zmiany zapiszą się lokalnie i wyślą po powrocie sieci')}
                className={`ml-2 flex items-center gap-1.5 text-[10px] font-bold uppercase px-2 py-1 rounded-full border ${
                  isOnline
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>

            {/* Navigation Tabs */}
            <nav className="flex items-center gap-1.5 bg-indigo-950/40 p-1.5 rounded-xl border border-indigo-800/50">
              <button
                id="tab-btn-rozdzielnik"
                onClick={() => setActiveTab('rozdzielnik')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'rozdzielnik'
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/20'
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                Miesięczny Rozdzielnik
              </button>

              <button
                id="tab-btn-kartoteki"
                onClick={() => setActiveTab('kartoteki')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'kartoteki'
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/20'
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Package className="w-4 h-4" />
                Karty Magazynowe
              </button>

              <button
                id="tab-btn-zarzadzanie"
                onClick={() => setActiveTab('zarzadzanie')}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'zarzadzanie'
                    ? 'bg-indigo-600 text-white shadow-md border border-indigo-500/20'
                    : 'text-indigo-200 hover:text-white hover:bg-white/5'
                }`}
              >
                <Settings className="w-4 h-4" />
                Zarządzanie i Baza
              </button>
            </nav>

          </div>
        </div>
      </header>

      {/* DASHBOARD SUMMARY KPI CARDS */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="bg-indigo-50 p-2.5 rounded-lg text-indigo-600">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Materiały w bazie</div>
            <div className="text-lg font-black text-slate-800">{totalMaterials} <span className="text-xs font-semibold text-slate-400">kartoteki</span></div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="bg-teal-50 p-2.5 rounded-lg text-teal-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Pracownicy</div>
            <div className="text-lg font-black text-slate-800">{totalEmployees} <span className="text-xs font-semibold text-slate-400">osób</span></div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className={`p-2.5 rounded-lg ${lowStockCount > 0 ? 'bg-amber-50 text-amber-600 animate-pulse' : 'bg-slate-50 text-slate-500'}`}>
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Niski stan zapasów</div>
            <div className={`text-lg font-black ${lowStockCount > 0 ? 'text-amber-600' : 'text-slate-800'}`}>{lowStockCount} <span className="text-xs font-semibold text-slate-400">materiałów</span></div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-xs flex items-center gap-3">
          <div className="bg-purple-50 p-2.5 rounded-lg text-purple-600">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase">Ostatni rozdzielnik</div>
            <div className="text-lg font-black text-slate-800 font-mono">{activeMonthName}</div>
          </div>
        </div>
      </div>

      {/* CORE WORKSPACE FOR THE ACTIVE TAB */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full mt-6 flex-1">
        
        {activeTab === 'rozdzielnik' && (
          <RozdzielnikGrid
            employees={employees}
            materials={materials}
            periods={periods}
            updateDistribution={updateDistribution}
            createPeriod={createPeriod}
            updatePeriodDocumentNo={updatePeriodDocumentNo}
            commitPeriod={commitPeriod}
            uncommitPeriod={uncommitPeriod}
            onPrint={(pId) => setPrintPeriodId(pId)}
            addMaterial={addMaterial}
          />
        )}

        {activeTab === 'kartoteki' && (
          <MaterialCards
            materials={materials}
            history={history}
            addHistoryEntry={addHistoryEntry}
            deleteHistoryEntry={deleteHistoryEntry}
            addMaterial={addMaterial}
          />
        )}

        {activeTab === 'zarzadzanie' && (
          <DatabaseSettings
            employees={employees}
            materials={materials}
            addEmployee={addEmployee}
            updateEmployee={updateEmployee}
            deleteEmployee={deleteEmployee}
            addMaterial={addMaterial}
            updateMaterial={updateMaterial}
            deleteMaterial={deleteMaterial}
            exportDatabase={exportDatabase}
            importDatabase={importDatabase}
            resetToDemo={resetToDemo}
          />
        )}

      </main>

      {/* FOOTER CREDITS */}
      <footer className="text-center text-[10px] text-slate-400 font-semibold mt-12 pt-4 border-t border-slate-200 max-w-7xl mx-auto px-4 select-none">
        Aplikacja Rozdzielnik - Ewidencja przychodów i rozchodów materiałów • SSM Radom • {new Date().getFullYear()}
      </footer>

    </div>
  );
}
