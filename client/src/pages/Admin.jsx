// ============================================================
// ADMIN PANEL
// Complete CRUD Management
// Blocks / Departments / Rooms / Faculty
// ============================================================

import { useEffect, useMemo, useState } from 'react';

import {
  FaBuilding,
  FaChalkboardTeacher,
  FaDoorOpen,
  FaUserTie,
  FaSearch,
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaMapMarkerAlt,
  FaTimes,
  FaUpload,
  FaLayerGroup,
  FaEnvelope,
  FaPhone,
  FaCheckCircle,
  FaClock,
} from 'react-icons/fa';

import api from '../api/axios';
import { uploadImage } from '../utils/uploadImage';
import { generateId } from '../utils/generateId';
import { generateCodeFromName } from '../utils/generateCode';
import ImageCropModal from '../components/ImageCropModal';

import '../styles/Admin.css';

const TAB_CONFIG = [
  { key: 'Blocks', icon: <FaBuilding /> },
  { key: 'Departments', icon: <FaChalkboardTeacher /> },
  { key: 'Rooms', icon: <FaDoorOpen /> },
  { key: 'Faculty', icon: <FaUserTie /> },
];

const RAW_SELECT_MAX_MB = 15;

/* ============================================================
   HELPERS
   ============================================================ */

const getId = (value) => {
  if (!value) return '';

  if (typeof value === 'object') {
    return value._id || value.id || '';
  }

  return value;
};

const getName = (value) => {
  if (!value) return '';

  if (typeof value === 'object') {
    return value.name || value.title || '';
  }

  return '';
};

const getBlockId = (item) =>
  getId(item?.blockId || item?.block);

const getDepartmentId = (item) =>
  getId(item?.departmentId || item?.department);

/* ============================================================
   TOAST
   ============================================================ */

function ToastContainer({ toasts }) {
  if (!toasts.length) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          {toast.type === 'success' ? '✓' : '⚠'}{' '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}

function useToasts() {
  const [toasts, setToasts] = useState([]);

  const notify = (type, message) => {
    const id = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id,
        type,
        message,
      },
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((item) => item.id !== id)
      );
    }, 3500);
  };

  return {
    toasts,
    notify,
  };
}

/* ============================================================
   IMAGE UPLOAD
   ============================================================ */

function ImageUploadField({
  label,
  value,
  onChange,
  adminKey,
  type,
  identifier,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [cropSrc, setCropSrc] = useState(null);
  const [pendingFileName, setPendingFileName] =
    useState('photo.jpg');

  const doUpload = async (file) => {
    setUploading(true);
    setError('');

    try {
      const url = await uploadImage(
        file,
        adminKey,
        type,
        identifier
      );

      onChange(url);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Upload failed'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleFile = async (event) => {
    const file = event.target.files?.[0];

    event.target.value = '';

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Only image files are allowed.');
      return;
    }

    if (
      file.size >
      RAW_SELECT_MAX_MB * 1024 * 1024
    ) {
      setError(
        `Image must be under ${RAW_SELECT_MAX_MB}MB.`
      );
      return;
    }

    setPendingFileName(
      file.name || 'photo.jpg'
    );

    setCropSrc(
      URL.createObjectURL(file)
    );
  };

  const handleCropDone = async (blob) => {
    const file = new File(
      [blob],
      pendingFileName,
      {
        type: 'image/jpeg',
      }
    );

    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc(null);

    await doUpload(file);
  };

  const handleCropCancel = () => {
    if (cropSrc) {
      URL.revokeObjectURL(cropSrc);
    }

    setCropSrc(null);
  };

  return (
    <div className="admin-image-field">
      <label className="admin-field-label">
        {label}
      </label>

      <div className="admin-upload-box">
        {value ? (
          <img
            src={value}
            alt=""
            className="admin-upload-preview"
          />
        ) : (
          <div className="admin-upload-placeholder">
            <FaUpload />
            <span>Click to upload image</span>
            <small>
              or paste image URL below
            </small>
          </div>
        )}

        <input
          type="file"
          accept="image/*"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>

      <input
        className="admin-url-input"
        type="text"
        placeholder="https://example.com/image.jpg"
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />

      {uploading && (
        <p className="admin-status">
          Uploading...
        </p>
      )}

      {error && (
        <p className="admin-status error">
          {error}
        </p>
      )}

      {cropSrc && (
        <ImageCropModal
          imageSrc={cropSrc}
          onCancel={handleCropCancel}
          onCropDone={handleCropDone}
        />
      )}
    </div>
  );
}

/* ============================================================
   ADMIN LOGIN
   ============================================================ */

function useAdminKey() {
  const [key, setKey] = useState(
    () =>
      sessionStorage.getItem('adminKey') || ''
  );

  const save = (value) => {
    sessionStorage.setItem(
      'adminKey',
      value
    );

    setKey(value);
  };

  const clear = () => {
    sessionStorage.removeItem('adminKey');
    setKey('');
  };

  return {
    key,
    save,
    clear,
  };
}

function AdminLogin({ onSubmit }) {
  const [input, setInput] = useState('');

  return (
    <div className="page admin-login">
      <h1>Admin Login</h1>

      <p className="subtitle">
        Enter the admin key to manage campus
        data.
      </p>

      <form
        className="admin-login-form"
        onSubmit={(e) => {
          e.preventDefault();

          if (input.trim()) {
            onSubmit(input.trim());
          }
        }}
      >
        <input
          type="password"
          placeholder="Admin key"
          value={input}
          onChange={(e) =>
            setInput(e.target.value)
          }
        />

        <button
          type="submit"
          className="admin-primary-btn"
        >
          Enter
        </button>
      </form>
    </div>
  );
}

/* ============================================================
   SELECT FIELD
   ============================================================ */

function AdminSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = false,
}) {
  return (
    <div className="admin-field">
      <label>
        {label}{' '}
        {required && <span>*</span>}
      </label>

      <select
        value={value || ''}
        onChange={(e) =>
          onChange(e.target.value)
        }
        required={required}
      >
        <option value="">
          {placeholder || `Select ${label}`}
        </option>

        {options.map((option) => (
          <option
            key={option._id}
            value={option._id}
          >
            {option.name}
            {option.code
              ? ` (${option.code})`
              : ''}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ============================================================
   BLOCK FORM
   ============================================================ */

function BlockForm({
  initial,
  onSaved,
  onCancel,
  adminKey,
  notify,
}) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    _id:
      initial?._id || generateId(),

    name:
      initial?.name || '',

    code:
      initial?.code || '',

    description:
      initial?.description || '',

    coverImage:
      initial?.coverImage || '',

    floorCount:
      initial?.floorCount ?? 1,

    lat:
      initial?.location?.lat ?? '',

    lng:
      initial?.location?.lng ?? '',
  });

  const [saving, setSaving] =
    useState(false);

  const update = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const {
        lat,
        lng,
        _id,
        ...rest
      } = form;

      const payload = {
        ...rest,

        location:
          lat !== '' &&
          lng !== ''
            ? {
                lat: Number(lat),
                lng: Number(lng),
              }
            : undefined,
      };

      if (isEdit) {
        await api.put(
          `/blocks/${initial._id}`,
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" building updated.`
        );
      } else {
        await api.post(
          '/blocks',
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" building added.`
        );
      }

      await onSaved();

      if (isEdit) {
        onCancel();
      } else {
        setForm({
          _id: generateId(),
          name: '',
          code: '',
          description: '',
          coverImage: '',
          floorCount: 1,
          lat: '',
          lng: '',
        });
      }
    } catch (err) {
      notify(
        'error',
        err.response?.data?.message ||
          'Failed to save block'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="admin-form"
      onSubmit={submit}
    >
      <div className="admin-field">
        <label>
          Block Name <span>*</span>
        </label>

        <input
          type="text"
          placeholder="e.g. Block - APJ"
          value={form.name}
          onChange={(e) =>
            update(
              'name',
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="admin-field">
        <label>
          Block Code <span>*</span>
        </label>

        <div className="admin-field-row" style={{ gap: '8px' }}>
          <input
            type="text"
            placeholder="e.g. A"
            value={form.code}
            onChange={(e) =>
              update(
                'code',
                e.target.value
              )
            }
            required
          />

          <button
            type="button"
            className="btn-secondary"
            title="Suggest a code from the block name"
            onClick={() =>
              update(
                'code',
                generateCodeFromName(form.name)
              )
            }
            disabled={!form.name.trim()}
          >
            Generate
          </button>
        </div>
      </div>

      <div className="admin-field">
        <label>Description</label>

        <textarea
          placeholder="Enter description..."
          value={form.description}
          onChange={(e) =>
            update(
              'description',
              e.target.value
            )
          }
          rows="3"
        />
      </div>

      <ImageUploadField
        label="Cover Image"
        value={form.coverImage}
        onChange={(url) =>
          update(
            'coverImage',
            url
          )
        }
        adminKey={adminKey}
        type="block"
        identifier={form._id}
      />

      <div className="admin-field">
        <label>
          Total Floors <span>*</span>
        </label>

        <input
          type="number"
          min="1"
          value={form.floorCount}
          onChange={(e) =>
            update(
              'floorCount',
              Number(
                e.target.value
              )
            )
          }
          required
        />
      </div>

      <div className="admin-field-row">
        <div className="admin-field">
          <label>Latitude</label>

          <input
            type="number"
            step="any"
            placeholder="Latitude"
            value={form.lat}
            onChange={(e) =>
              update(
                'lat',
                e.target.value
              )
            }
          />
        </div>

        <div className="admin-field">
          <label>Longitude</label>

          <input
            type="number"
            step="any"
            placeholder="Longitude"
            value={form.lng}
            onChange={(e) =>
              update(
                'lng',
                e.target.value
              )
            }
          />
        </div>
      </div>

      <FormActions
        isEdit={isEdit}
        saving={saving}
        onCancel={onCancel}
        updateText="Update Block"
        createText="Save Block"
      />
    </form>
  );
}

/* ============================================================
   DEPARTMENT FORM
   ============================================================ */

function DepartmentForm({
  initial,
  blocks,
  onSaved,
  onCancel,
  adminKey,
  notify,
}) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    name:
      initial?.name || '',

    code:
      initial?.code || '',

    description:
      initial?.description || '',

    coverImage:
      initial?.coverImage || '',

    blockId:
      getBlockId(initial),

    floorNumber:
      initial?.floorNumber ?? 0,

    hodName:
      initial?.hodName || '',
  });

  const [saving, setSaving] =
    useState(false);

  const update = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        name: form.name,
        code: form.code,
        description:
          form.description,

        coverImage:
          form.coverImage || '',

        blockId:
          form.blockId || undefined,

        floorNumber:
          Number(form.floorNumber),

        hodName:
          form.hodName,
      };

      if (isEdit) {
        await api.put(
          `/departments/${initial._id}`,
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" department updated.`
        );
      } else {
        await api.post(
          '/departments',
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" department added.`
        );
      }

      await onSaved();

      onCancel();
    } catch (err) {
      notify(
        'error',
        err.response?.data?.message ||
          'Failed to save department'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="admin-form"
      onSubmit={submit}
    >
      <div className="admin-field">
        <label>
          Department Name <span>*</span>
        </label>

        <input
          type="text"
          placeholder="e.g. Computer Science"
          value={form.name}
          onChange={(e) =>
            update(
              'name',
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="admin-field">
        <label>
          Department Code <span>*</span>
        </label>

        <div className="admin-field-row" style={{ gap: '8px' }}>
          <input
            type="text"
            required
            placeholder="e.g. CSE"
            value={form.code}
            onChange={(e) =>
              update(
                'code',
                e.target.value
              )
            }
          />

          <button
            type="button"
            className="btn-secondary"
            title="Suggest a code from the department name"
            onClick={() =>
              update(
                'code',
                generateCodeFromName(form.name)
              )
            }
            disabled={!form.name.trim()}
          >
            Generate
          </button>
        </div>
      </div>

      <div className="admin-field">
        <label>Description</label>

        <textarea
          rows="3"
          placeholder="Enter department description..."
          value={form.description}
          onChange={(e) =>
            update(
              'description',
              e.target.value
            )
          }
        />
      </div>

      {/* NEW: DEPARTMENT IMAGE */}
      <ImageUploadField
        label="Department Image"
        value={form.coverImage}
        onChange={(url) =>
          update(
            'coverImage',
            url
          )
        }
        adminKey={adminKey}
        type="department"
        identifier={
          initial?._id || 'new-department'
        }
      />

      <AdminSelect
        label="Block"
        value={form.blockId}
        onChange={(value) =>
          update(
            'blockId',
            value
          )
        }
        options={blocks}
        placeholder="Select block"
      />

      <div className="admin-field">
        <label>
          Floor Number
        </label>

        <input
          type="number"
          min="0"
          placeholder="0 = Ground Floor"
          value={form.floorNumber}
          onChange={(e) =>
            update(
              'floorNumber',
              Number(
                e.target.value
              )
            )
          }
        />
      </div>

      <div className="admin-field">
        <label>HOD Name</label>

        <input
          type="text"
          placeholder="Head of Department"
          value={form.hodName}
          onChange={(e) =>
            update(
              'hodName',
              e.target.value
            )
          }
        />
      </div>

      <FormActions
        isEdit={isEdit}
        saving={saving}
        onCancel={onCancel}
        updateText="Update Department"
        createText="Save Department"
      />
    </form>
  );
}

/* ============================================================
   ROOM FORM
   ============================================================ */

function RoomForm({
  initial,
  blocks,
  onSaved,
  onCancel,
  adminKey,
  notify,
}) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    name:
      initial?.name || '',

    roomNumber:
      initial?.roomNumber || '',

    type:
      ['classroom', 'lab', 'office', 'facility', 'other'].includes(initial?.type)
        ? initial.type
        : 'classroom',

    description:
      initial?.description || '',

    coverImage:
      initial?.coverImage || '',

    blockId:
      getBlockId(initial),

    floorNumber:
      initial?.floorNumber ?? 0,

    capacity:
      initial?.capacity ?? '',

    verified:
      Boolean(initial?.verified),
  });

  const [saving, setSaving] =
    useState(false);

  const update = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        name: form.name,

        roomNumber:
          form.roomNumber,

        type: form.type,

        description:
          form.description,

        // Optional image
        coverImage:
          form.coverImage || '',

        blockId:
          form.blockId || undefined,

        floorNumber:
          Number(form.floorNumber),

        capacity:
          form.capacity === ''
            ? undefined
            : Number(
                form.capacity
              ),

        verified:
          form.verified,
      };

      if (isEdit) {
        await api.put(
          `/rooms/${initial._id}`,
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" room updated.`
        );
      } else {
        await api.post(
          '/rooms',
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" room added.`
        );
      }

      await onSaved();

      onCancel();
    } catch (err) {
      notify(
        'error',
        err.response?.data?.message ||
          'Failed to save room'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="admin-form"
      onSubmit={submit}
    >
      <div className="admin-field">
        <label>
          Room Name
        </label>

        <input
          type="text"
          placeholder="e.g. Computer Lab (optional)"
          value={form.name}
          onChange={(e) =>
            update(
              'name',
              e.target.value
            )
          }
        />
      </div>

      <div className="admin-field-row">
        <div className="admin-field">
          <label>
            Room Number <span>*</span>
          </label>

          <input
            type="text"
            placeholder="e.g. 101"
            required
            value={
              form.roomNumber
            }
            onChange={(e) =>
              update(
                'roomNumber',
                e.target.value
              )
            }
          />
        </div>

        <div className="admin-field">
          <label>
            Room Type
          </label>

          <select
            value={form.type}
            onChange={(e) =>
              update(
                'type',
                e.target.value
              )
            }
          >
            <option value="classroom">Classroom</option>
            <option value="lab">Lab</option>
            <option value="office">Office</option>
            <option value="facility">Facility</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>

      {/* NEW: OPTIONAL ROOM IMAGE */}
      <ImageUploadField
        label="Room Image (Optional)"
        value={form.coverImage}
        onChange={(url) =>
          update(
            'coverImage',
            url
          )
        }
        adminKey={adminKey}
        type="room"
        identifier={
          initial?._id || 'new-room'
        }
      />

      <AdminSelect
        label="Block"
        value={form.blockId}
        onChange={(value) =>
          update(
            'blockId',
            value
          )
        }
        options={blocks}
        placeholder="Select block"
        required
      />

      <div className="admin-field-row">
        <div className="admin-field">
          <label>
            Floor Number
          </label>

          <input
            type="number"
            min="0"
            value={
              form.floorNumber
            }
            onChange={(e) =>
              update(
                'floorNumber',
                Number(
                  e.target.value
                )
              )
            }
          />
        </div>

        <div className="admin-field">
          <label>
            Capacity
          </label>

          <input
            type="number"
            min="0"
            placeholder="e.g. 60"
            value={
              form.capacity
            }
            onChange={(e) =>
              update(
                'capacity',
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div className="admin-field">
        <label>Description</label>

        <textarea
          rows="3"
          placeholder="Enter room description..."
          value={
            form.description
          }
          onChange={(e) =>
            update(
              'description',
              e.target.value
            )
          }
        />
      </div>

      <label className="admin-checkbox-row">
        <input
          type="checkbox"
          checked={
            form.verified
          }
          onChange={(e) =>
            update(
              'verified',
              e.target.checked
            )
          }
        />

        <span>
          Verified — visible to public
        </span>
      </label>

      <FormActions
        isEdit={isEdit}
        saving={saving}
        onCancel={onCancel}
        updateText="Update Room"
        createText="Save Room"
      />
    </form>
  );
}

/* ============================================================
   FACULTY FORM
   ============================================================ */

function FacultyForm({
  initial,
  departments,
  onSaved,
  onCancel,
  adminKey,
  notify,
}) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    name:
      initial?.name || '',

    designation:
      initial?.designation || '',

    departmentId:
      getDepartmentId(initial),

    email:
      initial?.email || '',

    phone:
      initial?.phone || '',

    description:
      initial?.description || '',

    coverImage:
      initial?.coverImage || '',

    approvedForDisplay:
      Boolean(
        initial?.approvedForDisplay
      ),
  });

  const [saving, setSaving] =
    useState(false);

  const update = (
    field,
    value
  ) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const payload = {
        name: form.name,

        designation:
          form.designation,

        departmentId:
          form.departmentId ||
          undefined,

        email:
          form.email,

        phone:
          form.phone,

        description:
          form.description,

        coverImage:
          form.coverImage || '',

        approvedForDisplay:
          form.approvedForDisplay,
      };

      if (isEdit) {
        await api.put(
          `/faculty/${initial._id}`,
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" faculty updated.`
        );
      } else {
        await api.post(
          '/faculty',
          payload,
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        );

        notify(
          'success',
          `"${form.name}" faculty added.`
        );
      }

      await onSaved();

      onCancel();
    } catch (err) {
      notify(
        'error',
        err.response?.data?.message ||
          'Failed to save faculty'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      className="admin-form"
      onSubmit={submit}
    >
      <div className="admin-field">
        <label>
          Faculty Name <span>*</span>
        </label>

        <input
          type="text"
          placeholder="e.g. Dr. John Smith"
          value={form.name}
          onChange={(e) =>
            update(
              'name',
              e.target.value
            )
          }
          required
        />
      </div>

      <div className="admin-field">
        <label>
          Designation
        </label>

        <input
          type="text"
          placeholder="Professor / Assistant Professor"
          value={
            form.designation
          }
          onChange={(e) =>
            update(
              'designation',
              e.target.value
            )
          }
        />
      </div>

      {/* NEW: FACULTY IMAGE */}
      <ImageUploadField
        label="Faculty Image"
        value={form.coverImage}
        onChange={(url) =>
          update(
            'coverImage',
            url
          )
        }
        adminKey={adminKey}
        type="faculty"
        identifier={
          initial?._id || 'new-faculty'
        }
      />

      <AdminSelect
        label="Department"
        value={
          form.departmentId
        }
        onChange={(value) =>
          update(
            'departmentId',
            value
          )
        }
        options={departments}
        placeholder="Select department"
      />

      <div className="admin-field-row">
        <div className="admin-field">
          <label>Email</label>

          <input
            type="email"
            placeholder="faculty@example.com"
            value={form.email}
            onChange={(e) =>
              update(
                'email',
                e.target.value
              )
            }
          />
        </div>

        <div className="admin-field">
          <label>Phone</label>

          <input
            type="text"
            placeholder="Phone number"
            value={form.phone}
            onChange={(e) =>
              update(
                'phone',
                e.target.value
              )
            }
          />
        </div>
      </div>

      <div className="admin-field">
        <label>Description</label>

        <textarea
          rows="3"
          placeholder="Faculty description..."
          value={
            form.description
          }
          onChange={(e) =>
            update(
              'description',
              e.target.value
            )
          }
        />
      </div>

      <label className="admin-checkbox-row">
        <input
          type="checkbox"
          checked={
            form.approvedForDisplay
          }
          onChange={(e) =>
            update(
              'approvedForDisplay',
              e.target.checked
            )
          }
        />

        <span>
          Approved for public display
        </span>
      </label>

      <FormActions
        isEdit={isEdit}
        saving={saving}
        onCancel={onCancel}
        updateText="Update Faculty"
        createText="Save Faculty"
      />
    </form>
  );
}

/* ============================================================
   FORM ACTIONS
   ============================================================ */

function FormActions({
  isEdit,
  saving,
  onCancel,
  updateText,
  createText,
}) {
  return (
    <div className="block-form-actions">
      <button
        type="button"
        className="admin-cancel-btn"
        onClick={onCancel}
      >
        Cancel
      </button>

      <button
        type="submit"
        className="admin-save-btn"
        disabled={saving}
      >
        {saving
          ? 'Saving...'
          : isEdit
          ? updateText
          : createText}
      </button>
    </div>
  );
}

/* ============================================================
   GENERIC VIEW MODAL
   ============================================================ */

function EntityViewModal({
  type,
  item,
  blocks,
  departments,
  rooms,
  onClose,
}) {
  if (!item) return null;

  const block =
    blocks.find(
      (b) =>
        b._id === getBlockId(item)
    ) ||
    item.blockId;

  const department =
    departments.find(
      (d) =>
        d._id ===
        getDepartmentId(item)
    ) ||
    item.departmentId;

  return (
    <div
      className="block-modal-overlay view-overlay"
      onClick={onClose}
    >
      <div
        className="block-modal entity-view-modal"
        onClick={(e) =>
          e.stopPropagation()
        }
      >
        <div className="block-modal-header">
          <div>
            <h2>
              {item.name ||
                'Details'}
            </h2>

            <p>
              {type} details
            </p>
          </div>

          <button
            type="button"
            className="block-modal-close"
            onClick={onClose}
          >
            <FaTimes />
          </button>
        </div>

        {/* IMAGE FOR ALL ENTITIES */}
        {item.coverImage && (
          <img
            className="entity-view-image"
            src={item.coverImage}
            alt={item.name || type}
          />
        )}

        <div className="block-modal-content">
          {type === 'Blocks' && (
            <>
              <p>
                Code:{' '}
                <strong>
                  {item.code ||
                    '—'}
                </strong>
              </p>

              <p>
                {item.description ||
                  'No description available.'}
              </p>

              <div className="modal-meta">
                <span>
                  {item.floorCount ||
                    1}{' '}
                  Floors
                </span>

                <span>
                  {
                    rooms.filter(
                      (room) =>
                        getBlockId(
                          room
                        ) ===
                        item._id
                    ).length
                  }{' '}
                  Rooms
                </span>

                <span>
                  {
                    blocks.find(
                      (b) =>
                        b._id ===
                        item._id
                    )
                      ? 'Location data available'
                      : '—'
                  }
                </span>
              </div>
            </>
          )}

          {type === 'Departments' && (
            <>
              <p>
                <strong>
                  Code:
                </strong>{' '}
                {item.code ||
                  '—'}
              </p>

              <p>
                <strong>
                  Block:
                </strong>{' '}
                {getName(block) ||
                  'Unassigned'}
              </p>

              <p>
                <strong>
                  Floor:
                </strong>{' '}
                {item.floorNumber ===
                0
                  ? 'Ground Floor'
                  : item.floorNumber !=
                    null
                  ? `Floor ${item.floorNumber}`
                  : '—'}
              </p>

              <p>
                <strong>
                  HOD:
                </strong>{' '}
                {item.hodName ||
                  'Not assigned'}
              </p>

              <p>
                {item.description ||
                  'No description available.'}
              </p>
            </>
          )}

          {type === 'Rooms' && (
            <>
              <div className="modal-meta">
                <span>
                  Room:{' '}
                  {item.roomNumber ||
                    '—'}
                </span>

                <span>
                  Type:{' '}
                  {item.type ||
                    '—'}
                </span>

                <span>
                  Floor:{' '}
                  {item.floorNumber ??
                    '—'}
                </span>

                <span>
                  {item.verified
                    ? 'Verified'
                    : 'Unverified — not visible to public'}
                </span>
              </div>

              <p>
                <strong>
                  Block:
                </strong>{' '}
                {getName(block) ||
                  'Unassigned'}
              </p>

              {item.capacity !=
                null && (
                <p>
                  <strong>
                    Capacity:
                  </strong>{' '}
                  {item.capacity}
                </p>
              )}

              <p>
                {item.description ||
                  'No description available.'}
              </p>
            </>
          )}

          {type === 'Faculty' && (
            <>
              <p>
                <strong>
                  Designation:
                </strong>{' '}
                {item.designation ||
                  '—'}
              </p>

              <p>
                <strong>
                  Department:
                </strong>{' '}
                {getName(
                  department
                ) ||
                  'Unassigned'}
              </p>

              {item.email && (
                <p>
                  <FaEnvelope />{' '}
                  {item.email}
                </p>
              )}

              {item.phone && (
                <p>
                  <FaPhone />{' '}
                  {item.phone}
                </p>
              )}

              <div className="modal-meta">
                <span>
                  {item.approvedForDisplay ? (
                    <>
                      <FaCheckCircle />{' '}
                      Approved
                    </>
                  ) : (
                    <>
                      <FaClock />{' '}
                      Pending
                    </>
                  )}
                </span>
              </div>

              <p>
                {item.description ||
                  'No description available.'}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   ENTITY CARD
   ============================================================ */

function EntityCard({
  type,
  item,
  blocks,
  departments,
  onView,
  onEdit,
  onDelete,
}) {
  const block =
    blocks.find(
      (b) =>
        b._id ===
        getBlockId(item)
    ) ||
    item.blockId;

  const department =
    departments.find(
      (d) =>
        d._id ===
        getDepartmentId(item)
    ) ||
    item.departmentId;

  /* ==========================================================
     DEPARTMENT CARD
     ========================================================== */

  if (type === 'Departments') {
    return (
      <div className="block-admin-card entity-image-card">
        <div className="entity-card-image">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.name || 'Department'}
            />
          ) : (
            <div className="entity-card-image-placeholder">
              <FaChalkboardTeacher />
            </div>
          )}
        </div>

        <div className="block-admin-card-body">
          <div className="block-admin-title-row">
            <div>
              <h3>
                {item.name ||
                  'Unnamed Department'}
              </h3>

              <p className="block-admin-description">
                {item.description ||
                  'No description added.'}
              </p>
            </div>
          </div>

          <div className="block-admin-meta">
            <div className="block-meta-item">
              <span>
                <FaBuilding />
              </span>

              <div>
                <strong>
                  {getName(block) ||
                    '—'}
                </strong>

                <small>
                  Block
                </small>
              </div>
            </div>

            <div className="block-meta-item">
              <span>
                <FaLayerGroup />
              </span>

              <div>
                <strong>
                  {item.floorNumber ===
                  0
                    ? 'G'
                    : item.floorNumber ??
                      '—'}
                </strong>

                <small>
                  Floor
                </small>
              </div>
            </div>

            <div className="block-meta-item">
              <span>
                <FaUserTie />
              </span>

              <div>
                <strong>
                  {item.hodName ||
                    '—'}
                </strong>

                <small>
                  HOD
                </small>
              </div>
            </div>
          </div>

          <EntityActions
            onView={() =>
              onView(item)
            }
            onEdit={() =>
              onEdit(item)
            }
            onDelete={() =>
              onDelete(
                item._id,
                item.name
              )
            }
          />
        </div>
      </div>
    );
  }

  /* ==========================================================
     ROOM CARD
     ========================================================== */

  if (type === 'Rooms') {
    return (
      <div className="block-admin-card entity-image-card">
        <div className="entity-card-image">
          {item.coverImage ? (
            <img
              src={item.coverImage}
              alt={item.name || 'Room'}
            />
          ) : (
            <div className="entity-card-image-placeholder">
              <FaDoorOpen />
            </div>
          )}
        </div>

        <div className="block-admin-card-body">
          <div className="block-admin-title-row">
            <div>
              <h3>
                {item.name ||
                  'Unnamed Room'}
              </h3>

              <p className="block-admin-description">
                {item.description ||
                  'No description added.'}
              </p>
            </div>
          </div>

          <div className="block-admin-meta">
            <div className="block-meta-item">
              <span>
                <FaDoorOpen />
              </span>

              <div>
                <strong>
                  {item.roomNumber ||
                    '—'}
                </strong>

                <small>
                  Room No.
                </small>
              </div>
            </div>

            <div className="block-meta-item">
              <span>
                <FaBuilding />
              </span>

              <div>
                <strong>
                  {getName(block) ||
                    '—'}
                </strong>

                <small>
                  Block
                </small>
              </div>
            </div>

            <div className="block-meta-item">
              <span>
                <FaLayerGroup />
              </span>

              <div>
                <strong>
                  {item.floorNumber ?? 
                    '—'}
                </strong>

                <small>
                  Floor
                </small>
              </div>
            </div>

            <div className="block-meta-item">
              <span>
                {item.verified ? (
                  <FaCheckCircle />
                ) : (
                  <FaClock />
                )}
              </span>

              <div>
                <strong>
                  {item.verified
                    ? 'Verified'
                    : 'Unverified'}
                </strong>

                <small>
                  Public status
                </small>
              </div>
            </div>
          </div>

          <EntityActions
            onView={() =>
              onView(item)
            }
            onEdit={() =>
              onEdit(item)
            }
            onDelete={() =>
              onDelete(
                item._id,
                item.name
              )
            }
          />
        </div>
      </div>
    );
  }

  /* ==========================================================
     FACULTY CARD
     ========================================================== */

  return (
    <div className="block-admin-card entity-image-card">
      <div className="entity-card-image">
        {item.coverImage ? (
          <img
            src={item.coverImage}
            alt={item.name || 'Faculty'}
          />
        ) : (
          <div className="entity-card-image-placeholder">
            <FaUserTie />
          </div>
        )}
      </div>

      <div className="block-admin-card-body">
        <div className="block-admin-title-row">
          <div>
            <h3>
              {item.name ||
                'Unnamed Faculty'}
            </h3>

            <p className="block-admin-description">
              {item.designation ||
                'Designation not added.'}
            </p>
          </div>
        </div>

        <div className="block-admin-meta">
          <div className="block-meta-item">
            <span>
              <FaChalkboardTeacher />
            </span>

            <div>
              <strong>
                {getName(
                  department
                ) ||
                  '—'}
              </strong>

              <small>
                Department
              </small>
            </div>
          </div>

          <div className="block-meta-item">
            <span>
              <FaEnvelope />
            </span>

            <div>
              <strong>
                {item.email
                  ? 'Yes'
                  : '—'}
              </strong>

              <small>
                Email
              </small>
            </div>
          </div>

          <div className="block-meta-item">
            <span>
              {item.approvedForDisplay ? (
                <FaCheckCircle />
              ) : (
                <FaClock />
              )}
            </span>

            <div>
              <strong>
                {item.approvedForDisplay
                  ? 'Approved'
                  : 'Pending'}
              </strong>

              <small>
                Status
              </small>
            </div>
          </div>
        </div>

        <EntityActions
          onView={() =>
            onView(item)
          }
          onEdit={() =>
            onEdit(item)
          }
          onDelete={() =>
            onDelete(
              item._id,
              item.name
            )
          }
        />
      </div>
    </div>
  );
}

/* ============================================================
   ENTITY ACTIONS
   ============================================================ */

function EntityActions({
  onView,
  onEdit,
  onDelete,
}) {
  return (
    <div className="block-admin-actions">
      <button
        type="button"
        className="block-view-btn"
        onClick={onView}
      >
        <FaEye />
        <span>View</span>
      </button>

      <button
        type="button"
        className="block-edit-btn"
        onClick={onEdit}
      >
        <FaEdit />
        <span>Edit</span>
      </button>

      <button
        type="button"
        className="block-delete-btn"
        onClick={onDelete}
        title="Delete"
      >
        <FaTrash />
      </button>
    </div>
  );
}

/* ============================================================
   MAIN ADMIN
   ============================================================ */

export default function Admin() {
  const {
    key,
    save,
    clear,
  } = useAdminKey();

  const {
    toasts,
    notify,
  } = useToasts();

  const [tab, setTab] =
    useState('Blocks');

  const [blocks, setBlocks] =
    useState([]);

  const [departments, setDepartments] =
    useState([]);

  const [rooms, setRooms] =
    useState([]);

  const [faculty, setFaculty] =
    useState([]);

  const [loadingData, setLoadingData] =
    useState(true);

  const [search, setSearch] =
    useState('');

  const [filter, setFilter] =
    useState('all');

  const [showFilter, setShowFilter] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState(null);

  const [viewingItem, setViewingItem] =
    useState(null);

  /* ==========================================================
     LOAD ALL
     ========================================================== */

  const loadAll = async (adminKey) => {
    setLoadingData(true);

    try {
      const [
        blocksResponse,
        departmentsResponse,
        roomsResponse,
        facultyResponse,
      ] = await Promise.all([
        api.get('/blocks'),

        api.get('/departments'),

        api.get(
          '/rooms/admin/all',
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        ),

        api.get(
          '/faculty/admin/all',
          {
            headers: {
              'x-admin-key':
                adminKey,
            },
          }
        ),
      ]);

      setBlocks(
        blocksResponse.data.data ||
          []
      );

      setDepartments(
        departmentsResponse.data.data ||
          []
      );

      setRooms(
        roomsResponse.data.data ||
          []
      );

      setFaculty(
        facultyResponse.data.data ||
          []
      );
    } catch (err) {
      if (
        err.response?.status ===
        401
      ) {
        notify(
          'error',
          'Invalid admin key.'
        );

        clear();
      } else {
        notify(
          'error',
          err.response?.data?.message ||
            'Failed to load admin data.'
        );
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (key) {
      loadAll(key);
    } else {
      setLoadingData(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  /* ==========================================================
     RESET SEARCH WHEN TAB CHANGES
     ========================================================== */

  useEffect(() => {
    setSearch('');
    setFilter('all');
    setShowFilter(false);
  }, [tab]);

  /* ==========================================================
     DATA FOR CURRENT TAB
     ========================================================== */

  const currentItems = useMemo(() => {
    if (tab === 'Blocks')
      return blocks;

    if (tab === 'Departments')
      return departments;

    if (tab === 'Rooms')
      return rooms;

    return faculty;
  }, [
    tab,
    blocks,
    departments,
    rooms,
    faculty,
  ]);

  /* ==========================================================
     SEARCH + FILTER
     ========================================================== */

  const filteredItems = useMemo(() => {
    const query =
      search
        .trim()
        .toLowerCase();

    return currentItems.filter(
      (item) => {
        let searchable = '';

        if (tab === 'Blocks') {
          searchable = [
            item.name,
            item.code,
            item.description,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        }

        if (
          tab === 'Departments'
        ) {
          const block =
            blocks.find(
              (b) =>
                b._id ===
                getBlockId(item)
            );

          searchable = [
            item.name,
            item.code,
            item.description,
            item.hodName,
            getName(block),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        }

        if (tab === 'Rooms') {
          const block =
            blocks.find(
              (b) =>
                b._id ===
                getBlockId(item)
            );

          searchable = [
            item.name,
            item.roomNumber,
            item.type,
            item.description,
            getName(block),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        }

        if (tab === 'Faculty') {
          const department =
            departments.find(
              (d) =>
                d._id ===
                getDepartmentId(
                  item
                )
            );

          searchable = [
            item.name,
            item.designation,
            item.email,
            item.phone,
            getName(
              department
            ),
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        }

        const matchesSearch =
          !query ||
          searchable.includes(
            query
          );

        let matchesFilter = true;

        if (
          tab === 'Blocks'
        ) {
          const hasLocation =
            item.location?.lat !=
              null &&
            item.location?.lng !=
              null;

          if (
            filter ===
            'location'
          ) {
            matchesFilter =
              hasLocation;
          }

          if (
            filter ===
            'no-location'
          ) {
            matchesFilter =
              !hasLocation;
          }
        }

        if (
          tab === 'Departments'
        ) {
          if (
            filter ===
            'assigned'
          ) {
            matchesFilter =
              Boolean(
                getBlockId(item)
              );
          }

          if (
            filter ===
            'unassigned'
          ) {
            matchesFilter =
              !getBlockId(item);
          }
        }

        if (tab === 'Rooms') {
          if (
            filter ===
            'assigned'
          ) {
            matchesFilter =
              Boolean(
                getBlockId(item)
              );
          }

          if (
            filter ===
            'unassigned'
          ) {
            matchesFilter =
              !getBlockId(item);
          }
        }

        if (tab === 'Faculty') {
          if (
            filter ===
            'approved'
          ) {
            matchesFilter =
              Boolean(
                item.approvedForDisplay
              );
          }

          if (
            filter ===
            'pending'
          ) {
            matchesFilter =
              !item.approvedForDisplay;
          }
        }

        return (
          matchesSearch &&
          matchesFilter
        );
      }
    );
  }, [
    currentItems,
    search,
    filter,
    tab,
    blocks,
    departments,
  ]);

  /* ==========================================================
     LOGIN / LOGOUT
     ========================================================== */

  const handleLogin = (
    adminKey
  ) => {
    save(adminKey);

    notify(
      'success',
      'Logged in.'
    );
  };

  const handleLogout = () => {
    clear();

    notify(
      'success',
      'Logged out.'
    );
  };

  /* ==========================================================
     DELETE
     ========================================================== */

  const handleDelete = async (
    type,
    id,
    label
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${label}"? This cannot be undone.`
      );

    if (!confirmed)
      return;

    try {
      await api.delete(
        `/${type}/${id}`,
        {
          headers: {
            'x-admin-key':
              key,
          },
        }
      );

      notify(
        'success',
        `"${label}" deleted.`
      );

      await loadAll(key);
    } catch (err) {
      notify(
        'error',
        err.response?.data?.message ||
          'Failed to delete.'
      );
    }
  };

  /* ==========================================================
     OPEN ADD
     ========================================================== */

  const openAdd = () => {
    setEditingItem({
      __new: true,
    });
  };

  /* ==========================================================
     OPEN EDIT
     ========================================================== */

  const openEdit = (
    item
  ) => {
    setEditingItem({
      ...item,
    });
  };

  /* ==========================================================
     FILTER LABEL
     ========================================================== */

  const filterLabel = () => {
    if (tab === 'Blocks') {
      if (
        filter ===
        'location'
      )
        return 'With Location';

      if (
        filter ===
        'no-location'
      )
        return 'Without Location';

      return 'All Blocks';
    }

    if (
      tab ===
      'Departments'
    ) {
      if (
        filter ===
        'assigned'
      )
        return 'Assigned Block';

      if (
        filter ===
        'unassigned'
      )
        return 'No Block';

      return 'All Departments';
    }

    if (tab === 'Rooms') {
      if (
        filter ===
        'assigned'
      )
        return 'Assigned Block';

      if (
        filter ===
        'unassigned'
      )
        return 'No Block';

      return 'All Rooms';
    }

    if (filter === 'approved')
      return 'Approved';

    if (filter === 'pending')
      return 'Pending';

    return 'All Faculty';
  };

  /* ==========================================================
     COUNTS
     ========================================================== */

  const counts = {
    Blocks:
      blocks.length,

    Departments:
      departments.length,

    Rooms:
      rooms.length,

    Faculty:
      faculty.length,
  };

  /* ==========================================================
     LOGIN SCREEN
     ========================================================== */

  if (!key) {
    return (
      <>
        <ToastContainer
          toasts={toasts}
        />

        <AdminLogin
          onSubmit={
            handleLogin
          }
        />
      </>
    );
  }

  /* ==========================================================
     RENDER
     ========================================================== */

  return (
    <div className="admin-page">
      <ToastContainer
        toasts={toasts}
      />

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="admin-header-new">
        <div>
          <h1>
            Admin Panel
          </h1>
        </div>

        <button
          type="button"
          className="admin-logout-btn"
          onClick={
            handleLogout
          }
        >
          Log out
        </button>
      </div>

      {/* ======================================================
          TABS
         ====================================================== */}

      <div className="admin-tabs-new">
        {TAB_CONFIG.map(
          ({
            key: tabKey,
            icon,
          }) => (
            <button
              key={tabKey}
              type="button"
              className={
                tab ===
                tabKey
                  ? 'admin-tab-new active'
                  : 'admin-tab-new'
              }
              onClick={() =>
                setTab(
                  tabKey
                )
              }
            >
              <span>
                {icon}
              </span>

              {tabKey}

              <b>
                {loadingData
                  ? '...'
                  : counts[
                      tabKey
                    ]}
              </b>
            </button>
          )
        )}
      </div>

      {/* ======================================================
          MANAGEMENT AREA
         ====================================================== */}

      <div className="blocks-admin-page">

        {/* TOPBAR */}

        <div className="blocks-admin-topbar">
          <div>
            <h2>
              {tab}
            </h2>

            <p>
              {tab ===
                'Blocks' &&
                'Manage campus buildings and their floor information.'}

              {tab ===
                'Departments' &&
                'Manage departments, HODs and department locations.'}

              {tab ===
                'Rooms' &&
                'Manage classrooms, labs and other campus rooms.'}

              {tab ===
                'Faculty' &&
                'Manage faculty members and display approval.'}
            </p>
          </div>

          <button
            type="button"
            className="blocks-add-btn"
            onClick={
              openAdd
            }
          >
            <FaPlus />

            <span>
              Add New{' '}
              {tab ===
              'Blocks'
                ? 'Block'
                : tab ===
                  'Departments'
                ? 'Department'
                : tab ===
                  'Rooms'
                ? 'Room'
                : 'Faculty'}
            </span>
          </button>
        </div>

        {/* TOOLBAR */}

        <div className="blocks-toolbar">
          <div className="blocks-search">
            <FaSearch />

            <input
              type="text"
              placeholder={`Search ${tab.toLowerCase()}...`}
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target
                    .value
                )
              }
            />
          </div>

          <div className="blocks-filter">
            <button
              type="button"
              className="blocks-filter-btn"
              onClick={() =>
                setShowFilter(
                  (prev) =>
                    !prev
                )
              }
            >
              {filterLabel()}

              <span>
                {showFilter
                  ? '⌃'
                  : '⌄'}
              </span>
            </button>

            {showFilter && (
              <div className="blocks-filter-menu">

                <button
                  type="button"
                  onClick={() => {
                    setFilter(
                      'all'
                    );
                    setShowFilter(
                      false
                    );
                  }}
                >
                  {tab ===
                  'Blocks'
                    ? 'All Blocks'
                    : tab ===
                      'Departments'
                    ? 'All Departments'
                    : tab ===
                      'Rooms'
                    ? 'All Rooms'
                    : 'All Faculty'}
                </button>

                {tab ===
                  'Blocks' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'location'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      With Location
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'no-location'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      Without Location
                    </button>
                  </>
                )}

                {(
                  tab ===
                    'Departments' ||
                  tab ===
                    'Rooms'
                ) && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'assigned'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      Assigned Block
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'unassigned'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      Without Block
                    </button>
                  </>
                )}

                {tab ===
                  'Faculty' && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'approved'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      Approved
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setFilter(
                          'pending'
                        );
                        setShowFilter(
                          false
                        );
                      }}
                    >
                      Pending
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ====================================================
            CARDS
           ==================================================== */}

        <div className="blocks-card-grid">

          {/* LOADING */}

          {loadingData ? (
            <div className="blocks-empty">
              <div className="blocks-empty-icon">
                ⏳
              </div>

              <h3>
                Loading...
              </h3>

              <p>
                Loading admin data.
              </p>
            </div>
          ) : filteredItems.length ===
            0 ? (
            /* EMPTY */

            <div className="blocks-empty">
              <div className="blocks-empty-icon">
                {tab ===
                'Blocks' ? (
                  <FaBuilding />
                ) : tab ===
                  'Departments' ? (
                  <FaChalkboardTeacher />
                ) : tab ===
                  'Rooms' ? (
                  <FaDoorOpen />
                ) : (
                  <FaUserTie />
                )}
              </div>

              <h3>
                {search
                  ? `No ${tab.toLowerCase()} found`
                  : `No ${tab.toLowerCase()} yet`}
              </h3>

              <p>
                {search
                  ? 'Try a different search.'
                  : `Add your first ${tab.toLowerCase().slice(
                      0,
                      -1
                    )} to get started.`}
              </p>

              {!search && (
                <button
                  type="button"
                  className="blocks-add-btn"
                  onClick={
                    openAdd
                  }
                >
                  <FaPlus />

                  <span>
                    Add New{' '}
                    {tab ===
                    'Blocks'
                      ? 'Block'
                      : tab ===
                        'Departments'
                      ? 'Department'
                      : tab ===
                        'Rooms'
                      ? 'Room'
                      : 'Faculty'}
                  </span>
                </button>
              )}
            </div>
          ) : tab ===
            'Blocks' ? (
            /* ==================================================
               BLOCK CARDS
               ================================================== */

            filteredItems.map(
              (block) => (
                <div
                  className="block-admin-card"
                  key={
                    block._id
                  }
                >
                  <div className="block-admin-image">
                    {block.coverImage ? (
                      <img
                        src={
                          block.coverImage
                        }
                        alt={
                          block.name
                        }
                      />
                    ) : (
                      <div className="block-admin-image-placeholder">
                        <FaBuilding />
                      </div>
                    )}

                    <span className="block-code-badge">
                      {block.code ||
                        '—'}
                    </span>
                  </div>

                  <div className="block-admin-card-body">
                    <div className="block-admin-title-row">
                      <div>
                        <h3>
                          {
                            block.name
                          }
                        </h3>

                        <p className="block-admin-description">
                          {block.description ||
                            'No description added.'}
                        </p>
                      </div>
                    </div>

                    <div className="block-admin-meta">
                      <div className="block-meta-item">
                        <span>
                          <FaBuilding />
                        </span>

                        <div>
                          <strong>
                            {block.floorCount ||
                              1}
                          </strong>

                          <small>
                            Floors
                          </small>
                        </div>
                      </div>

                      <div className="block-meta-item">
                        <span>
                          <FaDoorOpen />
                        </span>

                        <div>
                          <strong>
                            {
                              rooms.filter(
                                (
                                  room
                                ) =>
                                  getBlockId(
                                    room
                                  ) ===
                                  block._id
                              ).length
                            }
                          </strong>

                          <small>
                            Rooms
                          </small>
                        </div>
                      </div>

                      <div className="block-meta-item">
                        <span>
                          <FaMapMarkerAlt />
                        </span>

                        <div>
                          <strong>
                            {block.location?.lat !=
                              null
                              ? 'Yes'
                              : '—'}
                          </strong>

                          <small>
                            Location
                          </small>
                        </div>
                      </div>
                    </div>

                    <EntityActions
                      onView={() =>
                        setViewingItem(
                          {
                            type: 'Blocks',
                            item: block,
                          }
                        )
                      }
                      onEdit={() =>
                        openEdit(
                          block
                        )
                      }
                      onDelete={() =>
                        handleDelete(
                          'blocks',
                          block._id,
                          block.name
                        )
                      }
                    />
                  </div>
                </div>
              )
            )
          ) : (
            /* ==================================================
               DEPARTMENT / ROOM / FACULTY CARDS
               ================================================== */

            filteredItems.map(
              (item) => (
                <EntityCard
                  key={
                    item._id
                  }
                  type={tab}
                  item={item}
                  blocks={blocks}
                  departments={
                    departments
                  }
                  onView={() =>
                    setViewingItem(
                      {
                        type: tab,
                        item,
                      }
                    )
                  }
                  onEdit={() =>
                    openEdit(
                      item
                    )
                  }
                  onDelete={(
                    id,
                    label
                  ) =>
                    handleDelete(
                      tab ===
                        'Departments'
                        ? 'departments'
                        : tab ===
                          'Rooms'
                        ? 'rooms'
                        : 'faculty',
                      id,
                      label
                    )
                  }
                />
              )
            )
          )}
        </div>
      </div>

      {/* ======================================================
          ADD / EDIT MODAL
         ====================================================== */}

      {editingItem && (
        <div
          className="block-modal-overlay"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              setEditingItem(
                null
              );
            }
          }}
        >
          <div className="block-modal">

            <div className="block-modal-header">
              <div>
                <h2>
                  {editingItem.__new
                    ? `Add New ${
                        tab ===
                        'Blocks'
                          ? 'Block'
                          : tab ===
                            'Departments'
                          ? 'Department'
                          : tab ===
                            'Rooms'
                          ? 'Room'
                          : 'Faculty'
                      }`
                    : `Edit ${
                        tab ===
                        'Blocks'
                          ? 'Block'
                          : tab ===
                            'Departments'
                          ? 'Department'
                          : tab ===
                            'Rooms'
                          ? 'Room'
                          : 'Faculty'
                      }`}
                </h2>

                <p>
                  {editingItem.__new
                    ? `Add a new ${tab.toLowerCase().slice(
                        0,
                        -1
                      )}.`
                    : `Update ${tab.toLowerCase().slice(
                        0,
                        -1
                      )} information.`}
                </p>
              </div>

              <button
                type="button"
                className="block-modal-close"
                onClick={() =>
                  setEditingItem(
                    null
                  )
                }
              >
                <FaTimes />
              </button>
            </div>

            {/* BLOCK */}

            {tab ===
              'Blocks' && (
              <BlockForm
                key={
                  editingItem.__new
                    ? 'new-block'
                    : editingItem._id
                }
                initial={
                  editingItem.__new
                    ? null
                    : editingItem
                }
                adminKey={
                  key
                }
                notify={
                  notify
                }
                onSaved={() =>
                  loadAll(
                    key
                  )
                }
                onCancel={() =>
                  setEditingItem(
                    null
                  )
                }
              />
            )}

            {/* DEPARTMENT */}

            {tab ===
              'Departments' && (
              <DepartmentForm
                key={
                  editingItem.__new
                    ? 'new-department'
                    : editingItem._id
                }
                initial={
                  editingItem.__new
                    ? null
                    : editingItem
                }
                blocks={
                  blocks
                }
                adminKey={
                  key
                }
                notify={
                  notify
                }
                onSaved={() =>
                  loadAll(
                    key
                  )
                }
                onCancel={() =>
                  setEditingItem(
                    null
                  )
                }
              />
            )}

            {/* ROOM */}

            {tab ===
              'Rooms' && (
              <RoomForm
                key={
                  editingItem.__new
                    ? 'new-room'
                    : editingItem._id
                }
                initial={
                  editingItem.__new
                    ? null
                    : editingItem
                }
                blocks={
                  blocks
                }
                adminKey={
                  key
                }
                notify={
                  notify
                }
                onSaved={() =>
                  loadAll(
                    key
                  )
                }
                onCancel={() =>
                  setEditingItem(
                    null
                  )
                }
              />
            )}

            {/* FACULTY */}

            {tab ===
              'Faculty' && (
              <FacultyForm
                key={
                  editingItem.__new
                    ? 'new-faculty'
                    : editingItem._id
                }
                initial={
                  editingItem.__new
                    ? null
                    : editingItem
                }
                departments={
                  departments
                }
                adminKey={
                  key
                }
                notify={
                  notify
                }
                onSaved={() =>
                  loadAll(
                    key
                  )
                }
                onCancel={() =>
                  setEditingItem(
                    null
                  )
                }
              />
            )}
          </div>
        </div>
      )}

      {/* ======================================================
          VIEW MODAL
         ====================================================== */}

      {viewingItem && (
        <EntityViewModal
          type={
            viewingItem.type
          }
          item={
            viewingItem.item
          }
          blocks={
            blocks
          }
          departments={
            departments
          }
          rooms={
            rooms
          }
          onClose={() =>
            setViewingItem(
              null
            )
          }
        />
      )}
    </div>
  );
}