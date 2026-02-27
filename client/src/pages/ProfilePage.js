import React, { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { authAPI, catsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';

export default function ProfilePage() {
  const { user, refresh } = useAuth();
  const { toast }         = useToast();
  const [cats, setCats]   = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  useEffect(() => { catsAPI.list().then(({data})=>setCats(data)); }, []);

  const handleAvatar = async e => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    try {
      await authAPI.uploadAvatar(file);
      await refresh();
      toast('Avatar updated ✓', 'success');
    } catch { toast('Upload failed', 'error'); }
    setUploading(false);
  };

  const deleteCat = async id => {
    if (!window.confirm('Delete category? Todos will be uncategorized.')) return;
    try {
      await catsAPI.remove(id);
      setCats(p => p.filter(c=>c.id!==id));
      toast('Category deleted','info');
    } catch { toast('Delete failed','error'); }
  };

  return (
    <div className="layout">
      <Sidebar categories={cats} onAddCat={() => {}} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main page" style={{ maxWidth:680 }}>
        <div className="page-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
            <div>
              <h1 className="page-title">Profile</h1>
              <p className="page-sub">Manage your account and categories</p>
            </div>
          </div>
        </div>

        {/* User card */}
        <div className="card fade-up" style={{ marginBottom:16 }}>
          <div style={{ display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
            <div style={{ position:'relative' }}>
              <div style={{ width:82, height:82, borderRadius:'50%', background:'var(--surface2)',
                border:'3px solid var(--lime)', display:'grid', placeItems:'center', overflow:'hidden' }}>
                {user?.avatar_url
                  ? <img src={user.avatar_url} alt="av" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                  : <span style={{ fontSize:'2rem', fontWeight:800, color:'var(--lime)' }}>{user?.username?.[0]?.toUpperCase()}</span>
                }
              </div>
              <button
                title="Upload avatar to S3"
                onClick={() => fileRef.current.click()}
                disabled={uploading}
                style={{ position:'absolute', bottom:0, right:0, background:'var(--surface)',
                  border:'2px solid var(--border)', borderRadius:'50%',
                  width:26, height:26, display:'grid', placeItems:'center',
                  cursor:'pointer', fontSize:'.75rem' }}>
                {uploading ? '…' : '📷'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleAvatar} />
            </div>

            <div>
              <h2 style={{ fontSize:'1.4rem', fontWeight:800, letterSpacing:'-.03em', marginBottom:3 }}>{user?.username}</h2>
              <p style={{ color:'var(--text2)', fontSize:'.88rem' }}>{user?.email}</p>
              <div style={{ display:'flex', gap:18, marginTop:12, flexWrap:'wrap' }}>
                {[
                  ['Tasks',    user?.total_todos,   'var(--sky)'],
                  ['Done',     user?.done_todos,     'var(--emerald)'],
                  ['Overdue',  user?.overdue_todos,  'var(--rose)'],
                ].map(([l,v,c]) => (
                  <div key={l}>
                    <div style={{ fontFamily:'var(--mono)', fontSize:'1.15rem', fontWeight:700, color:c }}>{v ?? 0}</div>
                    <div style={{ fontSize:'.65rem', color:'var(--text3)', textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="card fade-up" style={{ marginBottom:16 }}>
          <div className="card-title">📂 Categories</div>
          {cats.map(c => (
            <div key={c.id} style={{ display:'flex', alignItems:'center', gap:12,
              padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:34, height:34, borderRadius:8, display:'grid', placeItems:'center',
                background:c.color+'22', color:c.color, fontSize:'1rem', flexShrink:0 }}>
                {c.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:'.88rem' }}>{c.name}</div>
                <div style={{ fontSize:'.68rem', color:'var(--text3)', fontFamily:'var(--mono)' }}>
                  {c.total} tasks · {c.active} active
                </div>
              </div>
              <div style={{ width:10, height:10, borderRadius:'50%', background:c.color, flexShrink:0 }} />
              <button className="btn btn-danger btn-sm" onClick={() => deleteCat(c.id)}>Delete</button>
            </div>
          ))}
        </div>

        {/* AWS info */}
        <div className="card fade-up" style={{ background:'rgba(212,242,68,.04)', borderColor:'rgba(212,242,68,.18)' }}>
          <div className="card-title" style={{ color:'var(--lime)' }}>☁️ AWS Integration Status</div>
          <div style={{ display:'flex', gap:24, flexWrap:'wrap' }}>
            {[
              ['Database',     'Amazon RDS (PostgreSQL)', 'var(--emerald)'],
              ['File Storage', 'Amazon S3',               'var(--sky)'],
              ['Auth',         'JWT + bcrypt',            'var(--violet)'],
            ].map(([l,v,c]) => (
              <div key={l}>
                <div style={{ fontSize:'.65rem', color:'var(--text3)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:3 }}>{l}</div>
                <div style={{ fontFamily:'var(--mono)', fontSize:'.82rem', color:c }}>{v}</div>
              </div>
            ))}
          </div>
        </div>
      </main>
      <nav className="mobile-bottom-nav">
        <nav>
          <NavLink to="/" end><span className="nav-icon">📋</span>Tasks</NavLink>
          <NavLink to="/analytics"><span className="nav-icon">📊</span>Analytics</NavLink>
          <NavLink to="/profile"><span className="nav-icon">👤</span>Profile</NavLink>
        </nav>
      </nav>
    </div>
  );
}