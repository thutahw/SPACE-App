// src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

export default function Header() {
  // TODO: 실제 인증 로직으로 교체
  const isAuthenticated = false;
  const { pathname } = useLocation();   // 현재 경로 확인

  return (
    <header className="site-header">
      <Link to="/" className="site-brand">SPACE</Link>

      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            <Link to="/bookings"     className="btn btn-outline">My Bookings</Link>
            <Link to="/create-space" className="btn btn-outline">List your space</Link>
            <Link to="/my-spaces"    className="btn btn-outline">My Spaces</Link>
            <button className="btn btn-primary">Logout</button>
          </>
        ) : (
          /* 로그인 안 된 경우 ⇒ 링크 하나만 */
          pathname !== '/login' && (
            <Link to="/login" className="btn btn-primary">Login</Link>
          )
        )}
      </nav>
    </header>
  );
}