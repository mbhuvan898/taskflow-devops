import React, { useState } from 'react';
import { todosAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

function fmtDate(d) {
  if (!d) return null;
  return new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric' });
}
function isOverdue(d, done) {
  if (!d || done) return false;
  return new Date(d) < new Date(new Date().toDateString());
}
function isToday(d) {
  if (!d) return false;
  return new Date(d).toDateString() === new Date().toDateString();
}

const P_COLOR = { low:'var(--emerald)', medium:'var(--sky)', high:'var(--amber)', urgent:'var(--rose)' };

export default function TodoCard({ todo, onToggle, onEdit, onDelete }) {
  const [del, setDel] = useState(false);
  const { toast } = useToast();

  const overdue = isOverdue(todo.due_date, todo.completed);
  const today   = isToday(todo.due_date);

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    setDel(true);
    try {
      await todosAPI.remove(todo.id);
      onDelete(todo.id);
      toast('Task deleted', 'info');
    } catch { toast('Delete failed', 'error'); }
    setDel(false);
  };

  return (
    <div className="fade-up" style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${P_COLOR[todo.priority] || 'var(--sky)'}`,
      borderRadius: 'var(--r)',
      padding: '13px 16px',
      display: 'flex',
      alignItems: 'flex-start',
      gap: 12,
      opacity: todo.completed ? .58 : 1,
      transition: 'opacity var(--t), border-color var(--t)',
    }}>
      {/* Checkbox */}
      <div className={`cb ${todo.completed ? 'on' : ''}`} onClick={() => onToggle(todo.id)}>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M1.5 5.5l3 3 5-5" stroke="#050608" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Body */}
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{
          fontWeight: 600, fontSize: '.9rem', lineHeight: 1.4,
          textDecoration: todo.completed ? 'line-through' : 'none',
          color: todo.completed ? 'var(--text3)' : 'var(--text)',
          wordBreak: 'break-word', marginBottom: 4,
        }}>
          {todo.title}
        </div>

        {todo.description && (
          <div style={{ fontSize:'.78rem', color:'var(--text2)', marginBottom:6,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {todo.description}
          </div>
        )}

        {/* Meta row */}
        <div style={{ display:'flex', flexWrap:'wrap', gap:5, alignItems:'center' }}>
          <span className={`p-badge p-${todo.priority}`}>{todo.priority}</span>

          {todo.category_name && (
            <span style={{
              display:'inline-flex', alignItems:'center', gap:4,
              background: todo.category_color+'22', color: todo.category_color,
              border:`1px solid ${todo.category_color}40`,
              borderRadius:100, padding:'2px 9px', fontSize:'.68rem', fontWeight:700,
            }}>
              {todo.category_icon} {todo.category_name}
            </span>
          )}

          {todo.due_date && (
            <span style={{
              fontSize:'.68rem', fontFamily:'var(--mono)',
              color: overdue ? 'var(--rose)' : today ? 'var(--amber)' : 'var(--text3)',
            }}>
              {overdue ? '⚠️' : today ? '📅' : '🗓'} {fmtDate(todo.due_date)}
            </span>
          )}

          {(todo.tags || []).slice(0,3).map(t => (
            <span key={t} className="tag-chip">#{t}</span>
          ))}
          {(todo.tags||[]).length > 3 && <span className="tag-chip">+{todo.tags.length-3}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display:'flex', gap:3, alignItems:'center', flexShrink:0 }}>
        {todo.file_url && (
          <a href={todo.file_url} target="_blank" rel="noreferrer"
            style={{ width:28, height:28, background:'var(--surface2)', borderRadius:6,
              display:'grid', placeItems:'center', textDecoration:'none', fontSize:'.85rem',
              border:'1px solid var(--border)' }}
            title={todo.file_name}>
            {todo.file_type?.startsWith('image/')
              ? <img src={todo.file_url} alt="" style={{ width:24, height:24, objectFit:'cover', borderRadius:4 }} />
              : '📎'}
          </a>
        )}
        <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onEdit(todo)} title="Edit">✏️</button>
        <button className="btn btn-danger btn-icon btn-sm" onClick={handleDelete} disabled={del}>
          {del ? '…' : '🗑'}
        </button>
      </div>
    </div>
  );
}
