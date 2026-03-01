import React, { useState } from 'react';

/* ── inline styles as fallback in case Tailwind classes aren't processed ── */
const overlayStyle = {
  position: 'fixed',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.5)',
  zIndex: 9999,
};

const cardStyle = {
  background: '#fff',
  borderRadius: '8px',
  padding: '1.5rem',
  width: '100%',
  maxWidth: '28rem',
  boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
};

export default function SendRequestModal({ skill, onClose, onSubmit }) {
  const [offerSkill, setOfferSkill] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[MODAL] Send clicked, offerSkill =', offerSkill);

    if (!offerSkill.trim()) {
      setError('Please enter a skill you will offer.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await onSubmit(offerSkill.trim());
      console.log('[MODAL] onSubmit resolved successfully');
      setSuccess('Request sent!');
      // auto-close after a short delay so the user sees the success
      setTimeout(() => onClose(), 800);
    } catch (err) {
      console.error('[MODAL] onSubmit error:', err);
      setError(err?.message || 'Failed to send request. See console for details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={overlayStyle}>
      <div style={cardStyle}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>
          Send request for "{skill.name}"
        </h3>

        {error && <div style={{ color: '#dc2626', marginBottom: '0.5rem' }}>{error}</div>}
        {success && <div style={{ color: '#16a34a', marginBottom: '0.5rem', fontWeight: 600 }}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.25rem' }}>
              Skill you will offer in exchange
            </label>
            <input
              type="text"
              value={offerSkill}
              onChange={(e) => setOfferSkill(e.target.value)}
              style={{ width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '0.5rem 0.75rem' }}
              placeholder="e.g. JavaScript, Design, …"
              disabled={loading || !!success}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              style={{ padding: '0.5rem 1rem', background: '#e5e7eb', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !!success}
              style={{
                padding: '0.5rem 1rem',
                background: loading ? '#93c5fd' : '#2563eb',
                color: '#fff',
                borderRadius: '4px',
                border: 'none',
                cursor: loading ? 'wait' : 'pointer',
              }}
            >
              {loading ? 'Sending…' : 'Send Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
