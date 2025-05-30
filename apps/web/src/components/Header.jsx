// src/components/Header.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './Header.css';

export default function Header() {
  const { user, logout } = useAuth();
  const isAuthenticated = !!user;
  const { pathname }   = useLocation();      // 현재 라우트 확인

  return (
    <header className="site-header">
      <Link to="/" className="site-brand">SPACE</Link>

      <nav className="nav-links">
        {isAuthenticated ? (
          <>
            {/* 간단 인사 */}
            <span className="user-greet">
              Hi, <strong>{user.name || user.email}</strong>
            </span>

            {/* 로그인 상태에서만 보이는 메뉴 */}
            <Link to="/bookings"     className="btn btn-outline">My Bookings</Link>
            <Link to="/create-space" className="btn btn-outline">List your space</Link>
            <Link to="/my-spaces"    className="btn btn-outline">My Spaces</Link>

            {/* 로그아웃 버튼 */}
            <button onClick={logout} className="btn btn-primary">Logout</button>
          </>
        ) : (
          /* 비로그인 상태일 때는 /login, /signup 화면을 제외하고 Login 링크만 */
          !['/login', '/signup'].includes(pathname) && (
            <Link to="/login" className="btn btn-primary">Login</Link>
          )
        )}
      </nav>
    </header>
  );
}