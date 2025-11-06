# Airshow Safety Database (5M)

An open, interactive, GitHub-ready repository of airshow accidents (1908–2025), aligned to the **5M framework** (Man, Machine, Medium, Mission, Management). It provides search, filters, and charts including **BAAR, AFR, ACR** safety indicators (per 10,000 events).

👉 **Live (GitHub Pages)**: After you upload this repository to GitHub, enable **Pages** in Settings and select the root (or `/docs`) as the source. Then visit your Pages URL to use the dashboard.

## What's inside

- `index.html` – Dashboard UI with search, filters, and charts
- `src/js/app.js` – Client-side code (no backend needed)
- `src/css/style.css` – Minimal styling (responsive)
- `data/airshow_accidents_1908-2025.csv` – Cleaned dataset
- `data/airshow_accidents.json` – Same data in JSON for the UI
- `data/annual_statistics.csv` & `data/annual_statistics.json` – Accidents, fatalities, casualties per year, and BAAR/AFR/ACR where event counts are available (2022–2024)
- `Airshow_Accidents_Cleaned_2025.xlsx` – Clean Excel with standardized fields and 5M factors

## 5M Framework Mapping (how we tagged each accident)

- **Man (Human):** Pilot error, loss of control (LOC), flight into terrain (FIT), pilot incapacitation.
- **Machine (Equipment):** Mechanical or structural failures.
- **Medium (Environment):** Environmental/weather/bird-strike/obstacle impacts.
- **Mission (Task/Profile):** Mid-air collisions (MAC), formation team displays, air races, aerobatic competitions, flypasts/demos, flight tests.
- **Management (Organization):** Heuristically identified via `contributing_factor`/`remarks` text for issues like inadequate briefing/oversight/regulation/planning/ARFF/procedure.

> Multiple 5M tags can apply to one accident.

## Safety Indicators

- **BAAR** – Barker Airshow Accident Rate (accidents per 10,000 events)
- **AFR** – Airshow Fatality Rate (fatalities per 10,000 events)
- **ACR** – Airshow Casualty Rate (fatalities + injuries per 10,000 events)

This repository includes **event counts** for **2022–2024** (from Milavia-based compilations in the 2024 indicators workbook), so rates are computed for those years. For other years, event counts are not in this package; the dashboard displays `N/A` for rates where events are unavailable.

## Data Dictionary (selected fields)

- `date` (YYYY-MM-DD), `year`
- `aircraft_type`, `category`, `manoeuvre`
- Cause flags: `fit`, `mac`, `loc`, `fio`, `enviro`, `mechanical`, `structural`, `incapacitation`, `weather`, `bird_strike`, `obstacle`
- Event flags: `airshow`, `practice`, `air_race`, `aero_comp`, `flight_test`, `demo`, `flypast`, `race_practice`, `demo_prac`, `flypast_prac`, `formation_team`, `drone_show`, `military`, `civilian`
- Casualties: `pilot_killed`, `pilot_injured`, `crew_kill`, `crew_inj`, `pax_kill`, `pax_inj`, `spec_kill`, `spec_inj`, `pub_kill`, `pub_inj`, `para_killed`, `para_inj`, plus totals `fatalities`, `casualties`
- Context: `event_name`, `location`, `country`, `remarks`, `contributing_factor`
- 5M tags: `man_factor`, `machine_factor`, `medium_factor`, `mission_factor`, `management_factor` (0/1)

## How to use on GitHub

1. Create a **new public repository** on GitHub (e.g., `airshow-safety-database`).
2. Upload all files/folders from this package to the repo (preserve structure).
3. In **Settings → Pages**, set the source to the root (or `/docs`) and save.
4. Open the Pages URL – the dashboard will load and run entirely in the browser.

## Local use

Open `index.html` in a browser. (For some browsers, you may need a simple local server.)

## Privacy

All personal identifiers have been excluded. The database focuses on *what happened* and *why* (factors), not *who*.

## Credits & References

- Des Barker – multi-decade annual airshow safety reports and taxonomy; definitions of BAAR/AFR/ACR.
- Aviation Safety Network & Flight Safety Foundation – inspiration for public safety dashboards and analytics.

## License

- Code: MIT
- Data: CC BY 4.0 (please attribute “Airshow Safety Database (5M), compiled from historical airshow reports”).

