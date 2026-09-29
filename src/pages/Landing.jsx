import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useTitle, Wordmark } from "../components/ui.jsx";

const STEPS = [
  ["Sign up with a .edu email", "Accounts stay inside the university, so the people you meet are students."],
  ["List your sections and free times", "Add your major, the sections you are taking, and when you can study."],
  ["Find, join, or message", "Search by course code and topic, post a campus session, or write a classmate."],
];

const FEATURES = [
  ["01", "Campus sign-in", "Create an account and log in with a university email that ends in .edu."],
  ["02", "Section profiles", "Share your major, enrolled sections, instructors, syllabus topics, and availability."],
  ["03", "Search and filter", "Find classmates by the exact course section and a specific syllabus topic."],
  ["04", "Study sessions", "Post a topic, date, time, and campus location so students in the section can join."],
  ["05", "Direct messages", "Coordinate with classmates who share your section, without a class-wide group chat."],
];

export default function Landing() {
  const { user } = useAuth();
  useTitle("");

  return (
    <div className="landing">
      <header className="site-header">
        <Link to="/" className="brand-link">
          <Wordmark />
        </Link>
        <nav className="site-nav" aria-label="Account">
          {user ? (
            <Link className="btn primary" to="/app">
              Open your desk
            </Link>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Log in
              </Link>
              <Link className="btn primary" to="/signup">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Section-specific study matching</p>
          <h1>Find a classmate who sat in the same lecture.</h1>
          <p className="lede">
            Tutoring centers book up, and class group chats leave people out. LecturePals matches you by course
            code, section, instructor, and syllabus topic.
          </p>
          <div className="hero-actions">
            {user ? (
              <Link className="btn primary" to="/app">
                Go to your sections
              </Link>
            ) : (
              <>
                <Link className="btn primary" to="/signup">
                  Create a campus account
                </Link>
                <Link className="btn secondary" to="/login">
                  Log in
                </Link>
              </>
            )}
          </div>
        </div>
        <article className="preview-card" aria-label="Example classmate match">
          <p className="eyebrow">Match in IS 3103</p>
          <h2>Maya Chen</h2>
          <p>Information Systems</p>
          <p className="preview-meta">TTH 10:00 AM – 12:00 PM · Prof. Elena Vasquez</p>
          <div className="chips">
            <span className="chip hot">Normalization</span>
            <span className="chip">SQL Joins</span>
            <span className="chip">ER Diagrams</span>
          </div>
          <p className="preview-free">Both free Tue 1:00–3:00 PM</p>
          <span className="btn small primary">Message</span>
        </article>
      </section>

      <section className="band">
        <h2>How it works</h2>
        <ol className="steps">
          {STEPS.map(([title, copy], index) => (
            <li key={title}>
              <span>{index + 1}</span>
              <div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="band">
        <h2>What you can do</h2>
        <div className="feature-grid">
          {FEATURES.map(([number, title, copy]) => (
            <article key={number} className="feature">
              <p className="feature-num">{number}</p>
              <h3>{title}</h3>
              <p>{copy}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className="site-footer">
        <p>IS 3103 · TTH 10:00 AM – 12:00 PM</p>
        <p>Aguinaldo, Direl Christian P. · Balili, Cleford C. · Subang, Sebastian Douglas</p>
      </footer>
    </div>
  );
}
