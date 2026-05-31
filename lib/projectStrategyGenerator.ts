import type { Problem, Feature, TechItem } from '@/types/game';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface GeneratedUSP {
  key: "Fastest" | "Cheapest" | "Most Scalable" | "AI-powered" | "Sustainable" | "Hyper-personalized" | "Community-first";
  name: string;
  desc: string;
  innovation: number;
  execution: number;
  design: number;
  pitch: number;
  tradeoffInfo: string;
}

export interface GeneratedFeature extends Feature {
  dependsOn?: string; // ID of required feature
  dependsOnName?: string; // Display name of required feature
  innovationScore: number;
}

// ─── seeded random generator ──────────────────────────────────────────────────

function createSeededRandom(seedStr: string) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    let t = h += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Curated Vocabulary ──────────────────────────────────────────────────────

const VERBS = [
  "Predict", "Optimize", "Automate", "Streamline", "Audit", "Decentralize",
  "Scale", "Personalize", "Secure", "Synthesize", "Visualize", "Coordinate"
];

const ADJECTIVES = [
  "real-time", "context-aware", "frictionless", "distributed", "collaborative",
  "data-driven", "peer-to-peer", "eco-friendly", "highly-adaptive", "privacy-first"
];

const CATEGORY_NOUNS: Record<string, string[]> = {
  edtech: [
    "study planner", "recall graph", "spaced review compiler", "quiz deck builder",
    "lecture transcription pipeline", "hallucination firewall", "conceptual map", "skill matrix log"
  ],
  healthtech: [
    "clinical vital sync", "patient calendar", "sentiment mood tracker", "crisis alert router",
    "bed reservation locker", "HIPAA telemetry log", "stress marker tracker", "dispenser monitor"
  ],
  fintech: [
    "auditable expense split", "microlending cycle ledger", "double-entry ledger",
    "reputation scoring index", "retrospective savings engine", "debt-chain resolver", "audit reporter"
  ],
  sustainability: [
    "grid intensity tracker", "carbon offset ledger", "circular material tracer", "wattage optimizer",
    "agricultural soil monitor", "logistics carbon pathfinder", "emission calculator", "waste heat tracker"
  ],
  ai: [
    "multi-agent coprocessor", "cognitive voice dialect grid", "race condition debugger",
    "vector database retriever", "prompt firewall", "support logs index", "hallucination monitor"
  ],
  "smart-campus": [
    "dorm laundry queue tracker", "seat occupancy markers mesh", "seat reservation manager",
    "classroom coordinate mesh", "ambient noise indexer", "dining waste calculator", "load balancer"
  ]
};

// ─── USP Generator ──────────────────────────────────────────────────────────

/**
 * Procedurally generates 6-8 highly contextual USP options matching the project strategy.
 */
export function generateUSPOptions(
  problem: Problem | null,
  solutionDirection: string | null,
  techStack: TechItem[],
  gameMode: string,
  runSeed?: string
): GeneratedUSP[] {
  const seed = runSeed || (problem ? problem.id : "hackathon") + gameMode + techStack.map(t => t.id).join("");
  const rand = createSeededRandom(seed);

  const category = problem?.category || "ai";
  const nouns = CATEGORY_NOUNS[category] || CATEGORY_NOUNS.ai;

  const baseTemplates = [
    {
      key: "Fastest" as const,
      nameTpl: (noun: string) => `Zero-configuration ${noun} engine`,
      descTpl: (sol: string) => `Instant-compiling, low-latency ${sol || "prototype"} with minimal startup configs.`,
      innovation: 45, execution: 75, design: 55, pitch: 50
    },
    {
      key: "Cheapest" as const,
      nameTpl: (noun: string) => `Serverless, database-free ${noun}`,
      descTpl: (sol: string) => `Static offline files, avoiding complex cloud sync fees entirely.`,
      innovation: 50, execution: 70, design: 45, pitch: 50
    },
    {
      key: "Most Scalable" as const,
      nameTpl: (noun: string) => `Elastic event-driven ${noun} grid`,
      descTpl: (sol: string) => `Asynchronous edge queue mapping that handles high concurrent packet rates.`,
      innovation: 55, execution: 65, design: 50, pitch: 65
    },
    {
      key: "AI-powered" as const,
      nameTpl: (noun: string) => `Autonomous LLM-driven ${noun} agent`,
      descTpl: (sol: string) => `Deep cognitive vector classification for high innovation value.`,
      innovation: 80, execution: 50, design: 50, pitch: 65
    },
    {
      key: "Sustainable" as const,
      nameTpl: (noun: string) => `Carbon-neutral, eco-optimized ${noun}`,
      descTpl: (sol: string) => `High environmental offset footprints utilizing grid emissions sensors.`,
      innovation: 70, execution: 55, design: 55, pitch: 70
    },
    {
      key: "Hyper-personalized" as const,
      nameTpl: (noun: string) => `Context-adaptive dynamic ${noun}`,
      descTpl: (sol: string) => `Highly responsive screen visual designs tailored to student feedback profiles.`,
      innovation: 58, execution: 55, design: 78, pitch: 60
    },
    {
      key: "Community-first" as const,
      nameTpl: (noun: string) => `Cooperative peer-to-peer ${noun} mesh`,
      descTpl: (sol: string) => `Focuses on distributed local grids and open community trust loops.`,
      innovation: 65, execution: 55, design: 60, pitch: 72
    }
  ];

  // Pick random nouns and verbs to weave contextually
  const options = baseTemplates.map(tpl => {
    // Pick deterministic nouns/verbs based on seed
    const nounIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nounIdx];
    const noun = rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1);
    
    const name = tpl.nameTpl(noun);
    const desc = tpl.descTpl(solutionDirection || "application");

    // Add slight variance to standard modifier scores to encourage thinking (+/- 5 points)
    const variance = Math.floor(rand() * 11) - 5; // [-5, 5]
    
    // Apply standard Paper Terminal tradeoffs: high innovation decreases execution
    const baseInnovation = Math.max(20, Math.min(tpl.innovation + (tpl.key === "AI-powered" || tpl.key === "Sustainable" ? variance : -variance), 95));
    const baseExecution = Math.max(20, Math.min(tpl.execution + (tpl.key === "Fastest" || tpl.key === "Cheapest" ? variance : -variance), 95));
    const baseDesign = Math.max(20, Math.min(tpl.design + (tpl.key === "Hyper-personalized" ? variance : 0), 95));
    const basePitch = Math.max(20, Math.min(tpl.pitch + (tpl.key === "Community-first" ? variance : 0), 95));

    const tradeoffInfo = `// tradeoffs: ${baseInnovation >= 70 ? '+' : ''}${baseInnovation - 50} Innovation, ${baseExecution >= 70 ? '+' : ''}${baseExecution - 60} Execution, ${baseDesign >= 70 ? '+' : ''}${baseDesign - 55} Design`;

    return {
      key: tpl.key,
      name,
      desc,
      innovation: baseInnovation,
      execution: baseExecution,
      design: baseDesign,
      pitch: basePitch,
      tradeoffInfo
    };
  });

  // Shuffle and slice to get 6-7 options
  const count = 6 + Math.floor(rand() * 2); // 6 or 7
  return options.slice(0, count);
}

// ─── Backlog Generator ───────────────────────────────────────────────────────

/**
 * Procedurally generates a custom 10-12 feature backlog with dependency mappings,
 * distinct estimated build effort levels, and innovation tradeoffs.
 */
export function generateFeatureBacklog(
  problem: Problem | null,
  solutionDirection: string | null,
  chosenUSP: GeneratedUSP | null,
  techStack: TechItem[],
  runSeed?: string
): GeneratedFeature[] {
  const seed = (problem ? problem.id : "feat") + (chosenUSP ? chosenUSP.name : "usp") + (solutionDirection || "solution") + (runSeed || "classic");
  const rand = createSeededRandom(seed);

  const category = problem?.category || "ai";
  const nouns = CATEGORY_NOUNS[category] || CATEGORY_NOUNS.ai;

  // We will generate exactly 10 features:
  // - 4 Low complexity features (Base)
  // - 3 Medium complexity features
  // - 3 High complexity features (Advanced, some with dependencies)

  const features: GeneratedFeature[] = [];

  // ─── Generate 4 Low Complexity Baseline Features ───────────────────────────
  const baseVerbs = ["Secure", "Local", "Static", "Frictionless", "Manual", "Compact"];
  for (let i = 0; i < 4; i++) {
    const vIdx = Math.floor(rand() * baseVerbs.length);
    const verb = baseVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-base-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Core telemetry logging layers and lightweight ${rawNoun} layouts for standard hackathon MVPs.`;
    
    features.push({
      id,
      name,
      description,
      effort: 'low',
      impact: rand() > 0.5 ? 'low' : 'medium',
      innovationScore: 10 + Math.floor(rand() * 15), // 10-25
    });
  }

  // ─── Generate 3 Medium Complexity Features ────────────────────────────────
  const medVerbs = ["Real-time", "Analytical", "Integrated", "Interactive", "Cooperative", "Responsive"];
  for (let i = 0; i < 3; i++) {
    const vIdx = Math.floor(rand() * medVerbs.length);
    const verb = medVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-med-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Real-time synchronization grids and interactive analytics dashboards to parse student ${rawNoun} logs.`;
    
    features.push({
      id,
      name,
      description,
      effort: 'medium',
      impact: rand() > 0.4 ? 'medium' : 'high',
      innovationScore: 25 + Math.floor(rand() * 20), // 25-45
    });
  }

  // ─── Generate 3 High Complexity Advanced Features (some with dependencies) ─────
  const advVerbs = ["AI-driven", "Predictive", "Immersive AR", "Distributed Ledger", "Multi-Agent", "Autonomous"];
  for (let i = 0; i < 3; i++) {
    const vIdx = Math.floor(rand() * advVerbs.length);
    const verb = advVerbs[vIdx];
    const nIdx = Math.floor(rand() * nouns.length);
    const rawNoun = nouns[nIdx];
    
    const id = `feat-adv-${i}-${rawNoun.slice(0, 5)}`;
    const name = `${verb} ${rawNoun.charAt(0).toUpperCase() + rawNoun.slice(1)}`;
    const description = `Advanced machine learning pipelines and vector embeddings tracking dynamic ${rawNoun} records.`;
    
    // Pick one of the baseline features as a dependency (for 2 of the advanced features)
    let dependsOn: string | undefined;
    let dependsOnName: string | undefined;
    if (i < 2 && features.length > 0) {
      const baseFeats = features.filter(f => f.effort === 'low');
      if (baseFeats.length > 0) {
        const depFeat = baseFeats[Math.floor(rand() * baseFeats.length)];
        dependsOn = depFeat.id;
        dependsOnName = depFeat.name;
      }
    }

    features.push({
      id,
      name,
      description: description + (dependsOnName ? ` [REQUIRES: ${dependsOnName.toUpperCase()}]` : ""),
      effort: 'high',
      impact: 'high',
      innovationScore: 50 + Math.floor(rand() * 30), // 50-80
      dependsOn,
      dependsOnName
    });
  }

  return features;
}
