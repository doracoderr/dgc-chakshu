import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  FaDoorOpen,
  FaSearch,
  FaLayerGroup,
  FaBuilding,
  FaArrowRight,
  FaTh,
  FaList,
  FaChevronLeft,
  FaChevronRight,
  FaTimes,
} from 'react-icons/fa';

import api from '../api/axios';
import '../styles/RoomDirectory.css';

const ROOMS_PER_PAGE = 10;

export default function RoomDirectory() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('az');

  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);

  /* ============================================================
     LOAD ROOMS
     ============================================================ */

  useEffect(() => {
    let mounted = true;

    api
      .get('/rooms')
      .then((res) => {
        if (!mounted) return;

        setRooms(res.data.data || []);
      })
      .catch((err) => {
        if (!mounted) return;

        setError(
          err.response?.data?.message ||
            err.message ||
            'Failed to load rooms'
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

  const getRoomNumber = (room) => {
    return room.roomNumber
      ? `Room ${room.roomNumber}`
      : 'Room Number Not Available';
  };

  const getRoomType = (room) => {
    if (!room.type) return '—';

    return room.type.charAt(0).toUpperCase() + room.type.slice(1);
  };

  const getRoomCapacity = (room) => {
    return room.capacity ?? '—';
  };

  const getFloor = (room) => {
    if (room.floorNumber == null) {
      return '—';
    }

    return room.floorNumber === 0
      ? 'Ground'
      : room.floorNumber;
  };

  const getBlockName = (room) => {
    return room.blockId?.name || '—';
  };

  /* ============================================================
     FILTER + SORT
     ============================================================ */

  const filteredRooms = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = rooms.filter((room) => {
      if (!query) return true;

      return [
        room.roomNumber,
        room.name,
        room.type,
        room.capacity,
        room.floorNumber,
        getFloor(room),
        getBlockName(room),
      ]
        .filter(
          (value) =>
            value !== null &&
            value !== undefined &&
            value !== ''
        )
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    result.sort((a, b) => {
      const roomA = a.roomNumber || '';
      const roomB = b.roomNumber || '';

      if (sortBy === 'za') {
        return roomB.localeCompare(roomA);
      }

      return roomA.localeCompare(roomB);
    });

    return result;
  }, [rooms, search, sortBy]);

  /* ============================================================
     PAGINATION
     ============================================================ */

  const totalPages = Math.ceil(
    filteredRooms.length / ROOMS_PER_PAGE
  );

  const safeCurrentPage =
    totalPages > 0
      ? Math.min(currentPage, totalPages)
      : 1;

  const paginatedRooms = filteredRooms.slice(
    (safeCurrentPage - 1) * ROOMS_PER_PAGE,
    safeCurrentPage * ROOMS_PER_PAGE
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
      <div className="page room-directory-page">
        <div className="room-directory-loading">
          <FaDoorOpen />

          <h2>
            Loading Rooms...
          </h2>

          <p>
            Please wait while campus rooms are loaded.
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
      <div className="page room-directory-page">
        <div className="room-directory-empty error-state">
          <FaDoorOpen />

          <h2>
            Unable to load rooms
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
    <div className="page room-directory-page">
      {/* ======================================================
          HEADER
         ====================================================== */}

      <div className="room-directory-header">
        <div className="room-directory-title">
          <div className="room-directory-title-icon">
            <FaDoorOpen />
          </div>

          <div>
            <h1>
              Rooms
            </h1>

            <p>
              Explore all rooms and facilities across the campus.
            </p>
          </div>
        </div>

        <div className="room-directory-total">
          <span className="room-directory-total-icon">
            <FaLayerGroup />
          </span>

          <div className="room-directory-total-text">
            <strong>
              {rooms.length}
            </strong>

            <span>
              Total Rooms
            </span>
          </div>
        </div>
      </div>

      {/* ======================================================
          TOOLBAR
         ====================================================== */}

      <div className="room-directory-toolbar">
        {/* SEARCH */}

        <div className="room-directory-search">
          <FaSearch />

          <input
            type="text"
            placeholder="Search rooms..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />

          {search && (
            <button
              type="button"
              className="room-directory-search-clear"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              title="Clear search"
            >
              <FaTimes />
            </button>
          )}
        </div>

        {/* SORT + VIEW */}

        <div className="room-directory-toolbar-right">
          <div className="room-directory-sort">
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

          <div className="room-directory-view-toggle">
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
          ROOMS
         ====================================================== */}

      {filteredRooms.length === 0 ? (
        <div className="room-directory-empty">
          <FaDoorOpen />

          <h2>
            {search
              ? 'No rooms found'
              : 'No rooms available'}
          </h2>

          <p>
            {search
              ? 'Try searching with a different room number, type, floor, or block.'
              : 'No campus rooms have been added yet.'}
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
                ? 'room-directory-grid'
                : 'room-directory-grid list-view'
            }
          >
            {paginatedRooms.map((room) => (
              <article
                className="room-directory-card"
                key={room._id}
              >
                {/* IMAGE */}

                <Link
                  to={`/rooms/${room._id}`}
                  className="room-directory-card-image-link"
                  aria-label={`View ${getRoomNumber(room)}`}
                >
                  <div className="room-directory-card-image">
                    {room.coverImage ? (
                      <img
                        src={room.coverImage}
                        alt={getRoomNumber(room)}
                        loading="lazy"
                      />
                    ) : (
                      <div className="room-directory-image-placeholder">
                        <FaDoorOpen />
                      </div>
                    )}
                  </div>
                </Link>

                {/* BODY */}

                <div className="room-directory-card-body">
                  {/* ROOM NUMBER */}

                  <Link
                    to={`/rooms/${room._id}`}
                    className="room-directory-room-name-link"
                  >
                    <h2>
                      {getRoomNumber(room)}
                    </h2>
                  </Link>

                  {/* SMALL BLOCK NAME */}

                  {room.blockId?._id ? (
                    <Link
                      to={`/blocks/${room.blockId._id}`}
                      className="room-directory-block-link"
                    >
                      <FaBuilding />

                      <span>
                        {getBlockName(room)}
                      </span>
                    </Link>
                  ) : (
                    <div className="room-directory-block-link disabled">
                      <FaBuilding />

                      <span>
                        —
                      </span>
                    </div>
                  )}

                  {/* META */}

                  <div className="room-directory-meta">
                    {/* ROOM TYPE */}

                    <Link
                      to={`/rooms/${room._id}`}
                      className="room-directory-meta-item-link"
                    >
                      <div className="room-directory-meta-item">
                        <FaDoorOpen />

                        <div>
                          <strong>
                            {getRoomType(room)}
                          </strong>

                          <span>
                            Room Type
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* CAPACITY */}

                    <Link
                      to={`/rooms/${room._id}`}
                      className="room-directory-meta-item-link"
                    >
                      <div className="room-directory-meta-item">
                        <FaLayerGroup />

                        <div>
                          <strong>
                            {getRoomCapacity(room)}
                          </strong>

                          <span>
                            Capacity
                          </span>
                        </div>
                      </div>
                    </Link>

                    {/* FLOOR */}

                    <Link
                      to={`/rooms/${room._id}`}
                      className="room-directory-meta-item-link"
                    >
                      <div className="room-directory-meta-item">
                        <FaLayerGroup />

                        <div>
                          <strong>
                            {getFloor(room)}
                          </strong>

                          <span>
                            Floor
                          </span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  {/* VIEW DETAILS */}

                  <Link
                    to={`/rooms/${room._id}`}
                    className="room-directory-view"
                  >
                    <span>
                      View Details
                    </span>

                    <FaArrowRight />
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* ==================================================
              PAGINATION
             ================================================== */}

          {totalPages > 1 && (
            <div className="room-directory-pagination">
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
                  safeCurrentPage === totalPages
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

      {filteredRooms.length > 0 && (
        <div className="room-directory-result-count">
          Showing{' '}
          {paginatedRooms.length}{' '}
          of{' '}
          {filteredRooms.length}{' '}
          rooms
        </div>
      )}
    </div>
  );
}