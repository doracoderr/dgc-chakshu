import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  FaBuilding,
  FaSearch,
  FaLayerGroup,
  FaDoorOpen,
  FaMapMarkerAlt,
  FaArrowRight,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';

import api from '../api/axios';
import '../styles/BlockDirectory.css';

const BLOCKS_PER_PAGE = 10;

export default function BlockDirectory() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================================
     LOAD BLOCKS
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    api
      .get('/blocks')
      .then((res) => {
        if (!mounted) return;

        setBlocks(res.data.data || []);
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load blocks'
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
     FILTER + SORT
     ============================================================ */

  const filteredBlocks = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = blocks.filter((block) => {
      if (!query) return true;

      return [
        block.name,
        block.code,
        block.description,
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
  }, [blocks, search, sortBy]);

  /* ============================================================
     PAGINATION
     ============================================================ */

  const totalPages = Math.ceil(
    filteredBlocks.length / BLOCKS_PER_PAGE
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const paginatedBlocks = filteredBlocks.slice(
    (safeCurrentPage - 1) * BLOCKS_PER_PAGE,
    safeCurrentPage * BLOCKS_PER_PAGE
  );

  /* ============================================================
     HELPERS
     ============================================================ */

  const getRoomCount = (block) => {
    return (
      block.roomCount ??
      block.roomsCount ??
      0
    );
  };

  const hasLocation = (block) => {
    return (
      block.location?.lat != null &&
      block.location?.lng != null
    );
  };

  const goToPage = (page) => {
    const nextPage = Math.max(
      1,
      Math.min(page, totalPages || 1)
    );

    setCurrentPage(nextPage);
  };

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="page block-directory-page">
        <div className="block-directory-loading">
          <FaBuilding />

          <h2>
            Loading Blocks...
          </h2>

          <p>
            Please wait while campus blocks are loaded.
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
      <div className="page block-directory-page">
        <div className="block-directory-empty error-state">
          <FaBuilding />

          <h2>
            Unable to load blocks
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
    <div className="page block-directory-page">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="block-directory-header">
        <div className="block-directory-title">
          <div className="block-directory-title-icon">
            <FaBuilding />
          </div>

          <div>
            <h1>
              Blocks
            </h1>

            <p>
              Explore all buildings and blocks across the campus.
            </p>
          </div>
        </div>

        <div className="block-directory-total">
          <span>
            Total Blocks
          </span>

          <strong>
            {blocks.length}
          </strong>
        </div>
      </div>

      {/* ======================================================
          TOOLBAR
         ====================================================== */}

      <div className="block-directory-toolbar">
        {/* SEARCH */}

        <div className="block-directory-search">
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

        {/* SORT */}

        <div className="block-directory-sort">
          <select
            value={sortBy}
            onChange={(e) =>
              setSortBy(e.target.value)
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

        {/* VIEW TOGGLE */}

        <div className="block-directory-view-toggle">
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

      {/* ======================================================
          BLOCKS
         ====================================================== */}

      {filteredBlocks.length === 0 ? (
        <div className="block-directory-empty">
          <FaBuilding />

          <h2>
            {search
              ? 'No blocks found'
              : 'No blocks available'}
          </h2>

          <p>
            {search
              ? 'Try searching with a different block name or code.'
              : 'No campus blocks have been added yet.'}
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
                ? 'block-directory-grid'
                : 'block-directory-grid list-view'
            }
          >
            {paginatedBlocks.map(
              (block) => (
                <Link
                  to={`/blocks/${block._id}`}
                  key={block._id}
                  className="block-directory-card-link"
                >
                  <article className="block-directory-card">
                    {/* IMAGE */}

                    <div className="block-directory-card-image">
                      {block.coverImage ? (
                        <img
                          src={block.coverImage}
                          alt={
                            block.name ||
                            'Campus Block'
                          }
                          loading="lazy"
                        />
                      ) : (
                        <div className="block-directory-image-placeholder">
                          <FaBuilding />
                        </div>
                      )}

                      {block.code && (
                        <span className="block-directory-code">
                          {block.code}
                        </span>
                      )}
                    </div>

                    {/* BODY */}

                    <div className="block-directory-card-body">
                      <h2>
                        {block.name ||
                          'Unnamed Block'}
                      </h2>

                      <p className="block-directory-description">
                        {block.description ||
                          'No description available.'}
                      </p>

                      {/* META */}

                      <div className="block-directory-meta">
                        <div className="block-directory-meta-item">
                          <FaLayerGroup />

                          <div>
                            <strong>
                              {block.floorCount ||
                                1}
                            </strong>

                            <span>
                              {Number(
                                block.floorCount ||
                                  1
                              ) === 1
                                ? 'Floor'
                                : 'Floors'}
                            </span>
                          </div>
                        </div>

                        <div className="block-directory-meta-item">
                          <FaDoorOpen />

                          <div>
                            <strong>
                              {getRoomCount(
                                block
                              )}
                            </strong>

                            <span>
                              {getRoomCount(
                                block
                              ) === 1
                                ? 'Room'
                                : 'Rooms'}
                            </span>
                          </div>
                        </div>

                        <div className="block-directory-meta-item">
                          <FaMapMarkerAlt />

                          <div>
                            <strong>
                              {hasLocation(
                                block
                              )
                                ? 'Yes'
                                : '—'}
                            </strong>

                            <span>
                              Location
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* VIEW DETAILS */}

                      <div className="block-directory-view">
                        <span>
                          View Details
                        </span>

                        <FaArrowRight />
                      </div>
                    </div>
                  </article>
                </Link>
              )
            )}
          </div>

          {/* ==================================================
              PAGINATION
             ================================================== */}

          {totalPages > 1 && (
            <div className="block-directory-pagination">
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

      {filteredBlocks.length > 0 && (
        <div className="block-directory-result-count">
          Showing{' '}
          {paginatedBlocks.length}{' '}
          of{' '}
          {filteredBlocks.length}{' '}
          blocks
        </div>
      )}
    </div>
  );
}