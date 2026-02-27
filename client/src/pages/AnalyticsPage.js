import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { analyticsAPI, catsAPI } from '../utils/api';
import Sidebar from '../components/Sidebar';

const P_COLORS = { low:'#34d399', medium:'#38bdf8', high:'#fbbf24', urgent:'#fb7185' };

function StatCard({ icon, label, value, color }) {
  return (
    <div className="card fade-up" style={{ display:'flex', alignItems:'center', gap:16 }}>
      <span style={{ fontSize:'1.7rem' }}>{icon}</span>
      <div>
        <div className="stat-n" style={{ color }}>{value ?? 0}</div>
        <div style={{ fontSize:'.68rem', color:'var(--text3)', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase', marginTop:2 }}>{label}</div>
      </div>
    </div>
  );
}

const TT_STYLE = {
  contentStyle: { background:'var(--surface2)', border:'1px solid var(--border)', borderRadius:8, fontSize:12, color:'var(--text)' },
  cursor: { fill:'rgba(255,255,255,.04)' },
};

export default function AnalyticsPage() {
  const [data, setData]   = useState(null);
  const [cats, setCats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    Promise.all([analyticsAPI.dashboard(), catsAPI.list()])
      .then(([{ data:d }, { data:c }]) => { setData(d); setCats(c); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="layout">
      <Sidebar categories={[]} onAddCat={() => {}} open={false} onClose={() => {}} />
      <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
        <div className="spinner" style={{ width:36,height:36 }} />
      </div>
    </div>
  );

  const { totals, byPriority, byCategory, trend, recentActivity, upcoming } = data;
  const rate = parseFloat(totals.rate) || 0;

  const trendData = trend.map(d => ({
    day: new Date(d.day).toLocaleDateString('en-US',{month:'short',day:'numeric'}),
    count: d.count,
  }));

  return (
    <div className="layout">
      <Sidebar categories={cats} onAddCat={() => {}} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main className="main page">
        <div className="page-header">
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu">☰</button>
            <div>
              <h1 className="page-title">Analytics</h1>
              <p className="page-sub">Your productivity at a glance</p>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:14, marginBottom:18 }}>
          <StatCard icon="📋" label="Total"     value={totals.total}     color="var(--sky)"     />
          <StatCard icon="⚡" label="Active"    value={totals.active}    color="var(--lime)"    />
          <StatCard icon="✅" label="Completed" value={totals.completed} color="var(--emerald)" />
          <StatCard icon="⚠️" label="Overdue"   value={totals.overdue}   color="var(--rose)"    />
          <StatCard icon="📅" label="Due Today" value={totals.due_today} color="var(--amber)"   />
        </div>

        {/* Row 2: Rate + Trend */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          {/* Completion ring */}
          <div className="card fade-up">
            <div className="card-title">Completion Rate</div>
            <div style={{ display:'flex', alignItems:'center', gap:20 }}>
              <div style={{ position:'relative', width:90, height:90, flexShrink:0 }}>
                <svg viewBox="0 0 36 36" style={{ transform:'rotate(-90deg)', width:'100%' }}>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--surface2)" strokeWidth="4"/>
                  <circle cx="18" cy="18" r="14" fill="none" stroke="var(--lime)" strokeWidth="4"
                    strokeDasharray={`${rate * 0.879} ${87.9 - rate * 0.879}`}
                    strokeDashoffset="0" strokeLinecap="round"/>
                </svg>
                <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column' }}>
                  <span style={{ fontSize:'1.1rem', fontWeight:800, fontFamily:'var(--mono)', color:'var(--lime)' }}>{rate}%</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {[['Due Today','due_today','var(--amber)'],['Overdue','overdue','var(--rose)']].map(([l,k,c])=>(
                  <div key={k}>
                    <div style={{ fontSize:'.65rem', color:'var(--text3)', letterSpacing:'.06em', textTransform:'uppercase' }}>{l}</div>
                    <div style={{ fontFamily:'var(--mono)', fontWeight:700, color:c, fontSize:'1.1rem' }}>{totals[k]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Trend line */}
          <div className="card fade-up">
            <div className="card-title">Completions — Last 14 Days</div>
            {trendData.length === 0
              ? <div style={{ color:'var(--text3)', fontSize:'.8rem', padding:'16px 0' }}>No completions yet</div>
              : <ResponsiveContainer width="100%" height={110}>
                  <LineChart data={trendData}>
                    <XAxis dataKey="day" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip {...TT_STYLE} />
                    <Line type="monotone" dataKey="count" stroke="var(--lime)" strokeWidth={2}
                      dot={{ fill:'var(--lime)', r:3 }} activeDot={{ r:5 }} />
                  </LineChart>
                </ResponsiveContainer>
            }
          </div>
        </div>

        {/* Row 3: Priority + Category */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14, marginBottom:14 }}>
          <div className="card fade-up">
            <div className="card-title">By Priority</div>
            <ResponsiveContainer width="100%" height={140}>
              <BarChart data={byPriority} barSize={26}>
                <XAxis dataKey="priority" tick={{ fontSize:10, fill:'var(--text3)' }} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip {...TT_STYLE} />
                <Bar dataKey="total" radius={[4,4,0,0]} name="Total">
                  {byPriority.map((e,i) => <Cell key={i} fill={P_COLORS[e.priority]||'#38bdf8'} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card fade-up">
            <div className="card-title">By Category</div>
            <div style={{ display:'flex', flexDirection:'column', gap:9, marginTop:4 }}>
              {byCategory.map(c => (
                <div key={c.name} style={{ display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ fontSize:'.85rem', flexShrink:0 }}>{c.icon}</span>
                  <span style={{ fontSize:'.8rem', flex:'0 0 72px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</span>
                  <div style={{ flex:1, height:6, background:'var(--surface2)', borderRadius:3, overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:3, background:c.color,
                      width: c.total>0 ? `${(c.done/c.total)*100}%` : '0%',
                      transition:'width .5s ease' }} />
                  </div>
                  <span style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:'var(--text3)', minWidth:36, textAlign:'right' }}>
                    {c.done}/{c.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Row 4: Upcoming + Activity */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))', gap:14 }}>
          <div className="card fade-up">
            <div className="card-title">⏰ Upcoming Due</div>
            {upcoming.length===0
              ? <div style={{ color:'var(--text3)', fontSize:'.8rem' }}>No upcoming tasks</div>
              : upcoming.map(t => (
                <div key={t.id} style={{ display:'flex', alignItems:'center', gap:9, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                  <span className={`p-badge p-${t.priority}`}>{t.priority}</span>
                  <span style={{ flex:1, fontSize:'.82rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</span>
                  <span style={{ fontFamily:'var(--mono)', fontSize:'.68rem', color:'var(--text3)', flexShrink:0 }}>
                    {new Date(t.due_date).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                  </span>
                </div>
              ))
            }
          </div>

          <div className="card fade-up">
            <div className="card-title">🕐 Recent Activity</div>
            {recentActivity.length===0
              ? <div style={{ color:'var(--text3)', fontSize:'.8rem' }}>No activity yet</div>
              : recentActivity.map((a,i) => {
                const colors={created:'var(--emerald)',completed:'var(--lime)',updated:'var(--sky)',deleted:'var(--rose)',reopened:'var(--amber)'};
                const c = colors[a.action] || 'var(--text3)';
                return (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ background:c+'20', color:c, border:`1px solid ${c}40`,
                      borderRadius:100, padding:'1px 8px', fontSize:'.62rem', fontWeight:800,
                      textTransform:'uppercase', letterSpacing:'.06em', flexShrink:0 }}>
                      {a.action}
                    </span>
                    <span style={{ flex:1, fontSize:'.78rem', color:'var(--text2)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {a.title || a.detail}
                    </span>
                    <span style={{ fontFamily:'var(--mono)', fontSize:'.65rem', color:'var(--text3)', flexShrink:0 }}>
                      {new Date(a.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric'})}
                    </span>
                  </div>
                );
              })
            }
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