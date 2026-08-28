import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function buildSuggestions(data) {
  const items = [];
  (data.blocks || []).slice(0, 2).forEach((b) =>
    items.push({ id: `block-${b._id}`, type: 'Block', label: b.name, sub: `${b.floorCount || 1} floor(s)`, to: `/blocks/${b._id}` })
  );
  (data.departments || []).slice(0, 2).forEach((d) =>
    items.push({
      id: `dept-${d._id}`,
      type: 'Department',
      label: d.name,
      sub: d.blockId?.name || '',
      to: d.blockId?._id ? `/blocks/${d.blockId._id}` : '/departments',
    })
  );
  (data.rooms || []).slice(0, 3).forEach((r) =>
    items.push({
      id: `room-${r._id}`,
      type: 'Room',
      label: r.name,
      sub: `${r.roomNumber}${r.blockId?.name ? ` · ${r.blockId.name}` : ''}`,
      to: `/rooms/${r._id}`,
    })
  );
  (data.faculty || []).slice(0, 2).forEach((f) =>
    items.push({ id: `fac-${f._id}`, type: 'Faculty', label: f.name, sub: f.designation || '', to: '/faculty' })
  );
  return items.slice(0, 8);
}

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  const closeMenu = () => {
    setMenuOpen(false);
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      setSearching(true);
      api
        .get(`/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => {
          setSuggestions(buildSuggestions(res.data.data || {}));
          setShowDropdown(true);
        })
        .catch(() => {
          setSuggestions([]);
        })
        .finally(() => setSearching(false));
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const goToResults = () => {
    if (query.trim()) {
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
      setShowDropdown(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    goToResults();
  };

  const handleSuggestionClick = (item) => {
    navigate(item.to);
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
  };

  return (
    <nav className="navbar">
      {/* Logo */}
      <Link to="/" className="navbar-logo" onClick={closeMenu}>
        <img src="/navlogo.jpeg" alt="DGC Chakshu" />
      </Link>

      {/* Search Bar */}
      <div className="navbar-search-wrapper" ref={wrapperRef}>
        <form className="navbar-search" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search rooms, blocks, departments, faculty..."
            aria-label="Search campus"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.trim().length >= 2 && setShowDropdown(true)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setShowDropdown(false);
            }}
          />
          <button type="submit" className="navbar-search-btn">Search</button>
        </form>

        {showDropdown && (
          <div className="navbar-search-dropdown">
            {searching && <p className="navbar-search-status">Searching...</p>}
            {!searching && suggestions.length === 0 && (
              <p className="navbar-search-status">No quick matches — press Search for full results.</p>
            )}
            {!searching &&
              suggestions.map((item) => (
                <button
                  type="button"
                  key={item.id}
                  className="navbar-search-suggestion"
                  onClick={() => handleSuggestionClick(item)}
                >
                  <span className="navbar-search-suggestion-type">{item.type}</span>
                  <span className="navbar-search-suggestion-text">
                    <strong>{item.label}</strong>
                    {item.sub && <span className="navbar-search-suggestion-sub"> · {item.sub}</span>}
                  </span>
                </button>
              ))}
            {!searching && suggestions.length > 0 && (
              <button type="button" className="navbar-search-seeall" onClick={goToResults}>
                See all results for "{query}"
              </button>
            )}
          </div>
        )}
      </div>

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
