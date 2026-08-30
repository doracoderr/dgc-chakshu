import { useEffect, useState } from 'react';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

export default function FacultyDirectory() {
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/faculty')
      .then((res) => setFaculty(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading faculty...</p>;
  if (error) return <p className="page error">Error: {error}</p>;

  return (
    <div className="page">
      <h1>Faculty</h1>
      <div className="card-grid">
        {faculty.length === 0 && <p>No faculty added yet.</p>}
        {faculty.map((f) => (
          <LocationCard key={f._id} title={f.name} subtitle={f.designation} image={f.photo || f.coverImage} />
        ))}
      </div>
    </div>
  );
}
