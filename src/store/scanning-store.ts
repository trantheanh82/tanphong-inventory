import { create } from 'zustand';

export interface ScanItem {
  id: string; // DOT or Series or record ID
  dot?: string;
  series?: string;
  quantity: number;
  scanned: number;
  tire_type?: 'Nội địa' | 'Nước ngoài';
}

interface ScanningState {
  items: ScanItem[];
  setItems: (items: ScanItem[]) => void;
  addOrUpdateItem: (item: ScanItem) => void;
  incrementScanCount: (id: string) => void;
  updateItemWithScan: (recordId: string, series: string, dot: string) => void;
  addSeriesToItem: (dot: string, series: string) => void;
  checkAllScanned: () => boolean;
  getTotalProgress: () => { totalScanned: number; totalQuantity: number };
  reset: () => void;
}

export const useScanningStore = create<ScanningState>((set, get) => ({
  items: [],
  setItems: (items) => set({ items }),

  addOrUpdateItem: (newItem) => {
    set((state) => {
      const existingItem = state.items.find(item => item.id === newItem.id);
      if (existingItem) {
        return {
            items: state.items.map(item =>
                item.id === newItem.id
                    ? { ...item, scanned: item.scanned + 1 }
                    : item
            ),
        };
      } else {
        return { items: [...state.items, newItem] };
      }
    });
  },

  updateItemWithScan: (recordId, series, dot) => {
    set((state) => ({
      items: state.items.map((item) =>
        item.id === recordId
          ? { ...item, series, dot, scanned: 1 }
          : item
      ),
    }));
  },
  
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
    set((state) => {
      let itemUpdated = false;
      const updatedItems = state.items.map((item) => {
        if (item.tire_type === 'Nước ngoài' && String(item.dot) === String(dot) && !itemUpdated) {
          // Find the first unscanned series slot for this DOT and fill it
          const existingSeries = item.series ? item.series.split(', ') : [];
          if (existingSeries.length < item.quantity) {
              const newSeries = item.series ? `${item.series}, ${series}` : series;
              itemUpdated = true;
              return { ...item, series: newSeries };
          }
        }
        return item;
      });
      return { items: updatedItems };
    });
  },

  checkAllScanned: () => {
    const { items } = get();
    if (items.length === 0) return false;
    return items.every(item => item.scanned >= item.quantity);
  },
  
  getTotalProgress: () => {
    const { items } = get();
    const totalScanned = items.reduce((acc, item) => acc + item.scanned, 0);
    const totalQuantity = items.reduce((acc, item) => acc + item.quantity, 0);
    return { totalScanned, totalQuantity };
  },
  
  reset: () => set({ items: [] }),
}));
