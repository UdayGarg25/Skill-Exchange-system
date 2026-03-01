import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { auth, googleProvider } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const API_URL = 'http://127.0.0.1:8000';
const AuthContext = createContext();

// Setup axios base URL once at module level
axios.defaults.baseURL = API_URL;

// Track whether interceptors have been installed (module-level flag)
let interceptorsInstalled = false;

function installInterceptors() {
  if (interceptorsInstalled) return;
  interceptorsInstalled = true;

  // Ensure URLs end with trailing slash to prevent 307 redirects that strip
  // the Authorization header.  Only touch relative/API paths, not full URLs.
  axios.interceptors.request.use(config => {
    if (config.url && !config.url.includes('?') && !config.url.endsWith('/')) {
      config.url = config.url + '/';
    }
    const tkn = config.headers?.Authorization?.split(' ')[1] || '';
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
      baseURL: config.baseURL,
      hasAuth: config.headers?.Authorization ? 'YES' : 'NO',
      tokenLength: tkn.length,
    });
    return config;
  });

  // Response interceptor with comprehensive error logging
  axios.interceptors.response.use(
    response => {
      console.log(`[API] ${response.status} ${response.config.url}`);
      return response;
    },
    error => {
      const status = error.response?.status;
      const detail = error.response?.data?.detail || error.message;
      console.error(`[API] Error ${status || 'NETWORK'}: ${error.config?.url}`, {
        detail,
        data: error.response?.data,
      });
      return Promise.reject(error);
    }
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Install interceptors exactly once
  installInterceptors();

  // simple helper to inspect JWT payload for debugging
  const decodeJwt = (token) => {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (e) {
      return null;
    }
  };

  // we no longer create profiles manually; backend /profiles/me will auto-generate one if missing
  const ensureProfile = async () => {
    try {
      console.log('[PROFILE] Fetching my profile');
      const res = await axios.get('/profiles/me');
      console.log('[PROFILE] Profile data:', res.data);
      return res.data;
    } catch (err) {
      // if even the auto-create failed, log but don't crash
      console.error('[PROFILE] Unable to fetch profile:', err.response?.data || err.message);
      return null;
    }
  };

  useEffect(() => {
    console.log('[AUTH] Setting up onAuthStateChanged listener');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('[AUTH] onAuthStateChanged fired, user =', firebaseUser);
      try {
        if (firebaseUser) {
          console.log('[AUTH] Firebase user logged in:', firebaseUser.email);
          const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
          console.log('[AUTH] Got Firebase token:', idToken ? 'YES' : 'NO');
          if (idToken) console.log('[AUTH] token payload:', decodeJwt(idToken));
          
          setUser(firebaseUser);
          setToken(idToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
          
          // fetch profile (server will auto-create if necessary)
          await ensureProfile();
        } else {
          // Check for dev token
          const devToken = localStorage.getItem('dev_token');
          if (devToken) {
            console.log('[AUTH] Using persisted dev token');
            const devUser = { email: 'dev@localhost', displayName: 'Developer', uid: 'dev' };
            setUser(devUser);
            setToken(devToken);
            axios.defaults.headers.common['Authorization'] = `Bearer ${devToken}`;
            // fetch dev profile
            await ensureProfile();
          } else {
            console.log('[AUTH] No user logged in');
            setUser(null);
            setToken(null);
            delete axios.defaults.headers.common['Authorization'];
          }
        }
      } catch (err) {
        console.error('[AUTH] Error in auth state change:', err);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Popup-based sign-in
  const loginWithGoogle = async () => {
    console.log('[AUTH] Starting Google sign-in via popup');
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;
      console.log('[AUTH] Popup login succeeded:', firebaseUser.email);
      
      const idToken = await firebaseUser.getIdToken(/* forceRefresh */ true);
      console.log('[AUTH] Got Firebase token from popup:', idToken ? 'YES' : 'NO');
      if (idToken) console.log('[AUTH] token payload:', decodeJwt(idToken));
      
      setUser(firebaseUser);
      setToken(idToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${idToken}`;
      
      // fetch or create profile
      await ensureProfile();
    } catch (err) {
      console.error('[AUTH] Google popup sign-in failed:', err);
      const code = err.code || 'unknown';
      const message = err.message || 'no message';
      alert(`Google sign-in error (${code}): ${message}`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginDev = (token = 'dev') => {
    console.log('[AUTH] Logging in with dev token');
    localStorage.setItem('dev_token', token);
    const devUser = { email: 'dev@localhost', displayName: 'Developer', uid: 'dev' };
    setUser(devUser);
    setToken(token);
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('[AUTH] Dev token set successfully');
  };

  const logout = async () => {
    console.log('[AUTH] Logging out');
    localStorage.removeItem('dev_token');
    setUser(null);
    setToken(null);
    delete axios.defaults.headers.common['Authorization'];
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, token, loginWithGoogle, loginDev, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
