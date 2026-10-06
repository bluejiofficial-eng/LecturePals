const STORAGE_KEY = "lecturepals-v2";
const SESSION_KEY = "lecturepals-session";

export const DEMO_EMAIL = "avery.quinn@stateu.edu";
export const DEMO_PASSWORD = "pals2026";

export const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const LOCATIONS = [
  "Main Library, Room 214",
  "Main Library, 3rd floor tables",
  "Student Center, Room 120",
  "Engineering Atrium",
  "Science Hall, Room 204",
  "Campus Quad",
];

export const CATALOG = [
  {
    id: "is3103-tth",
    code: "IS 3103",
    section: "TTH 10:00 AM – 12:00 PM",
    instructor: "Prof. Elena Vasquez",
    topics: [
      "Normalization",
      "ER Diagrams",
      "SQL Joins",
      "Requirements Gathering",
      "Transactions",
    ],
  },
  {
    id: "is3103-mw",
    code: "IS 3103",
    section: "MW 2:00–3:30 PM",
    instructor: "Prof. Elena Vasquez",
    topics: [
      "Normalization",
      "ER Diagrams",
      "SQL Joins",
      "Requirements Gathering",
      "Transactions",
    ],
  },
  {
    id: "cs2201-mwf",
    code: "CS 2201",
    section: "MWF 9:00–10:00 AM",
    instructor: "Prof. David Cho",
    topics: ["Trees", "Hash Tables", "Graphs", "Recursion"],
  },
  {
    id: "is2205-tth",
    code: "IS 2205",
    section: "TTH 1:00–2:30 PM",
    instructor: "Prof. Hannah Brooks",
    topics: ["Regression", "Dashboards", "Spreadsheets"],
  },
];

let state = null;
let initPromise = null;

export function isUniversityEmail(email) {
  const value = String(email || "").trim().toLowerCase();
  const parts = value.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || !domain || local.length > 64 || domain.length > 120) return false;
  if (!/^[a-z0-9._%+-]+$/.test(local)) return false;
  if (!/^[a-z0-9.-]+\.edu$/.test(domain)) return false;
  if (domain.split(".").some((label) => !label || label.startsWith("-") || label.endsWith("-"))) {
    return false;
  }
  return true;
}

export function canonicalCourseCode(input) {
  const cleaned = String(input || "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, "")
    .replace(/\s+/g, " ");
  const match = cleaned.match(/^([A-Z]{2,5})\s*(\d{3,4}[A-Z]?)$/);
  if (match) return `${match[1]} ${match[2]}`;
  return cleaned;
}

export async function hashPassword(password, salt) {
  const data = new TextEncoder().encode(`${salt}:${password}`);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function makeSalt() {
  return [...crypto.getRandomValues(new Uint8Array(16))]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function persist() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota and private-mode failures. The session still works in memory.
  }
}

function sortAvailability(blocks) {
  return [...(blocks || [])].sort(
    (a, b) => DAYS.indexOf(a.day) - DAYS.indexOf(b.day) || a.start.localeCompare(b.start),
  );
}

function publicUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    major: user.major,
    courses: (user.courses || []).map((course) => ({
      ...course,
      topics: [...course.topics],
    })),
    availability: sortAvailability(user.availability),
  };
}

function getUser(id) {
  return state?.users.find((user) => user.id === id) || null;
}

export function todayISO() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dateFromToday(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function formatClock(value) {
  const [hourPart, minutePart] = String(value).split(":");
  const hour = Number(hourPart);
  const suffix = hour >= 12 ? "PM" : "AM";
  const twelve = hour % 12 || 12;
  return `${twelve}:${minutePart} ${suffix}`;
}

export function formatBlock(block) {
  return `${block.day} ${formatClock(block.start)}–${formatClock(block.end)}`;
}

export function formatLongDate(iso) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function formatMessageTime(iso) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export function sharedAvailability(left, right) {
  const shared = [];
  for (const a of left || []) {
    for (const b of right || []) {
      if (a.day !== b.day) continue;
      const start = a.start > b.start ? a.start : b.start;
      const end = a.end < b.end ? a.end : b.end;
      if (start < end) shared.push({ day: a.day, start, end });
    }
  }
  return sortAvailability(shared);
}

export function isProfileComplete(user) {
  if (!user?.major?.trim()) return false;
  if (!user.courses?.length || !user.availability?.length) return false;
  return user.courses.every(
    (course) => course.code && course.section && course.instructor && course.topics?.length,
  );
}

function courseRecord(catalogId, topics) {
  const item = CATALOG.find((entry) => entry.id === catalogId);
  return {
    id: `course-${catalogId}-${Math.random().toString(16).slice(2, 8)}`,
    catalogId,
    code: item.code,
    section: item.section,
    instructor: item.instructor,
    topics: [...topics],
  };
}

async function createSeed() {
  const salt = "lecturepals-demo-salt";
  const passwordHash = await hashPassword(DEMO_PASSWORD, salt);
  const locked = "seed-account";

  const user = (fields) => ({
    passwordSalt: locked,
    passwordHash: locked,
    ...fields,
  });

  const seed = {
    users: [
      user({
        id: "user-avery",
        name: "Avery Quinn",
        email: DEMO_EMAIL,
        passwordSalt: salt,
        passwordHash,
        major: "Information Systems",
        courses: [
          {
            id: "course-avery-is",
            catalogId: "is3103-tth",
            code: "IS 3103",
            section: "TTH 10:00 AM – 12:00 PM",
            instructor: "Prof. Elena Vasquez",
            topics: ["Normalization", "ER Diagrams", "Requirements Gathering"],
          },
          {
            id: "course-avery-cs",
            catalogId: "cs2201-mwf",
            code: "CS 2201",
            section: "MWF 9:00–10:00 AM",
            instructor: "Prof. David Cho",
            topics: ["Trees", "Hash Tables"],
          },
        ],
        availability: [
          { id: "av-1", day: "Tue", start: "13:00", end: "16:00" },
          { id: "av-2", day: "Thu", start: "13:00", end: "15:00" },
          { id: "av-3", day: "Sun", start: "14:00", end: "18:00" },
        ],
      }),
      user({
        id: "user-maya",
        name: "Maya Chen",
        email: "maya.chen@stateu.edu",
        major: "Information Systems",
        courses: [
          courseRecord("is3103-tth", ["Normalization", "SQL Joins", "ER Diagrams"]),
        ],
        availability: [
          { id: "maya-1", day: "Tue", start: "13:00", end: "15:00" },
          { id: "maya-2", day: "Thu", start: "14:00", end: "17:00" },
        ],
      }),
      user({
        id: "user-jordan",
        name: "Jordan Hale",
        email: "jordan.hale@stateu.edu",
        major: "Computer Science",
        courses: [
          courseRecord("is3103-tth", ["ER Diagrams", "Requirements Gathering"]),
          courseRecord("cs2201-mwf", ["Trees", "Graphs"]),
        ],
        availability: [
          { id: "jordan-1", day: "Mon", start: "16:00", end: "18:00" },
          { id: "jordan-2", day: "Wed", start: "16:00", end: "19:00" },
          { id: "jordan-3", day: "Sun", start: "14:00", end: "16:00" },
        ],
      }),
      user({
        id: "user-priya",
        name: "Priya Shah",
        email: "priya.shah@stateu.edu",
        major: "Information Systems",
        courses: [courseRecord("is3103-tth", ["SQL Joins", "Transactions"])],
        availability: [
          { id: "priya-1", day: "Thu", start: "13:00", end: "16:00" },
          { id: "priya-2", day: "Sat", start: "10:00", end: "13:00" },
        ],
      }),
      user({
        id: "user-luis",
        name: "Luis Ortega",
        email: "luis.ortega@stateu.edu",
        major: "Business Analytics",
        courses: [courseRecord("is3103-tth", ["Normalization"])],
        availability: [{ id: "luis-1", day: "Tue", start: "14:00", end: "17:00" }],
      }),
      user({
        id: "user-sam",
        name: "Sam Okonkwo",
        email: "sam.okonkwo@stateu.edu",
        major: "Information Systems",
        courses: [courseRecord("is3103-mw", ["Normalization", "SQL Joins"])],
        availability: [{ id: "sam-1", day: "Mon", start: "14:00", end: "16:00" }],
      }),
      user({
        id: "user-remy",
        name: "Remy Diaz",
        email: "remy.diaz@stateu.edu",
        major: "Business Analytics",
        courses: [courseRecord("is2205-tth", ["Regression", "Dashboards"])],
        availability: [{ id: "remy-1", day: "Tue", start: "13:00", end: "15:00" }],
      }),
    ],
    groups: [
      {
        id: "group-norm",
        courseCode: "IS 3103",
        section: "TTH 10:00 AM – 12:00 PM",
        instructor: "Prof. Elena Vasquez",
        topic: "Normalization",
        date: dateFromToday(2),
        start: "14:00",
        end: "16:00",
        location: "Main Library, Room 214",
        hostId: "user-maya",
        memberIds: ["user-maya", "user-priya"],
      },
      {
        id: "group-er",
        courseCode: "IS 3103",
        section: "TTH 10:00 AM – 12:00 PM",
        instructor: "Prof. Elena Vasquez",
        topic: "ER Diagrams",
        date: dateFromToday(4),
        start: "15:00",
        end: "17:00",
        location: "Student Center, Room 120",
        hostId: "user-jordan",
        memberIds: ["user-jordan", "user-avery"],
      },
      {
        id: "group-trees",
        courseCode: "CS 2201",
        section: "MWF 9:00–10:00 AM",
        instructor: "Prof. David Cho",
        topic: "Trees",
        date: dateFromToday(1),
        start: "16:00",
        end: "17:30",
        location: "Engineering Atrium",
        hostId: "user-jordan",
        memberIds: ["user-jordan"],
      },
    ],
    conversations: [
      {
        id: "convo-maya",
        participantIds: ["user-avery", "user-maya"],
        lastRead: {
          "user-avery": hoursAgo(20),
          "user-maya": hoursAgo(28),
        },
      },
      {
        id: "convo-jordan",
        participantIds: ["user-avery", "user-jordan"],
        lastRead: {
          "user-avery": hoursAgo(26),
          "user-jordan": hoursAgo(30),
        },
      },
      {
        id: "convo-priya",
        participantIds: ["user-avery", "user-priya"],
        lastRead: {
          "user-priya": hoursAgo(2),
        },
      },
    ],
    messages: [
      {
        id: "msg-1",
        conversationId: "convo-maya",
        senderId: "user-maya",
        body: "Want to meet at Library Room 214 for normalization? I can bring the quiz sheet.",
        createdAt: hoursAgo(28),
      },
      {
        id: "msg-2",
        conversationId: "convo-maya",
        senderId: "user-avery",
        body: "Yes, I can do 2:00. I will review 1NF through 3NF before then.",
        createdAt: hoursAgo(20),
      },
      {
        id: "msg-3",
        conversationId: "convo-jordan",
        senderId: "user-jordan",
        body: "ER workshop is still on. Bring the case from chapter 3.",
        createdAt: hoursAgo(26),
      },
      {
        id: "msg-4",
        conversationId: "convo-priya",
        senderId: "user-priya",
        body: "Are you joining Maya's normalization session? I have a table of anomalies we can walk through.",
        createdAt: hoursAgo(2),
      },
    ],
    invites: [],
    alerts: [],
  };

  const norm = seed.groups.find((group) => group.id === "group-norm");
  const er = seed.groups.find((group) => group.id === "group-er");
  seed.invites.push({
    id: "invite-norm",
    groupId: "group-norm",
    fromId: "user-maya",
    toId: "user-avery",
    status: "pending",
    createdAt: hoursAgo(3),
  });
  seed.alerts.push(
    {
      id: "alert-invite-norm",
      userId: "user-avery",
      kind: "invite",
      inviteId: "invite-norm",
      groupId: "group-norm",
      title: "Study session invite",
      body: `Maya Chen invited you to Normalization, ${formatLongDate(norm.date)}, ${formatClock(norm.start)}–${formatClock(norm.end)} at ${norm.location}.`,
      createdAt: hoursAgo(3),
      read: false,
      pushed: false,
    },
    {
      id: "alert-reminder-er",
      userId: "user-avery",
      kind: "reminder",
      inviteId: null,
      groupId: "group-er",
      title: "Session reminder",
      body: `ER Diagrams meets ${formatLongDate(er.date)}, ${formatClock(er.start)}–${formatClock(er.end)} at ${er.location}.`,
      createdAt: hoursAgo(1),
      read: false,
      pushed: false,
    },
  );
  return seed;
}

function normalize(saved) {
  saved.users ||= [];
  saved.groups ||= [];
  saved.conversations ||= [];
  saved.messages ||= [];
  saved.invites ||= [];
  saved.alerts ||= [];
  return saved;
}

async function load() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (raw) {
    try {
      state = normalize(JSON.parse(raw));
      return state;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
  state = await createSeed();
  persist();
  return state;
}

export function initStore() {
  if (!initPromise) initPromise = load();
  return initPromise;
}

export async function resetDemo() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(SESSION_KEY);
  state = null;
  initPromise = load();
  return initPromise;
}

export function getCurrentUser() {
  const id = localStorage.getItem(SESSION_KEY);
  if (!id) return null;
  return publicUser(getUser(id));
}

export async function signUp({ name, email, password }) {
  const cleanName = String(name || "").trim().replace(/\s+/g, " ");
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (cleanName.length < 2 || cleanName.length > 60) {
    return { ok: false, error: "Enter your name." };
  }
  if (!isUniversityEmail(cleanEmail)) {
    return { ok: false, error: "Use a valid university email that ends in .edu." };
  }
  if (String(password || "").length < 8 || String(password).length > 100) {
    return { ok: false, error: "Use a password with at least 8 characters." };
  }
  if (state.users.some((user) => user.email === cleanEmail)) {
    return { ok: false, error: "An account with that email already exists. Log in instead." };
  }
  const passwordSalt = makeSalt();
  const passwordHash = await hashPassword(password, passwordSalt);
  const user = {
    id: crypto.randomUUID(),
    name: cleanName,
    email: cleanEmail,
    passwordSalt,
    passwordHash,
    major: "",
    courses: [],
    availability: [],
  };
  state.users.push(user);
  persist();
  localStorage.setItem(SESSION_KEY, user.id);
  return { ok: true, user: publicUser(user) };
}

export async function logIn({ email, password }) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!isUniversityEmail(cleanEmail)) {
    return { ok: false, error: "Use a valid university email that ends in .edu." };
  }
  const user = state.users.find((entry) => entry.email === cleanEmail);
  if (!user || user.passwordHash === "seed-account") {
    return { ok: false, error: "No account found for that email." };
  }
  const hash = await hashPassword(password, user.passwordSalt);
  if (hash !== user.passwordHash) {
    return { ok: false, error: "That password does not match." };
  }
  localStorage.setItem(SESSION_KEY, user.id);
  return { ok: true, user: publicUser(user) };
}

export function logOut() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateProfile(userId, draft) {
  const user = getUser(userId);
  if (!user) return { ok: false, error: "Log in again to update your profile." };
  const major = String(draft.major || "").trim().replace(/\s+/g, " ");
  if (major.length < 2 || major.length > 80) {
    return { ok: false, error: "Add your major." };
  }
  if (!draft.courses?.length) {
    return { ok: false, error: "Add at least one course section." };
  }

  const courses = [];
  const seen = new Set();
  for (const course of draft.courses) {
    const catalog = CATALOG.find((entry) => entry.id === course.catalogId);
    if (!catalog) return { ok: false, error: "Choose a section from this term's list." };
    if (seen.has(catalog.id)) return { ok: false, error: "You already added that section." };
    seen.add(catalog.id);
    const topics = [];
    for (const topic of course.topics || []) {
      const clean = String(topic || "").trim().replace(/\s+/g, " ");
      if (!clean || clean.length > 40) {
        return { ok: false, error: "Topics need to be 40 characters or fewer." };
      }
      if (!topics.some((item) => item.toLowerCase() === clean.toLowerCase())) topics.push(clean);
    }
    if (!topics.length) {
      return { ok: false, error: `Pick at least one syllabus topic for ${catalog.code}.` };
    }
    courses.push({
      id: course.id || crypto.randomUUID(),
      catalogId: catalog.id,
      code: catalog.code,
      section: catalog.section,
      instructor: catalog.instructor,
      topics,
    });
  }

  if (!draft.availability?.length) {
    return { ok: false, error: "Add at least one time you are free." };
  }
  const availability = [];
  for (const block of draft.availability) {
    if (!DAYS.includes(block.day) || !block.start || !block.end || block.start >= block.end) {
      return { ok: false, error: "Check your free times. The end must be after the start." };
    }
    availability.push({
      id: block.id || crypto.randomUUID(),
      day: block.day,
      start: block.start,
      end: block.end,
    });
  }

  user.major = major;
  user.courses = courses;
  user.availability = sortAvailability(availability);
  persist();
  return { ok: true, user: publicUser(user) };
}

export function searchClassmates(viewerId, { enrollmentId, topic = "" }) {
  const viewer = getUser(viewerId);
  const viewerCourse = viewer?.courses.find((course) => course.id === enrollmentId);
  if (!viewer || !viewerCourse) return { error: "not-enrolled", results: [], course: null };
  const topicNorm = topic.trim().toLowerCase();
  const results = state.users
    .filter((user) => user.id !== viewerId)
    .map((user) => {
      const course = user.courses.find(
        (entry) => entry.code === viewerCourse.code && entry.section === viewerCourse.section,
      );
      if (!course) return null;
      if (topicNorm && !course.topics.some((item) => item.toLowerCase() === topicNorm)) return null;
      return {
        user: publicUser(user),
        course,
        overlap: sharedAvailability(viewer.availability, user.availability),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        b.overlap.length - a.overlap.length || a.user.name.localeCompare(b.user.name),
    );
  return { error: null, results, course: viewerCourse };
}

export function topicOptions(userId, enrollmentId) {
  const viewer = getUser(userId);
  const viewerCourse = viewer?.courses.find((course) => course.id === enrollmentId);
  if (!viewerCourse) return [];
  const topics = new Set(viewerCourse.topics);
  for (const user of state.users) {
    if (user.id === userId) continue;
    const match = user.courses.find(
      (course) => course.code === viewerCourse.code && course.section === viewerCourse.section,
    );
    match?.topics.forEach((topic) => topics.add(topic));
  }
  return [...topics].sort((a, b) => a.localeCompare(b));
}

function presentGroup(group) {
  return {
    ...group,
    host: publicUser(getUser(group.hostId)),
    members: group.memberIds.map((id) => publicUser(getUser(id))).filter(Boolean),
  };
}

export function groupsForUser(userId) {
  const user = getUser(userId);
  if (!user) return [];
  return state.groups
    .filter((group) =>
      user.courses.some(
        (course) => course.code === group.courseCode && course.section === group.section,
      ),
    )
    .map(presentGroup)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
}

export function createGroup(userId, draft) {
  const user = getUser(userId);
  const course = user?.courses.find((entry) => entry.id === draft.courseId);
  if (!course) return { ok: false, error: "Choose one of your course sections." };
  const topic = String(draft.topic || "").trim().replace(/\s+/g, " ");
  const location = String(draft.location || "").trim().replace(/\s+/g, " ");
  if (!topic || topic.length > 80) return { ok: false, error: "Add the topic you will study." };
  if (!draft.date) return { ok: false, error: "Choose a date." };
  if (draft.date < todayISO()) return { ok: false, error: "Choose today or a future date." };
  if (!draft.start || !draft.end || draft.start >= draft.end) {
    return { ok: false, error: "The end time has to be after the start time." };
  }
  if (!location || location.length > 80) return { ok: false, error: "Add a campus location." };
  const group = {
    id: crypto.randomUUID(),
    courseCode: course.code,
    section: course.section,
    instructor: course.instructor,
    topic,
    date: draft.date,
    start: draft.start,
    end: draft.end,
    location,
    hostId: userId,
    memberIds: [userId],
  };
  state.groups.push(group);
  persist();
  return { ok: true, group: presentGroup(group) };
}

function enrolledInGroup(user, group) {
  return user.courses.some(
    (course) => course.code === group.courseCode && course.section === group.section,
  );
}

export function joinGroup(userId, groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  const user = getUser(userId);
  if (!group || !user) return { ok: false, error: "That session is no longer listed." };
  if (group.date < todayISO()) return { ok: false, error: "That session has already passed." };
  if (!enrolledInGroup(user, group)) {
    return { ok: false, error: "Only students in this section can join." };
  }
  if (!group.memberIds.includes(userId)) group.memberIds.push(userId);
  const invite = state.invites.find(
    (entry) => entry.groupId === groupId && entry.toId === userId && entry.status === "pending",
  );
  if (invite) invite.status = "accepted";
  const alerts = remindIfSoon(userId, group);
  persist();
  return { ok: true, group: presentGroup(group), alerts };
}

export function leaveGroup(userId, groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group) return { ok: false, error: "That session is no longer listed." };
  if (group.hostId === userId) {
    return { ok: false, error: "Hosts cancel the session instead of leaving it." };
  }
  group.memberIds = group.memberIds.filter((id) => id !== userId);
  persist();
  return { ok: true };
}

export function cancelGroup(userId, groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  if (!group || group.hostId !== userId) {
    return { ok: false, error: "Only the host can cancel this session." };
  }
  const host = getUser(userId);
  const alerts = [];
  for (const memberId of group.memberIds) {
    if (memberId === userId) continue;
    alerts.push(
      addAlert({
        userId: memberId,
        kind: "cancelled",
        groupId: group.id,
        title: "Session cancelled",
        body: `${host?.name || "The host"} cancelled ${group.topic} on ${formatLongDate(group.date)}.`,
      }),
    );
  }
  for (const invite of state.invites) {
    if (invite.groupId === groupId && invite.status === "pending") invite.status = "cancelled";
  }
  state.groups = state.groups.filter((entry) => entry.id !== groupId);
  persist();
  return { ok: true, alerts };
}

function addAlert({ userId, kind, groupId, inviteId = null, title, body }) {
  const alert = {
    id: crypto.randomUUID(),
    userId,
    kind,
    inviteId,
    groupId,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
    pushed: false,
  };
  state.alerts.push(alert);
  return alert;
}

function remindIfSoon(userId, group) {
  if (!group || group.date < todayISO() || group.date > dateFromToday(2)) return [];
  const exists = state.alerts.some(
    (alert) => alert.userId === userId && alert.kind === "reminder" && alert.groupId === group.id,
  );
  if (exists) return [];
  return [
    addAlert({
      userId,
      kind: "reminder",
      groupId: group.id,
      title: "Session reminder",
      body: `${group.topic} meets ${formatLongDate(group.date)}, ${formatClock(group.start)}–${formatClock(group.end)} at ${group.location}.`,
    }),
  ];
}

function presentAlert(alert) {
  const group = state.groups.find((entry) => entry.id === alert.groupId);
  const invite = alert.inviteId ? state.invites.find((entry) => entry.id === alert.inviteId) : null;
  return {
    ...alert,
    group: group ? presentGroup(group) : null,
    inviteStatus: invite?.status || null,
  };
}

export function listAlerts(userId) {
  return state.alerts
    .filter((alert) => alert.userId === userId)
    .map(presentAlert)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function unreadAlertCount(userId) {
  return state.alerts.filter((alert) => alert.userId === userId && !alert.read).length;
}

export function markAlertsRead(userId) {
  let changed = false;
  for (const alert of state.alerts) {
    if (alert.userId === userId && !alert.read) {
      alert.read = true;
      changed = true;
    }
  }
  if (changed) persist();
  return changed;
}

export function peekUnpushed(userId) {
  return state.alerts
    .filter((alert) => alert.userId === userId && !alert.pushed)
    .map((alert) => ({ id: alert.id, title: alert.title, body: alert.body }));
}

export function markPushed(ids) {
  let changed = false;
  for (const id of ids) {
    const alert = state.alerts.find((entry) => entry.id === id);
    if (alert && !alert.pushed) {
      alert.pushed = true;
      changed = true;
    }
  }
  if (changed) persist();
}

export function inviteCandidates(userId, groupId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  const user = getUser(userId);
  if (!group || !user || !group.memberIds.includes(userId)) return [];
  return state.users
    .filter((other) => other.id !== userId && !group.memberIds.includes(other.id) && enrolledInGroup(other, group))
    .map((other) => ({
      user: publicUser(other),
      pending: state.invites.some(
        (invite) => invite.groupId === groupId && invite.toId === other.id && invite.status === "pending",
      ),
    }))
    .sort((a, b) => a.user.name.localeCompare(b.user.name));
}

export function inviteToGroup(fromId, groupId, toId) {
  const group = state.groups.find((entry) => entry.id === groupId);
  const from = getUser(fromId);
  const to = getUser(toId);
  if (!group || !from || !to) return { ok: false, error: "That session is no longer listed." };
  if (!group.memberIds.includes(fromId)) {
    return { ok: false, error: "Join the session before you invite someone." };
  }
  if (group.date < todayISO()) return { ok: false, error: "That session has already passed." };
  if (group.memberIds.includes(toId)) return { ok: false, error: "They are already in this session." };
  if (!enrolledInGroup(to, group)) {
    return { ok: false, error: "Only students in this section can be invited." };
  }
  const existing = state.invites.find(
    (invite) => invite.groupId === groupId && invite.toId === toId && invite.status === "pending",
  );
  if (existing) return { ok: false, error: "They already have an invite to this session." };
  const invite = {
    id: crypto.randomUUID(),
    groupId,
    fromId,
    toId,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  state.invites.push(invite);
  const alert = addAlert({
    userId: toId,
    kind: "invite",
    inviteId: invite.id,
    groupId,
    title: "Study session invite",
    body: `${from.name} invited you to ${group.topic}, ${formatLongDate(group.date)}, ${formatClock(group.start)}–${formatClock(group.end)} at ${group.location}.`,
  });
  persist();
  return { ok: true, invite, alert };
}

export function respondToInvite(userId, inviteId, accept) {
  const invite = state.invites.find((entry) => entry.id === inviteId && entry.toId === userId);
  if (!invite || invite.status !== "pending") return { ok: false, error: "That invite is no longer open." };
  if (!accept) {
    invite.status = "declined";
    persist();
    return { ok: true, alerts: [] };
  }
  const joined = joinGroup(userId, invite.groupId);
  if (!joined.ok) return joined;
  const user = getUser(userId);
  const group = state.groups.find((entry) => entry.id === invite.groupId);
  const hostAlert = addAlert({
    userId: invite.fromId,
    kind: "accepted",
    groupId: group.id,
    title: "Invite accepted",
    body: `${user.name} joined ${group.topic}.`,
  });
  persist();
  return { ok: true, alerts: [...(joined.alerts || []), hostAlert] };
}

export function ensureReminders(userId) {
  const created = [];
  for (const group of state.groups) {
    if (!group.memberIds.includes(userId)) continue;
    created.push(...remindIfSoon(userId, group));
  }
  if (created.length) persist();
  return created;
}

function icsEscape(value) {
  return String(value).replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function sessionsToIcs(groups) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const events = groups.filter(Boolean).map((group) => {
    const start = `${group.date.replace(/-/g, "")}T${group.start.replace(":", "")}00`;
    const end = `${group.date.replace(/-/g, "")}T${group.end.replace(":", "")}00`;
    return [
      "BEGIN:VEVENT",
      `UID:${group.id}@lecturepals.local`,
      `DTSTAMP:${stamp}`,
      `DTSTART:${start}`,
      `DTEND:${end}`,
      `SUMMARY:${icsEscape(`${group.courseCode} ${group.topic}`)}`,
      `LOCATION:${icsEscape(group.location)}`,
      `DESCRIPTION:${icsEscape(`${group.section}. ${group.instructor}.`)}`,
      "END:VEVENT",
    ].join("\r\n");
  });
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//LecturePals//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR"].join(
    "\r\n",
  );
}

export function sharesSection(userId, otherId) {
  const user = getUser(userId);
  const other = getUser(otherId);
  if (!user || !other || userId === otherId) return false;
  return user.courses.some((course) =>
    other.courses.some(
      (entry) => entry.code === course.code && entry.section === course.section,
    ),
  );
}

export function canMessage(userId, otherId) {
  return sharesSection(userId, otherId);
}

function conversationMessages(conversationId) {
  return state.messages
    .filter((message) => message.conversationId === conversationId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function presentConversation(conversation, userId) {
  const otherId = conversation.participantIds.find((id) => id !== userId);
  const messages = conversationMessages(conversation.id);
  const lastRead = conversation.lastRead?.[userId];
  const unread = messages.filter(
    (message) => message.senderId !== userId && (!lastRead || message.createdAt > lastRead),
  ).length;
  return {
    id: conversation.id,
    participantIds: [...conversation.participantIds],
    other: publicUser(getUser(otherId)),
    messages,
    lastMessage: messages.at(-1) || null,
    unread,
  };
}

export function listConversations(userId) {
  return state.conversations
    .filter((conversation) => conversation.participantIds.includes(userId))
    .map((conversation) => presentConversation(conversation, userId))
    .sort((a, b) => (b.lastMessage?.createdAt || "").localeCompare(a.lastMessage?.createdAt || ""));
}

export function getConversation(userId, conversationId) {
  const conversation = state.conversations.find(
    (entry) => entry.id === conversationId && entry.participantIds.includes(userId),
  );
  if (!conversation) return null;
  return presentConversation(conversation, userId);
}

export function unreadCount(userId) {
  return listConversations(userId).reduce((sum, conversation) => sum + conversation.unread, 0);
}

export function openConversation(userId, otherId) {
  if (!canMessage(userId, otherId)) {
    return {
      ok: false,
      error: "You can message classmates who share a course section with you.",
    };
  }
  let conversation = state.conversations.find(
    (entry) => entry.participantIds.includes(userId) && entry.participantIds.includes(otherId),
  );
  if (!conversation) {
    conversation = {
      id: crypto.randomUUID(),
      participantIds: [userId, otherId],
      lastRead: {},
    };
    state.conversations.push(conversation);
    persist();
  }
  return { ok: true, conversation: presentConversation(conversation, userId) };
}

export function markRead(userId, conversationId) {
  const conversation = state.conversations.find(
    (entry) => entry.id === conversationId && entry.participantIds.includes(userId),
  );
  if (!conversation) return false;
  const incoming = conversationMessages(conversationId).filter((message) => message.senderId !== userId);
  const latest = incoming.at(-1);
  if (!latest) return false;
  if (conversation.lastRead?.[userId] >= latest.createdAt) return false;
  conversation.lastRead = { ...conversation.lastRead, [userId]: latest.createdAt };
  persist();
  return true;
}

export function sendMessage(userId, conversationId, body) {
  const text = String(body || "").trim();
  if (!text) return { ok: false, error: "Write a message first." };
  if (text.length > 1000) return { ok: false, error: "Keep messages under 1000 characters." };
  const conversation = state.conversations.find(
    (entry) => entry.id === conversationId && entry.participantIds.includes(userId),
  );
  if (!conversation) return { ok: false, error: "That conversation is unavailable." };
  const otherId = conversation.participantIds.find((id) => id !== userId);
  if (!canMessage(userId, otherId)) {
    return {
      ok: false,
      error: "You can message classmates who share a course section with you.",
    };
  }
  const message = {
    id: crypto.randomUUID(),
    conversationId,
    senderId: userId,
    body: text,
    createdAt: new Date().toISOString(),
  };
  state.messages.push(message);
  conversation.lastRead = { ...conversation.lastRead, [userId]: message.createdAt };
  persist();
  return { ok: true, message };
}

export function dashboard(userId) {
  const user = getUser(userId);
  if (!user) return { upcoming: [], open: [], sections: [] };
  const today = todayISO();
  const groups = groupsForUser(userId);
  return {
    upcoming: groups.filter((group) => group.memberIds.includes(userId) && group.date >= today),
    open: groups.filter((group) => !group.memberIds.includes(userId) && group.date >= today),
    sections: publicUser(user).courses.map((course) => ({
      course,
      classmates: searchClassmates(userId, { enrollmentId: course.id }).results.length,
    })),
  };
}
