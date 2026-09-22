import { useEffect, useState } from 'react';
import { FaSearch, FaCalendarAlt, FaMapMarkerAlt, FaBuilding } from 'react-icons/fa';
import api from '../api/axios';
import { formatDateRange, formatTime } from '../utils/campusFormat';
import '../styles/campus.css';

const WHEN = [
  { value: '', label: 'Current & upcoming' },
  { value: 'ongoing', label: 'Happening today' },
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'past', label: 'Past' },
];

export default function Events() {
  const [departments, setDepartments] = useState([]);
  const [filters, setFilters] = useState({ q: '', departmentId: '', when: '' });
  const [events, setEvents] = useState([]);
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
        .get('/events', { params })
        .then((r) => {
          const rows = r.data.data || [];
          setEvents(filters.when === 'past' ? rows.slice().reverse() : rows);
        })
        .catch((e) => setError(e.response?.data?.message || 'Failed to load events'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  return (
    <div className="page cx-page">
      <h1>Events</h1>
      <p className="subtitle">What is happening across departments on campus.</p>

      <div className="cx-filters">
        <div className="cx-search">
          <FaSearch />
          <input type="text" placeholder="Search events..." value={filters.q} onChange={(e) => set({ q: e.target.value })} />
        </div>
        <select value={filters.departmentId} onChange={(e) => set({ departmentId: e.target.value })}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
        <select value={filters.when} onChange={(e) => set({ when: e.target.value })}>
          {WHEN.map((w) => (
            <option key={w.value} value={w.value}>{w.label}</option>
          ))}
        </select>
      </div>

      {loading && <p className="cx-status">Loading events...</p>}
      {error && <p className="cx-status cx-error">{error}</p>}
      {!loading && !error && events.length === 0 && <p className="cx-status">No events found.</p>}

      <div className="cx-grid">
        {events.map((e) => (
          <article key={e._id} className="cx-card">
            {e.coverImage && <img className="cx-cover" src={e.coverImage} alt={e.title} loading="lazy" />}
            <h3>{e.title}</h3>
            <p className="cx-line">
              <FaCalendarAlt /> {formatDateRange(e.startDate, e.endDate)}
              {e.startTime ? ` · ${formatTime(e.startTime)}${e.endTime ? ` – ${formatTime(e.endTime)}` : ''}` : ''}
            </p>
            <p className="cx-line">
              <FaBuilding /> {e.departmentId?.name || 'College-wide'}
            </p>
            {(e.venue || e.roomId || e.blockId) && (
              <p className="cx-line">
                <FaMapMarkerAlt />{' '}
                {[e.venue, e.roomId && (e.roomId.name || e.roomId.roomNumber), e.blockId?.name].filter(Boolean).join(' · ')}
              </p>
            )}
            {e.organizer && <p className="cx-meta">By {e.organizer}</p>}
            {e.description && <p className="cx-desc">{e.description}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
