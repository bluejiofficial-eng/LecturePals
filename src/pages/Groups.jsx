import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, SetupGate, useTitle } from "../components/ui.jsx";
import {
  LOCATIONS,
  cancelGroup,
  createGroup,
  formatClock,
  formatLongDate,
  groupsForUser,
  isProfileComplete,
  joinGroup,
  leaveGroup,
  openConversation,
  todayISO,
} from "../store.js";

export default function Groups() {
  const { user, version, refresh } = useAuth();
  const navigate = useNavigate();
  const ready = isProfileComplete(user);
  const [open, setOpen] = useState(false);
  const [courseId, setCourseId] = useState(user.courses[0]?.id || "");
  const [topic, setTopic] = useState("");
  const [date, setDate] = useState(todayISO());
  const [start, setStart] = useState("14:00");
  const [end, setEnd] = useState("16:00");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirmCancel, setConfirmCancel] = useState(null);
  useTitle("Study sessions");

  const groups = useMemo(() => (ready ? groupsForUser(user.id) : []), [ready, user.id, version]);
  const today = todayISO();
  const upcoming = groups.filter((group) => group.date >= today);
  const past = groups.filter((group) => group.date < today);
  const selectedCourse = user.courses.find((course) => course.id === courseId) || user.courses[0];

  function post(event) {
    event.preventDefault();
    setError("");
    const result = createGroup(user.id, { courseId, topic, date, start, end, location });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    setTopic("");
    setOpen(false);
    setNotice("Session posted to your section.");
  }

  function join(groupId) {
    const result = joinGroup(user.id, groupId);
    if (!result.ok) {
      setNotice("");
      setError(result.error);
      return;
    }
    refresh();
    setError("");
    setNotice("You joined this session.");
  }

  function leave(groupId) {
    leaveGroup(user.id, groupId);
    refresh();
    setNotice("You left the session.");
  }

  function cancel(groupId) {
    cancelGroup(user.id, groupId);
    refresh();
    setConfirmCancel(null);
    setNotice("Session cancelled.");
  }

  function message(otherId) {
    const result = openConversation(user.id, otherId);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    navigate(`/app/messages/${result.conversation.id}`);
  }

  function renderGroup(group) {
    const isMember = group.memberIds.includes(user.id);
    const isHost = group.hostId === user.id;
    const passed = group.date < today;
    return (
      <article key={group.id} className="card group-card">
        <div className="split">
          <div>
            <p className="eyebrow">
              {group.courseCode} · {formatLongDate(group.date)}
            </p>
            <h3>{group.topic}</h3>
            <p>
              {formatClock(group.start)}–{formatClock(group.end)} · {group.location}
            </p>
            <p className="muted">
              {group.section} · {group.instructor}
            </p>
          </div>
          <div className="group-actions">
            {!passed && !isMember && (
              <button type="button" className="btn small primary" onClick={() => join(group.id)}>
                Join session
              </button>
            )}
            {!passed && isMember && !isHost && (
              <button type="button" className="btn small ghost" onClick={() => leave(group.id)}>
                Leave session
              </button>
            )}
            {isHost && confirmCancel !== group.id && (
              <button type="button" className="btn small danger" onClick={() => setConfirmCancel(group.id)}>
                Cancel session
              </button>
            )}
          </div>
        </div>
        {confirmCancel === group.id && (
          <div className="confirm-row">
            <p>Cancel this session? It will disappear for everyone who joined.</p>
            <button type="button" className="btn small danger" onClick={() => cancel(group.id)}>
              Cancel session
            </button>
            <button type="button" className="btn small ghost" onClick={() => setConfirmCancel(null)}>
              Keep it
            </button>
          </div>
        )}
        <ul className="member-list">
          {group.members.map((member) => (
            <li key={member.id}>
              <Avatar name={member.name} size={32} />
              <span>
                {member.name}
                {member.id === group.hostId ? " · Host" : ""}
              </span>
              {member.id !== user.id && (
                <button type="button" className="btn ghost small" onClick={() => message(member.id)}>
                  Message
                </button>
              )}
            </li>
          ))}
        </ul>
      </article>
    );
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Study groups</p>
          <h1>Study sessions</h1>
          <p className="muted">Post a topic, time, and campus spot. Only students in that section can see it and join.</p>
        </div>
        {ready && (
          <button type="button" className="btn primary" onClick={() => setOpen((value) => !value)}>
            {open ? "Close form" : "New session"}
          </button>
        )}
      </header>
      {!ready ? (
        <SetupGate />
      ) : (
        <>
          {open && (
            <form className="card composer-grid" onSubmit={post}>
              <h2>New study session</h2>
              <label className="field">
                <span>Section</span>
                <select value={selectedCourse?.id || ""} onChange={(event) => setCourseId(event.target.value)}>
                  {user.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.section}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Topic</span>
                <input
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Normalization"
                  maxLength={80}
                  required
                />
              </label>
              {selectedCourse && (
                <div className="chips">
                  {selectedCourse.topics.map((item) => (
                    <button key={item} type="button" className="chip button" onClick={() => setTopic(item)}>
                      {item}
                    </button>
                  ))}
                </div>
              )}
              <div className="time-row">
                <label className="field">
                  <span>Date</span>
                  <input type="date" value={date} min={today} onChange={(event) => setDate(event.target.value)} required />
                </label>
                <label className="field">
                  <span>Start</span>
                  <input type="time" value={start} onChange={(event) => setStart(event.target.value)} required />
                </label>
                <label className="field">
                  <span>End</span>
                  <input type="time" value={end} onChange={(event) => setEnd(event.target.value)} required />
                </label>
              </div>
              <label className="field">
                <span>Campus location</span>
                <input
                  value={location}
                  list="campus-locations"
                  onChange={(event) => setLocation(event.target.value)}
                  maxLength={80}
                  required
                />
                <datalist id="campus-locations">
                  {LOCATIONS.map((place) => (
                    <option key={place} value={place} />
                  ))}
                </datalist>
              </label>
              {error ? (
                <p className="error" role="alert">
                  {error}
                </p>
              ) : null}
              <button className="btn primary" type="submit">
                Post session
              </button>
            </form>
          )}
          {notice ? (
            <p className="status" role="status">
              {notice}
            </p>
          ) : null}
          {!open && error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          <section className="stack">
            <h2>In your sections</h2>
            {upcoming.length === 0 ? (
              <div className="empty">
                <p>No upcoming sessions yet. Create one and classmates in the section can join.</p>
              </div>
            ) : (
              upcoming.map(renderGroup)
            )}
          </section>
          {past.length > 0 && (
            <section className="stack">
              <h2>Past sessions</h2>
              {past.map(renderGroup)}
            </section>
          )}
        </>
      )}
    </div>
  );
}
