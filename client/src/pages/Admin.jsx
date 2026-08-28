import { useEffect, useState } from 'react';
import api from '../api/axios';
import { uploadImage } from '../utils/uploadImage';

const TABS = ['Blocks', 'Departments', 'Rooms', 'Faculty'];

function ImageUploadField({ label, value, onChange, adminKey, type }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, adminKey, type);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="admin-image-field">
      <label className="admin-image-label">{label}</label>
      <div className="admin-image-row">
        {value && <img src={value} alt="" className="admin-image-preview" />}
        <div className="admin-image-controls">
          <input type="file" accept="image/*" onChange={handleFile} disabled={uploading} />
          <input
            type="text"
            placeholder="or paste image URL"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      </div>
      {uploading && <p className="admin-status">Uploading…</p>}
      {error && <p className="admin-status error">{error}</p>}
    </div>
  );
}

function useAdminKey() {
  const [key, setKey] = useState(() => sessionStorage.getItem('adminKey') || '');

  const save = (k) => {
    sessionStorage.setItem('adminKey', k);
    setKey(k);
  };

  const clear = () => {
    sessionStorage.removeItem('adminKey');
    setKey('');
  };

  return { key, save, clear };
}

function AdminLogin({ onSubmit }) {
  const [input, setInput] = useState('');

  return (
    <div className="page admin-login">
      <h1>Admin Login</h1>
      <p className="subtitle">Enter the admin key to manage campus data.</p>
      <form
        className="admin-login-form"
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) onSubmit(input.trim());
        }}
      >
        <input
          type="password"
          placeholder="Admin key"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button type="submit" className="btn-primary">Enter</button>
      </form>
    </div>
  );
}

function BlockForm({ onSaved, adminKey }) {
  const [form, setForm] = useState({ name: '', code: '', description: '', coverImage: '', floorCount: 1, lat: '', lng: '' });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { lat, lng, ...rest } = form;
      const payload = {
        ...rest,
        location: (lat !== '' && lng !== '') ? { lat: Number(lat), lng: Number(lng) } : undefined,
      };
      await api.post('/blocks', payload, { headers: { 'x-admin-key': adminKey } });
      setForm({ name: '', code: '', description: '', coverImage: '', floorCount: 1, lat: '', lng: '' });
      setStatus('saved');
      onSaved();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <h3>Add Block</h3>
      <input placeholder="Name (e.g. Block A)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Code (e.g. A)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <ImageUploadField
        label="Cover image"
        value={form.coverImage}
        onChange={(url) => setForm({ ...form, coverImage: url })}
        adminKey={adminKey}
        type="block"
      />
      <input type="number" min="1" placeholder="Floor count" value={form.floorCount} onChange={(e) => setForm({ ...form, floorCount: Number(e.target.value) })} />
      <div className="admin-form-row">
        <input type="number" step="any" placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input type="number" step="any" placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
      </div>
      <p className="admin-hint">Lat/Long are optional for now — used later for the real campus map.</p>
      <button type="submit" className="btn-primary">Save Block</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

function DepartmentForm({ onSaved, adminKey, blocks }) {
  const [form, setForm] = useState({ name: '', code: '', blockId: '', floorNumber: '', description: '', hodName: '', contactEmail: '' });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const payload = {
        ...form,
        floorNumber: form.floorNumber !== '' ? Number(form.floorNumber) : undefined,
      };
      await api.post('/departments', payload, { headers: { 'x-admin-key': adminKey } });
      setForm({ name: '', code: '', blockId: '', floorNumber: '', description: '', hodName: '', contactEmail: '' });
      setStatus('saved');
      onSaved();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <h3>Add Department</h3>
      <input placeholder="Name (e.g. Computer Science)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Code (e.g. CSE)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      <select value={form.blockId} onChange={(e) => setForm({ ...form, blockId: e.target.value })}>
        <option value="">Select block</option>
        {blocks.map((b) => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      <input type="number" min="0" placeholder="Floor number (0 = ground)" value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: e.target.value })} />
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input placeholder="HOD name" value={form.hodName} onChange={(e) => setForm({ ...form, hodName: e.target.value })} />
      <input placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      <button type="submit" className="btn-primary">Save Department</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

function RoomForm({ onSaved, adminKey, blocks, departments }) {
  const [form, setForm] = useState({
    blockId: '', floorNumber: 1, roomNumber: '', name: '', type: 'classroom',
    departmentId: '', verified: true, photo: '',
  });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { photo, ...rest } = form;
      const payload = {
        ...rest,
        departmentId: form.departmentId || undefined,
        photos: photo ? [photo] : [],
      };
      await api.post('/rooms', payload, { headers: { 'x-admin-key': adminKey } });
      setForm({ blockId: '', floorNumber: 1, roomNumber: '', name: '', type: 'classroom', departmentId: '', verified: true, photo: '' });
      setStatus('saved');
      onSaved();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <h3>Add Room</h3>
      <select value={form.blockId} onChange={(e) => setForm({ ...form, blockId: e.target.value })} required>
        <option value="">Select block</option>
        {blocks.map((b) => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      <input type="number" min="0" placeholder="Floor number (0 = ground)" value={form.floorNumber} onChange={(e) => setForm({ ...form, floorNumber: Number(e.target.value) })} required />
      <input placeholder="Room number (e.g. B-201)" value={form.roomNumber} onChange={(e) => setForm({ ...form, roomNumber: e.target.value })} required />
      <input placeholder="Room name (e.g. Programming Lab)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
        <option value="classroom">Classroom</option>
        <option value="lab">Lab</option>
        <option value="office">Office</option>
        <option value="facility">Facility</option>
        <option value="other">Other</option>
      </select>
      <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
        <option value="">No department</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <ImageUploadField
        label="Room photo"
        value={form.photo}
        onChange={(url) => setForm({ ...form, photo: url })}
        adminKey={adminKey}
        type="room"
      />
      <label className="admin-checkbox">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
        Verified (shows on site)
      </label>
      <button type="submit" className="btn-primary">Save Room</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

function FacultyForm({ onSaved, adminKey, departments }) {
  const [form, setForm] = useState({ name: '', designation: '', departmentId: '', photo: '', approvedForDisplay: true });
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const payload = { ...form, departmentId: form.departmentId || undefined };
      await api.post('/faculty', payload, { headers: { 'x-admin-key': adminKey } });
      setForm({ name: '', designation: '', departmentId: '', photo: '', approvedForDisplay: true });
      setStatus('saved');
      onSaved();
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className="admin-form" onSubmit={submit}>
      <h3>Add Faculty</h3>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Designation (e.g. Assistant Professor)" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
      <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
        <option value="">Select department</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <ImageUploadField
        label="Faculty photo"
        value={form.photo}
        onChange={(url) => setForm({ ...form, photo: url })}
        adminKey={adminKey}
        type="faculty"
      />
      <label className="admin-checkbox">
        <input type="checkbox" checked={form.approvedForDisplay} onChange={(e) => setForm({ ...form, approvedForDisplay: e.target.checked })} />
        Approved for display (shows on site)
      </label>
      <button type="submit" className="btn-primary">Save Faculty</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

function RoomGroupedList({ rooms, onDelete }) {
  if (rooms.length === 0) return <p className="subtitle">No entries yet.</p>;

  const byBlock = rooms.reduce((acc, room) => {
    const blockName = room.blockId?.name || 'Unassigned block';
    if (!acc[blockName]) acc[blockName] = [];
    acc[blockName].push(room);
    return acc;
  }, {});

  return (
    <>
      {Object.entries(byBlock).map(([blockName, blockRooms]) => {
        const floors = [...new Set(blockRooms.map((r) => r.floorNumber))].sort((a, b) => a - b);
        return (
          <div className="admin-room-group" key={blockName}>
            <h4 className="admin-room-group-title">{blockName}</h4>
            {floors.map((floor) => (
              <div key={floor}>
                <p className="admin-room-floor-title">Floor {floor}</p>
                <ul className="admin-list">
                  {blockRooms
                    .filter((r) => r.floorNumber === floor)
                    .map((room) => (
                      <li key={room._id} className="admin-list-item">
                        <div>
                          <strong>{room.name}</strong>
                          <p>
                            {room.roomNumber} · {room.type}
                            {room.departmentId ? ` · ${room.departmentId.name}` : ''}
                            {' · '}
                            {room.verified ? 'Verified' : 'Not verified'}
                          </p>
                        </div>
                        <button type="button" className="btn-secondary admin-delete-btn" onClick={() => onDelete(room._id)}>
                          Delete
                        </button>
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        );
      })}
    </>
  );
}

function EntityList({ items, labelKey, subLabelFn, onDelete }) {
  if (items.length === 0) return <p className="subtitle">No entries yet.</p>;
  return (
    <ul className="admin-list">
      {items.map((item) => (
        <li key={item._id} className="admin-list-item">
          <div>
            <strong>{item[labelKey]}</strong>
            {subLabelFn && <p>{subLabelFn(item)}</p>}
          </div>
          <button type="button" className="btn-secondary admin-delete-btn" onClick={() => onDelete(item._id)}>
            Delete
          </button>
        </li>
      ))}
    </ul>
  );
}

export default function Admin() {
  const { key, save, clear } = useAdminKey();
  const [tab, setTab] = useState('Blocks');
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [authError, setAuthError] = useState(null);

  const loadAll = async (adminKey) => {
    try {
      const [b, d, r, f] = await Promise.all([
        api.get('/blocks'),
        api.get('/departments'),
        api.get('/rooms/admin/all', { headers: { 'x-admin-key': adminKey } }),
        api.get('/faculty/admin/all', { headers: { 'x-admin-key': adminKey } }),
      ]);
      setBlocks(b.data.data || []);
      setDepartments(d.data.data || []);
      setRooms(r.data.data || []);
      setFaculty(f.data.data || []);
      setAuthError(null);
    } catch (err) {
      if (err.response?.status === 401) {
        setAuthError('Invalid admin key');
        clear();
      }
    }
  };

  useEffect(() => {
    if (key) loadAll(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const handleDelete = async (type, id) => {
    if (!window.confirm('Delete this entry?')) return;
    await api.delete(`/${type}/${id}`, { headers: { 'x-admin-key': key } });
    loadAll(key);
  };

  if (!key) {
    return (
      <>
        <AdminLogin onSubmit={(k) => save(k)} />
        {authError && <p className="page error">{authError}</p>}
      </>
    );
  }

  return (
    <div className="page admin-page">
      <div className="admin-header">
        <h1>Admin Panel</h1>
        <button type="button" className="btn-secondary" onClick={clear}>Log out</button>
      </div>

      <div className="admin-tabs">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            className={`admin-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Blocks' && (
        <div className="admin-tab-content">
          <BlockForm adminKey={key} onSaved={() => loadAll(key)} />
          <div className="admin-list-section">
            <h3>Existing Blocks</h3>
            <EntityList
              items={blocks}
              labelKey="name"
              subLabelFn={(b) => `${b.description || ''}${b.location?.lat != null ? ' · 📍 located' : ''}`}
              onDelete={(id) => handleDelete('blocks', id)}
            />
          </div>
        </div>
      )}

      {tab === 'Departments' && (
        <div className="admin-tab-content">
          <DepartmentForm adminKey={key} blocks={blocks} onSaved={() => loadAll(key)} />
          <div className="admin-list-section">
            <h3>Existing Departments</h3>
            <EntityList
              items={departments}
              labelKey="name"
              subLabelFn={(d) => {
                const parts = [];
                if (d.hodName) parts.push(`HOD: ${d.hodName}`);
                if (d.floorNumber != null) parts.push(d.floorNumber === 0 ? 'Ground floor' : `Floor ${d.floorNumber}`);
                return parts.join(' · ');
              }}
              onDelete={(id) => handleDelete('departments', id)}
            />
          </div>
        </div>
      )}

      {tab === 'Rooms' && (
        <div className="admin-tab-content">
          <RoomForm adminKey={key} blocks={blocks} departments={departments} onSaved={() => loadAll(key)} />
          <div className="admin-list-section">
            <h3>Existing Rooms</h3>
            <RoomGroupedList
              rooms={rooms}
              onDelete={(id) => handleDelete('rooms', id)}
            />
          </div>
        </div>
      )}

      {tab === 'Faculty' && (
        <div className="admin-tab-content">
          <FacultyForm adminKey={key} departments={departments} onSaved={() => loadAll(key)} />
          <div className="admin-list-section">
            <h3>Existing Faculty</h3>
            <EntityList
              items={faculty}
              labelKey="name"
              subLabelFn={(f) => `${f.designation || ''} · ${f.approvedForDisplay ? 'Approved' : 'Pending'}`}
              onDelete={(id) => handleDelete('faculty', id)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
