import React, { useEffect, useState } from 'react';
import axios from '../api';
import { useAuth } from '../AuthContext';
import { formatReputation } from '../utils/formatReputation';

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
      setError('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-lg text-center">
          <p className="mb-3">View and manage your profile</p>
          <a
            href="/login"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium"
          >
            Log In to Continue
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-2">Manage your personal information and availability</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {profile && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {editing ? (
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Edit Profile</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Name
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Your name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="your@email.com"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <input
                    className="w-full border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Weekdays 9-5, Weekends flexible"
                    value={form.availability}
                    onChange={e => setForm({ ...form, availability: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setEditing(false)}
                  disabled={loading}
                  className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md font-medium disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-8 text-white">
                <h2 className="text-2xl font-bold mb-2">{profile.name}</h2>
                <p className="text-blue-100">{profile.email}</p>
              </div>
              <div className="p-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Availability</h3>
                    <p className="text-gray-900">
                      {profile.availability || 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Reputation</h3>
                    <p className="text-gray-900 font-medium">
                      {formatReputation(profile.reputation, profile.total_ratings)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setEditing(true)}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition-colors"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
