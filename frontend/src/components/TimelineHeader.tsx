import { useMemo } from 'react';
import { useStore } from '../store';
import { monthIndex, fromMonthIndex, MONTH_NAMES, quarterOf } from '../dateUtils';

const ROW_LABEL_WIDTH = 48; // px, width of left row-label column

export default function TimelineHeader() {
  const { timelineStartYear, timelineStartMonth, timelineTotalMonths, monthColWidth } = useStore();

  const startIdx = monthIndex(timelineStartYear, timelineStartMonth);

  // Build quarter groups
  const quarters = useMemo(() => {
    const groups: { label: string; startCol: number; span: number }[] = [];
    let i = 0;
    while (i < timelineTotalMonths) {
      const { year, month } = fromMonthIndex(startIdx + i);
      const q = quarterOf(month);
      // How many months remain in this quarter?
      const monthsIntoQ = ((month - 1) % 3);
      const remaining = Math.min(3 - monthsIntoQ, timelineTotalMonths - i);
      groups.push({ label: `Q${q} ${year}`, startCol: i, span: remaining });
      i += remaining;
    }
    return groups;
  }, [startIdx, timelineTotalMonths]);

  // Build month labels
  const months = useMemo(() => {
    return Array.from({ length: timelineTotalMonths }, (_, i) => {
      const { year, month } = fromMonthIndex(startIdx + i);
      return { year, month, label: MONTH_NAMES[month - 1] };
    });
  }, [startIdx, timelineTotalMonths]);

  const totalWidth = timelineTotalMonths * monthColWidth;

  return (
    <div className="timeline-header" style={{ paddingLeft: ROW_LABEL_WIDTH }}>
      <div style={{ width: totalWidth, position: 'relative' }}>
        {/* Quarter row */}
        <div className="header-quarters">
          {quarters.map((q, i) => {
            const isEvenQ = (parseInt(q.label[1]) % 2 === 0);
            return (
              <div
                key={i}
                className={`header-quarter ${isEvenQ ? 'even' : 'odd'}`}
                style={{ width: q.span * monthColWidth }}
              >
                {q.label}
              </div>
            );
          })}
        </div>
        {/* Month row */}
        <div className="header-months">
          {months.map((m, i) => {
            const isJan = m.month === 1;
            return (
              <div
                key={i}
                className={`header-month ${isJan ? 'year-boundary' : ''}`}
                style={{ width: monthColWidth }}
              >
                <span className="month-label">{m.label}</span>
                {isJan && <span className="year-label">{m.year}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { ROW_LABEL_WIDTH };
