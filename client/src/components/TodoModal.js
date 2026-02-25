import React, { useState, useRef, useEffect } from 'react';
import { todosAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

const PRI = ['low','medium','high','urgent'];
const PRI_ICONS = { low:'🟢', medium:'🔵', high:'🟠', urgent:'🔴' };

export default function TodoModal({ todo, categories, onClose, onSaved }) {
  const isEdit = !!todo;
  const { toast } = useToast();
  const fileRef   = useRef();
  const [saving, setSaving] = useState(false);
  const [tagIn,  setTagIn]  = useState('');

  const [form, setForm] = useState({
    title:       todo?.title       || '',
    description: todo?.description || '',
    priority:    todo?.priority    || 'medium',
    due_date:    todo?.due_date    ? todo.due_date.split('T')[0] : '',
    category_id: todo?.category_id || '',
    tags:        todo?.tags        || [],
    file:        null,
  });

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  const addTag = () => {
    const t = tagIn.trim().toLowerCase().replace(/\s+/g,'-');
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags:[...p.tags,t] }));
    setTagIn('');
  };
  const removeTag = t => setForm(p => ({ ...p, tags: p.tags.filter(x=>x!==t) }));

  useEffect(() => {
    const h = e => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, category_id: form.category_id || null, due_date: form.due_date || null };
      const { data } = isEdit
        ? await todosAPI.update(todo.id, payload)
        : await todosAPI.create(payload);
      toast(isEdit ? 'Task updated ✓' : 'Task created ✓', 'success');
      onSaved(data);
    } catch (e) {
      toast(e.response?.data?.error || 'Save failed', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <h2>{isEdit ? '✏️ Edit Task' : '＋ New Task'}</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>

        <form onSubmit={submit}>
          <div className="form-group">
            <label>Title *</label>
            <input autoFocus type="text" placeholder="What needs to be done?"
              value={form.title} onChange={set('title')} required />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea placeholder="Add details…" value={form.description} onChange={set('description')} rows={3} />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Priority</label>
              <select value={form.priority} onChange={set('priority')}>
                {PRI.map(p => <option key={p} value={p}>{PRI_ICONS[p]} {p.charAt(0).toUpperCase()+p.slice(1)}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select value={form.category_id} onChange={set('category_id')}>
                <option value="">— None —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Due Date</label>
            <input type="date" value={form.due_date} onChange={set('due_date')} />
          </div>

          {/* Tags */}
          <div className="form-group">
            <label>Tags</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:7 }}>
              {form.tags.map(t => (
                <span key={t} className="tag-chip" style={{ cursor:'pointer' }} onClick={() => removeTag(t)}>
                  #{t} <span style={{ marginLeft:3, opacity:.6 }}>✕</span>
                </span>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <input type="text" placeholder="Add tag, press Enter"
                value={tagIn} onChange={e => setTagIn(e.target.value)}
                onKeyDown={e => { if(e.key==='Enter'){ e.preventDefault(); addTag(); } }} />
              <button type="button" className="btn btn-ghost btn-sm" onClick={addTag} style={{ flexShrink:0 }}>Add</button>
            </div>
          </div>

          {/* File upload */}
          <div className="form-group">
            <label>Attachment → S3 (max 10 MB)</label>
            {isEdit && todo.file_name && (
              <div style={{ display:'flex', alignItems:'center', gap:8, background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'8px 12px', marginBottom:8, fontSize:'.8rem' }}>
                📎 <a href={todo.file_url} target="_blank" rel="noreferrer" style={{ color:'var(--sky)' }}>{todo.file_name}</a>
                <span style={{ color:'var(--text3)' }}>({Math.round((todo.file_size||0)/1024)} KB)</span>
              </div>
            )}
            <input type="file" ref={fileRef} style={{ display:'none' }}
              onChange={e => setForm(p => ({ ...p, file: e.target.files[0]||null }))}
              accept=".jpg,.jpeg,.png,.gif,.webp,.pdf,.txt,.doc,.docx" />
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => fileRef.current.click()}>
              📎 {form.file ? form.file.name : 'Choose file'}
            </button>
            {form.file && <span style={{ fontSize:'.72rem', color:'var(--emerald)', marginLeft:10 }}>✓ Ready to upload</span>}
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving || !form.title.trim()}>
              {saving ? <span className="spinner" style={{ width:14, height:14 }} /> : isEdit ? 'Save Changes' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
