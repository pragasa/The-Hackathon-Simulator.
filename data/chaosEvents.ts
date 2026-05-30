/**
 * @file Curated Database of 25 unique, weighted Chaos Events for Update v1.1
 * Includes realistic tradeoffs impacting score categories and timer pressure.
 *
 * @module data/chaosEvents
 */

import type { ChaosEvent } from "@/types/game";

export const CHAOS_EVENTS: ChaosEvent[] = [
  // ─── Technical Problems (8 events) ──────────────────────────────────────────
  {
    id: "tech-api-rate",
    title: "API Rate Limit Hit",
    description: "The third-party API model you planned to use just rate limited your app's sandbox keys. The sandbox compiler is dropping requests.",
    category: "technical",
    weight: 10,
    choices: [
      {
        label: "Simplify Features",
        description: "Strip out the real-time API dependency. Compile static mock pipelines instead.",
        effectText: "Execution +15, Innovation -10, Time remaining +30s",
        modifiers: { execution: 15, innovation: -10, timeOffset: 30 }
      },
      {
        label: "Push Through",
        description: "Re-index queries and grind. Build a custom request cache lattice over the API.",
        effectText: "Innovation +15, Execution -10, Time remaining -45s",
        modifiers: { innovation: 15, execution: -10, timeOffset: -45 }
      }
    ]
  },
  {
    id: "tech-db-crash",
    title: "Database Crash",
    description: "Your local database cluster just corrupted due to un-indexed write locks on simultaneous requests.",
    category: "technical",
    weight: 10,
    choices: [
      {
        label: "Patch Quickly",
        description: "Apply a lightweight local storage fallback state. Bypass the complex cluster entirely.",
        effectText: "Execution +12, Design -8, Time remaining +15s",
        modifiers: { execution: 12, design: -8, timeOffset: 15 }
      },
      {
        label: "Rebuild Properly",
        description: "Reset the PostgreSQL lattice and index the tables properly. Run a complete data migration.",
        effectText: "Design +15, Execution +10, Time remaining -60s",
        modifiers: { design: 15, execution: 10, timeOffset: -60 }
      }
    ]
  },
  {
    id: "tech-deploy-down",
    title: "Deployment Downtime",
    description: "The deployment provider (Vercel) is throwing 502 server errors on static route renders.",
    category: "technical",
    weight: 10,
    choices: [
      {
        label: "Ship Lean MVP",
        description: "Disable heavy edge computations and ship a basic client-side render bundle.",
        effectText: "Execution +10, Innovation -5, Time remaining +20s",
        modifiers: { execution: 10, innovation: -5, timeOffset: 20 }
      },
      {
        label: "Fix Route Configs",
        description: "Audit route parameters and rewrite microservice adapters in server configs.",
        effectText: "Execution +15, Pitch -5, Time remaining -40s",
        modifiers: { execution: 15, pitch: -5, timeOffset: -40 }
      }
    ]
  },
  {
    id: "tech-depend-hell",
    title: "Package Dependency Hell",
    description: "A conflict between active package imports is throwing null pointer errors during compile bundling.",
    category: "technical",
    weight: 8,
    choices: [
      {
        label: "Downgrade Packages",
        description: "Roll back to a stable, older package compilation lock. Safe but lacks modern API properties.",
        effectText: "Execution +12, Design -6",
        modifiers: { execution: 12, design: -6 }
      },
      {
        label: "Resolve Trees",
        description: "Spend time manually overriding config trees and auditing import branches.",
        effectText: "Innovation +10, Execution +5, Time remaining -30s",
        modifiers: { innovation: 10, execution: 5, timeOffset: -30 }
      }
    ]
  },
  {
    id: "tech-css-bug",
    title: "CSS Alignment Blunder",
    description: "A grid spacing conflict has completely broken your landing container columns on Safari screens.",
    category: "technical",
    weight: 8,
    choices: [
      {
        label: "Quick Patch",
        description: "Apply absolute center floats. Looks fine but is non-responsive on tablets.",
        effectText: "Design +5, Time remaining +20s",
        modifiers: { design: 5, timeOffset: 20 }
      },
      {
        label: "Rewrite Grid",
        description: "Refactor custom flex containers and adjust standard margins. Polished but takes time.",
        effectText: "Design +18, Execution -5, Time remaining -30s",
        modifiers: { design: 18, execution: -5, timeOffset: -30 }
      }
    ]
  },
  {
    id: "tech-merge-conflict",
    title: "Git Merge Conflict",
    description: "Merging features branch into base main has overwritten 150 lines of core compiler state code.",
    category: "technical",
    weight: 8,
    choices: [
      {
        label: "Force Push Main",
        description: "Discard conflicting commits and push base code. Loses recent frontend changes.",
        effectText: "Execution +10, Design -10",
        modifiers: { execution: 10, design: -10 }
      },
      {
        label: "Manual Resolution",
        description: "Sit down and merge line-by-line using git diff diagnostic locks.",
        effectText: "Execution +15, Design +10, Time remaining -45s",
        modifiers: { execution: 15, design: 10, timeOffset: -45 }
      }
    ]
  },
  {
    id: "tech-aws-bill",
    title: "AWS Server Cost Spike",
    description: "An infinite fetch loop in your background pipeline has billed your sponsor credit keys $350 in 30 minutes.",
    category: "technical",
    weight: 5,
    choices: [
      {
        label: "Throttle Request Pools",
        description: "Instantly clamp baseline request limits and throttle server query allocations.",
        effectText: "Execution -10, Time remaining +30s",
        modifiers: { execution: -10, timeOffset: 30 }
      },
      {
        label: "Refactor Loop",
        description: "Rewrite the pipeline query intervals to cache server calls properly.",
        effectText: "Execution +15, Design +5, Time remaining -40s",
        modifiers: { execution: 15, design: 5, timeOffset: -40 }
      }
    ]
  },
  {
    id: "tech-ssl-expired",
    title: "SSL Certificate Expired",
    description: "Your local sandbox proxy endpoint is warning users of unsecured connections, blocking key browser requests.",
    category: "technical",
    weight: 6,
    choices: [
      {
        label: "Bypass SSL",
        description: "Re-route standard requests through HTTP endpoints. Less secure but immediate.",
        effectText: "Execution +10, Pitch -8",
        modifiers: { execution: 10, pitch: -8 }
      },
      {
        label: "Renew Certificate",
        description: "Register updated security keys and deploy verification tokens.",
        effectText: "Execution +12, Pitch +10, Time remaining -30s",
        modifiers: { execution: 12, pitch: 10, timeOffset: -30 }
      }
    ]
  },

  // ─── Team Chaos (7 events) ──────────────────────────────────────────────────
  {
    id: "team-disappeared",
    title: "Teammate Disappeared",
    description: "Your primary frontend teammate has logged off and is completely unreachable. They fell asleep.",
    category: "team",
    weight: 10,
    choices: [
      {
        label: "Cut Visual Scope",
        description: "Drop complex animations. Stick to the basic wireframe components.",
        effectText: "Execution +12, Design -10, Time remaining +30s",
        modifiers: { execution: 12, design: -10, timeOffset: 30 }
      },
      {
        label: "Double Down Solo",
        description: "Write the visual styles yourself. Grind out Safari configurations.",
        effectText: "Design +12, Pitch -8, Time remaining -50s",
        modifiers: { design: 12, pitch: -8, timeOffset: -50 }
      }
    ]
  },
  {
    id: "team-mentor-unavail",
    title: "Mentor Unavailable",
    description: "The engineering mentor you planned to consult is locked in an investor panel. No advice is reachable.",
    category: "team",
    weight: 9,
    choices: [
      {
        label: "Proceed Blindly",
        description: "Keep compiling the project according to current specifications without external reviews.",
        effectText: "Execution +5, Innovation +5",
        modifiers: { execution: 5, innovation: 5 }
      },
      {
        label: "Wait for Opening",
        description: "Pause and wait near the jury panel rooms. You lose time but secure critical insights.",
        effectText: "Pitch +12, Time remaining -40s",
        modifiers: { pitch: 12, timeOffset: -40 }
      }
    ]
  },
  {
    id: "team-pivot-idea",
    title: "Last-Minute Pivot Idea",
    description: "A teammate pitches a brilliant new application pivot direction. Implementing it requires discarding key features.",
    category: "team",
    weight: 7,
    choices: [
      {
        label: "Execute Pivot",
        description: "Pivot features now! Re-compile under a brand new startup direction.",
        effectText: "Innovation +25, Execution -20, Design -10",
        modifiers: { innovation: 25, execution: -20, design: -10 }
      },
      {
        label: "Stay Focused",
        description: "Decline the pivot. Stay disciplined and ship your active MVP.",
        effectText: "Execution +15, Innovation -5, Time remaining +15s",
        modifiers: { execution: 15, innovation: -5, timeOffset: 15 }
      }
    ]
  },
  {
    id: "team-scope-argument",
    title: "Scope Argument",
    description: "The team is locked in an intense argument about whether to allocate effort to payment models or maps.",
    category: "team",
    weight: 8,
    choices: [
      {
        label: "Compromise (Build Both)",
        description: "Try to incorporate both features. Stretches developer bandwidth to the limit.",
        effectText: "Innovation +12, Execution -15, Time remaining -30s",
        modifiers: { innovation: 12, execution: -15, timeOffset: -30 }
      },
      {
        label: "Enforce Executive Order",
        description: "Make a final executive choice: eject payments completely and focus on maps.",
        effectText: "Execution +15, Pitch -5",
        modifiers: { execution: 15, pitch: -5 }
      }
    ]
  },
  {
    id: "team-coffee-spill",
    title: "Keyboard Coffee Spill",
    description: "A coffee cup is knocked over, soaking your primary mechanical keyboard in espresso.",
    category: "team",
    weight: 6,
    choices: [
      {
        label: "Use Laptop Keyboard",
        description: "Typing speeds decrease. Coding becomes tedious.",
        effectText: "Execution -8, Time remaining -20s",
        modifiers: { execution: -8, timeOffset: -20 }
      },
      {
        label: "Borrow Backup Board",
        description: "Beg adjacent teams for a spare keyboard, costing social capital.",
        effectText: "Pitch -5, Time remaining +10s",
        modifiers: { pitch: -5, timeOffset: 10 }
      }
    ]
  },
  {
    id: "team-fatigue",
    title: "Developer Burnout",
    description: "Your team is completely exhausted. Caffeine levels have crashed, and brain fog is setting in.",
    category: "team",
    weight: 7,
    choices: [
      {
        label: "Power Nap",
        description: "Take a mandatory 15-minute nap. Developer energy restores.",
        effectText: "Execution +12, Time remaining -45s",
        modifiers: { execution: 12, timeOffset: -45 }
      },
      {
        label: "Grind on Energy Drinks",
        description: "Force the team to stay awake. Modifiers get erratic.",
        effectText: "Design -10, Pitch -5, Bonus +5",
        modifiers: { design: -10, pitch: -5, bonus: 5 }
      }
    ]
  },
  {
    id: "team-assets-lost",
    title: "Design Assets Lost",
    description: "The shared Figma layout files were accidentally deleted by an guest editor.",
    category: "team",
    weight: 7,
    choices: [
      {
        label: "Recopy Cached Assets",
        description: "Scrape locally cached screenshots. Muted but functional.",
        effectText: "Design -8, Execution +5",
        modifiers: { design: -8, execution: 5 }
      },
      {
        label: "Redraw Interfaces",
        description: "Spend time rebuilding margins and column guides from memory.",
        effectText: "Design +15, Time remaining -30s",
        modifiers: { design: 15, timeOffset: -30 }
      }
    ]
  },

  // ─── Lucky Breaks (6 events) ────────────────────────────────────────────────
  {
    id: "lucky-sponsor-api",
    title: "Sponsor API Unlocked",
    description: "The sponsor team has released a highly polished API model with outstanding compile wrappers.",
    category: "lucky",
    weight: 10,
    choices: [
      {
        label: "Adopt Sponsor API",
        description: "Integrate the model for instant innovation boosts and jury sponsorship matches.",
        effectText: "Innovation +20, Execution +5, Bonus +10",
        modifiers: { innovation: 20, execution: 5, bonus: 10 }
      },
      {
        label: "Ignore (Stay Lean)",
        description: "Stay focused on your active pipeline configurations.",
        effectText: "Execution +10, Time remaining +15s",
        modifiers: { execution: 10, timeOffset: 15 }
      }
    ]
  },
  {
    id: "lucky-mentor-impressed",
    title: "Mentor Impressed",
    description: "A visiting lead designer reviews your prototype and is extremely impressed by your Typography Scale.",
    category: "lucky",
    weight: 10,
    choices: [
      {
        label: "Ask for Feedback",
        description: "Spend time absorbing their design reviews.",
        effectText: "Design +15, Pitch +5, Time remaining -15s",
        modifiers: { design: 15, pitch: 5, timeOffset: -15 }
      },
      {
        label: "Secure Introduction",
        description: "Leverage the contact to pitch to high-end jury angels.",
        effectText: "Pitch +18, Bonus +8",
        modifiers: { pitch: 18, bonus: 8 }
      }
    ]
  },
  {
    id: "lucky-judge-match",
    title: "Jury Category Match",
    description: "An adjacent team whispers that the active jury panel is heavily biased towards your chosen category.",
    category: "lucky",
    weight: 10,
    choices: [
      {
        label: "Optimize Pitch Alignment",
        description: "Rewrite talking points to double down on target constraints.",
        effectText: "Pitch +15, Bonus +5",
        modifiers: { pitch: 15, bonus: 5 }
      },
      {
        label: "Polish Demo UX",
        description: "Stay dedicated to making layout features run smoothly.",
        effectText: "Design +12, Execution +5",
        modifiers: { design: 12, execution: 5 }
      }
    ]
  },
  {
    id: "lucky-copilot-beta",
    title: "GitHub Copilot Unlocked",
    description: "You just received a high-speed beta access token to an advanced AI coding coprocessor.",
    category: "lucky",
    weight: 8,
    choices: [
      {
        label: "Leverage AI Coding",
        description: "Auto-generate query configs and data adapters. Speeds up compiler writes.",
        effectText: "Execution +18, Time remaining +45s",
        modifiers: { execution: 18, timeOffset: 45 }
      },
      {
        label: "Review Suggestions",
        description: "Use it strictly to write test suites and audit database bugs.",
        effectText: "Design +10, Execution +10",
        modifiers: { design: 10, execution: 10 }
      }
    ]
  },
  {
    id: "lucky-shared-sandbox",
    title: "Shared Sandbox",
    description: "A friendly neighboring developer shares a highly optimized, custom docker server config.",
    category: "lucky",
    weight: 8,
    choices: [
      {
        label: "Deploy Sandbox",
        description: "Host static structures instantly on their sandbox server.",
        effectText: "Execution +12, Time remaining +30s",
        modifiers: { execution: 12, timeOffset: 30 }
      },
      {
        label: "Politely Decline",
        description: "Stick to your own local, secured cluster setups.",
        effectText: "Execution +5, Design +5",
        modifiers: { execution: 5, design: 5 }
      }
    ]
  },
  {
    id: "lucky-coffee-delivery",
    title: "Surprise Coffee Delivery",
    description: "An event organizer drops off a fresh tray of premium iced coffees right at your desk.",
    category: "lucky",
    weight: 9,
    choices: [
      {
        label: "Drink up instantly",
        description: "Developers surge in energy and focus levels.",
        effectText: "Execution +10, Time remaining +20s",
        modifiers: { execution: 10, timeOffset: 20 }
      },
      {
        label: "Distribute to neighbors",
        description: "Build exceptional relationships with neighboring startup teams.",
        effectText: "Pitch +12, Bonus +5",
        modifiers: { pitch: 12, bonus: 5 }
      }
    ]
  },

  // ─── Judge Surprises (4 events) ─────────────────────────────────────────────
  {
    id: "judge-sustainability",
    title: "New Jury Mandate: Sustainability",
    description: "The lead judge announces that environmental offset footprints now hold double weighting in scoring.",
    category: "judge",
    weight: 8,
    choices: [
      {
        label: "Optimize Green Operations",
        description: "Adopt low-emission server templates and throttle background sync loops.",
        effectText: "Innovation +12, Execution -10, Bonus +10",
        modifiers: { innovation: 12, execution: -10, bonus: 10 }
      },
      {
        label: "Highlight Eco USP",
        description: "Incorporate carbon offsets directly into your elevator pitch summary.",
        effectText: "Pitch +15, Design +5",
        modifiers: { pitch: 15, design: 5 }
      }
    ]
  },
  {
    id: "judge-opensource",
    title: "New Jury Mandate: Open Source",
    description: "Jury announces that public, open source repository deployments qualify for special compiling bonuses.",
    category: "judge",
    weight: 8,
    choices: [
      {
        label: "Open Source Code base",
        description: "Publish all compiler modules on GitHub under public licenses.",
        effectText: "Innovation +15, Bonus +12",
        modifiers: { innovation: 15, bonus: 12 }
      },
      {
        label: "Stay Closed & Secured",
        description: "Retain intellectual properties in secure cloud sandbox directories.",
        effectText: "Execution +12, Design +5",
        modifiers: { execution: 12, design: 5 }
      }
    ]
  },
  {
    id: "judge-pitch-cut",
    title: "New Jury Mandate: 1-Min Pitch Limit",
    description: "Jury just announced that demo pitches are strictly capped at 60 seconds. Heavy penalties for scope creep.",
    category: "judge",
    weight: 7,
    choices: [
      {
        label: "Condense Presentation",
        description: "Compact talking points. Omit complex database explanations.",
        effectText: "Pitch +15, Innovation -8",
        modifiers: { pitch: 15, innovation: -8 }
      },
      {
        label: "Focus on Features Demo",
        description: "Eject slides and perform a fast, direct interface compilation walkthrough.",
        effectText: "Execution +12, Pitch +8, Time remaining -20s",
        modifiers: { execution: 12, pitch: 8, timeOffset: -20 }
      }
    ]
  },
  {
    id: "judge-accessibility",
    title: "New Jury Mandate: Accessibility",
    description: "Jury issues a mandate that all sandboxes must provide 100% keyboard navigation and focus structures.",
    category: "judge",
    weight: 8,
    choices: [
      {
        label: "Add ARIA & Focus States",
        description: "Spend bandwidth writing semantic tag guides and focus borders.",
        effectText: "Design +18, Execution -10, Time remaining -30s",
        modifiers: { design: 18, execution: -10, timeOffset: -30 }
      },
      {
        label: "Rely on Native Outlines",
        description: "Use basic browser native outlining. Less visual polish but free.",
        effectText: "Execution +10, Design -5",
        modifiers: { execution: 10, design: -5 }
      }
    ]
  }
];

/** Selects a weighted random chaos event excluding already triggered ones */
export function getRandomChaosEvent(excludeIds: string[] = []): ChaosEvent {
  const available = CHAOS_EVENTS.filter((e) => !excludeIds.includes(e.id));
  const pool = available.length > 0 ? available : CHAOS_EVENTS;

  const totalWeight = pool.reduce((acc, e) => acc + e.weight, 0);
  let roll = Math.random() * totalWeight;

  for (const event of pool) {
    roll -= event.weight;
    if (roll <= 0) {
      return event;
    }
  }
  return pool[0];
}
