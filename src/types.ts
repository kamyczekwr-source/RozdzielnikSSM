export interface Material {
  id: string;
  name: string;
  unit: string;
  initialStock: number;
  currentStock: number;
}

export interface HistoryEntry {
  id: string;
  materialId: string;
  date: string; // YYYY-MM-DD
  documentName: string; // e.g. "BO", "1258/MG/2026"
  income: number; // przychód
  expense: number; // rozchód
  balanceAfter: number; // stan po operacji
}

export interface Employee {
  id: string;
  name: string;
}

export interface DistributionCell {
  employeeId: string;
  materialId: string;
  quantity: number;
}

export interface RozdzielnikPeriod {
  id: string; // e.g. "2026-03"
  year: number;
  month: number;
  isCommitted: boolean; // whether this distribution has been booked into the ledger card
  documentNo: string; // e.g. "1258/MG/2026"
  distributions: Record<string, Record<string, number>>; // employeeId -> materialId -> quantity
}
