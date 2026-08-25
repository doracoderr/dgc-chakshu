import { Link } from 'react-router-dom';
import logo from "../assets/logonav.png";

export default function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo"><img src={logo} alt="" /></Link>

      <div className="navbar-links">
        <Link to="/blocks">Blocks</Link>
        <Link to="/departments">Departments</Link>
        <Link to="/faculty">Faculty</Link>
        <Link to="/search">Search</Link>
      </div>
      <button class="menu-icon">
        ☰
      </button>

    </nav>
  );
}
