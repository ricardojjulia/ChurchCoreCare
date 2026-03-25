import { useState, useEffect } from 'react';
import { fetchCounselor } from '../../lib/clientApi.js';
import CounselorDetailHeader from './CounselorDetailHeader.jsx';
import CounselorDetailTabs from './CounselorDetailTabs.jsx';

export default function CounselorDetailPage({ staffId, onBack, currentUser }) {
  const [counselor, setCounselor] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchCounselor(staffId)
      .then((payload) => {
        if (cancelled) return;
        const data = payload.item ?? payload;
        setCounselor(data);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [staffId]);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          color: '#62708b',
          fontSize: '15px',
          padding: '40px',
        }}
      >
        Loading counselor profile…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '40px', color: '#b42318', fontSize: '15px' }}>
        <p>Failed to load counselor: {error}</p>
        <button
          type="button"
          onClick={onBack}
          style={{
            marginTop: '16px',
            padding: '8px 16px',
            border: '1px solid #e1e8ed',
            borderRadius: '4px',
            background: '#fff',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          &#8592; Back to Counselors
        </button>
      </div>
    );
  }

  if (!counselor) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CounselorDetailHeader counselor={counselor} onBack={onBack} />
      <CounselorDetailTabs counselor={counselor} staffId={staffId} currentUser={currentUser} />
    </div>
  );
}
