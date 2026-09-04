import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';
import Breadcrumb from '../components/Breadcrumb';
import ShareButton from '../components/ShareButton';
import DetailSkeleton from '../components/DetailSkeleton';
import Lightbox from '../components/Lightbox';

function floorLabel(floorNumber) {
  return floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`;
}

export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lightboxSrc, setLightboxSrc] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get(`/rooms/${id}`)
      .then((res) => setRoom(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <DetailSkeleton />;
  if (error) return <p className="page error">Error: {error}</p>;
  if (!room) return <p className="page">Room not found.</p>;

  const hasLocation = room.location && room.location.lat != null && room.location.lng != null;
  const directionsTargetId = hasLocation ? room._id : (room.blockId?._id || room.blockId);

  const allPhotos = [
    ...(room.coverImage ? [room.coverImage] : []),
    ...(room.photos || []),
  ].filter((src, i, arr) => arr.indexOf(src) === i);

  return (
    <div className="page block-detail">
      <div className="detail-toolbar">
        <Breadcrumb
          items={[
            { label: 'Home', to: '/' },
            { label: 'Rooms', to: '/rooms' },
            { label: room.name || `Room ${room.roomNumber}` },
          ]}
        />
        <ShareButton title={room.name || `Room ${room.roomNumber}`} />
      </div>

      <div className="landmark-detail-card">
        {allPhotos[0] && (
          <div className="landmark-detail-media">
            <img
              src={allPhotos[0]}
              alt={room.name || `Room ${room.roomNumber}`}
              className="zoomable-image"
              onClick={() => setLightboxSrc(allPhotos[0])}
            />
          </div>
        )}

        <div className="landmark-detail-info">
          <h1>{room.name || `Room ${room.roomNumber}`}</h1>

          <div className="room-detail-meta">
            <span className="room-detail-badge">Room {room.roomNumber}</span>
            <span className="room-detail-badge">{floorLabel(room.floorNumber)}</span>
            <span className="room-detail-badge room-detail-type">{room.type}</span>
          </div>

          {room.departmentId && (
            <p className="subtitle">
              Department:{' '}
              <Link to={`/departments/${room.departmentId._id || room.departmentId}`}>
                {room.departmentId.name || 'View department'}
              </Link>
            </p>
          )}

          {room.blockId && (
            <p className="subtitle">
              Block:{' '}
              <Link to={`/blocks/${room.blockId._id || room.blockId}`}>
                {room.blockId.name || 'View block'}
              </Link>
            </p>
          )}

          {hasLocation && (
            <p className="subtitle">
              Coordinates: {room.location.lat.toFixed(6)}, {room.location.lng.toFixed(6)}
            </p>
          )}

          <div className="about-cta">
            {room.blockId && (
              <Link to={`/blocks/${room.blockId._id || room.blockId}`} className="btn-secondary">
                View floor plan
              </Link>
            )}

            {directionsTargetId && (
              <Link to={`/map?to=${directionsTargetId}`} className="btn-secondary">
                🧭 Get Directions
              </Link>
            )}
          </div>
        </div>
      </div>

      {allPhotos.length > 1 && (
        <div style={{ maxWidth: 920, margin: '28px auto 0' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>More Photos</h2>
          <div className="room-detail-photos">
            {allPhotos.slice(1).map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`${room.name || 'Room'} photo ${i + 2}`}
                className="zoomable-image"
                onClick={() => setLightboxSrc(src)}
              />
            ))}
          </div>
        </div>
      )}

      <Lightbox src={lightboxSrc} alt={room.name} onClose={() => setLightboxSrc(null)} />
    </div>
  );
}
