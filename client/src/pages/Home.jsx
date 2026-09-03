import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FaBuilding,
  FaChalkboardTeacher,
  FaUserTie,
  FaMapMarkedAlt,
} from 'react-icons/fa';
import api from '../api/axios';
import LocationCard from '../components/LocationCard';

const quickLinks = [
  { icon: <FaBuilding />, title: 'Blocks', to: '/blocks' },
  { icon: <FaChalkboardTeacher />, title: 'Departments', to: '/departments' },
  { icon: <FaUserTie />, title: 'Faculty', to: '/faculty' },
  { icon: <FaMapMarkedAlt />, title: 'Map', to: '/map' },
];

export default function Home() {
  const [blocks, setBlocks] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingBlocks, setLoadingBlocks] = useState(true);
  const [loadingDepts, setLoadingDepts] = useState(true);

  useEffect(() => {
    api
      .get('/blocks')
      .then((res) => setBlocks((res.data.data || []).filter((b) => b.category !== 'landmark')))
      .catch(() => setBlocks([]))
      .finally(() => setLoadingBlocks(false));

    api
      .get('/departments')
      .then((res) => setDepartments(res.data.data || []))
      .catch(() => setDepartments([]))
      .finally(() => setLoadingDepts(false));
  }, []);

  return (
    <div className="page home-page">
      <section className="home-hero">
        <span className="tagline">See. Find. Navigate.</span>
        <h1>Your campus, mapped out.</h1>
        <p className="subtitle">
          Jump straight to a block, a department, a faculty member or the
          map — or use the search bar above.
        </p>
      </section>

      <section className="home-quick-links">
        {quickLinks.map((q) => (
          <Link to={q.to} className="home-quick-link" key={q.title}>
            <span className="home-quick-link-icon">{q.icon}</span>
            {q.title}
          </Link>
        ))}
      </section>

      <section className="about-section">
        <h2>Blocks on campus</h2>
        {loadingBlocks && <p className="subtitle">Loading blocks...</p>}
        {!loadingBlocks && blocks.length === 0 && (
          <p className="subtitle">Block data is being added soon.</p>
        )}
        {!loadingBlocks && blocks.length > 0 && (
          <>
            <div className="card-grid">
              {blocks.slice(0, 6).map((block) => (
                <Link to="/blocks" key={block._id} className="home-block-link">
                  <LocationCard
                    title={block.name}
                    subtitle={block.description}
                    image={block.coverImage}
                  />
                </Link>
              ))}
            </div>
            <div className="about-cta">
              <Link to="/blocks" className="btn-secondary">
                View all blocks
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="about-section">
        <h2>Departments</h2>
        {loadingDepts && <p className="subtitle">Loading departments...</p>}
        {!loadingDepts && departments.length === 0 && (
          <p className="subtitle">Department listings are coming soon.</p>
        )}
        {!loadingDepts && departments.length > 0 && (
          <>
            <div className="card-grid">
              {departments.slice(0, 6).map((dept) => {
                const floor = dept.floorNumber != null ? (dept.floorNumber === 0 ? 'Ground floor' : `Floor ${dept.floorNumber}`) : '';
                const subtitle = [dept.blockId?.name, floor].filter(Boolean).join(' · ') || (dept.hodName ? `HOD: ${dept.hodName}` : '');
                return (
                  <Link to="/departments" key={dept._id} className="home-block-link">
                    <LocationCard title={dept.name} subtitle={subtitle} />
                  </Link>
                );
              })}
            </div>
            <div className="about-cta">
              <Link to="/departments" className="btn-secondary">
                View all departments
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}