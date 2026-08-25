import { Link } from 'react-router-dom';
import {
  FaTwitter,
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaEnvelope,
} from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* About */}
        <div className="footer-column footer-about">
          <h3>DGC Chakshu</h3>
          <span className="footer-heading-line"></span>

          <p>
            DGC Chakshu is a campus navigation and information platform
            developed by the DGC Tech Army Club, Department of Computer Science,
            Dronacharya Government College, Gurugram.
          </p>

          <div className="footer-socials">
            <a href="#" aria-label="Twitter">
              <FaTwitter />
            </a>

            <a href="#" aria-label="Facebook">
              <FaFacebookF />
            </a>

            <a href="#" aria-label="Instagram">
              <FaInstagram />
            </a>
          </div>
        </div>

        {/* Latest News */}
        <div className="footer-column">
          <h3>Latest News</h3>
          <span className="footer-heading-line"></span>

          <div className="footer-news">
            <div className="news-image">DGC</div>

            <div>
              <h4>Explore DGC Chakshu</h4>
              <p>Campus information at your fingertips.</p>
              <small>Latest Update</small>
            </div>
          </div>

          <div className="footer-news">
            <div className="news-image">DGC</div>

            <div>
              <h4>Find Campus Locations</h4>
              <p>Discover blocks and departments easily.</p>
              <small>Latest Update</small>
            </div>
          </div>
        </div>

        {/* Quick Links */}
        <div className="footer-column">
          <h3>Quick Links</h3>
          <span className="footer-heading-line"></span>

          <div className="footer-links">
            <Link to="/">Home</Link>
            <Link to="/blocks">Blocks</Link>
            <Link to="/departments">Departments</Link>
            <Link to="/faculty">Faculty</Link>
            <Link to="/search">Search</Link>
          </div>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>Have a Question?</h3>
          <span className="footer-heading-line"></span>

          <div className="footer-contact">
            <div className="contact-item">
              <FaMapMarkerAlt className="contact-icon" />
              <p>Dronacharya Government College, Gurugram</p>
            </div>

            <div className="contact-item">
              <FaPhoneAlt className="contact-icon" />
              <p>Department of Computer Science</p>
            </div>

            <div className="contact-item">
              <FaEnvelope className="contact-icon" />
              <p>DGC Tech Army Club</p>
            </div>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>
          Copyright © 2026 DGC Chakshu | DGC Tech Army Club
        </p>
      </div>
    </footer>
  );
}