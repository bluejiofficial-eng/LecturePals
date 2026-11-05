import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { Avatar, SetupGate, useTitle } from "../components/ui.jsx";
import {
  formatMessageTime,
  createGroupConversation,
  getConversation,
  isProfileComplete,
  listConversations,
  leaveConversation,
  markRead,
  renameConversation,
  searchClassmates,
  sendMessage,
} from "../store.js";

export default function Messages() {
  const { user, version, refresh } = useAuth();
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [editingName, setEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const [showMembers, setShowMembers] = useState(false);
  const [messageSearch, setMessageSearch] = useState("");
  const [confirmLeave, setConfirmLeave] = useState(false);
  const endRef = useRef(null);
  useTitle("Messages");
  const ready = isProfileComplete(user);
  const conversations = ready ? listConversations(user.id) : [];
  const active = ready && conversationId ? getConversation(user.id, conversationId) : null;
  const classmates = useMemo(() => {
    if (!ready) return [];
    const found = new Map();
    for (const course of user.courses) {
      for (const result of searchClassmates(user.id, { enrollmentId: course.id }).results) {
        found.set(result.user.id, result.user);
      }
    }
    return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
  }, [ready, user, version]);
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

  useEffect(() => {
    setShowMembers(false);
    setMessageSearch("");
    setConfirmLeave(false);
    setEditingName(false);
  }, [conversationId]);

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

  function createGroup(event) {
    event.preventDefault();
    const result = createGroupConversation(user.id, selectedMembers, groupName);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setGroupName("");
    setSelectedMembers([]);
    setCreatingGroup(false);
    refresh();
    navigate(`/app/messages/${result.conversation.id}`);
  }

  function saveGroupName(event) {
    event.preventDefault();
    if (!active) return;
    const result = renameConversation(user.id, active.id, editedName);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setEditingName(false);
    refresh();
  }

  function leaveGroupChat() {
    if (!active) return;
    const result = leaveConversation(user.id, active.id);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setError("");
    setConfirmLeave(false);
    refresh();
    navigate("/app/messages");
  }

  const normalizedSearch = messageSearch.trim().toLocaleLowerCase();
  const visibleMessages = active
    ? active.messages.filter((message) =>
        !normalizedSearch ||
        `${message.body} ${message.senderName}`.toLocaleLowerCase().includes(normalizedSearch),
      )
    : [];

  return (
    <div className="page messages-page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Direct and group chats</p>
          <h1>Messages</h1>
        </div>
        {ready && (
          <button type="button" className="btn primary" onClick={() => setCreatingGroup((value) => !value)}>
            {creatingGroup ? "Close form" : "New group chat"}
          </button>
        )}
      </header>
      {!ready ? (
        <SetupGate />
      ) : (
        <>
        {error ? <p className="error" role="alert">{error}</p> : null}
        {creatingGroup && (
          <form className="card group-chat-form" onSubmit={createGroup}>
            <h2>Start a group chat</h2>
            <label className="field">
              <span>Group name</span>
              <input
                value={groupName}
                onChange={(event) => setGroupName(event.target.value)}
                maxLength={60}
                required
                placeholder="e.g. IS 3103 study crew"
              />
            </label>
            <fieldset className="chat-member-picker">
              <legend>Choose at least two classmates</legend>
              {classmates.length === 0 ? (
                <p className="muted">No classmates in your course sections are available yet.</p>
              ) : (
                <div className="chat-member-list">
                  {classmates.map((classmate) => (
                    <label className="check chat-member-option" key={classmate.id}>
                      <input
                        type="checkbox"
                        checked={selectedMembers.includes(classmate.id)}
                        onChange={(event) => {
                          setSelectedMembers((current) =>
                            event.target.checked
                              ? [...current, classmate.id]
                              : current.filter((id) => id !== classmate.id),
                          );
                        }}
                      />
                      <Avatar name={classmate.name} size={32} />
                      <span>{classmate.name}</span>
                    </label>
                  ))}
                </div>
              )}
            </fieldset>
            <button type="submit" className="btn primary" disabled={selectedMembers.length < 2}>
              Create group chat
            </button>
          </form>
        )}
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
                  <Avatar name={conversation.name} size={40} />
                  <span className="convo-copy">
                    <span className="convo-name">
                      {conversation.name}
                      {conversation.unread > 0 ? <span className="badge">{conversation.unread}</span> : null}
                    </span>
                    <span className="muted one-line">
                      {conversation.lastMessage?.body || (conversation.isGroup ? `${conversation.members.length} members` : "No messages yet")}
                    </span>
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
                  <Avatar name={active.name} size={36} />
                  {editingName && active.isGroup ? (
                    <form className="group-name-edit" onSubmit={saveGroupName}>
                      <label className="sr-only" htmlFor="group-name-edit">Group name</label>
                      <input
                        id="group-name-edit"
                        value={editedName}
                        onChange={(event) => setEditedName(event.target.value)}
                        maxLength={60}
                        required
                        autoFocus
                      />
                      <button type="submit" className="btn small primary">Save</button>
                      <button type="button" className="btn small ghost" onClick={() => setEditingName(false)}>Cancel</button>
                    </form>
                  ) : (
                    <div className="thread-title">
                      <h2>{active.name}</h2>
                      <p className="muted">
                        {active.isGroup
                          ? active.members.map((member) => member.name).join(", ")
                          : active.other?.major}
                      </p>
                    </div>
                  )}
                  {active.isGroup && !editingName && (
                    <button
                      type="button"
                      className="btn small ghost group-name-button"
                      onClick={() => {
                        setEditedName(active.name);
                        setEditingName(true);
                      }}
                    >
                      Edit name
                    </button>
                  )}
                </header>
                {active.isGroup && (
                  <div className="group-tools">
                    <div className="group-tool-actions">
                      <button
                        type="button"
                        className="btn small secondary"
                        aria-expanded={showMembers}
                        onClick={() => setShowMembers((value) => !value)}
                      >
                        {showMembers ? "Hide members" : `Members (${active.members.length})`}
                      </button>
                      {!confirmLeave ? (
                        <button type="button" className="btn small ghost" onClick={() => setConfirmLeave(true)}>
                          Leave chat
                        </button>
                      ) : (
                        <span className="leave-confirm">
                          <span>Leave this group?</span>
                          <button type="button" className="btn small danger" onClick={leaveGroupChat}>Leave</button>
                          <button type="button" className="btn small ghost" onClick={() => setConfirmLeave(false)}>Stay</button>
                        </span>
                      )}
                    </div>
                    {showMembers && (
                      <ul className="group-members" aria-label="Group chat members">
                        {active.members.map((member) => (
                          <li key={member.id}>
                            <Avatar name={member.name} size={30} />
                            <span>{member.name}{member.id === user.id ? " (you)" : ""}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    <label className="field group-search">
                      <span>Search message history</span>
                      <input
                        type="search"
                        value={messageSearch}
                        onChange={(event) => setMessageSearch(event.target.value)}
                        placeholder="Enter a keyword or phrase"
                      />
                    </label>
                    {normalizedSearch && (
                      <p className="muted search-count" aria-live="polite">
                        {visibleMessages.length} {visibleMessages.length === 1 ? "match" : "matches"} for “{messageSearch.trim()}”
                      </p>
                    )}
                  </div>
                )}
                <div className="thread-log" ref={endRef}>
                  {visibleMessages.length === 0 ? (
                    <p className="muted search-empty">
                      {normalizedSearch ? "No messages match that keyword." : "No messages yet. Start the conversation."}
                    </p>
                  ) : visibleMessages.map((message) => (
                    message.type === "system" ? (
                      <p key={message.id} className="system-message">{message.body}</p>
                    ) : (
                      <div key={message.id} className={message.senderId === user.id ? "bubble mine" : "bubble"}>
                        {active.isGroup && message.senderId !== user.id ? <strong>{message.senderName}</strong> : null}
                        <p>{message.body}</p>
                        <time dateTime={message.createdAt}>{formatMessageTime(message.createdAt)}</time>
                      </div>
                    )
                  ))}
                </div>
                <form className="composer" onSubmit={submit}>
                  <label className="sr-only" htmlFor="message-body">
                    Message {active.name}
                  </label>
                  <textarea
                    id="message-body"
                    rows={2}
                    value={draft}
                    maxLength={1000}
                    placeholder={`Message ${active.name}`}
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
              </>
            )}
          </section>
        </div>
        </>
      )}
    </div>
  );
}
