import { Link } from 'react-router-dom';
import { FaUser, FaGithub, FaLinkedin } from 'react-icons/fa';
import '../styles/pages.css';

// Update this list with everyone who worked on the project.
// image: Cloudinary URL (or any hosted image URL) — leave empty for a
// placeholder avatar. role: what they actually did, not just a title.
const contributors = [
  {
    name: 'Abhishek Prasad',
    role: 'Founder & Lead Developer',
    contribution:
      'Conceptualized and founded DGC Chakshu as a solo idea, designed the architecture, built the majority of the platform — frontend, backend, admin panel, search system, and deployment — and carried out local-level campus data collection.',
    image: '',
    github: 'https://github.com/doracoderr',
    linkedin: '',
  },
  {
    name: 'Govind Yadav',
    role: 'Collaborator — Frontend',
    contribution:
      'Built responsive UI for the Block Directory, Department Directory, Admin section, and the site footer; also handled admin management for departments, rooms, and faculty.',
    image: '',
    github: 'https://github.com/Govind-cyber-00',
    linkedin: '',
  },
  {
    name: 'Chetna',
    role: 'Collaborator — Frontend',
    contribution: 'Styled the navbar and updated the navbar logo.',
    image: '',
    github: 'https://github.com/chetnalankesh',
    linkedin: '',
  },
  {
    name: 'Rajan',
    role: 'Collaborator — Frontend',
    contribution: 'Built the college campus map feature.',
    image: '',
    github: 'https://github.com/AskRajan',
    linkedin: '',
  },
  {
    name: 'Pooja',
    role: 'Collaborator — Frontend',
    contribution: 'Built the About page content and styling.',
    image: '',
    github: 'https://github.com/itsmick74-cell',
    linkedin: '',
  },
  {
    name: 'Neeraj',
    role: 'Contributor — Data Collection',
    contribution: 'Carried out local-level campus data collection.',
    image: '',
    github: '',
    linkedin: '',
  },
  // Add remaining contributors below, e.g.
  // {
  //   name: 'Full Name',
  //   role: 'Contributor',
  //   contribution: 'What they helped with — a feature, testing, content, etc.',
  //   image: 'https://res.cloudinary.com/.../photo.jpg',
  //   github: '',
  //   linkedin: '',
  // },
];

export default function Credits() {
  return (
    <div className="page about-page">
      <section className="about-hero">
        <span className="tagline">Behind DGC Chakshu</span>
        <h1>Credits</h1>
        <p className="subtitle">
          DGC Chakshu is built and maintained by the DGC Tech Army Club,
          Department of Computer Science, Dronacharya Government College,
          Gurugram. Here's who worked on it.
        </p>
      </section>

      <section className="about-section">
        <div className="about-feature-grid">
          {contributors.map((c) => (
            <div className="about-feature-card contributor-card" key={c.name}>
              <div className="contributor-avatar">
                {c.image ? (
                  <img src={c.image} alt={c.name} />
                ) : (
                  <FaUser />
                )}
              </div>
              <h3>{c.name}</h3>
              <p className="contributor-role">{c.role}</p>
              <p>{c.contribution}</p>
              <div className="contributor-socials">
                {c.github && (
                  <a href={c.github} target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                    <FaGithub />
                  </a>
                )}
                {c.linkedin && (
                  <a href={c.linkedin} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                    <FaLinkedin />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="about-section about-team">
        <h2>Want to contribute?</h2>
        <p>
          DGC Chakshu is an ongoing project — if you're a DGC Tech Army Club
          member and want to help improve it, reach out through the club.
        </p>
        <div className="about-cta">
          <Link to="/" className="btn-primary">
            Back to Home
          </Link>
        </div>
      </section>
    </div>
  );
}