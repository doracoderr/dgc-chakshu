import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const closeMenu = () => {
    setMenuOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src="/navlogo.jpeg" alt="DGC Chakshu" />
      </Link>

      {/* Search Bar */}
      <form className="navbar-search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search rooms, blocks..."
          aria-label="Search rooms and blocks"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="navbar-search-btn">Search</button>
      </form>

      {/* Navigation Links */}
      <div className={`navbar-links ${menuOpen ? 'open' : ''}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/map" onClick={closeMenu}>Map</Link>
        <Link to="/blocks" onClick={closeMenu}>Blocks</Link>
        <Link to="/departments" onClick={closeMenu}>Departments</Link>
        <Link to="/faculty" onClick={closeMenu}>Faculty</Link>
        <Link to="/about" onClick={closeMenu}>About</Link>
      </div>

      {/* Mobile Hamburger */}
      <button
        type="button"
        className="navbar-menu-button"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle navigation menu"
        aria-expanded={menuOpen}
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
    </nav>
  );
}