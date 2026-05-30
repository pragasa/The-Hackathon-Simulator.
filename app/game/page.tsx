"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useGameStore, STAGE_ORDER } from "@/store/gameStore";
import GameLayout from "@/components/game/GameLayout";
import { Button } from "@/components/ui/button";
import { PROBLEMS } from "@/data/problems";
import { JUDGES } from "@/data/judges";
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
import { CHAOS_EVENTS } from "@/data/chaosEvents";
import {
  playMutedClick,
  playSubtleHover,
  playSnapSound,
  playWarningTick,
  playWheelSpinClick,
  playScoreChord,
  playUnlockArpeggio
} from "@/lib/sound";

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
            onClick={() => {
              playMutedClick();
              previousStage();
            }}
            onMouseEnter={playSubtleHover}
            disabled={currentIndex === 0 || stageKey === 'results'}
            className="font-mono text-xs h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none"
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
            onClick={() => {
              playMutedClick();
              nextStage();
            }}
            onMouseEnter={playSubtleHover}
            disabled={currentIndex === STAGE_ORDER.length - 1 || !difficulty}
            className="font-mono text-xs h-8 border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none"
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
            onClick={() => {
              playMutedClick();
              setDifficulty(opt.key);
            }}
            onMouseEnter={playSubtleHover}
            className={`flex flex-col text-left p-4 rounded-md border transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              difficulty === opt.key
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
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
      playWheelSpinClick();
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
            onClick={() => {
              playMutedClick();
              rollRandomProblem();
            }}
            onMouseEnter={playSubtleHover}
            disabled={shuffling}
            className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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
            onClick={() => {
              playMutedClick();
              handleSelect(opt.id);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border flex flex-col transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
              solutionDirection === opt.id
                ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
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
        playSnapSound();
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
                      onClick={() => {
                        playMutedClick();
                        handleToggleTech(tech);
                      }}
                      onMouseEnter={playSubtleHover}
                      className={`w-full text-left flex flex-col p-2.5 rounded-md border transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
                        isSelected
                          ? "border-neutral-900 bg-neutral-50 shadow-sm font-bold"
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
                          onClick={() => {
                            playMutedClick();
                            handleToggleTech(slottedItem);
                          }}
                          onMouseEnter={playSubtleHover}
                          className="h-6 w-12 font-mono text-[9px] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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
            onClick={() => {
              playMutedClick();
              handleSelect(opt.key);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
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
    playSnapSound();
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
    playSnapSound();
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
                      onMouseEnter={playSubtleHover}
                      className="w-full text-left p-2.5 bg-white border border-neutral-200 rounded flex flex-col justify-between hover:border-neutral-400 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_2px_6px_rgba(0,0,0,0.02)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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
    useGameStore.setState({ mentorHintsUsed: 1 });
    playScoreChord();
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
              onClick={() => {
                playMutedClick();
                handleConsult();
              }}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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
            onClick={() => {
              playMutedClick();
              handleSelect(opt.id);
            }}
            onMouseEnter={playSubtleHover}
            className={`p-4 rounded-md border text-left flex flex-col justify-between transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none ${
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

// ─── Stage 9: Pitch Prep Phase ──────────────────────────────────────────────

function PitchPrepStage() {
  const {
    selectedProblem,
    solutionDirection,
    usp,
    techStack,
    features,
    businessModel,
    pitchText,
    setPitchText,
  } = useGameStore();

  const techNames = techStack.map((t) => t.name).join(", ");
  const featureNames = features.map((f) => f.name).join(", ");

  const defaultPitch = `Hello, we are tackling the "${
    selectedProblem?.title || "assigned"
  }" challenge. Our solution is a ${
    solutionDirection || "digital product"
  } engineered to be ${
    usp ? `the "${usp}"` : "highly optimized"
  } version in the market. Powered by a robust stack of ${
    techNames || "modern frameworks"
  }, we deliver value using a ${
    businessModel || "tailored"
  } revenue strategy. This directly solves constraints like "${
    selectedProblem?.constraints?.[0] || "core system complexity"
  }" while leveraging our must-have features: ${
    featureNames || "optimized workflow"
  }.`;

  const talkingPoints = [
    `Engineered using ${techNames || "highly specialized components"} for maximum compiler throughput and scalability.`,
    `Focused competitive advantage centered on the "${usp || "optimized value"}" unique selling proposition.`,
    `Sustainable unit economics backed by a robust ${businessModel || "validated"} monetization loop.`,
  ];

  useEffect(() => {
    if (!pitchText) {
      setPitchText(defaultPitch);
    }
  }, [pitchText, defaultPitch, setPitchText]);

  return (
    <GameplayStageCard
      stageKey="pitchPrep"
      title="Compile Final Pitch"
      subtitle="Synthesize your project choices into an elevator pitch. Customize your pitch statement below to prepare for the jury evaluation panel."
    >
      <div className="max-w-xl mx-auto text-left font-mono text-[11px] space-y-4">
        {/* Dynamic Project Details Monospace summary */}
        <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md space-y-2">
          <span className="text-neutral-400 block text-[9px] uppercase border-b border-neutral-200 pb-1 mb-2">PROJECT_MANIFEST.TXT</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 text-[10px]">
            <div><span className="text-neutral-400">PROBLEM:</span> <span className="text-neutral-900 font-bold">{selectedProblem?.title.toUpperCase()}</span></div>
            <div><span className="text-neutral-400">CATEGORY:</span> <span className="text-neutral-900 font-bold uppercase">{selectedProblem?.category}</span></div>
            <div><span className="text-neutral-400">DIRECTION:</span> <span className="text-neutral-900 font-bold uppercase">{solutionDirection}</span></div>
            <div><span className="text-neutral-400">USP:</span> <span className="text-neutral-900 font-bold uppercase">{usp}</span></div>
            <div><span className="text-neutral-400">MODEL:</span> <span className="text-neutral-900 font-bold uppercase">{businessModel}</span></div>
            <div><span className="text-neutral-400">FEATURES:</span> <span className="text-neutral-900 font-bold">{features.length} IN_BACKLOG</span></div>
          </div>
        </div>

        {/* Dynamic Elevator Pitch Generator */}
        <div className="space-y-1">
          <span className="text-neutral-400 block text-[9px] uppercase">30_SECOND_ELEVATOR_PITCH.SH</span>
          <textarea
            value={pitchText}
            onChange={(e) => setPitchText(e.target.value)}
            rows={5}
            className="w-full p-3 bg-white border border-neutral-900 rounded-md font-sans text-xs text-neutral-800 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none leading-relaxed shadow-inner"
            placeholder="Write your custom elevator pitch..."
          />
        </div>

        {/* Key Talking Points */}
        <div className="space-y-2 border-t border-dashed border-border pt-3">
          <span className="text-neutral-400 block text-[9px] uppercase">KEY_DEMO_TALKING_POINTS.TXT</span>
          <ul className="space-y-1.5">
            {talkingPoints.map((pt, i) => (
              <li key={i} className="flex items-start gap-2 text-neutral-700 font-sans font-light text-xs">
                <span className="text-neutral-900 font-mono text-[10px] mt-0.5">[{i + 1}]</span>
                <span>{pt}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 10: Judge Wheel ──────────────────────────────────────────────────

function JudgeSpinStage() {
  const { currentJudge, setCurrentJudge, judgeSpinState, setJudgeSpinState, nextStage } = useGameStore();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    if (currentJudge && judgeSpinState === "done") {
      const idx = JUDGES.findIndex((j) => j.id === currentJudge.id);
      if (idx !== -1) {
        const sliceAngle = 360 / JUDGES.length;
        setRotation(360 - (idx * sliceAngle + sliceAngle / 2));
      }
    }
  }, [currentJudge, judgeSpinState]);

  const spinWheel = () => {
    if (spinning) return;
    setSpinning(true);
    setJudgeSpinState("spinning");
    playMutedClick();

    const randomIndex = Math.floor(Math.random() * JUDGES.length);
    const selected = JUDGES[randomIndex];

    const sliceAngle = 360 / JUDGES.length;
    const spins = 6;
    const targetAngle = spins * 360 + (360 - (randomIndex * sliceAngle + sliceAngle / 2));
    
    setRotation(targetAngle);

    // Dynamic, decelerating mechanical spin click ticks
    let activeSpin = true;
    const playSpinTicks = () => {
      let tickDelay = 25; // fast start
      const maxDelay = 300; // slow limit
      
      const tick = () => {
        if (!activeSpin) return;
        playWheelSpinClick();
        tickDelay *= 1.14; // decelerate exponentially
        if (tickDelay < maxDelay) {
          setTimeout(tick, tickDelay);
        }
      };
      setTimeout(tick, tickDelay);
    };
    playSpinTicks();

    setTimeout(() => {
      activeSpin = false;
      setSpinning(false);
      setJudgeSpinState("done");
      setCurrentJudge(selected);
      playSnapSound(); // tactile snap land!
    }, 2500);
  };

  return (
    <GameplayStageCard
      stageKey="judgeSpin"
      title="Spin Judge Wheel"
      subtitle="Engage the jury selector roulette. A randomized, expert judge profile will be selected to grade your project manifest."
    >
      <div className="max-w-md mx-auto flex flex-col items-center justify-center font-mono text-[11px] space-y-6">
        {/* SVG Wheel Roulette Container */}
        <div className="relative w-64 h-64 flex items-center justify-center">
          {/* Top Pointer */}
          <div className="absolute -top-2 z-10 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[15px] border-t-neutral-900 drop-shadow-sm" />

          {/* SVG Circle Wheel */}
          <div
            className="w-full h-full rounded-full border-2 border-neutral-900 overflow-hidden shadow-md bg-white"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 2.5s cubic-bezier(0.15, 0.85, 0.35, 1)" : "none",
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {JUDGES.map((jg, idx) => {
                const angle = 360 / JUDGES.length;
                const startAngle = idx * angle;
                const endAngle = (idx + 1) * angle;

                const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
                  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
                  return {
                    x: centerX + radius * Math.cos(angleInRadians),
                    y: centerY + radius * Math.sin(angleInRadians),
                  };
                };

                const start = polarToCartesian(100, 100, 96, startAngle);
                const end = polarToCartesian(100, 100, 96, endAngle);
                const largeArcFlag = angle <= 180 ? "0" : "1";

                const d = [
                  "M", 100, 100,
                  "L", start.x, start.y,
                  "A", 96, 96, 0, largeArcFlag, 1, end.x, end.y,
                  "Z"
                ].join(" ");

                const fillColor = idx % 2 === 0 ? "#ffffff" : "#f4f4f5";
                const textAngle = startAngle + angle / 2 - 90;
                const textPos = polarToCartesian(100, 100, 60, startAngle + angle / 2);

                return (
                  <g key={jg.id} className="select-none">
                    <path
                      d={d}
                      fill={fillColor}
                      stroke="#171717"
                      strokeWidth="1.5"
                    />
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      transform={`rotate(${textAngle + 90}, ${textPos.x}, ${textPos.y})`}
                      textAnchor="middle"
                      dominantBaseline="central"
                      className="font-mono text-[9px] font-bold fill-neutral-900"
                    >
                      {jg.avatar} {jg.name.split(" ")[0]}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="16" fill="#171717" stroke="#ffffff" strokeWidth="2" />
            </svg>
          </div>
        </div>

        {/* Control Button / Selection Info */}
        <div className="w-full text-center space-y-4">
          {judgeSpinState === "idle" && (
            <Button
              onClick={spinWheel}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full max-w-[200px] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
            >
              ⚡ SPIN_ROULETTE.EXE
            </Button>
          )}

          {judgeSpinState === "spinning" && (
            <div className="text-xs text-muted-foreground animate-pulse py-2">
              🎲 SHUFFLING_JURY_CHANNELS...
            </div>
          )}

          {judgeSpinState === "done" && currentJudge && (
            <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md w-full text-left space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentJudge.avatar}</span>
                <div>
                  <span className="text-neutral-400 block text-[9px] uppercase">SELECTED_JUDGE:</span>
                  <span className="font-bold text-neutral-900 text-sm uppercase">{currentJudge.name}</span>
                  <span className="text-[10px] text-muted-foreground block font-sans font-light leading-none mt-0.5">{currentJudge.title}</span>
                </div>
              </div>
              
              <div className="border-t border-dashed border-border pt-2 text-[10px] text-neutral-600 font-sans font-light leading-relaxed">
                Expertise: {currentJudge.expertise.join(", ")}
              </div>
              
              <Button
                onClick={() => {
                  playMutedClick();
                  nextStage();
                }}
                onMouseEnter={playSubtleHover}
                className="font-mono text-xs border border-neutral-900 w-full mt-2 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
              >
                SUBMIT_TO_JURY.SH
              </Button>
            </div>
          )}
        </div>
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 11: Dynamic Judging Engine ────────────────────────────────────────

function JudgingStage() {
  const {
    currentJudge,
    score,
    techStack,
    usp,
    solutionDirection,
    businessModel,
    features,
    mentorHintsUsed,
    addJudgeFeedback,
    judgeFeedback,
    nextStage,
  } = useGameStore();

  const [loadingStep, setLoadingStep] = useState(0);
  const [evaluationComplete, setEvaluationComplete] = useState(false);

  const loadingLogs = [
    "INITIATING COMPILER PIPELINE...",
    "EXTRACTING PROJECT MANIFEST...",
    "PARSING CHOSEN USP & TECH STACK...",
    "RUNNING FEASIBILITY AND VALUE MULTIPLIERS...",
    "CALCULATING SYNERGIES & MENTOR CODES...",
    "SYNTHESIZING CRITICAL JURY SCORE MATRIX...",
    "COMPILING FINAL REPORT..."
  ];

  useEffect(() => {
    if (evaluationComplete || !currentJudge) return;

    let step = 0;
    const interval = setInterval(() => {
      if (step < loadingLogs.length - 1) {
        step++;
        setLoadingStep(step);
        playWheelSpinClick(); // play digital keyboard click
      } else {
        clearInterval(interval);
        performEvaluation();
      }
    }, 400);

    return () => clearInterval(interval);
  }, [currentJudge]);

  const performEvaluation = () => {
    if (!currentJudge) return;

    const weights = currentJudge.scoringWeights;
    const baseInnovation = score.innovation;
    const baseExecution = score.execution;
    const baseDesign = score.design;
    const basePitch = score.pitch;

    let weightedScore =
      baseInnovation * weights.innovation +
      baseExecution * weights.execution +
      baseDesign * weights.design +
      basePitch * weights.pitch;

    if (currentJudge.id === "judge-chaos") {
      const chaosOffset = Math.floor(Math.random() * 41) - 20; // -20 to +20
      weightedScore += chaosOffset;
    }

    let finalScoreVal = weightedScore + score.bonus;
    finalScoreVal = Math.max(0, Math.min(finalScoreVal, 100));

    const derivedStrengths: string[] = [];
    const derivedWeaknesses: string[] = [];

    const techIds = new Set(techStack.map((t) => t.id));
    if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
      derivedStrengths.push("Excellent Next.js + Vercel deployment infrastructure synergy.");
    }
    if ((techIds.has("tech-openai") || techIds.has("tech-gemini")) && techIds.has("tech-next")) {
      derivedStrengths.push("Cutting-edge integration of AI models with responsive frontend frameworks.");
    }
    if (techIds.has("tech-esp32") && techIds.has("tech-arduino")) {
      derivedStrengths.push("High-fidelity matching of physical IoT boards with core IDE compilers.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust scalable database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried compiling too many Must-Have components.");
    } else if (features.length < 2) {
      derivedWeaknesses.push("Under-scoped roadmap. MVP fails to meet baseline hackathon requirements.");
    }

    const selectedProb = useGameStore.getState().selectedProblem;
    if (businessModel === "Government Partnership" && (selectedProb?.category === "sustainability" || selectedProb?.category === "smart-campus")) {
      derivedStrengths.push("Outstanding strategic fit matching public sponsorship with carbon offset problems.");
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProb?.id === "prob-learnflow")) {
      derivedStrengths.push("Excellent monetization alignment combining high-scale hosting with corporate licensing.");
    }

    if (solutionDirection === "ai-solution" && !techIds.has("tech-openai") && !techIds.has("tech-gemini")) {
      derivedWeaknesses.push("Critical stack gap: Selected AI Solution direction but failed to integrate large language models.");
    }
    if (solutionDirection === "iot-product" && !techIds.has("tech-esp32") && !techIds.has("tech-arduino")) {
      derivedWeaknesses.push("Critical stack gap: Selected IoT Hardware direction but failed to allocate microcontrollers.");
    }

    if (usp === "Fastest" && techIds.has("tech-aws")) {
      derivedWeaknesses.push("Deployment latency overhead: Chosen AWS servers contradict the extreme speed USP.");
    }

    if (mentorHintsUsed > 0) {
      derivedWeaknesses.push("Mentor advisor reliance: Small penalty assessed for consultation reliance.");
    }

    if (derivedStrengths.length < 2) {
      derivedStrengths.push("Consistent architectural execution boundaries.");
      derivedStrengths.push("Clear strategic path outlining MVP focus areas.");
    }
    if (derivedWeaknesses.length < 2) {
      derivedWeaknesses.push("Slight optimization room left in the core query pipeline.");
      derivedWeaknesses.push("Monetization channels could benefit from extra community validation.");
    }

    const finalStrengths = derivedStrengths.slice(0, 2);

    let comment = "";
    if (finalScoreVal >= 90) {
      comment = {
        technical: "Brilliant engineering compile. Perfect database locks and stellar code modularity.",
        creative: "Spectacular! This changes the narrative completely. The aesthetic flow is gorgeous.",
        encouraging: "Outstanding work! I am incredibly proud of what you put together in such a short window.",
        tough: "Impressive. I came in expecting code soup, but this is a exceptionally structured deployment.",
      }[currentJudge.personality];
    } else if (finalScoreVal >= 70) {
      comment = {
        technical: "Solid, viable architecture. Minor database indexing room remains, but highly functional.",
        creative: "A strong pitch and polished style. The USP makes immediate sense for this category.",
        encouraging: "A highly respectable submission! With a few extra hours, this could win outright.",
        tough: "Passable. The core features compile correctly, though it lacks severe creative ambition.",
      }[currentJudge.personality];
    } else {
      comment = {
        technical: "Compile failed due to dependency gaps and scope bloat. Architecture lacks robustness.",
        creative: "A highly confusing pitch. The features do not represent the selected business model well.",
        encouraging: "A good attempt! Keep debugging and tweaking your frameworks. You will get there.",
        tough: "Incomplete. Too many bloat items and a major lack of functional discipline.",
      }[currentJudge.personality];
    }

    const highlight = finalStrengths[0];

    addJudgeFeedback({
      judgeId: currentJudge.id,
      score: finalScoreVal,
      comment,
      highlight,
    });
    playScoreChord(); // trigger dynamic score chord!

    setEvaluationComplete(true);
  };

  return (
    <GameplayStageCard
      stageKey="judging"
      title="Jury Evaluation"
      subtitle="The selected judge is evaluating your project manifest under the compiler lens."
    >
      <div className="max-w-md mx-auto text-left font-mono text-[11px] space-y-4">
        {!evaluationComplete ? (
          <div className="p-5 bg-neutral-900 border border-neutral-800 rounded-md text-white shadow-xl space-y-4 leading-relaxed font-mono">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
              <span className="text-amber-400 font-bold animate-pulse">COMPILER_EVALUATION_IN_PROGRESS</span>
              <span className="text-neutral-500 text-[9px]">[RUNNING]</span>
            </div>

            <div className="space-y-1 text-neutral-400 text-[10px]">
              {loadingLogs.slice(0, loadingStep + 1).map((log, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-neutral-600">&gt;</span>
                  <span className={i === loadingStep ? "text-neutral-100 font-bold animate-pulse" : ""}>{log}</span>
                </div>
              ))}
            </div>

            <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-amber-400 h-full transition-all duration-300"
                style={{ width: `${((loadingStep + 1) / loadingLogs.length) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="p-5 bg-neutral-50 border border-neutral-900 rounded-md shadow-sm space-y-4 leading-relaxed">
            <div className="flex items-center gap-3 border-b border-border pb-3">
              <span className="text-3xl">{currentJudge?.avatar}</span>
              <div>
                <span className="text-neutral-400 block text-[9px] uppercase">EVALUATOR:</span>
                <span className="font-bold text-neutral-900 text-sm uppercase">{currentJudge?.name}</span>
                <span className="text-[9px] text-muted-foreground block font-sans font-light">{currentJudge?.title}</span>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-neutral-400 block text-[9px] uppercase">JURY_FEEDBACK_COMMENT:</span>
              <p className="text-xs text-neutral-800 font-sans italic bg-white p-3 border border-neutral-200 rounded leading-relaxed">
                "{judgeFeedback[judgeFeedback.length - 1]?.comment}"
              </p>
            </div>

            <div className="p-2.5 bg-neutral-900 border border-neutral-900 rounded text-center text-white">
              <span className="text-[10px] text-neutral-400 block uppercase font-mono tracking-wider mb-0.5">COMPUTED_SCORE_INDEX</span>
              <span className="text-2xl font-black">{judgeFeedback[judgeFeedback.length - 1]?.score}/100</span>
            </div>

            <Button
              onClick={() => {
                playMutedClick();
                nextStage();
              }}
              onMouseEnter={playSubtleHover}
              className="font-mono text-xs border border-neutral-900 w-full focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
            >
              LOAD_RESULTS_DASHBOARD.SH
            </Button>
          </div>
        )}
      </div>
    </GameplayStageCard>
  );
}

// ─── Stage 12: Final Results & Achievements ──────────────────────────────────

const ACHIEVEMENTS_LIST = [
  { id: "scope-master", name: "Scope Master", desc: "Must-Have features count: 2 or 3" },
  { id: "startup-brain", name: "Startup Brain", desc: "Monetization matches Problem type" },
  { id: "technical-wizard", name: "Technical Wizard", desc: "Activate >= 2 stack synergies" },
  { id: "judge-favorite", name: "Judge Favorite", desc: "Earn score of >= 90/100" },
  { id: "speed-builder", name: "Speed Builder", desc: "Choose extreme Fastest USP" },
  { id: "ai-pioneer", name: "AI Pioneer", desc: "Combine AI models with AI USP" },
  { id: "chaos-survivor", name: "Chaos Survivor", desc: "Faced >= 2 negative events & survived" },
  { id: "frugal-founder", name: "Frugal Founder", desc: "Freemium plus Cheapest USP" },
  { id: "lean-mean", name: "Lean & Mean", desc: "2 features, small stack (<= 3 items)" },
  { id: "omniscient", name: "Omniscient", desc: "Used the mentor advisor audit" },
  { id: "crisis-manager", name: "Crisis Manager", desc: "Resolved >= 2 negative events & score >= 80" },
  { id: "lucky-builder", name: "Lucky Builder", desc: "Faced >= 1 lucky break & score >= 85" },
  { id: "pivot-master", name: "Pivot Master", desc: "Executed a last-minute project pivot" },
];

function ResultsStage() {
  const {
    judgeFeedback,
    selectedProblem,
    solutionDirection,
    usp,
    techStack,
    features,
    businessModel,
    mentorHintsUsed,
    currentJudge,
    unlockedAchievements,
    unlockAchievement,
    resetGame,
    chaosHistory,
  } = useGameStore();

  const [copied, setCopied] = useState(false);

  const feedback = judgeFeedback[judgeFeedback.length - 1];
  const finalScore100 = feedback?.score || 0;
  const displayScore = (finalScore100 / 2).toFixed(1);

  const getGrade = (score: number) => {
    if (score >= 94) return "S";
    if (score >= 84) return "A";
    if (score >= 72) return "B";
    if (score >= 60) return "C";
    if (score >= 48) return "D";
    return "F";
  };
  const grade = getGrade(finalScore100);

  // Run achievement checks when results mount
  useEffect(() => {
    if (!feedback) return;

    const countBefore = useGameStore.getState().unlockedAchievements.length;

    // 1. Scope Master
    if (features.length === 2 || features.length === 3) {
      unlockAchievement("scope-master");
    }

    // 2. Startup Brain
    let startupBrainSynergy = false;
    if (businessModel === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      startupBrainSynergy = true;
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      startupBrainSynergy = true;
    }
    if (businessModel === "Freemium" && solutionDirection === "mobile-app") {
      startupBrainSynergy = true;
    }
    if (startupBrainSynergy) {
      unlockAchievement("startup-brain");
    }

    // 3. Technical Wizard
    const ids = new Set(techStack.map((t) => t.id));
    let synergiesCount = 0;
    if (ids.has("tech-next") && ids.has("tech-vercel")) synergiesCount++;
    if ((ids.has("tech-openai") || ids.has("tech-gemini")) && ids.has("tech-next")) synergiesCount++;
    if (ids.has("tech-esp32") && ids.has("tech-arduino")) synergiesCount++;
    if (ids.has("tech-supabase") && ids.has("tech-postgres")) synergiesCount++;
    if (synergiesCount >= 2) {
      unlockAchievement("technical-wizard");
    }

    // 4. Judge Favorite
    if (finalScore100 >= 90) {
      unlockAchievement("judge-favorite");
    }

    // 5. Speed Builder
    if (usp === "Fastest") {
      unlockAchievement("speed-builder");
    }

    // 6. AI Pioneer
    if (usp === "AI-powered" && (ids.has("tech-openai") || ids.has("tech-gemini"))) {
      unlockAchievement("ai-pioneer");
    }

    // 7. Chaos Survivor
    const triggeredEvents = CHAOS_EVENTS.filter(e => chaosHistory.includes(e.id));
    const resolvedNegativeCount = triggeredEvents.filter(e => e.category === 'technical' || e.category === 'team').length;
    const resolvedLuckyCount = triggeredEvents.filter(e => e.category === 'lucky').length;

    if ((currentJudge?.id === "judge-chaos" && finalScore100 >= 70) || resolvedNegativeCount >= 2) {
      unlockAchievement("chaos-survivor");
    }

    // 8. Frugal Founder
    if (usp === "Cheapest" && businessModel === "Freemium") {
      unlockAchievement("frugal-founder");
    }

    // 9. Lean & Mean
    if (features.length === 2 && techStack.length <= 3) {
      unlockAchievement("lean-mean");
    }

    // 10. Omniscient
    if (mentorHintsUsed > 0) {
      unlockAchievement("omniscient");
    }

    // 11. Crisis Manager
    if (resolvedNegativeCount >= 2 && finalScore100 >= 80) {
      unlockAchievement("crisis-manager");
    }

    // 12. Lucky Builder
    if (resolvedLuckyCount >= 1 && finalScore100 >= 85) {
      unlockAchievement("lucky-builder");
    }

    // 13. Pivot Master
    if (chaosHistory.includes("team-pivot-executed")) {
      unlockAchievement("pivot-master");
    }

    // Compare count after evaluation to play sound!
    setTimeout(() => {
      const countAfter = useGameStore.getState().unlockedAchievements.length;
      if (countAfter > countBefore) {
        playUnlockArpeggio();
      }
    }, 80);
  }, [feedback, unlockAchievement, chaosHistory, currentJudge, finalScore100]);

  const getStrengthsAndWeaknesses = () => {
    const derivedStrengths: string[] = [];
    const derivedWeaknesses: string[] = [];

    const techIds = new Set(techStack.map((t) => t.id));
    if (techIds.has("tech-next") && techIds.has("tech-vercel")) {
      derivedStrengths.push("Excellent Next.js + Vercel deployment infrastructure synergy.");
    }
    if ((techIds.has("tech-openai") || techIds.has("tech-gemini")) && techIds.has("tech-next")) {
      derivedStrengths.push("Cutting-edge integration of AI models with Next.js frontend.");
    }
    if (techIds.has("tech-esp32") && techIds.has("tech-arduino")) {
      derivedStrengths.push("High-fidelity matching of physical IoT boards with compilers.");
    }
    if (techIds.has("tech-supabase") && techIds.has("tech-postgres")) {
      derivedStrengths.push("Robust database architecture matching PostgreSQL latency speeds.");
    }

    if (features.length === 2 || features.length === 3) {
      derivedStrengths.push("Extremely lean and disciplined product scoping boundary rules.");
    } else if (features.length > 3) {
      derivedWeaknesses.push("Severe product scope bloat. Team tried compiling too many components.");
    } else if (features.length < 2) {
      derivedWeaknesses.push("Under-scoped roadmap. MVP fails to meet baseline requirements.");
    }

    if (businessModel === "Government Partnership" && (selectedProblem?.category === "sustainability" || selectedProblem?.category === "smart-campus")) {
      derivedStrengths.push("Outstanding strategic fit matching public sponsorship with offsets problem.");
    }
    if (businessModel === "B2B SaaS" && (usp === "Most Scalable" || selectedProblem?.id === "prob-learnflow")) {
      derivedStrengths.push("Excellent monetization alignment combining B2B SaaS licensing with scale.");
    }

    if (solutionDirection === "ai-solution" && !techIds.has("tech-openai") && !techIds.has("tech-gemini")) {
      derivedWeaknesses.push("Critical stack gap: AI Solution direction without AI models.");
    }
    if (solutionDirection === "iot-product" && !techIds.has("tech-esp32") && !techIds.has("tech-arduino")) {
      derivedWeaknesses.push("Critical stack gap: IoT Hardware direction without microcontrollers.");
    }

    if (usp === "Fastest" && techIds.has("tech-aws")) {
      derivedWeaknesses.push("Deployment latency: AWS servers contradict Fastest USP.");
    }

    if (mentorHintsUsed > 0) {
      derivedWeaknesses.push("Mentor advisor reliance: Assessment penalty for auditor reliance.");
    }

    if (derivedStrengths.length < 2) {
      derivedStrengths.push("Consistent architectural execution boundaries.");
      derivedStrengths.push("Clear strategic path outlining MVP focus areas.");
    }
    if (derivedWeaknesses.length < 2) {
      derivedWeaknesses.push("Slight optimization room left in the core query pipeline.");
      derivedWeaknesses.push("Monetization channels could benefit from extra validation.");
    }

    return {
      strengths: derivedStrengths.slice(0, 2),
      weaknesses: derivedWeaknesses.slice(0, 2),
    };
  };

  const { strengths, weaknesses } = getStrengthsAndWeaknesses();

  const generateAsciiCard = () => {
    const divider = "├──────────────────────────────────────────┤";
    const borderTop = "┌──────────────────────────────────────────┐";
    const borderBottom = "└──────────────────────────────────────────┘";
    
    const formatLine = (label: string, value: string) => {
      const lineContent = `│ ${label}: ${value}`;
      const padding = 42 - lineContent.length;
      return lineContent + " ".repeat(Math.max(0, padding)) + " │";
    };

    return [
      borderTop,
      formatLine("THE HACKATHON SIMULATOR", "v1.0"),
      divider,
      formatLine("PROBLEM", selectedProblem?.title.toUpperCase() || "N/A"),
      formatLine("DIRECTION", (solutionDirection || "N/A").toUpperCase()),
      formatLine("USP", (usp || "N/A").toUpperCase()),
      formatLine("MODEL", (businessModel || "N/A").toUpperCase()),
      divider,
      formatLine("JUDGE", (currentJudge?.name || "N/A").toUpperCase()),
      formatLine("FINAL SCORE", `${displayScore}/50 (GRADE ${grade})`),
      divider,
      formatLine("ACHIEVEMENTS", `${unlockedAchievements.length}/10 UNLOCKED`),
      borderBottom
    ].join("\n");
  };

  const copyToClipboard = () => {
    const cardText = generateAsciiCard();
    navigator.clipboard.writeText(cardText).then(() => {
      setCopied(true);
      playSnapSound();
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <GameplayStageCard
      stageKey="results"
      title="Hackathon Results"
      subtitle="Jury evaluation complete. Review your scores, unlocked achievements, and copy your social share card."
    >
      <div className="max-w-2xl mx-auto text-left font-mono text-[11px] space-y-6">
        
        {/* Results Main Banner Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-4 bg-neutral-900 border border-neutral-900 rounded text-center text-white flex flex-col justify-center shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1 font-bold">FINAL_SCORE_INDEX</span>
            <span className="text-3xl font-black">{displayScore} <span className="text-xs font-normal text-neutral-400">/ 50</span></span>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded text-center flex flex-col items-center justify-center relative overflow-hidden shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-2">LETTER_GRADE</span>
            <motion.div
              initial={{ scale: 3.5, rotate: -35, opacity: 0 }}
              animate={{ scale: 1, rotate: -8, opacity: 1 }}
              transition={{ type: "spring", stiffness: 150, damping: 10, delay: 0.3 }}
              className="px-4 py-1.5 border-2 border-double border-neutral-900 text-neutral-900 font-mono text-2xl font-black uppercase tracking-wider rounded select-none shadow-[2px_2px_0px_#1e1e1e]"
            >
              {grade}
            </motion.div>
          </div>

          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded text-center flex flex-col justify-center shadow-sm">
            <span className="text-[9px] text-neutral-400 block uppercase tracking-wider mb-1">JURY_VERDICT</span>
            <span className="text-xs font-bold text-neutral-800 uppercase truncate">
              {finalScore100 >= 70 ? "✅ PROJECT APPROVED" : "❌ COMPILE FAILED"}
            </span>
          </div>
        </div>

        {/* Strengths & Weaknesses */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-dashed border-border pt-4">
          <div className="space-y-2">
            <span className="text-emerald-600 block text-[9px] uppercase font-bold">+++ PROJECT_STRENGTHS:</span>
            <ul className="space-y-1.5">
              {strengths.map((str, idx) => (
                <li key={idx} className="flex gap-2 text-neutral-850 font-sans font-light text-[11px]">
                  <span className="text-emerald-600 font-mono text-[9px] mt-0.5">[+]</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-2">
            <span className="text-rose-600 block text-[9px] uppercase font-bold">--- PROJECT_WEAKNESSES:</span>
            <ul className="space-y-1.5">
              {weaknesses.map((wk, idx) => (
                <li key={idx} className="flex gap-2 text-neutral-850 font-sans font-light text-[11px]">
                  <span className="text-rose-600 font-mono text-[9px] mt-0.5">[-]</span>
                  <span>{wk}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Judge Verdict Comment */}
        {currentJudge && (
          <div className="p-4 bg-neutral-50 border border-neutral-200 rounded-md space-y-2 border-l-4 border-l-neutral-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentJudge.avatar}</span>
              <div>
                <span className="text-neutral-500 text-[8px] block uppercase leading-none font-bold">JURY_REASONING_MEMO</span>
                <span className="font-bold text-neutral-900 text-[10px] uppercase">{currentJudge.name}</span>
              </div>
            </div>
            <p className="text-xs text-neutral-800 font-sans italic pt-1 leading-relaxed">
              "{feedback?.comment}"
            </p>
          </div>
        )}

        {/* Achievements Grid */}
        <div className="border-t border-dashed border-border pt-4">
          <span className="text-neutral-400 block text-[9px] uppercase mb-3">GLOBAL_ACHIEVEMENTS_DECRYPTION:</span>
          <motion.div
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: {
                  staggerChildren: 0.05
                }
              }
            }}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]"
          >
            {ACHIEVEMENTS_LIST.map((ac) => {
              const isUnlocked = unlockedAchievements.includes(ac.id);
              return (
                <motion.div
                  key={ac.id}
                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
                  }}
                  className={`p-2.5 rounded border flex items-center justify-between transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] ${
                    isUnlocked
                      ? "border-neutral-900 bg-neutral-900 text-white font-bold"
                      : "border-neutral-200 bg-white text-neutral-400 border-dashed"
                  }`}
                >
                  <div className="text-left">
                    <span className="block uppercase tracking-tight">{ac.name}</span>
                    <span className={`text-[8px] font-sans font-light block mt-0.5 leading-none ${isUnlocked ? 'text-neutral-300' : 'text-neutral-500'}`}>
                      {ac.desc}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-neutral-100/10">
                    {isUnlocked ? "[UNLOCKED]" : "[LOCKED]"}
                  </span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Shareable Result Card */}
        <div className="border-t border-dashed border-border pt-4 space-y-2">
          <span className="text-neutral-400 block text-[9px] uppercase">SHAREABLE_SOCIAL_MANIFEST.ASCII</span>
          <pre className="p-3 bg-neutral-900 text-neutral-100 rounded text-[9px] font-mono leading-tight text-left overflow-x-auto whitespace-pre">
            {generateAsciiCard()}
          </pre>
          <Button
            onClick={copyToClipboard}
            onMouseEnter={playSubtleHover}
            variant="outline"
            className="w-full font-mono text-xs border border-neutral-900 h-8 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
          >
            {copied ? "[MANIFEST_COPIED_TO_CLIPBOARD.TXT]" : "COPY_MANIFEST_ASCII.EXE"}
          </Button>
        </div>

        {/* Action Controls */}
        <div className="border-t border-border pt-4">
          <Button
            onClick={() => {
              playMutedClick();
              resetGame();
            }}
            onMouseEnter={playSubtleHover}
            className="w-full font-mono text-xs border border-neutral-900 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
          >
            🔄 REBOOT_SIMULATOR.EXE
          </Button>
        </div>

      </div>
    </GameplayStageCard>
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

      <div className="flex items-center justify-between mb-3 pt-2 border-t border-border/60 text-[10px]">
        <span className="font-bold text-neutral-500 uppercase">SYNTH_SOUND:</span>
        <button
          onClick={() => {
            playMutedClick();
            useGameStore.getState().toggleSound();
          }}
          className={`px-2 py-0.5 rounded border font-mono text-[9px] font-bold cursor-pointer ${
            useGameStore.getState().soundEnabled
              ? "bg-neutral-900 text-white border-neutral-900"
              : "bg-neutral-100 text-neutral-400 border-neutral-200"
          }`}
        >
          {useGameStore.getState().soundEnabled ? "ON" : "MUTED"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1.5 mb-3 pt-2 border-t border-border/60">
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            playMutedClick();
            if (isTimerPaused) resumeTimer(); else pauseTimer();
          }}
          className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
        >
          {isTimerPaused ? "RESUME_TIME" : "PAUSE_TIME"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          onClick={() => {
            playMutedClick();
            nextStage();
          }}
          className="text-[10px] h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
        >
          SKIP_STAGE
        </Button>
        <Button
          size="xs"
          variant="destructive"
          onClick={() => {
            playMutedClick();
            resetGame();
          }}
          className="text-[10px] col-span-2 h-7 focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none"
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

// ─── Chaos Event Interruption Modal ──────────────────────────────────────────

function ChaosEventOverlay() {
  const { activeChaosEvent, resolveChaosEvent } = useGameStore();

  useEffect(() => {
    if (activeChaosEvent) {
      // Play warning ticker sound when modal initiates
      playWarningTick();
    }
  }, [activeChaosEvent]);

  if (!activeChaosEvent) return null;

  const getCategoryTag = (cat: string) => {
    switch (cat) {
      case "technical":
        return "[TECHNICAL_FIRE]";
      case "team":
        return "[TEAM_CHAOS]";
      case "lucky":
        return "[LUCKY_BREAK]";
      case "judge":
        return "[JURY_SURPRISE]";
      default:
        return "[INCIDENT]";
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "technical":
        return "text-rose-600 border-rose-250 bg-rose-50/60";
      case "team":
        return "text-amber-600 border-amber-250 bg-amber-50/60";
      case "lucky":
        return "text-emerald-600 border-emerald-250 bg-emerald-50/60";
      case "judge":
        return "text-indigo-600 border-indigo-250 bg-indigo-50/60";
      default:
        return "text-neutral-600 border-neutral-200 bg-neutral-50/50";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/60 backdrop-blur-xs p-4 overflow-y-auto font-mono text-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -8 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md bg-stone-50 border-2 border-neutral-900 rounded-lg shadow-2xl p-6 sm:p-8 text-left"
      >
        {/* Terminal warning banner */}
        <div className="text-center mb-6 select-none font-bold text-neutral-900 leading-tight">
          <div>=============================================</div>
          <div className="text-neutral-900 tracking-wider flex items-center justify-center gap-1.5 py-1">
            <AlertTriangle className="w-4 h-4 animate-pulse text-amber-600" />
            <span>⚠ CRITICAL HACKATHON INCIDENT DETECTED</span>
          </div>
          <div>=============================================</div>
        </div>

        {/* Event Header Info */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-dashed border-border/80">
          <span className="text-[10px] text-muted-foreground">
            EVENT_ID: {activeChaosEvent.id.toUpperCase()}
          </span>
          <span
            className={`px-2 py-0.5 rounded border text-[9px] uppercase font-bold tracking-wider ${getCategoryColor(
              activeChaosEvent.category
            )}`}
          >
            {getCategoryTag(activeChaosEvent.category)}
          </span>
        </div>

        <h3 className="text-sm font-black uppercase tracking-tight text-neutral-900 mb-3 border-b border-dashed border-border/80 pb-2">
          {activeChaosEvent.title}
        </h3>

        <p className="text-[10px] text-neutral-700 leading-relaxed mb-6 bg-white p-3.5 border border-neutral-250 rounded shadow-[inset_0_1px_2px_rgba(0,0,0,0.015)]">
          {activeChaosEvent.description}
        </p>

        {/* Choice buttons */}
        <div className="space-y-3">
          <span className="text-neutral-400 block text-[9px] uppercase tracking-wider">
            CHOOSE_TACTICAL_ACTION.EXE:
          </span>
          {activeChaosEvent.choices.map((choice, index) => (
            <button
              key={index}
              onClick={() => {
                playMutedClick();
                resolveChaosEvent(index);
              }}
              onMouseEnter={playSubtleHover}
              className="w-full text-left p-3.5 bg-white border border-neutral-250 rounded hover:border-neutral-900 transition-all duration-200 transform hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.03)] focus-visible:ring-1 focus-visible:ring-neutral-900 focus-visible:outline-none focus:outline-none flex flex-col cursor-pointer"
            >
              <div className="flex items-start justify-between w-full">
                <span className="font-bold text-neutral-900 tracking-tight text-[11px] uppercase">
                  &gt; {choice.label}
                </span>
                <span className="text-[8px] px-1.5 py-0.5 bg-neutral-100 text-neutral-500 rounded border border-neutral-200 font-mono tracking-wider">
                  ACTION_0{index + 1}
                </span>
              </div>

              <p className="text-[10px] text-muted-foreground mt-2 font-sans font-light leading-relaxed">
                {choice.description}
              </p>

              {choice.effectText && (
                <div className="mt-3 text-[9px] text-neutral-900 font-mono flex items-center gap-1 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-250 w-fit">
                  <Zap className="w-3 h-3 text-amber-500 animate-pulse" />
                  <span className="font-bold">EFFECTS:</span> {choice.effectText}
                </div>
              )}
            </button>
          ))}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Conditional Stage Orchestrator / GamePage ───────────────────────────

export default function GamePage() {
  const { stage, isGameStarted, startGame, tickTimer, isTimerPaused, activeChaosEvent } = useGameStore();

  useEffect(() => {
    if (!isGameStarted) {
      startGame();
    }
  }, [isGameStarted, startGame]);

  useEffect(() => {
    if (isTimerPaused) return;
    const interval = setInterval(() => {
      tickTimer();
      const remaining = useGameStore.getState().globalTimeRemaining;
      if (remaining > 0 && remaining <= 60) {
        if (remaining <= 10) {
          playWarningTick(); // tick every second in final 10 seconds
        } else if (remaining % 10 === 0) {
          playWarningTick(); // tick every 10 seconds in final minute
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isTimerPaused, tickTimer]);

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
      case "pitchPrep":
        return <PitchPrepStage key="pitchPrep" />;
      case "judgeSpin":
        return <JudgeSpinStage key="judgeSpin" />;
      case "judging":
        return <JudgingStage key="judging" />;
      case "results":
        return <ResultsStage key="results" />;
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
        <AnimatePresence>
          {activeChaosEvent && <ChaosEventOverlay />}
        </AnimatePresence>
        <DevDebugPanel />
      </div>
    </GameLayout>
  );
}
