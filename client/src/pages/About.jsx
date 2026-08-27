import { Link } from 'react-router-dom';
import {
  FaMapMarkedAlt,
  FaBuilding,
  FaChalkboardTeacher,
  FaSearch,
  FaUserShield,
} from 'react-icons/fa';

const features = [
  {
    icon: <FaBuilding />,
    title: 'Block Directory',
    text: 'Every building on campus, listed with its floors and the rooms inside them.',
  },
  {
    icon: <FaChalkboardTeacher />,
    title: 'Department Directory',
    text: "Find a department's location, HOD, and facilities in a couple of taps.",
  },
  {
    icon: <FaSearch />,
    title: 'Campus-wide Search',
    text: 'Search rooms, blocks, departments and faculty from one search bar.',
  },
  {
    icon: <FaMapMarkedAlt />,
    title: 'Interactive Map',
    text: 'See where you are relative to blocks, labs, the library and the canteen.',
  },
];

export default function About() {
  return (
    <div className="page about-page">
      <section className="about-hero">
        <span className="tagline">See. Find. Navigate.</span>
        <h1>About DGC Chakshu</h1>
        <p className="subtitle">
          A digital campus navigation and information platform built for
          Dronacharya Government College, Gurugram — so no one has to
          wander a hallway looking for a room number again.
        </p>
      </section>

      <section className="about-section">
        <h2>Why it exists</h2>
        <p>
          Every semester, new students, guest faculty and visitors lose
          time hunting for the same handful of places: a lab tucked away
          on the second floor of Block B, a department office, the
          nearest washroom. DGC Chakshu puts that information in one
          place — accurate, searchable, and verified — so campus feels
          smaller from day one.
        </p>
      </section>

      <section className="about-section">
        <h2>What you can do</h2>
        <div className="about-feature-grid">
          {features.map((f) => (
            <div className="about-feature-card" key={f.title}>
              <div className="about-feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section about-trust">
        <div className="about-trust-icon">
          <FaUserShield />
        </div>
        <div>
          <h2>Verified, privacy-conscious data</h2>
          <p>
            Rooms are only shown once they've been checked by the team,
            and faculty listings only ever include approved,
            public-facing professional details — never personal phone
            numbers or private emails.
          </p>
        </div>
      </section>

      <section className="about-section about-team">
        <h2>Built by students, for students</h2>
        <p>
          DGC Chakshu is designed and developed by the{' '}
          <strong>DGC Tech Army Club</strong>, Department of Computer
          Science, Dronacharya Government College, Gurugram — as a
          real, evolving project maintained by the club's own members.
        </p>
        <div className="about-cta">
          <Link to="/map" className="btn-primary">
            Explore the map
          </Link>
          <Link to="/blocks" className="btn-secondary">
            Browse blocks
          </Link>
        </div>
      </section>
    </div>
  );
}
