import { useEffect, useState } from 'react';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

export default function DepartmentDirectory() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="page">Loading departments...</p>;
  if (error) return <p className="page error">Error: {error}</p>;

  return (
    <div className="page">
      <h1>Departments</h1>
      <div className="card-grid">
        {departments.length === 0 && <p>No departments added yet.</p>}
        {departments.map((dept) => (
          <LocationCard key={dept._id} title={dept.name} subtitle={dept.hodName ? `HOD: ${dept.hodName}` : ''} />
        ))}
      </div>
    </div>
  );
}
