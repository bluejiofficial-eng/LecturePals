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

  assert.equal(store.isUniversityEmail("maya.chen@stateu.edu"), true);
  assert.equal(store.isUniversityEmail("maya.chen@gmail.com"), false);
  assert.equal(store.isUniversityEmail("maya.chen@edu.com"), false);

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
    email: "pat.lee@college.edu",
    password: "password1",
  });
  assert.equal(createdUser.ok, true);
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
});
