import { useStore } from '../store';

export default function Toolbar() {
  const {
    editModeEnabled, showLeadTimes, createModeActive,
    toggleEditMode, toggleLeadTimes, toggleCreateMode,
    addRow, logout,
  } = useStore();

  return (
    <header className="toolbar">
      <div className="toolbar-left">
        <div className="toolbar-brand">
          <svg width="28" height="28" viewBox="0 0 40 40" fill="none">
            <rect width="40" height="40" rx="8" fill="#4f86c6" />
            <rect x="8" y="14" width="24" height="4" rx="2" fill="white" opacity="0.9" />
            <rect x="8" y="22" width="16" height="4" rx="2" fill="white" opacity="0.6" />
          </svg>
          <span className="toolbar-title">simplePlan</span>
        </div>
      </div>

      <div className="toolbar-center">
        <button
          className={`toolbar-btn ${createModeActive ? 'active' : ''}`}
          onClick={toggleCreateMode}
          title="Neues Projekt einzeichnen (Klicken und Ziehen)"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Projekt anlegen
        </button>
      </div>

      <div className="toolbar-right">
        <button
          className={`toolbar-btn ${showLeadTimes ? 'active' : ''}`}
          onClick={toggleLeadTimes}
          title="Vorlaufzeiten ein-/ausblenden"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="5" width="6" height="6" rx="1" fill="currentColor" opacity="0.4" />
            <rect x="7" y="5" width="8" height="6" rx="1" fill="currentColor" />
          </svg>
          Vorlaufzeit
        </button>

        <button
          className={`toolbar-btn ${editModeEnabled ? 'active warning' : ''}`}
          onClick={toggleEditMode}
          title="Bearbeitungsmodus ein-/ausschalten"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M11.5 2.5L13.5 4.5L5 13H3V11L11.5 2.5Z"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
            />
          </svg>
          Bearbeiten {editModeEnabled ? 'an' : 'aus'}
        </button>

        <div className="toolbar-divider" />

        <button className="toolbar-btn" onClick={addRow} title="Neue Zeile hinzufügen">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="5" width="14" height="6" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7v2M7 8h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Zeile
        </button>

        <button className="toolbar-btn icon-only" onClick={logout} title="Ausloggen">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 14H3a1 1 0 01-1-1V3a1 1 0 011-1h3M10 11l3-3-3-3M13 8H6"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </header>
  );
}
