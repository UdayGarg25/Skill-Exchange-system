import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';

export default function Rating() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [session, setSession] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [score, setScore] = useState(5);
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!sessionId || !user) return;

    const fetchSessionData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch session details
        const sessionRes = await axios.get(`/sessions/me`);
        const foundSession = sessionRes.data.find(s => s.id === sessionId);
        
        if (!foundSession) {
          setError('Session not found');
          setLoading(false);
          return;
        }

        if (foundSession.status !== 'completed') {
          setError('Session must be completed before rating');
          setLoading(false);
          return;
        }

        setSession(foundSession);

        // Determine peer
        const peerId = foundSession.user_a_id === user.uid 
          ? foundSession.user_b_id 
          : foundSession.user_a_id;

        // Fetch peer profile
        const profileRes = await axios.get(`/profiles/${peerId}`);
        setPeerProfile(profileRes.data);
      } catch (err) {
        console.error('[RATING] Fetch error:', err);
        setError('Failed to load session details');
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [sessionId, user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session || !peerProfile) return;

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      await axios.post('/ratings', {
        session_id: sessionId,
        ratee_id: peerProfile.id,
        score: parseInt(score),
        feedback: feedback.trim() || undefined,
      });

      setSuccess('Rating submitted successfully!');
      
      // Navigate back to sessions after 2 seconds
      setTimeout(() => {
        navigate('/sessions');
      }, 2000);
    } catch (err) {
      console.error('[RATING] Submission error:', err);
      const detail = err.response?.data?.detail;
      if (detail === 'Already rated') {
        setError('You have already rated this session');
      } else {
        setError(`Failed to submit rating: ${detail || 'Unknown error'}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!sessionId) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          <p>Please select a completed session from the <Link to="/sessions" className="underline font-medium">Sessions</Link> page to rate your partner.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">Loading session details...</p>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <Link to="/sessions">
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
            ← Back to Sessions
          </button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link to="/sessions" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
          ← Back to Sessions
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-2">Rate Your Partner</h1>
        <p className="text-gray-600 mt-2">Share your experience with your skill exchange partner</p>
      </div>

      {session && peerProfile && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Session Details</h2>
            <div className="space-y-2">
              <p className="text-gray-700">
                <span className="font-medium">Skills Exchanged:</span>{' '}
                <span className="text-blue-600">{session.skill_a}</span> ↔{' '}
                <span className="text-green-600">{session.skill_b}</span>
              </p>
              <p className="text-gray-700">
                <span className="font-medium">Partner:</span> {peerProfile.name}
              </p>
              <p className="text-gray-600 text-sm">
                {formatReputation(peerProfile.reputation, peerProfile.total_ratings)}
              </p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
          {success}
          <p className="text-sm mt-1">Redirecting to sessions...</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating (1-5 stars)
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                className={`text-3xl transition-colors ${
                  star <= score ? 'text-yellow-400' : 'text-gray-300'
                } hover:text-yellow-400`}
              >
                ★
              </button>
            ))}
            <span className="ml-3 text-lg font-medium text-gray-700">{score}/5</span>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Feedback (Optional)
          </label>
          <textarea
            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your experience with this skill exchange..."
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows="5"
          />
        </div>

        <button
          type="submit"
          disabled={submitting || success}
          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {submitting ? 'Submitting...' : success ? 'Rating Submitted!' : 'Submit Rating'}
        </button>
      </form>
    </div>
  );
}
