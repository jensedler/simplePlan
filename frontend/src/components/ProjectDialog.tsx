import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { COLORS } from '../types';
import { formatMonth } from '../dateUtils';

export default function ProjectDialog() {
  const { dialog, projects, closeDialog, createProject, updateProject, deleteProject } = useStore();

  const isEdit = dialog.mode === 'edit';
  const existing = isEdit ? projects.find(p => p.id === dialog.projectId) : undefined;

  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(COLORS[0]);
  const [leadMonths, setLeadMonths] = useState(0);
  const [description, setDescription] = useState('');
  const [responsible, setResponsible] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEdit && existing) {
      setName(existing.name);
      setColor(existing.color as typeof COLORS[number]);
      setLeadMonths(existing.lead_months);
      setDescription(existing.description);
      setResponsible(existing.responsible);
    } else {
      setName('');
      setColor(COLORS[0]);
      setLeadMonths(0);
      setDescription('');
      setResponsible('');
    }
    setConfirmDelete(false);
    setTimeout(() => nameRef.current?.focus(), 50);
  }, [dialog.projectId, dialog.mode]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (isEdit && existing) {
        await updateProject(existing.id, {
          name: name.trim(),
          color,
          lead_months: leadMonths,
          description,
          responsible,
        });
      } else if (dialog.prefill) {
        await createProject({
          name: name.trim(),
          color,
          lead_months: leadMonths,
          description,
          responsible,
          start_year: dialog.prefill.start_year,
          start_month: dialog.prefill.start_month,
          end_year: dialog.prefill.end_year,
          end_month: dialog.prefill.end_month,
          row_id: dialog.prefill.row_id,
          sort_order: 0,
        });
      }
      closeDialog();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    if (existing) {
      await deleteProject(existing.id);
      closeDialog();
    }
  };

  const dateRange = isEdit && existing
    ? `${formatMonth(existing.start_year, existing.start_month)} – ${formatMonth(existing.end_year, existing.end_month)}`
    : dialog.prefill
    ? `${formatMonth(dialog.prefill.start_year, dialog.prefill.start_month)} – ${formatMonth(dialog.prefill.end_year, dialog.prefill.end_month)}`
    : '';

  return (
    <div className="dialog-overlay" onClick={closeDialog}>
      <div className="dialog" onClick={e => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{isEdit ? 'Projekt bearbeiten' : 'Neues Projekt'}</h2>
          <button className="dialog-close" onClick={closeDialog}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2l12 12M14 2L2 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {dateRange && (
          <div className="dialog-date-range">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="2" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
              <path d="M1 5h12M4 1v2M10 1v2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            {dateRange}
          </div>
        )}

        <div className="dialog-body">
          <div className="form-group">
            <label>Name</label>
            <input
              ref={nameRef}
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Projektname..."
              onKeyDown={e => e.key === 'Enter' && handleSave()}
            />
          </div>

          <div className="form-group">
            <label>Farbe</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button
                  key={c}
                  className={`color-swatch ${color === c ? 'selected' : ''}`}
                  style={{ background: c }}
                  onClick={() => setColor(c)}
                  title={c}
                />
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Vorlaufzeit</label>
            <div className="lead-months-input">
              <input
                type="number"
                min={0}
                max={24}
                value={leadMonths}
                onChange={e => setLeadMonths(Math.max(0, parseInt(e.target.value) || 0))}
              />
              <span className="input-suffix">
                Monat{leadMonths !== 1 ? 'e' : ''} vor Projektstart
              </span>
            </div>
          </div>

          <div className="form-group">
            <label>Verantwortlich</label>
            <input
              type="text"
              value={responsible}
              onChange={e => setResponsible(e.target.value)}
              placeholder="Name(n)..."
            />
          </div>

          <div className="form-group">
            <label>Beschreibung</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Optionale Beschreibung..."
              rows={3}
            />
          </div>
        </div>

        <div className="dialog-footer">
          {isEdit && (
            <button
              className={`btn-danger ${confirmDelete ? 'confirm' : ''}`}
              onClick={handleDelete}
            >
              {confirmDelete ? 'Wirklich löschen?' : 'Löschen'}
            </button>
          )}
          <div className="dialog-footer-right">
            <button className="btn-secondary" onClick={closeDialog}>Abbrechen</button>
            <button
              className="btn-primary"
              onClick={handleSave}
              disabled={!name.trim() || saving}
            >
              {saving ? '...' : isEdit ? 'Speichern' : 'Erstellen'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
