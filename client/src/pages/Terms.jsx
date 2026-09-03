import '../styles/pages.css';

export default function Terms() {
  return (
    <div className="page about-page">
      <section className="about-hero">
        <span className="tagline">Please Read</span>
        <h1>Terms &amp; Conditions</h1>
        <p className="subtitle">
          Last updated: September 2026. By using DGC Chakshu, you agree to
          the terms below.
        </p>
      </section>

      <section className="about-section">
        <h2>Purpose of the platform</h2>
        <p>
          DGC Chakshu is a student-built, informational tool created to
          help people navigate the campus of Dronacharya Government
          College, Gurugram. It is not an official college system and is
          maintained independently by the DGC Tech Army Club, Department
          of Computer Science.
        </p>
      </section>

      <section className="about-section">
        <h2>Accuracy of information</h2>
        <p>
          We aim to keep block, department, room, and faculty information
          accurate and up to date, and data is reviewed before it's
          published. However, campus details can change (room
          reassignments, faculty transfers, etc.), and we cannot guarantee
          the platform is error-free at all times. For official or
          time-sensitive information, always refer to the{' '}
          <a href="http://dgcgurugram.ac.in/" target="_blank" rel="noopener noreferrer">
            official college website
          </a>{' '}
          or the college administration.
        </p>
      </section>

      <section className="about-section">
        <h2>Acceptable use</h2>
        <p>
          You agree not to misuse the platform — including attempting
          unauthorized access to the admin panel, scraping data at scale,
          or using the site in any way that could disrupt its availability
          for others.
        </p>
      </section>

      <section className="about-section">
        <h2>Admin access</h2>
        <p>
          The admin panel is restricted to authorized DGC Tech Army Club
          members responsible for maintaining campus data. Any misuse of
          admin access is a violation of these terms.
        </p>
      </section>

      <section className="about-section">
        <h2>Intellectual property</h2>
        <p>
          The DGC Chakshu name, design, and codebase belong to the DGC
          Tech Army Club. College name, logo, and official content remain
          the property of Dronacharya Government College, Gurugram, and
          are used here for identification purposes only.
        </p>
      </section>

      <section className="about-section">
        <h2>Disclaimer</h2>
        <p>
          DGC Chakshu is provided "as is," without warranties of any
          kind, express or implied. We don't guarantee uninterrupted
          availability of the platform and aren't liable for any loss
          arising from reliance on information shown here.
        </p>
      </section>

      <section className="about-section">
        <h2>Governing law</h2>
        <p>
          These terms are governed by the laws of India, and any disputes
          will be subject to the jurisdiction of the courts in Gurugram,
          Haryana.
        </p>
      </section>

      <section className="about-section">
        <h2>Changes to these terms</h2>
        <p>
          These terms may be updated as the platform evolves. Continued
          use of DGC Chakshu after changes are posted means you accept the
          revised terms.
        </p>
      </section>

      <section className="about-section">
        <h2>Contact</h2>
        <p>
          Questions about these terms can be sent to{' '}
          <a href="mailto:dgcgurgaon@gmail.com">dgcgurgaon@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
