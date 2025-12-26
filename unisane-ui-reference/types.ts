
export interface SubItem {
  id: string;
  label: string;
  isHeader?: boolean; // If true, it's a section title not a link
  children?: SubItem[]; // Nested accordion items
}

export interface NavCategory {
  id: string;
  label: string;
  icon: string; // Material Symbol name (e.g., 'home', 'settings')
  badge?: string | number; // Badge content (e.g., 'New', '3')
  items?: SubItem[]; // The list shown in the drawer
}

export type ViewState = 'rail-only' | 'drawer-open';