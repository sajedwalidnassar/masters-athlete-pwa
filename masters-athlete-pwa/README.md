# Masters Athlete · iOS PWA

A 6-day joint-preserving training program for the masters athlete (40+), packaged as an installable iOS PWA. 4 lifting days + 2 cardio/mobility days + 1 rest day, with built-in tempo timer, RPE selector, and an EMOM clock for Friday's MetCon finisher.

The progression rule is faithful to the program: hit the top of the rep range at the prescribed RPE for **two sessions in a row**, then add 2.5–5 lb. The app tracks this automatically.

---

## What's in the app

- **7 days of training** — Monday Push, Tuesday Squat, Wednesday Zone 2, Thursday Pull, Friday Hinge + MetCon, Saturday long Zone 2, Sunday rest. Tap any day to start that session.
- **Per-exercise form cues** pulled verbatim from the program (e.g. "Bar travels close — almost dragging the legs" for the RDL).
- **Tempo timer** — tap the tempo pill (e.g. `3-1-1-0`) and a full-screen pacer flashes DOWN → PAUSE → UP → TOP at the prescribed durations.
- **RPE selector** — every set logs weight, reps, AND RPE (6–10). The app uses RPE to decide if you've really earned a load bump.
- **EMOM clock** for Friday — full-screen minute timer that cycles through the 3 movements automatically.
- **Cardio/mobility checklists** — Wed and Sat show the Zone 2 protocol (duration, HR target, incline, speed) and check off the mobility flow.
- **Progress charts** — body weight and lifting volume as line charts, plus a recent-sessions feed.
- **Offline-first** — service worker caches everything after first load. Works at the gym with no signal.

---

## 1 · Prerequisites

Node.js 18 or newer. Check with `node -v`. If you need it, [nodejs.org](https://nodejs.org/) LTS installer is fine.

---

## 2 · Install + run locally

From inside this folder:

```bash
npm install
npm run build
npm run preview
```

Look for the **Network** address in the terminal output (something like `http://192.168.1.42:4173`). On your iPhone, open **Safari**, type that URL exactly, then Share → Add to Home Screen.

(Run `npm run dev` instead of build+preview if you want hot-reload while editing.)

---

## 3 · Deploy publicly (so you don't need your laptop running)

Same as the Home Strength app — Vercel is the easy path:

```bash
npm install -g vercel
vercel
```

Accept the defaults (project name, etc.). About a minute later you get a public `https://...vercel.app` URL. Open on iPhone → Safari → Share → Add to Home Screen. Done.

Subsequent updates: `vercel --prod`.

---

## 4 · Customizing the program

All exercises, rep ranges, tempos, RPE targets, and cues live in the `PROGRAM` constant near the top of `src/App.jsx`. Each day's structure:

```js
mon: {
  id: "mon",
  code: "M",
  name: "Push Upper",
  type: "lift",          // "lift" | "cardio" | "rest"
  exercises: [
    {
      id: "bench-press",
      name: "Barbell Bench Press",
      sets: 4,
      reps: "6–8",
      repRange: [6, 8],     // used by the level-up logic
      tempo: "3-0-1-0",
      rpe: "7–8",            // displayed
      rpeTargetMax: 8,       // used by level-up logic — load only goes up if RPE ≤ this
      equipment: "Bench + barbell",
      cues: [ "..." ],
      note: "Pin-safe heavy press.",
    },
    // ...
  ]
}
```

Cardio days take a `cardio` block (`duration`, `hr`, `incline`, `speed`, `cue`) and a `mobility` array. The rest day takes a `rest` block with `title`, `note`, and `checklist`.

Want a different protein multiplier? Change line ~711 (`Math.round(bodyWeight * 1)` → `* 0.9` for the lower end).

Want different rest timer durations? Search `RestTimer initial=` in `App.jsx` — currently 120s mid-session, 75s after the last set of an exercise.

---

## 5 · File layout

```
masters-athlete-pwa/
├── index.html                       # iOS PWA meta tags
├── package.json
├── vite.config.js                   # Vite + PWA plugin
├── public/
│   ├── icon-180.png                 # apple-touch-icon
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-512-maskable.png
│   └── favicon.ico
└── src/
    ├── main.jsx
    ├── App.jsx                      # the whole app (~2200 lines, single file)
    └── index.css                    # Tailwind + dark theme tweaks
```

---

## 6 · How data is stored

Plain `localStorage` on your device. No server, no account, no sync. Sessions, body weights, and habits all stay local. To back up, screenshot the Progress tab occasionally. Apple may evict PWA data after ~7 weeks of disuse — open the app every couple weeks to keep it.

---

## 7 · The big rules of the program (worth re-reading)

- Run this exact program for 6 weeks, then deload for 1 week (50% volume, 70% intensity), then rotate variations.
- Two consecutive sessions hitting the top of the rep range at the prescribed RPE = add 2.5–5 lb. The app's flame badge lights up when you've earned it.
- Sleep under 7 hours = take the next session at 80% intent.
- Protein target: 0.9–1.0 g per lb daily, spread across 4 meals.
- Warning signs that mean take an extra rest day: sharp joint pain (not muscle soreness), 3+ nights of disturbed sleep, resting HR 8+ bpm above baseline.

Train hard. Recover harder.
