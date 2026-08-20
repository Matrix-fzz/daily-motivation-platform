# Daily Motivation Platform

A single-page web application for daily motivation with goal tracking, motivational quotes, trending articles, and an inspiration media gallery.

## Features

- **Quote of the Day** — Fetches random advice from Advice Slip API
- **Goal Tracker** — Add, edit, delete objectives with progress sliders (0–100%)
- **Trash/Restore System** — Deleted goals go to a recoverable trash bin (auto-clears after 15s)
- **Overall Progress Bar** — Aggregated completion percentage across all goals
- **Trending Articles** — Motivation-related article cards with skeleton loading
- **Inspiration Station** — Media grid with category filters (Videos, Podcasts, Quotes, etc.)
- **Dark Mode UI** — Gradient background with animated radial glow and card hover effects

## Technologies

| Technology | Usage |
|------------|-------|
| HTML5 | Page structure |
| CSS3 | CSS variables, Grid, Flexbox, animations, backdrop-filter, media queries |
| JavaScript (ES6+) | async/await, classes, arrow functions, template literals |
| Google Fonts (Montserrat) | Typography |

## External APIs

- [Advice Slip API](https://api.adviceslip.com/advice) — Random motivational quotes
- Google Fonts CDN — Montserrat font family

## Data Persistence

All objectives and trash data are stored in `localStorage`:
- `motivation_platform_goals` — Active goals
- `motivation_platform_trash` — Recently deleted items

## How to Use

Open `index.html` in any modern browser. No build tools or server required.
