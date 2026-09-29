import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth.jsx";
import { unreadCount } from "../store.js";
import { Wordmark } from "./ui.jsx";

function Icon({ children }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
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
    to: "/app/messages",
    label: "Messages",
    icon: (
      <Icon>
        <path d="M5 6h14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H9l-4 3v-3H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z" />
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

function NavItems({ unread, onNavigate }) {
  return LINKS.map((link) => (
    <NavLink
      key={link.to}
      to={link.to}
      end={link.end}
      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
      onClick={onNavigate}
    >
      {link.icon}
      <span>{link.label}</span>
      {link.to === "/app/messages" && unread > 0 ? <span className="badge">{unread}</span> : null}
    </NavLink>
  ));
}

export default function Shell() {
  const { user, version, logout } = useAuth();
  const unread = unreadCount(user.id);

  return (
    <div className="shell" data-version={version}>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <NavLink to="/app" className="brand-link" end>
          <Wordmark />
        </NavLink>
        <nav className="side-nav" aria-label="Main">
          <NavItems unread={unread} />
        </nav>
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
        </header>
        <main className="content" id="main">
          <Outlet />
        </main>
      </div>
      <nav className="tabbar" aria-label="Main">
        <NavItems unread={unread} />
      </nav>
    </div>
  );
}
