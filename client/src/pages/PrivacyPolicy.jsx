import '../styles/pages.css';

export default function PrivacyPolicy() {
  return (
    <div className="page about-page">
      <section className="about-hero">
        <span className="tagline">Your Privacy</span>
        <h1>Privacy Policy</h1>
        <p className="subtitle">
          Last updated: September 2026. This policy explains what
          information DGC Chakshu collects and how it's used.
        </p>
      </section>

      <section className="about-section">
        <h2>What DGC Chakshu is</h2>
        <p>
          DGC Chakshu is an informational campus navigation platform for
          Dronacharya Government College, Gurugram. It displays publicly
          relevant details about blocks, departments, rooms, and faculty
          to help students and visitors find their way around campus.
        </p>
      </section>

      <section className="about-section">
        <h2>Information we display</h2>
        <p>
          Faculty listings only include professional, public-facing
          details approved by the department — such as name, designation,
          department, and office location. We do not publish personal
          phone numbers or private email addresses.
        </p>
      </section>

      <section className="about-section">
        <h2>Information we collect</h2>
        <p>
          DGC Chakshu does not require visitors to create an account or
          submit personal information to browse the site. Search queries
          entered on the site are used only to return results and are not
          linked to any individual visitor. The admin panel, used
          internally by the DGC Tech Army Club to manage campus data, is
          access-restricted and not available to the public.
        </p>
      </section>

      <section className="about-section">
        <h2>Cookies &amp; local storage</h2>
        <p>
          The site may use basic browser storage to remember non-personal
          preferences (such as UI state) during your visit. We do not use
          this data for advertising or tracking across other websites.
        </p>
      </section>

      <section className="about-section">
        <h2>Data retention</h2>
        <p>
          Campus data (blocks, departments, rooms, faculty) is retained
          for as long as it stays accurate and relevant, and is updated
          or removed by the DGC Tech Army Club as the campus changes. We
          don't retain personal visitor data because none is collected.
        </p>
      </section>

      <section className="about-section">
        <h2>Your rights</h2>
        <p>
          If any displayed information about you (for example, a faculty
          listing) is incorrect or you'd like it removed, you can request
          a correction or removal at any time — see the contact details
          below.
        </p>
      </section>

      <section className="about-section">
        <h2>Third-party links</h2>
        <p>
          The site links to the college's official website and social
          media pages. DGC Chakshu is not responsible for the privacy
          practices of those external platforms.
        </p>
      </section>

      <section className="about-section">
        <h2>Changes to this policy</h2>
        <p>
          This policy may be updated as the platform evolves. The "last
          updated" date at the top of this page reflects the most recent
          revision.
        </p>
      </section>

      <section className="about-section">
        <h2>Contact</h2>
        <p>
          For questions about this policy or to request a correction to
          displayed information, reach out at{' '}
          <a href="mailto:dgcgurgaon@gmail.com">dgcgurgaon@gmail.com</a>.
        </p>
      </section>
    </div>
  );
}
