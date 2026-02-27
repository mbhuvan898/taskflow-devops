import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, NavLink } from 'react-router-dom';
import { todosAPI, catsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';
import Sidebar       from '../components/Sidebar';
import TodoCard      from '../components/TodoCard';
import TodoModal     from '../components/TodoModal';
import CategoryModal from '../components/CategoryModal';

const SORTS = [
  { v:'position',   l:'Manual' },
  { v:'created_at', l:'Date Added' },
  { v:'due_date',   l:'Due Date' },
  { v:'priority',   l:'Priority' },
];

export default function TodosPage() {
  const [todos,      setTodos]      = useState([]);
  const [cats,       setCats]       = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showTodo,   setShowTodo]   = useState(false);
  const [showCat,    setShowCat]    = useState(false);
  const [editTodo,   setEditTodo]   = useState(null);
  const [total,      setTotal]      = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [params,     setParams]     = useSearchParams();
  const { toast } = useToast();

  const search     = params.get('search')   || '';
  const filter     = params.get('filter')   || 'all';
  const sort       = params.get('sort')     || 'position';
  const categoryId = params.get('category') || '';

  const setP = (k,v) => {
    const n = new URLSearchParams(params);
    v ? n.set(k,v) : n.delete(k);
    setParams(n);
  };

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    try {
      const q = { sort, order: sort==='priority' ? 'DESC' : 'ASC' };
      if (search)     q.search      = search;
      if (categoryId) q.category_id = categoryId;
      if (filter==='active')  q.completed = false;
      if (filter==='done')    q.completed = true;
      if (filter==='overdue') q.overdue   = true;

      const { data } = await todosAPI.list(q);
      setTodos(data.todos);
      setTotal(data.total);
    } catch { toast('Failed to load tasks', 'error'); }
    setLoading(false);
  }, [search, filter, sort, categoryId]); // eslint-disable-line

  const fetchCats = async () => {
    try { const { data } = await catsAPI.list(); setCats(data); } catch {}
  };

  useEffect(() => { fetchTodos(); }, [fetchTodos]);
  useEffect(() => { fetchCats(); }, []);

  const handleToggle = async id => {
    try {
      const { data } = await todosAPI.toggle(id);
      setTodos(p => p.map(t => t.id===id ? {...t,...data} : t));
    } catch { toast('Update failed','error'); }
  };

  const handleSaved = todo => {
    setTodos(p => {
      const i = p.findIndex(t => t.id===todo.id);
      if (i>=0) { const n=[...p]; n[i]=todo; return n; }
      return [todo,...p];
    });
    setShowTodo(false);
    setEditTodo(null);
  };

  const handleDelete = id => setTodos(p => p.filter(t => t.id!==id));
  const handleEdit   = todo => { setEditTodo(todo); setShowTodo(true); };
  const openNew      = () => { setEditTodo(null); setShowTodo(true); };

  const done   = todos.filter(t=>t.completed).length;
  const active = todos.filter(t=>!t.completed).length;

  return (
    <div className="layout">
      <Sidebar
        categories={cats}
        onAddCat={() => setShowCat(true)}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="main page">
        {/* Header */}
        <div className="page-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Hamburger — hidden on desktop via CSS */}
            <button
              className="mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >☰</button>
            <div>
              <h1 className="page-title">My Tasks</h1>
              <p className="page-sub">
                <span style={{ color:'var(--lime)', fontFamily:'var(--mono)' }}>{active}</span> active ·{' '}
                <span style={{ fontFamily:'var(--mono)' }}>{done}</span> done ·{' '}
                <span style={{ fontFamily:'var(--mono)' }}>{total}</span> total
              </p>
            </div>
          </div>
          <button className="btn btn-primary" onClick={openNew}>＋ New Task</button>
        </div>

        {/* Controls */}
        <div style={{ display:'flex', gap:10, marginBottom:22, flexWrap:'wrap', alignItems:'center' }}>
          {/* Search */}
          <div style={{ position:'relative', flex:'1 1 200px', minWidth:160 }}>
            <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', pointerEvents:'none', fontSize:'.9rem' }}>🔍</span>
            <input style={{ paddingLeft:36 }} type="text" placeholder="Search tasks…"
              value={search} onChange={e => setP('search', e.target.value)} />
          </div>

          {/* Filter tabs */}
          <div style={{ display:'flex', gap:4, flexWrap:'wrap' }}>
            {['all','active','done','overdue'].map(f => (
              <button key={f} onClick={() => setP('filter',f)}
                style={{
                  background: filter===f ? 'rgba(212,242,68,.1)' : 'transparent',
                  border: `1px solid ${filter===f ? 'var(--lime)' : 'var(--border)'}`,
                  color: filter===f ? 'var(--lime)' : 'var(--text2)',
                  borderRadius:'var(--r-sm)', fontFamily:'var(--ff)', fontWeight:700,
                  fontSize:'.78rem', padding:'7px 13px', cursor:'pointer',
                  transition:'all var(--t)',
                }}>
                {f==='overdue'?'⚠️ ':''}{f.charAt(0).toUpperCase()+f.slice(1)}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select style={{ width:'auto', minWidth:130 }} value={sort} onChange={e => setP('sort',e.target.value)}>
            {SORTS.map(s => <option key={s.v} value={s.v}>{s.l}</option>)}
          </select>
        </div>

        {/* Task list */}
        {loading ? (
          <div style={{ display:'flex', justifyContent:'center', paddingTop:60 }}>
            <div className="spinner" style={{ width:32, height:32 }} />
          </div>
        ) : todos.length===0 ? (
          <div className="empty">
            <div className="ico">{filter==='done'?'🏆':'✅'}</div>
            <h3>{search ? `No results for "${search}"` : filter==='done' ? 'No completed tasks yet' : 'All clear!'}</h3>
            <p>{!search && filter==='all' && 'Click "+ New Task" to add your first task.'}</p>
          </div>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            {todos.map(t => (
              <TodoCard key={t.id} todo={t}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Mobile bottom nav */}
      <nav className="mobile-bottom-nav">
        <nav>
          <NavLink to="/" end>
            <span className="nav-icon">📋</span>Tasks
          </NavLink>
          <NavLink to="/analytics">
            <span className="nav-icon">📊</span>Analytics
          </NavLink>
          <NavLink to="/profile">
            <span className="nav-icon">👤</span>Profile
          </NavLink>
        </nav>
      </nav>

      {showTodo && (
        <TodoModal todo={editTodo} categories={cats}
          onClose={() => { setShowTodo(false); setEditTodo(null); }}
          onSaved={handleSaved} />
      )}
      {showCat && (
        <CategoryModal
          onClose={() => setShowCat(false)}
          onSaved={cat => { setCats(p=>[...p,cat]); setShowCat(false); }} />
      )}
    </div>
  );
}