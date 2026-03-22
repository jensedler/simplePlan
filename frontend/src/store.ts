import { create } from 'zustand';
import { api, ApiError } from './api';
import type { Row, Project, DragState, CreateDialogData } from './types';
import { monthIndex } from './dateUtils';

const MONTH_COL_WIDTH = 80; // px per month column, default
const TIMELINE_YEARS = 6;   // total years rendered in timeline

// Timeline starts at Jan of (currentYear - 2) for scroll room
const currentYear = new Date().getFullYear();
const TIMELINE_START_YEAR = currentYear - 2;
const TIMELINE_START_MONTH = 1;
const TIMELINE_TOTAL_MONTHS = TIMELINE_YEARS * 12;

interface DialogState {
  mode: 'create' | 'edit' | null;
  projectId?: number;         // for edit
  prefill?: CreateDialogData; // for create
}

interface PlannerState {
  // Server data
  rows: Row[];
  projects: Project[];

  // Auth
  isAuthenticated: boolean;
  needsSetup: boolean;

  // UI toggles
  editModeEnabled: boolean;
  showLeadTimes: boolean;
  createModeActive: boolean;

  // Timeline constants
  timelineStartYear: number;
  timelineStartMonth: number;
  timelineTotalMonths: number;
  monthColWidth: number;

  // Drag
  drag: DragState | null;

  // Dialog
  dialog: DialogState;

  // Actions: auth
  init: () => Promise<void>;
  login: (password: string) => Promise<void>;
  setup: (password: string) => Promise<void>;
  logout: () => Promise<void>;

  // Actions: data
  fetchAll: () => Promise<void>;

  // Actions: UI
  toggleEditMode: () => void;
  toggleLeadTimes: () => void;
  toggleCreateMode: () => void;

  // Actions: rows
  addRow: () => Promise<void>;
  deleteRow: (id: number) => Promise<void>;
  reorderRows: (rows: Row[]) => Promise<void>;

  // Actions: projects
  createProject: (data: Omit<Project, 'id'>) => Promise<void>;
  updateProject: (id: number, data: Partial<Omit<Project, 'id'>>) => Promise<void>;
  deleteProject: (id: number) => Promise<void>;

  // Actions: drag
  setDrag: (drag: DragState | null) => void;
  commitMove: (projectId: number, newData: Partial<Omit<Project, 'id'>>) => Promise<void>;

  // Actions: dialog
  openCreateDialog: (prefill: CreateDialogData) => void;
  openEditDialog: (projectId: number) => void;
  closeDialog: () => void;
}

export const useStore = create<PlannerState>((set, get) => ({
  rows: [],
  projects: [],
  isAuthenticated: false,
  needsSetup: false,
  editModeEnabled: false,
  showLeadTimes: true,
  createModeActive: false,
  timelineStartYear: TIMELINE_START_YEAR,
  timelineStartMonth: TIMELINE_START_MONTH,
  timelineTotalMonths: TIMELINE_TOTAL_MONTHS,
  monthColWidth: MONTH_COL_WIDTH,
  drag: null,
  dialog: { mode: null },

  init: async () => {
    try {
      const status = await api.status();
      if (status.needsSetup) {
        set({ needsSetup: true, isAuthenticated: false });
        return;
      }
      await api.me();
      set({ isAuthenticated: true, needsSetup: false });
      await get().fetchAll();
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        set({ isAuthenticated: false });
      }
    }
  },

  login: async (password) => {
    await api.login(password);
    set({ isAuthenticated: true, needsSetup: false });
    await get().fetchAll();
  },

  setup: async (password) => {
    await api.setup(password);
    set({ isAuthenticated: true, needsSetup: false });
    await get().fetchAll();
  },

  logout: async () => {
    await api.logout();
    set({ isAuthenticated: false, rows: [], projects: [] });
  },

  fetchAll: async () => {
    const [rows, projects] = await Promise.all([api.getRows(), api.getProjects()]);
    set({ rows, projects });
  },

  toggleEditMode: () => set(s => ({
    editModeEnabled: !s.editModeEnabled,
    createModeActive: false,
  })),

  toggleLeadTimes: () => set(s => ({ showLeadTimes: !s.showLeadTimes })),

  toggleCreateMode: () => set(s => ({
    createModeActive: !s.createModeActive,
    editModeEnabled: false,
  })),

  addRow: async () => {
    const row = await api.createRow();
    set(s => ({ rows: [...s.rows, row] }));
  },

  deleteRow: async (id) => {
    await api.deleteRow(id);
    set(s => ({
      rows: s.rows.filter(r => r.id !== id),
      projects: s.projects.filter(p => p.row_id !== id),
    }));
  },

  reorderRows: async (newRows) => {
    set({ rows: newRows });
    const items = newRows.map((r, i) => ({ id: r.id, sort_order: i + 1 }));
    await api.reorderRows(items);
    set(s => ({
      rows: s.rows.map(r => {
        const item = items.find(i => i.id === r.id);
        return item ? { ...r, sort_order: item.sort_order } : r;
      }),
    }));
  },

  createProject: async (data) => {
    const project = await api.createProject(data);
    set(s => ({ projects: [...s.projects, project] }));
  },

  updateProject: async (id, data) => {
    set(s => ({
      projects: s.projects.map(p => p.id === id ? { ...p, ...data } : p),
    }));
    try {
      const updated = await api.updateProject(id, data);
      set(s => ({
        projects: s.projects.map(p => p.id === id ? updated : p),
      }));
    } catch {
      await get().fetchAll();
    }
  },

  deleteProject: async (id) => {
    set(s => ({ projects: s.projects.filter(p => p.id !== id) }));
    await api.deleteProject(id);
  },

  setDrag: (drag) => set({ drag }),

  commitMove: async (projectId, newData) => {
    await get().updateProject(projectId, newData);
    set({ drag: null });
  },

  openCreateDialog: (prefill) => set({ dialog: { mode: 'create', prefill } }),
  openEditDialog: (projectId) => set({ dialog: { mode: 'edit', projectId } }),
  closeDialog: () => set({ dialog: { mode: null } }),
}));

export { TIMELINE_START_YEAR, TIMELINE_START_MONTH, TIMELINE_TOTAL_MONTHS, MONTH_COL_WIDTH };

/** Convert a pixel X (relative to timeline inner div) to a month index */
export function pixelToMonthIdx(pixelX: number, monthColWidth: number): number {
  const { timelineStartYear, timelineStartMonth } = useStore.getState();
  const startIdx = monthIndex(timelineStartYear, timelineStartMonth);
  return startIdx + Math.floor(pixelX / monthColWidth);
}

/** Convert a month index to pixel X (left edge of that month's column) */
export function monthIdxToPixel(monthIdx: number, monthColWidth: number): number {
  const { timelineStartYear, timelineStartMonth } = useStore.getState();
  const startIdx = monthIndex(timelineStartYear, timelineStartMonth);
  return (monthIdx - startIdx) * monthColWidth;
}
