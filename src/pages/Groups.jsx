import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, SetupGate, useTitle } from "../components/ui.jsx";
import { downloadTextFile } from "../download.js";
import {
  LOCATIONS,
  cancelGroup,
  createGroup,
  formatClock,
  formatLongDate,
  filterGroupsForUser,
  groupsForUser,
  inviteCandidates,
  inviteToGroup,
  isProfileComplete,
  joinGroup,
  leaveGroup,
  openConversation,
  sessionsToIcs,
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
  const [maxParticipants, setMaxParticipants] = useState("");
  const [location, setLocation] = useState(LOCATIONS[0]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState({
    courseId: "",
    topic: "",
    fromDate: "",
    throughDate: "",
    availabilityOnly: false,
    sortOrder: "soonest",
  });
  const [confirmCancel, setConfirmCancel] = useState(null);
  const [inviteFor, setInviteFor] = useState(null);
  useTitle("Study sessions");

  const groups = useMemo(() => (ready ? groupsForUser(user.id) : []), [ready, user.id, version]);
  const filteredGroups = useMemo(
    () => (ready ? filterGroupsForUser(user.id, filters) : []),
    [ready, user.id, version, filters],
  );
  const today = todayISO();
  const upcoming = filteredGroups.filter((group) => group.date >= today);
  const past = groups.filter((group) => group.date < today);
  const selectedFilterCourse = user.courses.find((course) => course.id === filters.courseId);
  const topics = [...new Set(
    groups
      .filter((group) => !selectedFilterCourse || (group.courseCode === selectedFilterCourse.code && group.section === selectedFilterCourse.section))
      .map((group) => group.topic),
  )].sort((a, b) => a.localeCompare(b));
  const invalidDateRange = filters.fromDate && filters.throughDate && filters.fromDate > filters.throughDate;
  const hasFilters =
    filters.courseId ||
    filters.topic ||
    filters.fromDate ||
    filters.throughDate ||
    filters.availabilityOnly ||
    filters.sortOrder !== "soonest";
  const selectedCourse = user.courses.find((course) => course.id === courseId) || user.courses[0];

  function post(event) {
    event.preventDefault();
    setError("");
    const result = createGroup(user.id, {
      courseId,
      topic,
      date,
      start,
      end,
      location,
      maxParticipants: maxParticipants === "" ? null : Number(maxParticipants),
    });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    setTopic("");
    setMaxParticipants("");
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
    setNotice(result.waitlisted ? "The session is full. You are on the waitlist." : "You joined this session.");
  }

  function leave(groupId) {
    const result = leaveGroup(user.id, groupId);
    if (!result.ok) {
      setNotice("");
      setError(result.error);
      return;
    }
    refresh();
    setError("");
    setNotice(result.wasWaitlisted ? "You left the waitlist." : "You left the session.");
  }

  function cancel(groupId) {
    cancelGroup(user.id, groupId);
    refresh();
    setConfirmCancel(null);
    setNotice("Session cancelled.");
  }

  function invite(groupId, person) {
    const result = inviteToGroup(user.id, groupId, person.id);
    if (!result.ok) {
      setNotice("");
      setError(result.error);
      return;
    }
    refresh();
    setError("");
    setNotice(`Invite emailed to ${person.name}.`);
  }

  function saveToCalendar(group) {
    downloadTextFile(
      `${group.courseCode.replace(/\s+/g, "")}-${group.topic.replace(/\s+/g, "-")}.ics`,
      sessionsToIcs([group]),
    );
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
    const isWaiting = group.waitlistIds.includes(user.id);
    const isHost = group.hostId === user.id;
    const passed = group.date < today;
    const full = group.maxParticipants !== null && group.memberIds.length >= group.maxParticipants;
    const candidates = inviteFor === group.id ? inviteCandidates(user.id, group.id) : [];
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
            <p className="muted">
              {group.memberIds.length}
              {group.maxParticipants !== null ? ` of ${group.maxParticipants}` : ""} participants
              {group.waitlistIds.length ? ` · ${group.waitlistIds.length} waiting` : ""}
            </p>
            {isWaiting ? (
              <p className="status" role="status">
                You are #{group.waitlistIds.indexOf(user.id) + 1} on the waitlist.
              </p>
            ) : null}
          </div>
          <div className="group-actions">
            {!passed && !isMember && !isWaiting && (
              <button type="button" className="btn small primary" onClick={() => join(group.id)}>
                {full ? "Join waitlist" : "Join session"}
              </button>
            )}
            {!passed && isWaiting && (
              <button type="button" className="btn small ghost" onClick={() => leave(group.id)}>
                Leave waitlist
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
            {!passed && (
              <button type="button" className="btn small ghost" onClick={() => saveToCalendar(group)}>
                Add to calendar
              </button>
            )}
            {!passed && isMember && (
              <button
                type="button"
                className="btn small secondary"
                onClick={() => setInviteFor((current) => (current === group.id ? null : group.id))}
              >
                {inviteFor === group.id ? "Close invites" : "Invite"}
              </button>
            )}
          </div>
        </div>
        {inviteFor === group.id && (
          <div className="invite-box">
            {candidates.length === 0 ? (
              <p className="muted">Everyone in this section has joined or is waiting for the session.</p>
            ) : (
              <ul className="member-list">
                {candidates.map((candidate) => (
                  <li key={candidate.user.id}>
                    <Avatar name={candidate.user.name} size={32} />
                    <span>{candidate.user.name}</span>
                    {candidate.pending ? (
                      <span className="chip">Invited</span>
                    ) : (
                      <button type="button" className="btn small primary" onClick={() => invite(group.id, candidate.user)}>
                        Send invite
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
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
        {isHost && group.waitlist.length > 0 ? (
          <div className="waitlist-box">
            <h4>Waitlist</h4>
            <ol>
              {group.waitlist.map((person) => (
                <li key={person.id}>{person.name}</li>
              ))}
            </ol>
          </div>
        ) : null}
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
          <div className="hero-actions">
            <Link className="btn secondary" to="/app/calendar">
              Week view
            </Link>
            <button type="button" className="btn primary" onClick={() => setOpen((value) => !value)}>
              {open ? "Close form" : "New session"}
            </button>
          </div>
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
                <span>Participant limit (including you)</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxParticipants}
                  onChange={(event) => setMaxParticipants(event.target.value)}
                  placeholder="No limit"
                />
              </label>
              <p className="muted">Leave the limit blank to keep the session open to everyone in your section.</p>
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
            <div className="section-label">
              <h2>In your sections</h2>
              <p className="muted">Find sessions by course, topic, date, and when you are free.</p>
            </div>
            <div className="card session-filters" role="group" aria-label="Filter study sessions">
              <label className="field">
                <span>Course section</span>
                <select
                  value={filters.courseId}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, courseId: event.target.value, topic: "" }))
                  }
                >
                  <option value="">All sections</option>
                  {user.courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.code} · {course.section}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Topic</span>
                <select
                  value={filters.topic}
                  onChange={(event) => setFilters((current) => ({ ...current, topic: event.target.value }))}
                >
                  <option value="">All topics</option>
                  {topics.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>From</span>
                <input
                  type="date"
                  value={filters.fromDate}
                  onChange={(event) => setFilters((current) => ({ ...current, fromDate: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Through</span>
                <input
                  type="date"
                  value={filters.throughDate}
                  onChange={(event) => setFilters((current) => ({ ...current, throughDate: event.target.value }))}
                />
              </label>
              <label className="field">
                <span>Sort by date</span>
                <select
                  value={filters.sortOrder}
                  onChange={(event) => setFilters((current) => ({ ...current, sortOrder: event.target.value }))}
                >
                  <option value="soonest">Soonest first</option>
                  <option value="latest">Latest first</option>
                </select>
              </label>
              <label className="check availability-filter">
                <input
                  type="checkbox"
                  checked={filters.availabilityOnly}
                  onChange={(event) =>
                    setFilters((current) => ({ ...current, availabilityOnly: event.target.checked }))
                  }
                />
                <span>Only when I am free</span>
              </label>
              {hasFilters ? (
                <button
                  type="button"
                  className="btn small ghost clear-filters"
                  onClick={() =>
                    setFilters({
                      courseId: "",
                      topic: "",
                      fromDate: "",
                      throughDate: "",
                      availabilityOnly: false,
                      sortOrder: "soonest",
                    })
                  }
                >
                  Clear filters
                </button>
              ) : null}
            </div>
            {invalidDateRange ? (
              <p className="error" role="alert">The start date must be on or before the end date.</p>
            ) : null}
            <p className="result-count" aria-live="polite">
              {upcoming.length} upcoming {upcoming.length === 1 ? "session" : "sessions"}
            </p>
            {upcoming.length === 0 ? (
              <div className="empty">
                <p>
                  {groups.some((group) => group.date >= today)
                    ? "No upcoming sessions match these filters."
                    : "No upcoming sessions yet. Create one and classmates in the section can join."}
                </p>
                {hasFilters ? (
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() =>
                      setFilters({
                        courseId: "",
                        topic: "",
                        fromDate: "",
                        throughDate: "",
                        availabilityOnly: false,
                        sortOrder: "soonest",
                      })
                    }
                  >
                    Clear filters
                  </button>
                ) : null}
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
