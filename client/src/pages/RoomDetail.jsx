import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';

export default function RoomDetail() {
  const { id } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/rooms/${id}`)
      .then((res) => setRoom(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="page">Loading room...</p>;
  if (error) return <p className="page error">Error: {error}</p>;
  if (!room) return <p className="page">Room not found.</p>;

  const hasLocation = room.location && room.location.lat != null && room.location.lng != null;

  return (
    <div className="page room-detail">
      <h1>{room.name}</h1>
      <div className="room-detail-meta">
        <span className="room-detail-badge">Room {room.roomNumber}</span>
        <span className="room-detail-badge">Floor {room.floorNumber}</span>
        <span className="room-detail-badge room-detail-type">{room.type}</span>
      </div>

      {room.departmentId && (
        <p className="subtitle">Department: {room.departmentId.name}</p>
      )}

      {room.blockId && (
        <p className="subtitle">
          Block: {typeof room.blockId === 'object' ? room.blockId.name : room.blockId}
        </p>
      )}

      {hasLocation && (
        <p className="subtitle">
          Coordinates: {room.location.lat}, {room.location.lng}
        </p>
      )}

      {room.photos && room.photos.length > 0 && (
        <div className="room-detail-photos">
          {room.photos.map((src, i) => (
            <img key={i} src={src} alt={`${room.name} photo ${i + 1}`} />
          ))}
        </div>
      )}

      <div className="about-cta">
        <Link to="/map" className="btn-secondary">
          View on map
        </Link>
      </div>
    </div>
  );
}
