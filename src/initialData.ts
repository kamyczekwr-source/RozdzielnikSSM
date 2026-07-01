import { Material, Employee, HistoryEntry, RozdzielnikPeriod } from './types';

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'emp_1', name: 'Fijałkowska / Noga' },
  { id: 'emp_2', name: 'Recepcja' },
  { id: 'emp_3', name: 'Tyczyńska Agnieszka' },
  { id: 'emp_4', name: 'Golus Wioletta' },
  { id: 'emp_5', name: 'Karolina Stępień' },
  { id: 'emp_6', name: 'Kaszewska Beata' },
  { id: 'emp_7', name: 'Kwiatkowski Dariusz' },
  { id: 'emp_8', name: 'Sokulska Małgorzata' },
  { id: 'emp_9', name: 'Artur Rudnicki' },
  { id: 'emp_10', name: 'Matracki' }
];

export const INITIAL_MATERIALS: Material[] = [
  { id: 'mat_1', name: 'Domestos 5l.', unit: 'szt.', initialStock: 26, currentStock: 50 },
  { id: 'mat_2', name: 'Gąbki op.', unit: 'op.', initialStock: 11, currentStock: 21 },
  { id: 'mat_3', name: 'Druciak', unit: 'szt.', initialStock: 19, currentStock: 19 },
  { id: 'mat_4', name: 'Kij do mopa szczotki', unit: 'szt.', initialStock: 5, currentStock: 5 },
  { id: 'mat_5', name: 'Mleczko do czyszczenia', unit: 'szt.', initialStock: 12, currentStock: 12 },
  { id: 'mat_6', name: 'Mop szt.', unit: 'szt.', initialStock: 8, currentStock: 8 },
  { id: 'mat_7', name: 'Mop płaski szt.', unit: 'szt.', initialStock: 6, currentStock: 6 },
  { id: 'mat_8', name: 'Mydło w piance', unit: 'szt.', initialStock: 15, currentStock: 15 },
  { id: 'mat_9', name: 'Mydło w płynie szt.', unit: 'szt.', initialStock: 10, currentStock: 10 },
  { id: 'mat_10', name: 'Mydło w płynie 5l.', unit: 'szt.', initialStock: 4, currentStock: 4 },
  { id: 'mat_11', name: 'Odtłuszczacz', unit: 'szt.', initialStock: 14, currentStock: 14 },
  { id: 'mat_12', name: 'Odplamiacz', unit: 'szt.', initialStock: 3, currentStock: 3 },
  { id: 'mat_13', name: 'Odświeżacz pow.', unit: 'szt.', initialStock: 18, currentStock: 18 },
  { id: 'mat_14', name: 'Papier toaletowy duży', unit: 'szt.', initialStock: 64, currentStock: 64 },
  { id: 'mat_15', name: 'Papier toaletowy Tork', unit: 'szt.', initialStock: 36, currentStock: 36 },
  { id: 'mat_16', name: 'Pasta do podłogi', unit: 'szt.', initialStock: 5, currentStock: 5 },
  { id: 'mat_17', name: 'Pasta komfort', unit: 'szt.', initialStock: 10, currentStock: 10 },
  { id: 'mat_18', name: 'Płyn do mebli', unit: 'szt.', initialStock: 12, currentStock: 12 },
  { id: 'mat_19', name: 'Płyn do naczyń', unit: 'szt.', initialStock: 20, currentStock: 20 },
  { id: 'mat_20', name: 'Płyn do naczyń 5l.', unit: 'szt.', initialStock: 8, currentStock: 8 },
  { id: 'mat_21', name: 'Płyn do szorowarki', unit: 'szt.', initialStock: 2, currentStock: 2 },
  { id: 'mat_22', name: 'Rękawice lateksowe', unit: 'op.', initialStock: 15, currentStock: 15 },
  { id: 'mat_23', name: 'Stelaż do mopa', unit: 'szt.', initialStock: 4, currentStock: 4 },
  { id: 'mat_24', name: 'Ścierka do okien', unit: 'szt.', initialStock: 25, currentStock: 25 },
  { id: 'mat_25', name: 'Wózek do sprzątania', unit: 'szt.', initialStock: 1, currentStock: 1 },
  // Second page items
  { id: 'mat_26', name: 'Płyn do okien Karcher', unit: 'szt.', initialStock: 8, currentStock: 8 },
  { id: 'mat_27', name: 'Płyn do okien', unit: 'szt.', initialStock: 12, currentStock: 12 },
  { id: 'mat_28', name: 'Płyn do płukania', unit: 'szt.', initialStock: 10, currentStock: 10 },
  { id: 'mat_29', name: 'Płyn do podłogi', unit: 'szt.', initialStock: 15, currentStock: 15 },
  { id: 'mat_30', name: 'Płyn do WC szt.', unit: 'szt.', initialStock: 20, currentStock: 20 },
  { id: 'mat_31', name: 'Płyn do WC l.', unit: 'l.', initialStock: 10, currentStock: 10 },
  { id: 'mat_32', name: 'Proszek biel op.', unit: 'op.', initialStock: 5, currentStock: 5 },
  { id: 'mat_33', name: 'Proszek kolor op.', unit: 'op.', initialStock: 5, currentStock: 5 },
  { id: 'mat_34', name: 'Ręcznik papierowy', unit: 'szt.', initialStock: 40, currentStock: 40 },
  { id: 'mat_35', name: 'Ręcznik pap. TORK', unit: 'szt.', initialStock: 24, currentStock: 24 },
  { id: 'mat_36', name: 'Rękawice gumowe', unit: 'op.', initialStock: 12, currentStock: 12 },
  { id: 'mat_37', name: 'Szczotka do WC', unit: 'szt.', initialStock: 6, currentStock: 6 },
  { id: 'mat_38', name: 'Szczotka ze śmietniczką', unit: 'szt.', initialStock: 8, currentStock: 8 },
  { id: 'mat_39', name: 'Szczotka do zamiatania', unit: 'szt.', initialStock: 5, currentStock: 5 },
  { id: 'mat_40', name: 'Ścierki do kurzu op.', unit: 'op.', initialStock: 30, currentStock: 30 },
  { id: 'mat_41', name: 'Ścierki mikrofibra szt.', unit: 'szt.', initialStock: 45, currentStock: 45 },
  { id: 'mat_42', name: 'Środek do udrażniania rur', unit: 'szt.', initialStock: 10, currentStock: 10 },
  { id: 'mat_43', name: 'Worek do Karchera', unit: 'szt.', initialStock: 15, currentStock: 15 },
  { id: 'mat_44', name: 'Worek do odkurzacza', unit: 'szt.', initialStock: 20, currentStock: 20 },
  { id: 'mat_45', name: 'Worek mały', unit: 'op.', initialStock: 50, currentStock: 50 },
  { id: 'mat_46', name: 'Worek średni', unit: 'op.', initialStock: 40, currentStock: 40 },
  { id: 'mat_47', name: 'Worek duży', unit: 'op.', initialStock: 30, currentStock: 30 },
  { id: 'mat_48', name: 'Żel do dezynfekcji', unit: 'szt.', initialStock: 12, currentStock: 12 },
  { id: 'mat_49', name: 'Ręcznik pap. MAXI', unit: 'szt.', initialStock: 15, currentStock: 15 }
];

export const INITIAL_HISTORY: HistoryEntry[] = [
  // Domestos 5l.
  { id: 'hist_1_bo', materialId: 'mat_1', date: '2026-02-25', documentName: 'BO', income: 0, expense: 0, balanceAfter: 26 },
  { id: 'hist_1_rec', materialId: 'mat_1', date: '2026-03-31', documentName: '1258/MG/2026', income: 24, expense: 0, balanceAfter: 50 },

  // Gąbki op.
  { id: 'hist_2_bo', materialId: 'mat_2', date: '2026-02-25', documentName: 'BO', income: 0, expense: 0, balanceAfter: 11 },
  { id: 'hist_2_rec', materialId: 'mat_2', date: '2026-03-31', documentName: '1258/MG/2026', income: 10, expense: 0, balanceAfter: 21 },

  // Druciak
  { id: 'hist_3_bo', materialId: 'mat_3', date: '2026-02-25', documentName: 'BO', income: 0, expense: 0, balanceAfter: 19 }
];

// Let's create some pre-filled values in Rozdzielnik Marzec 2026 as shown in the picture to make it instantly rich:
// e.g.:
// - Domestos: Golus Wioletta 1, Karolina Stępień 2, Fijałkowska / Noga 1, Kwiatkowski Dariusz 1
// - Gąbki: Fijałkowska / Noga 1, Golus Wioletta 1, Karolina Stępień 1
// - Papier toaletowy duży: Fijałkowska / Noga 2, Golus Wioletta 2, Karolina Stępień 1, Recepcja 1
// - Ręcznik papierowy: Fijałkowska / Noga 2
export const INITIAL_PERIODS: RozdzielnikPeriod[] = [
  {
    id: '2026-03',
    year: 2026,
    month: 3,
    isCommitted: false,
    documentNo: '1258/MG/2026',
    distributions: {
      'emp_1': {}, // Fijałkowska / Noga
      'emp_2': {}, // Recepcja
      'emp_3': {}, // Tyczyńska Agnieszka
      'emp_4': { // Golus Wioletta
        'mat_1': 1,  // Domestos 5l.
        'mat_2': 1,  // Gąbki op.
        'mat_5': 1,  // Mleczko do czyszczenia
        'mat_8': 1,  // Mydło w piance
        'mat_11': 1, // Odtłuszczacz
        'mat_13': 1, // Odświeżacz pow.
        'mat_14': 2, // Papier toaletowy duży
        'mat_19': 1, // Płyn do naczyń
        'mat_20': 1, // Płyn do naczyń 5l.
        'mat_22': 1  // Rękawice lateksowe
      },
      'emp_5': { // Karolina Stępień
        'mat_1': 2,  // Domestos 5l.
        'mat_2': 1,  // Gąbki op.
        'mat_5': 1,  // Mleczko do czyszczenia
        'mat_11': 2, // Odtłuszczacz
        'mat_13': 2, // Odświeżacz pow.
        'mat_14': 2, // Papier toaletowy duży
        'mat_22': 1  // Rękawice lateksowe
      },
      'emp_6': {}, // Kaszewska Beata
      'emp_7': {}, // Kwiatkowski Dariusz
      'emp_8': { // Sokulska Małgorzata
        'mat_2': 1,  // Gąbki op.
        'mat_6': 1,  // Mop szt.
        'mat_7': 1,  // Mop płaski szt.
        'mat_11': 1, // Odtłuszczacz
        'mat_14': 2, // Papier toaletowy duży (wpisane 1,1)
        'mat_22': 1  // Rękawice lateksowe
      },
      'emp_9': {}, // Artur Rudnicki
      'emp_10': {} // Matracki
    }
  }
];
