import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase';
import { Employee, Material, HistoryEntry, RozdzielnikPeriod } from './types';
import { INITIAL_EMPLOYEES, INITIAL_MATERIALS, INITIAL_HISTORY, INITIAL_PERIODS } from './initialData';

// Cała baza (pracownicy, materiały, historia, okresy) trzyma się w jednym
// dokumencie Firestore, żeby synchronizacja była prosta i spójna.
// Jeśli kiedyś będziesz chciał osobne "workspace'y" (np. dla kilku magazynów),
// wystarczy zmienić WORKSPACE_ID na coś dynamicznego.
const WORKSPACE_ID = 'main';
const DOC_REF_PATH = ['rozdzielnik', WORKSPACE_ID] as const;

interface DbShape {
  employees: Employee[];
  materials: Material[];
  history: HistoryEntry[];
  periods: RozdzielnikPeriod[];
  updatedAt?: number;
}

const LOCAL_CACHE_KEY = 'rozdzielnik_v3_cache';

function loadLocalCache(): DbShape {
  try {
    const saved = localStorage.getItem(LOCAL_CACHE_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Nie udało się odczytać lokalnej kopii:', e);
  }
  return {
    employees: INITIAL_EMPLOYEES,
    materials: INITIAL_MATERIALS,
    history: INITIAL_HISTORY,
    periods: INITIAL_PERIODS,
  };
}

export function useAppState() {
  const initial = loadLocalCache();

  const [employees, setEmployees] = useState<Employee[]>(initial.employees);
  const [materials, setMaterials] = useState<Material[]>(initial.materials);
  const [history, setHistory] = useState<HistoryEntry[]>(initial.history);
  const [periods, setPeriods] = useState<RozdzielnikPeriod[]>(initial.periods);

  const [isSyncing, setIsSyncing] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Flagi pomocnicze, żeby odróżnić zmianę przyszłą "z chmury" (nie zapisuj jej
  // z powrotem do chmury) od zmiany zrobionej lokalnie przez użytkownika
  // (tę trzeba wypchnąć do Firestore).
  const isRemoteUpdate = useRef(false);
  const hasLoadedRemote = useRef(false);
  const writeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // --- Subskrypcja na żywo z Firestore ---
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    ensureSignedIn()
      .then(() => {
        const ref = doc(db, ...DOC_REF_PATH);
        unsubscribe = onSnapshot(
          ref,
          (snap) => {
            setIsOnline(true);
            setSyncError(null);

            if (snap.exists()) {
              const data = snap.data() as DbShape;
              isRemoteUpdate.current = true;
              setEmployees(data.employees ?? []);
              setMaterials(data.materials ?? []);
              setHistory(data.history ?? []);
              setPeriods(data.periods ?? []);
            } else if (!hasLoadedRemote.current) {
              // Pierwsze uruchomienie - w Firestore jeszcze nic nie ma,
              // więc "zasiewamy" bazę tym, co mamy lokalnie (albo danymi demo).
              setDoc(ref, { ...initial, updatedAt: Date.now() }).catch((e) =>
                setSyncError(e.message)
              );
            }

            hasLoadedRemote.current = true;
            setIsSyncing(false);
          },
          (err) => {
            console.error('Błąd synchronizacji Firestore:', err);
            setIsOnline(false);
            setSyncError(err.message);
            setIsSyncing(false);
          }
        );
      })
      .catch((err) => {
        console.error('Błąd logowania do Firebase:', err);
        setSyncError(err.message);
        setIsSyncing(false);
      });

    return () => unsubscribe && unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Zapis do Firestore (debounced) + zawsze do localStorage jako cache offline ---
  useEffect(() => {
    const snapshot: DbShape = { employees, materials, history, periods };
    localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(snapshot));

    if (isRemoteUpdate.current) {
      // Ta zmiana stanu przyszła z Firestore - nie odsyłamy jej z powrotem.
      isRemoteUpdate.current = false;
      return;
    }
    if (!hasLoadedRemote.current) {
      // Jeszcze nie zakończyła się pierwsza synchronizacja - nie nadpisuj.
      return;
    }

    if (writeTimeout.current) clearTimeout(writeTimeout.current);
    writeTimeout.current = setTimeout(() => {
      const ref = doc(db, ...DOC_REF_PATH);
      setDoc(ref, { ...snapshot, updatedAt: Date.now() }).catch((e) => {
        console.error('Błąd zapisu do Firestore:', e);
        setSyncError(e.message);
      });
    }, 600);

    return () => {
      if (writeTimeout.current) clearTimeout(writeTimeout.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employees, materials, history, periods]);

  // Actions for Employees
  const addEmployee = (name: string) => {
    const newEmp: Employee = {
      id: `emp_${Date.now()}`,
      name: name.trim()
    };
    setEmployees(prev => [...prev, newEmp]);
  };

  const updateEmployee = (id: string, name: string) => {
    setEmployees(prev => prev.map(emp => emp.id === id ? { ...emp, name: name.trim() } : emp));
  };

  const deleteEmployee = (id: string) => {
    setEmployees(prev => prev.filter(emp => emp.id !== id));
    // Clean up distributions for this employee in all periods
    setPeriods(prev => prev.map(p => {
      const updatedDists = { ...p.distributions };
      delete updatedDists[id];
      return { ...p, distributions: updatedDists };
    }));
  };

  // Actions for Materials
  const addMaterial = (name: string, unit: string, initialStock: number) => {
    const newId = `mat_${Date.now()}`;
    const newMat: Material = {
      id: newId,
      name: name.trim(),
      unit: unit.trim() || 'szt.',
      initialStock,
      currentStock: initialStock
    };

    setMaterials(prev => [...prev, newMat]);

    // Create a BO (Bilans otwarcia) entry in history
    const boEntry: HistoryEntry = {
      id: `hist_${Date.now()}_bo`,
      materialId: newId,
      date: new Date().toISOString().split('T')[0],
      documentName: 'BO',
      income: initialStock,
      expense: 0,
      balanceAfter: initialStock
    };
    setHistory(prev => [...prev, boEntry]);
    return newId;
  };

  const updateMaterial = (id: string, name: string, unit: string) => {
    setMaterials(prev => prev.map(mat => mat.id === id ? { ...mat, name: name.trim(), unit: unit.trim() } : mat));
  };

  const deleteMaterial = (id: string) => {
    setMaterials(prev => prev.filter(mat => mat.id !== id));
    // Clean history for this material
    setHistory(prev => prev.filter(h => h.materialId !== id));
    // Clean up distributions for this material in all periods
    setPeriods(prev => prev.map(p => {
      const updatedDists = { ...p.distributions };
      Object.keys(updatedDists).forEach(empId => {
        if (updatedDists[empId]) {
          delete updatedDists[empId][id];
        }
      });
      return { ...p, distributions: updatedDists };
    }));
  };

  // Manual History Card Entries (Przychód / Rozchód)
  const addHistoryEntry = (materialId: string, date: string, docName: string, income: number, expense: number) => {
    // 1. Calculate new stock
    const mat = materials.find(m => m.id === materialId);
    if (!mat) return;

    const netChange = income - expense;
    const updatedStock = mat.currentStock + netChange;

    // 2. Add entry
    const newEntry: HistoryEntry = {
      id: `hist_${Date.now()}`,
      materialId,
      date,
      documentName: docName.trim() || 'Dowód wewnętrzny',
      income,
      expense,
      balanceAfter: updatedStock
    };

    setHistory(prev => [...prev, newEntry]);

    // 3. Update material's current stock
    setMaterials(prev => prev.map(m => m.id === materialId ? { ...m, currentStock: updatedStock } : m));
  };

  const deleteHistoryEntry = (entryId: string) => {
    const entry = history.find(h => h.id === entryId);
    if (!entry) return;

    // Revert the stock change
    const netChange = entry.income - entry.expense;
    setMaterials(prev => prev.map(m => m.id === entry.materialId ? { ...m, currentStock: m.currentStock - netChange } : m));
    setHistory(prev => prev.filter(h => h.id !== entryId));
  };

  // Rozdzielnik Period Actions
  const updateDistribution = (periodId: string, employeeId: string, materialId: string, value: number) => {
    setPeriods(prev => prev.map(p => {
      if (p.id !== periodId) return p;

      const updatedDists = { ...p.distributions };
      if (!updatedDists[employeeId]) {
        updatedDists[employeeId] = {};
      }

      if (value <= 0) {
        delete updatedDists[employeeId][materialId];
      } else {
        updatedDists[employeeId][materialId] = value;
      }

      return { ...p, distributions: updatedDists };
    }));
  };

  const createPeriod = (year: number, month: number, docNo: string) => {
    const periodId = `${year}-${String(month).padStart(2, '0')}`;
    if (periods.some(p => p.id === periodId)) {
      alert('Taki okres już istnieje!');
      return;
    }

    const newPeriod: RozdzielnikPeriod = {
      id: periodId,
      year,
      month,
      isCommitted: false,
      documentNo: docNo.trim() || `Rozdzielnik/${month}/${year}`,
      distributions: {}
    };

    setPeriods(prev => [...prev, newPeriod]);
  };

  const updatePeriodDocumentNo = (periodId: string, docNo: string) => {
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, documentNo: docNo } : p));
  };

  // Commit (Rozlicz) Period - deduct from material cards
  const commitPeriod = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period || period.isCommitted) return;

    // Calculate totals of each material distributed
    const materialTotals: Record<string, number> = {};

    Object.values(period.distributions).forEach(employeeDists => {
      Object.entries(employeeDists).forEach(([materialId, qty]) => {
        if (qty > 0) {
          materialTotals[materialId] = (materialTotals[materialId] || 0) + qty;
        }
      });
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const docName = period.documentNo || `Rozdzielnik ${period.month}/${period.year}`;

    // Create new history entries for each material and update stocks
    const newHistoryEntries: HistoryEntry[] = [];
    const updatedMaterials = [...materials];

    Object.entries(materialTotals).forEach(([materialId, totalQty]) => {
      const matIdx = updatedMaterials.findIndex(m => m.id === materialId);
      if (matIdx !== -1) {
        const mat = updatedMaterials[matIdx];
        const newStock = mat.currentStock - totalQty;

        updatedMaterials[matIdx] = {
          ...mat,
          currentStock: newStock
        };

        newHistoryEntries.push({
          id: `hist_commit_${periodId}_${materialId}`,
          materialId,
          date: todayStr,
          documentName: `Rozchód Rozdzielnik - ${docName}`,
          income: 0,
          expense: totalQty,
          balanceAfter: newStock
        });
      }
    });

    // Save everything in one batch to state
    setMaterials(updatedMaterials);
    setHistory(prev => [...prev, ...newHistoryEntries]);
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, isCommitted: true } : p));
  };

  // Uncommit (Anuluj rozliczenie) Period - restore material cards
  const uncommitPeriod = (periodId: string) => {
    const period = periods.find(p => p.id === periodId);
    if (!period || !period.isCommitted) return;

    // Find and remove history entries created by this commit
    const prefix = `hist_commit_${periodId}_`;
    const entriesToRevert = history.filter(h => h.id.startsWith(prefix));

    const materialTotalsRevert: Record<string, number> = {};
    entriesToRevert.forEach(e => {
      materialTotalsRevert[e.materialId] = e.expense;
    });

    // Revert stock values
    setMaterials(prev => prev.map(m => {
      const revertedQty = materialTotalsRevert[m.id];
      if (revertedQty) {
        return {
          ...m,
          currentStock: m.currentStock + revertedQty
        };
      }
      return m;
    }));

    // Remove history entries
    setHistory(prev => prev.filter(h => !h.id.startsWith(prefix)));
    setPeriods(prev => prev.map(p => p.id === periodId ? { ...p, isCommitted: false } : p));
  };

  // Full Database Import / Export / Reset
  const exportDatabase = () => {
    const dbSnapshot = {
      employees,
      materials,
      history,
      periods
    };
    const jsonStr = JSON.stringify(dbSnapshot, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Rozdzielnik_kopia_zapasowa_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importDatabase = (jsonContent: string) => {
    try {
      const parsed = JSON.parse(jsonContent);
      if (parsed.employees && parsed.materials && parsed.history && parsed.periods) {
        setEmployees(parsed.employees);
        setMaterials(parsed.materials);
        setHistory(parsed.history);
        setPeriods(parsed.periods);
        return true;
      }
      return false;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const resetToDemo = () => {
    setEmployees(INITIAL_EMPLOYEES);
    setMaterials(INITIAL_MATERIALS);
    setHistory(INITIAL_HISTORY);
    setPeriods(INITIAL_PERIODS);
  };

  return {
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
  };
}
