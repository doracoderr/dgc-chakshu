import { useEffect, useState } from 'react';
import api from '../api/axios';
import { uploadImage } from '../utils/uploadImage';
import { generateId } from '../utils/generateId';
import ImageCropModal from '../components/ImageCropModal';

const TABS = ['Blocks', 'Departments', 'Rooms', 'Faculty'];
const RAW_SELECT_MAX_MB = 15; // generous cap on the original file before cropping shrinks it

function ImageUploadField({ label, value, onChange, adminKey, type, identifier, enableCrop }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingFileName, setPendingFileName] = useState('photo.jpg');

  const doUpload = async (fileToUpload) => {
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(fileToUpload, adminKey, type, identifier);
      onChange(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed');
      return;
    }

    if (enableCrop) {
      if (file.size > RAW_SELECT_MAX_MB * 1024 * 1024) {
        setError(`Image must be under ${RAW_SELECT_MAX_MB}MB`);
        return;
      }
      setError(null);
      setPendingFileName(file.name || 'photo.jpg');
      setCropSrc(URL.createObjectURL(file));
      return;
    }

    await doUpload(file);
  };

  const handleCropDone = async (blob) => {
    const croppedFile = new File([blob], pendingFileName, { type: 'image/jpeg' });
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
    await doUpload(croppedFile);
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);
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
      {cropSrc && (
        <ImageCropModal imageSrc={cropSrc} onCancel={handleCropCancel} onCropDone={handleCropDone} />
      )}
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

/* =========================
   BLOCK FORM (add + edit)
   ========================= */
function BlockForm({ initial, onSaved, onCancel, adminKey }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => ({
    _id: initial?._id || generateId(),
    name: initial?.name || '',
    code: initial?.code || '',
    description: initial?.description || '',
    coverImage: initial?.coverImage || '',
    floorCount: initial?.floorCount ?? 1,
    lat: initial?.location?.lat ?? '',
    lng: initial?.location?.lng ?? '',
  }));
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { lat, lng, _id, ...rest } = form;
      const payload = {
        ...rest,
        location: (lat !== '' && lng !== '') ? { lat: Number(lat), lng: Number(lng) } : undefined,
      };
      if (isEdit) {
        await api.put(`/blocks/${initial._id}`, payload, { headers: { 'x-admin-key': adminKey } });
      } else {
        await api.post('/blocks', payload, { headers: { 'x-admin-key': adminKey } });
      }
      setStatus('saved');
      onSaved();
      if (isEdit) onCancel();
      else setForm({ _id: generateId(), name: '', code: '', description: '', coverImage: '', floorCount: 1, lat: '', lng: '' });
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className={`admin-form ${isEdit ? 'is-editing' : ''}`} onSubmit={submit}>
      <div className="admin-form-header">
        <h3>{isEdit ? 'Edit Block (Building)' : 'Add Block (Building)'}</h3>
        {isEdit && <button type="button" className="admin-cancel-edit-btn" onClick={onCancel}>Cancel</button>}
      </div>
      <input placeholder="Name (e.g. Block A)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Code (e.g. A)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <ImageUploadField
        label="Cover image"
        value={form.coverImage}
        onChange={(url) => setForm({ ...form, coverImage: url })}
        adminKey={adminKey}
        type="block"
        identifier={form._id}
      />
      <input
        type="number"
        min="1"
        placeholder="Total number of floors in this building"
        value={form.floorCount}
        onChange={(e) => setForm({ ...form, floorCount: Number(e.target.value) })}
      />
      <p className="admin-hint">
        This is just the total floor count of the building (e.g. Ground + 3 upper floors = 4).
        You'll pick which specific floor a room or department is on when you add it below.
      </p>
      <div className="admin-form-row">
        <input type="number" step="any" placeholder="Latitude" value={form.lat} onChange={(e) => setForm({ ...form, lat: e.target.value })} />
        <input type="number" step="any" placeholder="Longitude" value={form.lng} onChange={(e) => setForm({ ...form, lng: e.target.value })} />
      </div>
      <p className="admin-hint">Lat/Long are optional for now — used later for the real campus map.</p>
      <button type="submit" className="btn-primary">{isEdit ? 'Update Block' : 'Save Block'}</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

/* =========================
   DEPARTMENT FORM (add + edit)
   ========================= */
function DepartmentForm({ initial, onSaved, onCancel, adminKey, blocks }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => ({
    name: initial?.name || '',
    code: initial?.code || '',
    blockId: initial?.blockId?._id || initial?.blockId || '',
    floorNumber: initial?.floorNumber ?? '',
    description: initial?.description || '',
    hodName: initial?.hodName || '',
    contactEmail: initial?.contactEmail || '',
  }));
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const payload = {
        ...form,
        floorNumber: form.floorNumber !== '' ? Number(form.floorNumber) : undefined,
      };
      if (isEdit) {
        await api.put(`/departments/${initial._id}`, payload, { headers: { 'x-admin-key': adminKey } });
      } else {
        await api.post('/departments', payload, { headers: { 'x-admin-key': adminKey } });
      }
      setStatus('saved');
      onSaved();
      if (isEdit) onCancel();
      else setForm({ name: '', code: '', blockId: '', floorNumber: '', description: '', hodName: '', contactEmail: '' });
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className={`admin-form ${isEdit ? 'is-editing' : ''}`} onSubmit={submit}>
      <div className="admin-form-header">
        <h3>{isEdit ? 'Edit Department' : 'Add Department'}</h3>
        {isEdit && <button type="button" className="admin-cancel-edit-btn" onClick={onCancel}>Cancel</button>}
      </div>
      <input placeholder="Name (e.g. Computer Science)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Code (e.g. CSE)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} required />
      <select value={form.blockId} onChange={(e) => setForm({ ...form, blockId: e.target.value })}>
        <option value="">Select block (building)</option>
        {blocks.map((b) => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        placeholder="Which floor is this department on? (0 = Ground)"
        value={form.floorNumber}
        onChange={(e) => setForm({ ...form, floorNumber: e.target.value })}
      />
      <p className="admin-hint">Use the same floor numbering as the building (Ground = 0, next floor = 1, and so on).</p>
      <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
      <input placeholder="HOD name" value={form.hodName} onChange={(e) => setForm({ ...form, hodName: e.target.value })} />
      <input placeholder="Contact email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
      <button type="submit" className="btn-primary">{isEdit ? 'Update Department' : 'Save Department'}</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

/* =========================
   ROOM FORM (add + edit)
   ========================= */
function RoomForm({ initial, onSaved, onCancel, adminKey, blocks, departments }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => ({
    _id: initial?._id || generateId(),
    blockId: initial?.blockId?._id || initial?.blockId || '',
    floorNumber: initial?.floorNumber ?? 1,
    roomNumber: initial?.roomNumber || '',
    name: initial?.name || '',
    type: initial?.type || 'classroom',
    departmentId: initial?.departmentId?._id || initial?.departmentId || '',
    verified: initial?.verified ?? true,
    photo: initial?.photos?.[0] || '',
  }));
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { photo, _id, ...rest } = form;
      const payload = {
        ...rest,
        departmentId: form.departmentId || undefined,
        photos: photo ? [photo] : [],
      };
      if (isEdit) {
        await api.put(`/rooms/${initial._id}`, payload, { headers: { 'x-admin-key': adminKey } });
      } else {
        await api.post('/rooms', payload, { headers: { 'x-admin-key': adminKey } });
      }
      setStatus('saved');
      onSaved();
      if (isEdit) onCancel();
      else setForm({ _id: generateId(), blockId: '', floorNumber: 1, roomNumber: '', name: '', type: 'classroom', departmentId: '', verified: true, photo: '' });
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className={`admin-form ${isEdit ? 'is-editing' : ''}`} onSubmit={submit}>
      <div className="admin-form-header">
        <h3>{isEdit ? 'Edit Room' : 'Add Room'}</h3>
        {isEdit && <button type="button" className="admin-cancel-edit-btn" onClick={onCancel}>Cancel</button>}
      </div>
      <select value={form.blockId} onChange={(e) => setForm({ ...form, blockId: e.target.value })} required>
        <option value="">Select block (building)</option>
        {blocks.map((b) => (
          <option key={b._id} value={b._id}>{b.name}</option>
        ))}
      </select>
      <input
        type="number"
        min="0"
        placeholder="Which floor is this room on? (0 = Ground)"
        value={form.floorNumber}
        onChange={(e) => setForm({ ...form, floorNumber: Number(e.target.value) })}
        required
      />
      <p className="admin-hint">Use the same floor numbering as the building (Ground = 0, next floor = 1, and so on).</p>
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
        identifier={form._id}
      />
      <label className="admin-checkbox">
        <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
        Verified (shows on site)
      </label>
      <button type="submit" className="btn-primary">{isEdit ? 'Update Room' : 'Save Room'}</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

/* =========================
   FACULTY FORM (add + edit)
   ========================= */
function FacultyForm({ initial, onSaved, onCancel, adminKey, departments }) {
  const isEdit = Boolean(initial?._id);
  const [form, setForm] = useState(() => ({
    _id: initial?._id || generateId(),
    name: initial?.name || '',
    designation: initial?.designation || '',
    departmentId: initial?.departmentId?._id || initial?.departmentId || '',
    photo: initial?.photo || '',
    email: initial?.email || '',
    phone: initial?.phone || '',
    approvedForDisplay: initial?.approvedForDisplay ?? true,
  }));
  const [status, setStatus] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setStatus('saving');
    try {
      const { _id, ...rest } = form;
      const payload = {
        ...rest,
        departmentId: form.departmentId || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
      };
      if (isEdit) {
        await api.put(`/faculty/${initial._id}`, payload, { headers: { 'x-admin-key': adminKey } });
      } else {
        await api.post('/faculty', payload, { headers: { 'x-admin-key': adminKey } });
      }
      setStatus('saved');
      onSaved();
      if (isEdit) onCancel();
      else setForm({ _id: generateId(), name: '', designation: '', departmentId: '', photo: '', email: '', phone: '', approvedForDisplay: true });
    } catch (err) {
      setStatus(err.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form className={`admin-form ${isEdit ? 'is-editing' : ''}`} onSubmit={submit}>
      <div className="admin-form-header">
        <h3>{isEdit ? 'Edit Faculty' : 'Add Faculty'}</h3>
        {isEdit && <button type="button" className="admin-cancel-edit-btn" onClick={onCancel}>Cancel</button>}
      </div>
      <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
      <input placeholder="Designation (e.g. Assistant Professor)" value={form.designation} onChange={(e) => setForm({ ...form, designation: e.target.value })} />
      <select value={form.departmentId} onChange={(e) => setForm({ ...form, departmentId: e.target.value })}>
        <option value="">Select department</option>
        {departments.map((d) => (
          <option key={d._id} value={d._id}>{d.name}</option>
        ))}
      </select>
      <input type="email" placeholder="Email (optional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
      <input type="tel" placeholder="Phone number (optional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      <ImageUploadField
        label="Faculty photo"
        value={form.photo}
        onChange={(url) => setForm({ ...form, photo: url })}
        adminKey={adminKey}
        type="faculty"
        identifier={form._id}
        enableCrop
      />
      <label className="admin-checkbox">
        <input type="checkbox" checked={form.approvedForDisplay} onChange={(e) => setForm({ ...form, approvedForDisplay: e.target.checked })} />
        Approved for display (shows on site)
      </label>
      <button type="submit" className="btn-primary">{isEdit ? 'Update Faculty' : 'Save Faculty'}</button>
      {status && status !== 'saving' && <p className="admin-status">{status === 'saved' ? 'Saved!' : status}</p>}
    </form>
  );
}

function RoomGroupedList({ rooms, onDelete, onEdit }) {
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
                <p className="admin-room-floor-title">{floor === 0 ? 'Ground Floor' : `Floor ${floor}`}</p>
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
                        <div className="admin-item-actions">
                          <button type="button" className="admin-edit-btn" onClick={() => onEdit(room)}>Edit</button>
                          <button type="button" className="btn-secondary admin-delete-btn" onClick={() => onDelete(room._id)}>Delete</button>
                        </div>
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

function EntityList({ items, labelKey, subLabelFn, onDelete, onEdit }) {
  if (items.length === 0) return <p className="subtitle">No entries yet.</p>;
  return (
    <ul className="admin-list">
      {items.map((item) => (
        <li key={item._id} className="admin-list-item">
          <div>
            <strong>{item[labelKey]}</strong>
            {subLabelFn && <p>{subLabelFn(item)}</p>}
          </div>
          <div className="admin-item-actions">
            <button type="button" className="admin-edit-btn" onClick={() => onEdit(item)}>Edit</button>
            <button type="button" className="btn-secondary admin-delete-btn" onClick={() => onDelete(item._id)}>Delete</button>
          </div>
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

  const [editingBlock, setEditingBlock] = useState(null);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [editingRoom, setEditingRoom] = useState(null);
  const [editingFaculty, setEditingFaculty] = useState(null);

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
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;
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
          <BlockForm
            key={editingBlock?._id || 'new-block'}
            initial={editingBlock}
            adminKey={key}
            onSaved={() => loadAll(key)}
            onCancel={() => setEditingBlock(null)}
          />
          <div className="admin-list-section">
            <h3>Existing Blocks</h3>
            <EntityList
              items={blocks}
              labelKey="name"
              subLabelFn={(b) => `${b.description || ''}${b.location?.lat != null ? ' · 📍 located' : ''} · ${b.floorCount || 1} floor(s)`}
              onDelete={(id) => handleDelete('blocks', id)}
              onEdit={(item) => setEditingBlock(item)}
            />
          </div>
        </div>
      )}

      {tab === 'Departments' && (
        <div className="admin-tab-content">
          <DepartmentForm
            key={editingDepartment?._id || 'new-department'}
            initial={editingDepartment}
            adminKey={key}
            blocks={blocks}
            onSaved={() => loadAll(key)}
            onCancel={() => setEditingDepartment(null)}
          />
          <div className="admin-list-section">
            <h3>Existing Departments</h3>
            <EntityList
              items={departments}
              labelKey="name"
              subLabelFn={(d) => {
                const parts = [];
                if (d.blockId?.name) parts.push(d.blockId.name);
                if (d.floorNumber != null) parts.push(d.floorNumber === 0 ? 'Ground floor' : `Floor ${d.floorNumber}`);
                if (d.hodName) parts.push(`HOD: ${d.hodName}`);
                return parts.join(' · ');
              }}
              onDelete={(id) => handleDelete('departments', id)}
              onEdit={(item) => setEditingDepartment(item)}
            />
          </div>
        </div>
      )}

      {tab === 'Rooms' && (
        <div className="admin-tab-content">
          <RoomForm
            key={editingRoom?._id || 'new-room'}
            initial={editingRoom}
            adminKey={key}
            blocks={blocks}
            departments={departments}
            onSaved={() => loadAll(key)}
            onCancel={() => setEditingRoom(null)}
          />
          <div className="admin-list-section">
            <h3>Existing Rooms</h3>
            <RoomGroupedList
              rooms={rooms}
              onDelete={(id) => handleDelete('rooms', id)}
              onEdit={(item) => setEditingRoom(item)}
            />
          </div>
        </div>
      )}

      {tab === 'Faculty' && (
        <div className="admin-tab-content">
          <FacultyForm
            key={editingFaculty?._id || 'new-faculty'}
            initial={editingFaculty}
            adminKey={key}
            departments={departments}
            onSaved={() => loadAll(key)}
            onCancel={() => setEditingFaculty(null)}
          />
          <div className="admin-list-section">
            <h3>Existing Faculty</h3>
            <EntityList
              items={faculty}
              labelKey="name"
              subLabelFn={(f) => `${f.designation || ''} · ${f.approvedForDisplay ? 'Approved' : 'Pending'}`}
              onDelete={(id) => handleDelete('faculty', id)}
              onEdit={(item) => setEditingFaculty(item)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
