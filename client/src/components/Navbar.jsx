import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">DGC Chakshu</Link>
      <div className="navbar-links">
        <Link to="/blocks">Blocks</Link>
        <Link to="/departments">Departments</Link>
        <Link to="/faculty">Faculty</Link>
        <Link to="/search">Search</Link>
      </div>
    </nav>
  );
}
