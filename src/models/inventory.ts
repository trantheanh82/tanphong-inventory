
export type RecordItem = {
  id: string;
  name: string;
  fields: { [key: string]: any };
  createdTime: string;
};

export type DashboardData = {
  imports: RecordItem[];
  exports: RecordItem[];
  warranties: RecordItem[];
};

export type InventoryItemDetail = {
    dot: string;
    quantity: number;
    scanned: number;
    series?: string;
    reason?: string;
};

export type InventoryItem = {
    id: string;
    type: "Import" | "Export" | "Warranty";
    name: string;
    quantity: number;
    date: string;
    details: InventoryItemDetail[];
};

export type ImportNote = {
  fields: {
    name: string;
    status: string;
    total_quantity: number;
    import_note_detail: {
      id: string;
      title: string;
    }[];
    createdAt: string;
    total_import_note: string;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};

export type ImportNoteDetail = {
  fields: {
    DOT: number;
    name: string;
    quantity: number;
    import_note: {
      id: string;
      title: string;
    };
    tire_type: string;
    scanned: number;
    status: string;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};


export type ExportNote = {
  fields: {
    name: string;
    status: string;
    export_note_detail: {
      id: string;
      title: string;
    }[];
    createdAt: string;
    total_exporte_note: number;
    total_quantity: number;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  createdBy: string;
  lastModifiedTime?: string;
  lastModifiedBy?: string;
};

export type ExportNoteDetail = {
  fields: {
    quantity: number;
    dot: number;
    name: string;
    export_note: {
      id: string;
      title: string;
    };
    tire_type: string;
    series: string;
    status: string;
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};

export type WarrantyNote = {
  fields: {
    name: string;
    status: string;
    total_warrantine_note: number;
    warranty_note_detail: {
      id: string;
      title: string;
    }[];
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};

export type WarrantyNoteDetail = {
  fields: {
    name: string;
    series: string;
    quantity: number;
    quantity_note: {
      id: string;
      title: string;
    }[];
  };
  name: string;
  id: string;
  autoNumber: number;
  createdTime: string;
  lastModifiedTime: string;
  createdBy: string;
  lastModifiedBy: string;
};
