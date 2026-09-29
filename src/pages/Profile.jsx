import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { useTitle } from "../components/ui.jsx";
import { CATALOG, DAYS, updateProfile } from "../store.js";

function blankBlock() {
  return { id: crypto.randomUUID(), day: "Tue", start: "13:00", end: "15:00" };
}

export default function Profile() {
  const { user, refresh, logout, resetDemoData } = useAuth();
  const navigate = useNavigate();
  const [major, setMajor] = useState(user.major || "");
  const [courses, setCourses] = useState(() =>
    user.courses.map((course) => ({ ...course, topics: [...course.topics] })),
  );
  const [availability, setAvailability] = useState(() =>
    user.availability.length ? user.availability.map((block) => ({ ...block })) : [blankBlock()],
  );
  const [customTopic, setCustomTopic] = useState({});
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);
  useTitle("Profile");

  const remaining = CATALOG.filter((item) => !courses.some((course) => course.catalogId === item.id));

  function addCourse(catalogId) {
    const item = CATALOG.find((entry) => entry.id === catalogId);
    if (!item) return;
    setCourses((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        catalogId: item.id,
        code: item.code,
        section: item.section,
        instructor: item.instructor,
        topics: [],
      },
    ]);
    setStatus("");
  }

  function toggleTopic(courseId, topic) {
    setCourses((current) =>
      current.map((course) => {
        if (course.id !== courseId) return course;
        const has = course.topics.some((item) => item.toLowerCase() === topic.toLowerCase());
        return {
          ...course,
          topics: has
            ? course.topics.filter((item) => item.toLowerCase() !== topic.toLowerCase())
            : [...course.topics, topic],
        };
      }),
    );
  }

  function addCustomTopic(courseId) {
    const topic = (customTopic[courseId] || "").trim().replace(/\s+/g, " ");
    if (!topic) return;
    setCourses((current) =>
      current.map((course) => {
        if (course.id !== courseId) return course;
        if (course.topics.some((item) => item.toLowerCase() === topic.toLowerCase())) return course;
        return { ...course, topics: [...course.topics, topic] };
      }),
    );
    setCustomTopic((current) => ({ ...current, [courseId]: "" }));
  }

  function save(event) {
    event.preventDefault();
    setError("");
    setStatus("");
    const result = updateProfile(user.id, { major, courses, availability });
    if (!result.ok) {
      setError(result.error);
      return;
    }
    refresh();
    setStatus("Profile saved. Classmates in your sections can find you now.");
  }

  async function reset() {
    await resetDemoData();
    navigate("/", { replace: true });
  }

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <p className="eyebrow">Profile</p>
          <h1>{user.name}</h1>
          <p className="muted">{user.email}</p>
        </div>
      </header>

      <form className="stack" onSubmit={save}>
        <label className="field">
          <span>Major</span>
          <input
            value={major}
            onChange={(event) => setMajor(event.target.value)}
            placeholder="Information Systems"
            maxLength={80}
            required
          />
        </label>

        <section className="stack">
          <div className="section-label">
            <h2>Course sections</h2>
            <p className="muted">Pick the section you are enrolled in. Matching uses the course code, time, and instructor together.</p>
          </div>
          {courses.map((course) => {
            const catalog = CATALOG.find((item) => item.id === course.catalogId);
            const extraTopics = course.topics.filter(
              (topic) => !catalog?.topics.some((item) => item.toLowerCase() === topic.toLowerCase()),
            );
            return (
              <article key={course.id} className="card course-editor">
                <div className="split">
                  <div>
                    <h3>
                      {course.code} · {course.section}
                    </h3>
                    <p className="muted">{course.instructor}</p>
                  </div>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => setCourses((current) => current.filter((item) => item.id !== course.id))}
                  >
                    Remove
                  </button>
                </div>
                <fieldset className="checks">
                  <legend>Syllabus topics</legend>
                  {(catalog?.topics || []).map((topic) => (
                    <label key={topic} className="check">
                      <input
                        type="checkbox"
                        checked={course.topics.some((item) => item.toLowerCase() === topic.toLowerCase())}
                        onChange={() => toggleTopic(course.id, topic)}
                      />
                      <span>{topic}</span>
                    </label>
                  ))}
                </fieldset>
                {extraTopics.length > 0 && (
                  <div className="chips">
                    {extraTopics.map((topic) => (
                      <span key={topic} className="chip">
                        {topic}
                        <button type="button" aria-label={`Remove ${topic}`} onClick={() => toggleTopic(course.id, topic)}>
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <div className="inline-add">
                  <label className="field grow">
                    <span className="sr-only">Add a topic for {course.code}</span>
                    <input
                      value={customTopic[course.id] || ""}
                      placeholder="Add a topic from your syllabus"
                      maxLength={40}
                      onChange={(event) =>
                        setCustomTopic((current) => ({ ...current, [course.id]: event.target.value }))
                      }
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addCustomTopic(course.id);
                        }
                      }}
                    />
                  </label>
                  <button type="button" className="btn secondary" onClick={() => addCustomTopic(course.id)}>
                    Add topic
                  </button>
                </div>
              </article>
            );
          })}
          {remaining.length > 0 && (
            <label className="field">
              <span>Add a section</span>
              <select
                value=""
                onChange={(event) => {
                  addCourse(event.target.value);
                  event.target.value = "";
                }}
              >
                <option value="">Choose a section</option>
                {remaining.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} · {item.section} · {item.instructor}
                  </option>
                ))}
              </select>
            </label>
          )}
        </section>

        <section className="stack">
          <div className="section-label">
            <h2>Availability</h2>
            <p className="muted">These are the times other students can use to see when you overlap.</p>
          </div>
          {availability.map((block) => (
            <div key={block.id} className="time-row">
              <label>
                <span className="sr-only">Day</span>
                <select
                  value={block.day}
                  onChange={(event) =>
                    setAvailability((current) =>
                      current.map((item) => (item.id === block.id ? { ...item, day: event.target.value } : item)),
                    )
                  }
                >
                  {DAYS.map((day) => (
                    <option key={day}>{day}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="sr-only">Start</span>
                <input
                  type="time"
                  value={block.start}
                  step="900"
                  onChange={(event) =>
                    setAvailability((current) =>
                      current.map((item) => (item.id === block.id ? { ...item, start: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <span aria-hidden="true">to</span>
              <label>
                <span className="sr-only">End</span>
                <input
                  type="time"
                  value={block.end}
                  step="900"
                  onChange={(event) =>
                    setAvailability((current) =>
                      current.map((item) => (item.id === block.id ? { ...item, end: event.target.value } : item)),
                    )
                  }
                />
              </label>
              <button
                type="button"
                className="btn ghost small"
                onClick={() => setAvailability((current) => current.filter((item) => item.id !== block.id))}
                disabled={availability.length === 1}
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" className="btn secondary" onClick={() => setAvailability((current) => [...current, blankBlock()])}>
            Add a free block
          </button>
        </section>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {status ? (
          <p className="status" role="status">
            {status}
          </p>
        ) : null}
        <div className="hero-actions">
          <button className="btn primary" type="submit">
            Save profile
          </button>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </form>

      <details className="demo-tools">
        <summary>Demo tools</summary>
        <p className="muted">Sample classmates are stored in this browser. Resetting clears accounts you created here too.</p>
        {confirmReset ? (
          <div className="hero-actions">
            <button type="button" className="btn danger" onClick={reset}>
              Reset demo data
            </button>
            <button type="button" className="btn ghost" onClick={() => setConfirmReset(false)}>
              Keep my data
            </button>
          </div>
        ) : (
          <button type="button" className="btn ghost" onClick={() => setConfirmReset(true)}>
            Reset demo data
          </button>
        )}
      </details>
    </div>
  );
}
