import React from 'react';
import { useAuth } from '../AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { loginWithGoogle, loginDev, loading, user } = useAuth();
  const [error, setError] = React.useState('');

  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleGoogle = async () => {
    setError('');
    try {
      await loginWithGoogle();
      // signInWithRedirect will navigate away; on return the auth listener
      // and getRedirectResult will update state and navigate via the effect
    } catch (err) {
      console.error(err);
      setError('Google sign-in failed.');
    }
  };

  const handleDev = () => {
    loginDev();
    navigate('/');
  };

  return (
    <div className="page-container">
      <h2>Login / Signup</h2>
      {error && <div className="error-message">{error}</div>}
      <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
        <button onClick={handleGoogle} disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          {loading ? 'Signing in...' : 'Sign in with Google'}
        </button>
        <button onClick={handleDev} disabled={loading} className="px-4 py-2 bg-gray-500 text-white rounded disabled:opacity-50">
          {loading ? '...' : 'Use dev login'}
        </button>
      </div>
      <p className="mt-4 text-gray-600">
        Use your Google account to authenticate. The dev button sets a simple token for local testing.
      </p>
    </div>
  );
}
