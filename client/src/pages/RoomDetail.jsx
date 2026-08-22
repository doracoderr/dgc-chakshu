import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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

  return (
    <div className="page">
      <h1>{room.name}</h1>
      <p>Room No: {room.roomNumber}</p>
      <p>Floor: {room.floorNumber}</p>
      <p>Type: {room.type}</p>
      {room.departmentId && <p>Department: {room.departmentId.name}</p>}
    </div>
  );
}
