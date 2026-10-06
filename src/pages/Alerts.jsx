import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { SetupGate, useTitle } from "../components/ui.jsx";
import { downloadTextFile } from "../download.js";
import { enablePush, pushPermission, showPush } from "../notify.js";
import {
  formatMessageTime,
  isProfileComplete,
  listAlerts,
  markAlertsRead,
  markPushed,
  peekUnpushed,
  respondToInvite,
  sessionsToIcs,
} from "../store.js";

export default function Alerts() {
  const { user, version, refresh } = useAuth();
  useTitle("Alerts");
  const ready = isProfileComplete(user);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [permission, setPermission] = useState(pushPermission());
  const alerts = ready ? listAlerts(user.id) : [];
  void version;

  useEffect(() => {
    if (!ready) return;
    if (markAlertsRead(user.id)) refresh();
  }, [ready, user.id, refresh]);

  async function allowReminders() {
    const next = await enablePush();
    setPermission(next);
    if (next !== "granted") {
      setError("Browser reminders stay off until you allow notifications.");
      return;
    }
    const pending = peekUnpushed(user.id);
    pending.forEach((alert) => showPush(alert.title, alert.body));
    markPushed(pending.map((alert) => alert.id));
    setError("");
    setNotice(pending.length ? "Reminders are on. Pending alerts were sent." : "Reminders are on.");
  }

  function respond(inviteId, accept) {
    const result = respondToInvite(user.id, inviteId, accept);
    if (!result.ok) {
      setNotice("");
      setError(result.error);
      return;
    }
    if (pushPermission() === "granted") {
      const mine = (result.alerts || []).filter((alert) => alert.userId === user.id);
      mine.forEach((alert) => showPush(alert.title, alert.body));
      markPushed(mine.map((alert) => alert.id));
    }
    refresh();
    setError("");
    setNotice(accept ? "You joined the session. A reminder was sent to your email." : "Invite declined.");
  }

  function saveSession(group) {
    downloadTextFile(
      `${group.courseCode.replace(/\s+/g, "")}-${group.topic.replace(/\s+/g, "-")}.ics`,
      sessionsToIcs([group]),
    );
  }

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <p className="eyebrow">Email and reminders</p>
          <h1>Alerts</h1>
          <p className="muted">Invites and session reminders are delivered to {user.email} and kept here.</p>
        </div>
      </header>
      {!ready ? (
        <SetupGate />
      ) : (
        <>
          {permission !== "granted" && permission !== "unsupported" && (
            <section className="panel setup-gate">
              <h2>Browser reminders</h2>
              <p>Turn these on to get a notification as soon as an invite or session reminder arrives.</p>
              <button type="button" className="btn primary" onClick={allowReminders}>
                Allow reminders
              </button>
            </section>
          )}
          {permission === "unsupported" && (
            <p className="muted">This browser cannot show push notifications. Email alerts still appear in this list.</p>
          )}
          {notice ? (
            <p className="status" role="status">
              {notice}
            </p>
          ) : null}
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {alerts.length === 0 ? (
            <div className="empty">
              <p>No alerts yet. Invites and reminders for your sessions will show up here.</p>
            </div>
          ) : (
            <div className="stack">
              {alerts.map((alert) => (
                <article key={alert.id} className="card alert-card">
                  <p className="eyebrow">
                    {alert.kind === "invite"
                      ? "Invite"
                      : alert.kind === "reminder"
                        ? "Reminder"
                        : alert.kind === "cancelled"
                          ? "Cancelled"
                          : "Update"}{" "}
                    · {formatMessageTime(alert.createdAt)}
                  </p>
                  <h2>{alert.title}</h2>
                  <p>{alert.body}</p>
                  <p className="muted">Sent to {user.email}</p>
                  <div className="hero-actions">
                    {alert.kind === "invite" && alert.inviteStatus === "pending" && alert.group && (
                      <>
                        <button type="button" className="btn small primary" onClick={() => respond(alert.inviteId, true)}>
                          Accept
                        </button>
                        <button type="button" className="btn small ghost" onClick={() => respond(alert.inviteId, false)}>
                          Decline
                        </button>
                      </>
                    )}
                    {alert.kind === "invite" && alert.inviteStatus === "accepted" && <span className="chip">Accepted</span>}
                    {alert.kind === "invite" && alert.inviteStatus === "declined" && <span className="chip">Declined</span>}
                    {alert.group && (alert.kind === "reminder" || alert.inviteStatus === "accepted") && (
                      <button type="button" className="btn small secondary" onClick={() => saveSession(alert.group)}>
                        Add to calendar
                      </button>
                    )}
                    {alert.group && (
                      <Link className="btn small ghost" to="/app/groups">
                        View session
                      </Link>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
