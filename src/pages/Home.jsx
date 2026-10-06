import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useTitle } from "../components/ui.jsx";
import { pushPermission, showPush } from "../notify.js";
import {
  dashboard,
  ensureReminders,
  formatBlock,
  formatClock,
  formatLongDate,
  isProfileComplete,
  listAlerts,
  markPushed,
} from "../store.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function Home() {
  const { user, version, refresh } = useAuth();
  useTitle("Home");
  const firstName = user.name.split(" ")[0];
  const ready = isProfileComplete(user);
  const data = dashboard(user.id);
  const alerts = ready ? listAlerts(user.id).filter((alert) => !alert.read).slice(0, 2) : [];
  void version;

  useEffect(() => {
    if (!ready) return;
    const created = ensureReminders(user.id);
    if (!created.length) return;
    if (pushPermission() === "granted") {
      created.forEach((alert) => showPush(alert.title, alert.body));
      markPushed(created.map((alert) => alert.id));
    }
    refresh();
  }, [ready, user.id, refresh]);

  if (!ready) {
    return (
      <section className="panel setup-gate">
        <p className="eyebrow">Welcome, {firstName}</p>
        <h1>Set up your profile</h1>
        <p>Search, study sessions, and messages all start from the sections and free times you list.</p>
        <ol className="setup-list">
          <li>Add your major.</li>
          <li>Add each course section and the syllabus topics you are studying.</li>
          <li>Mark the times you are free to meet.</li>
        </ol>
        <Link className="btn primary" to="/app/profile">
          Start profile
        </Link>
      </section>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">{greeting()}</p>
          <h1>{firstName}&apos;s desk</h1>
        </div>
        <div className="hero-actions">
          <Link className="btn primary" to="/app/find">
            Find classmates
          </Link>
          <Link className="btn secondary" to="/app/calendar">
            Calendar
          </Link>
        </div>
      </header>

      {alerts.length > 0 && (
        <section className="stack">
          <h2>New alerts</h2>
          {alerts.map((alert) => (
            <article key={alert.id} className="card">
              <p className="eyebrow">{alert.title}</p>
              <p>{alert.body}</p>
            </article>
          ))}
          <Link className="text-link" to="/app/alerts">
            Open alerts
          </Link>
        </section>
      )}

      <section>
        <h2>Your sections</h2>
        <div className="stat-grid">
          {data.sections.map(({ course, classmates }) => (
            <article key={course.id} className="card">
              <p className="eyebrow">{course.code}</p>
              <h3>{course.section}</h3>
              <p className="muted">{course.instructor}</p>
              <p>
                <strong>{classmates}</strong> {classmates === 1 ? "classmate" : "classmates"} in this section
              </p>
              <div className="chips">
                {course.topics.map((topic) => (
                  <Link
                    key={topic}
                    className="chip"
                    to={`/app/find?section=${course.id}&topic=${encodeURIComponent(topic)}`}
                  >
                    {topic}
                  </Link>
                ))}
              </div>
              <Link className="text-link" to={`/app/find?section=${course.id}`}>
                Browse this section
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section>
        <h2>Upcoming sessions</h2>
        {data.upcoming.length === 0 ? (
          <div className="empty">
            <p>You have not joined a session yet.</p>
            <Link className="btn secondary" to="/app/groups">
              See open sessions
            </Link>
          </div>
        ) : (
          <div className="stack">
            {data.upcoming.map((group) => (
              <article key={group.id} className="card session-row">
                <div>
                  <p className="eyebrow">
                    {group.courseCode} · {formatLongDate(group.date)}
                  </p>
                  <h3>{group.topic}</h3>
                  <p className="muted">
                    {formatClock(group.start)}–{formatClock(group.end)} · {group.location}
                  </p>
                </div>
                <Link className="btn small secondary" to="/app/groups">
                  View
                </Link>
              </article>
            ))}
          </div>
        )}
        {data.open.length > 0 ? (
          <p className="muted open-note">
            {data.open.length} open {data.open.length === 1 ? "session" : "sessions"} in your sections.{" "}
            <Link to="/app/groups">Take a look</Link>
          </p>
        ) : null}
      </section>

      <section>
        <h2>When you are free</h2>
        <div className="chips">
          {user.availability.map((block) => (
            <span key={block.id} className="chip">
              {formatBlock(block)}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
