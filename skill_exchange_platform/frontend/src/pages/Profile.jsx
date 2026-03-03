import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';
import PageContainer from '../components/ui/PageContainer';

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', email: '', availability: '' });

  useEffect(() => {
    if (!user) {
      console.log('[PROFILE] Not logged in, skipping profile fetch');
      setLoading(false);
      return;
    }
    const fetchProfile = async () => {
      try {
        console.log('[PROFILE] Fetching profile for user:', user.email);
        setLoading(true);
        const res = await axios.get('/profiles/me');
        console.log('[PROFILE] Profile fetched:', res.data);
        setProfile(res.data);
        setForm(res.data);
      } catch (err) {
        console.error('[PROFILE] Fetch error:', {
          status: err.response?.status,
          message: err.response?.data?.detail || err.message,
          user: user.email
        });
        setError('Unable to load profile');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('[PROFILE] Updating profile:', form);
      const res = await axios.put('/profiles/me', form);
      console.log('[PROFILE] Profile updated:', res.data);
      setProfile(res.data);
      setEditing(false);
    } catch (err) {
      console.error('[PROFILE] Update error:', {
        status: err.response?.status,
        message: err.response?.data?.detail || err.message
      });
      const msg = err.response?.data?.detail || 'Failed to update profile';
      setError(msg);
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </PageContainer>
    );
  }

  if (!user) {
    return (
      <PageContainer>
        <div className="bg-indigo-50 border border-indigo-200 text-indigo-800 px-6 py-5 rounded-2xl text-center">
          <p className="mb-3">View and manage your profile</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition"
          >
            Log In to Continue
          </a>
        </div>
      </PageContainer>
    );
  }

  const initial = profile?.name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1 text-sm">Manage your personal information and availability</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">
          {error}
        </div>
      )}

      {profile && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {editing ? (
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-5">Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Name
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Email
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="your@email.com"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Availability
                  </label>
                  <input
                    className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    placeholder="e.g., Weekdays 9-5, Weekends flexible"
                    value={form.availability}
                    onChange={e => setForm({ ...form, availability: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-2.5 mt-6 pt-5 border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium disabled:opacity-50 transition-colors duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  className="px-5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-lg font-medium disabled:opacity-50 transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Profile Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-8 text-white">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl font-bold">
                    {initial}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{profile.name}</h2>
                    <p className="text-indigo-200 text-sm">{profile.email}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="p-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Availability</h3>
                    <p className="text-gray-900 text-sm font-medium">
                      {profile.availability || 'Not specified'}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reputation</h3>
                    <p className="text-gray-900 text-sm font-medium">
                      {formatReputation(profile.reputation, profile.total_ratings)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 border border-gray-100 p-4">
                    <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Total Ratings</h3>
                    <p className="text-gray-900 text-sm font-medium">
                      {profile.total_ratings || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-5 border-t border-gray-100">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm rounded-lg font-medium transition-colors duration-200"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}
