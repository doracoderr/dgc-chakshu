import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

function floorLabel(floorNumber) {
  if (floorNumber == null) return '';
  return floorNumber === 0 ? 'Ground floor' : `Floor ${floorNumber}`;
}

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
        {departments.map((dept) => {
          const blockName = dept.blockId?.name;
          const subtitleParts = [];
          if (blockName) subtitleParts.push(blockName);
          const floor = floorLabel(dept.floorNumber);
          if (floor) subtitleParts.push(floor);
          if (dept.hodName) subtitleParts.push(`HOD: ${dept.hodName}`);

          const card = <LocationCard title={dept.name} subtitle={subtitleParts.join(' · ')} image={dept.coverImage} />;

          return dept.blockId?._id ? (
            <Link to={`/blocks/${dept.blockId._id}`} key={dept._id} className="home-block-link">
              {card}
            </Link>
          ) : (
            <div key={dept._id}>{card}</div>
          );
        })}
      </div>
    </div>
  );
}
