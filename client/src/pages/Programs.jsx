import { useEffect, useState } from 'react';
import { FaSearch, FaCalendarAlt, FaBuilding, FaUserTie, FaClock } from 'react-icons/fa';
import api from '../api/axios';
import { formatDateRange, PROGRAM_CATEGORIES } from '../utils/campusFormat';
import '../styles/campus.css';

const STATUS = [
  { value: 'running', label: 'Running now' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'completed', label: 'Completed' },
];

export default function Programs() {
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ q: '', departmentId: '', category: '', status: 'running' });
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/departments').then((r) => setDepartments(r.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v));
      api
        .get('/programs', { params })
        .then((r) => setPrograms(r.data.data || []))
        .catch((e) => setError(e.response?.data?.message || 'Failed to load programs'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="page cx-page">
      <h1>Programs</h1>
      <p className="subtitle">Courses, workshops, seminars and activities running in each department.</p>

      <div className="cx-tabs">
        {STATUS.map((s) => (
          <button
            key={s.value}
            type="button"
            className={filters.status === s.value ? 'cx-tab active' : 'cx-tab'}
            onClick={() => set({ status: s.value })}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="cx-filters">
        <div className="cx-search">
          <FaSearch />
          <input type="text" placeholder="Search programs..." value={filters.q} onChange={(e) => set({ q: e.target.value })} />
        </div>
        <select value={filters.departmentId} onChange={(e) => set({ departmentId: e.target.value })}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <select value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          <option value="">All types</option>
          {PROGRAM_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c[0].toUpperCase() + c.slice(1)}</option>
          ))}
        </select>
      </div>

      {loading && <p className="cx-status">Loading programs...</p>}
      {error && <p className="cx-status cx-error">{error}</p>}
      {!loading && !error && programs.length === 0 && <p className="cx-status">No programs found.</p>}

      <div className="cx-grid">
        {programs.map((p) => (
          <article key={p._id} className="cx-card">
            {p.coverImage && <img className="cx-cover" src={p.coverImage} alt={p.title} loading="lazy" />}
            <div className="cx-card-top">
              <span className="cx-badge">{p.category}</span>
            </div>
            <h3>{p.title}</h3>
            <p className="cx-line"><FaBuilding /> {p.departmentId?.name || 'College-wide'}</p>
            {(p.startDate || p.endDate) && (
              <p className="cx-line">
                <FaCalendarAlt /> {p.startDate ? formatDateRange(p.startDate, p.endDate) : `Until ${formatDateRange(p.endDate)}`}
              </p>
            )}
            {p.schedule && <p className="cx-line"><FaClock /> {p.schedule}</p>}
            {p.coordinatorId && <p className="cx-line"><FaUserTie /> {p.coordinatorId.name}</p>}
            {p.venue && <p className="cx-meta">{p.venue}</p>}
            {p.description && <p className="cx-desc">{p.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
