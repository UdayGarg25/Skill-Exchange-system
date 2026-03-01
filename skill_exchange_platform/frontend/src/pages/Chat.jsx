import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from '../api';
import { useAuth } from '../AuthContext';

export default function Chat() {
  const { sessionId } = useParams();
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [session, setSession] = useState(null);
  const [peerProfile, setPeerProfile] = useState(null);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);
  const fetchedRef = useRef(false);

  // ── load session details and history on mount ──
  useEffect(() => {
    if (!sessionId || !user || !token) return;
    if (fetchedRef.current) return;
    fetchedRef.current = true;

    const loadData = async () => {
      setLoading(true);
      setError('');
      try {
        // Fetch session details
        const sessionRes = await axios.get(`/sessions/me`);
        const foundSession = sessionRes.data.find(s => s.id === sessionId);
        
        if (foundSession) {
          setSession(foundSession);
          
          // Fetch peer profile
          const peerId = foundSession.user_a_id === user.uid 
            ? foundSession.user_b_id 
            : foundSession.user_a_id;
          
          try {
            const profileRes = await axios.get(`/profiles/${peerId}`);
            setPeerProfile(profileRes.data);
          } catch (err) {
            console.error('[CHAT] Failed to load peer profile:', err);
          }
        }

        // Load messages
        const messagesRes = await axios.get(`/sessions/${sessionId}/messages`);
        setMessages(messagesRes.data);
      } catch (err) {
        console.error('[CHAT] Load error:', err.response?.data || err.message);
        const detail = err.response?.data?.detail;
        const msg = Array.isArray(detail)
          ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
          : detail || 'Failed to load chat';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    loadData();

    return () => { fetchedRef.current = false; };
  }, [sessionId, user, token]);

  // auto-scroll to bottom whenever messages update
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── poll for new messages every 3 seconds ──
  useEffect(() => {
    if (!sessionId || !user || !token) return;

    const interval = setInterval(async () => {
      try {
        const res = await axios.get(`/sessions/${sessionId}/messages`);
        setMessages(res.data);
      } catch (err) {
        console.error('[CHAT] Poll error:', err.message);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [sessionId, user, token]);

  // ── send message via REST ──
  const handleSend = async () => {
    if (!text.trim() || sending) return;
    const msgText = text.trim();
    setText('');
    setSending(true);
    setError('');

    try {
      const res = await axios.post(`/sessions/${sessionId}/messages`, {
        message_text: msgText,
      });
      setMessages(prev => [...prev, res.data]);
    } catch (err) {
      console.error('[CHAT] Send error:', err.response?.data || err.message);
      const detail = err.response?.data?.detail;
      const msg = Array.isArray(detail)
        ? detail.map(d => d.msg || JSON.stringify(d)).join('; ')
        : detail || 'Failed to send message';
      setError(msg);
      setText(msgText);
    } finally {
      setSending(false);
    }
  };

  const myUid = user?.uid;

  // ── render ──
  if (!sessionId) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please select a session from the <Link to="/sessions" className="underline font-medium">Sessions</Link> page to start chatting.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
          Please <Link to="/login" className="underline font-medium">log in</Link> to join this chat.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Chat Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <Link to="/sessions" className="text-blue-100 hover:text-white text-sm mb-2 inline-block">
            ← Back to Sessions
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold">
                {peerProfile ? `Chat with ${peerProfile.name}` : 'Chat'}
              </h1>
              {session && (
                <p className="text-sm text-blue-100 mt-1">
                  <span className="text-blue-200">{session.skill_a}</span> ↔{' '}
                  <span className="text-green-200">{session.skill_b}</span>
                </p>
              )}
            </div>
            {session && (
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                session.status === 'active' 
                  ? 'bg-green-500 text-white' 
                  : 'bg-gray-200 text-gray-800'
              }`}>
                {session.status === 'active' ? '● Active' : '✓ Completed'}
              </span>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-b border-red-200 text-red-700 px-6 py-3">
            {error}
          </div>
        )}

        {/* Message Area */}
        <div className="h-96 overflow-y-auto p-6 bg-gray-50">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="mt-2 text-gray-600">Loading messages...</p>
              </div>
            </div>
          ) : messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map((m, idx) => {
                const isOwn = m.sender_uid === myUid;
                return (
                  <div
                    key={m.id || idx}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                        isOwn
                          ? 'bg-blue-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}
                    >
                      <div className="text-xs opacity-75 mb-1">
                        {isOwn ? 'You' : peerProfile?.name || 'Partner'}
                        {m.timestamp && (
                          <span className="ml-2">
                            {new Date(m.timestamp).toLocaleTimeString([], { 
                              hour: '2-digit', 
                              minute: '2-digit' 
                            })}
                          </span>
                        )}
                      </div>
                      <div className="text-sm">{m.message_text}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={bottomRef} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation!</p>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-4 bg-white">
          <div className="flex space-x-2">
            <input
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={sending}
            />
            <button
              onClick={handleSend}
              disabled={!text.trim() || sending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">Press Enter to send</p>
        </div>
      </div>
    </div>
  );
}
