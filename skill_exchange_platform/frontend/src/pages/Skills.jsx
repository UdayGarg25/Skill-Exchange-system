import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import SendRequestModal from '../components/SendRequestModal';
import { formatReputation } from '../utils/formatReputation';

export default function Skills() {
  const { user } = useAuth();
  const [skills, setSkills] = useState([]);
  const [ownerProfiles, setOwnerProfiles] = useState({});
  const [search, setSearch] = useState('');
  const [newSkill, setNewSkill] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestingSkill, setRequestingSkill] = useState(null); // skill to request
  const [reqLoading, setReqLoading] = useState(false);

  const fetchSkills = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[SKILLS] Fetching skills...');
      const res = await axios.get('/skills', { params: { name: search } });
      console.log('[SKILLS] Fetched:', res.data.length, 'skills');
      setSkills(res.data);

      const ownerIds = [...new Set(res.data.map(s => s.owner_id).filter(Boolean))];
      if (ownerIds.length > 0) {
        const profileResults = await Promise.all(
          ownerIds.map(async (ownerId) => {
            try {
              const profileRes = await axios.get(`/profiles/${ownerId}`);
              return [ownerId, profileRes.data];
            } catch {
              return [ownerId, null];
            }
          })
        );
        setOwnerProfiles(Object.fromEntries(profileResults));
      } else {
        setOwnerProfiles({});
      }
    } catch (e) {
      console.error('[SKILLS] Fetch error:', {
        status: e.response?.status,
        message: e.response?.data?.detail || e.message,
        url: e.config?.url
      });
      setError('Unable to load skills');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSkills();
  }, []);

  const addSkill = async () => {
    if (!newSkill.trim()) return;
    setLoading(true);
    setError('');
    try {
      console.log('[SKILLS] Adding skill:', newSkill, 'Auth:', user ? 'YES' : 'NO');
      await axios.post('/skills', { name: newSkill });
      console.log('[SKILLS] Skill added successfully');
      setNewSkill('');
      await fetchSkills();
    } catch (e) {
      console.error('[SKILLS] Add skill error:', {
        status: e.response?.status,
        message: e.response?.data?.detail || e.message,
        url: e.config?.url,
        auth: user ? 'YES' : 'NO'
      });
      setError('Failed to add skill');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Available Skills</h1>
        <p className="text-gray-600 mt-2">Discover skills and connect with talented individuals</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search for a skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchSkills()}
          />
          <button
            onClick={fetchSkills}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading skills...</p>
        </div>
      ) : (
        <>
          {skills.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {skills.map((s) => {
                const ownerProfile = ownerProfiles[s.owner_id];
                return (
                  <div
                    key={s.id}
                    className="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-shadow"
                  >
                    <div className="mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{s.name}</h3>
                      {s.description && (
                        <p className="text-sm text-gray-600 mt-1">{s.description}</p>
                      )}
                    </div>

                    {ownerProfile && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-sm text-gray-700">
                          <span className="font-medium">Offered by:</span> {ownerProfile.name}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {formatReputation(ownerProfile.reputation, ownerProfile.total_ratings)}
                        </p>
                      </div>
                    )}

                    {user && s.owner_id !== user.uid ? (
                      <button
                        className="w-full px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-md font-medium transition-colors"
                        onClick={() => setRequestingSkill(s)}
                      >
                        Request Exchange
                      </button>
                    ) : user && s.owner_id === user.uid ? (
                      <div className="text-center py-2 text-sm text-gray-500 font-medium">
                        Your skill
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <p className="text-gray-600 text-lg mb-2">No skills found</p>
              <p className="text-gray-500 text-sm">Try a different search or add a new skill below</p>
            </div>
          )}
        </>
      )}

      {requestingSkill && (
        <SendRequestModal
          skill={requestingSkill}
          onClose={() => setRequestingSkill(null)}
          onSubmit={async (offer) => {
            const payload = {
              to_user_id: requestingSkill.owner_id,
              skill_offered: offer,
              skill_requested: requestingSkill.name,
            };
            try {
              await axios.post('/requests', payload);
            } catch (err) {
              const detail = err.response?.data?.detail || err.message || 'Unknown error';
              throw new Error(detail);
            }
          }}
        />
      )}

      {user ? (
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Your Skill</h3>
          <div className="flex flex-col md:flex-row gap-3">
            <input
              className="flex-1 border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter skill name (e.g., Python Programming)"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addSkill()}
            />
            <button
              onClick={addSkill}
              disabled={loading || !newSkill.trim()}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
            >
              Add Skill
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-8 bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg text-center">
          <p className="mb-3">Want to share your skills?</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Log In to Add Skills
          </a>
        </div>
      )}
    </div>
  );
}
