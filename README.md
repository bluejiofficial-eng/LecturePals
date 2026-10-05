# LecturePals

LecturePals matches university students who share a course section and a syllabus topic. Study help stays with people who have the same instructor, the same meeting time, and the same material.

Built for IS 3103 (TTH 10:00 AM – 12:00 PM) by Aguinaldo, Direl Christian P., Balili, Cleford C., and Subang, Sebastian Douglas.

## Main features

- **Campus sign-in.** Sign up and log in with a university email that ends in `.edu`.
- **Profiles.** Save a major, enrolled course sections, syllabus topics, and weekly free times.
- **Search and filter.** Find classmates in your exact section, then narrow by syllabus topic. Other sections of the same course stay hidden.
- **Study sessions.** Post a topic, date, time, and campus location. Only students in that section can discover and join.
- **Direct messages.** Message classmates who share a section and coordinate a session.
- **Invites, email alerts, and reminders.** Invite a section classmate to a session. They get an alert at their university email, and a browser notification if they allow it. Upcoming sessions also send a reminder.
- **Calendar.** See the week and download a `.ics` file for the sessions you joined.

Accounts, profiles, sessions, messages, and alerts are stored in this browser so the class demo runs without a mail server. Email alerts are recorded instantly in Alerts and addressed to the student's `.edu` inbox. Passwords are salted and hashed before they are saved. A production version would send those alerts through university mail.

## Demo account

- Email: `avery.quinn@stateu.edu`
- Password: `pals2026`

Avery is already enrolled in IS 3103 (TTH 10:00 AM – 12:00 PM) and CS 2201, with classmates, open sessions, one unread message, a session invite, and a reminder.

## Run locally

```bash
npm install
npm test
npm run dev
```

Open the URL Vite prints (http://localhost:5173). `npm run build` writes a static site to `dist/`.
