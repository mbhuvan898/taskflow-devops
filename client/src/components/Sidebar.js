import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ categories, onAddCat }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="s-logo">
        <span className="s-logo-text">⚡ TaskFlow</span>
        <span className="aws-pill">AWS</span>
      </div>

      {/* User */}
      <div className="s-user">
        <div className="s-avatar">
          {user?.avatar_url
            ? <img src={user.avatar_url} alt="av" style={{ width:'100%',height:'100%',objectFit:'cover',borderRadius:'50%' }} />
            : user?.username?.[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth:0 }}>
          <div className="s-username">{user?.username}</div>
          <div className="s-email">{user?.email}</div>
        </div>
      </div>

      <div className="s-divider" />

      {/* Nav */}
      <nav className="s-nav">
        <NavLink to="/" end>📋 All Tasks</NavLink>
        <NavLink to="/analytics">📊 Analytics</NavLink>
        <NavLink to="/profile">👤 Profile</NavLink>
      </nav>

      <div className="s-divider" />

      {/* Categories */}
      <div className="s-section">
        <div className="s-sect-head">
          <span className="s-sect-label">Categories</span>
          <button className="s-add-btn" onClick={onAddCat} title="New category">＋</button>
        </div>
        {categories.map(c => (
          <NavLink key={c.id} to={`/?category=${c.id}`} className="s-cat">
            <span className="s-cat-icon" style={{ background: c.color + '28', color: c.color }}>{c.icon}</span>
            <span className="s-cat-name">{c.name}</span>
            <span className="s-cat-ct">{c.active ?? 0}</span>
          </NavLink>
        ))}
      </div>

      {/* Sign out */}
      <div className="s-bottom">
        <button
          className="btn btn-ghost"
          style={{ width:'100%', justifyContent:'center' }}
          onClick={() => { logout(); nav('/login'); }}
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}
