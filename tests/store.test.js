import assert from "node:assert/strict";
import { test } from "node:test";

const memory = new Map();
globalThis.localStorage = {
  getItem(key) {
    return memory.has(key) ? memory.get(key) : null;
  },
  setItem(key, value) {
    memory.set(key, String(value));
  },
  removeItem(key) {
    memory.delete(key);
  },
};

const store = await import("../src/store.js");

test("campus accounts, section search, sessions, and messages", async () => {
  await store.resetDemo();

  assert.equal(store.isUniversityEmail("maya.chen@stateu.edu"), false);
  assert.equal(store.isUniversityEmail("25104148@usc.edu.ph"), true);
  assert.equal(store.isUniversityEmail("MAYA.CHEN@SCHOOL.EDU.PH"), true);
  assert.equal(store.isUniversityEmail("maya.chen@gmail.com"), false);
  assert.equal(store.isUniversityEmail("maya.chen@usc.edu"), false);
  assert.equal(store.isUniversityEmail("maya.chen@edu.com"), false);
  assert.equal(store.isUniversityEmail("maya.chen@school.ph"), false);

  const badDomain = await store.logIn({ email: "avery.quinn@gmail.com", password: "whatever1" });
  assert.equal(badDomain.ok, false);

  const wrong = await store.logIn({ email: store.DEMO_EMAIL, password: "not-the-password" });
  assert.equal(wrong.ok, false);

  const login = await store.logIn({ email: store.DEMO_EMAIL, password: store.DEMO_PASSWORD });
  assert.equal(login.ok, true);
  assert.equal(store.getCurrentUser().name, "Avery Quinn");
  assert.equal(store.isProfileComplete(store.getCurrentUser()), true);

  const normalization = store.searchClassmates("user-avery", {
    enrollmentId: "course-avery-is",
    topic: "Normalization",
  });
  assert.deepEqual(
    normalization.results.map((result) => result.user.name),
    ["Maya Chen", "Luis Ortega"],
  );

  const section = store.searchClassmates("user-avery", { enrollmentId: "course-avery-is", topic: "" });
  assert.equal(section.results.length, 4);
  assert.equal(section.results.some((result) => result.user.name === "Sam Okonkwo"), false);
  assert.equal(section.results.some((result) => result.user.name === "Remy Diaz"), false);

  const trees = store.searchClassmates("user-avery", { enrollmentId: "course-avery-cs", topic: "Trees" });
  assert.deepEqual(
    trees.results.map((result) => result.user.name),
    ["Jordan Hale"],
  );

  assert.equal(store.unreadCount("user-avery"), 1);
  assert.equal(store.markRead("user-avery", "convo-priya"), true);
  assert.equal(store.unreadCount("user-avery"), 0);

  assert.equal(store.canMessage("user-avery", "user-maya"), true);
  assert.equal(store.canMessage("user-avery", "user-sam"), false);
  assert.equal(store.openConversation("user-avery", "user-sam").ok, false);
  assert.equal(store.joinGroup("user-sam", "group-norm").ok, false);

  const created = store.createGroup("user-avery", {
    courseId: "course-avery-is",
    topic: "Transactions",
    date: store.todayISO(),
    start: "18:00",
    end: "19:00",
    location: "Campus Quad",
  });
  assert.equal(created.ok, true);
  assert.equal(store.joinGroup("user-luis", created.group.id).ok, true);
  assert.equal(store.joinGroup("user-sam", created.group.id).ok, false);
  assert.equal(store.cancelGroup("user-luis", created.group.id).ok, false);
  assert.equal(store.cancelGroup("user-avery", created.group.id).ok, true);

  const past = store.createGroup("user-avery", {
    courseId: "course-avery-is",
    topic: "SQL Joins",
    date: "2020-01-01",
    start: "10:00",
    end: "11:00",
    location: "Main Library, Room 214",
  });
  assert.equal(past.ok, false);

  const gmail = await store.signUp({ name: "Pat Lee", email: "pat@gmail.com", password: "password1" });
  assert.equal(gmail.ok, false);

  const createdUser = await store.signUp({
    name: "Pat Lee",
    email: "pat.lee@college.edu.ph",
    password: "password1",
  });
  assert.equal(createdUser.ok, true);

  const filipinoCampusUser = await store.signUp({
    name: "Jamie Cruz",
    email: "25104148@usc.edu.ph",
    password: "password1",
  });
  assert.equal(filipinoCampusUser.ok, true);
  store.logOut();
  const filipinoCampusLogin = await store.logIn({ email: "25104148@usc.edu.ph", password: "password1" });
  assert.equal(filipinoCampusLogin.ok, true);
  assert.equal(filipinoCampusLogin.user.email, "25104148@usc.edu.ph");

  assert.equal(store.isProfileComplete(createdUser.user), false);
  assert.equal(
    store.updateProfile(createdUser.user.id, { major: "Art", courses: [], availability: [] }).ok,
    false,
  );

  const saved = store.updateProfile(createdUser.user.id, {
    major: "Art History",
    courses: [{ catalogId: "is3103-tth", topics: ["SQL Joins"] }],
    availability: [{ day: "Thu", start: "13:00", end: "16:00" }],
  });
  assert.equal(saved.ok, true);
  const matches = store.searchClassmates(createdUser.user.id, {
    enrollmentId: saved.user.courses[0].id,
    topic: "SQL Joins",
  });
  assert.equal(matches.results.some((result) => result.user.name === "Maya Chen"), true);
  assert.equal(matches.results.some((result) => result.user.name === "Sam Okonkwo"), false);

  const convo = store.openConversation(createdUser.user.id, "user-maya");
  assert.equal(convo.ok, true);
  const sent = store.sendMessage(createdUser.user.id, convo.conversation.id, "Can we review joins?");
  assert.equal(sent.ok, true);
  assert.equal(store.sendMessage(createdUser.user.id, convo.conversation.id, "   ").ok, false);

  assert.equal(store.createGroupConversation("user-avery", ["user-maya"], "Study crew").ok, false);
  const groupChat = store.createGroupConversation("user-avery", ["user-maya", "user-luis"], "  IS 3103   Crew  ");
  assert.equal(groupChat.ok, true);
  assert.equal(groupChat.conversation.isGroup, true);
  assert.equal(groupChat.conversation.name, "IS 3103 Crew");
  assert.deepEqual(groupChat.conversation.participantIds, ["user-avery", "user-maya", "user-luis"]);
  assert.equal(store.openConversation("user-avery", "user-maya").conversation.id, "convo-maya");
  const groupMessage = store.sendMessage("user-maya", groupChat.conversation.id, "Let's review together.");
  assert.equal(groupMessage.ok, true);
  assert.equal(store.getConversation("user-luis", groupChat.conversation.id).messages.at(-1).senderName, "Maya Chen");
  assert.equal(store.renameConversation("user-luis", groupChat.conversation.id, "SQL Study Team").ok, true);
  const renamedChat = store.getConversation("user-avery", groupChat.conversation.id);
  assert.equal(renamedChat.name, "SQL Study Team");
  assert.equal(renamedChat.messages.at(-1).type, "system");
  assert.match(renamedChat.messages.at(-1).body, /Luis Ortega changed the group name to “SQL Study Team”/);
  assert.equal(store.renameConversation("user-avery", "convo-maya", "Renamed direct").ok, false);
  assert.equal(store.leaveConversation("user-maya", groupChat.conversation.id).ok, true);
  const afterLeave = store.getConversation("user-avery", groupChat.conversation.id);
  assert.equal(afterLeave.isGroup, true);
  assert.equal(afterLeave.name, "SQL Study Team");
  assert.deepEqual(afterLeave.participantIds, ["user-avery", "user-luis"]);
  assert.equal(afterLeave.messages.at(-1).type, "system");
  assert.match(afterLeave.messages.at(-1).body, /Maya Chen left the group/);
  assert.equal(store.getConversation("user-maya", groupChat.conversation.id), null);
  assert.equal(store.sendMessage("user-maya", groupChat.conversation.id, "Still here?").ok, false);

  assert.equal(store.inviteToGroup("user-maya", "group-norm", "user-avery").ok, false);
  assert.equal(store.inviteToGroup("user-maya", "group-norm", "user-sam").ok, false);
  const luisInvite = store.inviteToGroup("user-priya", "group-norm", "user-luis");
  assert.equal(luisInvite.ok, true);
  assert.equal(store.listAlerts("user-luis").some((alert) => alert.kind === "invite"), true);

  const accepted = store.respondToInvite("user-avery", "invite-norm", true);
  assert.equal(accepted.ok, true);
  const norm = store.groupsForUser("user-avery").find((group) => group.id === "group-norm");
  assert.equal(norm.memberIds.includes("user-avery"), true);
  assert.equal(store.respondToInvite("user-avery", "invite-norm", true).ok, false);

  const reminders = store.ensureReminders("user-avery");
  assert.equal(reminders.length, 0);
  const ics = store.sessionsToIcs([norm]);
  assert.match(ics, /BEGIN:VCALENDAR/);
  assert.match(ics, /Normalization/);
  assert.match(ics, /Main Library\\, Room 214/);

  const savedAveryProfile = store.updateProfile("user-avery", {
    major: "Information Systems",
    courses: [
      { id: "course-avery-is", catalogId: "is3103-tth", topics: ["Normalization", "SQL Joins", "ER Diagrams"] },
      { id: "course-avery-cs", catalogId: "cs2201-mwf", topics: ["Trees", "Hash Tables"] },
    ],
    availability: [
      {
        id: "test-availability",
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          new Date(`${norm.date}T00:00:00`).getDay()
        ],
        start: "15:00",
        end: "17:00",
      },
    ],
  });
  assert.equal(savedAveryProfile.ok, true);

  const isSessions = store.filterGroupsForUser("user-avery", { courseId: "course-avery-is" });
  assert.deepEqual(isSessions.map((group) => group.id), ["group-norm", "group-er"]);
  const latest = store.filterGroupsForUser("user-avery", {
    courseId: "course-avery-is",
    sortOrder: "latest",
  });
  assert.equal(latest[0].id, "group-er");

  const matchingAvailability = store.filterGroupsForUser("user-avery", {
    courseId: "course-avery-is",
    topic: "normalization",
    fromDate: norm.date,
    throughDate: norm.date,
    availabilityOnly: true,
  });
  assert.deepEqual(matchingAvailability.map((group) => group.id), ["group-norm"]);

  const unavailableProfile = store.updateProfile("user-avery", {
    major: "Information Systems",
    courses: [
      { id: "course-avery-is", catalogId: "is3103-tth", topics: ["Normalization", "SQL Joins", "ER Diagrams"] },
      { id: "course-avery-cs", catalogId: "cs2201-mwf", topics: ["Trees", "Hash Tables"] },
    ],
    availability: [
      {
        id: "test-availability",
        day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][
          new Date(`${norm.date}T00:00:00`).getDay()
        ],
        start: "17:00",
        end: "18:00",
      },
    ],
  });
  assert.equal(unavailableProfile.ok, true);

  const unavailable = store.filterGroupsForUser("user-avery", {
    courseId: "course-avery-is",
    fromDate: norm.date,
    throughDate: norm.date,
    availabilityOnly: true,
  });
  assert.deepEqual(unavailable, []);
});
