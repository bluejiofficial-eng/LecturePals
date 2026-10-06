import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { SetupGate, useTitle } from "../components/ui.jsx";
import { downloadTextFile } from "../download.js";
import {
  dateFromToday,
  formatClock,
  formatLongDate,
  groupsForUser,
  isProfileComplete,
  sessionsToIcs,
  todayISO,
} from "../store.js";

function heading(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return {
    weekday: date.toLocaleDateString("en-US", { weekday: "short" }),
    day: date.getDate(),
  };
}

export default function Calendar() {
  const { user, version } = useAuth();
  useTitle("Calendar");
  const ready = isProfileComplete(user);
  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, index) => dateFromToday(index));
  const groups = ready ? groupsForUser(user.id) : [];
  const mine = groups.filter((group) => group.memberIds.includes(user.id) && group.date >= today);
  void version;

  function downloadMine() {
    downloadTextFile("lecturepals-sessions.ics", sessionsToIcs(mine));
  }

  function downloadOne(group) {
    downloadTextFile(
      `${group.courseCode.replace(/\s+/g, "")}-${group.topic.replace(/\s+/g, "-")}.ics`,
      sessionsToIcs([group]),
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Calendar</p>
          <h1>This week</h1>
          <p className="muted">Sessions in your sections. Download the ones you joined and open them in your calendar app.</p>
        </div>
        {ready && mine.length > 0 && (
          <button type="button" className="btn primary" onClick={downloadMine}>
            Download my sessions
          </button>
        )}
      </header>
      {!ready ? (
        <SetupGate />
      ) : (
        <>
          <div className="week">
            {days.map((iso) => {
              const label = heading(iso);
              const items = groups.filter((group) => group.date === iso);
              return (
                <section key={iso} className={iso === today ? "day-col today" : "day-col"}>
                  <p className="day-label">
                    <span>{label.weekday}</span>
                    <strong>{label.day}</strong>
                  </p>
                  {items.length === 0 ? (
                    <p className="muted day-empty">No sessions</p>
                  ) : (
                    items.map((group) => (
                      <article
                        key={group.id}
                        className={group.memberIds.includes(user.id) ? "cal-item mine" : "cal-item"}
                      >
                        <p className="cal-time">{formatClock(group.start)}</p>
                        <p className="cal-title">{group.topic}</p>
                        <p className="cal-meta">{group.courseCode}</p>
                      </article>
                    ))
                  )}
                </section>
              );
            })}
          </div>
          <section className="stack">
            <h2>Sessions you joined</h2>
            {mine.length === 0 ? (
              <div className="empty">
                <p>You have not joined a session this week.</p>
                <Link className="btn secondary" to="/app/groups">
                  Browse sessions
                </Link>
              </div>
            ) : (
              mine.map((group) => (
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
                  <button type="button" className="btn small secondary" onClick={() => downloadOne(group)}>
                    Add to calendar
                  </button>
                </article>
              ))
            )}
          </section>
        </>
      )}
    </div>
  );
}
