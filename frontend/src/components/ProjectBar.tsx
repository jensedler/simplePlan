import { useRef, RefObject } from 'react';
import type { Project } from '../types';
import { useStore, monthIdxToPixel, pixelToMonthIdx } from '../store';
import { monthIndex, formatMonth } from '../dateUtils';
import { ROW_LABEL_WIDTH } from './TimelineHeader';

const ROW_HEIGHT = 56;
const BAR_PADDING = 6;

interface Props {
  project: Project;
  scrollRef: RefObject<HTMLDivElement>;
}

export default function ProjectBar({ project, scrollRef }: Props) {
  const {
    monthColWidth, showLeadTimes,
    editModeEnabled, drag,
    setDrag, openEditDialog,
  } = useStore();

  const didMove = useRef(false);

  const startIdx = monthIndex(project.start_year, project.start_month);
  const endIdx = monthIndex(project.end_year, project.end_month);
  const spanM = endIdx - startIdx + 1;

  const left = monthIdxToPixel(startIdx, monthColWidth);
  const width = spanM * monthColWidth;
  const top = BAR_PADDING;
  const height = ROW_HEIGHT - BAR_PADDING * 2;

  // During a move drag on THIS bar, shift it visually
  const isBeingMoved = drag?.mode === 'move' && drag?.projectId === project.id;
  const isBeingResizedL = drag?.mode === 'resize-left' && drag?.projectId === project.id;
  const isBeingResizedR = drag?.mode === 'resize-right' && drag?.projectId === project.id;
  const isActiveDrag = isBeingMoved || isBeingResizedL || isBeingResizedR;

  const handleBarPointerDown = (e: React.PointerEvent) => {
    if (!editModeEnabled) return;
    e.stopPropagation();
    e.preventDefault();
    didMove.current = false;
    document.body.style.cursor = 'grabbing';

    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - ROW_LABEL_WIDTH + scrollRef.current.scrollLeft;
    const mIdx = pixelToMonthIdx(Math.max(0, pixelX), monthColWidth);

    setDrag({
      mode: 'move',
      projectId: project.id,
      rowId: project.row_id,
      startMonthIdx: mIdx,
      currentMonthIdx: mIdx,
      startY: e.clientY,
      currentY: e.clientY,
      originalProject: { ...project },
    });

    // Track whether it was a move or just a click
    const onMove = () => { didMove.current = true; };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  };

  const handleResizeLeft = (e: React.PointerEvent) => {
    if (!editModeEnabled) return;
    e.stopPropagation();
    e.preventDefault();
    document.body.style.cursor = 'ew-resize';

    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - ROW_LABEL_WIDTH + scrollRef.current.scrollLeft;
    const mIdx = pixelToMonthIdx(Math.max(0, pixelX), monthColWidth);

    setDrag({
      mode: 'resize-left',
      projectId: project.id,
      rowId: project.row_id,
      startMonthIdx: mIdx,
      currentMonthIdx: mIdx,
      startY: e.clientY,
      currentY: e.clientY,
      originalProject: { ...project },
    });
  };

  const handleResizeRight = (e: React.PointerEvent) => {
    if (!editModeEnabled) return;
    e.stopPropagation();
    e.preventDefault();
    document.body.style.cursor = 'ew-resize';

    if (!scrollRef.current) return;
    const rect = scrollRef.current.getBoundingClientRect();
    const pixelX = e.clientX - rect.left - ROW_LABEL_WIDTH + scrollRef.current.scrollLeft;
    const mIdx = pixelToMonthIdx(Math.max(0, pixelX), monthColWidth);

    setDrag({
      mode: 'resize-right',
      projectId: project.id,
      rowId: project.row_id,
      startMonthIdx: mIdx,
      currentMonthIdx: mIdx,
      startY: e.clientY,
      currentY: e.clientY,
      originalProject: { ...project },
    });
  };

  const handleClick = (e: React.MouseEvent) => {
    if (didMove.current) return;
    e.stopPropagation();
    openEditDialog(project.id);
  };

  const tooltipText = `${project.name}\n${formatMonth(project.start_year, project.start_month)} – ${formatMonth(project.end_year, project.end_month)}${project.responsible ? '\n' + project.responsible : ''}`;

  const leadWidth = project.lead_months * monthColWidth;

  return (
    <>
      {/* Lead time bar */}
      {showLeadTimes && project.lead_months > 0 && (
        <div
          className="project-bar lead-bar"
          style={{
            left: left - leadWidth,
            width: leadWidth,
            top, height,
            background: project.color,
          }}
          title={`Vorlaufzeit: ${project.lead_months} Monat${project.lead_months !== 1 ? 'e' : ''}`}
        />
      )}

      {/* Main bar — hidden while being actively dragged (ghost shows instead) */}
      <div
        className={`project-bar main-bar ${editModeEnabled ? 'editable' : ''} ${isActiveDrag ? 'is-dragging' : ''}`}
        style={{ left, width, top, height, background: project.color }}
        title={tooltipText}
        data-project-id={project.id}
        onPointerDown={handleBarPointerDown}
        onClick={handleClick}
      >
        {editModeEnabled && (
          <div className="resize-handle resize-handle-left" onPointerDown={handleResizeLeft} />
        )}
        <span className="bar-label">{project.name}</span>
        {editModeEnabled && (
          <div className="resize-handle resize-handle-right" onPointerDown={handleResizeRight} />
        )}
      </div>
    </>
  );
}

export { ROW_HEIGHT, BAR_PADDING };
