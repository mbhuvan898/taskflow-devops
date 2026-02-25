import React, { useState } from 'react';
import { catsAPI } from '../utils/api';
import { useToast } from '../context/ToastContext';

const COLORS = ['#f472b6','#60a5fa','#fb923c','#4ade80','#a78bfa','#fbbf24','#34d399','#38bdf8'];
const ICONS  = ['📁','💼','🏠','🛒','❤️','⭐','🎯','💡','🔥','📚','🎮','✈️','💰','🏋️','🎨','🐾'];

export default function CategoryModal({ onClose, onSaved }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:'', color:'#f472b6', icon:'📁' });

  const submit = async e => {
    e.preventDefault();
    setSaving(true);
    try {
      const { data } = await catsAPI.create(form);
      toast('Category created ✓', 'success');
      onSaved(data);
    } catch (e) {
      toast(e.response?.data?.error || 'Failed', 'error');
    }
    setSaving(false);
  };

  return (
    <div className="overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth:400 }}>
        <div className="modal-head">
          <h2>📂 New Category</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Name</label>
            <input autoFocus type="text" placeholder="e.g. Learning"
              value={form.name} onChange={e => setForm(p=>({...p,name:e.target.value}))} required />
          </div>

          <div className="form-group">
            <label>Icon</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
              {ICONS.map(ic => (
                <button key={ic} type="button"
                  style={{ width:36, height:36, fontSize:'1rem',
                    background: form.icon===ic ? 'rgba(212,242,68,.15)':'var(--surface2)',
                    border: form.icon===ic ? '1px solid var(--lime)':'1px solid var(--border)',
                    borderRadius:8, cursor:'pointer' }}
                  onClick={() => setForm(p=>({...p,icon:ic}))}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Color</label>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
              {COLORS.map(c => (
                <button key={c} type="button"
                  style={{ width:26, height:26, borderRadius:'50%', background:c, border:'none', cursor:'pointer',
                    boxShadow: form.color===c ? `0 0 0 3px ${c}66, 0 0 0 5px var(--bg2)` : 'none',
                    transition:'box-shadow .15s' }}
                  onClick={() => setForm(p=>({...p,color:c}))} />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'var(--r-sm)', padding:'10px 14px', marginBottom:4 }}>
            <span style={{ display:'inline-flex', alignItems:'center', gap:6,
              background:form.color+'22', color:form.color, border:`1px solid ${form.color}44`,
              borderRadius:100, padding:'4px 12px', fontSize:'.85rem', fontWeight:700 }}>
              {form.icon} {form.name||'Preview'}
            </span>
          </div>

          <div className="modal-foot">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving||!form.name.trim()}>
              {saving ? '…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
