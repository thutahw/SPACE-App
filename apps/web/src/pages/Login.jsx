import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const Login = () => {
  const { login } = useAuth();
  const history = useHistory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await fetch('http://localhost:4000/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error || 'Login failed');
    } else {
      login(data); // Save user in AuthContext
      history.push('/');
    }
  } catch (err) {
    setError('Login failed');
  }
};


  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Login</h2>
      <form onSubmit={handleLogin}>
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        <label>Password:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: '1rem' }}
        />

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ padding: '0.5rem 1rem' }}>
          Login
        </button>
        <p style={{ marginTop: '1rem' }}>
          Don’t have an account?{' '}
          <a href="/signup" style={{ color: '#004aad', textDecoration: 'underline' }}>
            Sign up here
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
