import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  FaBuilding,
  FaSearch,
  FaLayerGroup,
  FaMapMarkerAlt,
  FaDoorOpen,
  FaArrowRight,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from 'react-icons/fa';

import api from '../api/axios';
import '../styles/DepartmentDirectory.css';

const DEPARTMENTS_PER_PAGE = 10;

export default function DepartmentDirectory() {
  const [departments, setDepartments] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================================
     LOAD DEPARTMENTS + ROOMS
     (rooms are needed to look up each department's numbered room,
     e.g. "Room 62" — a department only knows its block/floor)
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    Promise.all([api.get('/departments'), api.get('/rooms')])
      .then(([deptRes, roomsRes]) => {
        if (!mounted) return;

        setDepartments(deptRes.data.data || []);
        setRooms(roomsRes.data.data || []);
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load departments'
        );
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  /* ============================================================
     RESET PAGE WHEN SEARCH / SORT CHANGES
     ============================================================ */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy]);

  /* ============================================================
     HELPERS
     ============================================================ */

  const getFloorLabel = (department) => {
    if (department.floorNumber == null) {
      return '—';
    }

    return department.floorNumber === 0
      ? 'Ground'
      : department.floorNumber;
  };

  const getBlockName = (department) => {
    return department.blockId?.name || '—';
  };

  const hasLocation = (department) => {
    return (
      department.location?.lat != null &&
      department.location?.lng != null
    );
  };

  // A department only stores which block/floor it's on — the actual
  // numbered room (e.g. "Room 62") lives on the Room document that
  // points back to it. Prefer an "office" room if there are several.
  const getDeptRoom = (department) => {
    const deptRooms = rooms.filter((room) => {
      const roomDeptId = room.departmentId?._id || room.departmentId;
      return roomDeptId === department._id;
    });

    if (deptRooms.length === 0) return null;

    return (
      deptRooms.find((room) => room.type === 'office') || deptRooms[0]
    );
  };

  /* ============================================================
     FILTER + SORT
     ============================================================ */

  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = departments.filter((department) => {
      if (!query) return true;

      return [
        department.name,
        department.code,
        department.hodName,
        department.description,
        department.blockId?.name,
        getFloorLabel(department),
        getDeptRoom(department)?.roomNumber,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    result.sort((a, b) => {
      const nameA = a.hodName || a.name || '';
      const nameB = b.hodName || b.name || '';

      if (sortBy === 'za') {
        return nameB.localeCompare(nameA);
      }

      return nameA.localeCompare(nameB);
    });

    return result;
  }, [departments, rooms, search, sortBy]);

  /* ============================================================
     PAGINATION
     ============================================================ */

  const totalPages = Math.ceil(
    filteredDepartments.length / DEPARTMENTS_PER_PAGE
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const paginatedDepartments = filteredDepartments.slice(
    (safeCurrentPage - 1) * DEPARTMENTS_PER_PAGE,
    safeCurrentPage * DEPARTMENTS_PER_PAGE
  );

  const goToPage = (page) => {
    const nextPage = Math.max(
      1,
      Math.min(page, totalPages || 1)
    );

    setCurrentPage(nextPage);

    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth',
    });
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="page department-directory-page">
        <div className="department-directory-loading">
          <FaBuilding />

          <h2>
            Loading Departments...
          </h2>

          <p>
            Please wait while departments are loaded.
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR
     ============================================================ */

  if (error) {
    return (
      <div className="page department-directory-page">
        <div className="department-directory-empty error-state">
          <FaBuilding />

          <h2>
            Unable to load departments
          </h2>

          <p>
            {error}
          </p>
        </div>
      </div>
    );
  }

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <div className="page department-directory-page">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="department-directory-header">
        <div className="department-directory-title">
          <div className="department-directory-title-icon">
            <FaBuilding />
          </div>

          <div>
            <h1>
              Departments
            </h1>

            <p>
              Explore all departments across the campus.
            </p>
          </div>
        </div>

        <div className="department-directory-total">
          <span className="department-directory-total-icon">
            <FaLayerGroup />
          </span>

          <div className="department-directory-total-text">
            <strong>
              {departments.length}
            </strong>

            <span>
              Total Departments
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          TOOLBAR
         ====================================================== */}

      <div className="department-directory-toolbar">
        {/* SEARCH */}

        <div className="department-directory-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search departments..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="department-directory-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* SORT + VIEW TOGGLE */}

        <div className="department-directory-toolbar-right">
          <div className="department-directory-sort">
            <select
              value={sortBy}
              onChange={(e) =>
                setSortBy(e.target.value)
              }
            >
              <option value="az">
                A - Z
              </option>

              <option value="za">
                Z - A
              </option>
            </select>
          </div>

          <div className="department-directory-view-toggle">
            <button
              type="button"
              className={
                viewMode === 'grid'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('grid')
              }
              aria-label="Grid view"
              title="Grid view"
            >
              <FaTh />
            </button>

            <button
              type="button"
              className={
                viewMode === 'list'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setViewMode('list')
              }
              aria-label="List view"
              title="List view"
            >
              <FaList />
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================
          DEPARTMENTS
         ====================================================== */}

      {filteredDepartments.length === 0 ? (
        <div className="department-directory-empty">
          <FaBuilding />

          <h2>
            {search
              ? 'No departments found'
              : 'No departments available'}
          </h2>

          <p>
            {search
              ? 'Try searching with a different department or HOD name.'
              : 'No campus departments have been added yet.'}
          </p>
        </div>
      ) : (
        <>
          {/* ==================================================
              GRID / LIST
             ================================================== */}

          <div
            className={
              viewMode === 'grid'
                ? 'department-directory-grid'
                : 'department-directory-grid list-view'
            }
          >
            {paginatedDepartments.map(
              (department) => {
                const deptRoom = getDeptRoom(department);

                return (
                <Link
                  to={`/departments/${department._id}`}
                  key={department._id}
                  className="department-directory-card-link"
                >
                  <article className="department-directory-card">
                    {/* IMAGE */}

                    <div className="department-directory-card-image">
                      {department.coverImage ? (
                        <img
                          src={department.coverImage}
                          alt={
                            department.hodName ||
                            'Department'
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="department-directory-image-placeholder">
                          <FaBuilding />
                        </div>
                      )}
                    </div>

                    {/* BODY */}

                    <div className="department-directory-card-body">
                      {/* DEPARTMENT NAME */}

                      <div className="department-directory-department-name">
                        {department.name || 'Department Name'}
                      </div>

                      {/* HOD NAME */}

                      <h2>
                        {department.hodName ||
                          'HOD Not Assigned'}
                      </h2>

                      {/* DESCRIPTION */}

                      <p className="department-directory-description">
                        {department.description ||
                          'No description available.'}
                      </p>

                      {/* META */}

                      <div className="department-directory-meta">
                        {/* FLOOR */}

                        <div className="department-directory-meta-item">
                          <FaLayerGroup />

                          <div>
                            <strong>
                              {getFloorLabel(
                                department
                              )}
                            </strong>

                            <span>
                              Floor
                            </span>
                          </div>
                        </div>

                        {/* BLOCK */}

                        <div className="department-directory-meta-item">
                          <FaBuilding />

                          <div>
                            <strong>
                              {getBlockName(
                                department
                              )}
                            </strong>

                            <span>
                              Block
                            </span>
                          </div>
                        </div>

                        {/* ROOM (falls back to LOCATION when the
                            department has no numbered room on file) */}

                        {deptRoom ? (
                          <div className="department-directory-meta-item">
                            <FaDoorOpen />

                            <div>
                              <strong>
                                {deptRoom.roomNumber}
                              </strong>

                              <span>
                                Room
                              </span>
                            </div>
                          </div>
                        ) : (
                          <div className="department-directory-meta-item">
                            <FaMapMarkerAlt />

                            <div>
                              <strong>
                                {hasLocation(
                                  department
                                )
                                  ? 'Yes'
                                  : '—'}
                              </strong>

                              <span>
                                Location
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* VIEW DETAILS */}

                      <div className="department-directory-view">
                        <span>View Details</span>

                        <FaArrowRight />
                      </div>
                    </div>
                  </article>
                </Link>
                );
              }
            )}
          </div>

          {/* ==================================================
              PAGINATION
             ================================================== */}

          {totalPages > 1 && (
            <div className="department-directory-pagination">
              <button
                type="button"
                disabled={safeCurrentPage === 1}
                onClick={() =>
                  goToPage(
                    safeCurrentPage - 1
                  )
                }
                aria-label="Previous page"
              >
                <FaChevronLeft />
              </button>

              {Array.from(
                {
                  length: totalPages,
                },
                (_, index) =>
                  index + 1
              ).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={
                    safeCurrentPage === page
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    goToPage(page)
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                disabled={
                  safeCurrentPage ===
                  totalPages
                }
                onClick={() =>
                  goToPage(
                    safeCurrentPage + 1
                  )
                }
                aria-label="Next page"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}

      {/* ======================================================
          RESULT COUNT
         ====================================================== */}

      {filteredDepartments.length > 0 && (
        <div className="department-directory-result-count">
          Showing{' '}
          {paginatedDepartments.length}{' '}
          of{' '}
          {filteredDepartments.length}{' '}
          departments
        </div>
      )}
    </div>
  );
}