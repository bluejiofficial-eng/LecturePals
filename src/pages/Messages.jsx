import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, SetupGate, useTitle } from "../components/ui.jsx";
import {
  formatMessageTime,
  getConversation,
  isProfileComplete,
  listConversations,
  markRead,
  sendMessage,
} from "../store.js";

export default function Messages() {
  const { user, version, refresh } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const endRef = useRef(null);
  useTitle("Messages");
  const ready = isProfileComplete(user);
  const conversations = ready ? listConversations(user.id) : [];
  const active = ready && conversationId ? getConversation(user.id, conversationId) : null;
  const messageCount = active?.messages.length ?? 0;
  const latestIncoming = active?.messages.filter((message) => message.senderId !== user.id).at(-1)?.createdAt;
  void version;

  useEffect(() => {
    if (!conversationId) return;
    if (markRead(user.id, conversationId)) refresh();
  }, [conversationId, latestIncoming, user.id, refresh]);

  useEffect(() => {
    const log = endRef.current;
    if (log) log.scrollTop = log.scrollHeight;
  }, [conversationId, messageCount]);

  function submit(event) {
    event.preventDefault();
    if (!active) return;
    const result = sendMessage(user.id, active.id, draft);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setDraft("");
    setError("");
    refresh();
  }

  return (
    <div className="page messages-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Direct messages</p>
          <h1>Messages</h1>
        </div>
      </header>
      {!ready ? (
        <SetupGate />
      ) : (
        <div className={`messages-layout ${active ? "show-thread" : ""}`}>
          <aside className="inbox" aria-label="Conversations">
            {conversations.length === 0 ? (
              <div className="empty inset">
                <p>No messages yet. Open Find classmates and write someone in your section.</p>
                <Link className="btn secondary" to="/app/find">
                  Find classmates
                </Link>
              </div>
            ) : (
              conversations.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  className={conversation.id === conversationId ? "convo active" : "convo"}
                  onClick={() => navigate(`/app/messages/${conversation.id}`)}
                >
                  <Avatar name={conversation.other.name} size={40} />
                  <span className="convo-copy">
                    <span className="convo-name">
                      {conversation.other.name}
                      {conversation.unread > 0 ? <span className="badge">{conversation.unread}</span> : null}
                    </span>
                    <span className="muted one-line">{conversation.lastMessage?.body || "No messages yet"}</span>
                  </span>
                </button>
              ))
            )}
          </aside>
          <section className="thread" aria-label="Conversation">
            {!active ? (
              <div className="empty inset">
                <p>{conversationId ? "That conversation is not available." : "Select a conversation."}</p>
              </div>
            ) : (
              <>
                <header className="thread-head">
                  <button type="button" className="btn ghost small back-link" onClick={() => navigate("/app/messages")}>
                    Back
                  </button>
                  <Avatar name={active.other.name} size={36} />
                  <div>
                    <h2>{active.other.name}</h2>
                    <p className="muted">{active.other.major}</p>
                  </div>
                </header>
                <div className="thread-log" ref={endRef}>
                  {active.messages.map((message) => (
                    <div key={message.id} className={message.senderId === user.id ? "bubble mine" : "bubble"}>
                      <p>{message.body}</p>
                      <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                    </div>
                  ))}
                </div>
                <form className="composer" onSubmit={submit}>
                  <label className="sr-only" htmlFor="message-body">
                    Message {active.other.name}
                  </label>
                  <textarea
                    id="message-body"
                    rows={2}
                    value={draft}
                    maxLength={1000}
                    placeholder={`Message ${active.other.name}`}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        event.currentTarget.form?.requestSubmit();
                      }
                    }}
                  />
                  <button className="btn primary" type="submit">
                    Send
                  </button>
                </form>
                {error ? (
                  <p className="error" role="alert">
                    {error}
                  </p>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
