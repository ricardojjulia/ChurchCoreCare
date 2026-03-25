import { useState } from 'react';
import { csrfHeaders } from '../lib/csrf.js';

// Client statuses from domain
const clientStatuses = ['active', 'waitlist', 'inactive', 'discharged'];

export default function ClientForm({ onSubmit, onCancel, initialClient = null }) {
  const [firstName, setFirstName] = useState(initialClient?.firstName ?? '');
  const [lastName, setLastName] = useState(initialClient?.lastName ?? '');
  const [faithBackground, setFaithBackground] = useState(initialClient?.faithBackground ?? 'Undeclared');
  const [status, setStatus] = useState(initialClient?.status ?? 'active');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) {
      setError('First and last name are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        faithBackground: faithBackground.trim() || 'Undeclared',
        status,
      };

      const url = initialClient ? `/api/v1/clients/${initialClient.id}` : '/api/v1/clients';
      const method = initialClient ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: csrfHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save client');
      }

      const result = await response.json();
      onSubmit(result.item || result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <label htmlFor="firstName">First Name *</label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="First name"
          disabled={loading}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label htmlFor="lastName">Last Name *</label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder="Last name"
          disabled={loading}
          required
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label htmlFor="faithBackground">Faith Background</label>
        <input
          id="faithBackground"
          type="text"
          value={faithBackground}
          onChange={(e) => setFaithBackground(e.target.value)}
          placeholder="e.g., Evangelical, Catholic, etc."
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        />
      </div>

      <div>
        <label htmlFor="status">Status</label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          disabled={loading}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          {clientStatuses.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p style={{ color: '#b42318', margin: 0, fontSize: '14px' }}>
          {error}
        </p>
      )}

      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          style={{
            padding: '8px 16px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            backgroundColor: '#0861ea',
            color: 'white',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          {loading ? 'Saving...' : initialClient ? 'Update Client' : 'Create Client'}
        </button>
      </div>
    </form>
  );
}
