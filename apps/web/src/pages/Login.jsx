// apps/web/src/pages/Login.jsx
import React, { useState } from 'react';
import { useHistory, Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import '../styles/Login.css';          // ✨ 필요한 경우 styles/Login.css 생성

const Login = () => {
  const { login }  = useAuth();
  const history    = useHistory();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  // 환경변수(없으면 로컬 기본값)
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const res  = await fetch(`${apiBaseUrl}/users/login`, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Login failed');
        return;
      }

      login(data);          // AuthContext에 사용자 저장
      history.push('/');    // 홈으로 이동
    } catch (err) {
      console.error(err);
      setError('Login failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Login</h2>

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && <p className="login-error">{error}</p>}

          <button type="submit" className="login-btn">Login</button>

          <p className="login-footer">
            Don’t have an account?{' '}
            <Link to="/signup" className="signup-link">Sign up here</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;