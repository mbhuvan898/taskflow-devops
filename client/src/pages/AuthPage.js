import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function AuthPage() {
  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username:'', email:'', password:'' });
  const { login, register } = useAuth();
  const { toast } = useToast();
  const nav = useNavigate();

  const set = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const submit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast('Welcome back! 👋', 'success');
      } else {
        await register(form.username, form.email, form.password);
        toast('Account created! Default categories added.', 'success');
      }
      nav('/');
    } catch (err) {
      const msg = err.response?.data?.errors?.[0]?.msg
        || err.response?.data?.error
        || 'Authentication failed';
      toast(msg, 'error');
    }
    setLoading(false);
  };

  return (
    <div className="auth-bg">
      <div className="auth-card">
        {/* Logo */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:28 }}>
          <span style={{ fontSize:'1.6rem' }}>⚡</span>
          <span style={{ fontWeight:800, fontSize:'1.4rem', letterSpacing:'-.05em', color:'var(--lime)' }}>
            TaskFlow
          </span>
        </div>

        <h2 style={{ fontSize:'1.45rem', fontWeight:800, letterSpacing:'-.04em', marginBottom:5 }}>
          {mode==='login' ? 'Sign in to continue' : 'Create your account'}
        </h2>
        <p style={{ color:'var(--text2)', fontSize:'.82rem', marginBottom:26 }}>
          {mode==='login'
            ? 'Tasks stored in Amazon RDS · Files in Amazon S3'
            : 'All your tasks sync to AWS — secure and fast'}
        </p>

        <form onSubmit={submit}>
          {mode==='register' && (
            <div className="form-group">
              <label>Username</label>
              <input type="text" placeholder="yourname" value={form.username}
                onChange={set('username')} required minLength={3} />
            </div>
          )}
          <div className="form-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email}
              onChange={set('email')} required />
          </div>
          <div className="form-group" style={{ marginBottom:22 }}>
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password}
              onChange={set('password')} required minLength={6} />
          </div>

          <button type="submit" className="btn btn-primary"
            style={{ width:'100%', justifyContent:'center', padding:13 }}
            disabled={loading}>
            {loading
              ? <span className="spinner" style={{ width:16, height:16 }} />
              : mode==='login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:18, justifyContent:'center' }}>
          <span style={{ color:'var(--text3)', fontSize:'.82rem' }}>
            {mode==='login' ? "Don't have an account?" : 'Already have an account?'}
          </span>
          <button
            style={{ background:'none', border:'none', cursor:'pointer', color:'var(--lime)',
              fontFamily:'var(--ff)', fontWeight:700, fontSize:'.82rem' }}
            onClick={() => setMode(m => m==='login'?'register':'login')}>
            {mode==='login' ? 'Register' : 'Sign In'}
          </button>
        </div>
      </div>
    </div>
  );
}
