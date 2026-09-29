import { useEffect } from "react";
import { Link } from "react-router-dom";
import { initials } from "../store.js";

const AVATAR_COLORS = ["#1f4d42", "#8f3016", "#24344d", "#8a5a12", "#3d4f7c"];

export function useTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · LecturePals` : "LecturePals";
  }, [title]);
}

export function Wordmark() {
  return (
    <span className="wordmark">
      <svg className="mark" viewBox="0 0 32 32" aria-hidden="true">
        <rect x="3" y="5" width="16" height="22" rx="3" fill="#1f4d42" />
        <rect x="13" y="8" width="16" height="19" rx="3" fill="#8f3016" />
        <path d="M17 14.5h8M17 18.5h5.5" stroke="#fffdf8" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
      LecturePals
    </span>
  );
}

export function Avatar({ name, size = 42 }) {
  const color = AVATAR_COLORS[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span className="avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.34 }}>
      {initials(name)}
    </span>
  );
}

export function SetupGate() {
  return (
    <section className="panel setup-gate">
      <p className="eyebrow">Profile needed</p>
      <h2>Finish your profile before matching</h2>
      <p>
        Classmates can find you only after you add a major, at least one course section, and the times you are free.
      </p>
      <Link className="btn primary" to="/app/profile">
        Complete profile
      </Link>
    </section>
  );
}
