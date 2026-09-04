import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Breadcrumb from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';
import DetailSkeleton from '../components/DetailSkeleton';
import Lightbox from '../components/Lightbox';
import LocationCard from '../components/LocationCard';

const FACULTY_PREVIEW_LIMIT = 5;

function floorLabel(floorNumber) {
  return floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`;
}

export default function DepartmentDetail() {
  const { id } = useParams();
  const [department, setDepartment] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/departments/${id}`),
      api.get('/rooms'),
      api.get('/faculty'),
    ])
      .then(([deptRes, roomsRes, facultyRes]) => {
        const dept = deptRes.data.data;
        setDepartment(dept);

        const allRooms = roomsRes.data.data || [];
        setRooms(
          allRooms.filter(
            (r) => (r.departmentId?._id || r.departmentId) === id
          )
        );

        const allFaculty = facultyRes.data.data || [];
        setFaculty(
          allFaculty.filter(
            (f) => (f.departmentId?._id || f.departmentId) === id
          )
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="page error">Error: {error}</p>;
  if (!department) return <p className="page">Department not found.</p>;

  const hasLocation =
    department.location?.lat != null ||
    department.blockId?.location?.lat != null;

  // Route to the department itself if it has its own coordinates,
  // otherwise fall back to routing to its block.
  const directionsTargetId = department.location?.lat != null ? department._id : department.blockId?._id;

  const facultyPreview = faculty.slice(0, FACULTY_PREVIEW_LIMIT);
  const hasMoreFaculty = faculty.length > FACULTY_PREVIEW_LIMIT;

  return (
    <div className="page block-detail">
      <div className="detail-toolbar">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Departments', to: '/departments' },
            { label: department.name },
          ]}
        />
        <ShareButton title={department.name} />
      </div>

      <div className="landmark-detail-card">
        {department.coverImage && (
          <div className="landmark-detail-media">
            <img
              src={department.coverImage}
              alt={department.name}
              className="zoomable-image"
              onClick={() => setLightboxSrc(department.coverImage)}
            />
          </div>
        )}

        <div className="landmark-detail-info">
          <h1>{department.name}</h1>

          <div className="room-detail-meta">
            {department.blockId?.name && (
              <Link
                to={`/blocks/${department.blockId._id}`}
                className="room-detail-badge chip-link"
              >
                Block: {department.blockId.name}
              </Link>
            )}

            {department.floorNumber != null && (
              <span className="room-detail-badge">
                {floorLabel(department.floorNumber)}
              </span>
            )}

            {rooms.map((r) => (
              <Link
                key={r._id}
                to={`/rooms/${r._id}`}
                className="room-detail-badge room-detail-type chip-link"
              >
                Room {r.roomNumber}
              </Link>
            ))}
          </div>

          {department.hodName && (
            <p className="subtitle">HOD: {department.hodName}</p>
          )}

          {department.contactEmail && (
            <p className="subtitle">
              Contact: <a href={`mailto:${department.contactEmail}`}>{department.contactEmail}</a>
            </p>
          )}

          {department.description && (
            <p className="subtitle">{department.description}</p>
          )}

          <div className="about-cta">
            {department.blockId?._id && (
              <Link to={`/blocks/${department.blockId._id}`} className="btn-secondary">
                View {department.blockId.name} floor plan
              </Link>
            )}

            {hasLocation && directionsTargetId && (
              <Link to={`/map?to=${directionsTargetId}`} className="btn-secondary">
                🧭 Get Directions
              </Link>
            )}
          </div>
        </div>
      </div>

      {faculty.length > 0 && (
        <div style={{ maxWidth: 920, margin: '28px auto 0' }}>
          <h2 style={{ fontSize: 20, marginBottom: 4 }}>Faculty</h2>
          <p className="subtitle" style={{ marginBottom: 12 }}>
            {faculty.length} member{faculty.length === 1 ? '' : 's'} in this department
          </p>

          <div className="faculty-preview-grid">
            {facultyPreview.map((f) => (
              <LocationCard
                key={f._id}
                title={f.name}
                subtitle={f.designation}
                image={f.photo || f.coverImage}
              />
            ))}

            {hasMoreFaculty && (
              <Link to="/faculty" className="faculty-preview-more">
                +{faculty.length - FACULTY_PREVIEW_LIMIT} more →
              </Link>
            )}
          </div>
        </div>
      )}

      {rooms.some((r) => r.coverImage) && (
        <div style={{ maxWidth: 920, margin: '28px auto 0' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>Room Photos</h2>
          <div className="room-detail-photos">
            {rooms.map(
              (r) =>
                r.coverImage && (
                  <img
                    key={r._id}
                    src={r.coverImage}
                    alt={`Room ${r.roomNumber}`}
                    className="zoomable-image"
                    onClick={() => setLightboxSrc(r.coverImage)}
                  />
                )
            )}
          </div>
        </div>
      )}

      <Lightbox src={lightboxSrc} alt={department.name} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
