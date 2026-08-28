import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/axios';

const TYPE_COLORS = {
  classroom: '#1F6FAE',
  lab: '#0E8F87',
  office: '#123B5D',
  facility: '#667085',
  other: '#94A3B8',
};

function FloorBlueprint({ rooms }) {
  const cols = Math.max(1, Math.min(4, Math.ceil(Math.sqrt(rooms.length || 1))));
  const rows = Math.max(1, Math.ceil(rooms.length / cols));
  const cellW = 180;
  const cellH = 110;
  const gap = 16;
  const padding = 24;
  const width = cols * cellW + (cols - 1) * gap + padding * 2;
  const height = rows * cellH + (rows - 1) * gap + padding * 2;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="blueprint-svg"
      role="img"
      aria-label="Auto-generated floor layout"
    >
      <rect x={4} y={4} width={width - 8} height={height - 8} rx={12} fill="none" stroke="#E2E8F0" strokeWidth={2} strokeDasharray="6 6" />
      {rooms.map((room, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = padding + col * (cellW + gap);
        const y = padding + row * (cellH + gap);
        const color = TYPE_COLORS[room.type] || TYPE_COLORS.other;
        return (
          <g key={room._id}>
            <rect
              x={x}
              y={y}
              width={cellW}
              height={cellH}
              rx={8}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={1.5}
            />
            <text x={x + 12} y={y + 26} fontSize={13} fontWeight={700} fill="#123B5D">
              {room.roomNumber}
            </text>
            <text x={x + 12} y={y + 46} fontSize={11} fill="#667085">
              {room.name.length > 20 ? `${room.name.slice(0, 20)}…` : room.name}
            </text>
            <text x={x + 12} y={y + 64} fontSize={10} fill={color} fontWeight={600}>
              {room.type}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function floorLabel(floorNumber) {
  return floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`;
}

export default function BlockDetail() {
  const { id } = useParams();
  const [block, setBlock] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFloor, setActiveFloor] = useState(null);

  useEffect(() => {
    Promise.all([
      api.get(`/blocks/${id}`),
      api.get(`/rooms/block/${id}`),
      api.get('/departments'),
    ])
      .then(([blockRes, roomsRes, deptRes]) => {
        setBlock(blockRes.data.data);
        setRooms(roomsRes.data.data || []);
        const allDepts = deptRes.data.data || [];
        setDepartments(allDepts.filter((d) => (d.blockId?._id || d.blockId) === id));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const floors = useMemo(() => {
    const fromRooms = rooms.map((r) => r.floorNumber);
    const fromDepts = departments.map((d) => d.floorNumber).filter((f) => f != null);
    const count = block?.floorCount || 1;
    const fromBlock = Array.from({ length: count }, (_, i) => i);
    return [...new Set([...fromBlock, ...fromRooms, ...fromDepts])].sort((a, b) => a - b);
  }, [rooms, departments, block]);

  useEffect(() => {
    if (floors.length > 0 && activeFloor === null) {
      setActiveFloor(floors[0]);
    }
  }, [floors, activeFloor]);

  if (loading) return <p className="page">Loading block...</p>;
  if (error) return <p className="page error">Error: {error}</p>;
  if (!block) return <p className="page">Block not found.</p>;

  const roomsOnFloor = rooms.filter((r) => r.floorNumber === activeFloor);
  const deptsOnFloor = departments.filter((d) => d.floorNumber === activeFloor);

  return (
    <div className="page block-detail">
      <h1>{block.name}</h1>
      {block.description && <p className="subtitle">{block.description}</p>}

      <div className="floor-tabs">
        {floors.map((f) => (
          <button
            key={f}
            type="button"
            className={`floor-tab ${activeFloor === f ? 'active' : ''}`}
            onClick={() => setActiveFloor(f)}
          >
            {floorLabel(f)}
          </button>
        ))}
      </div>

      {deptsOnFloor.length > 0 && (
        <div className="floor-dept-banner">
          <span className="floor-dept-banner-label">On this floor:</span>
          {deptsOnFloor.map((d) => (
            <span key={d._id} className="floor-dept-chip">{d.name}</span>
          ))}
        </div>
      )}

      <div className="blueprint-wrapper">
        {roomsOnFloor.length === 0 ? (
          <p className="subtitle">No rooms added on this floor yet.</p>
        ) : (
          <FloorBlueprint rooms={roomsOnFloor} />
        )}
      </div>

      {roomsOnFloor.length > 0 && (
        <ul className="floor-room-list-simple">
          {roomsOnFloor.map((room) => (
            <li key={room._id}>
              <Link to={`/rooms/${room._id}`} className="floor-room-list-item">
                <span className="floor-room-badge" style={{ background: TYPE_COLORS[room.type] || TYPE_COLORS.other }} />
                <span>
                  <strong>{room.roomNumber}</strong> — {room.name}
                  {room.departmentId ? ` · ${room.departmentId.name}` : ''}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <p className="admin-hint blueprint-note">
        This layout is auto-generated from room data and isn't to scale. A real floor plan will replace it once available.
      </p>
    </div>
  );
}
