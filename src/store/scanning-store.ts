
import { create } from 'zustand';

export interface ScanItem {
  id: string; // DOT or Series
  dot?: string;
  series?: string;
  quantity: number;
  scanned: number;
  tire_type?: 'Nội địa' | 'Nước ngoài';
}

interface ScanningState {
  items: ScanItem[];
  activeSeriesScan: string | null; // Holds the DOT that needs a series scan
  setItems: (items: ScanItem[]) => void;
  incrementScanCount: (id: string) => void;
  addSeriesToItem: (dot: string, series: string) => void;
  setActiveSeriesScan: (dot: string | null) => void;
  checkAllScanned: () => boolean;
  getTotalProgress: () => { totalScanned: number; totalQuantity: number };
  reset: () => void;
}

export const useScanningStore = create<ScanningState>((set, get) => ({
  items: [],
  activeSeriesScan: null,
  setItems: (items) => set({ items }),
  
  incrementScanCount: (scannedId) => {
    set((state) => ({
      items: state.items.map((item) => {
        const idMatch = String(item.dot) === String(scannedId);
        if (idMatch && item.scanned < item.quantity) {
          return { ...item, scanned: item.scanned + 1 };
        }
        return item;
      }),
    }));
  },

  addSeriesToItem: (dot, series) => {
    set((state) => ({
      items: state.items.map((item) => {
        if (String(item.dot) === String(dot)) {
          const newSeries = item.series ? `${item.series}, ${series}` : series;
          return { ...item, series: newSeries };
        }
        return item;
      }),
    }));
  },

  setActiveSeriesScan: (dot) => set({ activeSeriesScan: dot }),

  checkAllScanned: () => {
    const { items } = get();
    if (items.length === 0) return false;
    return items.every((item) => item.scanned >= item.quantity);
  },
  
  getTotalProgress: () => {
    const { items } = get();
    const totalScanned = items.reduce((acc, item) => acc + item.scanned, 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    return { totalScanned, totalQuantity };
  },
  
  reset: () => set({ items: [], activeSeriesScan: null }),
}));
