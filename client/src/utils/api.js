import axios from 'axios';

// CRA "proxy" in package.json forwards /api → http://localhost:5000
// so we just use relative paths — no CORS issues in dev
const api = axios.create({ baseURL: '/api', timeout: 30000 });

api.interceptors.request.use((cfg) => {
  const t = localStorage.getItem('tf_token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401 && window.location.pathname !== '/login') {
      localStorage.removeItem('tf_token');
      window.location.href = '/login';
    }
    return Promise.reject(e);
  }
);

/* ── helpers ──────────────────────────────────────── */
function fd(data) {
  const f = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v == null) return;
    if (k === 'file' && v instanceof File) f.append('file', v);
    else if (Array.isArray(v)) f.append(k, JSON.stringify(v));
    else f.append(k, String(v));
  });
  return f;
}

/* ── Auth ─────────────────────────────────────────── */
export const authAPI = {
  register:     (d)  => api.post('/auth/register', d),
  login:        (d)  => api.post('/auth/login', d),
  me:           ()   => api.get('/auth/me'),
  uploadAvatar: (f)  => { const form = new FormData(); form.append('avatar', f); return api.post('/auth/avatar', form); },
};

/* ── Todos ────────────────────────────────────────── */
export const todosAPI = {
  list:       (p)     => api.get('/todos', { params: p }),
  get:        (id)    => api.get(`/todos/${id}`),
  create:     (d)     => api.post('/todos', fd(d)),
  update:     (id, d) => api.put(`/todos/${id}`, fd(d)),
  toggle:     (id)    => api.patch(`/todos/${id}/toggle`),
  remove:     (id)    => api.delete(`/todos/${id}`),
  removeFile: (id)    => api.delete(`/todos/${id}/file`),
};

/* ── Categories ───────────────────────────────────── */
export const catsAPI = {
  list:   ()         => api.get('/categories'),
  create: (d)        => api.post('/categories', d),
  update: (id, d)    => api.put(`/categories/${id}`, d),
  remove: (id)       => api.delete(`/categories/${id}`),
};

/* ── Analytics ────────────────────────────────────── */
export const analyticsAPI = {
  dashboard: () => api.get('/analytics/dashboard'),
};

export default api;
