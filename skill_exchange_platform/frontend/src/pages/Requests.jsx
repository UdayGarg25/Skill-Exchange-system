import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';

export default function Requests() {
  const { user } = useAuth();
  const [incoming, setIncoming] = useState([]);
  const [outgoing, setOutgoing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('incoming');
  const [userProfiles, setUserProfiles] = useState({});

  useEffect(() => {
    if (user) fetchRequests();
    else setLoading(false);
  }, [user]);

  const fetchRequests = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[REQUESTS] Fetching requests...');
      const [inRes, outRes] = await Promise.all([
        axios.get('/requests/incoming'),
        axios.get('/requests/outgoing'),
      ]);
      console.log('[REQUESTS] Fetched:', inRes.data.length, 'incoming,', outRes.data.length, 'outgoing');
      setIncoming(inRes.data);
      setOutgoing(outRes.data);
      
      // Fetch user profiles for all involved users
      const allUserIds = new Set();
      inRes.data.forEach(req => allUserIds.add(req.from_user_id));
      outRes.data.forEach(req => allUserIds.add(req.to_user_id));
      
      const profiles = {};
      await Promise.all(
        Array.from(allUserIds).map(async (uid) => {
          try {
            const res = await axios.get(`/profiles/${uid}`);
            profiles[uid] = res.data;
          } catch (err) {
            console.error(`[REQUESTS] Failed to fetch profile for ${uid}`);
          }
        })
      );
      setUserProfiles(profiles);
    } catch (err) {
      console.error('[REQUESTS] Fetch error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId) => {
    try {
      console.log('[REQUESTS] Accepting request:', requestId);
      const res = await axios.post(`/requests/${requestId}/accept`);
      console.log('[REQUESTS] Request accepted');
      // after acceptance a session is created server-side; redirect to sessions
      window.location.href = '/sessions';
      // fetchRequests();
    } catch (err) {
      console.error('[REQUESTS] Accept error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to accept request');
    }
  };

  const handleReject = async (requestId) => {
    try {
      console.log('[REQUESTS] Rejecting request:', requestId);
      await axios.post(`/requests/${requestId}/reject`);
      console.log('[REQUESTS] Request rejected');
      await fetchRequests();
    } catch (err) {
      console.error('[REQUESTS] Reject error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      setError('Failed to reject request');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Skill Exchange Requests</h1>
        <p className="text-gray-600 mt-2">Manage incoming and outgoing skill exchange requests</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {!user ? (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg text-center">
          <p className="mb-3">View and manage your skill exchange requests</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Log In to Continue
          </a>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow-md mb-6">
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('incoming')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'incoming'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Incoming ({incoming.length})
                </button>
                <button
                  onClick={() => setActiveTab('outgoing')}
                  className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === 'outgoing'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Outgoing ({outgoing.length})
                </button>
              </nav>
            </div>

            <div className="p-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              ) : (
                <>
                  {activeTab === 'incoming' && (
                    <>
                      {incoming.length > 0 ? (
                        <div className="space-y-4">
                          {incoming.map(req => {
                            const fromProfile = userProfiles[req.from_user_id];
                            return (
                              <div
                                key={req.id}
                                className="bg-gray-50 rounded-lg p-5 border border-gray-200 hover:border-blue-300 transition-colors"
                              >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="text-sm font-medium text-gray-500">From:</span>
                                      <span className="font-semibold text-gray-900">
                                        {fromProfile ? fromProfile.name : 'Loading...'}
                                      </span>
                                      {fromProfile && (
                                        <span className="text-xs text-gray-600">
                                          {formatReputation(fromProfile.reputation, fromProfile.total_ratings)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="space-y-1">
                                      <div className="text-sm">
                                        <span className="text-gray-600">They offer:</span>
                                        <span className="ml-2 font-medium text-green-700">{req.skill_offered}</span>
                                      </div>
                                      <div className="text-sm">
                                        <span className="text-gray-600">They want:</span>
                                        <span className="ml-2 font-medium text-blue-700">{req.skill_requested}</span>
                                      </div>
                                    </div>
                                    <div className="mt-2">
                                      <span
                                        className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                          req.status === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : req.status === 'accepted'
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}
                                      >
                                        {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                      </span>
                                    </div>
                                  </div>
                                  {req.status === 'pending' && (
                                    <div className="flex gap-3">
                                      <button
                                        onClick={() => handleAccept(req.id)}
                                        className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
                                      >
                                        ✓ Accept
                                      </button>
                                      <button
                                        onClick={() => handleReject(req.id)}
                                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md font-medium transition-colors"
                                      >
                                        ✗ Reject
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                          <p className="text-gray-600 text-lg mb-2">No incoming requests</p>
                          <p className="text-gray-500 text-sm">
                            When others request your skills, they will appear here
                          </p>
                        </div>
                      )}
                    </>
                  )}

                  {activeTab === 'outgoing' && (
                    <>
                      {outgoing.length > 0 ? (
                        <div className="space-y-4">
                          {outgoing.map(req => {
                            const toProfile = userProfiles[req.to_user_id];
                            return (
                              <div
                                key={req.id}
                                className="bg-gray-50 rounded-lg p-5 border border-gray-200"
                              >
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="text-sm font-medium text-gray-500">To:</span>
                                  <span className="font-semibold text-gray-900">
                                    {toProfile ? toProfile.name : 'Loading...'}
                                  </span>
                                  {toProfile && (
                                    <span className="text-xs text-gray-600">
                                      {formatReputation(toProfile.reputation, toProfile.total_ratings)}
                                    </span>
                                  )}
                                </div>
                                <div className="space-y-1 mb-2">
                                  <div className="text-sm">
                                    <span className="text-gray-600">You offered:</span>
                                    <span className="ml-2 font-medium text-green-700">{req.skill_offered}</span>
                                  </div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">You requested:</span>
                                    <span className="ml-2 font-medium text-blue-700">{req.skill_requested}</span>
                                  </div>
                                </div>
                                <div>
                                  <span
                                    className={`inline-block px-2 py-1 text-xs font-medium rounded ${
                                      req.status === 'pending'
                                        ? 'bg-yellow-100 text-yellow-800'
                                        : req.status === 'accepted'
                                        ? 'bg-green-100 text-green-800'
                                        : 'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
                          <p className="text-gray-600 text-lg mb-2">No outgoing requests</p>
                          <p className="text-gray-500 text-sm">
                            Browse skills and request exchanges to get started
                          </p>
                          <a
                            href="/"
                            className="inline-block mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
                          >
                            Browse Skills
                          </a>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
