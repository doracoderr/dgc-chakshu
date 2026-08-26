import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src="/navlogo.jpeg" alt="DGC Chakshu" />
      </Link>

      {/* Desktop Search Bar */}
      <div className="navbar-search">
        <span className="search-icon" aria-hidden="true">
          🔍
        </span>

        <input
          type="text"
          placeholder="Search rooms, blocks..."
          aria-label="Search rooms and blocks"
        />
      </div>

      {/* Mobile Search Icon */}
      <Link
        to="/search"
        className="navbar-mobile-search"
        aria-label="Search"
      >
        🔍
      </Link>

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