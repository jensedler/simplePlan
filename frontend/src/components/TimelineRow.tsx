import { RefObject } from 'react';
import type { Row, Project } from '../types';
import { useStore, pixelToMonthIdx, monthIdxToPixel } from '../store';
import { monthIndex, fromMonthIndex } from '../dateUtils';
import ProjectBar, { ROW_HEIGHT, BAR_PADDING } from './ProjectBar';
import { ROW_LABEL_WIDTH } from './TimelineHeader';

interface Props {
  row: Row;
  projects: Project[];
  rowIndex: number;
  onRowDragStart: (rowId: number) => void;
  scrollRef: RefObject<HTMLDivElement>;
}

export default function TimelineRow({ row, projects, rowIndex, onRowDragStart, scrollRef }: Props) {
  const {
    timelineTotalMonths, monthColWidth,
    editModeEnabled, createModeActive,
    drag, setDrag,
    deleteRow,
  } = useStore();

  const totalWidth = timelineTotalMonths * monthColWidth;

  // --- Start a create drag ---
  const handleCanvasPointerDown = (e: React.PointerEvent) => {
    if (!createModeActive) return;
    if ((e.target as HTMLElement).closest('[data-project-id]')) return;
    e.preventDefault();

    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - ROW_LABEL_WIDTH + scrollRef.current.scrollLeft;
    const mIdx = pixelToMonthIdx(Math.max(0, pixelX), monthColWidth);

    setDrag({
      mode: 'create',
      rowId: row.id,
      startMonthIdx: mIdx,
      currentMonthIdx: mIdx,
      startY: e.clientY,
      currentY: e.clientY,
    });

    document.body.style.cursor = 'crosshair';
  };

  // Ghost bar during create drag
  const createGhost = (() => {
    if (!drag || drag.mode !== 'create' || drag.rowId !== row.id) return null;
    const startM = Math.min(drag.startMonthIdx, drag.currentMonthIdx);
    const endM = Math.max(drag.startMonthIdx, drag.currentMonthIdx);
    const left = monthIdxToPixel(startM, monthColWidth);
    const width = (endM - startM + 1) * monthColWidth;
    return (
      <div
        className="ghost-bar"
        style={{ left, width, top: BAR_PADDING, height: ROW_HEIGHT - BAR_PADDING * 2 }}
      />
    );
  })();

  // Ghost bar during move/resize (shown in the TARGET row)
  const moveGhost = (() => {
    if (!drag?.projectId || !drag.originalProject) return null;
    if (drag.mode !== 'move' && drag.mode !== 'resize-left' && drag.mode !== 'resize-right') return null;

    const orig = drag.originalProject;
    const targetRowId = drag.rowId ?? orig.row_id;
    if (targetRowId !== row.id) return null;

    const origStartIdx = monthIndex(orig.start_year, orig.start_month);
    const origEndIdx = monthIndex(orig.end_year, orig.end_month);
    const delta = drag.currentMonthIdx - drag.startMonthIdx;

    let ghostLeft: number, ghostWidth: number;

    if (drag.mode === 'move') {
      ghostLeft = monthIdxToPixel(origStartIdx + delta, monthColWidth);
      ghostWidth = (origEndIdx - origStartIdx + 1) * monthColWidth;
    } else if (drag.mode === 'resize-left') {
      const newStart = Math.min(drag.currentMonthIdx, origEndIdx);
      ghostLeft = monthIdxToPixel(newStart, monthColWidth);
      ghostWidth = (origEndIdx - newStart + 1) * monthColWidth;
    } else {
      const newEnd = Math.max(drag.currentMonthIdx, origStartIdx);
      ghostLeft = monthIdxToPixel(origStartIdx, monthColWidth);
      ghostWidth = (newEnd - origStartIdx + 1) * monthColWidth;
    }

    return (
      <div
        className="ghost-bar move-ghost"
        style={{
          left: ghostLeft, width: ghostWidth,
          top: BAR_PADDING, height: ROW_HEIGHT - BAR_PADDING * 2,
          background: orig.color,
        }}
      />
    );
  })();

  return (
    <div className="timeline-row" style={{ height: ROW_HEIGHT }} data-row-id={row.id}>
      {/* Sticky row label */}
      <div className={`row-label ${editModeEnabled ? 'editable' : ''}`} style={{ width: ROW_LABEL_WIDTH }}>
        {editModeEnabled && (
          <div
            className="row-drag-handle"
            draggable
            onDragStart={() => onRowDragStart(row.id)}
            title="Zeile verschieben"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="4" cy="3" r="1" fill="currentColor" />
              <circle cx="8" cy="3" r="1" fill="currentColor" />
              <circle cx="4" cy="6" r="1" fill="currentColor" />
              <circle cx="8" cy="6" r="1" fill="currentColor" />
              <circle cx="4" cy="9" r="1" fill="currentColor" />
              <circle cx="8" cy="9" r="1" fill="currentColor" />
            </svg>
          </div>
        )}
        <span className="row-number">{rowIndex + 1}</span>
        {editModeEnabled && (
          <button
            className="row-delete-btn"
            onClick={() => deleteRow(row.id)}
            title="Zeile löschen"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>

      {/* Project canvas */}
      <div
        className={`row-canvas ${createModeActive ? 'create-mode' : ''}`}
        style={{ width: totalWidth }}
        onPointerDown={handleCanvasPointerDown}
      >
        {projects.map(p => <ProjectBar key={p.id} project={p} scrollRef={scrollRef} />)}
        {createGhost}
        {moveGhost}
      </div>
    </div>
  );
}
