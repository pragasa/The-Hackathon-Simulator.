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
  CheckCircle,
  HelpCircle,
} from "lucide-react";
import type { GameStage, Problem, TechItem } from "@/types/game";

// ─── Reusable Stage Container Card ────────────────────────────────────────

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

// ─── Stage 4: Tech Stack Phase (DnD Core) ──────────────────────────────────

const SLOT_CATEGORIES = [
  { id: 'frontend', label: 'Frontend Slot' },
  { id: 'backend', label: 'Backend Slot' },
  { id: 'database', label: 'Database Slot' },
  { id: 'devops', label: 'Hosting Slot' },
  { id: 'ai', label: 'Special Tech Slot' },
] as const;

function TechStackStage() {
  const { techStack, addTechItem, removeTechItem, updateScore } = useGameStore();

  // Sensors config for Dnd
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
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
    
    // Synergy A: Next.js + Vercel (Frontend + Hosting optimization)
    if (ids.has("tech-next") && ids.has("tech-vercel")) {
      feasibility += 10;
      design += 10;
      bonus += 5;
    }
    
    // Synergy B: OpenAI/Gemini + Next.js (AI web applications)
    if ((ids.has("tech-openai") || ids.has("tech-gemini")) && ids.has("tech-next")) {
      innovation += 15;
      pitchPotential += 10;
      bonus += 10;
    }

    // Synergy C: ESP32 + Arduino (IOT hardware stack)
    if (ids.has("tech-esp32") && ids.has("tech-arduino")) {
      innovation += 15;
      feasibility += 10;
      bonus += 10;
    }

    // Synergy D: Supabase + PostgreSQL (Optimized database layer)
    if (ids.has("tech-supabase") && ids.has("tech-postgres")) {
      feasibility += 12;
      bonus += 5;
    }

    // Update store scores dynamically
    updateScore("innovation", Math.min(innovation, 100));
    updateScore("execution", Math.min(feasibility, 100));
    updateScore("design", Math.min(design, 100));
    updateScore("pitch", Math.min(pitchPotential, 100));
    updateScore("bonus", bonus);
  }, [updateScore]);

  // Click-select action fallback
  const handleToggleTech = (tech: TechItem) => {
    if (selectedIds.has(tech.id)) {
      const nextStack = techStack.filter((t) => t.id !== tech.id);
      removeTechItem(tech.id);
      recalculateTechScores(nextStack);
    } else {
      // Ensure one framework per slot or max 5 items
      const isSlotTaken = techStack.some((t) => t.category === tech.category);
      if (isSlotTaken) {
        // Swap category item automatically
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

  // DnD Drop trigger
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const item = TECH_POOL.find((t) => t.id === active.id);
    if (!item) return;

    // Verify if item dropped fits the target category slot
    const targetSlotId = over.id as string;
    if (item.category === targetSlotId) {
      if (!selectedIds.has(item.id)) {
        // Clear matching category item if exists
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
          {/* Left panel: pool of 15 technologies (3 cols) */}
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

          {/* Right panel: 5 designated slots (2 cols) */}
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

// ─── Placeholder/Fallback stages views (Sprint 2 mappings) ────────────────

function FallbackStage({ stageKey }: { stageKey: GameStage }) {
  return (
    <GameplayStageCard
      stageKey={stageKey}
      title={`${stageKey} Stage`}
      subtitle="Operational templates compiled successfully. Stage transitions ready for gameplay integrations in Sprint 3B."
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
      // Fallback placeholder stages wrapper
      case "usp":
      case "features":
      case "mentor":
      case "businessModel":
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
