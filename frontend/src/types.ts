export interface Row {
  id: number;
  sort_order: number;
}

export interface Project {
  id: number;
  name: string;
  color: string;
  start_year: number;
  start_month: number; // 1-12
  end_year: number;
  end_month: number;   // 1-12
  lead_months: number;
  description: string;
  responsible: string;
  row_id: number;
  sort_order: number;
}

export type ProjectCreate = Omit<Project, 'id'>;

export const COLORS = [
  '#4f86c6', // Blau
  '#e8734a', // Orange
  '#5aaa6f', // Grün
  '#d4a017', // Gelb/Gold
  '#9b59b6', // Lila
  '#e84a5f', // Rot/Pink
  '#2eaaa8', // Türkis
  '#7f8c8d', // Grau
] as const;

export type Color = (typeof COLORS)[number];

export type DragMode = 'create' | 'move' | 'resize-left' | 'resize-right' | 'row-reorder' | null;

export interface DragState {
  mode: DragMode;
  projectId?: number;
  rowId?: number;           // target row during create/move
  startMonthIdx: number;    // month index where drag started
  currentMonthIdx: number;  // current month index
  startY: number;
  currentY: number;
  originalProject?: Project; // snapshot at drag start for rollback
}

export interface CreateDialogData {
  start_year: number;
  start_month: number;
  end_year: number;
  end_month: number;
  row_id: number;
}
