import React, { useEffect, useState } from 'react';
import axios from '../api';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';

export default function Sessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [peerProfiles, setPeerProfiles] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) fetchSessions();
    else setLoading(false);
  }, [user]);

  const fetchSessions = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[SESSIONS] Fetching sessions...');
      const res = await axios.get('/sessions/me');
      console.log('[SESSIONS] Fetched:', res.data.length, 'sessions');
      setSessions(res.data);

      const peerIds = [
        ...new Set(
          res.data
            .map((session) => (session.user_a_id === user?.uid ? session.user_b_id : session.user_a_id))
            .filter(Boolean)
        ),
      ];

      if (peerIds.length > 0) {
        const profileResults = await Promise.all(
          peerIds.map(async (peerId) => {
            try {
              const profileRes = await axios.get(`/profiles/${peerId}`);
              return [peerId, profileRes.data];
            } catch {
              return [peerId, null];
            }
          })
        );
        setPeerProfiles(Object.fromEntries(profileResults));
      } else {
        setPeerProfiles({});
      }
    } catch (err) {
      console.error('[SESSIONS] Fetch error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (sessionId) => {
    try {
      console.log('[SESSIONS] Completing session:', sessionId);
      await axios.post(`/sessions/${sessionId}/complete`);
      console.log('[SESSIONS] Session completed');
      await fetchSessions();
    } catch (err) {
      console.error('[SESSIONS] Complete error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to complete session');
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Sessions</h1>
        <p className="text-gray-600 mt-2">Manage your active and completed skill exchange sessions</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!user && (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please <Link to="/login" className="underline font-medium">log in</Link> to view your sessions.
        </div>
      )}

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading sessions...</p>
        </div>
      ) : user ? (
        sessions.length > 0 ? (
          <div className="grid gap-4">
            {sessions.map(s => {
              const peerId = s.user_a_id === user?.uid ? s.user_b_id : s.user_a_id;
              const peerProfile = peerProfiles[peerId];
              const isActive = s.status === 'active';

              return (
                <div key={s.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {isActive ? '● Active' : '✓ Completed'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-lg font-medium text-gray-900">
                          <span className="text-blue-600">{s.skill_a}</span>
                          {' ↔ '}
                          <span className="text-green-600">{s.skill_b}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Partner:</span> {peerProfile?.name || 'Loading...'}
                        </p>
                        {peerProfile && (
                          <p className="text-sm text-gray-600">
                            {formatReputation(peerProfile.reputation, peerProfile.total_ratings)}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-4 md:mt-0 md:ml-4">
                      {isActive && (
                        <button
                          onClick={() => handleComplete(s.id)}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md text-sm font-medium transition-colors"
                        >
                          Mark Complete
                        </button>
                      )}
                      <Link to={`/chat/${s.id}`}>
                        <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                          💬 Open Chat
                        </button>
                      </Link>
                      {!isActive && (
                        <Link to={`/rating/${s.id}`}>
                          <button className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md text-sm font-medium transition-colors">
                            ⭐ Rate Partner
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
            <p className="text-gray-600 text-lg mb-2">No sessions yet</p>
            <p className="text-gray-500 text-sm mb-4">Start by sending skill exchange requests!</p>
            <Link to="/">
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium">
                Browse Skills
              </button>
            </Link>
          </div>
        )
      ) : null}
    </div>
  );
}
