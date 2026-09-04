import { useEffect, useMemo, useState } from 'react';

import {
  FaChalkboardTeacher,
  FaSearch,
  FaUsers,
  FaBuilding,
  FaBriefcase,
  FaUserTie,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from 'react-icons/fa';

import api from '../api/axios';
import '../styles/FacultyDirectory.css';

const FACULTY_PER_PAGE = 10;

export default function FacultyDirectory() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================================
     LOAD FACULTY
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    api
      .get('/faculty')
      .then((res) => {
        if (!mounted) return;
        setFaculty(res.data.data || []);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to load faculty'
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

  const getDeptName = (member) => {
    return member.departmentId?.name || 'Department Not Assigned';
  };

  const getDesignation = (member) => {
    return member.designation || 'Faculty';
  };

  const getImage = (member) => {
    return member.photo || member.coverImage || '';
  };

  /* ============================================================
     FILTER + SORT
     ============================================================ */

  const filteredFaculty = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = faculty.filter((member) => {
      if (!query) return true;

      return [
        member.name,
        member.designation,
        member.departmentId?.name,
        member.email,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    result.sort((a, b) => {
      const nameA = a.name || '';
      const nameB = b.name || '';

      if (sortBy === 'za') {
        return nameB.localeCompare(nameA);
      }

      return nameA.localeCompare(nameB);
    });

    return result;
  }, [faculty, search, sortBy]);

  /* ============================================================
     PAGINATION
     ============================================================ */

  const totalPages = Math.ceil(
    filteredFaculty.length / FACULTY_PER_PAGE
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const paginatedFaculty = filteredFaculty.slice(
    (safeCurrentPage - 1) * FACULTY_PER_PAGE,
    safeCurrentPage * FACULTY_PER_PAGE
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
      <div className="page faculty-directory-page">
        <div className="faculty-directory-loading">
          <FaChalkboardTeacher />

          <h2>
            Loading Faculty...
          </h2>

          <p>
            Please wait while faculty members are loaded.
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
      <div className="page faculty-directory-page">
        <div className="faculty-directory-empty error-state">
          <FaChalkboardTeacher />

          <h2>
            Unable to load faculty
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
    <div className="page faculty-directory-page">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="faculty-directory-header">
        <div className="faculty-directory-title">
          <div className="faculty-directory-title-icon">
            <FaChalkboardTeacher />
          </div>

          <div>
            <h1>
              Faculty
            </h1>

            <p>
              Explore all faculty members across the campus.
            </p>
          </div>
        </div>

        <div className="faculty-directory-total">
          <span className="faculty-directory-total-icon">
            <FaUsers />
          </span>

          <div className="faculty-directory-total-text">
            <strong>
              {faculty.length}
            </strong>

            <span>
              Total Faculty
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          TOOLBAR
         ====================================================== */}

      <div className="faculty-directory-toolbar">
        {/* SEARCH */}

        <div className="faculty-directory-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search faculty..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="faculty-directory-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* SORT + VIEW TOGGLE */}

        <div className="faculty-directory-toolbar-right">
          <div className="faculty-directory-sort">
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

          <div className="faculty-directory-view-toggle">
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
          FACULTY
         ====================================================== */}

      {filteredFaculty.length === 0 ? (
        <div className="faculty-directory-empty">
          <FaChalkboardTeacher />

          <h2>
            {search
              ? 'No faculty found'
              : 'No faculty available'}
          </h2>

          <p>
            {search
              ? 'Try searching with a different name, department or designation.'
              : 'No faculty members have been added yet.'}
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
                ? 'faculty-directory-grid'
                : 'faculty-directory-grid list-view'
            }
          >
            {paginatedFaculty.map((member) => (
              <article
                className="faculty-directory-card"
                key={member._id}
              >
                {/* IMAGE */}

                <div className="faculty-directory-card-image">
                  {getImage(member) ? (
                    <img
                      src={getImage(member)}
                      alt={member.name || 'Faculty'}
                      loading="lazy"
                    />
                  ) : (
                    <div className="faculty-directory-image-placeholder">
                      <FaUserTie />
                    </div>
                  )}
                </div>

                {/* BODY */}

                <div className="faculty-directory-card-body">
                  {/* NAME */}

                  <h2 className="faculty-directory-name">
                    {member.name || 'Faculty Name'}
                  </h2>

                  {/* DEPARTMENT + ROLE */}

                  <div className="faculty-directory-meta">
                    <div className="faculty-directory-meta-item">
                      <FaBuilding />

                      <div>
                        <strong>
                          {getDeptName(member)}
                        </strong>

                        <span>
                          Department
                        </span>
                      </div>
                    </div>

                    <div className="faculty-directory-meta-item">
                      <FaBriefcase />

                      <div>
                        <strong>
                          {getDesignation(member)}
                        </strong>

                        <span>
                          Role
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* ==================================================
              PAGINATION
             ================================================== */}

          {totalPages > 1 && (
            <div className="faculty-directory-pagination">
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

      {filteredFaculty.length > 0 && (
        <div className="faculty-directory-result-count">
          Showing{' '}
          {paginatedFaculty.length}{' '}
          of{' '}
          {filteredFaculty.length}{' '}
          faculty members
        </div>
      )}
    </div>
  );
}