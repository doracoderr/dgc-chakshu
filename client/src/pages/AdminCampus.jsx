import { useEffect, useMemo, useRef, useState } from 'react';
import api from '../api/axios';
import { DAY_ORDER, DAY_LABEL, PROGRAM_CATEGORIES, formatTime } from '../utils/campusFormat';
import '../styles/campus.css';

const TABS = ['Timetable', 'Events', 'Programs'];
const TYPES = ['lecture', 'lab', 'tutorial', 'other'];
const MAX_DATAURL_CHARS = 3.2 * 1024 * 1024; // keeps the request under Groq's 4 MB base64 limit

/* ------------------------------------------------------------------ */
/* helpers                                                             */
/* ------------------------------------------------------------------ */

async function imageToDataUrl(file) {
  const bmp = await createImageBitmap(file);
  let scale = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
  let quality = 0.9;
  for (let i = 0; i < 7; i += 1) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const url = canvas.toDataURL('image/jpeg', quality);
    if (url.length < MAX_DATAURL_CHARS) return url;
    scale *= 0.85;
    quality = Math.max(0.6, quality - 0.07);
  }
  throw new Error('Image is too large even after compression');
}

function fileToRawDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}

const isSpreadsheet = (file) =>
  /\.(xlsx|xls|csv)$/i.test(file.name) ||
  /sheet|excel|csv/i.test(file.type);

// Turns any accepted upload (image / PDF / Excel / CSV) into the payload the
// /timetable/extract endpoint expects. Images get compressed client-side so
// they stay under Groq's base64 limit; PDFs and spreadsheets go up as-is —
// the server extracts the text/table data itself.
async function fileToPayload(file) {
  if (file.type.startsWith('image/')) {
    return { file: await imageToDataUrl(file), fileName: file.name };
  }
  if (file.type === 'application/pdf' || /\.pdf$/i.test(file.name) || isSpreadsheet(file)) {
    if (file.size > 8 * 1024 * 1024) throw new Error('File is too large (max 8 MB)');
    return { file: await fileToRawDataUrl(file), fileName: file.name };
  }
  throw new Error('Please choose an image, PDF or Excel/CSV file');
}

let rowSeq = 0;
const toRow = (e) => ({
  _k: `r${(rowSeq += 1)}`,
  program: e.program || '',
  semester: e.semester ?? '',
  section: e.section || '',
  day: e.day || '',
  period: e.period || '',
  startTime: e.startTime || '',
  endTime: e.endTime || '',
  subject: e.subject || '',
  subjectCode: e.subjectCode || '',
  type: e.type || 'lecture',
  facultyId: (typeof e.facultyId === 'object' ? e.facultyId?._id : e.facultyId) || '',
  facultyName: e.facultyName || '',
  roomId: (typeof e.roomId === 'object' ? e.roomId?._id : e.roomId) || '',
  roomLabel: e.roomLabel || '',
});

const idOf = (v) => (v && typeof v === 'object' ? v._id : v) || '';

/* ------------------------------------------------------------------ */
/* grouping rows into classes (program + semester + section)           */
/* ------------------------------------------------------------------ */

let groupSeq = 0;
const classLabel = (g) => [g.program || 'Untitled class', g.semester && `Sem ${g.semester}`, g.section].filter(Boolean).join(' · ');

// Splits a flat list of extracted/loaded rows into one group per distinct
// (program, semester, section) — this is what lets one upload cover many
// classes (a department "master" sheet) and still be reviewed/edited class
// by class instead of as one giant undifferentiated table.
function groupRows(rows, fallback) {
  const map = new Map();
  rows.forEach((r) => {
    const program = r.program || '';
    const semester = r.semester === '' || r.semester == null ? fallback.semester ?? '' : r.semester;
    const section = r.section || fallback.section || '';
    const key = `${program}\u0000${semester}\u0000${section}`;
    if (!map.has(key)) map.set(key, { _g: `g${(groupSeq += 1)}`, program, semester: semester === '' ? '' : String(semester), section, rows: [] });
    map.get(key).rows.push(r);
  });
  return [...map.values()];
}

// Appends newly-extracted groups after whatever is already in the draft,
// so uploading a second file adds to the review list instead of wiping it.
function mergeGroups(existing, incoming) {
  return [...existing, ...incoming];
}

function byDay(rows) {
  const map = {};
  rows.forEach((r) => (map[r.day || ''] = map[r.day || ''] || []).push(r));
  const ordered = DAY_ORDER.filter((d) => map[d]?.length).map((d) => ({ day: d, rows: map[d] }));
  if (map['']?.length) ordered.push({ day: '', rows: map[''] });
  return ordered;
}

/* ------------------------------------------------------------------ */
/* page                                                                */
/* ------------------------------------------------------------------ */

export default function AdminCampus() {
  const [adminKey, setAdminKey] = useState(() => sessionStorage.getItem('adminKey') || '');
  const [keyInput, setKeyInput] = useState('');
  const [tab, setTab] = useState('Timetable');
  const [departments, setDepartments] = useState([]);
  const [faculty, setFaculty] = useState([]);

  useEffect(() => {
    if (!adminKey) return;
    api.get('/departments').then((r) => setDepartments(r.data.data || [])).catch(() => {});
    api
      .get('/faculty/admin/all', { headers: { 'x-admin-key': adminKey } })
      .then((r) => setFaculty((r.data.data || []).slice().sort((a, b) => a.name.localeCompare(b.name))))
      .catch(() => {});
  }, [adminKey]);

  if (!adminKey) {
    return (
      <div className="page cx-page cx-narrow">
        <h1>Campus Data Admin</h1>
        <p className="subtitle">Enter the admin key to manage timetable, events and programs.</p>
        <form
          className="cx-form"
          onSubmit={(e) => {
            e.preventDefault();
            sessionStorage.setItem('adminKey', keyInput.trim());
            setAdminKey(keyInput.trim());
          }}
        >
          <input type="password" placeholder="Admin key" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} />
          <button type="submit" className="cx-btn cx-btn-primary">Continue</button>
        </form>
      </div>
    );
  }

  const logout = () => {
    sessionStorage.removeItem('adminKey');
    setAdminKey('');
  };

  return (
    <div className="page cx-page">
      <div className="cx-admin-head">
        <h1>Campus Data Admin</h1>
        <div>
          <a className="cx-btn cx-btn-light" href="/admin">Main admin</a>{' '}
          <button type="button" className="cx-btn cx-btn-light" onClick={logout}>Log out</button>
        </div>
      </div>

      <div className="cx-tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={tab === t ? 'cx-tab active' : 'cx-tab'} onClick={() => setTab(t)}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Timetable' && <TimetableEditor adminKey={adminKey} departments={departments} faculty={faculty} onAuthError={logout} />}
      {tab === 'Events' && (
        <CrudManager
          key="events"
          endpoint="/events"
          adminKey={adminKey}
          onAuthError={logout}
          fields={[
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'departmentId', label: 'Department', type: 'select', ref: true, blank: 'College-wide', options: departments.map((d) => [d._id, d.name]) },
            { name: 'startDate', label: 'Start date', type: 'date', required: true },
            { name: 'endDate', label: 'End date', type: 'date', nullable: true },
            { name: 'startTime', label: 'Start time', type: 'time', nullable: true },
            { name: 'endTime', label: 'End time', type: 'time', nullable: true },
            { name: 'venue', label: 'Venue', type: 'text' },
            { name: 'organizer', label: 'Organizer', type: 'text' },
            { name: 'coverImage', label: 'Cover image URL', type: 'text', nullable: true },
            { name: 'description', label: 'Description', type: 'textarea', wide: true },
            { name: 'published', label: 'Published', type: 'checkbox' },
          ]}
          empty={{ title: '', departmentId: '', startDate: '', endDate: '', startTime: '', endTime: '', venue: '', organizer: '', coverImage: '', description: '', published: true }}
          columns={(r) => [r.title, r.departmentId?.name || 'College-wide', r.endDate && r.endDate !== r.startDate ? `${r.startDate} → ${r.endDate}` : r.startDate]}
          headings={['Title', 'Department', 'Date']}
        />
      )}
      {tab === 'Programs' && (
        <CrudManager
          key="programs"
          endpoint="/programs"
          adminKey={adminKey}
          onAuthError={logout}
          fields={[
            { name: 'title', label: 'Title', type: 'text', required: true },
            { name: 'category', label: 'Type', type: 'select', options: PROGRAM_CATEGORIES.map((c) => [c, c]) },
            { name: 'departmentId', label: 'Department', type: 'select', ref: true, blank: 'College-wide', options: departments.map((d) => [d._id, d.name]) },
            { name: 'coordinatorId', label: 'Coordinator', type: 'select', ref: true, blank: '— none —', options: faculty.map((f) => [f._id, f.name]) },
            { name: 'startDate', label: 'Start date', type: 'date', nullable: true },
            { name: 'endDate', label: 'End date (blank = ongoing)', type: 'date', nullable: true },
            { name: 'schedule', label: 'Schedule (e.g. Sat 10:00–13:00)', type: 'text' },
            { name: 'venue', label: 'Venue', type: 'text' },
            { name: 'coverImage', label: 'Cover image URL', type: 'text', nullable: true },
            { name: 'description', label: 'Description', type: 'textarea', wide: true },
            { name: 'published', label: 'Published', type: 'checkbox' },
          ]}
          empty={{ title: '', category: 'other', departmentId: '', coordinatorId: '', startDate: '', endDate: '', schedule: '', venue: '', coverImage: '', description: '', published: true }}
          columns={(r) => [r.title, r.departmentId?.name || 'College-wide', r.startDate ? `${r.startDate}${r.endDate ? ` → ${r.endDate}` : ' → ongoing'}` : 'ongoing']}
          headings={['Title', 'Department', 'Dates']}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* timetable: upload image -> review/edit -> save                      */
/* ------------------------------------------------------------------ */

function TimetableEditor({ adminKey, departments, faculty, onAuthError }) {
  const headers = { 'x-admin-key': adminKey };
  const [departmentId, setDepartmentId] = useState('');
  const [groups, setGroups] = useState([]); // [{ _g, program, semester, section, rows: [...] }]
  const [source, setSource] = useState('manual');
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterText, setFilterText] = useState('');
  const fileRef = useRef(null);

  const facultyNameFor = (r) => faculty.find((f) => f._id === r.facultyId)?.name || r.facultyName;

  // Every class in the draft, in the order they'll be saved and previewed —
  // one block per program/semester/section, each block's own days in order.
  const visibleGroups = useMemo(
    () =>
      groups.filter((g) => !filterText.trim() || classLabel(g).toLowerCase().includes(filterText.trim().toLowerCase())),
    [groups, filterText]
  );

  const say = (text, error = false) => setMsg({ text, error });
  const handleErr = (err) => {
    if (err.response?.status === 401) return onAuthError();
    say(err.response?.data?.message || err.message || 'Something went wrong', true);
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setMsg(null);
    try {
      setBusy('Preparing file...');
      const payload = await fileToPayload(file);
      setBusy('Reading timetable with AI — this can take 10–30 seconds...');
      const res = await api.post('/timetable/extract', payload, { headers, timeout: 90000 });
      const d = res.data.data;
      const extracted = groupRows(d.entries.map((e2) => toRow({ ...e2, program: e2.program || d.program })), {
        semester: d.semester,
        section: d.section,
      });
      setGroups((gs) => mergeGroups(gs, extracted));
      setSource('ai');
      const classCount = new Set(extracted.map((g) => classLabel(g))).size;
      say(
        `${d.entries.length} entries found across ${classCount} class${classCount === 1 ? '' : 'es'}. Check every row before saving — AI can misread handwriting or merged cells, and a sheet with no day columns won't have a Day filled in — set it per row.`
      );
    } catch (err) {
      handleErr(err);
    } finally {
      setBusy('');
    }
  };

  const loadExisting = async () => {
    if (!departmentId) return say('Pick a department first.', true);
    setMsg(null);
    try {
      setBusy('Loading saved timetable...');
      const res = await api.get('/timetable', { params: { departmentId } });
      const loaded = groupRows((res.data.data || []).map((r) => toRow({ ...r, program: r.program })), {});
      setGroups(loaded);
      setSource('manual');
      say(loaded.length ? `Loaded ${res.data.data.length} saved entries across ${loaded.length} classes.` : 'Nothing saved for this department yet.');
    } catch (err) {
      handleErr(err);
    } finally {
      setBusy('');
    }
  };

  const save = async () => {
    if (!departmentId) return say('Pick a department first — every class is saved under one department.', true);
    const bad = groups.find((g) => !g.program.trim());
    if (bad) return say('Every class needs a name (Program field) before saving.', true);
    setMsg(null);
    try {
      setBusy('Saving...');
      const entries = groups.flatMap((g) =>
        g.rows.map(({ _k, ...r }) => ({
          ...r,
          program: g.program.trim(),
          semester: g.semester === '' ? undefined : Number(g.semester),
          section: g.section.trim(),
        }))
      );
      const res = await api.post('/timetable/bulk', { departmentId, source, entries }, { headers });
      say(`Saved ${res.data.data.count} entries across ${groups.length} classes. It is now live for everyone.`);
    } catch (err) {
      handleErr(err);
    } finally {
      setBusy('');
    }
  };

  const patchGroup = (g, changes) => setGroups((gs) => gs.map((x) => (x._g === g ? { ...x, ...changes } : x)));
  const removeGroup = (g) => setGroups((gs) => gs.filter((x) => x._g !== g));
  const patchRow = (g, k, changes) =>
    setGroups((gs) => gs.map((x) => (x._g === g ? { ...x, rows: x.rows.map((r) => (r._k === k ? { ...r, ...changes } : r)) } : x)));
  const removeRow = (g, k) => setGroups((gs) => gs.map((x) => (x._g === g ? { ...x, rows: x.rows.filter((r) => r._k !== k) } : x)));
  const addRowTo = (g) => setGroups((gs) => gs.map((x) => (x._g === g ? { ...x, rows: [...x.rows, toRow({})] } : x)));
  const addNewClass = () => setGroups((gs) => [...gs, { _g: `g${(groupSeq += 1)}`, program: '', semester: '', section: '', rows: [toRow({})] }]);

  return (
    <div>
      <div className="cx-panel">
        <h2>1. Department</h2>
        <p className="cx-meta">One upload can cover many classes — a department "master" sheet listing several programs is fine, each becomes its own class below.</p>
        <div className="cx-form-grid">
          <label>
            Department
            <select value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">Select...</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>{d.name}</option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="cx-panel">
        <h2>2. Upload timetable (image, PDF or Excel), or load a saved one</h2>
        <div className="cx-actions">
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf,.pdf,.xlsx,.xls,.csv"
            hidden
            onChange={onFile}
          />
          <button type="button" className="cx-btn cx-btn-primary" disabled={!!busy} onClick={() => fileRef.current?.click()}>
            Upload file &amp; read
          </button>
          <button type="button" className="cx-btn cx-btn-light" disabled={!!busy || !departmentId} onClick={loadExisting}>
            Load saved timetable
          </button>
          <button type="button" className="cx-btn cx-btn-light" disabled={!!busy} onClick={addNewClass}>
            + Add class
          </button>
        </div>
        {busy && <p className="cx-status">{busy}</p>}
        {msg && <p className={msg.error ? 'cx-status cx-error' : 'cx-status cx-ok'}>{msg.text}</p>}
      </div>

      {groups.length > 0 && (
        <div className="cx-panel">
          <div className="cx-actions" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>3. Review, edit and save</h2>
            <input
              className="cx-class-filter"
              placeholder="Filter classes..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
            />
          </div>
          <p className="cx-meta">
            {groups.length} class{groups.length === 1 ? '' : 'es'}, {groups.reduce((n, g) => n + g.rows.length, 0)} entries total.
            Saving replaces each class's previously-saved timetable — other classes in this department are untouched.
          </p>

          {visibleGroups.map((g) => (
            <div key={g._g} className="cx-class-block">
              <div className="cx-class-head">
                <input
                  className="cx-class-name"
                  placeholder="Class / program name (e.g. MCA I)"
                  value={g.program}
                  onChange={(e) => patchGroup(g._g, { program: e.target.value })}
                />
                <input
                  className="cx-sm"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Sem"
                  value={g.semester}
                  onChange={(e) => patchGroup(g._g, { semester: e.target.value })}
                  title="Semester (optional)"
                />
                <input
                  className="cx-sm"
                  placeholder="Section"
                  value={g.section}
                  onChange={(e) => patchGroup(g._g, { section: e.target.value })}
                  title="Section (optional)"
                />
                <span className="cx-meta">{g.rows.length} entries</span>
                <button type="button" className="cx-btn cx-btn-danger" onClick={() => removeGroup(g._g)}>Delete class</button>
              </div>

              <div className="cx-table-wrap">
                <table className="cx-table">
                  <thead>
                    <tr>
                      <th>Day</th><th>Start</th><th>End</th><th>Subject</th><th>Code</th><th>Type</th><th>Teacher</th><th>Room</th><th />
                    </tr>
                  </thead>
                  <tbody>
                    {g.rows.map((r) => (
                      <tr key={r._k}>
                        <td>
                          <select value={r.day} onChange={(e) => patchRow(g._g, r._k, { day: e.target.value })}>
                            <option value="">Not set</option>
                            {DAY_ORDER.map((d) => <option key={d}>{d}</option>)}
                          </select>
                        </td>
                        <td><input type="time" value={r.startTime} onChange={(e) => patchRow(g._g, r._k, { startTime: e.target.value })} /></td>
                        <td><input type="time" value={r.endTime} onChange={(e) => patchRow(g._g, r._k, { endTime: e.target.value })} /></td>
                        <td><input value={r.subject} onChange={(e) => patchRow(g._g, r._k, { subject: e.target.value })} /></td>
                        <td><input className="cx-sm" value={r.subjectCode} onChange={(e) => patchRow(g._g, r._k, { subjectCode: e.target.value })} /></td>
                        <td>
                          <select value={r.type} onChange={(e) => patchRow(g._g, r._k, { type: e.target.value })}>
                            {TYPES.map((t) => <option key={t}>{t}</option>)}
                          </select>
                        </td>
                        <td>
                          <select
                            value={r.facultyId}
                            onChange={(e) => {
                              const f = faculty.find((x) => x._id === e.target.value);
                              patchRow(g._g, r._k, { facultyId: e.target.value, facultyName: f ? f.name : r.facultyName });
                            }}
                          >
                            <option value="">— not linked —</option>
                            {faculty.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
                          </select>
                          {!r.facultyId && r.facultyName && <small className="cx-warn">Sheet: {r.facultyName}</small>}
                        </td>
                        <td>
                          <input
                            className="cx-sm"
                            value={r.roomLabel}
                            onChange={(e) => patchRow(g._g, r._k, { roomLabel: e.target.value, roomId: '' })}
                          />
                          {r.roomId && <small className="cx-ok-text">linked</small>}
                        </td>
                        <td><button type="button" className="cx-icon-btn" title="Remove row" onClick={() => removeRow(g._g, r._k)}>✕</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="cx-actions">
                <button type="button" className="cx-btn cx-btn-light" onClick={() => addRowTo(g._g)}>+ Add row to this class</button>
              </div>
            </div>
          ))}

          <div className="cx-actions">
            <button type="button" className="cx-btn cx-btn-primary" disabled={!!busy || !departmentId} onClick={save}>
              Save all ({groups.reduce((n, g) => n + g.rows.length, 0)} entries, {groups.length} classes)
            </button>
            {!departmentId && <span className="cx-meta">Pick a department first.</span>}
          </div>
        </div>
      )}

      {groups.length > 0 && (
        <div className="cx-panel">
          <div className="cx-actions" style={{ justifyContent: 'space-between' }}>
            <h2 style={{ margin: 0 }}>4. Public preview</h2>
            <button type="button" className="cx-btn cx-btn-light" onClick={() => setShowPreview((s) => !s)}>
              {showPreview ? 'Hide preview' : 'Show preview'}
            </button>
          </div>
          {showPreview && (
            <>
              <p className="cx-meta">This is exactly how these classes will look on the public Timetable page — not saved yet. Each class's full week is shown together, then the next class's.</p>
              {visibleGroups.map((g) => (
                <section key={g._g} className="cx-day">
                  <h2>{classLabel(g)}</h2>
                  {byDay(g.rows).map(({ day, rows: dayRows }) => (
                    <div key={day} className="cx-day-sub">
                      <h3 className="cx-day-sub-h">{day ? DAY_LABEL[day] : 'Day not set'}</h3>
                      <div className="cx-grid">
                        {dayRows.map((r) => (
                          <article key={r._k} className="cx-card">
                            <div className="cx-card-top">
                              <span className="cx-time">
                                {r.startTime ? `${formatTime(r.startTime)} – ${formatTime(r.endTime)}` : r.period || 'Time TBA'}
                              </span>
                              {r.type !== 'lecture' && <span className="cx-badge">{r.type}</span>}
                            </div>
                            <h3>{r.subject || 'Untitled subject'}</h3>
                            <p className="cx-meta">{r.subjectCode}</p>
                            {facultyNameFor(r) && <p className="cx-line">{facultyNameFor(r)}</p>}
                            {r.roomLabel && <p className="cx-line">{r.roomLabel}</p>}
                          </article>
                        ))}
                      </div>
                    </div>
                  ))}
                </section>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}


/* ------------------------------------------------------------------ */
/* generic list + form for Events / Programs                           */
/* ------------------------------------------------------------------ */

function CrudManager({ endpoint, adminKey, onAuthError, fields, empty, columns, headings }) {
  const headers = useMemo(() => ({ 'x-admin-key': adminKey }), [adminKey]);
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(empty);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const handleErr = (err) => {
    if (err.response?.status === 401) return onAuthError();
    setMsg({ text: err.response?.data?.message || err.message, error: true });
  };

  const load = () =>
    api
      .get(`${endpoint}/admin/all`, { headers })
      .then((r) => setItems(r.data.data || []))
      .catch(handleErr);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  const startEdit = (row) => {
    const f = { ...empty };
    fields.forEach(({ name, ref }) => {
      const v = ref ? idOf(row[name]) : row[name];
      f[name] = v ?? empty[name];
    });
    setForm(f);
    setEditingId(row._id);
    setMsg(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const reset = () => {
    setForm(empty);
    setEditingId(null);
  };

  const submit = async (e) => {
    e.preventDefault();
    setMsg(null);
    // Blank ref/date/time fields go as null so the server clears them instead of failing to cast ''.
    const body = { ...form };
    fields.forEach(({ name, ref, nullable }) => {
      if ((ref || nullable) && body[name] === '') body[name] = null;
    });
    try {
      setBusy(true);
      if (editingId) await api.put(`${endpoint}/${editingId}`, body, { headers });
      else await api.post(endpoint, body, { headers });
      setMsg({ text: editingId ? 'Updated.' : 'Created.' });
      reset();
      await load();
    } catch (err) {
      handleErr(err);
    } finally {
      setBusy(false);
    }
  };

  const del = async (row) => {
    if (!window.confirm('Delete this item?')) return;
    try {
      await api.delete(`${endpoint}/${row._id}`, { headers });
      if (editingId === row._id) reset();
      await load();
    } catch (err) {
      handleErr(err);
    }
  };

  return (
    <div>
      <form className="cx-panel" onSubmit={submit}>
        <h2>{editingId ? 'Edit' : 'Add new'}</h2>
        <div className="cx-form-grid">
          {fields.map((f) => (
            <label key={f.name} className={f.wide ? 'cx-wide' : f.type === 'checkbox' ? 'cx-check' : ''}>
              {f.type !== 'checkbox' && f.label}
              {f.type === 'textarea' ? (
                <textarea rows={3} value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
              ) : f.type === 'select' ? (
                <select value={form[f.name] || ''} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}>
                  {f.blank && <option value="">{f.blank}</option>}
                  {f.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              ) : f.type === 'checkbox' ? (
                <>
                  <input type="checkbox" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} /> {f.label}
                </>
              ) : (
                <input
                  type={f.type}
                  required={f.required}
                  value={form[f.name] || ''}
                  onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        <div className="cx-actions">
          <button type="submit" className="cx-btn cx-btn-primary" disabled={busy}>{editingId ? 'Save changes' : 'Create'}</button>
          {editingId && <button type="button" className="cx-btn cx-btn-light" onClick={reset}>Cancel</button>}
        </div>
        {msg && <p className={msg.error ? 'cx-status cx-error' : 'cx-status cx-ok'}>{msg.text}</p>}
      </form>

      <div className="cx-panel">
        <h2>All items ({items.length})</h2>
        <div className="cx-table-wrap">
          <table className="cx-table">
            <thead>
              <tr>
                {headings.map((h) => <th key={h}>{h}</th>)}
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((r) => (
                <tr key={r._id}>
                  {columns(r).map((c, i) => <td key={i}>{c}</td>)}
                  <td>{r.published ? 'Published' : 'Hidden'}</td>
                  <td className="cx-row-actions">
                    <button type="button" className="cx-btn cx-btn-light" onClick={() => startEdit(r)}>Edit</button>
                    <button type="button" className="cx-btn cx-btn-danger" onClick={() => del(r)}>Delete</button>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr><td colSpan={headings.length + 2}>Nothing yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
