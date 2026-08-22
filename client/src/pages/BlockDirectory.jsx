import { useEffect, useState } from 'react';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

export default function BlockDirectory() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/blocks')
      .then((res) => setBlocks(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading blocks...</p>;
  if (error) return <p className="page error">Error: {error}</p>;

  return (
    <div className="page">
      <h1>Blocks</h1>
      <div className="card-grid">
        {blocks.length === 0 && <p>No blocks added yet.</p>}
        {blocks.map((block) => (
          <LocationCard key={block._id} title={block.name} subtitle={block.description} image={block.coverImage} />
        ))}
      </div>
    </div>
  );
}
