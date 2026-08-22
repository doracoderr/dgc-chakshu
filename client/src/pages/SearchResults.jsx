import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [results, setResults] = useState({ rooms: [], departments: [], faculty: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    api
      .get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => setResults(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q]);

  if (loading) return <p className="page">Searching...</p>;
  if (error) return <p className="page error">Error: {error}</p>;

  const totalResults = results.rooms.length + results.departments.length + results.faculty.length;

  return (
    <div className="page">
      <h1>Search results for "{q}"</h1>
      {totalResults === 0 && <p>No results found.</p>}

      {results.rooms.length > 0 && (
        <>
          <h2>Rooms</h2>
          <div className="card-grid">
            {results.rooms.map((r) => (
              <LocationCard key={r._id} title={r.name} subtitle={`Room ${r.roomNumber}`} />
            ))}
          </div>
        </>
      )}

      {results.departments.length > 0 && (
        <>
          <h2>Departments</h2>
          <div className="card-grid">
            {results.departments.map((d) => (
              <LocationCard key={d._id} title={d.name} />
            ))}
          </div>
        </>
      )}

      {results.faculty.length > 0 && (
        <>
          <h2>Faculty</h2>
          <div className="card-grid">
            {results.faculty.map((f) => (
              <LocationCard key={f._id} title={f.name} subtitle={f.designation} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
