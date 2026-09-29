# LecturePals

LecturePals matches university students who share a course section and a syllabus topic. Study help stays with people who have the same instructor, the same meeting time, and the same material.

Built for IS 3103 (TTH 10:00 AM – 12:00 PM) by Aguinaldo, Direl Christian P., Balili, Cleford C., and Subang, Sebastian Douglas.

## Main features

- **Campus sign-in.** Sign up and log in with a university email that ends in `.edu`.
- **Profiles.** Save a major, enrolled course sections, syllabus topics, and weekly free times.
- **Search and filter.** Find classmates in your exact section, then narrow by syllabus topic. Other sections of the same course stay hidden.
- **Study sessions.** Post a topic, date, time, and campus location. Only students in that section can discover and join.
- **Direct messages.** Message classmates who share a section and coordinate a session.

Accounts, profiles, sessions, and messages are stored in this browser so the class demo runs without a server. Passwords are salted and hashed before they are saved. A production version would move that store to a server.

Calendar sync, push notifications, and email alerts are not in this version.

## Demo account

- Email: `avery.quinn@stateu.edu`
- Password: `pals2026`

Avery is already enrolled in IS 3103 (TTH 10:00 AM – 12:00 PM) and CS 2201, with classmates, open sessions, and one unread message.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open the URL Vite prints (http://localhost:5173). `npm run build` writes a static site to `dist/`.
