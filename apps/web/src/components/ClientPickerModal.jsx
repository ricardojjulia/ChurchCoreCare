import { useState, useEffect, useRef } from 'react';

export default function ClientPickerModal({ isOpen, clients, loading, onSelectClient, onClose }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const normalized = query.toLowerCase().trim();
  const filtered = (clients || []).filter((c) => {
    const name = [c.first_name, c.last_name, c.preferred_name]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return !normalized || name.includes(normalized);
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet client-picker-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="panel-head">
          <h3>Open Client</h3>
          <button type="button" className="action-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <input
          ref={inputRef}
          type="search"
          className="auth-input client-picker-search"
          placeholder="Search by name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        {loading ? (
          <p className="um-muted">Loading clients…</p>
        ) : filtered.length === 0 ? (
          <p className="um-muted">{query ? 'No clients match your search.' : 'No clients found.'}</p>
        ) : (
          <ul className="client-picker-list">
            {filtered.map((c) => {
              const fullName = [c.first_name, c.last_name].filter(Boolean).join(' ') || `Client #${c.id}`;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className="client-picker-item"
                    onClick={() => {
                      onSelectClient(c.id);
                      onClose();
                    }}
                  >
                    <span className="client-picker-name">{fullName}</span>
                    {c.status && <span className="client-picker-status">{c.status}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
