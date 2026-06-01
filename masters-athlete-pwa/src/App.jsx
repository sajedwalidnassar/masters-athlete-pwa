import { useState, useEffect, useRef, useMemo } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Dumbbell, Activity, Timer, Check, ChevronRight, Plus, Minus, Pause, Play,
  X, TrendingUp, Home, Moon, Footprints, Beef, Lightbulb,
  Settings as SettingsIcon, ArrowRight, RotateCcw, ListChecks, Wrench,
  Heart, SkipForward, Trophy, Share, Flame, Wind, Zap, Coffee, Mountain,
  Gauge, ShieldCheck, Bed, Sparkles,
} from "lucide-react";

/* ============================================================
   STORAGE — plain localStorage (PWA-friendly)
   ============================================================ */
const storage = {
  get(key, fallback = null) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : fallback;
    } catch { return fallback; }
  },
  set(key, value) {
    try { window.localStorage.setItem(key, JSON.stringify(value)); return true; }
    catch { return false; }
  },
  clear(keys) {
    try { keys.forEach((k) => window.localStorage.removeItem(k)); return true; }
    catch { return false; }
  },
};

/* ============================================================
   DESIGN TOKENS — dark, clinical, masters-athlete
   ============================================================ */
const T = {
  bg: "#0A0F14",           // near-black with cool tint
  surface: "#111821",      // raised surface
  surfaceAlt: "#1A2230",   // input fields, inactive
  border: "#1F2937",
  text: "#E4E7EC",
  textDim: "#94A3B8",
  textFaint: "#64748B",
  accent: "#14B8A6",       // teal — primary
  accentDeep: "#0D9488",
  warn: "#F59E0B",         // amber for level-up
  danger: "#EF4444",
  success: "#22C55E",
  push: "#14B8A6",         // Monday
  squat: "#F59E0B",        // Tuesday
  pull: "#8B5CF6",         // Thursday
  hinge: "#EC4899",        // Friday
  cardio: "#3B82F6",       // Wed/Sat
  rest: "#64748B",         // Sunday
};

/* ============================================================
   PROGRAM DATA — pulled verbatim from the user's markdown plan
   ============================================================ */
const TEMPO_DECODE = "Eccentric · Bottom pause · Concentric · Top pause";

const decodeTempo = (t) => {
  const [e, bp, c, tp] = t.split("-").map((n) => parseInt(n, 10) || 0);
  return { e, bp, c, tp, total: e + bp + c + tp };
};

const PROGRAM = {
  mon: {
    id: "mon",
    code: "M",
    name: "Push Upper",
    focus: "Press, chest, triceps, rear delts",
    duration: "60–70 min",
    accent: T.push,
    icon: Dumbbell,
    type: "lift",
    exercises: [
      {
        id: "landmine-press", name: "Landmine Press (single-arm)",
        sets: 4, reps: "8 per side", repRange: [8, 8], tempo: "3-1-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Landmine + barbell",
        cues: [
          "Stagger stance, brace the core hard",
          "The arc protects the shoulder — drive through the heel of the working side",
          "Don't let the rib cage flare on the press",
          "Press up and slightly across midline",
        ],
        note: "Unilateral — the arc opens the glenohumeral joint.",
      },
      {
        id: "bench-press", name: "Barbell Bench Press",
        sets: 4, reps: "6–8", repRange: [6, 8], tempo: "3-0-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Bench + barbell, safety pins set at chest",
        cues: [
          "Safeties at chest level — non-negotiable solo",
          "Tuck elbows to ~60°, not flared",
          "Pause briefly at chest on the last set of each block",
          "Drive feet into floor, slight arch",
        ],
        note: "Pin-safe heavy press.",
      },
      {
        id: "sa-floor-press", name: "Single-Arm DB Floor Press",
        sets: 3, reps: "10–12 per side", repRange: [10, 12], tempo: "3-1-1-0", rpe: "7", rpeTargetMax: 7,
        equipment: "1 DB (50–55 lb)",
        cues: [
          "Floor stops the elbow before it overstretches",
          "Use the 50–55s — joint-friendly hypertrophy",
          "Press straight up over shoulder, not toward midline",
          "Brace the obliques — unilateral load wants to twist you",
        ],
        note: "Floor = built-in joint protection.",
      },
      {
        id: "cable-fly", name: "Cable Chest Fly (high-to-low)",
        sets: 3, reps: "12–15", repRange: [12, 15], tempo: "2-1-1-1", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Cable stack, high pulleys",
        cues: [
          "Slight forward lean — pectoral fibers run downward",
          "Squeeze 1 second at the bottom",
          "Constant tension = chest fiber recruiter",
          "Slight elbow bend held the whole rep",
        ],
        note: "Time under tension — the post-45 hypertrophy driver.",
      },
      {
        id: "ohp-tricep", name: "Zigzag Bar OH Tricep Extension",
        sets: 3, reps: "10–12", repRange: [10, 12], tempo: "3-0-1-0", rpe: "7", rpeTargetMax: 7,
        equipment: "EZ-curl bar / zigzag",
        cues: [
          "Seated or standing — keep ribs DOWN",
          "Elbows stay narrow, near your ears",
          "Angled grip saves the wrists and elbows under stretch",
          "Full stretch at the bottom, no flopping",
        ],
        note: "Stretched-position tricep work.",
      },
      {
        id: "tricep-pushdown", name: "Cable Triceps Rope Pushdown",
        sets: 3, reps: "12–15", repRange: [12, 15], tempo: "2-0-1-1", rpe: "8", rpeTargetMax: 8,
        equipment: "Cable + rope attachment",
        cues: [
          "Hold 1-second contraction at lockout",
          "Don't let elbows flare out — they hug the ribs",
          "Pull the rope apart at the bottom",
          "Stack ribs over hips",
        ],
        note: "End-range hold builds the lockout.",
      },
      {
        id: "face-pull", name: "Cable Face Pull",
        sets: 3, reps: "15–20", repRange: [15, 20], tempo: "2-1-1-1", rpe: "6", rpeTargetMax: 6,
        equipment: "Cable + rope, set above head",
        cues: [
          "NON-NEGOTIABLE for shoulder longevity",
          "Pull rope toward forehead, elbows high",
          "External rotation at end range — hands open OUT",
          "Light load, high reps, slow tempo",
        ],
        note: "The insurance policy on every press.",
      },
    ],
  },

  tue: {
    id: "tue",
    code: "T",
    name: "Squat Lower",
    focus: "Squat pattern, quads, glute medius, core",
    duration: "60–70 min",
    accent: T.squat,
    icon: Mountain,
    type: "lift",
    exercises: [
      {
        id: "back-squat", name: "Barbell Back Squat (high-bar)",
        sets: 4, reps: "6–8", repRange: [6, 8], tempo: "3-1-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Rack + barbell, safeties below depth",
        cues: [
          "Safeties just below your depth — bail-safe",
          "Sit BETWEEN the hips, not behind heels",
          "Slow descent IS the program — don't bounce",
          "Drive knees out, chest stays proud",
        ],
        note: "The 3-sec eccentric is the work, not the load.",
      },
      {
        id: "landmine-rev-lunge", name: "Landmine Reverse Lunge",
        sets: 3, reps: "8–10 per leg", repRange: [8, 10], tempo: "2-0-1-0", rpe: "8", rpeTargetMax: 8,
        equipment: "Landmine + barbell, goblet hold",
        cues: [
          "Hold the bar end at chest (goblet)",
          "Step BACK, knee kisses floor",
          "Drive through FRONT heel to return",
          "Saves the lower back vs. heavy DB lunges",
        ],
        note: "Heavy-feeling, low-back-friendly.",
      },
      {
        id: "rdl", name: "Romanian Deadlift (Barbell)",
        sets: 4, reps: "8–10", repRange: [8, 10], tempo: "3-1-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Barbell, optional straps",
        cues: [
          "Bar travels CLOSE — almost dragging the legs",
          "Slight knee bend, hips push back",
          "Stop at mid-shin or when hamstrings cap out",
          "Don't round the lower back",
        ],
        note: "Hamstring stretch is the gauge, not the floor.",
      },
      {
        id: "bulgarian", name: "Bulgarian Split Squat (DBs)",
        sets: 3, reps: "10–12 per leg", repRange: [10, 12], tempo: "3-0-1-0", rpe: "8", rpeTargetMax: 8,
        equipment: "2 DBs (50s), bench behind",
        cues: [
          "THIS is your heavy leg movement despite the DB cap",
          "Front shin near-vertical",
          "Drop straight DOWN, not forward",
          "Brutal but knee-safe",
        ],
        note: "Single-leg load > absolute load.",
      },
      {
        id: "hip-abduction", name: "Cable Hip Abduction",
        sets: 3, reps: "15 per side", repRange: [15, 15], tempo: "2-1-1-1", rpe: "7", rpeTargetMax: 7,
        equipment: "Cable + ankle strap, low pulley",
        cues: [
          "Glute medius — protects knee tracking + hip joint",
          "Stand tall, don't lean away",
          "Slow controlled abduction, brief pause at end range",
          "Often skipped, always pays back",
        ],
        note: "Pre-hab the hip you train.",
      },
      {
        id: "pallof", name: "Pallof Press",
        sets: 3, reps: "12 per side", repRange: [12, 12], tempo: "2-2-1-0", rpe: "7", rpeTargetMax: 7,
        equipment: "Cable, chest-height",
        cues: [
          "Anti-rotation core — the spine-friendliest core move",
          "Press straight out, resist rotation",
          "2-sec pause at full extension",
          "Knees soft, ribs stacked over hips",
        ],
        note: "Anti-rotation > sit-ups, always.",
      },
    ],
  },

  wed: {
    id: "wed",
    code: "W",
    name: "Zone 2 + Mobility",
    focus: "Aerobic base + soft tissue",
    duration: "60 min",
    accent: T.cardio,
    icon: Heart,
    type: "cardio",
    cardio: {
      title: "Steady-State Zone 2",
      duration: 45,
      hr: "108–128 bpm (~60–70% max)",
      incline: "3–5%",
      speed: "3.5–4.2 mph (brisk walk to light jog)",
      cue: "Conversation pace. Breathing through the nose should feel like work. If you can sing, raise the incline.",
    },
    mobility: [
      "90/90 hip switches — 8 each side",
      "Couch stretch — 60s per side",
      "Thoracic extensions over foam roller — 10 reps",
      "World's Greatest Stretch — 5 per side",
      "Wall slides (scap upward rotation) — 2 × 12",
      "Doorway pec stretch — 60s per side",
    ],
  },

  thu: {
    id: "thu",
    code: "Th",
    name: "Pull Upper",
    focus: "Lats, mid-back, biceps, rear delts",
    duration: "60–70 min",
    accent: T.pull,
    icon: Dumbbell,
    type: "lift",
    exercises: [
      {
        id: "pullup", name: "Pull-Up (or Lat Pulldown)",
        sets: 4, reps: "6–10", repRange: [6, 10], tempo: "3-0-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Pull-up bar or cable lat pulldown",
        cues: [
          "If pull-ups inconsistent, do 3-sec eccentrics from the top",
          "Builds the structure that protects the rotator cuff",
          "Squeeze lats first, then pull",
          "Full extension at the bottom",
        ],
        note: "Eccentric-only is still progress.",
      },
      {
        id: "bb-row", name: "Barbell Bent-Over Row",
        sets: 4, reps: "8–10", repRange: [8, 10], tempo: "2-1-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Barbell",
        cues: [
          "Torso ~45°, knees soft",
          "Pull to LOWER chest, not belly",
          "Brace hard — this builds the entire posterior chain",
          "Stop the bar an inch off the body, no bouncing",
        ],
        note: "Hardest of the rowing complex.",
      },
      {
        id: "meadows-row", name: "Landmine Meadows Row",
        sets: 3, reps: "10–12 per side", repRange: [10, 12], tempo: "2-1-1-0", rpe: "8", rpeTargetMax: 8,
        equipment: "Landmine + barbell end",
        cues: [
          "Straddle the bar, grip the end with one hand",
          "Hand on knee for support — flat back",
          "The angle hits lat with minimal lumbar load",
          "Pull elbow back and slightly up",
        ],
        note: "Unilateral lat without the spine tax.",
      },
      {
        id: "seated-row", name: "Cable Seated Row (close grip)",
        sets: 3, reps: "12–15", repRange: [12, 15], tempo: "2-1-1-1", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Cable + close-grip attachment",
        cues: [
          "Drive elbows BACK, squeeze 1 second",
          "Constant tension on mid-traps + rhomboids",
          "Posture insurance",
          "Don't lean back — stay upright",
        ],
        note: "Squeeze is the work.",
      },
      {
        id: "zigzag-curl", name: "Zigzag Bar Curl",
        sets: 3, reps: "10–12", repRange: [10, 12], tempo: "3-0-1-0", rpe: "7", rpeTargetMax: 7,
        equipment: "EZ-curl bar",
        cues: [
          "Angled grip = the ONLY reason this still feels good at 48",
          "Don't swing — the 3-sec eccentric stops cheating",
          "Elbows pinned to ribs",
          "Squeeze at the top, fight gravity down",
        ],
        note: "Wrist-friendly curl.",
      },
      {
        id: "hammer-curl", name: "DB Hammer Curl",
        sets: 3, reps: "12–15", repRange: [12, 15], tempo: "2-0-1-0", rpe: "8", rpeTargetMax: 8,
        equipment: "2 DBs (35–40 lb)",
        cues: [
          "Brachialis and forearm",
          "Thumbs up the whole rep",
          "Use the 35–40s",
          "Both arms simultaneously, no rocking",
        ],
        note: "Brachialis bias for arm thickness.",
      },
      {
        id: "reverse-fly", name: "Cable Reverse Fly",
        sets: 3, reps: "15–20", repRange: [15, 20], tempo: "2-1-1-1", rpe: "7", rpeTargetMax: 7,
        equipment: "Cable, single handles, chest-height crossed",
        cues: [
          "Cables crossed at chest height, light load",
          "Pull HANDS apart, leading with elbows",
          "Pause 1s at end range, slow return",
          "Direct antagonist to all that pressing",
        ],
        note: "Posture restoration.",
      },
    ],
  },

  fri: {
    id: "fri",
    code: "F",
    name: "Hinge Lower + MetCon",
    focus: "Deadlift pattern, posterior chain, conditioning",
    duration: "70–80 min",
    accent: T.hinge,
    icon: Zap,
    type: "lift",
    exercises: [
      {
        id: "deadlift", name: "Barbell Conventional Deadlift",
        sets: 4, reps: "5", repRange: [5, 5], tempo: "2-1-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "Barbell, optional straps",
        cues: [
          "STOP each rep — no touch-and-go",
          "Reset the brace between reps",
          "Use straps if grip fails before the hips",
          "Bar drags up the legs, lats pull bar to body",
        ],
        note: "Singles within the set — pure quality.",
      },
      {
        id: "lm-goblet-squat", name: "Landmine Goblet Squat",
        sets: 3, reps: "10–12", repRange: [10, 12], tempo: "3-1-1-0", rpe: "7", rpeTargetMax: 7,
        equipment: "Landmine + barbell, hug the end",
        cues: [
          "Hug bar end at chest",
          "Angle naturally pulls into upright torso",
          "Easy on the spine",
          "Knees track over toes, full depth",
        ],
        note: "Upright torso = spine-friendly squat.",
      },
      {
        id: "sl-rdl", name: "Single-Leg RDL (DB)",
        sets: 3, reps: "10 per leg", repRange: [10, 10], tempo: "3-0-1-0", rpe: "7–8", rpeTargetMax: 8,
        equipment: "1 DB, rack/wall for balance",
        cues: [
          "Single-leg = double stimulus at half the load",
          "Free hand on rack for balance, NOT support",
          "Hips square as you hinge — no rotation",
          "Stop when the standing-leg hamstring caps out",
        ],
        note: "Stability + hamstring + glute, low-load.",
      },
      {
        id: "pull-through", name: "Cable Pull-Through",
        sets: 3, reps: "12–15", repRange: [12, 15], tempo: "2-1-1-1", rpe: "7", rpeTargetMax: 7,
        equipment: "Cable + rope, low pulley, between legs",
        cues: [
          "Rope passes between legs, face away from stack",
          "Hinge AT the hips, push the floor away",
          "The 'isolation' hinge — finishes glutes without taxing the back",
          "Squeeze 1 second at lockout",
        ],
        note: "Glute pump without the spine bill.",
      },
      {
        id: "calf-raise", name: "Standing Calf Raise (DB in hand)",
        sets: 3, reps: "15–20", repRange: [15, 20], tempo: "2-2-1-0", rpe: "8", rpeTargetMax: 8,
        equipment: "DB + plate to stand on",
        cues: [
          "Off a plate for full ROM",
          "2-SECOND pause at the bottom",
          "That's where Achilles resilience is built",
          "Hold DB on working-leg side, hand on rack",
        ],
        note: "Bottom stretch builds Achilles tendon.",
      },
    ],
    metcon: {
      enabled: true,
      title: "EMOM × 12",
      description: "Every Minute on the Minute — rotate through the 3 movements",
      minutes: 12,
      rotation: [
        { name: "Landmine Squat-to-Press", target: "8 reps" },
        { name: "Cable Row", target: "12 reps" },
        { name: "Treadmill Sprint", target: "20s @ 8.0 mph, 1% incline" },
      ],
      hrTarget: "140s–150s",
      warning: "Stop early if breath turns ragged or form breaks. This is a bonus, not a hill to die on.",
    },
  },

  sat: {
    id: "sat",
    code: "S",
    name: "Long Zone 2 + Flow",
    focus: "Extended aerobic + full-body mobility",
    duration: "75–90 min",
    accent: T.cardio,
    icon: Wind,
    type: "cardio",
    cardio: {
      title: "Extended Zone 2",
      duration: 60,
      hr: "110–130 bpm (slightly lower end)",
      incline: "3% → +1% every 15 min → max 6%",
      speed: "Sustainable pace",
      cue: "Should feel almost easy at minute 5, earned by minute 50. Watch something, take a call.",
    },
    mobility: [
      "Cat-camel — 10 reps",
      "Thread-the-needle — 8 per side",
      "Half-kneeling hip flexor stretch with overhead reach — 60s per side",
      "Deep squat hold (cable counterbalance) — 90s",
      "Banded shoulder dislocates — 10 reps",
      "Standing hamstring scoops — 8 per leg",
      "Child's pose with side reach — 60s per side",
      "Box breathing — 5 min (4 in, 4 hold, 4 out, 4 hold)",
    ],
  },

  sun: {
    id: "sun",
    code: "Su",
    name: "Rest",
    focus: "Complete recovery",
    duration: "—",
    accent: T.rest,
    icon: Bed,
    type: "rest",
    rest: {
      title: "Full Rest",
      note: "No structured training. A 20–40 minute outdoor walk encouraged for circulation and vitamin D. Goal is complete recovery.",
      checklist: [
        "Hydrate aggressively",
        "Hit protein target (~0.9–1.0 g per lb)",
        "Sleep 7.5–9 hours",
        "Outdoor walk (optional, 20–40 min)",
      ],
    },
  },
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DAY_LABELS = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };

const dayKeyFromDate = (d = new Date()) => {
  const m = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  return m[d.getDay()];
};

/* ============================================================
   UTILITIES
   ============================================================ */
const todayISO = () => new Date().toISOString().split("T")[0];
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
const computeVolume = (exercises) =>
  exercises.reduce(
    (sum, ex) =>
      sum + ex.sets.reduce((s, st) => s + (Number(st.weight) || 0) * (Number(st.reps) || 0), 0),
    0
  );

// Progressive overload rule from the program:
// "Hit top of rep range at prescribed RPE for TWO sessions in a row → add 2.5–5 lb"
const isReadyToLevelUp = (loggedSets, repRange, rpeMax) => {
  if (!loggedSets || loggedSets.length === 0) return false;
  const [, top] = repRange;
  return loggedSets.every((s) => {
    const reps = Number(s.reps) || 0;
    const rpe = Number(s.rpe) || 0;
    return reps >= top && rpe <= rpeMax;
  });
};

// Two consecutive level-ups = the real green light
const checkConsecutiveLevelUps = (sessions, dayKey, exerciseId, repRange, rpeMax) => {
  const relevant = sessions
    .filter((s) => s.day === dayKey)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 2);
  if (relevant.length < 2) return false;
  return relevant.every((sess) => {
    const ex = sess.exercises.find((e) => e.id === exerciseId);
    return ex && isReadyToLevelUp(ex.sets, repRange, rpeMax);
  });
};

/* ============================================================
   UI PRIMITIVES
   ============================================================ */
const Pill = ({ children, color = T.text, bg = T.surfaceAlt }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold font-body"
    style={{ color, backgroundColor: bg }}
  >
    {children}
  </span>
);

const Card = ({ children, className = "", style = {} }) => (
  <div
    className={`rounded-2xl border ${className}`}
    style={{ backgroundColor: T.surface, borderColor: T.border, ...style }}
  >
    {children}
  </div>
);

const ProgressBar = ({ pct, color = T.accent }) => (
  <div className="h-1 w-full rounded-full overflow-hidden" style={{ backgroundColor: T.border }}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
  </div>
);

/* ============================================================
   HEADER
   ============================================================ */
const Header = ({ block, week }) => (
  <header className="px-5 pt-5 pb-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: T.accent }}
        >
          <ShieldCheck size={20} color="#0A0F14" strokeWidth={2.5} />
        </div>
        <div className="leading-none">
          <div className="font-display text-[22px] uppercase tracking-wider" style={{ color: T.text }}>
            Masters
          </div>
          <div className="font-body text-[11px] mt-0.5 uppercase tracking-widest" style={{ color: T.textFaint }}>
            Athlete Protocol
          </div>
        </div>
      </div>
      <div className="text-right">
        <div className="font-body text-[10px] uppercase tracking-widest font-semibold" style={{ color: T.textFaint }}>
          {block}
        </div>
        <div className="font-num font-bold text-sm" style={{ color: T.text }}>Week {week}</div>
      </div>
    </div>
  </header>
);

/* ============================================================
   DASHBOARD
   ============================================================ */
const HabitRow = ({ icon: Icon, label, detail, done, onToggle }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all active:scale-[0.99]"
    style={{
      backgroundColor: done ? "rgba(20,184,166,0.08)" : T.surface,
      borderColor: done ? T.accent : T.border,
    }}
  >
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: done ? T.accent : T.surfaceAlt }}
    >
      {done ? <Check size={20} color="#0A0F14" strokeWidth={3} /> : <Icon size={18} color={T.text} />}
    </div>
    <div className="flex-1 text-left min-w-0">
      <div className="font-body font-semibold text-[15px]" style={{ color: done ? T.accent : T.text }}>
        {label}
      </div>
      <div className="font-body text-xs truncate" style={{ color: T.textFaint }}>{detail}</div>
    </div>
    <div
      className="w-6 h-6 rounded-md border-2 flex-shrink-0 flex items-center justify-center"
      style={{
        backgroundColor: done ? T.accent : "transparent",
        borderColor: done ? T.accent : T.border,
      }}
    >
      {done && <Check size={14} color="#0A0F14" strokeWidth={3} />}
    </div>
  </button>
);

const DayTile = ({ dayKey, day, isToday, completed, levelUpCount, onStart }) => {
  const Icon = day.icon;
  return (
    <button
      onClick={() => onStart(dayKey)}
      className="w-full text-left rounded-xl p-4 transition-all active:scale-[0.99] relative overflow-hidden"
      style={{
        backgroundColor: T.surface,
        borderColor: isToday ? day.accent : T.border,
        borderWidth: isToday ? 2 : 1,
        borderStyle: "solid",
      }}
    >
      {isToday && (
        <div
          className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg font-body text-[9px] font-bold uppercase tracking-widest"
          style={{ backgroundColor: day.accent, color: "#0A0F14" }}
        >
          Today
        </div>
      )}
      <div className="flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${day.accent}22`, color: day.accent }}
        >
          <Icon size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              {DAY_LABELS[dayKey]}
            </div>
            <div className="font-num text-[10px]" style={{ color: T.textFaint }}>{day.duration}</div>
          </div>
          <div className="font-display text-lg uppercase mt-0.5" style={{ color: T.text }}>
            {day.name}
          </div>
          <div className="font-body text-xs mt-0.5 truncate" style={{ color: T.textDim }}>{day.focus}</div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          {completed && (
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ backgroundColor: T.success }}>
              <Check size={14} color="#0A0F14" strokeWidth={3} />
            </div>
          )}
          {levelUpCount > 0 && (
            <div className="flex items-center gap-0.5 px-1.5 py-0.5 rounded" style={{ backgroundColor: `${T.warn}22` }}>
              <Flame size={10} color={T.warn} />
              <span className="font-num text-[10px] font-bold" style={{ color: T.warn }}>{levelUpCount}</span>
            </div>
          )}
          <ChevronRight size={16} color={T.textFaint} />
        </div>
      </div>
    </button>
  );
};

const Dashboard = ({ week, habits, toggleHabit, bodyWeight, sessions, onStart, levelUpByDay }) => {
  const proteinTarget = Math.round(bodyWeight * 1); // 0.9–1.0 g/lb → use 1.0 as target
  const today = todayISO();
  const todayKey = dayKeyFromDate();
  const todaysSessions = sessions.filter((s) => s.date === today);

  return (
    <div className="px-5 pb-32 space-y-5 slide-up">
      {/* PROGRAM BANNER */}
      <Card className="p-5 overflow-hidden relative">
        <div
          className="absolute inset-0 opacity-30"
          style={{ background: `radial-gradient(circle at top right, ${T.accent}33, transparent 60%)` }}
        />
        <div className="relative">
          <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.accent }}>
            Block 1 · Strength + Joint Preservation
          </div>
          <div className="font-display text-3xl uppercase mt-1.5" style={{ color: T.text }}>
            Train Smart, Not Heavy
          </div>
          <div className="font-body text-sm mt-2 leading-relaxed" style={{ color: T.textDim }}>
            6 lifting + cardio sessions per week. Tempo over load. Joints first.
          </div>
          <div className="flex items-center gap-4 mt-4">
            <div>
              <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
                Week
              </div>
              <div className="font-num font-bold text-2xl" style={{ color: T.text }}>{week} / 6</div>
            </div>
            <div className="h-8 w-px" style={{ backgroundColor: T.border }} />
            <div>
              <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
                Sessions logged
              </div>
              <div className="font-num font-bold text-2xl" style={{ color: T.text }}>{sessions.length}</div>
            </div>
          </div>
        </div>
      </Card>

      {/* HABITS */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="font-display text-lg uppercase" style={{ color: T.text }}>Daily Recovery</h2>
          <span className="font-body text-xs" style={{ color: T.textFaint }}>
            {Object.values(habits).filter((v) => v === true).length} / 3 today
          </span>
        </div>
        <div className="space-y-2">
          <HabitRow
            icon={Moon}
            label="Sleep 7.5–9 hours"
            detail="Testosterone synthesizes overnight. Under 7 = next day at 80%."
            done={habits.sleep}
            onToggle={() => toggleHabit("sleep")}
          />
          <HabitRow
            icon={Beef}
            label={`Protein: ${proteinTarget}g`}
            detail={`~1.0 g per lb (${bodyWeight} lb), spread across 4 meals`}
            done={habits.protein}
            onToggle={() => toggleHabit("protein")}
          />
          <HabitRow
            icon={Footprints}
            label="8,000+ steps"
            detail="NEAT — bedrock for metabolic health at 48"
            done={habits.steps}
            onToggle={() => toggleHabit("steps")}
          />
        </div>
      </div>

      {/* WEEK SCHEDULE */}
      <div>
        <div className="flex items-center justify-between mb-2.5 px-1">
          <h2 className="font-display text-lg uppercase" style={{ color: T.text }}>This Week</h2>
          <span className="font-body text-xs" style={{ color: T.textFaint }}>Tap any day</span>
        </div>
        <div className="space-y-2">
          {DAY_ORDER.map((k) => (
            <DayTile
              key={k}
              dayKey={k}
              day={PROGRAM[k]}
              isToday={k === todayKey}
              completed={todaysSessions.some((s) => s.day === k)}
              levelUpCount={levelUpByDay[k] || 0}
              onStart={onStart}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   TEMPO TIMER — flashes phase + bar
   ============================================================ */
const TempoTimer = ({ tempo, onClose }) => {
  const { e, bp, c, tp, total } = useMemo(() => decodeTempo(tempo), [tempo]);
  const [running, setRunning] = useState(true);
  const [phaseTime, setPhaseTime] = useState(0); // ms inside current phase
  const [phaseIdx, setPhaseIdx] = useState(0); // 0=ecc 1=bot 2=con 3=top
  const startRef = useRef(null);
  const rafRef = useRef(null);

  const phases = useMemo(
    () => [
      { label: "DOWN", duration: e, color: T.accent },
      { label: "PAUSE", duration: bp, color: T.warn },
      { label: "UP", duration: c, color: T.success },
      { label: "TOP", duration: tp, color: T.textDim },
    ],
    [e, bp, c, tp]
  );

  useEffect(() => {
    if (!running) return;
    startRef.current = performance.now();
    let pIdx = 0;
    let pStart = performance.now();
    const tick = (now) => {
      const elapsed = (now - pStart) / 1000;
      const cur = phases[pIdx];
      if (cur.duration === 0 || elapsed >= cur.duration) {
        pIdx = (pIdx + 1) % phases.length;
        // skip 0-second phases
        let safety = 0;
        while (phases[pIdx].duration === 0 && safety < 4) {
          pIdx = (pIdx + 1) % phases.length;
          safety++;
        }
        pStart = now;
        setPhaseIdx(pIdx);
        setPhaseTime(0);
      } else {
        setPhaseTime(elapsed);
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [running, phases]);

  const cur = phases[phaseIdx];
  const pct = cur.duration > 0 ? (phaseTime / cur.duration) * 100 : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-md slide-up rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              Tempo
            </div>
            <div className="font-num font-bold text-xl" style={{ color: T.text }}>{tempo}</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95" style={{ backgroundColor: T.surfaceAlt }}>
            <X size={16} color={T.text} />
          </button>
        </div>
        <div className="text-center my-8">
          <div className="font-display uppercase text-7xl tracking-wider tempo-flash" style={{ color: cur.color }}>
            {cur.label}
          </div>
          <div className="font-num font-bold text-3xl mt-2" style={{ color: T.text }}>
            {cur.duration > 0 ? Math.max(1, Math.ceil(cur.duration - phaseTime)) : "—"}
            <span className="text-base ml-1" style={{ color: T.textFaint }}>s</span>
          </div>
        </div>
        <div className="h-2 rounded-full mb-2 overflow-hidden" style={{ backgroundColor: T.surfaceAlt }}>
          <div className="h-full transition-all rounded-full" style={{ width: `${pct}%`, backgroundColor: cur.color }} />
        </div>
        <div className="flex gap-1 mb-5">
          {phases.map((p, i) => (
            <div
              key={i}
              className="flex-1 text-center py-1.5 rounded font-body text-[10px] uppercase font-bold tracking-wider"
              style={{
                backgroundColor: i === phaseIdx ? p.color : T.surfaceAlt,
                color: i === phaseIdx ? "#0A0F14" : T.textFaint,
                opacity: p.duration === 0 ? 0.3 : 1,
              }}
            >
              {p.label}<br />
              <span className="font-num">{p.duration}s</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="flex-1 py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-2 active:scale-95"
            style={{ backgroundColor: T.surfaceAlt, color: T.text }}
          >
            {running ? <Pause size={14} /> : <Play size={14} />}
            {running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-body font-bold text-sm active:scale-95"
            style={{ backgroundColor: T.accent, color: "#0A0F14" }}
          >
            Done
          </button>
        </div>
        <div className="font-body text-[11px] text-center mt-3" style={{ color: T.textFaint }}>
          {TEMPO_DECODE}
        </div>
      </div>
    </div>
  );
};

/* ============================================================
   REST TIMER
   ============================================================ */
const RestTimer = ({ initial = 90, accent, onSkip }) => {
  const [remaining, setRemaining] = useState(initial);
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    if (paused || remaining <= 0) return;
    const t = setInterval(() => setRemaining((r) => Math.max(0, r - 1)), 1000);
    return () => clearInterval(t);
  }, [paused, remaining]);
  const pct = (remaining / initial) * 100;
  const finished = remaining === 0;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" style={{ backgroundColor: "rgba(0,0,0,0.85)" }}>
      <div className="w-full max-w-md slide-up rounded-2xl p-6" style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}>
        <div className="flex items-center gap-2 mb-2">
          <Timer size={18} color={accent} />
          <span className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Rest</span>
        </div>
        <div className="text-center my-6">
          <div className="font-num font-bold text-7xl tracking-tight" style={{ color: finished ? T.success : T.text }}>
            {fmtTime(remaining)}
          </div>
          <div className="font-body text-sm mt-2" style={{ color: T.textFaint }}>
            {finished ? "Rest is up — back to it" : "Breathe. Brace. Next set."}
          </div>
        </div>
        <div className="h-2 rounded-full mb-5 overflow-hidden" style={{ backgroundColor: T.surfaceAlt }}>
          <div className="h-full transition-all duration-1000 rounded-full" style={{ width: `${pct}%`, backgroundColor: finished ? T.success : accent }} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setRemaining((r) => Math.max(0, r - 15))} className="flex-1 py-3 rounded-xl font-body font-semibold text-sm active:scale-95" style={{ backgroundColor: T.surfaceAlt, color: T.text }}>
            −15s
          </button>
          <button onClick={() => setPaused((p) => !p)} className="flex-1 py-3 rounded-xl font-body font-semibold text-sm flex items-center justify-center gap-1.5 active:scale-95" style={{ backgroundColor: T.surfaceAlt, color: T.text }}>
            {paused ? <Play size={14} /> : <Pause size={14} />}
            {paused ? "Resume" : "Pause"}
          </button>
          <button onClick={() => setRemaining((r) => r + 15)} className="flex-1 py-3 rounded-xl font-body font-semibold text-sm active:scale-95" style={{ backgroundColor: T.surfaceAlt, color: T.text }}>
            +15s
          </button>
        </div>
        <button onClick={onSkip} className="w-full mt-3 py-4 rounded-xl font-body font-bold text-base flex items-center justify-center gap-2 active:scale-95" style={{ backgroundColor: accent, color: "#0A0F14" }}>
          <SkipForward size={16} /> Next Set
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   EMOM CLOCK — Friday's MetCon
   ============================================================ */
const EMOMClock = ({ metcon, accent, onFinish }) => {
  const total = metcon.minutes * 60;
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setElapsed((e) => Math.min(total, e + 1)), 1000);
    return () => clearInterval(t);
  }, [running, total]);

  const minuteIdx = Math.floor(elapsed / 60);
  const secInMinute = elapsed % 60;
  const rotationIdx = minuteIdx % metcon.rotation.length;
  const current = metcon.rotation[rotationIdx];
  const next = metcon.rotation[(rotationIdx + 1) % metcon.rotation.length];
  const minutePct = (secInMinute / 60) * 100;
  const totalPct = (elapsed / total) * 100;
  const finished = elapsed >= total;

  return (
    <div className="px-5 py-5 pb-32 slide-up">
      <Card className="p-5" style={{ borderColor: accent, borderWidth: 2 }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: accent }}>
              MetCon Finisher
            </div>
            <div className="font-display text-2xl uppercase mt-1" style={{ color: T.text }}>{metcon.title}</div>
          </div>
          <div className="text-right">
            <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              HR Target
            </div>
            <div className="font-num font-bold text-sm" style={{ color: T.text }}>{metcon.hrTarget}</div>
          </div>
        </div>
        <p className="font-body text-xs mt-2" style={{ color: T.textDim }}>{metcon.description}</p>
      </Card>

      {/* BIG MINUTE COUNTDOWN */}
      <div className="text-center my-8">
        <div className="font-body text-[10px] uppercase tracking-widest font-bold mb-2" style={{ color: T.textFaint }}>
          Current Minute
        </div>
        <div className="font-num font-bold text-7xl tracking-tight" style={{ color: finished ? T.success : T.text }}>
          {fmtTime(60 - secInMinute)}
        </div>
        <div className="font-body text-xs mt-1" style={{ color: T.textFaint }}>
          remaining this minute
        </div>
      </div>

      {/* CURRENT EXERCISE — huge */}
      <Card className="p-5 mb-3" style={{ backgroundColor: `${accent}11`, borderColor: accent }}>
        <div className="font-body text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: accent }}>
          DO NOW · Min {minuteIdx + 1} of {metcon.minutes}
        </div>
        <div className="font-display text-3xl uppercase leading-tight" style={{ color: T.text }}>
          {current.name}
        </div>
        <div className="font-num text-sm mt-1" style={{ color: T.textDim }}>{current.target}</div>
      </Card>

      {/* Up next preview */}
      <Card className="p-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
            Up Next
          </div>
          <div className="font-body font-semibold text-sm flex-1" style={{ color: T.text }}>{next.name}</div>
          <div className="font-num text-[11px]" style={{ color: T.textFaint }}>{next.target}</div>
        </div>
      </Card>

      {/* Minute progress bar */}
      <div className="mb-2">
        <div className="flex justify-between mb-1">
          <span className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>Minute</span>
          <span className="font-num text-[10px]" style={{ color: T.textFaint }}>{secInMinute}s / 60s</span>
        </div>
        <ProgressBar pct={minutePct} color={accent} />
      </div>
      <div className="mb-5">
        <div className="flex justify-between mb-1">
          <span className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>Total</span>
          <span className="font-num text-[10px]" style={{ color: T.textFaint }}>{fmtTime(elapsed)} / {fmtTime(total)}</span>
        </div>
        <ProgressBar pct={totalPct} color={T.accent} />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setElapsed(0); setRunning(false); }}
          className="flex-1 py-3 rounded-xl font-body font-semibold text-sm active:scale-95"
          style={{ backgroundColor: T.surfaceAlt, color: T.text }}
        >
          Reset
        </button>
        <button
          onClick={() => setRunning((r) => !r)}
          disabled={finished}
          className="flex-[2] py-3 rounded-xl font-body font-bold text-base flex items-center justify-center gap-2 active:scale-95 disabled:opacity-40"
          style={{ backgroundColor: accent, color: "#0A0F14" }}
        >
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "Pause" : (elapsed > 0 ? "Resume" : "Start")}
        </button>
      </div>

      {/* Warning */}
      <Card className="p-3 mb-4" style={{ backgroundColor: `${T.warn}11`, borderColor: T.warn }}>
        <div className="flex gap-2 items-start">
          <Sparkles size={14} color={T.warn} className="mt-0.5 flex-shrink-0" />
          <p className="font-body text-xs leading-relaxed" style={{ color: T.textDim }}>{metcon.warning}</p>
        </div>
      </Card>

      <button
        onClick={onFinish}
        className="w-full py-4 rounded-xl font-display text-xl uppercase tracking-wider active:scale-[0.98] transition"
        style={{ backgroundColor: T.success, color: "#0A0F14" }}
      >
        {finished ? "MetCon Complete · Finish" : "Done — Save & Finish"}
      </button>
    </div>
  );
};

/* ============================================================
   LIFT FLOW — Phases: overview → exercise → metcon? → done
   ============================================================ */
const LiftHeader = ({ day, phase, exerciseIdx, totalExercises, onExit }) => {
  let label = "";
  let progress = 0;
  if (phase === "overview") { label = "Get Ready"; progress = 5; }
  else if (phase === "exercise") {
    label = `Exercise ${exerciseIdx + 1} of ${totalExercises}`;
    progress = 10 + ((exerciseIdx + 1) / totalExercises) * 70;
  }
  else if (phase === "metcon") { label = "MetCon Finisher"; progress = 90; }
  else { label = "Complete"; progress = 100; }
  return (
    <div className="sticky top-0 z-20" style={{ backgroundColor: T.bg, borderBottom: `1px solid ${T.border}` }}>
      <div className="px-5 pt-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              {DAY_LABELS[day.id]} · {day.name}
            </div>
            <div className="font-display text-lg uppercase leading-none mt-1" style={{ color: T.text }}>{label}</div>
          </div>
          <button onClick={onExit} className="w-9 h-9 rounded-full flex items-center justify-center active:scale-95" style={{ backgroundColor: T.surfaceAlt }}>
            <X size={16} color={T.text} />
          </button>
        </div>
        <ProgressBar pct={progress} color={day.accent} />
      </div>
    </div>
  );
};

const LiftOverview = ({ day, onStart }) => (
  <div className="px-5 py-6 space-y-4 slide-up">
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Wrench size={18} color={day.accent} />
        <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Equipment Pool</h3>
      </div>
      <div className="space-y-1.5">
        {Array.from(new Set(day.exercises.map((e) => e.equipment))).map((eq, i) => (
          <div key={i} className="flex items-start gap-2.5">
            <div className="w-1 h-1 rounded-full flex-shrink-0 mt-2" style={{ backgroundColor: day.accent }} />
            <span className="font-body text-[14px]" style={{ color: T.textDim }}>{eq}</span>
          </div>
        ))}
      </div>
    </Card>

    <Card className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <ListChecks size={18} color={day.accent} />
        <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>The Block</h3>
      </div>
      <div className="space-y-2.5">
        {day.exercises.map((ex, i) => (
          <div key={ex.id} className="flex items-center gap-3">
            <span className="font-num font-bold text-sm w-6" style={{ color: T.textFaint }}>{i + 1}.</span>
            <span className="font-body font-semibold text-[14px] flex-1" style={{ color: T.text }}>{ex.name}</span>
            <span className="font-num text-[11px]" style={{ color: T.textFaint }}>
              {ex.sets}×{ex.reps.replace(" per side", "/s").replace(" per leg", "/l")}
            </span>
          </div>
        ))}
      </div>
      {day.metcon?.enabled && (
        <div className="mt-3 pt-3 border-t flex items-center gap-2" style={{ borderColor: T.border }}>
          <Zap size={14} color={T.warn} />
          <span className="font-body text-[13px] font-semibold" style={{ color: T.text }}>+ {day.metcon.title} finisher</span>
        </div>
      )}
    </Card>

    <button
      onClick={onStart}
      className="w-full py-5 rounded-xl font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition"
      style={{ backgroundColor: day.accent, color: "#0A0F14" }}
    >
      Begin Session <ArrowRight size={22} />
    </button>
  </div>
);

/* ----- RPE Picker ----- */
const RPEPicker = ({ value, onChange, targetMax }) => {
  const options = [6, 7, 8, 9, 10];
  return (
    <div>
      <div className="font-body text-[10px] uppercase tracking-wider font-bold mb-1.5" style={{ color: T.textFaint }}>
        RPE {targetMax && `(target ≤ ${targetMax})`}
      </div>
      <div className="flex gap-1.5">
        {options.map((n) => {
          const active = value === n;
          const tooHigh = targetMax && n > targetMax;
          return (
            <button
              key={n}
              onClick={() => onChange(n)}
              className="flex-1 py-2.5 rounded-lg font-num font-bold text-base transition-all active:scale-95"
              style={{
                backgroundColor: active ? (tooHigh ? T.danger : T.accent) : T.surfaceAlt,
                color: active ? "#0A0F14" : (tooHigh ? T.danger : T.text),
                borderWidth: 1,
                borderStyle: "solid",
                borderColor: active ? "transparent" : (tooHigh && active ? T.danger : T.border),
              }}
            >
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* ----- Exercise Screen ----- */
const ExerciseScreen = ({ day, exercise, exerciseIdx, totalExercises, lastSession, allSessions, onComplete }) => {
  const [showCues, setShowCues] = useState(false);
  const [showTempo, setShowTempo] = useState(false);
  const [loggedSets, setLoggedSets] = useState([]);
  const [currentWeight, setCurrentWeight] = useState("");
  const [currentReps, setCurrentReps] = useState("");
  const [currentRPE, setCurrentRPE] = useState(null);
  const [resting, setResting] = useState(false);

  const previous = useMemo(
    () => lastSession?.exercises.find((e) => e.id === exercise.id) || null,
    [lastSession, exercise.id]
  );

  const consecutiveLevelUp = useMemo(
    () => checkConsecutiveLevelUps(allSessions, day.id, exercise.id, exercise.repRange, exercise.rpeTargetMax),
    [allSessions, day.id, exercise.id, exercise.repRange, exercise.rpeTargetMax]
  );

  useEffect(() => {
    if (loggedSets.length === 0 && currentWeight === "" && previous?.sets?.[0]?.weight) {
      setCurrentWeight(String(previous.sets[0].weight));
    }
  }, [previous]); // eslint-disable-line

  const setIndex = loggedSets.length;
  const isLastSet = setIndex === exercise.sets - 1;

  const isBodyweight =
    /pull-up/i.test(exercise.name) ||
    /pallof/i.test(exercise.name) ||
    /face pull/i.test(exercise.name);

  const logSet = () => {
    const w = Number(currentWeight) || 0;
    const r = Number(currentReps) || 0;
    if (r <= 0 || currentRPE == null) return;
    const next = [...loggedSets, { weight: w, reps: r, rpe: currentRPE }];
    setLoggedSets(next);
    setCurrentReps("");
    setCurrentRPE(null);
    if (next.length >= exercise.sets) {
      setTimeout(() => onComplete(next), 350);
    } else {
      setResting(true);
    }
  };

  return (
    <div className="px-5 py-5 pb-32 slide-up">
      {/* LEVEL UP BADGE — consecutive sessions */}
      {consecutiveLevelUp && (
        <div
          className="mb-4 p-4 rounded-xl flex items-center gap-3 pulse-ring"
          style={{ backgroundColor: `${T.warn}15`, border: `2px solid ${T.warn}` }}
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: T.warn }}>
            <Flame size={20} color="#0A0F14" />
          </div>
          <div className="flex-1">
            <div className="font-display text-base uppercase tracking-wider" style={{ color: T.warn }}>
              Add Load Today
            </div>
            <p className="font-body text-xs mt-0.5 leading-snug" style={{ color: T.textDim }}>
              Top of range hit at target RPE for 2 sessions running. Add 2.5–5 lb.
            </p>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="mb-5">
        <div className="font-body text-[10px] uppercase tracking-widest font-bold mb-1" style={{ color: T.textFaint }}>
          {exerciseIdx + 1} / {totalExercises}
        </div>
        <h1 className="font-display text-[36px] leading-[0.95] uppercase tracking-wide" style={{ color: T.text }}>
          {exercise.name}
        </h1>
        <p className="font-body text-xs mt-2 italic" style={{ color: T.textFaint }}>{exercise.note}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-3">
          <Pill bg={T.surfaceAlt}><ListChecks size={11} /> {exercise.sets} × {exercise.reps}</Pill>
          <button onClick={() => setShowTempo(true)} className="active:scale-95">
            <Pill bg={T.surfaceAlt} color={day.accent}><Timer size={11} /> Tempo {exercise.tempo}</Pill>
          </button>
          <Pill bg={T.surfaceAlt}>RPE {exercise.rpe}</Pill>
        </div>
      </div>

      {/* EQUIPMENT */}
      <Card className="p-3 mb-2">
        <div className="flex items-start gap-2.5">
          <Wrench size={14} color={T.textFaint} className="mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              Equipment
            </div>
            <div className="font-body text-[13px]" style={{ color: T.text }}>{exercise.equipment}</div>
          </div>
        </div>
      </Card>

      {/* CUES TOGGLE */}
      <button
        onClick={() => setShowCues((s) => !s)}
        className="w-full rounded-xl p-3 mb-2 flex items-center justify-between active:scale-[0.99]"
        style={{ backgroundColor: T.surface, border: `1px solid ${T.border}` }}
      >
        <div className="flex items-center gap-2.5">
          <Lightbulb size={16} color={day.accent} />
          <span className="font-body font-semibold text-[14px]" style={{ color: T.text }}>
            {showCues ? "Hide form cues" : "Show form cues"}
          </span>
        </div>
        <ChevronRight size={16} color={T.textFaint} className={`transition-transform ${showCues ? "rotate-90" : ""}`} />
      </button>
      {showCues && (
        <Card className="p-4 mb-2 slide-up">
          <ul className="space-y-2">
            {exercise.cues.map((c, i) => (
              <li key={i} className="flex gap-2 items-start">
                <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: day.accent }} />
                <span className="font-body text-sm leading-relaxed" style={{ color: T.text }}>{c}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* PREVIOUS SESSION */}
      {previous && previous.sets.length > 0 && (
        <Card className="p-3 mb-4">
          <div className="font-body text-[9px] uppercase tracking-widest font-bold mb-1.5" style={{ color: T.textFaint }}>
            Last Session
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {previous.sets.map((s, i) => {
              const hitTop = Number(s.reps) >= exercise.repRange[1];
              return (
                <span
                  key={i}
                  className="font-num text-[12px] font-semibold px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: T.surfaceAlt,
                    color: hitTop ? T.warn : T.text,
                  }}
                >
                  {s.weight > 0 ? `${s.weight}×${s.reps}` : `${s.reps}`}
                  {s.rpe && <span style={{ color: T.textFaint }}> @{s.rpe}</span>}
                  {hitTop && <Flame size={9} className="inline ml-0.5 -mt-0.5" />}
                </span>
              );
            })}
          </div>
        </Card>
      )}

      {/* SET TRACKER */}
      <div className="mb-4">
        <div className="font-body text-[10px] uppercase tracking-widest font-bold mb-2 px-1" style={{ color: T.textFaint }}>
          Sets
        </div>
        <div className="space-y-2">
          {Array.from({ length: exercise.sets }).map((_, i) => {
            const logged = loggedSets[i];
            const isCurrent = i === setIndex;
            return (
              <div
                key={i}
                className="rounded-xl p-3.5 transition-all"
                style={{
                  backgroundColor: logged ? `${T.success}10` : (isCurrent ? T.surface : T.surface),
                  border: `2px solid ${logged ? T.success : (isCurrent ? day.accent : T.border)}`,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 font-num font-bold"
                    style={{
                      backgroundColor: logged ? T.success : T.surfaceAlt,
                      color: logged ? "#0A0F14" : T.text,
                    }}
                  >
                    {logged ? <Check size={18} strokeWidth={3} /> : i + 1}
                  </div>
                  {logged ? (
                    <div className="flex-1 flex items-center justify-between">
                      <div className="font-body text-sm font-semibold" style={{ color: T.success }}>
                        Logged
                      </div>
                      <div className="font-num font-bold text-sm" style={{ color: T.success }}>
                        {logged.weight > 0 ? `${logged.weight} lb · ${logged.reps}` : `${logged.reps} reps`}
                        <span className="ml-1" style={{ color: T.textFaint }}>@{logged.rpe}</span>
                      </div>
                    </div>
                  ) : isCurrent ? (
                    <div className="flex-1 space-y-2.5">
                      <div className="flex items-end gap-2">
                        {!isBodyweight && (
                          <div className="flex-1">
                            <div className="font-body text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: T.textFaint }}>
                              Weight (lb)
                            </div>
                            <input
                              type="number"
                              inputMode="decimal"
                              value={currentWeight}
                              onChange={(e) => setCurrentWeight(e.target.value)}
                              placeholder="0"
                              className="w-full font-num font-bold text-xl rounded-lg px-3 py-2 outline-none"
                              style={{ backgroundColor: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="font-body text-[10px] uppercase tracking-wider font-bold mb-1" style={{ color: T.textFaint }}>
                            Reps
                          </div>
                          <input
                            type="number"
                            inputMode="numeric"
                            value={currentReps}
                            onChange={(e) => setCurrentReps(e.target.value)}
                            placeholder={String(exercise.repRange[1])}
                            className="w-full font-num font-bold text-xl rounded-lg px-3 py-2 outline-none"
                            style={{ backgroundColor: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}
                          />
                        </div>
                      </div>
                      <RPEPicker value={currentRPE} onChange={setCurrentRPE} targetMax={exercise.rpeTargetMax} />
                    </div>
                  ) : (
                    <div className="flex-1 font-body text-sm" style={{ color: T.textFaint }}>Set {i + 1} — pending</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {setIndex < exercise.sets && (
        <button
          onClick={logSet}
          disabled={!currentReps || Number(currentReps) <= 0 || currentRPE == null}
          className="w-full py-5 rounded-xl font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-30"
          style={{ backgroundColor: day.accent, color: "#0A0F14" }}
        >
          {isLastSet ? "Log Final Set" : `Log Set ${setIndex + 1}`} <Check size={22} strokeWidth={3} />
        </button>
      )}

      {showTempo && <TempoTimer tempo={exercise.tempo} onClose={() => setShowTempo(false)} />}
      {resting && <RestTimer initial={isLastSet ? 75 : 120} accent={day.accent} onSkip={() => setResting(false)} />}
    </div>
  );
};

const LiftFlow = ({ day, week, sessions, onExit, onSave }) => {
  const [phase, setPhase] = useState("overview");
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [completed, setCompleted] = useState([]);

  const lastSession = useMemo(
    () => sessions.filter((s) => s.day === day.id).sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null,
    [sessions, day.id]
  );

  const handleSetsDone = (sets) => {
    const ex = day.exercises[exerciseIdx];
    const next = [...completed, { id: ex.id, name: ex.name, sets }];
    setCompleted(next);
    if (exerciseIdx + 1 >= day.exercises.length) {
      if (day.metcon?.enabled) setPhase("metcon");
      else handleSave(next, null);
    } else {
      setExerciseIdx(exerciseIdx + 1);
    }
  };

  const handleSave = async (exercises, metconDone) => {
    const session = {
      id: new Date().toISOString(),
      date: todayISO(),
      day: day.id,
      week,
      exercises,
      metconCompleted: !!metconDone,
      totalVolume: computeVolume(exercises),
    };
    await onSave(session);
    onExit();
  };

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: T.bg }}>
      <LiftHeader
        day={day}
        phase={phase}
        exerciseIdx={exerciseIdx}
        totalExercises={day.exercises.length}
        onExit={onExit}
      />
      {phase === "overview" && <LiftOverview day={day} onStart={() => setPhase("exercise")} />}
      {phase === "exercise" && (
        <ExerciseScreen
          key={exerciseIdx}
          day={day}
          exercise={day.exercises[exerciseIdx]}
          exerciseIdx={exerciseIdx}
          totalExercises={day.exercises.length}
          lastSession={lastSession}
          allSessions={sessions}
          onComplete={handleSetsDone}
        />
      )}
      {phase === "metcon" && (
        <EMOMClock metcon={day.metcon} accent={day.accent} onFinish={() => handleSave(completed, true)} />
      )}
    </div>
  );
};

/* ============================================================
   CARDIO / MOBILITY FLOW
   ============================================================ */
const CardioFlow = ({ day, week, onExit, onSave }) => {
  const [cardioDone, setCardioDone] = useState(false);
  const [mobChecked, setMobChecked] = useState(new Set());

  const toggle = (i) =>
    setMobChecked((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const handleFinish = async () => {
    await onSave({
      id: new Date().toISOString(),
      date: todayISO(),
      day: day.id,
      week,
      cardioDone,
      mobCompleted: mobChecked.size,
      totalVolume: 0,
    });
    onExit();
  };

  const allDone = cardioDone && mobChecked.size === day.mobility.length;

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: T.bg }}>
      <LiftHeader day={day} phase="exercise" exerciseIdx={0} totalExercises={1} onExit={onExit} />
      <div className="px-5 py-6 pb-32 space-y-4 slide-up">
        {/* Cardio block */}
        <Card className="p-5" style={{ borderColor: cardioDone ? T.success : day.accent, borderWidth: 2 }}>
          <div className="flex items-center gap-2 mb-2">
            <Heart size={18} color={day.accent} />
            <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>{day.cardio.title}</h3>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <Timer size={12} color={T.textFaint} />
              <span className="font-body text-sm" style={{ color: T.text }}>
                <span className="font-num font-bold">{day.cardio.duration} min</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Gauge size={12} color={T.textFaint} />
              <span className="font-body text-sm" style={{ color: T.text }}>HR {day.cardio.hr}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mountain size={12} color={T.textFaint} />
              <span className="font-body text-sm" style={{ color: T.text }}>Incline {day.cardio.incline}</span>
            </div>
            <div className="flex items-center gap-2">
              <Activity size={12} color={T.textFaint} />
              <span className="font-body text-sm" style={{ color: T.text }}>{day.cardio.speed}</span>
            </div>
          </div>
          <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: T.surfaceAlt }}>
            <p className="font-body text-xs leading-relaxed" style={{ color: T.textDim }}>{day.cardio.cue}</p>
          </div>
          <button
            onClick={() => setCardioDone((d) => !d)}
            className="w-full py-3 rounded-lg font-body font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition"
            style={{
              backgroundColor: cardioDone ? T.success : day.accent,
              color: "#0A0F14",
            }}
          >
            {cardioDone ? <><Check size={16} strokeWidth={3} /> Cardio Done</> : "Mark Cardio Done"}
          </button>
        </Card>

        {/* Mobility block */}
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Wind size={18} color={day.accent} />
              <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Mobility</h3>
            </div>
            <span className="font-num text-xs" style={{ color: T.textFaint }}>
              {mobChecked.size} / {day.mobility.length}
            </span>
          </div>
          <div className="space-y-1.5">
            {day.mobility.map((m, i) => {
              const done = mobChecked.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-lg transition-all active:scale-[0.99]"
                  style={{ backgroundColor: done ? `${T.success}15` : T.surfaceAlt }}
                >
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: done ? T.success : T.border }}
                  >
                    {done ? (
                      <Check size={14} color="#0A0F14" strokeWidth={3} />
                    ) : (
                      <span className="font-num font-bold text-xs" style={{ color: T.text }}>{i + 1}</span>
                    )}
                  </div>
                  <span className="font-body text-sm text-left flex-1" style={{ color: done ? T.success : T.text }}>{m}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <button
          onClick={handleFinish}
          disabled={!allDone}
          className="w-full py-5 rounded-xl font-display text-2xl uppercase tracking-wider flex items-center justify-center gap-2 active:scale-[0.98] transition disabled:opacity-40"
          style={{ backgroundColor: T.success, color: "#0A0F14" }}
        >
          {allDone ? "Save Session" : `Complete all to save`}
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   REST DAY VIEW
   ============================================================ */
const RestFlow = ({ day, week, onExit, onSave }) => {
  const [checked, setChecked] = useState(new Set());
  const toggle = (i) =>
    setChecked((s) => {
      const n = new Set(s);
      n.has(i) ? n.delete(i) : n.add(i);
      return n;
    });

  const handleFinish = async () => {
    await onSave({
      id: new Date().toISOString(),
      date: todayISO(),
      day: day.id,
      week,
      restChecks: checked.size,
      totalVolume: 0,
    });
    onExit();
  };

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: T.bg }}>
      <LiftHeader day={day} phase="exercise" exerciseIdx={0} totalExercises={1} onExit={onExit} />
      <div className="px-5 py-8 pb-32 slide-up">
        <div className="text-center mb-6">
          <div className="w-20 h-20 rounded-2xl mx-auto flex items-center justify-center mb-3" style={{ backgroundColor: `${T.rest}22` }}>
            <Bed size={36} color={T.rest} />
          </div>
          <h2 className="font-display text-4xl uppercase tracking-wider" style={{ color: T.text }}>{day.rest.title}</h2>
          <p className="font-body text-sm mt-2 max-w-xs mx-auto leading-relaxed" style={{ color: T.textDim }}>{day.rest.note}</p>
        </div>

        <Card className="p-5 mb-5">
          <div className="font-body text-[10px] uppercase tracking-widest font-bold mb-3" style={{ color: T.textFaint }}>
            Recovery Checklist
          </div>
          <div className="space-y-2">
            {day.rest.checklist.map((c, i) => {
              const done = checked.has(i);
              return (
                <button
                  key={i}
                  onClick={() => toggle(i)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg transition-all active:scale-[0.99]"
                  style={{ backgroundColor: done ? `${T.success}15` : T.surfaceAlt }}
                >
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: done ? T.success : T.border }}
                  >
                    {done && <Check size={14} color="#0A0F14" strokeWidth={3} />}
                  </div>
                  <span className="font-body text-sm text-left flex-1" style={{ color: done ? T.success : T.text }}>{c}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <button
          onClick={handleFinish}
          className="w-full py-4 rounded-xl font-display text-xl uppercase tracking-wider active:scale-[0.98] transition"
          style={{ backgroundColor: T.rest, color: "#0A0F14" }}
        >
          Log Rest Day
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   PROGRESS TAB
   ============================================================ */
const ProgressView = ({ sessions, bodyWeights, onLogBodyWeight }) => {
  const [bwInput, setBwInput] = useState("");
  const [showBwForm, setShowBwForm] = useState(false);

  const volumeData = useMemo(() => {
    return sessions
      .filter((s) => s.totalVolume > 0)
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((s) => ({ date: s.date.slice(5), volume: s.totalVolume, day: s.day }));
  }, [sessions]);

  const bwData = useMemo(() => {
    return bodyWeights
      .slice()
      .sort((a, b) => (a.date < b.date ? -1 : 1))
      .map((b) => ({ date: b.date.slice(5), weight: b.weight }));
  }, [bodyWeights]);

  const liftingSessions = sessions.filter((s) => s.totalVolume > 0).length;
  const cardioSessions = sessions.filter((s) => s.cardioDone !== undefined).length;
  const totalVolume = sessions.reduce((s, x) => s + (x.totalVolume || 0), 0);

  const handleSave = async () => {
    const w = Number(bwInput);
    if (w > 0) {
      await onLogBodyWeight(w);
      setBwInput("");
      setShowBwForm(false);
    }
  };

  return (
    <div className="px-5 pb-32 space-y-4 slide-up">
      <div className="grid grid-cols-3 gap-2">
        <Card className="p-3">
          <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>Lifts</div>
          <div className="font-num font-bold text-2xl mt-1" style={{ color: T.text }}>{liftingSessions}</div>
        </Card>
        <Card className="p-3">
          <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>Cardio</div>
          <div className="font-num font-bold text-2xl mt-1" style={{ color: T.text }}>{cardioSessions}</div>
        </Card>
        <Card className="p-3">
          <div className="font-body text-[9px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>Volume</div>
          <div className="font-num font-bold text-2xl mt-1" style={{ color: T.text }}>
            {(totalVolume / 1000).toFixed(1)}<span className="text-sm" style={{ color: T.textFaint }}>k</span>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Body Weight</h3>
            <p className="font-body text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>lb · over time</p>
          </div>
          <button onClick={() => setShowBwForm((s) => !s)} className="w-9 h-9 rounded-lg flex items-center justify-center active:scale-95" style={{ backgroundColor: T.accent }}>
            <Plus size={18} color="#0A0F14" />
          </button>
        </div>
        {showBwForm && (
          <div className="flex gap-2 mb-3 slide-up">
            <input
              type="number"
              step="0.1"
              inputMode="decimal"
              value={bwInput}
              onChange={(e) => setBwInput(e.target.value)}
              placeholder="lb"
              className="flex-1 font-num font-bold text-lg rounded-lg px-3 py-2.5 outline-none"
              style={{ backgroundColor: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}
            />
            <button onClick={handleSave} className="px-5 rounded-lg font-body font-bold text-sm active:scale-95" style={{ backgroundColor: T.success, color: "#0A0F14" }}>
              Save
            </button>
          </div>
        )}
        {bwData.length === 0 ? (
          <div className="h-32 flex items-center justify-center font-body text-sm" style={{ color: T.textFaint }}>
            Tap + to log first weigh-in
          </div>
        ) : (
          <div className="h-44 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={bwData} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} domain={["dataMin - 1", "dataMax + 1"]} />
                <Tooltip contentStyle={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: T.text }} itemStyle={{ color: T.accent }} />
                <Line type="monotone" dataKey="weight" stroke={T.accent} strokeWidth={2} dot={{ fill: T.accent, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3">
          <h3 className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Lifting Volume</h3>
          <p className="font-body text-[10px] uppercase tracking-widest" style={{ color: T.textFaint }}>weight × reps · per session</p>
        </div>
        {volumeData.length === 0 ? (
          <div className="h-32 flex items-center justify-center font-body text-sm" style={{ color: T.textFaint }}>
            Complete a lift to see the curve
          </div>
        ) : (
          <div className="h-44 -ml-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={volumeData} margin={{ top: 10, right: 12, bottom: 5, left: 0 }}>
                <CartesianGrid stroke={T.border} strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke={T.textFaint} fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: T.surfaceAlt, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 12 }} labelStyle={{ color: T.text }} itemStyle={{ color: T.warn }} />
                <Line type="monotone" dataKey="volume" stroke={T.warn} strokeWidth={2} dot={{ fill: T.warn, r: 3 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

      {sessions.length > 0 && (
        <div>
          <h3 className="font-display text-lg uppercase tracking-wider mb-2 px-1" style={{ color: T.text }}>Recent Sessions</h3>
          <div className="space-y-2">
            {sessions
              .slice()
              .sort((a, b) => (a.date < b.date ? 1 : -1))
              .slice(0, 6)
              .map((s) => {
                const day = PROGRAM[s.day];
                if (!day) return null;
                const Icon = day.icon;
                return (
                  <Card key={s.id} className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${day.accent}22`, color: day.accent }}>
                      <Icon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-body font-semibold text-[14px]" style={{ color: T.text }}>
                        {day.name} <span className="font-normal" style={{ color: T.textFaint }}>· W{s.week}</span>
                      </div>
                      <div className="font-num text-[10px]" style={{ color: T.textFaint }}>{s.date}</div>
                    </div>
                    <div className="text-right">
                      {s.totalVolume > 0 ? (
                        <>
                          <div className="font-num font-bold text-sm" style={{ color: T.text }}>{s.totalVolume.toLocaleString()}</div>
                          <div className="font-body text-[9px] uppercase tracking-wider" style={{ color: T.textFaint }}>lb vol</div>
                        </>
                      ) : (
                        <Check size={18} color={T.success} strokeWidth={3} />
                      )}
                    </div>
                  </Card>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ============================================================
   SETTINGS
   ============================================================ */
const SettingsView = ({ bodyWeight, setBodyWeight, week, setWeek, onReset }) => {
  const [confirm, setConfirm] = useState(false);
  return (
    <div className="px-5 pb-32 space-y-4 slide-up">
      <Card className="p-5">
        <h3 className="font-display text-lg uppercase tracking-wider mb-4" style={{ color: T.text }}>Profile</h3>
        <div className="space-y-3">
          <div>
            <label className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              Body Weight (lb)
            </label>
            <input
              type="number"
              step="0.1"
              value={bodyWeight}
              onChange={(e) => setBodyWeight(Number(e.target.value) || 0)}
              className="w-full font-num font-bold text-2xl rounded-lg px-4 py-3 mt-1 outline-none"
              style={{ backgroundColor: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}
            />
            <div className="font-body text-xs mt-1" style={{ color: T.textFaint }}>
              Protein target: {Math.round(bodyWeight)}g per day
            </div>
          </div>
          <div>
            <label className="font-body text-[10px] uppercase tracking-widest font-bold" style={{ color: T.textFaint }}>
              Current Week (1–6, then deload)
            </label>
            <input
              type="number"
              min="1"
              max="7"
              value={week}
              onChange={(e) => setWeek(Math.min(7, Math.max(1, Number(e.target.value) || 1)))}
              className="w-full font-num font-bold text-2xl rounded-lg px-4 py-3 mt-1 outline-none"
              style={{ backgroundColor: T.surfaceAlt, color: T.text, border: `1px solid ${T.border}` }}
            />
            <div className="font-body text-xs mt-1" style={{ color: T.textFaint }}>
              {week <= 6 ? `Block: training` : "Week 7: deload (50% volume, 70% intensity)"}
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg uppercase tracking-wider mb-2" style={{ color: T.text }}>Progression Rule</h3>
        <p className="font-body text-sm leading-relaxed" style={{ color: T.textDim }}>
          Hit the top of the rep range at the prescribed RPE for <span className="font-bold" style={{ color: T.text }}>two sessions in a row</span> → add 2.5–5 lb to the bar or move up a DB. The app tracks consecutive hits and tells you when you've earned the load.
        </p>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg uppercase tracking-wider mb-2" style={{ color: T.text }}>Warning Signs</h3>
        <p className="font-body text-xs mb-2" style={{ color: T.textFaint }}>Take an extra rest day if any of these appear:</p>
        <ul className="space-y-1.5">
          {[
            "Sharp joint pain (not muscle soreness)",
            "Sleep disturbance for 3+ nights",
            "Resting HR elevated 8+ bpm above baseline",
          ].map((s, i) => (
            <li key={i} className="flex gap-2 items-start">
              <span className="w-1 h-1 rounded-full mt-2 flex-shrink-0" style={{ backgroundColor: T.danger }} />
              <span className="font-body text-sm" style={{ color: T.text }}>{s}</span>
            </li>
          ))}
        </ul>
      </Card>

      <Card className="p-5">
        <h3 className="font-display text-lg uppercase tracking-wider mb-2" style={{ color: T.text }}>Reset Data</h3>
        <p className="font-body text-xs mb-3" style={{ color: T.textFaint }}>
          Wipes all logged sessions, body weight history, and habits. Settings stay.
        </p>
        {!confirm ? (
          <button onClick={() => setConfirm(true)} className="w-full py-3 rounded-lg font-body font-bold text-sm flex items-center justify-center gap-2 active:scale-95" style={{ backgroundColor: T.surfaceAlt, color: T.text }}>
            <RotateCcw size={14} /> Reset everything
          </button>
        ) : (
          <div className="flex gap-2">
            <button onClick={() => setConfirm(false)} className="flex-1 py-3 rounded-lg font-body font-bold text-sm active:scale-95" style={{ backgroundColor: T.surfaceAlt, color: T.text }}>
              Cancel
            </button>
            <button onClick={async () => { await onReset(); setConfirm(false); }} className="flex-1 py-3 rounded-lg font-body font-bold text-sm active:scale-95" style={{ backgroundColor: T.danger, color: "#fff" }}>
              Confirm
            </button>
          </div>
        )}
      </Card>
    </div>
  );
};

/* ============================================================
   BOTTOM NAV
   ============================================================ */
const BottomNav = ({ view, setView }) => {
  const tabs = [
    { id: "home", label: "Today", Icon: Home },
    { id: "progress", label: "Progress", Icon: TrendingUp },
    { id: "settings", label: "Settings", Icon: SettingsIcon },
  ];
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30" style={{ backgroundColor: T.surface, borderTop: `1px solid ${T.border}` }}>
      <div className="max-w-md mx-auto flex">
        {tabs.map(({ id, label, Icon }) => {
          const active = view === id;
          return (
            <button key={id} onClick={() => setView(id)} className="flex-1 flex flex-col items-center gap-1 py-3 active:scale-95">
              <Icon size={20} color={active ? T.accent : T.textFaint} strokeWidth={active ? 2.5 : 2} />
              <span className="font-body text-[11px]" style={{ color: active ? T.accent : T.textFaint, fontWeight: active ? 700 : 500 }}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};

/* ============================================================
   IOS INSTALL HINT
   ============================================================ */
const IOSInstallHint = () => {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const ua = window.navigator.userAgent;
    const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    const isStandalone = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true;
    const dismissed = window.localStorage.getItem("ma_install_dismissed") === "1";
    if (isIOS && !isStandalone && !dismissed) {
      const t = setTimeout(() => setShow(true), 800);
      return () => clearTimeout(t);
    }
  }, []);
  if (!show) return null;
  return (
    <div className="fixed bottom-[78px] left-3 right-3 z-40 mx-auto max-w-md slide-up">
      <div className="rounded-xl p-3.5 shadow-2xl flex items-center gap-3" style={{ backgroundColor: T.accent, color: "#0A0F14" }}>
        <div className="w-9 h-9 rounded-lg bg-black/10 flex items-center justify-center flex-shrink-0">
          <Share size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-display text-base uppercase tracking-wider leading-tight">Install App</div>
          <div className="font-body text-[11px] mt-0.5 leading-snug opacity-80">
            Tap <Share size={10} className="inline -mt-0.5 mx-0.5" /> Share → <span className="font-bold">Add to Home Screen</span>
          </div>
        </div>
        <button
          onClick={() => { window.localStorage.setItem("ma_install_dismissed", "1"); setShow(false); }}
          className="w-8 h-8 rounded-full bg-black/10 flex items-center justify-center active:scale-95 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

/* ============================================================
   MAIN APP
   ============================================================ */
export default function App() {
  const [hydrated, setHydrated] = useState(false);
  const [view, setView] = useState("home");
  const [activeDay, setActiveDay] = useState(null);

  const [week, setWeek] = useState(1);
  const [bodyWeight, setBodyWeight] = useState(180);
  const [sessions, setSessions] = useState([]);
  const [bodyWeights, setBodyWeights] = useState([]);
  const [habits, setHabits] = useState({ sleep: false, protein: false, steps: false, date: todayISO() });

  useEffect(() => {
    setWeek(storage.get("ma_week", 1));
    setBodyWeight(storage.get("ma_bodyweight", 180));
    setSessions(storage.get("ma_sessions", []));
    setBodyWeights(storage.get("ma_bodyweights", []));
    const hb = storage.get("ma_habits", { sleep: false, protein: false, steps: false, date: todayISO() });
    if (hb?.date !== todayISO()) setHabits({ sleep: false, protein: false, steps: false, date: todayISO() });
    else setHabits(hb);
    setHydrated(true);
  }, []);

  useEffect(() => { if (hydrated) storage.set("ma_week", week); }, [week, hydrated]);
  useEffect(() => { if (hydrated) storage.set("ma_bodyweight", bodyWeight); }, [bodyWeight, hydrated]);
  useEffect(() => { if (hydrated) storage.set("ma_sessions", sessions); }, [sessions, hydrated]);
  useEffect(() => { if (hydrated) storage.set("ma_bodyweights", bodyWeights); }, [bodyWeights, hydrated]);
  useEffect(() => { if (hydrated) storage.set("ma_habits", habits); }, [habits, hydrated]);

  const toggleHabit = (k) => setHabits((h) => ({ ...h, [k]: !h[k], date: todayISO() }));
  const saveSession = (s) => setSessions((prev) => [...prev, s]);
  const logBodyWeight = (w) => {
    setBodyWeights((prev) => [...prev, { date: todayISO(), weight: w }]);
    setBodyWeight(w);
  };
  const resetData = () => {
    storage.clear(["ma_sessions", "ma_bodyweights", "ma_habits"]);
    setSessions([]);
    setBodyWeights([]);
    setHabits({ sleep: false, protein: false, steps: false, date: todayISO() });
  };

  // Two-consecutive-session level-ups per day (per the program's progression rule)
  const levelUpByDay = useMemo(() => {
    const out = {};
    DAY_ORDER.forEach((k) => {
      out[k] = 0;
      const day = PROGRAM[k];
      if (day.type !== "lift") return;
      day.exercises.forEach((ex) => {
        if (checkConsecutiveLevelUps(sessions, k, ex.id, ex.repRange, ex.rpeTargetMax)) out[k]++;
      });
    });
    return out;
  }, [sessions]);

  if (!hydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center font-body" style={{ backgroundColor: T.bg }}>
        <div className="flex flex-col items-center gap-3">
          <ShieldCheck size={32} color={T.accent} />
          <div className="font-display text-lg uppercase tracking-wider" style={{ color: T.text }}>Loading…</div>
        </div>
      </div>
    );
  }

  if (activeDay) {
    const day = PROGRAM[activeDay];
    return (
      <div className="max-w-md mx-auto min-h-screen" style={{ backgroundColor: T.bg }}>
        {day.type === "lift" && (
          <LiftFlow day={day} week={week} sessions={sessions} onExit={() => setActiveDay(null)} onSave={saveSession} />
        )}
        {day.type === "cardio" && (
          <CardioFlow day={day} week={week} onExit={() => setActiveDay(null)} onSave={saveSession} />
        )}
        {day.type === "rest" && (
          <RestFlow day={day} week={week} onExit={() => setActiveDay(null)} onSave={saveSession} />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen font-body" style={{ backgroundColor: T.bg }}>
      <div className="max-w-md mx-auto">
        <Header block="Block 1" week={week} />
        {view === "home" && (
          <Dashboard
            week={week}
            habits={habits}
            toggleHabit={toggleHabit}
            bodyWeight={bodyWeight}
            sessions={sessions}
            onStart={setActiveDay}
            levelUpByDay={levelUpByDay}
          />
        )}
        {view === "progress" && (
          <ProgressView sessions={sessions} bodyWeights={bodyWeights} onLogBodyWeight={logBodyWeight} />
        )}
        {view === "settings" && (
          <SettingsView bodyWeight={bodyWeight} setBodyWeight={setBodyWeight} week={week} setWeek={setWeek} onReset={resetData} />
        )}
      </div>
      <IOSInstallHint />
      <BottomNav view={view} setView={setView} />
    </div>
  );
}
