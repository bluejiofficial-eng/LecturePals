export function pushSupported() {
  return typeof Notification !== "undefined";
}

export function pushPermission() {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function enablePush() {
  if (!pushSupported()) return "unsupported";
  if (Notification.permission === "granted") return "granted";
  return Notification.requestPermission();
}

export function showPush(title, body) {
  if (!pushSupported() || Notification.permission !== "granted") return false;
  try {
    new Notification(title, { body, icon: "/favicon.svg" });
    return true;
  } catch {
    return false;
  }
}
