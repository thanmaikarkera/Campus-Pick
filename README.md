# Campus Pick

A lost-and-found web app for a college campus. Students report items they've lost or found, the app
suggests likely matches, and each item is tracked until it's back with its owner.

## Features

- **Accounts:** register and log in; report pages and "My Reports" are only open to signed-in users
- **Report lost or found items** with a category, colour, brand, location, date, description and a photo
- **Automatic match suggestions:** every lost item is compared with every found item, and pairs scoring 60 or more out of 100 are suggested
- **Status tracking:** confirm a suggested match, verify it, then mark the item returned (Lost / Found → Matched → Verified → Returned)
- **My Reports:** see your own reports and where each one stands
- **Admin dashboard:** only accounts with the admin role can open it; admins see every report and can remove them

## How matching works

`calculateMatchScore()` gives each lost/found pair a score out of 100:

| Field | Points | How it's compared |
|---|---|---|
| Item name | 25 | word similarity |
| Category | 15 | exact match |
| Colour | 15 | word similarity |
| Location | 15 | similarity |
| Brand | 10 | word similarity |
| Date | 10 | how close the dates are |
| Description | 10 | word similarity |

Colour and brand are stored as separate fields instead of being buried in the description,
which makes matches more accurate.

## Built with

HTML, CSS and plain JavaScript · Supabase (authentication, Postgres database, photo storage)

## Pages

| Page | Purpose |
|---|---|
| `index.html` | Home page |
| `register.html`, `login.html` | Sign up and sign in |
| `dashboard.html` | Open reports, suggested matches and status buttons |
| `report-lost.html`, `report-found.html` | Report forms with photo upload |
| `my-reports.html` | Your own reports and their status |
| `admin.html` | Admin dashboard: every report, with delete |
| `script.js` | App logic: reports, matching, status updates, auth checks |
| `supabase.js` | Supabase client (URL and publishable key) |

## Status

A learning project: I built it to understand how a front end, authentication and a database fit together.
Next up: a database schema file in the repo and a live deployment.
