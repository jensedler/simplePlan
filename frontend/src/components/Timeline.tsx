import { useRef, useEffect } from 'react';
import { useStore, pixelToMonthIdx, monthIdxToPixel } from '../store';
import { monthIndex, fromMonthIndex } from '../dateUtils';
import TimelineHeader, { ROW_LABEL_WIDTH } from './TimelineHeader';
import TimelineRow from './TimelineRow';
import type { Project } from '../types';

export default function Timeline() {
  const {
    rows, projects,
    timelineStartYear, timelineStartMonth, monthColWidth,
    drag, setDrag, commitMove, openCreateDialog,
  } = useStore();

  const scrollRef = useRef<HTMLDivElement>(null);
  // Keep a ref to drag so event listeners always see current value
  const dragRef = useRef(drag);
  dragRef.current = drag;

  // Scroll to center on current month on mount
  useEffect(() => {
    if (!scrollRef.current) return;
    const now = new Date();
    const startIdx = monthIndex(timelineStartYear, timelineStartMonth);
    const nowIdx = monthIndex(now.getFullYear(), now.getMonth() + 1);
    scrollRef.current.scrollLeft = Math.max(0, (nowIdx - startIdx - 2) * monthColWidth);
  }, []);

  // Global drag handler: process all pointer moves/ups for active drags
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d || !d.mode || d.mode === 'row-reorder') return;
      if (!scrollRef.current) return;

      const rect = scrollRef.current.getBoundingClientRect();
      const pixelX = e.clientX - rect.left - ROW_LABEL_WIDTH + scrollRef.current.scrollLeft;
      const mIdx = pixelToMonthIdx(Math.max(0, pixelX), monthColWidth);

      let targetRowId = d.rowId;
      if (d.mode === 'move') {
        const rowEls = scrollRef.current.querySelectorAll<HTMLElement>('[data-row-id]');
        for (const el of rowEls) {
          const r = el.getBoundingClientRect();
          if (e.clientY >= r.top && e.clientY <= r.bottom) {
            targetRowId = Number(el.dataset.rowId);
            break;
          }
        }
      }

      setDrag({ ...d, currentMonthIdx: mIdx, currentY: e.clientY, rowId: targetRowId });
    };

    const handleUp = () => {
      const d = dragRef.current;
      if (!d || !d.mode) return;
      document.body.style.cursor = '';

      if (d.mode === 'create') {
        if (d.rowId == null) { setDrag(null); return; }
        const startM = Math.min(d.startMonthIdx, d.currentMonthIdx);
        const endM = Math.max(d.startMonthIdx, d.currentMonthIdx);
        setDrag(null);
        const startDate = fromMonthIndex(startM);
        const endDate = fromMonthIndex(endM);
        openCreateDialog({
          start_year: startDate.year,
          start_month: startDate.month,
          end_year: endDate.year,
          end_month: endDate.month,
          row_id: d.rowId,
        });
        return;
      }

      if (!d.projectId || !d.originalProject) { setDrag(null); return; }

      const orig = d.originalProject;
      const origStartIdx = monthIndex(orig.start_year, orig.start_month);
      const origEndIdx = monthIndex(orig.end_year, orig.end_month);
      const delta = d.currentMonthIdx - d.startMonthIdx;

      let newData: Partial<Omit<Project, 'id'>> = {};

      if (d.mode === 'move') {
        const ns = fromMonthIndex(origStartIdx + delta);
        const ne = fromMonthIndex(origEndIdx + delta);
        newData = {
          start_year: ns.year, start_month: ns.month,
          end_year: ne.year, end_month: ne.month,
          row_id: d.rowId ?? orig.row_id,
        };
      } else if (d.mode === 'resize-left') {
        const newStart = fromMonthIndex(Math.min(d.currentMonthIdx, origEndIdx));
        newData = { start_year: newStart.year, start_month: newStart.month };
      } else if (d.mode === 'resize-right') {
        const newEnd = fromMonthIndex(Math.max(d.currentMonthIdx, origStartIdx));
        newData = { end_year: newEnd.year, end_month: newEnd.month };
      }

      commitMove(d.projectId, newData);
    };

    document.addEventListener('pointermove', handleMove);
    document.addEventListener('pointerup', handleUp);
    return () => {
      document.removeEventListener('pointermove', handleMove);
      document.removeEventListener('pointerup', handleUp);
    };
  }, []); // mount/unmount only — uses dragRef for current state

  // Row reorder (HTML5 drag, separate from pointer-based drag)
  const reorderDragRowId = useRef<number | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-row-id]');
    if (el) el.closest('.timeline-row')?.classList.add('drop-target');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement)
      .querySelectorAll('.drop-target')
      .forEach(el => el.classList.remove('drop-target'));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleDragLeave(e);
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-row-id]');
    const fromId = reorderDragRowId.current;
    if (!el || fromId == null) return;

    const toId = Number(el.dataset.rowId);
    if (toId === fromId) return;

    const { rows: currentRows, reorderRows } = useStore.getState();
    const sorted = [...currentRows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);
    const fromIdx = sorted.findIndex(r => r.id === fromId);
    const toIdx = sorted.findIndex(r => r.id === toId);
    if (fromIdx === -1 || toIdx === -1) return;

    const newRows = [...sorted];
    const [moved] = newRows.splice(fromIdx, 1);
    newRows.splice(toIdx, 0, moved);
    reorderRows(newRows);
    reorderDragRowId.current = null;
  };

  const sortedRows = [...rows].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id);

  return (
    <div className="timeline-container">
      <div
        ref={scrollRef}
        className="timeline-scroll"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <TimelineHeader />
        <div className="timeline-body">
          {sortedRows.length === 0 ? (
            <div className="timeline-empty">
              Noch keine Zeilen – klicke auf "Zeile" in der Toolbar, um zu beginnen.
            </div>
          ) : (
            sortedRows.map((row, i) => {
              const rowProjects = projects
                .filter(p => p.row_id === row.id)
                .sort((a, b) => a.sort_order - b.sort_order);
              return (
                <TimelineRow
                  key={row.id}
                  row={row}
                  projects={rowProjects}
                  rowIndex={i}
                  onRowDragStart={(id) => { reorderDragRowId.current = id; }}
                  scrollRef={scrollRef}
                />
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
