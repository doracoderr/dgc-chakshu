import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

function floorLabel(floorNumber) {
  if (floorNumber == null) return '';
  return floorNumber === 0 ? 'Ground Floor' : `Floor ${floorNumber}`;
}

export default function SearchResults() {
  const [searchParams] = useSearchParams();
  const q = searchParams.get('q') || '';
  const [input, setInput] = useState(q);
  const navigate = useNavigate();
  const [results, setResults] = useState({ blocks: [], rooms: [], departments: [], faculty: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setInput(q);
    if (!q) return;
    setLoading(true);
    setError(null);
    api
      .get(`/search?q=${encodeURIComponent(q)}`)
      .then((res) => setResults(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [q]);

  const handleRefine = (e) => {
    e.preventDefault();
    if (input.trim()) navigate(`/search?q=${encodeURIComponent(input.trim())}`);
  };

  const totalResults =
    (results.blocks?.length || 0) +
    (results.rooms?.length || 0) +
    (results.departments?.length || 0) +
    (results.faculty?.length || 0);

  return (
    <div className="page search-results-page">
      <h1>Search</h1>
      <form className="search-refine-bar" onSubmit={handleRefine}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search rooms, blocks, departments, faculty..."
        />
        <button type="submit" className="btn-primary">Search</button>
      </form>

      {!q && <p className="subtitle">Type something above to search the campus.</p>}
      {q && loading && <p className="subtitle">Searching for "{q}"...</p>}
      {q && error && <p className="page error">Error: {error}</p>}

      {q && !loading && !error && (
        <>
          <p className="subtitle">
            {totalResults === 0
              ? `No results found for "${q}".`
              : `${totalResults} result${totalResults === 1 ? '' : 's'} for "${q}"`}
          </p>

          {results.blocks?.length > 0 && (
            <section className="search-section">
              <h2>Blocks</h2>
              <div className="card-grid">
                {results.blocks.map((b) => (
                  <Link to={`/blocks/${b._id}`} key={b._id} className="home-block-link">
                    <LocationCard
                      title={b.name}
                      subtitle={`${b.floorCount || 1} floor(s)${b.description ? ` · ${b.description}` : ''}`}
                      image={b.coverImage}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}

          {results.departments?.length > 0 && (
            <section className="search-section">
              <h2>Departments</h2>
              <div className="card-grid">
                {results.departments.map((d) => {
                  const subtitleParts = [];
                  if (d.blockId?.name) subtitleParts.push(d.blockId.name);
                  const floor = floorLabel(d.floorNumber);
                  if (floor) subtitleParts.push(floor);
                  if (d.hodName) subtitleParts.push(`HOD: ${d.hodName}`);
                  const card = <LocationCard title={d.name} subtitle={subtitleParts.join(' · ')} />;
                  return d.blockId?._id ? (
                    <Link to={`/blocks/${d.blockId._id}`} key={d._id} className="home-block-link">
                      {card}
                    </Link>
                  ) : (
                    <div key={d._id}>{card}</div>
                  );
                })}
              </div>
            </section>
          )}

          {results.rooms?.length > 0 && (
            <section className="search-section">
              <h2>Rooms</h2>
              <div className="card-grid">
                {results.rooms.map((r) => {
                  const subtitleParts = [`Room ${r.roomNumber}`, floorLabel(r.floorNumber)];
                  if (r.blockId?.name) subtitleParts.push(r.blockId.name);
                  if (r.departmentId?.name) subtitleParts.push(r.departmentId.name);
                  return (
                    <Link to={`/rooms/${r._id}`} key={r._id} className="home-block-link">
                      <LocationCard
                        title={r.name}
                        subtitle={subtitleParts.filter(Boolean).join(' · ')}
                        image={r.photos?.[0]}
                      />
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {results.faculty?.length > 0 && (
            <section className="search-section">
              <h2>Faculty</h2>
              <div className="card-grid">
                {results.faculty.map((f) => (
                  <Link to="/faculty" key={f._id} className="home-block-link">
                    <LocationCard
                      title={f.name}
                      subtitle={[f.designation, f.departmentId?.name].filter(Boolean).join(' · ')}
                      image={f.photo}
                    />
                  </Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
