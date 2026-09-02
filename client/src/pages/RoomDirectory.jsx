import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

function floorLabel(floorNumber) {
  if (floorNumber == null) return '';
  return floorNumber === 0 ? 'Ground floor' : `Floor ${floorNumber}`;
}

export default function RoomDirectory() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/rooms')
      .then((res) => setRooms(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading rooms...</p>;
  if (error) return <p className="page error">Error: {error}</p>;

  return (
    <div className="page">
      <h1>Rooms</h1>
      <div className="card-grid">
        {rooms.length === 0 && <p>No rooms added yet.</p>}
        {rooms.map((room) => {
          const subtitleParts = [`Room ${room.roomNumber}`];
          const floor = floorLabel(room.floorNumber);
          if (floor) subtitleParts.push(floor);
          if (room.blockId?.name) subtitleParts.push(room.blockId.name);
          if (room.departmentId?.name) subtitleParts.push(room.departmentId.name);

          return (
            <Link to={`/rooms/${room._id}`} key={room._id} className="home-block-link">
              <LocationCard
                title={room.name || `Room ${room.roomNumber}`}
                subtitle={subtitleParts.join(' · ')}
                image={room.coverImage}
              />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
