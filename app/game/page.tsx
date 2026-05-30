"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, STAGE_ORDER } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import { Button } from "@/components/ui/button";
import { PROBLEMS } from "@/data/problems";
import { TECH_POOL, TECH_WEIGHTS } from "@/data/techItems";
import { DraggableCard } from "@/components/drag-drop/DraggableCard";
import { DropZone } from "@/components/drag-drop/DropZone";
import {
  DndContext,
  closestCenter,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  Terminal,
  Clock,
  Trophy,
  Sparkles,
  Zap,
  Hammer,
  RotateCcw,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Briefcase,
  AlertTriangle,
  Lightbulb,
  Check,
} from "lucide-react";
import type { GameStage, Problem, TechItem, Feature } from "@/types/game";

// ─── Standard Reusable Stage Wrapper ───────────────────────────────────────

function GameplayStageCard({
  stageKey,
  title,
  subtitle,
  children,
}: {
  stageKey: GameStage;
  title: string;
  subtitle: string;
  children?: React.ReactNode;
}) {
  const { nextStage, previousStage, difficulty, globalTimeRemaining } = useGameStore();
  const currentIndex = STAGE_ORDER.indexOf(stageKey);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center min-h-[75vh] max-w-4xl mx-auto px-4 py-8"
    >
      <div className="w-full bg-card border border-border rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.015)] p-6 sm:p-8 text-center relative overflow-hidden">
        {/* Stage metadata tags */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/85">
          <span className="font-mono text-[10px] text-muted-foreground tracking-wider">
            STAGE_{String(currentIndex + 1).padStart(2, "0")}//{stageKey.toUpperCase()}
          </span>
          <div className="flex items-center gap-3">
            {difficulty && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-neutral-600 uppercase font-bold">
                DIFF: {difficulty}
              </span>
            )}
            {difficulty && (
              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-neutral-900 border border-neutral-900 text-white font-bold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(globalTimeRemaining)}
              </span>
            )}
          </div>
        </div>

        <h2 className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight text-neutral-900 mb-2">
          {title}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mb-8 max-w-md mx-auto font-light leading-relaxed">
          {subtitle}
        </p>

        {children && <div className="mb-8 w-full">{children}</div>}

        {/* Tactile navigation controls */}
        <div className="flex items-center justify-between border-t border-border pt-6 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStage}
            disabled={currentIndex === 0 || stageKey === 'results'}
            className="font-mono text-xs h-8"
          >
            &lt; BACK
          </Button>

          <div className="hidden sm:flex gap-1.5">
            {STAGE_ORDER.map((s, idx) => (
              <div
                key={s}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  idx === currentIndex
                    ? "bg-neutral-800"
                    : idx < currentIndex
                    ? "bg-neutral-400"
                    : "bg-neutral-200"
                }`}
              />
            ))}
          </div>

          <Button
            size="sm"
            onClick={nextStage}
            disabled={currentIndex === STAGE_ORDER.length - 1 || !difficulty}
            className="font-mono text-xs h-8 border border-neutral-900"
          >
            CONTINUE &gt;
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Stage 1: Difficulty Phase ─────────────────────────────────────────────

function DifficultyStage() {
  const { setDifficulty, difficulty } = useGameStore();

  const options = [
    { key: "easy", name: "EASY_COMPILE.EXE", desc: "10 min compile budget // 1.0x baseline modifier" },
    { key: "medium", name: "MEDIUM_COMPILE.EXE", desc: "7 min compile budget // 1.15x efficiency multiplier" },
    { key: "hard", name: "HARD_COMPILE.EXE", desc: "5 min compile budget // 1.30x structural speed multiplier" },
    { key: "dev", name: "DEV_DEBUG.SH", desc: "60 seconds compile budget // 1.00x test build modifier" },
  ] as const;

  return (
    <GameplayStageCard
      stageKey="difficulty"
      title="Select Difficulty"
      subtitle="Select a difficulty profile. Dynamic schedules governs available seconds, event complexities, and aggregate compile speeds."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => setDifficulty(opt.key)}
            className={`flex flex-col text-left p-4 rounded-md border transition-all ${
              difficulty === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-mono text-xs font-bold text-neutral-900 tracking-wider">
              {opt.name}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-light">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 2: Problem Reveal Phase ──────────────────────────────────────────

function ProblemRevealStage() {
  const { selectedProblem, selectProblem } = useGameStore();
  const [shuffling, setShuffling] = useState(false);

  const rollRandomProblem = useCallback(() => {
    setShuffling(true);
    let index = 0;
    const interval = setInterval(() => {
      index = Math.floor(Math.random() * PROBLEMS.length);
      selectProblem(PROBLEMS[index]);
    }, 80);

    setTimeout(() => {
      clearInterval(interval);
      setShuffling(false);
    }, 1000);
  }, [selectProblem]);

  // Select problem automatically on load if none selected
  useEffect(() => {
    if (!selectedProblem) {
      rollRandomProblem();
    }
  }, [selectedProblem, rollRandomProblem]);

  return (
    <GameplayStageCard
      stageKey="problemReveal"
      title="Problem Reveal"
      subtitle="Review the assigned startup challenge statement. Shuffling is available to redraw alternative requirements grids."
    >
      <div className="space-y-4 text-left max-w-md mx-auto font-mono text-[11px] leading-relaxed">
        <div className="flex justify-end">
          <Button
            size="xs"
            variant="outline"
            onClick={rollRandomProblem}
            disabled={shuffling}
            className="text-[10px] h-7"
          >
            <RotateCcw className={`w-3.5 h-3.5 mr-1 ${shuffling ? 'animate-spin' : ''}`} />
            SHUFFLE_STATEMENT.EXE
          </Button>
        </div>

        <AnimatePresence mode="wait">
          {selectedProblem && (
            <motion.div
              key={selectedProblem.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="p-5 rounded-md border border-neutral-200 bg-neutral-50/50 space-y-4"
            >
              <div>
                <span className="text-neutral-400">PROBLEM_NAME:</span>{" "}
                <span className="font-bold text-neutral-900 uppercase">{selectedProblem.title}</span>
              </div>
              <div>
                <span className="text-neutral-400">CATEGORY:</span>{" "}
                <span className="font-bold text-neutral-800 uppercase px-1.5 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[10px]">
                  {selectedProblem.category}
                </span>
              </div>
              <p className="text-neutral-700 border-t border-dashed border-border pt-3 text-[11px] font-sans font-light">
                {selectedProblem.description}
              </p>
              
              <div className="border-t border-dashed border-border pt-3 space-y-1">
                <span className="text-neutral-400 font-bold block text-[10px]">COMPILE_CONSTRAINTS:</span>
                <ul className="list-disc list-inside text-neutral-700 text-[10px] space-y-1 font-sans font-light">
                  {selectedProblem.constraints.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              {selectedProblem.judgingHint && (
                <div className="border-t border-dashed border-border pt-3">
                  <span className="text-neutral-400 font-bold block text-[10px] mb-1">JUDGING_CLUE:</span>
                  <div className="p-2.5 rounded bg-amber-50/30 border border-amber-200/50 text-[10px] text-amber-800 font-sans font-light leading-relaxed">
                    💡 {selectedProblem.judgingHint}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 3: Solution Direction Phase ──────────────────────────────────────

function SolutionDirectionStage() {
  const { solutionDirection, setSolutionDirection, updateScore } = useGameStore();

  const options = [
    { id: "web-app", name: "Web Application", desc: "Compile lightweight modular sites (+Design, +Feasibility)" },
    { id: "mobile-app", name: "Mobile Application", desc: "Build native offline study tools (+Design, +Execution)" },
    { id: "ai-solution", name: "AI Solution", desc: "Assemble localized cognitive pipelines (+Innovation, +PitchPotential)" },
    { id: "iot-product", name: "IoT Hardware Product", desc: "Program micro-controllers & sensors (+Innovation, -Execution)" },
    { id: "platform", name: "Service Platform", desc: "Design shared micro-services lattices (+Execution, +Innovation)" },
    { id: "marketplace", name: "Trading Marketplace", desc: "Build automated peer exchange pools (+PitchPotential, +Feasibility)" },
  ];

  const handleSelect = (id: string) => {
    setSolutionDirection(id);
    
    // Apply hidden scoring updates immediately based on project option chosen
    if (id === "web-app") {
      updateScore("design", 15);
      updateScore("execution", 10);
      updateScore("innovation", 5);
      updateScore("pitch", 5);
    } else if (id === "mobile-app") {
      updateScore("design", 10);
      updateScore("execution", 15);
      updateScore("innovation", 5);
      updateScore("pitch", 5);
    } else if (id === "ai-solution") {
      updateScore("innovation", 25);
      updateScore("execution", 5);
      updateScore("design", 5);
      updateScore("pitch", 20);
    } else if (id === "iot-product") {
      updateScore("innovation", 20);
      updateScore("execution", 8);
      updateScore("design", 5);
      updateScore("pitch", 12);
    } else if (id === "platform") {
      updateScore("execution", 18);
      updateScore("innovation", 12);
      updateScore("design", 5);
      updateScore("pitch", 5);
    } else if (id === "marketplace") {
      updateScore("pitch", 20);
      updateScore("execution", 10);
      updateScore("innovation", 5);
      updateScore("design", 5);
    }
  };

  useEffect(() => {
    if (!solutionDirection) {
      handleSelect(options[0].id);
    }
  }, [solutionDirection]);

  return (
    <GameplayStageCard
      stageKey="solutionDirection"
      title="Solution Direction"
      subtitle="Establish the primary architecture layout. Option profile choices inject specific baseline score offsets to hidden multipliers."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`p-4 rounded-md border flex flex-col transition-all ${
              solutionDirection === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900">{opt.name.toUpperCase()}</span>
            <span className="text-[10px] text-muted-foreground mt-1 font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 4: Tech Stack Phase ──────────────────────────────────────────────

const SLOT_CATEGORIES = [
  { id: 'frontend', label: 'Frontend Slot' },
  { id: 'backend', label: 'Backend Slot' },
  { id: 'database', label: 'Database Slot' },
  { id: 'devops', label: 'Hosting Slot' },
  { id: 'ai', label: 'Special Tech Slot' },
] as const;

function TechStackStage() {
  const { techStack, addTechItem, removeTechItem, updateScore } = useGameStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const selectedIds = new Set(techStack.map((t) => t.id));

  // Dynamic live score compiler based on active tech stack and synergies
  const recalculateTechScores = useCallback((currentStack: TechItem[]) => {
    let innovation = 50;
    let feasibility = 60; // execution base
    let design = 55;
    let pitchPotential = 50; // pitch base
    let bonus = 0;

    // Apply individual tech weights
    currentStack.forEach((tech) => {
      const weights = TECH_WEIGHTS[tech.id];
      if (weights) {
        innovation += weights.innovation;
        feasibility += weights.feasibility;
        design += weights.design;
        pitchPotential += weights.pitchPotential;
      }
    });

    // Check specific stack synergies
    const ids = new Set(currentStack.map((t) => t.id));
    
    // Synergy A: Next.js + Vercel
    if (ids.has("tech-next") && ids.has("tech-vercel")) {
      feasibility += 10;
      design += 10;
      bonus += 5;
    }
    
    // Synergy B: OpenAI/Gemini + Next.js
    if ((ids.has("tech-openai") || ids.has("tech-gemini")) && ids.has("tech-next")) {
      innovation += 15;
      pitchPotential += 10;
      bonus += 10;
    }

    // Synergy C: ESP32 + Arduino
    if (ids.has("tech-esp32") && ids.has("tech-arduino")) {
      innovation += 15;
      feasibility += 10;
      bonus += 10;
    }

    // Synergy D: Supabase + PostgreSQL
    if (ids.has("tech-supabase") && ids.has("tech-postgres")) {
      feasibility += 12;
      bonus += 5;
    }

    updateScore("innovation", Math.min(innovation, 100));
    updateScore("execution", Math.min(feasibility, 100));
    updateScore("design", Math.min(design, 100));
    updateScore("pitch", Math.min(pitchPotential, 100));
    updateScore("bonus", bonus);
  }, [updateScore]);

  const handleToggleTech = (tech: TechItem) => {
    if (selectedIds.has(tech.id)) {
      const nextStack = techStack.filter((t) => t.id !== tech.id);
      removeTechItem(tech.id);
      recalculateTechScores(nextStack);
    } else {
      const isSlotTaken = techStack.some((t) => t.category === tech.category);
      if (isSlotTaken) {
        const target = techStack.find((t) => t.category === tech.category);
        if (target) {
          removeTechItem(target.id);
        }
      }
      
      const nextStack = [...techStack.filter((t) => t.category !== tech.category), tech];
      addTechItem(tech);
      recalculateTechScores(nextStack);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const item = TECH_POOL.find((t) => t.id === active.id);
    if (!item) return;

    const targetSlotId = over.id as string;
    if (item.category === targetSlotId) {
      if (!selectedIds.has(item.id)) {
        const duplicate = techStack.find((t) => t.category === item.category);
        if (duplicate) {
          removeTechItem(duplicate.id);
        }
        
        const nextStack = [...techStack.filter((t) => t.category !== item.category), item];
        addTechItem(item);
        recalculateTechScores(nextStack);
      }
    }
  };

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="techStack"
        title="Assemble Tech Stack"
        subtitle="Drag technologies into designated category slots or click framework chips to lock components. Integrated stacks trigger synergy bonuses."
      >
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 max-w-4xl mx-auto text-left font-mono text-[11px]">
          <div className="lg:col-span-3 space-y-4">
            <span className="text-neutral-400 block text-[9px] uppercase">TECHNOLOGY_POOL (CLICK_TO_TOGGLE):</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {TECH_POOL.map((tech) => {
                const isSelected = selectedIds.has(tech.id);
                return (
                  <DraggableCard key={tech.id} id={tech.id} data={{ ...tech }}>
                    <button
                      onClick={() => handleToggleTech(tech)}
                      className={`w-full text-left flex flex-col p-2.5 rounded-md border transition-all ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-50 shadow-sm"
                          : "border-neutral-200 hover:border-neutral-300 bg-white"
                      }`}
                    >
                      <span className="font-bold text-neutral-900 block">{tech.name}</span>
                      <span className="text-[8px] text-muted-foreground uppercase mt-0.5 tracking-wider font-light">
                        {tech.category === 'devops' ? 'Hosting' : tech.category === 'ai' ? 'Special' : tech.category}
                      </span>
                    </button>
                  </DraggableCard>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-3">
            <span className="text-neutral-400 block text-[9px] uppercase">COMPILER_SLOTS (DRAG_HERE):</span>

            <div className="space-y-2">
              {SLOT_CATEGORIES.map((slot) => {
                const slottedItem = techStack.find((t) => t.category === slot.id);
                return (
                  <DropZone
                    key={slot.id}
                    id={slot.id}
                    label={slot.label}
                    capacity={1}
                    currentCount={slottedItem ? 1 : 0}
                  >
                    {slottedItem ? (
                      <div className="p-3 bg-white border border-neutral-900 rounded-md flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                        <div className="flex flex-col">
                          <span className="font-bold text-neutral-900 text-xs">{slottedItem.name.toUpperCase()}</span>
                          <span className="text-[8px] text-muted-foreground uppercase font-light">
                            {slot.label} Connected
                          </span>
                        </div>
                        <Button
                          size="xs"
                          variant="destructive"
                          onClick={() => handleToggleTech(slottedItem)}
                          className="h-6 w-12 font-mono text-[9px]"
                        >
                          EJECT
                        </Button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-neutral-400 italic text-center py-1">
                        [EMPTY_{slot.id.toUpperCase()}_SLOT]
                      </div>
                    )}
                  </DropZone>
                );
              })}
            </div>
          </div>
        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// ─── Stage 5: USP Phase ─────────────────────────────────────────────────────

function UspStage() {
  const { usp, setUsp, updateScore } = useGameStore();

  const options = [
    { key: "Fastest", name: "FASTEST_SPEED.EXE", desc: "Build quick compiling prototypes // +18 Feasibility/Execution, -5 Innovation" },
    { key: "Cheapest", name: "CHEAPEST_COST.EXE", desc: "Minimize cloud costs completely // +15 Feasibility/Execution, -5 Design" },
    { key: "Most Scalable", name: "MOST_SCALABLE.EXE", desc: "High baseline server throughput // +12 Feasibility/Execution, +10 PitchPotential" },
    { key: "AI-powered", name: "AI_COPROCESSOR.EXE", desc: "Integrate cognitive search pipelines // +25 Innovation, -5 Design, -5 Execution" },
    { key: "Sustainable", name: "SUSTAINABLE_OFFSET.EXE", desc: "High environmental offset footprint // +20 Innovation, +15 PitchPotential" },
    { key: "Hyper-personalized", name: "HYPER_PERSONALIZED.EXE", desc: "Granular user experience panels // +20 Design, +10 PitchPotential, -5 Execution" },
    { key: "Community-first", name: "COMMUNITY_FIRST.EXE", desc: "High focus on cooperative meshes // +20 PitchPotential, +12 Innovation, -5 Execution" },
  ] as const;

  const handleSelect = (key: typeof options[number]['key']) => {
    setUsp(key);
    
    // Apply immediate hidden score modifier tradeoffs
    const weights = {
      'Fastest': { innovation: 50, execution: 75, design: 55, pitch: 50 },
      'Cheapest': { innovation: 55, execution: 70, design: 50, pitch: 50 },
      'Most Scalable': { innovation: 60, execution: 68, design: 55, pitch: 60 },
      'AI-powered': { innovation: 80, execution: 55, design: 50, pitch: 65 },
      'Sustainable': { innovation: 75, execution: 60, design: 55, pitch: 65 },
      'Hyper-personalized': { innovation: 60, execution: 55, design: 75, pitch: 60 },
      'Community-first': { innovation: 65, execution: 55, design: 60, pitch: 70 },
    }[key];

    updateScore("innovation", weights.innovation);
    updateScore("execution", weights.execution);
    updateScore("design", weights.design);
    updateScore("pitch", weights.pitch);
  };

  useEffect(() => {
    if (!usp) {
      handleSelect("Cheapest");
    }
  }, [usp]);

  return (
    <GameplayStageCard
      stageKey="usp"
      title="Define Unique Selling Prop"
      subtitle="Define your project's competitive advantage. Card choices introduce hidden tradeoffs between Innovation, Execution, and Pitch Potential."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.key}
            onClick={() => handleSelect(opt.key)}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all ${
              usp === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900 block">{opt.name}</span>
            <span className="text-[9px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 6: Feature Prioritization Phase ──────────────────────────────────

const MOCK_BACKLOG_POOL: Feature[] = [
  { id: "feat-ai", name: "AI Assistant", description: "Secures search logs", effort: "medium", impact: "high" },
  { id: "feat-chat", name: "Interactive Chat", description: "Peer messaging streams", effort: "low", impact: "high" },
  { id: "feat-maps", name: "Campus Maps Grid", description: "Indoor study coordinates", effort: "medium", impact: "medium" },
  { id: "feat-analytics", name: "Emissions Analytics", description: "Live telemetry dashboards", effort: "medium", impact: "high" },
  { id: "feat-game", name: "Study Gamification", description: "Streaks and study locks", effort: "low", impact: "medium" },
  { id: "feat-lead", name: "Emissions Leaderboard", description: "Direct community matches", effort: "low", impact: "medium" },
  { id: "feat-pay", name: "Micro Loans Payments", description: "Secured transactions checkouts", effort: "high", impact: "high" },
  { id: "feat-notif", name: "Urgent Notifications", description: "Offline push channels", effort: "low", impact: "medium" },
  { id: "feat-voice", name: "Local Voice Assistant", description: " Dialect audio synthesizer", effort: "high", impact: "high" },
  { id: "feat-ar", name: "AR Navigation View", description: "Virtual indoor coordinate overlays", effort: "high", impact: "high" },
];

function FeaturesStage() {
  const { reorderFeatures, updateScore, score } = useGameStore();

  const [buckets, setBuckets] = useState<Record<string, 'must' | 'nice' | 'overkill'>>({
    'feat-ai': 'must',
    'feat-chat': 'must',
    'feat-maps': 'nice',
    'feat-analytics': 'nice',
    'feat-game': 'nice',
    'feat-lead': 'overkill',
    'feat-pay': 'overkill',
    'feat-notif': 'nice',
    'feat-voice': 'overkill',
    'feat-ar': 'overkill',
  });

  const recalculateFeatureScores = useCallback((nextBuckets: Record<string, 'must' | 'nice' | 'overkill'>) => {
    let execution = 60;
    let design = 55;
    let innovation = 50;
    let bonus = 0;

    const items = Object.entries(nextBuckets);
    const mustCount = items.filter(([_, b]) => b === 'must').length;

    // 1. Over-scoping penalty
    if (mustCount > 3) {
      execution -= 18;
      design -= 5;
    }
    // 2. Balanced scoping bonus
    if (mustCount === 2 || mustCount === 3) {
      execution += 15;
      design += 10;
      bonus += 5;
    }
    // 3. Smart scoping bonus (placing heavy things in overkill)
    if (nextBuckets['feat-ar'] === 'overkill') {
      execution += 6;
      bonus += 3;
    }
    if (nextBuckets['feat-voice'] === 'overkill') {
      execution += 6;
      bonus += 3;
    }
    // 4. Critical features in must-have
    if (nextBuckets['feat-chat'] === 'must' || nextBuckets['feat-ai'] === 'must') {
      design += 5;
    }

    updateScore("execution", Math.min(execution, 100));
    updateScore("design", Math.min(design, 100));
    updateScore("innovation", Math.min(innovation, 100));
    updateScore("bonus", bonus);
  }, [updateScore]);

  // Click trigger to cycle feature buckets
  const handleCycleBucket = (id: string) => {
    const nextBuckets = { ...buckets };
    const current = nextBuckets[id];
    nextBuckets[id] = current === 'must' ? 'nice' : current === 'nice' ? 'overkill' : 'must';
    
    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);
    
    // Save flat array of must-have features in Zustand backlog features
    const mustList = MOCK_BACKLOG_POOL.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
  };

  // Drag and drop end trigger
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const targetBucket = over.id as 'must' | 'nice' | 'overkill';
    const nextBuckets = { ...buckets, [active.id]: targetBucket };

    setBuckets(nextBuckets);
    recalculateFeatureScores(nextBuckets);

    const mustList = MOCK_BACKLOG_POOL.filter(f => nextBuckets[f.id] === 'must');
    reorderFeatures(mustList);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  return (
    <DndContext collisionDetection={closestCenter} sensors={sensors} onDragEnd={handleDragEnd}>
      <GameplayStageCard
        stageKey="features"
        title="Backlog Prioritization"
        subtitle="Prioritize product backlogs. Drag cards into scoping buckets or click them to cycle columns. Scope bloat severely penalizes compile execution."
      >
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-4xl mx-auto text-left font-mono text-[11px]">
          {/* Backlog pool (1 col) */}
          <div className="lg:col-span-1 space-y-3">
            <span className="text-neutral-400 block text-[9px] uppercase">BACKLOG_POOL (CLICK_CYCLE):</span>
            <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
              {MOCK_BACKLOG_POOL.map((feat) => {
                const b = buckets[feat.id];
                return (
                  <DraggableCard key={feat.id} id={feat.id} data={{ ...feat }}>
                    <button
                      onClick={() => handleCycleBucket(feat.id)}
                      className="w-full text-left p-2 bg-white border border-neutral-200 rounded flex flex-col justify-between hover:border-neutral-400 transition-all"
                    >
                      <span className="font-bold text-neutral-900 block truncate">{feat.name}</span>
                      <span className="text-[8px] text-muted-foreground mt-1 block uppercase">
                        COL: {b === 'must' ? 'MUST_HAVE' : b === 'nice' ? 'NICE_TO_HAVE' : 'OVERKILL'}
                      </span>
                    </button>
                  </DraggableCard>
                );
              })}
            </div>
          </div>

          {/* 3 Columns Buckets (3 cols) */}
          <div className="lg:col-span-3 grid grid-cols-3 gap-3">
            {(['must', 'nice', 'overkill'] as const).map((col) => {
              const items = MOCK_BACKLOG_POOL.filter(f => buckets[f.id] === col);
              return (
                <DropZone
                  key={col}
                  id={col}
                  label={col === 'must' ? 'Must Have' : col === 'nice' ? 'Nice to Have' : 'Overkill'}
                  currentCount={items.length}
                >
                  <div className="space-y-1.5 min-h-[250px] py-1">
                    {items.map((it) => (
                      <div
                        key={it.id}
                        className="p-2.5 bg-white border border-neutral-300 rounded flex items-center justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]"
                      >
                        <span className="font-bold text-neutral-800 text-[10px] truncate">{it.name.toUpperCase()}</span>
                      </div>
                    ))}
                  </div>
                </DropZone>
              );
            })}
          </div>
        </div>
      </GameplayStageCard>
    </DndContext>
  );
}

// ─── Stage 7: Mentor Phase ──────────────────────────────────────────────────

function MentorStage() {
  const { techStack, solutionDirection, usp, features, updateScore } = useGameStore();
  const [isConsulted, setIsConsulted] = useState(false);
  const [tips, setTips] = useState<string[]>([]);

  const handleConsult = () => {
    setIsConsulted(true);

    const generatedTips: string[] = [];

    // Analyze state to generate highly tailored tips
    // Tip 1: Stack & Solution Direction Match
    const ids = new Set(techStack.map((t) => t.id));
    if (solutionDirection === 'ai-solution' && !ids.has('tech-openai') && !ids.has('tech-gemini')) {
      generatedTips.push("⚠️ STACK_WARN: You are compiling an AI Solution but omitted OpenAI and Gemini API models from your pipeline.");
    } else if (solutionDirection === 'iot-product' && !ids.has('tech-esp32') && !ids.has('tech-arduino')) {
      generatedTips.push("⚠️ STACK_WARN: IoT Hardware products require ESP32/Arduino integration to verify baseline physical compiles.");
    } else {
      generatedTips.push("✅ STACK_ALIGNED: Framework choices display adequate category coverage for your selected project direction.");
    }

    // Tip 2: USP & Stack Match
    if (usp === 'Fastest' && ids.has('tech-aws')) {
      generatedTips.push("⚠️ USP_ALIGN_WARN: Setting 'Fastest' USP while deploying on AWS has latency overheads. Vercel would host faster.");
    } else if (usp === 'Sustainable' && ids.has('tech-next')) {
      generatedTips.push("✅ USP_ALIGNED: Sustainability objectives coupled with Next.js static generation are highly carbon efficient.");
    } else {
      generatedTips.push("💡 USP_TIP: Align unique selling propositions strictly with stack constraints to trigger judge pitch multipliers.");
    }

    // Tip 3: Scoping backlog
    if (features.length > 3) {
      generatedTips.push("⚠️ SCOPE_WARN: Your backlog has severe scope bloat. Consider ejecting features into Overkill to restore Execution.");
    } else {
      generatedTips.push("✅ SCOPE_ALIGNED: Compact Must-Have features secure high baseline feasibility indices. Excellent work.");
    }

    setTips(generatedTips);

    // Apply minor advisor reliance scoring penalty (representative of consult costs)
    updateScore("pitch", Math.max(0, useGameStore.getState().score.pitch - 3));
    updateScore("bonus", useGameStore.getState().score.bonus + 5);
  };

  return (
    <GameplayStageCard
      stageKey="mentor"
      title="Consult Mentor Advisor"
      subtitle="Interact with advisors once. Mentors provide context-aware feedback pointing out stack discrepancies, at the expense of a minor pitch penalty."
    >
      <div className="max-w-md mx-auto space-y-5 text-left font-mono text-[11px]">
        {!isConsulted ? (
          <div className="text-center py-6 bg-white border border-neutral-200 rounded-md shadow-sm space-y-4">
            <span className="text-[28px]">🧠</span>
            <h3 className="font-bold text-neutral-900 uppercase">ADVISOR_MESH_READY</h3>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto font-sans font-light">
              Click below to boot the cognitive evaluator. This will analyze your active stack and backlog pipelines.
            </p>
            <Button
              onClick={handleConsult}
              className="font-mono text-xs border border-neutral-900"
            >
              RUN_MENTOR_AUDIT.EXE
            </Button>
          </div>
        ) : (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-md text-white shadow-xl space-y-4 leading-relaxed font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-emerald-400 font-bold">COMPILER_MENTOR_AUDIT: DONE</span>
              <span className="text-neutral-500 text-[9px]">[ONE_TIME_USE_EXPIRED]</span>
            </div>

            <div className="space-y-3">
              {tips.map((tip, idx) => (
                <div key={idx} className="p-3 bg-neutral-950 rounded border border-neutral-800 text-[10px] text-neutral-200">
                  {tip}
                </div>
              ))}
            </div>

            <div className="text-[9px] text-neutral-400 pt-2 border-t border-neutral-800 text-center font-sans font-light">
              Audit loaded. Score penalty applied: PITCH -3 pts // COMPILER_BONUS +5 pts.
            </div>
          </div>
        )}
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 8: Business Model Phase ──────────────────────────────────────────

function BusinessModelStage() {
  const { businessModel, setBusinessModel, selectedProblem, usp, solutionDirection, updateScore } = useGameStore();

  const options = [
    { id: "Freemium", name: "Freemium Accounts", desc: "Free core profiles with premium upgrades (+Consumer Fit)" },
    { id: "Subscription", name: "SaaS Subscription Tiers", desc: "Operational licensing charges (+Scalable Fit)" },
    { id: "Marketplace", name: "Marketplace Commission", desc: "Peer trade processing percentages (+Market Fit)" },
    { id: "B2B SaaS", name: "B2B SaaS Hubs", desc: "Corporate nodes integration agreements (+Corporate Fit)" },
    { id: "Commission", name: "Transaction Commissions", desc: "Dynamic checkout cuts (+Fintech Fit)" },
    { id: "Government Partnership", name: "Government Sponsorship", desc: "Public carbon offsets sponsorship (+Gov Fit)" },
    { id: "Ads", name: "Ad network grids", desc: "Consumer eyeballs monetization (+Platform Fit)" },
  ] as const;

  const handleSelect = (id: typeof options[number]['id']) => {
    setBusinessModel(id);

    // Contextual operational alignment fit score calculations
    let pitch = 65;
    let execution = 60;

    // Gov fits sustainability / campus problems
    if (id === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      pitch += 20;
    }
    // B2B SaaS fits Scalable corporate solutions
    if (id === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      pitch += 18;
      execution += 5;
    }
    // Freemium fits mobile app directions
    if (id === "Freemium" && solutionDirection === "mobile-app") {
      pitch += 12;
    }

    updateScore("pitch", Math.min(pitch, 100));
    updateScore("execution", Math.min(execution, 100));
  };

  useEffect(() => {
    if (!businessModel) {
      handleSelect("Freemium");
    }
  }, [businessModel]);

  return (
    <GameplayStageCard
      stageKey="businessModel"
      title="Business Model Setup"
      subtitle="Determine the operational business model template. Aligning operational models with problem statements unlocks maximum Pitch grades."
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-2xl mx-auto text-left font-mono text-[11px]">
        {options.map((opt) => (
          <button
            key={opt.id}
            onClick={() => handleSelect(opt.id)}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all ${
              businessModel === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
                : "border-neutral-200 hover:border-neutral-400 bg-white"
            }`}
          >
            <span className="font-bold text-neutral-900 block">{opt.name}</span>
            <span className="text-[9px] text-muted-foreground mt-2 block font-sans font-light leading-relaxed">
              {opt.desc}
            </span>
          </button>
        ))}
      </div>
    </GameplayStageCard>
  );
}

// ─── Placeholder Fallback views (Stages 9 to 12) ───────────────────────────

function FallbackStage({ stageKey }: { stageKey: GameStage }) {
  return (
    <GameplayStageCard
      stageKey={stageKey}
      title={`${stageKey} Stage`}
      subtitle="Operational templates compiled successfully. Stage transitions ready for gameplay integrations in Sprint 4."
    />
  );
}

// ─── Floating Dev Debug Panel ──────────────────────────────────────────────

function DevDebugPanel() {
  const {
    stage,
    isTimerPaused,
    globalTimeRemaining,
    globalTotalTime,
    score,
    jumpToStage,
    pauseTimer,
    resumeTimer,
    resetGame,
    nextStage,
  } = useGameStore();
  const [isOpen, setIsOpen] = useState(false);

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 p-2 text-[10px] font-mono uppercase bg-neutral-900 text-white rounded shadow border border-neutral-800 hover:bg-neutral-800 transition-all cursor-pointer"
      >
        [DEV_DEBUG_PANEL]
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-72 bg-card border border-neutral-400 rounded-lg shadow-xl p-4 font-mono text-xs">
      <div className="flex items-center justify-between border-b border-border pb-2 mb-2 font-bold text-neutral-900">
        <span>DEV_DEBUG_PANEL.SH</span>
        <button onClick={() => setIsOpen(false)} className="hover:text-red-500 font-bold cursor-pointer">[X]</button>
      </div>

      <div className="space-y-1 text-[11px] mb-3 text-neutral-700">
        <div>STAGE: <span className="font-bold text-neutral-900">{stage}</span></div>
        <div>TIMER: <span className="font-bold text-neutral-900">{formatTime(globalTimeRemaining)} / {formatTime(globalTotalTime)}</span> ({isTimerPaused ? "PAUSED" : "ACTIVE"})</div>
        
        <div className="mt-2 pt-2 border-t border-dashed border-border/80 text-[10px] space-y-0.5">
          <div className="font-bold text-neutral-900 uppercase">HIDDEN_SCORES:</div>
          <div className="flex justify-between"><span>INNOVATION:</span><span>{score.innovation}/100</span></div>
          <div className="flex justify-between"><span>EXECUTION/FEAS:</span><span>{score.execution}/100</span></div>
          <div className="flex justify-between"><span>DESIGN:</span><span>{score.design}/100</span></div>
          <div className="flex justify-between"><span>PITCH_POTENTIAL:</span><span>{score.pitch}/100</span></div>
          <div className="flex justify-between font-bold text-neutral-800 pt-0.5"><span>COMPILER_BONUS:</span><span>+{score.bonus} pts</span></div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3 pt-2 border-t border-border/60">
        <Button
          size="xs"
          variant="outline"
          onClick={isTimerPaused ? resumeTimer : pauseTimer}
          className="text-[10px] h-7"
        >
          {isTimerPaused ? "RESUME_TIME" : "PAUSE_TIME"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={nextStage}
          className="text-[10px] h-7"
        >
          SKIP_STAGE
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={resetGame}
          className="text-[10px] col-span-2 h-7"
        >
          RESET_SIMULATOR
        </Button>
      </div>

      <div className="border-t border-border pt-2">
        <label className="block text-[10px] font-bold text-neutral-500 uppercase mb-1">
          JUMP_TO_STAGE:
        </label>
        <select
          value={stage}
          onChange={(e) => jumpToStage(e.target.value as GameStage)}
          className="w-full bg-white border border-border text-[11px] rounded p-1"
        >
          {STAGE_ORDER.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ─── Main Conditional Stage Orchestrator / GamePage ───────────────────────────

export default function GamePage() {
  const { stage, isGameStarted, startGame, tickTimer, isTimerPaused } = useGameStore();

  // Auto-start global simulation when page mounts
  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  // Bind the global countdown interval system
  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, tickTimer]);

  /** Renders the correct stage component conditionally */
  const renderStageContent = () => {
    switch (stage) {
      case "difficulty":
        return <DifficultyStage key="difficulty" />;
      case "problemReveal":
        return <ProblemRevealStage key="problemReveal" />;
      case "solutionDirection":
        return <SolutionDirectionStage key="solutionDirection" />;
      case "techStack":
        return <TechStackStage key="techStack" />;
      case "usp":
        return <UspStage key="usp" />;
      case "features":
        return <FeaturesStage key="features" />;
      case "mentor":
        return <MentorStage key="mentor" />;
      case "businessModel":
        return <BusinessModelStage key="businessModel" />;
      // Fallback placeholder stages wrapper
      case "pitchPrep":
      case "judgeSpin":
      case "judging":
      case "results":
        return <FallbackStage key={stage} stageKey={stage} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <span className="font-mono text-xs text-muted-foreground animate-pulse">
              INITIALIZING_COMPILER_DRIVERS...
            </span>
          </div>
        );
    }
  };

  return (
    <GameLayout>
      <div className="relative w-full h-full min-h-screen">
        <AnimatePresence mode="wait">{renderStageContent()}</AnimatePresence>
        <DevDebugPanel />
      </div>
    </GameLayout>
  );
}
