import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaClock, FaUserTie, FaDoorOpen } from 'react-icons/fa';
import api from '../api/axios';
import { DAY_ORDER, DAY_LABEL, formatTime, todayDayCode } from '../utils/campusFormat';
import '../styles/campus.css';

const EMPTY = { departmentId: '', program: '', semester: '', section: '', day: '', facultyId: '', q: '' };

function filtersFromUrl() {
  const usp = new URLSearchParams(window.location.search);
  const f = { ...EMPTY };
  Object.keys(EMPTY).forEach((k) => {
    const v = usp.get(k);
    if (v) f[k] = v;
  });
  return f;
}

export default function Timetable() {
  const [groups, setGroups] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [filters, setFilters] = useState(filtersFromUrl);
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([api.get('/timetable/filters'), api.get('/departments'), api.get('/faculty')])
      .then(([g, d, f]) => {
        setGroups(g.data.data || []);
        setDepartments(d.data.data || []);
        setFaculty((f.data.data || []).slice().sort((a, b) => a.name.localeCompare(b.name)));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      setError('');
      const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== ''));
      api
        .get('/timetable', { params })
        .then((res) => setEntries(res.data.data || []))
        .catch((err) => setError(err.response?.data?.message || 'Failed to load timetable'))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [filters]);

  useEffect(() => {
    const usp = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => { if (v) usp.set(k, v); });
    const qs = usp.toString();
    window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
  }, [filters]);

  const set = (patch) => setFilters((f) => ({ ...f, ...patch }));

  const scoped = useMemo(
    () => groups.filter((g) => !filters.departmentId || g.departmentId === filters.departmentId),
    [groups, filters.departmentId]
  );
  const programs = useMemo(() => [...new Set(scoped.map((g) => g.program))], [scoped]);
  const semesters = useMemo(
    () =>
      [...new Set(scoped.filter((g) => !filters.program || g.program === filters.program).map((g) => g.semester))].sort(
        (a, b) => (a || 0) - (b || 0)
      ),
    [scoped, filters.program]
  );
  const sections = useMemo(
    () =>
      [
        ...new Set(
          scoped
            .filter(
              (g) =>
                (!filters.program || g.program === filters.program) &&
                (!filters.semester || String(g.semester) === String(filters.semester))
            )
            .map((g) => g.section)
            .filter(Boolean)
        ),
      ].sort(),
    [scoped, filters.program, filters.semester]
  );

  // Group by class first (program + semester + section), then by day within
  // each class — so a whole class's week reads together instead of every
  // class's Monday, then every class's Tuesday, all mixed on one page.
  const byClass = useMemo(() => {
    const classKey = (e) => `${e.program}\u0000${e.semester ?? ''}\u0000${e.section || ''}`;
    const classes = new Map();
    entries.forEach((e) => {
      const key = classKey(e);
      if (!classes.has(key)) classes.set(key, { program: e.program, semester: e.semester, section: e.section, rows: [] });
      classes.get(key).rows.push(e);
    });
    return [...classes.values()].map((cls) => {
      const map = {};
      cls.rows.forEach((e) => (map[e.day || ''] = map[e.day || ''] || []).push(e));
      const days = DAY_ORDER.filter((d) => map[d]?.length).map((d) => ({ day: d, rows: map[d] }));
      if (map['']?.length) days.push({ day: '', rows: map[''] });
      return { ...cls, days };
    });
  }, [entries]);
  const totalCount = entries.length;

  const hasFilters = Object.values(filters).some(Boolean);
  const today = todayDayCode();

  return (
    <div className="page cx-page">
      <h1>Timetable</h1>
      <p className="subtitle">Find any class by course, teacher, room or subject.</p>

      <div className="cx-filters">
        <div className="cx-search">
          <FaSearch />
          <input
            type="text"
            placeholder="Search subject, teacher, room..."
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
          />
        </div>

        <select value={filters.departmentId} onChange={(e) => set({ departmentId: e.target.value, program: '', semester: '', section: '' })}>
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>

        <select value={filters.program} onChange={(e) => set({ program: e.target.value, semester: '', section: '' })}>
          <option value="">All programs</option>
          {programs.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <select value={filters.semester} onChange={(e) => set({ semester: e.target.value, section: '' })}>
          <option value="">All semesters</option>
          {semesters.map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>

        {sections.length > 0 && (
          <select value={filters.section} onChange={(e) => set({ section: e.target.value })}>
            <option value="">All sections</option>
            {sections.map((s) => (
              <option key={s} value={s}>Section {s}</option>
            ))}
          </select>
        )}

        <select value={filters.facultyId} onChange={(e) => set({ facultyId: e.target.value })}>
          <option value="">All teachers</option>
          {faculty.map((f) => (
            <option key={f._id} value={f._id}>{f.name}</option>
          ))}
        </select>

        <select value={filters.day} onChange={(e) => set({ day: e.target.value })}>
          <option value="">All days</option>
          {DAY_ORDER.slice(0, 6).map((d) => (
            <option key={d} value={d}>{DAY_LABEL[d]}</option>
          ))}
        </select>

        <div className="cx-filter-actions">
          <button type="button" className="cx-btn cx-btn-light" onClick={() => set({ day: today === 'Sun' ? '' : today })}>
            Today
          </button>
          {hasFilters && (
            <button type="button" className="cx-btn cx-btn-light" onClick={() => setFilters(EMPTY)}>
              Clear
            </button>
          )}
        </div>
      </div>

      {loading && <p className="cx-status">Loading timetable...</p>}
      {error && <p className="cx-status cx-error">{error}</p>}
      {!loading && !error && byClass.length === 0 && (
        <p className="cx-status">{hasFilters ? 'No classes match these filters.' : 'Timetable has not been published yet.'}</p>
      )}
      {!loading && !error && byClass.length > 1 && (
        <p className="cx-meta cx-class-count">{totalCount} classes across {byClass.length} groups match — narrow the filters above for a single class.</p>
      )}

      {byClass.map((cls) => (
        <section key={`${cls.program}-${cls.semester}-${cls.section}`} className="cx-class-section">
          {byClass.length > 1 && (
            <h2 className="cx-class-title">
              {cls.program}
              {cls.semester ? ` · Sem ${cls.semester}` : ''}
              {cls.section ? ` · ${cls.section}` : ''}
            </h2>
          )}
          {cls.days.map(({ day, rows }) => (
            <div key={day || 'unscheduled'} className="cx-day">
              <h2>
                {day ? DAY_LABEL[day] : 'Day not set'} {day === today && <span className="cx-badge cx-badge-accent">Today</span>}
              </h2>
              <div className="cx-grid">
                {rows.map((e) => {
                  const room = e.roomId ? e.roomId.roomNumber || e.roomId.name : e.roomLabel;
                  const teacher = e.facultyId?.name || e.facultyName;
                  return (
                    <article key={e._id} className="cx-card">
                      <div className="cx-card-top">
                        <span className="cx-time">
                          <FaClock />
                          {e.startTime ? `${formatTime(e.startTime)} – ${formatTime(e.endTime)}` : e.period || 'Time TBA'}
                        </span>
                        {e.type !== 'lecture' && <span className="cx-badge">{e.type}</span>}
                      </div>
                      <h3>{e.subject}</h3>
                      <p className="cx-meta">
                        {byClass.length === 1 ? '' : `${e.program}${e.semester ? ` · Sem ${e.semester}` : ''}${e.section ? ` · ${e.section}` : ''} · `}
                        {e.subjectCode}
                      </p>
                      {teacher && (
                        <p className="cx-line"><FaUserTie /> {teacher}</p>
                      )}
                      {room && (
                        <p className="cx-line">
                          <FaDoorOpen />{' '}
                          {e.roomId?._id ? <Link to={`/rooms/${e.roomId._id}`}>{room}</Link> : room}
                        </p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
