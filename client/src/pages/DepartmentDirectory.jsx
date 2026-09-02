import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  FaChalkboardTeacher,
  FaSearch,
  FaTh,
  FaList,
  FaArrowRight,
  FaLayerGroup,
  FaUserTie,
  FaUsers,
  FaLaptopCode,
  FaMicrochip,
  FaCogs,
  FaFlask,
  FaPalette,
  FaChartLine,
  FaGlobe,
  FaBookOpen,
  FaBuilding,
} from 'react-icons/fa';

import api from '../api/axios';
import '../styles/DepartmentDirectory.css';

const DEPARTMENTS_PER_PAGE = 10;

/* ============================================================
   HELPERS
   ============================================================ */

function floorLabel(floorNumber) {
  if (floorNumber == null) return '';

  return floorNumber === 0
    ? 'Ground Floor'
    : `Floor ${floorNumber}`;
}

function getDepartmentCategory(department) {
  return department?.category || 'Other';
}

function getCategoryIcon(category) {
  switch (category) {
    case 'Computer Science':
       return <FaLaptopCode />;

    case 'Science':
      return <FaFlask />;

    case 'Arts':
      return <FaPalette />;

    case 'Commerce':
      return <FaChartLine />;

    default:
      return <FaBuilding />;
  }
}

function getCategoryClass(category) {
  return (
    `department-category-${category
      .toLowerCase()
      .replace(/\s+/g, '-')}`
  );
}

function getCountValue(value) {
  return value != null && value !== ''
    ? value
    : '—';
}

/* ============================================================
   COMPONENT
   ============================================================ */

export default function DepartmentDirectory() {
  const [departments, setDepartments] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState(null);

  const [search, setSearch] =
    useState('');

  const [sortBy, setSortBy] =
    useState('az');

  const [category, setCategory] =
    useState('All');

  const [viewMode, setViewMode] =
    useState('grid');

  const [currentPage, setCurrentPage] =
    useState(1);

  /* ==========================================================
     LOAD DEPARTMENTS
     ========================================================== */

  useEffect(() => {
    let mounted = true;

    api
      .get('/departments')
      .then((res) => {
        if (!mounted) return;

        setDepartments(
          res.data.data || []
        );
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

  /* ==========================================================
     RESET PAGE
     ========================================================== */

  useEffect(() => {
    setCurrentPage(1);
  }, [search, sortBy, category]);

  /* ==========================================================
     FILTER + SORT
     ========================================================== */

  const filteredDepartments = useMemo(() => {
    const query =
      search.trim().toLowerCase();

    const result =
      departments.filter((department) => {
        const departmentCategory =
          getDepartmentCategory(
            department
          );

        if (
          category !== 'All' &&
          departmentCategory !== category
        ) {
          return false;
        }

        if (!query) return true;

        return [
          department.name,
          department.code,
          department.description,
          department.hodName,
          department.blockId?.name,
          departmentCategory,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query);
      });

    result.sort((a, b) => {
      const nameA =
        a.name || '';

      const nameB =
        b.name || '';

      if (sortBy === 'za') {
        return nameB.localeCompare(
          nameA
        );
      }

      return nameA.localeCompare(
        nameB
      );
    });

    return result;
  }, [
    departments,
    search,
    sortBy,
    category,
  ]);

  /* ==========================================================
     PAGINATION
     ========================================================== */

  const totalPages = Math.ceil(
    filteredDepartments.length /
      DEPARTMENTS_PER_PAGE
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(
          currentPage,
          totalPages
        )
      : 1;

  const paginatedDepartments =
    filteredDepartments.slice(
      (safeCurrentPage - 1) *
        DEPARTMENTS_PER_PAGE,
      safeCurrentPage *
        DEPARTMENTS_PER_PAGE
    );

  const goToPage = (page) => {
    const nextPage = Math.max(
      1,
      Math.min(
        page,
        totalPages || 1
      )
    );

    setCurrentPage(nextPage);
  };

  /* ==========================================================
     LOADING
     ========================================================== */

  if (loading) {
    return (
      <div className="page department-directory-page">
        <div className="department-directory-loading">
          <FaChalkboardTeacher />

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

  /* ==========================================================
     ERROR
     ========================================================== */

  if (error) {
    return (
      <div className="page department-directory-page">
        <div className="department-directory-empty error-state">
          <FaChalkboardTeacher />

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

  /* ==========================================================
     MAIN
     ========================================================== */

  return (
    <div className="page department-directory-page">

      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="department-directory-header">
        <div className="department-directory-title">

          <div className="department-directory-title-icon">
            <FaChalkboardTeacher />
          </div>

          <div>
            <h1>
              Departments
            </h1>

            <p>
              Explore all academic departments and their details.
            </p>
          </div>

        </div>

        <div className="department-directory-total">
          <span>
            Total Departments
          </span>

          <strong>
            {departments.length}
          </strong>
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
              setSearch(
                e.target.value
              )
            }
          />
        </div>

        {/* SORT */}

        <div className="department-directory-sort">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(
                e.target.value
              )
            }
          >
            <option value="az">
              Sort by: A - Z
            </option>

            <option value="za">
              Sort by: Z - A
            </option>
          </select>
        </div>

        {/* VIEW */}

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
          >
            <FaList />
          </button>

        </div>

        {/* CATEGORY FILTER */}

        <div className="department-directory-category-filter">

          {[
            'All',
            'Computer Science',
            'Science',
            'Arts',
            'Commerce',
            'Other',
          ].map((item) => (
            <button
              key={item}
              type="button"
              className={
                category === item
                  ? `active ${getCategoryClass(
                      item
                    )}`
                  : getCategoryClass(
                      item
                    )
              }
              onClick={() =>
                setCategory(item)
              }
            >
              <span>
                {item ===
                'All' ? (
                  <FaBuilding />
                ) : (
                  getCategoryIcon(item)
                )}
              </span>

              {item}
            </button>
          ))}

        </div>
      </div>

      {/* ======================================================
          EMPTY
         ====================================================== */}

      {filteredDepartments.length === 0 ? (
        <div className="department-directory-empty">

          <FaChalkboardTeacher />

          <h2>
            {search
              ? 'No departments found'
              : 'No departments available'}
          </h2>

          <p>
            {search
              ? 'Try searching with a different department name or code.'
              : 'No departments have been added yet.'}
          </p>

        </div>
      ) : (
        <>
          {/* ==================================================
              DEPARTMENT GRID
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

                const departmentCategory =
                  getDepartmentCategory(
                    department
                  );

                const departmentIcon =
                  getCategoryIcon(
                    departmentCategory
                  );

                const blockName =
                  department.blockId?.name;

                const floor =
                  floorLabel(
                    department.floorNumber
                  );

                /*
                  Existing project route is preserved:
                  departments assigned to a block
                  open that block.
                */

                const targetPath =
                  department.blockId?._id
                    ? `/blocks/${department.blockId._id}`
                    : '#';

                const card = (
                  <article
                    className={`department-directory-card ${getCategoryClass(
                      departmentCategory
                    )}`}
                  >

                    {/* IMAGE */}

                    <div className="department-directory-card-image">

                      {department.coverImage ? (
                        <img
                          src={
                            department.coverImage
                          }
                          alt={
                            department.name ||
                            'Department'
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="department-directory-image-placeholder">
                          <FaChalkboardTeacher />
                        </div>
                      )}

                      <span className="department-directory-category-icon">
                        {departmentIcon}
                      </span>

                    </div>

                    {/* BODY */}

                    <div className="department-directory-card-body">

                      <div className="department-directory-card-heading">

                        <h2>
                          {department.name ||
                            'Unnamed Department'}
                        </h2>

                        {department.code && (
                          <span className="department-directory-code">
                            {department.code}
                          </span>
                        )}

                      </div>

                      <p className="department-directory-description">
                        {department.description ||
                          'No description available.'}
                      </p>

                      {/* DETAILS */}

                      <div className="department-directory-meta">

                        <div className="department-directory-meta-item">
                          <FaLayerGroup />

                          <div>
                            <strong>
                              {floor ||
                                '—'}
                            </strong>

                            <span>
                              Location
                            </span>
                          </div>
                        </div>

                        <div className="department-directory-meta-item">
                          <FaBuilding />

                          <div>
                            <strong>
                              {blockName ||
                                '—'}
                            </strong>

                            <span>
                              Block
                            </span>
                          </div>
                        </div>

                        <div className="department-directory-meta-item">
                          <FaUserTie />

                          <div>
                            <strong>
                              {department.hodName ||
                                '—'}
                            </strong>

                            <span>
                              HOD
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* OPTIONAL STATS */}

                      <div className="department-directory-stats">

                        <div>
                          <FaBookOpen />

                          <strong>
                            {getCountValue(
                              department.programCount
                            )}
                          </strong>

                          <span>
                            Programs
                          </span>
                        </div>

                        <div>
                          <FaUserTie />

                          <strong>
                            {getCountValue(
                              department.facultyCount
                            )}
                          </strong>

                          <span>
                            Faculty
                          </span>
                        </div>

                        <div>
                          <FaUsers />

                          <strong>
                            {getCountValue(
                              department.studentCount
                            )}
                          </strong>

                          <span>
                            Students
                          </span>
                        </div>

                      </div>

                      {/* BUTTON */}

                      {department.blockId?._id ? (
                        <div className="department-directory-view">
                          <span>
                            View Details
                          </span>

                          <FaArrowRight />
                        </div>
                      ) : (
                        <div className="department-directory-view disabled">
                          <span>
                            Details Unavailable
                          </span>
                        </div>
                      )}

                    </div>
                  </article>
                );

                if (
                  department.blockId?._id
                ) {
                  return (
                    <Link
                      to={targetPath}
                      key={department._id}
                      className="department-directory-card-link"
                    >
                      {card}
                    </Link>
                  );
                }

                return (
                  <div
                    key={department._id}
                    className="department-directory-card-link"
                  >
                    {card}
                  </div>
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
                disabled={
                  safeCurrentPage ===
                  1
                }
                onClick={() =>
                  goToPage(
                    safeCurrentPage - 1
                  )
                }
                aria-label="Previous page"
              >
                ‹
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
                    safeCurrentPage ===
                    page
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
                ›
              </button>

            </div>
          )}
        </>
      )}

      {/* ======================================================
          RESULT COUNT
         ====================================================== */}

      {filteredDepartments.length >
        0 && (
        <div className="department-directory-result-count">
          Showing{' '}
          {paginatedDepartments.length}{' '}
          of{' '}
          {filteredDepartments.length}{' '}
          departments
        </div>
      )}

      {/* ======================================================
          BOTTOM HIGHLIGHTS
         ====================================================== */}

      <div className="department-directory-highlights">

        <div className="department-highlight-item">
          <div className="department-highlight-icon blue">
            <FaBookOpen />
          </div>

          <div>
            <strong>
              Academic Excellence
            </strong>

            <span>
              Quality education and research-driven learning.
            </span>
          </div>
        </div>

        <div className="department-highlight-item">
          <div className="department-highlight-icon green">
            <FaUserTie />
          </div>

          <div>
            <strong>
              Experienced Faculty
            </strong>

            <span>
              Learn from experienced professionals.
            </span>
          </div>
        </div>

        <div className="department-highlight-item">
          <div className="department-highlight-icon purple">
            <FaBuilding />
          </div>

          <div>
            <strong>
              Modern Infrastructure
            </strong>

            <span>
              Facilities designed for practical learning.
            </span>
          </div>
        </div>

        <div className="department-highlight-item">
          <div className="department-highlight-icon red">
            <FaGlobe />
          </div>

          <div>
            <strong>
              Career Focused
            </strong>

            <span>
              Preparing students for a successful future.
            </span>
          </div>
        </div>

      </div>

    </div>
  );
}