import { Link } from 'react-router-dom';
import {
  FaFacebookF,
  FaInstagram,
  FaMapMarkerAlt,
  FaEnvelope,
  FaGlobe,
  FaBook,
} from 'react-icons/fa';
import '../styles/footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-content">

        {/* About */}
        <div className="footer-column footer-about">
          <h3>DGC Chakshu</h3>
          <span className="footer-heading-line"></span>

          <p>
            DGC Chakshu is a campus navigation and information platform,
            built by the DGC Tech Army Club — a student club under the
            Department of Computer Science, Dronacharya Government
            College, Gurugram.
          </p>

          <div className="footer-socials">
            <a
              href="https://www.facebook.com/p/DGC-Gurugram-100063968320312/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://www.instagram.com/dgcgurugram/?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="http://dgcgurugram.ac.in/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Website"
            >
              <FaGlobe />
            </a>
          </div>

          <p className="footer-note-label">Also useful:</p>
          <a
            href="https://universitynotes.co.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-resource-chip"
          >
            <FaBook />
            UniversityNotes — Notes &amp; Question Papers
          </a>
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

        {/* College Links */}
        <div className="footer-column">
          <h3>College Links</h3>
          <span className="footer-heading-line"></span>

          <div className="footer-links">
            <a href="http://dgcgurugram.ac.in/" target="_blank" rel="noopener noreferrer">
              Official Website
            </a>
            <a href="http://dgcgurugram.ac.in/notice" target="_blank" rel="noopener noreferrer">
              Notices
            </a>
            <a href="http://dgcgurugram.ac.in/DownloadForms" target="_blank" rel="noopener noreferrer">
              Download Forms
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>Contact Us</h3>
          <span className="footer-heading-line"></span>

          <div className="footer-contact">
            <a
              className="contact-item"
              href="https://www.google.com/maps/search/?api=1&query=Dronacharya+Government+College+Gurugram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FaMapMarkerAlt className="contact-icon" />
              <p>New Railway Road, near Sheetla Hospital, Sector 8, Gurugram, Haryana 122001</p>
            </a>

            <a className="contact-item" href="mailto:dgcgurgaon@gmail.com">
              <FaEnvelope className="contact-icon" />
              <p>dgcgurgaon@gmail.com</p>
            </a>
          </div>
        </div>

      </div>

      {/* Copyright */}
      <div className="footer-bottom">
        <p>© 2026 DGC Chakshu. All rights reserved.</p>
        <div className="footer-legal">
          <Link to="/privacy-policy">Privacy Policy</Link>
          <span className="footer-legal-dot">•</span>
          <Link to="/terms">Terms &amp; Conditions</Link>
          <span className="footer-legal-dot">•</span>
          <Link to="/credits">Credits</Link>
        </div>
      </div>
    </footer>
  );
}