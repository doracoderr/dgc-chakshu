// ============================================================
// ADMIN PANEL
// Screenshot-style Blocks Management UI
// Functionality: Add / Edit / Delete / View Blocks
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
} from 'react-icons/fa';

import api from '../api/axios';
import { uploadImage } from '../utils/uploadImage';
import { generateId } from '../utils/generateId';
import ImageCropModal from '../components/ImageCropModal';

import "../styles/Admin.css";

const TAB_CONFIG = [
  { key: 'Blocks', icon: <FaBuilding /> },
  { key: 'Departments', icon: <FaChalkboardTeacher /> },
  { key: 'Rooms', icon: <FaDoorOpen /> },
  { key: 'Faculty', icon: <FaUserTie /> },
];

const RAW_SELECT_MAX_MB = 15;

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
          {toast.type === 'success' ? '✓' : '⚠'} {toast.message}
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
      { id, type, message },
    ]);

    setTimeout(() => {
      setToasts((prev) =>
        prev.filter((item) => item.id !== id)
      );
    }, 3500);
  };

  return { toasts, notify };
}

/* ============================================================
   IMAGE UPLOAD FIELD
   ============================================================ */

function ImageUploadField({
  label,
  value,
  onChange,
  adminKey,
  type,
  identifier,
  enableCrop = false,
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

    if (enableCrop) {
      if (
        file.size >
        RAW_SELECT_MAX_MB * 1024 * 1024
      ) {
        setError(
          `Image must be under ${RAW_SELECT_MAX_MB}MB.`
        );
        return;
      }

      setPendingFileName(file.name || 'photo.jpg');
      setCropSrc(URL.createObjectURL(file));
      return;
    }

    await doUpload(file);
  };

  const handleCropDone = async (blob) => {
    const file = new File(
      [blob],
      pendingFileName,
      { type: 'image/jpeg' }
    );

    URL.revokeObjectURL(cropSrc);
    setCropSrc(null);

    await doUpload(file);
  };

  const handleCropCancel = () => {
    URL.revokeObjectURL(cropSrc);
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
            <small>or paste image URL below</small>
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
        value={value}
        onChange={(e) => onChange(e.target.value)}
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
    () => sessionStorage.getItem('adminKey') || ''
  );

  const save = (value) => {
    sessionStorage.setItem('adminKey', value);
    setKey(value);
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

      <p className="subtitle">
        Enter the admin key to manage campus data.
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
   BLOCK FORM
   Screenshot ke right-side "Add New Block" panel
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
    _id: initial?._id || generateId(),
    name: initial?.name || '',
    code: initial?.code || '',
    description: initial?.description || '',
    coverImage: initial?.coverImage || '',
    floorCount: initial?.floorCount ?? 1,
    lat: initial?.location?.lat ?? '',
    lng: initial?.location?.lng ?? '',
  });

  const [saving, setSaving] = useState(false);

  const update = (field, value) => {
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
          lat !== '' && lng !== ''
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
              'x-admin-key': adminKey,
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
              'x-admin-key': adminKey,
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
      className="block-side-form"
      onSubmit={submit}
    >
      <div className="block-form-title">
        <div>
          <h2>
            {isEdit
              ? 'Edit Block'
              : 'Add New Block'}
          </h2>
        </div>

        {isEdit && (
          <button
            type="button"
            className="close-form-btn"
            onClick={onCancel}
          >
            <FaTimes />
          </button>
        )}
      </div>

      <div className="admin-field">
        <label>
          Block Name <span>*</span>
        </label>

        <input
          type="text"
          placeholder="e.g. Block - APJ"
          value={form.name}
          onChange={(e) =>
            update('name', e.target.value)
          }
          required
        />
      </div>

      <div className="admin-field">
        <label>
          Block Code <span>*</span>
        </label>

        <input
          type="text"
          placeholder="e.g. A"
          value={form.code}
          onChange={(e) =>
            update('code', e.target.value)
          }
          required
        />
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
          update('coverImage', url)
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
              Number(e.target.value)
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
              update('lat', e.target.value)
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
              update('lng', e.target.value)
            }
          />
        </div>
      </div>

      <div className="block-form-actions">
        {isEdit && (
          <button
            type="button"
            className="admin-cancel-btn"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}

        <button
          type="submit"
          className="admin-save-btn"
          disabled={saving}
        >
          {saving
            ? 'Saving...'
            : isEdit
            ? 'Update Block'
            : 'Save Block'}
        </button>
      </div>
    </form>
  );
}

/* ============================================================
   OTHER TABS - SIMPLE LIST
   ============================================================ */

function EntityList({
  items,
  labelKey,
  subLabelFn,
  onDelete,
  onEdit,
  emptyText,
}) {
  if (!items.length) {
    return (
      <p className="subtitle">
        {emptyText || 'No entries yet.'}
      </p>
    );
  }

  return (
    <div className="entity-list">
      {items.map((item) => (
        <div
          key={item._id}
          className="entity-list-item"
        >
          <div>
            <strong>
              {item[labelKey]}
            </strong>

            {subLabelFn && (
              <p>
                {subLabelFn(item)}
              </p>
            )}
          </div>

          <div className="entity-actions">
            <button
              type="button"
              onClick={() => onEdit(item)}
            >
              <FaEdit />
            </button>

            <button
              type="button"
              className="danger"
              onClick={() =>
                onDelete(
                  item._id,
                  item[labelKey]
                )
              }
            >
              <FaTrash />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   MAIN ADMIN
   ============================================================ */

export default function Admin() {
  const { key, save, clear } =
    useAdminKey();

  const { toasts, notify } =
    useToasts();

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

    const [blockFilter, setBlockFilter] =
  useState('all');

const [showBlockFilter, setShowBlockFilter] =
  useState(false);

  const [editingBlock, setEditingBlock] =
    useState(null);

  const [viewingBlock, setViewingBlock] =
    useState(null);

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
              'x-admin-key': adminKey,
            },
          }
        ),

        api.get(
          '/faculty/admin/all',
          {
            headers: {
              'x-admin-key': adminKey,
            },
          }
        ),
      ]);

      setBlocks(
        blocksResponse.data.data || []
      );

      setDepartments(
        departmentsResponse.data.data || []
      );

      setRooms(
        roomsResponse.data.data || []
      );

      setFaculty(
        facultyResponse.data.data || []
      );
    } catch (err) {
      if (err.response?.status === 401) {
        notify(
          'error',
          'Invalid admin key.'
        );

        clear();
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

  /* ============================================================
     BLOCK SEARCH
     ============================================================ */

  const filteredBlocks = useMemo(() => {
  const query =
    search.trim().toLowerCase();

  return blocks.filter((block) => {
    const matchesSearch =
      !query ||
      block.name
        ?.toLowerCase()
        .includes(query) ||
      block.code
        ?.toLowerCase()
        .includes(query) ||
      block.description
        ?.toLowerCase()
        .includes(query);

    const hasLocation =
      block.location?.lat != null &&
      block.location?.lng != null;

    const matchesFilter =
      blockFilter === 'all' ||
      (blockFilter === 'location' &&
        hasLocation) ||
      (blockFilter === 'no-location' &&
        !hasLocation);

    return (
      matchesSearch &&
      matchesFilter
    );
  });
}, [blocks, search, blockFilter]);

  const handleLogin = (adminKey) => {
    save(adminKey);
    notify('success', 'Logged in.');
  };

  const handleLogout = () => {
    clear();

    notify(
      'success',
      'Logged out.'
    );
  };

  const handleDelete = async (
    type,
    id,
    label
  ) => {
    const confirmed =
      window.confirm(
        `Delete "${label}"? This cannot be undone.`
      );

    if (!confirmed) return;

    try {
      await api.delete(
        `/${type}/${id}`,
        {
          headers: {
            'x-admin-key': key,
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
          'Failed to delete'
      );
    }
  };

  if (!key) {
    return (
      <>
        <ToastContainer
          toasts={toasts}
        />

        <AdminLogin
          onSubmit={handleLogin}
        />
      </>
    );
  }

  const counts = {
    Blocks: blocks.length,
    Departments:
      departments.length,
    Rooms: rooms.length,
    Faculty: faculty.length,
  };

  return (
    <div className="admin-page">

      <ToastContainer
        toasts={toasts}
      />

      {/* =====================================================
          ADMIN HEADER
          ===================================================== */}

      <div className="admin-header-new">
        <div>
          <h1>Admin Panel</h1>
        </div>

        <button
          type="button"
          className="admin-logout-btn"
          onClick={handleLogout}
        >
          Log out
        </button>
      </div>

      {/* =====================================================
          ADMIN TABS
          ===================================================== */}

      <div className="admin-tabs-new">
        {TAB_CONFIG.map(
          ({ key: tabKey, icon }) => (
            <button
              key={tabKey}
              type="button"
              className={
                tab === tabKey
                  ? 'admin-tab-new active'
                  : 'admin-tab-new'
              }
              onClick={() =>
                setTab(tabKey)
              }
            >
              <span>
                {icon}
              </span>

              {tabKey}

              <b>
                {loadingData
                  ? '...'
                  : counts[tabKey]}
              </b>
            </button>
          )
        )}
      </div>

      {/* =====================================================
          BLOCKS TAB
          ===================================================== */}

      {tab === 'Blocks' && (
        <div className="blocks-admin-page">

          {/* Header */}
          <div className="blocks-admin-topbar">
            <div>
              <h2>Blocks</h2>
              <p>
                Manage campus buildings and their floor information.
              </p>
            </div>

            <button
              type="button"
              className="blocks-add-btn"
              onClick={() =>
                setEditingBlock({ __new: true })
              }
            >
              <FaPlus />
              <span>Add New Block</span>
            </button>
          </div>

          {/* Search + filter */}
          <div className="blocks-toolbar">
  <div className="blocks-search">
    <FaSearch />

    <input
      type="text"
      placeholder="Search blocks..."
      value={search}
      onChange={(e) =>
        setSearch(e.target.value)
      }
    />
  </div>

  <div className="blocks-filter">
    <button
      type="button"
      className="blocks-filter-btn"
      onClick={() =>
        setShowBlockFilter(
          (prev) => !prev
        )
      }
    >
      {blockFilter === 'all'
        ? 'All Blocks'
        : blockFilter === 'location'
        ? 'With Location'
        : 'Without Location'}

      <span>
        {showBlockFilter
          ? '⌃'
          : '⌄'}
      </span>
    </button>

    {showBlockFilter && (
      <div className="blocks-filter-menu">
        <button
          type="button"
          onClick={() => {
            setBlockFilter('all');
            setShowBlockFilter(false);
          }}
        >
          All Blocks
        </button>

        <button
          type="button"
          onClick={() => {
            setBlockFilter('location');
            setShowBlockFilter(false);
          }}
        >
          With Location
        </button>

        <button
          type="button"
          onClick={() => {
            setBlockFilter('no-location');
            setShowBlockFilter(false);
          }}
        >
          Without Location
        </button>
      </div>
    )}
  </div>
</div>

          {/* Block cards */}
          <div className="blocks-card-grid">

            {filteredBlocks.length === 0 ? (

              <div className="blocks-empty">

                <div className="blocks-empty-icon">
                  <FaBuilding />
                </div>

                <h3>
                  {search
                    ? 'No blocks found'
                    : 'No blocks yet'}
                </h3>

                <p>
                  {search
                    ? 'Try a different block name or code.'
                    : 'Add your first campus block to get started.'}
                </p>

                {!search && (
                  <button
                    type="button"
                    className="blocks-add-btn"
                    onClick={() =>
                      setEditingBlock({
                        __new: true,
                      })
                    }
                  >
                    <FaPlus />
                    <span>Add New Block</span>
                  </button>
                )}

              </div>

            ) : (

              filteredBlocks.map((block) => (

                <div
                  className="block-admin-card"
                  key={block._id}
                >

                  {/* Image */}
                  <div className="block-admin-image">

                    {block.coverImage ? (
                      <img
                        src={block.coverImage}
                        alt={block.name}
                      />
                    ) : (
                      <div className="block-admin-image-placeholder">
                        <FaBuilding />
                      </div>
                    )}

                    <span className="block-code-badge">
                      {block.code || '—'}
                    </span>

                  </div>

                  {/* Content */}
                  <div className="block-admin-card-body">

                    <div className="block-admin-title-row">

                      <div>
                        <h3>
                          {block.name}
                        </h3>

                        <p className="block-admin-description">
                          {block.description ||
                            'No description added.'}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="block-more-btn"
                        title="More options"
                      >
                        ⋮
                      </button>

                    </div>

                    <div className="block-admin-meta">

                      <div className="block-meta-item">
                        <span>
                          <FaBuilding />
                        </span>

                        <div>
                          <strong>
                            {block.floorCount || 1}
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
                                (room) =>
                                  room.blockId?._id === block._id ||
                                  room.blockId === block._id
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
                            {block.location?.lat != null
                              ? 'Yes'
                              : '—'}
                          </strong>

                          <small>
                            Location
                          </small>
                        </div>
                      </div>

                    </div>

                    {/* Actions */}
                    <div className="block-admin-actions">

                      <button
                        type="button"
                        className="block-view-btn"
                        onClick={() =>
                          setViewingBlock(block)
                        }
                      >
                        <FaEye />
                        <span>View Block</span>
                      </button>

                      <button
                        type="button"
                        className="block-edit-btn"
                        onClick={() =>
                          setEditingBlock(block)
                        }
                      >
                        <FaEdit />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        className="block-delete-btn"
                        title="Delete Block"
                        onClick={() =>
                          handleDelete(
                            'blocks',
                            block._id,
                            block.name
                          )
                        }
                      >
                        <FaTrash />
                      </button>

                    </div>

                  </div>
                </div>
              ))
            )}

          </div>

          {/* =====================================================
              ADD / EDIT BLOCK MODAL
              ===================================================== */}

          {editingBlock && (
            <div
              className="block-modal-overlay"
              onMouseDown={(e) => {
                if (
                  e.target === e.currentTarget
                ) {
                  setEditingBlock(null);
                }
              }}
            >

              <div className="block-modal">

                <div className="block-modal-header">

                  <div>
                    <h2>
                      {editingBlock.__new
                        ? 'Add New Block'
                        : 'Edit Block'}
                    </h2>

                    <p>
                      {editingBlock.__new
                        ? 'Add a new campus building.'
                        : 'Update building information.'}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="block-modal-close"
                    onClick={() =>
                      setEditingBlock(null)
                    }
                  >
                    <FaTimes />
                  </button>

                </div>

                <BlockForm
                  key={
                    editingBlock.__new
                      ? 'new-block-modal'
                      : editingBlock._id
                  }
                  initial={
                    editingBlock.__new
                      ? null
                      : editingBlock
                  }
                  adminKey={key}
                  notify={notify}
                  onSaved={() =>
                    loadAll(key)
                  }
                  onCancel={() =>
                    setEditingBlock(null)
                  }
                />

              </div>
            </div>
          )}

        </div>
      )}

      {/* =====================================================
          DEPARTMENTS
          ===================================================== */}

      {tab === 'Departments' && (
        <div className="simple-admin-section">

          <h2>
            Departments Management
          </h2>

          <EntityList
            items={departments}
            labelKey="name"
            subLabelFn={(d) =>
              [
                d.blockId?.name,
                d.floorNumber != null
                  ? d.floorNumber === 0
                    ? 'Ground Floor'
                    : `Floor ${d.floorNumber}`
                  : '',
                d.hodName
                  ? `HOD: ${d.hodName}`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ')
            }
            onEdit={() => {}}
            onDelete={(id, label) =>
              handleDelete(
                'departments',
                id,
                label
              )
            }
            emptyText="No departments yet."
          />

        </div>
      )}

      {/* =====================================================
          ROOMS
          ===================================================== */}

      {tab === 'Rooms' && (
        <div className="simple-admin-section">

          <h2>
            Rooms Management
          </h2>

          <EntityList
            items={rooms}
            labelKey="name"
            subLabelFn={(room) =>
              `${room.roomNumber || ''} · ${
                room.type || ''
              } · ${
                room.blockId?.name ||
                'Unassigned'
              }`
            }
            onEdit={() => {}}
            onDelete={(id, label) =>
              handleDelete(
                'rooms',
                id,
                label
              )
            }
            emptyText="No rooms yet."
          />

        </div>
      )}

      {/* =====================================================
          FACULTY
          ===================================================== */}

      {tab === 'Faculty' && (
        <div className="simple-admin-section">

          <h2>
            Faculty Management
          </h2>

          <EntityList
            items={faculty}
            labelKey="name"
            subLabelFn={(f) =>
              `${f.designation || ''} · ${
                f.approvedForDisplay
                  ? 'Approved'
                  : 'Pending'
              }`
            }
            onEdit={() => {}}
            onDelete={(id, label) =>
              handleDelete(
                'faculty',
                id,
                label
              )
            }
            emptyText="No faculty yet."
          />

        </div>
      )}

      {/* =====================================================
          BLOCK VIEW MODAL
          ===================================================== */}

      {viewingBlock && (
        <div
          className="block-modal-overlay"
          onClick={() =>
            setViewingBlock(null)
          }
        >

          <div
            className="block-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >

            <button
              type="button"
              className="modal-close"
              onClick={() =>
                setViewingBlock(null)
              }
            >
              <FaTimes />
            </button>

            {viewingBlock.coverImage && (
              <img
                src={
                  viewingBlock.coverImage
                }
                alt={
                  viewingBlock.name
                }
              />
            )}

            <div className="block-modal-content">

              <h2>
                {viewingBlock.name}
              </h2>

              <p>
                Code:{' '}
                <strong>
                  {viewingBlock.code}
                </strong>
              </p>

              <p>
                {viewingBlock.description ||
                  'No description available.'}
              </p>

              <div className="modal-meta">

                <span>
                  {viewingBlock.floorCount ||
                    1}{' '}
                  Floors
                </span>

                <span>
                  {viewingBlock.roomCount ||
                    0}{' '}
                  Rooms
                </span>

                <span>
                  {viewingBlock.departmentCount ||
                    0}{' '}
                  Departments
                </span>

              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}