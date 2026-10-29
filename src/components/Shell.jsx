import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { unreadAlertCount, unreadCount } from "../store.js";
import { Wordmark } from "./ui.jsx";

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

function ThemeToggle({ isDark, onToggle, compact = false }) {
  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " compact" : ""}`}
      onClick={onToggle}
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      aria-pressed={isDark}
      title={`Switch to ${isDark ? "light" : "dark"} mode`}
    >
      <Icon>
        {isDark ? (
          <>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </>
        ) : (
          <path d="M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5 8.5 8.5 0 1 0 20.5 15.5Z" />
        )}
      </Icon>
      <span>{isDark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}

const LINKS = [
  {
    to: "/app",
    end: true,
    label: "Home",
    icon: (
      <Icon>
        <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
      </Icon>
    ),
  },
  {
    to: "/app/find",
    label: "Find",
    icon: (
      <Icon>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m16 16 4 4" />
      </Icon>
    ),
  },
  {
    to: "/app/groups",
    label: "Groups",
    icon: (
      <Icon>
        <path d="M8 11a3 3 0 1 0-3-3 3 3 0 0 0 3 3Zm8 0a3 3 0 1 0-3-3 3 3 0 0 0 3 3ZM3.5 19c.4-2.4 2.3-3.8 4.5-3.8S12.1 16.6 12.5 19M11.5 19c.4-2.4 2.3-3.8 4.5-3.8s4.1 1.4 4.5 3.8" />
      </Icon>
    ),
  },
  {
    to: "/app/calendar",
    label: "Calendar",
    mobile: false,
    icon: (
      <Icon>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3.5v3M16 3.5v3M4 9h16" />
      </Icon>
    ),
  },
  {
    to: "/app/messages",
    label: "Messages",
    icon: (
      <Icon>
        <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
      </Icon>
    ),
  },
  {
    to: "/app/alerts",
    label: "Alerts",
    mobile: false,
    icon: (
      <Icon>
        <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5z" />
        <path d="M10 19a2 2 0 0 0 4 0" />
      </Icon>
    ),
  },
  {
    to: "/app/profile",
    label: "Profile",
    icon: (
      <Icon>
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c.8-3 3.2-4.5 7-4.5s6.2 1.5 7 4.5" />
      </Icon>
    ),
  },
];

function NavItems({ unread, alerts, onNavigate, links = LINKS }) {
  return links.map((link) => {
    const count = link.to === "/app/messages" ? unread : link.to === "/app/alerts" ? alerts : 0;
    return (
      <NavLink
        key={link.to}
        to={link.to}
        end={link.end}
        className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
        onClick={onNavigate}
      >
        {link.icon}
        <span>{link.label}</span>
        {count > 0 ? <span className="badge">{count}</span> : null}
      </NavLink>
    );
  });
}

export default function Shell() {
  const { user, version, logout } = useAuth();
  const [isDark, setIsDark] = useState(() => {
    try {
      return window.localStorage.getItem("lecturepals-theme") === "dark";
    } catch {
      return false;
    }
  });
  const unread = unreadCount(user.id);
  const alerts = unreadAlertCount(user.id);
  const toggleTheme = () => {
    setIsDark((current) => {
      const next = !current;
      try {
        window.localStorage.setItem("lecturepals-theme", next ? "dark" : "light");
      } catch {
        // Keep the in-memory preference if storage is unavailable.
      }
      return next;
    });
  };

  return (
    <div className="shell" data-version={version} data-theme={isDark ? "dark" : "light"}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/app" className="brand-link" end>
          <Wordmark />
        </NavLink>
        <nav className="side-nav" aria-label="Main">
          <NavItems unread={unread} alerts={alerts} />
        </nav>
        <ThemeToggle isDark={isDark} onToggle={toggleTheme} />
        <div className="side-user">
          <p className="side-name">{user.name}</p>
          <p className="side-email">{user.email}</p>
          <button type="button" className="btn ghost small" onClick={logout}>
            Log out
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <Wordmark />
          <div className="topbar-actions">
            <ThemeToggle isDark={isDark} onToggle={toggleTheme} compact />
            <Link className="bell" to="/app/alerts" aria-label={`Alerts${alerts ? `, ${alerts} unread` : ""}`}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M6 16V10a6 6 0 1 1 12 0v6l1.5 2H4.5z" />
                <path d="M10 19a2 2 0 0 0 4 0" />
              </svg>
              {alerts > 0 ? <span className="badge">{alerts}</span> : null}
            </Link>
          </div>
        </header>
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
      <nav className="tabbar" aria-label="Main">
        <NavItems unread={unread} alerts={alerts} links={LINKS.filter((link) => link.mobile !== false)} />
      </nav>
    </div>
  );
}
