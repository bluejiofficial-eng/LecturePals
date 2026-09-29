import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, SetupGate, useTitle } from "../components/ui.jsx";
import {
  formatBlock,
  isProfileComplete,
  openConversation,
  searchClassmates,
  topicOptions,
} from "../store.js";

export default function Find() {
  const { user, version, refresh } = useAuth();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  useTitle("Find classmates");
  const ready = isProfileComplete(user);

  const selected =
    user.courses.find((course) => course.id === params.get("section")) || user.courses[0];
  const topic = params.get("topic") || "";

  const topics = useMemo(
    () => (ready && selected ? topicOptions(user.id, selected.id) : []),
    [ready, selected, user.id, version],
  );
  const activeTopic = topics.includes(topic) ? topic : "";
  const search = useMemo(
    () =>
      ready && selected ? searchClassmates(user.id, { enrollmentId: selected.id, topic: activeTopic }) : null,
    [ready, selected, activeTopic, user.id, version],
  );

  function update(next) {
    const query = {};
    if (next.section) query.section = next.section;
    if (next.topic) query.topic = next.topic;
    setParams(query);
  }

  function message(otherId) {
    const result = openConversation(user.id, otherId);
    if (!result.ok) return;
    refresh();
    navigate(`/app/messages/${result.conversation.id}`);
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Search and filter</p>
          <h1>Find classmates</h1>
          <p className="muted">Results stay inside your section. A topic narrows them to students working on that material.</p>
        </div>
      </header>
      {!ready || !selected ? (
        <SetupGate />
      ) : (
        <>
          <div className="filters">
            <label className="field">
              <span>Course section</span>
              <select value={selected.id} onChange={(event) => update({ section: event.target.value })}>
                {user.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.code} · {course.section}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>Syllabus topic</span>
              <select
                value={activeTopic}
                onChange={(event) => update({ section: selected.id, topic: event.target.value })}
              >
                <option value="">All topics</option>
                {topics.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p className="muted section-note">
            {selected.instructor} · {selected.section}. Students in other sections of {selected.code} are not listed.
          </p>
          <p className="result-count">
            {search.results.length} {search.results.length === 1 ? "classmate" : "classmates"}
            {activeTopic ? ` listing ${activeTopic}` : ""}
          </p>
          {search.results.length === 0 ? (
            <div className="empty">
              <p>
                {activeTopic
                  ? `Nobody else in this section has listed ${activeTopic} yet.`
                  : "No other students have added this section yet."}
              </p>
            </div>
          ) : (
            <div className="people">
              {search.results.map((result) => (
                <article key={result.user.id} className="card person">
                  <div className="person-top">
                    <Avatar name={result.user.name} />
                    <div>
                      <h2>{result.user.name}</h2>
                      <p className="muted">{result.user.major}</p>
                    </div>
                  </div>
                  <div className="chips">
                    {result.course.topics.map((item) => (
                      <span key={item} className={item.toLowerCase() === activeTopic.toLowerCase() ? "chip hot" : "chip"}>
                        {item}
                      </span>
                    ))}
                  </div>
                  <p>
                    {result.overlap.length > 0
                      ? `Both free ${result.overlap
                          .slice(0, 2)
                          .map((block) => formatBlock(block))
                          .join(", ")}`
                      : "No overlapping free time listed."}
                  </p>
                  <button type="button" className="btn small primary" onClick={() => message(result.user.id)}>
                    Message
                  </button>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
