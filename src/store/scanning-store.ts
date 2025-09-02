
import { create } from 'zustand';

export interface ScanItem {
  id: string; // DOT or Series
  dot?: string;
  series?: string;
  quantity: number;
  scanned: number;
}

interface ScanningState {
  items: ScanItem[];
  setItems: (items: ScanItem[]) => void;
  incrementScanCount: (id: string) => void;
  checkAllScanned: () => boolean;
  getTotalProgress: () => { totalScanned: number; totalQuantity: number };
  reset: () => void;
}

export const useScanningStore = create<ScanningState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),
  incrementScanCount: (scannedId) => {
    set((state) => ({
      items: state.items.map((item) => {
        // Find item by dot or series and check if not fully scanned
        const idMatch = item.dot === scannedId || item.series === scannedId;
        if (idMatch && item.scanned < item.quantity) {
          return { ...item, scanned: item.scanned + 1 };
        }
        return item;
      }),
    }));
  },
  checkAllScanned: () => {
    const { items } = get();
    if (items.length === 0) return false;
    return items.every((item) => item.scanned === item.quantity);
  },
  getTotalProgress: () => {
    const { items } = get();
    const totalScanned = items.reduce((acc, item) => acc + item.scanned, 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    return { totalScanned, totalQuantity };
  },
  reset: () => set({ items: [] }),
}));
