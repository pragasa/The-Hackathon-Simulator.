/**
 * @fileoverview Zustand store for The Hackathon Simulator game state.
 *
 * Implements exactly 5 logical slices composed into a single unified store:
 * 1. coreSlice: Stage state machine, difficulty setting, drag-drop arrays, and navigation.
 * 2. timerSlice: Unified global countdown ticking, dynamically loaded difficulty seconds, pause/resume.
 * 3. scoringSlice: Categories and calculated total score tracking.
 * 4. mentorSlice: Count of warnings/hints utilized.
 * 5. judgingSlice: Active judge evaluation status, feedback logs, spin wheel states.
 *
 * Fully integrated with devtools for debugging and persist middleware for crash resilience.
 *
 * @module store/gameStore
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type {
  GameState,
  GameActions,
  GameStage,
  GamePhase,
  Problem,
  TechItem,
  Feature,
  Judge,
  JudgeFeedback,
  ScoreBreakdown,
  ChaosEvent,
  GameStats,
  GeneratedBusinessModel,
  AdvisorAdvice,
  JudgeDecisionMemory,
  Teammate,
  TeamChatMoment,
} from '@/types/game';
import { getRandomChaosEvent, CHAOS_EVENTS } from '@/data/chaosEvents';
import { getDailyChallenge } from '@/lib/dailyChallenge';
import { evaluatePitchDeck } from '@/lib/pitchDeckEvaluator';
import { TECH_REGISTRY, toRegistryId, toStoreId } from '@/data/techRegistry';
import { generateCustomElevatorPitch, calculateMentorConfidence } from '@/lib/projectStrategyGenerator';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Stage order sequence for the simulator.
 */
export const STAGE_ORDER: GameStage[] = [
  'difficulty',
  'teamFormation',
  'problemReveal',
  'solutionDirection',
  'techStack',
  'usp',
  'features',
  'pitchDeck',
  'mentor',
  'businessModel',
  'pitchPrep',
  'judgeSpin',
  'judging',
  'results',
];

/**
 * Seconds allocated for each difficulty level.
 */
export const DIFFICULTY_TIMERS = {
  easy: 10 * 60,   // 10 minutes (600s)
  medium: 7 * 60,  // 7 minutes (420s)
  hard: 5 * 60,   // 5 minutes (300s)
  dev: 60,         // 60 seconds (quick debugging)
};

/**
 * Phase relevance checker for teammate roles in Update v2.1.
 */
export function isRoleRelevantForStage(role: string | null, stage: string): boolean {
  if (!role) return false;
  const r = role.toLowerCase();
  
  if (r.includes("backend developer") || r.includes("ai engineer") || r.includes("ai specialist")) {
    return ['techStack', 'features'].includes(stage);
  }
  if (r.includes("frontend developer")) {
    return ['techStack', 'features', 'pitchDeck'].includes(stage);
  }
  if (r.includes("designer")) {
    return ['usp', 'pitchDeck', 'features'].includes(stage);
  }
  if (r.includes("strategist") || r.includes("founder")) {
    return ['businessModel', 'usp'].includes(stage);
  }
  if (r.includes("pitch")) {
    return ['pitchPrep', 'pitchDeck'].includes(stage);
  }
  if (r.includes("researcher")) {
    return ['problemReveal', 'solutionDirection'].includes(stage);
  }
  if (r.includes("chaiwala") || r.includes("chai")) {
    return ['techStack', 'features', 'mentor', 'businessModel', 'pitchPrep'].includes(stage);
  }
  return false;
}

/**
 * Legacy phase mapping for backwards compatibility with unchanged layout components.
 */
const mapStageToPhase = (stage: GameStage): GamePhase => {
  switch (stage) {
    case 'difficulty':
    case 'teamFormation':
    case 'problemReveal':
      return 'PROBLEM_REVEAL';
    case 'solutionDirection':
    case 'techStack':
      return 'TECH_STACK';
    case 'usp':
    case 'features':
    case 'pitchDeck':
      return 'FEATURE_PRIORITY';
    case 'mentor':
    case 'businessModel':
    case 'pitchPrep':
      return 'BUILDING';
    case 'judgeSpin':
    case 'judging':
      return 'JUDGING';
    case 'results':
      return 'RESULTS';
  }
};

const compileDecisionMemory = (state: any): JudgeDecisionMemory => ({
  chosenUsp: state.usp,
  selectedTechIds: state.techStack.map((t: any) => toRegistryId(t.id)),
  mentorDecisions: state.generatedAdvisorAdvice.reduce((acc: any, adv: any) => {
    acc[adv.id] = adv.status;
    return acc;
  }, {} as Record<string, 'applied' | 'rejected' | 'pending'>),
  backlogFeatureIds: state.features.map((f: any) => f.id),
  businessModelChoice: state.businessModel,
  pitchStructureSlides: state.pitchDeck,
});

const TEAM_CHAT_MOMENTS = [
  {
    id: "chat-scope",
    title: "Backlog Dispute",
    teammateA: { name: "Riya", avatar: "🤖", statement: "Let's add advanced machine learning recommendations to our dashboard. It will impress the judges." },
    teammateB: { name: "Anjali", avatar: "👩‍💻", statement: "No way. We haven't even finished the database setup yet. We will end up presenting a broken demo." },
    choices: [
      {
        label: "Favour Riya (Add AI)",
        description: "Add ML recommendations to boost project innovation.",
        outcomeText: "Added ML recommendations. Innovation score increased, but execution risk rose.",
        modifiers: { innovation: 15, execution: -8 }
      },
      {
        label: "Favour Anjali (Focus Database)",
        description: "Focus on clean relational database routing and data schema.",
        outcomeText: "Focused on database routing. Execution score increased, but innovation was lowered.",
        modifiers: { execution: 12, innovation: -5 }
      },
      {
        label: "Compromise (Mock ML)",
        description: "Use a simple static dataset with mock recommendations.",
        outcomeText: "Mocked the AI feed. Design and pitch scores increased with zero build overhead.",
        modifiers: { design: 6, pitch: 6 }
      }
    ]
  },
  {
    id: "chat-pricing",
    title: "Monetization Strategy",
    teammateA: { name: "Sam", avatar: "👨‍💼", statement: "We need high monthly subscription plans to prove commercial viability." },
    teammateB: { name: "Priya", avatar: "👩‍🎨", statement: "A strict paywall will scare away all beta testers. We need a frictionless free tier." },
    choices: [
      {
        label: "Support Sam (Paid Tiers)",
        description: "Focus on corporate premium monetization structures.",
        outcomeText: "Implemented corporate plans. Business viability score boosted, pitch metrics slightly penalized.",
        modifiers: { pitch: -5, bonus: 10 }
      },
      {
        label: "Support Priya (Free Model)",
        description: "Implement a fully open-source or free user tier model.",
        outcomeText: "Selected free tier model. Pitch scores increased, but business viability is lower.",
        modifiers: { pitch: 15, design: 5, bonus: -5 }
      },
      {
        label: "Compromise (Sponsor Model)",
        description: "Keep it free for students but show localized campus sponsor links.",
        outcomeText: "Implemented campus sponsor wedge. Business viability and design metrics balanced.",
        modifiers: { pitch: 8, design: 8 }
      }
    ]
  },
  {
    id: "chat-tech",
    title: "Architecture Overhead",
    teammateA: { name: "David", avatar: "👨‍💻", statement: "Let's build a custom WebSockets real-time server for live state updates." },
    teammateB: { name: "Leo", avatar: "👨‍🎨", statement: "That's overkill for a 24-hour demo. A simple fetch interval is more than enough." },
    choices: [
      {
        label: "Build Sockets",
        description: "Dedicate time to live WebSocket sockets integration.",
        outcomeText: "Implemented live sockets. Technical stack score boosted, but execution penalty applied due to scope.",
        modifiers: { innovation: 12, execution: -8 }
      },
      {
        label: "Use Fetch Interval",
        description: "Stick to basic REST fetch intervals and keep code simple.",
        outcomeText: "Selected simple REST queries. Execution complexity decreased, design polish optimized.",
        modifiers: { execution: 12, design: 5 }
      },
      {
        label: "Compromise (Serverless Hook)",
        description: "Use serverless cloud triggers to fetch updates on-demand.",
        outcomeText: "Integrated serverless hooks. Execution and pitch variables optimized.",
        modifiers: { execution: 8, pitch: 8 }
      }
    ]
  }
];

const getNextTeamChatMoment = (history: string[], team: any[]): TeamChatMoment | null => {
  if (team.length < 2) return null;
  const available = TEAM_CHAT_MOMENTS.filter(m => !history.includes(m.id));
  if (available.length === 0) return null;

  const idx = Math.floor(Math.random() * available.length);
  const moment = { ...available[idx] };

  const tA = team[1] || team[0];
  moment.teammateA = {
    name: tA.name,
    avatar: tA.avatar,
    statement: moment.teammateA.statement
  };

  const tB = team[2] || team[0];
  moment.teammateB = {
    name: tB.name,
    avatar: tB.avatar,
    statement: moment.teammateB.statement
  };

  return moment;
};

const initialScore: ScoreBreakdown = {
  innovation: 0,
  execution: 0,
  design: 0,
  pitch: 0,
  bonus: 0,
  total: 0,
};

// ---------------------------------------------------------------------------
// Composed Initial State
// ---------------------------------------------------------------------------

const initialStats = {
  totalRuns: 0,
  bestScore: 0,
  averageScore: 0,
  favoriteStack: [] as string[],
  chaosSurvivalRate: 0,
  judgeWinRate: 0,
  chaosRunsFaced: 0,
  chaosRunsSurvived: 0,
  judgeWins: 0,
  techUsage: {} as Record<string, number>,
};

const initialGameState = {
  stage: 'difficulty' as GameStage,
  phase: 'PROBLEM_REVEAL' as GamePhase,
  difficulty: null as 'easy' | 'medium' | 'hard' | 'dev' | null,
  selectedProblem: null as Problem | null,
  solutionDirection: null as string | null,
  techStack: [] as TechItem[],
  usp: null as string | null,
  primaryUsp: null as string | null,
  secondaryUsp: null as string | null,
  features: [] as Feature[],
  mentorName: null as string | null,
  businessModel: null as string | null,
  pitchText: '',
  
  // Legacy countdown support
  timeRemaining: 0,
  totalTime: 0,

  // Sprint 2 Global Timer System
  globalTimeRemaining: 0,
  globalTotalTime: 0,
  isTimerPaused: true,

  // Scores & Analytics
  score: initialScore,
  
  // Evaluation
  currentJudge: null as Judge | null,
  judgeFeedback: [] as JudgeFeedback[],
  judgeSpinState: 'idle' as 'idle' | 'spinning' | 'done',

  // Mentors & events logs
  mentorHintsUsed: 0,
  events: [],
  isGameStarted: false,
  isGameOver: false,
  unlockedAchievements: [] as string[],
  soundEnabled: true,
  activeChaosEvent: null as ChaosEvent | null,
  chaosHistory: [] as string[],
  gameMode: 'classic' as 'classic' | 'daily' | 'speedrun' | 'chaos' | 'hardcore',
  activeModifiers: [] as string[],
  dailyModifier: null as string | null,
  stats: initialStats,

  // Update v1.5: Pitch Deck Builder variables
  pitchDeck: [] as string[],
  pitchDeckScore: 0,
  deckNarrativeQuality: 'Fragmented',
  deckArchetype: 'Custom Deck',

  // Update :: AI Generated Project Design System variables
  generatedUSPs: [] as any[],
  generatedBacklog: [] as any[],

  // Update v1.7: AI Co-Founder System variables
  generatedBusinessModels: [] as GeneratedBusinessModel[],
  generatedAdvisorAdvice: [] as AdvisorAdvice[],
  mentorConfidence: 50,

  // Update v1.8: Hidden Scoring + Project Health Dashboard variables
  judgeDecisionMemory: null as JudgeDecisionMemory | null,
  roastText: "",

  // Update v2.0: Team System variables
  playerName: "",
  playerAvatar: "🧑‍💻",
  team: [] as Teammate[],
  activeTeamChatMoment: null as TeamChatMoment | null,
  teamChatHistory: [] as string[],
  activeTeammateAdvice: {} as Record<string, any>,
  teamAdviceHistory: [] as { teammateId: string; adviceId: string; title: string; stage: string; status: 'applied' | 'rejected'; }[],
  teamContributionLogs: [] as string[],
};

// ---------------------------------------------------------------------------
// Store Implementation
// ---------------------------------------------------------------------------

export const useGameStore = create<GameState & GameActions>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialGameState,

        // ─── coreSlice Actions ───
        
        startGame: () =>
          set(
            {
              ...initialGameState,
              isGameStarted: true,
              stage: 'difficulty',
              phase: mapStageToPhase('difficulty'),
            },
            false,
            'core/startGame'
          ),

        setDifficulty: (difficulty) => {
          const isSpeedRun = get().gameMode === 'speedrun';
          const seconds = isSpeedRun ? 180 : DIFFICULTY_TIMERS[difficulty];
          set(
            {
              difficulty,
              globalTotalTime: seconds,
              globalTimeRemaining: seconds,
              timeRemaining: seconds, // Legacy support
              totalTime: seconds,     // Legacy support
              isTimerPaused: true,
              stage: 'teamFormation',
              phase: mapStageToPhase('teamFormation'),
            },
            false,
            'core/setDifficulty'
          );
        },

        nextStage: () => {
          const { stage } = get();
          const currentIndex = STAGE_ORDER.indexOf(stage);
          if (currentIndex < STAGE_ORDER.length - 1) {
            const next = STAGE_ORDER[currentIndex + 1];
            
            // Chaos Event or Team Chat check at transition gates (after 'problemReveal', 'techStack', 'features', 'businessModel')
            const gates: GameStage[] = ['problemReveal', 'techStack', 'features', 'businessModel'];
            if (gates.includes(stage)) {
              const isChaosMagnet = get().activeModifiers.includes('CHAOS_MAGNET') || get().gameMode === 'chaos';
              const triggerChance = isChaosMagnet ? 0.35 : 0.15;
              
              // 1. Team Chat Moment triggers first (20% chance if team size >= 2)
              const hasTeam = get().team.length >= 2;
              if (hasTeam && Math.random() <= 0.20) {
                const moment = getNextTeamChatMoment(get().teamChatHistory, get().team);
                if (moment) {
                  set({
                    activeTeamChatMoment: moment,
                    isTimerPaused: true,
                    stage: next,
                    phase: mapStageToPhase(next),
                    isGameOver: next === 'results',
                    judgeDecisionMemory: compileDecisionMemory(get()),
                  }, false, 'core/nextStageWithTeamChat');
                  return;
                }
              }

              // 2. Fallback to Chaos Event
              if (Math.random() <= triggerChance) {
                const event = getRandomChaosEvent(get().chaosHistory);
                set(
                  {
                    activeChaosEvent: event,
                    isTimerPaused: true, // pause standard clock
                    stage: next,
                    phase: mapStageToPhase(next),
                    isGameOver: next === 'results',
                    judgeDecisionMemory: compileDecisionMemory(get()),
                  },
                  false,
                  'core/nextStageWithChaos'
                );
                return;
              }
            }

            set(
              {
                stage: next,
                phase: mapStageToPhase(next),
                isGameOver: next === 'results',
                isTimerPaused: next === 'results' ? true : (stage === 'problemReveal' ? false : get().isTimerPaused),
                judgeDecisionMemory: compileDecisionMemory(get()),
              },
              false,
              'core/nextStage'
            );
          }
        },

        nextPhase: () => {
          get().nextStage();
        },

        previousStage: () => {
          const { stage } = get();
          const currentIndex = STAGE_ORDER.indexOf(stage);
          if (currentIndex > 0) {
            const prev = STAGE_ORDER[currentIndex - 1];
            set(
              {
                stage: prev,
                phase: mapStageToPhase(prev),
              },
              false,
              'core/previousStage'
            );
          }
        },

        jumpToStage: (targetStage) => {
          set(
            {
              stage: targetStage,
              phase: mapStageToPhase(targetStage),
              isGameOver: targetStage === 'results',
              isTimerPaused: targetStage === 'results' ? true : get().isTimerPaused,
            },
            false,
            'core/jumpToStage'
          );
        },

        selectProblem: (problem) =>
          set({ 
            selectedProblem: problem,
            usp: null,
            primaryUsp: null,
            secondaryUsp: null,
            features: [],
            generatedUSPs: [],
            generatedBacklog: [],
            generatedBusinessModels: [],
            generatedAdvisorAdvice: [],
            businessModel: null,
            pitchText: "",
            roastText: "",
          }, false, 'core/selectProblem'),

        setSolutionDirection: (direction) =>
          set({ 
            solutionDirection: direction,
            usp: null,
            primaryUsp: null,
            secondaryUsp: null,
            features: [],
            generatedUSPs: [],
            generatedBacklog: [],
            generatedBusinessModels: [],
            generatedAdvisorAdvice: [],
            businessModel: null,
            pitchText: "",
            roastText: "",
          }, false, 'core/setSolutionDirection'),

        addTechItem: (item) =>
          set(
            (state) => ({
              techStack: [...state.techStack, item],
            }),
            false,
            'core/addTechItem'
          ),

        removeTechItem: (itemId) =>
          set(
            (state) => ({
              techStack: state.techStack.filter((t) => t.id !== itemId),
            }),
            false,
            'core/removeTechItem'
          ),

        setUsp: (usp) => set({ usp }, false, 'core/setUsp'),

        setPrimaryUsp: (primaryUsp) => set((state) => {
          const secondary = state.secondaryUsp;
          const blendedUsp = primaryUsp && secondary ? `Primary: ${primaryUsp} | Secondary: ${secondary}` : primaryUsp || secondary || null;
          return { primaryUsp, usp: blendedUsp };
        }, false, 'core/setPrimaryUsp'),

        setSecondaryUsp: (secondaryUsp) => set((state) => {
          const primary = state.primaryUsp;
          const blendedUsp = primary && secondaryUsp ? `Primary: ${primary} | Secondary: ${secondaryUsp}` : primary || secondaryUsp || null;
          return { secondaryUsp, usp: blendedUsp };
        }, false, 'core/setSecondaryUsp'),

        reorderFeatures: (features) => set({ features }, false, 'core/reorderFeatures'),

        setMentorName: (name) => set({ mentorName: name }, false, 'core/setMentorName'),

        setBusinessModel: (model) => set({ businessModel: model }, false, 'core/setBusinessModel'),
        
        setPitchText: (text) => set({ pitchText: text }, false, 'core/setPitchText'),

        setPitchDeck: (slides) => {
          const evalRes = evaluatePitchDeck(slides);
          
          // Calculate unblended tech stack pitch potential
          const techStack = get().techStack;
          let techStackPitch = 50;
          techStack.forEach((tech) => {
            const regId = toRegistryId(tech.id);
            const regItem = TECH_REGISTRY.find((item) => item.id === regId);
            if (regItem) {
              techStackPitch += regItem.pitchWeight;
            }
          });
          techStackPitch = Math.max(0, Math.min(techStackPitch, 100));

          // Blended Pitch Score = 40% Tech Stack Pitch + 60% Pitch Deck Score
          const blendedPitch = Math.round((techStackPitch * 0.4) + (evalRes.score * 0.6));

          set({
            pitchDeck: slides,
            pitchDeckScore: evalRes.score,
            deckNarrativeQuality: evalRes.quality,
            deckArchetype: evalRes.archetype,
            score: {
              ...get().score,
              pitch: Math.max(0, Math.min(blendedPitch, 100))
            }
          }, false, 'core/setPitchDeck');
        },

        setGeneratedUSPs: (usps) => set({ generatedUSPs: usps }, false, 'core/setGeneratedUSPs'),
        setGeneratedBacklog: (backlog) => set({ generatedBacklog: backlog }, false, 'core/setGeneratedBacklog'),
        setGeneratedBusinessModels: (models) => set({ generatedBusinessModels: models }, false, 'core/setGeneratedBusinessModels'),
        setGeneratedAdvisorAdvice: (advice) => set({ generatedAdvisorAdvice: advice }, false, 'core/setGeneratedAdvisorAdvice'),
        setRoastText: (roastText) => set({ roastText }, false, 'core/setRoastText'),

        applyAdvisorAdvice: (adviceId) => {
          const state = get();
          const nextAdvice = state.generatedAdvisorAdvice.map(adv => {
            if (adv.id === adviceId) {
              return { ...adv, status: 'applied' as const };
            }
            return adv;
          });

          const targetAdvice = state.generatedAdvisorAdvice.find(a => a.id === adviceId);
          if (!targetAdvice) return;

          // 1. Apply score modifiers
          const mods = targetAdvice.scoreModifiers;
          const nextScore = { ...state.score };
          if (mods.innovation !== undefined) nextScore.innovation = Math.max(0, Math.min(100, nextScore.innovation + mods.innovation));
          if (mods.execution !== undefined) nextScore.execution = Math.max(0, Math.min(100, nextScore.execution + mods.execution));
          if (mods.design !== undefined) nextScore.design = Math.max(0, Math.min(100, nextScore.design + mods.design));
          if (mods.pitch !== undefined) nextScore.pitch = Math.max(0, Math.min(100, nextScore.pitch + mods.pitch));
          if (mods.bonus !== undefined) nextScore.bonus = nextScore.bonus + mods.bonus;

          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          // 2. Perform side effects
          let nextFeatures = [...state.features];
          let nextTechStack = [...state.techStack];
          let nextPitchDeck = [...state.pitchDeck];
          let nextGeneratedBusinessModels = [...state.generatedBusinessModels];
          let nextUsp = state.usp;

          const actionType = targetAdvice.action?.type;

          if (actionType === 'replace_tech') {
            const fromIds = targetAdvice.action?.payload?.from || [];
            const toId = targetAdvice.action?.payload?.to;
            if (toId) {
              const regItem = TECH_REGISTRY.find(r => r.id === toRegistryId(toId));
              if (regItem) {
                const storeId = toStoreId(regItem.id);
                if (fromIds.length > 0) {
                  nextTechStack = state.techStack.map(t => {
                    if (fromIds.includes(toRegistryId(t.id))) {
                      return {
                        id: storeId,
                        name: regItem.name,
                        icon: 'layers',
                        category: t.category,
                        difficulty: regItem.difficultyScore,
                        synergies: regItem.synergy.map(toStoreId),
                      };
                    }
                    return t;
                  });
                } else {
                  // Fallback Add Tech
                  const alreadyHas = state.techStack.some(t => toRegistryId(t.id) === toRegistryId(toId));
                  if (!alreadyHas) {
                    const categorySlot = regItem.category.toLowerCase().includes('frontend') ? 'frontend' : 
                                         (regItem.category.toLowerCase().includes('database') ? 'database' : 'backend');
                    const newItem: TechItem = {
                      id: storeId,
                      name: regItem.name,
                      icon: 'layers',
                      category: categorySlot,
                      difficulty: regItem.difficultyScore,
                      synergies: regItem.synergy.map(toStoreId),
                    };
                    nextTechStack = [...state.techStack.filter(t => t.category !== categorySlot), newItem];
                  }
                }
              }
            }
          } else if (actionType === 'remove_feature' || actionType === 'reduce_scope') {
            nextFeatures = state.features.filter((f: any) => f.impact !== 'low');
            const highEffortFeat = nextFeatures.find((f: any) => f.effort === 'high');
            if (highEffortFeat) {
              nextFeatures = nextFeatures.filter((f: any) => f.id !== highEffortFeat.id);
            }
          } else if (actionType === 'move_slide') {
            const addSlide = targetAdvice.action?.payload?.addSlide;
            if (addSlide) {
              if (!nextPitchDeck.includes(addSlide)) {
                const tyIdx = nextPitchDeck.indexOf('thank-you');
                if (tyIdx !== -1) {
                  nextPitchDeck.splice(tyIdx, 0, addSlide);
                } else {
                  nextPitchDeck.push(addSlide);
                }
              }
            } else {
              const fromSlide = targetAdvice.action?.payload?.from;
              const toSlide = targetAdvice.action?.payload?.to;
              if (fromSlide && toSlide && nextPitchDeck.includes(fromSlide) && nextPitchDeck.includes(toSlide)) {
                const fromIdx = nextPitchDeck.indexOf(fromSlide);
                const toIdx = nextPitchDeck.indexOf(toSlide);
                if (fromIdx < toIdx) {
                  const temp = nextPitchDeck[fromIdx];
                  nextPitchDeck[fromIdx] = nextPitchDeck[toIdx];
                  nextPitchDeck[toIdx] = temp;
                }
              }
            }
          } else if (actionType === 'focus_segment' || actionType === 'change_biz_model') {
            const segmentText = targetAdvice.action?.payload?.segment || 'Campus Pilot Focus';
            nextGeneratedBusinessModels = state.generatedBusinessModels.map(m => {
              if (m.id === state.businessModel) {
                return {
                  ...m,
                  customerSegment: `${m.customerSegment} (${segmentText})`,
                  pricingStructure: m.pricingStructure.includes("Premium") ? m.pricingStructure : `${m.pricingStructure} // Premium SaaS Admin: $49/user/mo`,
                };
              }
              return m;
            });
          }

          set({
            generatedAdvisorAdvice: nextAdvice,
            score: nextScore,
            features: nextFeatures,
            techStack: nextTechStack,
            pitchDeck: nextPitchDeck,
            generatedBusinessModels: nextGeneratedBusinessModels,
            usp: nextUsp,
          });

          // 3. Regenerate elevator pitch in real time
          const updatedState = get();
          const nextPitch = generateCustomElevatorPitch(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.generatedBusinessModels.find(m => m.id === updatedState.businessModel) || null,
            updatedState.generatedAdvisorAdvice,
            updatedState.techStack
          );

          // 4. Update mentor confidence score
          const nextConfidence = calculateMentorConfidence(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.techStack,
            updatedState.pitchDeck,
            updatedState.businessModel,
            updatedState.generatedBusinessModels,
            updatedState.generatedAdvisorAdvice
          );

          set({ 
            pitchText: nextPitch,
            mentorConfidence: nextConfidence
          });
        },

        rejectAdvisorAdvice: (adviceId) => {
          const state = get();
          const nextAdvice = state.generatedAdvisorAdvice.map(adv => {
            if (adv.id === adviceId) {
              return { ...adv, status: 'rejected' as const };
            }
            return adv;
          });

          set({ generatedAdvisorAdvice: nextAdvice });

          // Regenerate elevator pitch in real time
          const updatedState = get();
          const nextPitch = generateCustomElevatorPitch(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.generatedBusinessModels.find(m => m.id === updatedState.businessModel) || null,
            updatedState.generatedAdvisorAdvice,
            updatedState.techStack
          );

          // Recalculate mentor confidence score
          const nextConfidence = calculateMentorConfidence(
            updatedState.selectedProblem,
            updatedState.solutionDirection,
            updatedState.usp,
            updatedState.features,
            updatedState.techStack,
            updatedState.pitchDeck,
            updatedState.businessModel,
            updatedState.generatedBusinessModels,
            updatedState.generatedAdvisorAdvice
          );

          set({ 
            pitchText: nextPitch,
            mentorConfidence: nextConfidence
          });
        },

        resetGame: () =>
          set(
            (state) => ({
              ...initialGameState,
              unlockedAchievements: state.unlockedAchievements, // preserve across playthroughs
              soundEnabled: state.soundEnabled, // preserve sound preferences
              stats: state.stats, // preserve stats
            }),
            false,
            'core/resetGame'
          ),

        // ─── timerSlice Actions ───

        tickTimer: () => {
          const { globalTimeRemaining, isTimerPaused, isGameOver, isGameStarted } = get();
          if (isTimerPaused || isGameOver || !isGameStarted) return;

          if (globalTimeRemaining <= 1) {
            // Time expired -> trigger results phase automatically
            set(
              {
                globalTimeRemaining: 0,
                timeRemaining: 0,
                isTimerPaused: true,
                isGameOver: true,
                stage: 'results',
                phase: mapStageToPhase('results'),
              },
              false,
              'timer/timeExpired'
            );
          } else {
            const nextTime = globalTimeRemaining - 1;
            set(
              {
                globalTimeRemaining: nextTime,
                timeRemaining: nextTime,
              },
              false,
              'timer/tick'
            );
          }
        },

        pauseTimer: () => set({ isTimerPaused: true }, false, 'timer/pause'),

        resumeTimer: () => set({ isTimerPaused: false }, false, 'timer/resume'),

        setTimeRemaining: (time) =>
          set(
            {
              globalTimeRemaining: time,
              timeRemaining: time,
            },
            false,
            'timer/setTimeRemaining'
          ),

        // ─── scoringSlice Actions ───

        updateScore: (category, value) =>
          set(
            (state) => {
              const nextScore = {
                ...state.score,
                [category]: value,
              };
              const total =
                nextScore.innovation +
                nextScore.execution +
                nextScore.design +
                nextScore.pitch +
                nextScore.bonus;

              return {
                score: {
                  ...nextScore,
                  total,
                },
              };
            },
            false,
            'scoring/updateScore'
          ),

        // ─── judgingSlice Actions ───

        setCurrentJudge: (judge) => set({ currentJudge: judge }, false, 'judging/setCurrentJudge'),

        addJudgeFeedback: (feedback) =>
          set(
            (state) => ({
              judgeFeedback: [...state.judgeFeedback, feedback],
            }),
            false,
            'judging/addJudgeFeedback'
          ),

        setJudgeSpinState: (spinState) =>
          set({ judgeSpinState: spinState }, false, 'judging/setJudgeSpinState'),

        unlockAchievement: (id) =>
          set(
            (state) => {
              if (state.unlockedAchievements.includes(id)) return {};
              return {
                unlockedAchievements: [...state.unlockedAchievements, id],
              };
            },
            false,
            'core/unlockAchievement'
          ),

        toggleSound: () =>
          set(
            (state) => ({
              soundEnabled: !state.soundEnabled,
            }),
            false,
            'core/toggleSound'
          ),

        resolveChaosEvent: (choiceIndex) => {
          const { activeChaosEvent, score, globalTimeRemaining, chaosHistory } = get();
          if (!activeChaosEvent) return;

          const choice = activeChaosEvent.choices[choiceIndex];
          if (!choice) return;

          // Apply score modifiers
          const mods = choice.modifiers;
          
          // Modify score categories immediately
          const nextScore = { ...score };
          if (mods.innovation !== undefined) nextScore.innovation = Math.max(0, Math.min(100, nextScore.innovation + mods.innovation));
          if (mods.execution !== undefined) nextScore.execution = Math.max(0, Math.min(100, nextScore.execution + mods.execution));
          if (mods.design !== undefined) nextScore.design = Math.max(0, Math.min(100, nextScore.design + mods.design));
          if (mods.pitch !== undefined) nextScore.pitch = Math.max(0, Math.min(100, nextScore.pitch + mods.pitch));
          if (mods.bonus !== undefined) nextScore.bonus = nextScore.bonus + mods.bonus;
          
          const total =
            nextScore.innovation +
            nextScore.execution +
            nextScore.design +
            nextScore.pitch +
            nextScore.bonus;
          nextScore.total = total;

          // Adjust time remaining
          let timeOffset = mods.timeOffset || 0;
          if (timeOffset > 0 && get().activeModifiers.includes('SOLO_DEV')) {
            timeOffset = 0; // Solo Dev can't get teammate time boosts
          }
          const nextTime = Math.max(0, globalTimeRemaining + timeOffset);

          // Pushing the event ID to chaosHistory
          const nextHistory = [...chaosHistory, activeChaosEvent.id];
          if (activeChaosEvent.id === 'team-pivot-idea' && choiceIndex === 0) {
            nextHistory.push('team-pivot-executed');
          }

          // If nextTime <= 0, trigger results stage (game over)
          if (nextTime <= 0) {
            set({
              score: nextScore,
              globalTimeRemaining: 0,
              timeRemaining: 0,
              activeChaosEvent: null,
              chaosHistory: nextHistory,
              isTimerPaused: true,
              isGameOver: true,
              stage: 'results',
              phase: mapStageToPhase('results'),
            }, false, 'core/resolveChaosEventGameOver');
          } else {
            set({
              score: nextScore,
              globalTimeRemaining: nextTime,
              timeRemaining: nextTime,
              activeChaosEvent: null,
              chaosHistory: nextHistory,
              isTimerPaused: false, // resume timer
            }, false, 'core/resolveChaosEvent');
          }
        },

        setGameMode: (mode) => {
          let activeMods: string[] = [];
          if (mode === 'hardcore') {
            activeMods = ['NO_MENTOR', 'HARDCORE_JUDGE'];
          } else if (mode === 'chaos') {
            activeMods = ['CHAOS_MAGNET'];
          }
          set(
            {
              gameMode: mode,
              activeModifiers: activeMods,
              dailyModifier: null,
            },
            false,
            'core/setGameMode'
          );
        },

        initializeDailyChallenge: () => {
          const { problem, difficulty, judge, modifier } = getDailyChallenge();
          const seconds = DIFFICULTY_TIMERS[difficulty];
          set(
            {
              gameMode: 'daily',
              activeModifiers: [modifier.id],
              dailyModifier: modifier.id,
              selectedProblem: problem,
              difficulty,
              currentJudge: judge,
              globalTotalTime: seconds,
              globalTimeRemaining: seconds,
              timeRemaining: seconds,
              totalTime: seconds,
              isTimerPaused: false,
              isGameStarted: true,
              stage: 'solutionDirection',
              phase: mapStageToPhase('solutionDirection'),
            },
            false,
            'core/initializeDailyChallenge'
          );
        },

        updateStats: (finalScore) => {
          const { stats, techStack, chaosHistory } = get();
          const totalRuns = stats.totalRuns + 1;
          const bestScore = Math.max(stats.bestScore, finalScore);
          const averageScore = Math.round(((stats.averageScore * stats.totalRuns + finalScore) / totalRuns) * 10) / 10;
          
          const nextTechUsage = { ...stats.techUsage };
          techStack.forEach((t) => {
            nextTechUsage[t.id] = (nextTechUsage[t.id] || 0) + 1;
          });

          const sortedTechIds = Object.entries(nextTechUsage)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([id]) => id);

          const facedNegCount = CHAOS_EVENTS.filter(
            (e) => chaosHistory.includes(e.id) && (e.category === 'technical' || e.category === 'team')
          ).length;

          let chaosRunsFaced = stats.chaosRunsFaced;
          let chaosRunsSurvived = stats.chaosRunsSurvived;
          if (facedNegCount >= 2) {
            chaosRunsFaced += 1;
            if (finalScore >= 70) {
              chaosRunsSurvived += 1;
            }
          }
          const chaosSurvivalRate = chaosRunsFaced > 0 ? Math.round((chaosRunsSurvived / chaosRunsFaced) * 100) : 0;

          let judgeWins = stats.judgeWins;
          if (finalScore >= 70) {
            judgeWins += 1;
          }
          const judgeWinRate = totalRuns > 0 ? Math.round((judgeWins / totalRuns) * 100) : 0;

          const updatedStats = {
            totalRuns,
            bestScore,
            averageScore,
            favoriteStack: sortedTechIds,
            chaosSurvivalRate,
            judgeWinRate,
            chaosRunsFaced,
            chaosRunsSurvived,
            judgeWins,
            techUsage: nextTechUsage,
          };

          set({ stats: updatedStats }, false, 'core/updateStats');
        },

        // ─── Core Game Terminate ───

        endGame: () =>
          set(
            {
              isGameOver: true,
              stage: 'results',
              phase: mapStageToPhase('results'),
              isTimerPaused: true,
            },
            false,
            'core/endGame'
          ),

        // ─── Team System Actions ───

        setupTeam: (playerName, playerAvatar, teammates) => {
          set({
            playerName,
            playerAvatar,
            team: teammates.map(t => ({
              ...t,
              helpTokenUsed: false,
              contribution: { innovation: 0, execution: 0, design: 0, pitch: 0 }
            }))
          }, false, 'team/setupTeam');
        },

        useTeammateHelp: (teammateId, currentStage) => {
          const teammate = get().team.find(t => t.id === teammateId);
          if (!teammate || teammate.helpTokenUsed) return;

          // Locked Stage Check
          if (!isRoleRelevantForStage(teammate.role, currentStage)) {
            // Generate non-confident advice without consuming token
            const adviceCard = {
              teammateId,
              isNotConfident: true,
              title: "Not Confident",
              explanation: `${teammate.name} doesn't feel confident advising on this round.`,
              expectedImpact: "None.",
              tradeoffs: "None.",
              modifiers: {},
              action: null
            };
            set((state) => ({
              activeTeammateAdvice: {
                ...state.activeTeammateAdvice,
                [teammateId]: adviceCard
              }
            }), false, 'team/useTeammateHelpNotConfident');
            return;
          }

          const updatedTeam = get().team.map(t => 
            t.id === teammateId ? { ...t, helpTokenUsed: true } : t
          );

          const role = teammate.role || "";
          const p = teammate.personality;
          const stage = currentStage;
          const state = get();

          const problemTitle = state.selectedProblem?.title || "our prototype";
          const solutionType = state.solutionDirection || "web application";
          const techNames = state.techStack.map((t: any) => t.name).join(", ");
          const featureNames = state.features.map((f: any) => f.name).join(", ");
          const activeUsp = state.usp || "our unique value proposition";
          const activeModel = state.businessModel || "our business strategy";

          let title = "Strategic Optimization";
          let observation = `We are currently structuring our hackathon prototype.`;
          let concern = "We need to make sure we don't build too many elements at once.";
          let recommendation = "Let's focus on building a stable MVP block.";
          let expectedImpact = "Reduces execution risk, minor impact on innovation.";
          let tradeoffs = "Ensures a cleaner demo presentation.";
          let modifiers = {} as any;
          let action = null as any;
          let logMessage = "";

          const r = role.toLowerCase();
          const isAi = r.includes("ai") || r.includes("ml") || r.includes("intelligence");
          const isBackend = r.includes("backend") || (r.includes("developer") && r.includes("backend")) || (r.includes("engineer") && r.includes("backend"));
          const isFrontend = r.includes("frontend");
          const isStrategist = r.includes("strategist") || r.includes("founder") || r.includes("business");
          const isPitch = r.includes("pitch");
          const isDesigner = r.includes("designer") || r.includes("design");
          const isResearcher = r.includes("researcher");
          const isChaiwala = r.includes("chaiwala") || r.includes("chai");

          if (isAi) {
            title = "AI Scope Optimization";
            observation = `The AI integration layer for ${problemTitle} contains multiple complex model chains.`;
            concern = "This AI layer is overcomplicated. It will cause timeout errors during the live demo.";
            recommendation = "This AI layer is overcomplicated. I can simplify it. Should I refactor the pipeline?";
            expectedImpact = "Saves execution overhead and ensures stable API calls.";
            tradeoffs = "Less custom model control.";
            action = { type: 'simplify_ai', payload: {} };
            modifiers = { execution: 15, innovation: -5 };
            logMessage = `${teammate.name} simplified the AI pipeline.`;
          } else if (isBackend) {
            title = "Database Architecture Improvement";
            if (stage === 'techStack') {
              observation = `We are selecting database services for ${problemTitle}.`;
              concern = "The current database configuration is overkill or less flexible for rapid schema iterations.";
              recommendation = "MongoDB would fit this project better than Supabase. Should I update the database architecture?";
              expectedImpact = "Speeds up write execution and schema updates.";
              tradeoffs = "Sacrifices relational constraints.";
              action = {
                type: 'replace_tech',
                payload: {
                  from: ['reg-supabase', 'reg-postgres', 'reg-springboot', 'reg-kubernetes'],
                  to: 'tech-mongodb'
                }
              };
              modifiers = { execution: 12, design: -2 };
              logMessage = `${teammate.name} replaced Supabase with MongoDB.`;
            } else {
              observation = `We have prioritized multiple backend-intensive features.`;
              concern = "Our api scope is too complex for a 24-hour sprint.";
              recommendation = "I want to remove the lowest impact nice-to-have features to simplify the API load. Shall I prune the backend backlog?";
              expectedImpact = "Improves technical feasibility and reduces dev overhead.";
              tradeoffs = "Prunes the backlog feature list.";
              action = { type: 'reduce_scope', payload: {} };
              modifiers = { execution: 10, design: 5, innovation: -5 };
              logMessage = `${teammate.name} simplified the backend backlog by removing the lowest impact feature.`;
            }
          } else if (isFrontend) {
            title = "Frontend Stack Migration";
            if (stage === 'techStack') {
              observation = `We are building the frontend layout for ${problemTitle}.`;
              concern = "Building a vanilla or custom React setup will require too much state management boilerplate.";
              recommendation = "Next.js would improve delivery speed. Want me to switch the frontend stack?";
              expectedImpact = "Provides routing out of the box, speeding up frontend execution.";
              tradeoffs = "Slightly higher bundle size.";
              action = {
                type: 'replace_tech',
                payload: {
                  from: ['reg-react', 'reg-vue', 'reg-svelte', 'reg-html5'],
                  to: 'tech-next'
                }
              };
              modifiers = { execution: 14, design: 5 };
              logMessage = `${teammate.name} switched the frontend stack to Next.js.`;
            } else if (stage === 'features') {
              observation = `We have scheduled a large UI feature set.`;
              concern = "Building all these custom pages will leave us with no time for visual polish.";
              recommendation = "I can prune the nice-to-have features so we can focus on polishing the core app views. Shall I simplify the UI scope?";
              expectedImpact = "Guarantees a clean, fully functional UI demo.";
              tradeoffs = "Reduces UI features.";
              action = { type: 'reduce_scope', payload: {} };
              modifiers = { execution: 10, design: 8 };
              logMessage = `${teammate.name} optimized the UI scope by removing the lowest impact feature.`;
            } else {
              observation = `We are structuring the deck sequence.`;
              concern = "Our slides look text-heavy without frontend interfaces.";
              recommendation = "I want to swap our text-heavy slides with high-fidelity screenshot overlays. Should I restructure the slides?";
              expectedImpact = "Improves design score and makes the application look modern.";
              tradeoffs = "Requires time to format screenshots.";
              action = { type: 'reorder_pitch_deck', payload: {} };
              modifiers = { design: 12, pitch: 8 };
              logMessage = `${teammate.name} added design screenshots to the pitch deck.`;
            }
          } else if (isStrategist) {
            title = "Business Model Optimization";
            if (stage === 'businessModel') {
              observation = `Our monetization strategy is defined around '${activeModel}'.`;
              concern = "This monetization strategy is generic and won't convince judges about long-term sustainability.";
              recommendation = "I found a stronger monetization path. Let's switch our business model to Local Sponsorship.";
              expectedImpact = "Proves immediate viability and local market traction.";
              tradeoffs = "Limits initially addressable market size.";
              action = { type: 'change_biz_model', payload: { model: 'Local Sponsorship' } };
              modifiers = { pitch: 15, execution: -5 };
              logMessage = `${teammate.name} updated the monetization strategy to Local Sponsorship.`;
            } else {
              observation = `We are positioning around '${activeUsp}'.`;
              concern = "Our competitive wedge is too broad and easily copied.";
              recommendation = "Let's refine our positioning to a Community-first growth USP. Should I update the marketing USP?";
              expectedImpact = "Establishes a strong user moat.";
              tradeoffs = "Targets a narrower initial market segment.";
              action = { type: 'change_usp', payload: { usp: 'Community-first' } };
              modifiers = { innovation: 10, pitch: 8 };
              logMessage = `${teammate.name} refined the marketing USP to Community-first.`;
            }
          } else if (isPitch) {
            title = "Pitch Enhancement";
            if (stage === 'pitchPrep') {
              observation = `We are writing the elevator pitch script.`;
              concern = "The script spends too much time detailing specifications rather than building a user narrative hook.";
              recommendation = "I want to restructure the presentation flow to hook the judges within the first ten seconds. Can I rewrite the elevator pitch script?";
              expectedImpact = "Boosts the pitch delivery score.";
              tradeoffs = "Replaces the existing pitch text.";
              action = { type: 'rewrite_pitch', payload: {} };
              modifiers = { pitch: 18, design: 5 };
              logMessage = `${teammate.name} improved the pitch structure and script.`;
            } else {
              observation = `Our slide sequence is being finalized.`;
              concern = "The current slide sequence doesn't build a logical business case.";
              recommendation = "I want to restructure the presentation flow. Let's move the demo slide right after the problem statement.";
              expectedImpact = "Improves narrative flow and keeps judges engaged.";
              tradeoffs = "Requires reordering deck items.";
              action = { type: 'reorder_pitch_deck', payload: {} };
              modifiers = { pitch: 12 };
              logMessage = `${teammate.name} restructured the pitch deck slide flow.`;
            }
          } else if (isDesigner) {
            title = "Branding Moat Review";
            observation = `We are designing the project styling.`;
            concern = "The UI layout looks cluttered.";
            recommendation = "I can redesign the interface layout to utilize high-contrast styling presets.";
            expectedImpact = "Significantly improves design rating.";
            tradeoffs = "Requires design focus.";
            action = { type: 'change_usp', payload: { usp: 'Design-first' } };
            modifiers = { design: 15 };
            logMessage = `${teammate.name} redesigned the interface layout.`;
          } else if (isResearcher) {
            title = "Target Audience Fit";
            observation = `We are analyzing target segments.`;
            concern = "The project addresses a broad audience.";
            recommendation = "Let's focus the product scope on student campus users.";
            expectedImpact = "Increases innovation score by finding a clear market opening.";
            tradeoffs = "Reduces absolute addressable market.";
            action = { type: 'change_usp', payload: { usp: 'Student-centric' } };
            modifiers = { innovation: 12, pitch: 5 };
            logMessage = `${teammate.name} focused the product scope on student campus users.`;
          } else if (isChaiwala) {
            title = "Cardamom Chai Brewing";
            observation = `The team is working under high hackathon stress.`;
            concern = "Fatigue is causing productivity drops.";
            recommendation = "I brewed cardamom chai to boost team morale. Shall we take a quick tea break?";
            expectedImpact = "Boosts team energy and execution.";
            tradeoffs = "Takes a brief break.";
            action = { type: 'boost_morale', payload: {} };
            modifiers = { execution: 10, design: 5, bonus: 5 };
            logMessage = `${teammate.name} brewed cardamom chai to boost team morale.`;
          }

          // TEAM MEMORY ENHANCEMENTS
          const teammateHistory = state.teamAdviceHistory ? state.teamAdviceHistory.filter((h: any) => h.teammateId === teammateId) : [];
          let memoryIntroduction = "";
          if (teammateHistory.length > 0) {
            const lastChoice = teammateHistory[teammateHistory.length - 1];
            if (lastChoice.status === 'rejected') {
              memoryIntroduction = `I still think our last idea, '${lastChoice.title}', would have reduced our execution risk. But let's look at what we have now. `;
            } else {
              memoryIntroduction = `I am glad we applied '${lastChoice.title}' earlier. Let's keep this momentum going. `;
            }
          }

          // Structure output
          let explanationText = `${memoryIntroduction}**Observation:** ${observation} **Concern:** ${concern} **Recommendation:** ${recommendation}`;

          // Apply personality voice modifiers
          if (p === 'Builder') {
            explanationText = `[BUILDER VIBES] ${explanationText} Let's ship it and see what happens. Done is better than perfect.`;
          } else if (p === 'Perfectionist') {
            explanationText = `[PERFECTIONIST WARNING] ${explanationText} We cannot present a buggy, half-finished demo. Let's do it right.`;
          } else if (p === 'Dreamer') {
            explanationText = `[DREAMER VISION] ${explanationText} Imagine how incredible this will look when the judges see it. Let's aim high.`;
          } else if (p === 'Founder') {
            explanationText = `[FOUNDER INQUIRY] ${explanationText} Who pays for this? We need to prove this can scale into a real startup. Let's build what matters.`;
          } else if (p === 'Designer') {
            explanationText = `[DESIGNER PERSPECTIVE] ${explanationText} Users won't understand this. The user experience is everything. If they cannot use it, it does not work.`;
          }

          const adviceCard = {
            teammateId,
            title,
            explanation: explanationText,
            expectedImpact,
            tradeoffs,
            modifiers,
            action,
            observation,
            concern,
            recommendation,
            contributionLog: logMessage,
          };

          set((state) => ({
            team: updatedTeam,
            activeTeammateAdvice: {
              ...state.activeTeammateAdvice,
              [teammateId]: adviceCard
            }
          }), false, 'team/useTeammateHelp');
        },

        applyTeammateAdvice: (teammateId) => {
          const advice = get().activeTeammateAdvice[teammateId];
          if (!advice) return;

          const mods = advice.modifiers || {};
          const currentScore = get().score;
          
          const nextScore = {
            innovation: Math.max(0, Math.min(100, currentScore.innovation + (mods.innovation || 0))),
            execution: Math.max(0, Math.min(100, currentScore.execution + (mods.execution || 0))),
            design: Math.max(0, Math.min(100, currentScore.design + (mods.design || 0))),
            pitch: Math.max(0, Math.min(100, currentScore.pitch + (mods.pitch || 0))),
            bonus: currentScore.bonus + (mods.bonus || 0),
            total: 0
          };
          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          const updatedTeam = get().team.map(t => {
            if (t.id === teammateId) {
              return {
                ...t,
                contribution: {
                  innovation: t.contribution.innovation + (mods.innovation || 0),
                  execution: t.contribution.execution + (mods.execution || 0),
                  design: t.contribution.design + (mods.design || 0),
                  pitch: t.contribution.pitch + (mods.pitch || 0)
                }
              };
            }
            return t;
          });

          const act = advice.action;
          let extraState: any = {};
          if (act) {
            if (act.type === 'replace_tech') {
              const fromList = act.payload.from;
              const toId = act.payload.to;
              const filteredStack = get().techStack.filter(t => !fromList.includes(toRegistryId(t.id)));
              const regItem = TECH_REGISTRY.find(r => r.id === toRegistryId(toId));
              if (regItem && !filteredStack.some(x => x.id === toStoreId(regItem.id))) {
                extraState.techStack = [...filteredStack, {
                  id: toStoreId(regItem.id),
                  name: regItem.name,
                  icon: 'layers',
                  category: regItem.category,
                  difficulty: regItem.difficultyScore,
                  synergies: (regItem.synergy || []).map(toStoreId)
                }];
              }
            } else if (act.type === 'reduce_scope') {
              if (get().features.length > 0) {
                const sorted = [...get().features].sort((a, b) => {
                  const aVal = a.impact === 'low' ? 0 : a.impact === 'medium' ? 1 : 2;
                  const bVal = b.impact === 'low' ? 0 : b.impact === 'medium' ? 1 : 2;
                  return aVal - bVal;
                });
                const removedId = sorted[0].id;
                extraState.features = get().features.filter(f => f.id !== removedId);
              }
            } else if (act.type === 'change_usp') {
              extraState.usp = act.payload.usp;
            } else if (act.type === 'change_biz_model') {
              extraState.businessModel = act.payload.model;
            } else if (act.type === 'simplify_ai') {
              const complexAi = ['reg-langchain', 'reg-tensorflow', 'reg-pytorch', 'reg-huggingface'];
              const filteredStack = get().techStack.filter(t => !complexAi.includes(toRegistryId(t.id)));
              const geminiItem = TECH_REGISTRY.find(r => r.id === 'reg-gemini');
              if (geminiItem && !filteredStack.some(x => x.id === toStoreId(geminiItem.id))) {
                extraState.techStack = [...filteredStack, {
                  id: toStoreId(geminiItem.id),
                  name: geminiItem.name,
                  icon: 'layers',
                  category: geminiItem.category,
                  difficulty: geminiItem.difficultyScore,
                  synergies: (geminiItem.synergy || []).map(toStoreId)
                }];
              }
            } else if (act.type === 'rewrite_pitch') {
              extraState.pitchText = "A high-impact demonstration of our solution, designed to hook the judges instantly.";
            } else if (act.type === 'reorder_pitch_deck') {
              const currentDeck = get().pitchDeck || [];
              if (currentDeck.includes('demo')) {
                const filtered = currentDeck.filter(s => s !== 'demo');
                const solutionIndex = filtered.indexOf('solution');
                if (solutionIndex !== -1) {
                  filtered.splice(solutionIndex + 1, 0, 'demo');
                } else {
                  filtered.unshift('demo');
                }
                extraState.pitchDeck = filtered;
              }
            }
          }

          const nextAdvice = { ...get().activeTeammateAdvice };
          delete nextAdvice[teammateId];

          const currentHistory = get().teamAdviceHistory || [];
          const nextHistory = [...currentHistory, {
            teammateId,
            adviceId: teammateId + '-' + get().stage,
            title: advice.title,
            stage: get().stage,
            status: 'applied' as const,
            modifiers: advice.modifiers
          }];

          const logMsg = advice.contributionLog || "";
          const nextLogs = logMsg ? [...(get().teamContributionLogs || []), logMsg] : (get().teamContributionLogs || []);

          set({
            score: nextScore,
            team: updatedTeam,
            activeTeammateAdvice: nextAdvice,
            teamAdviceHistory: nextHistory,
            teamContributionLogs: nextLogs,
            ...extraState
          }, false, 'team/applyTeammateAdvice');
        },

        rejectTeammateAdvice: (teammateId) => {
          const advice = get().activeTeammateAdvice[teammateId];
          const nextAdvice = { ...get().activeTeammateAdvice };
          delete nextAdvice[teammateId];

          let nextHistory = get().teamAdviceHistory || [];
          if (advice && !advice.isNotConfident) {
            nextHistory = [...nextHistory, {
              teammateId,
              adviceId: teammateId + '-' + get().stage,
              title: advice.title,
              stage: get().stage,
              status: 'rejected' as const,
              modifiers: advice.modifiers
            }];
          }

          set({ 
            activeTeammateAdvice: nextAdvice,
            teamAdviceHistory: nextHistory
          }, false, 'team/rejectTeammateAdvice');
        },

        resolveTeamChatMoment: (choiceIndex) => {
          const moment = get().activeTeamChatMoment;
          if (!moment) return;

          const choice = moment.choices[choiceIndex];
          const mods = choice.modifiers || {};
          const currentScore = get().score;

          const nextScore = {
            innovation: Math.max(0, Math.min(100, currentScore.innovation + (mods.innovation || 0))),
            execution: Math.max(0, Math.min(100, currentScore.execution + (mods.execution || 0))),
            design: Math.max(0, Math.min(100, currentScore.design + (mods.design || 0))),
            pitch: Math.max(0, Math.min(100, currentScore.pitch + (mods.pitch || 0))),
            bonus: currentScore.bonus + (mods.bonus || 0),
            total: 0
          };
          nextScore.total = nextScore.innovation + nextScore.execution + nextScore.design + nextScore.pitch + nextScore.bonus;

          const nextHistory = [...get().teamChatHistory, moment.id];

          set({
            score: nextScore,
            teamChatHistory: nextHistory,
            activeTeamChatMoment: null
          }, false, 'team/resolveTeamChatMoment');
        },
      }),
      {
        name: 'hackathon-simulator-sprint2-persist',
        partialize: (state) => ({
          difficulty: state.difficulty,
          stage: state.stage,
          selectedProblem: state.selectedProblem,
          solutionDirection: state.solutionDirection,
          techStack: state.techStack,
          usp: state.usp,
          primaryUsp: state.primaryUsp,
          secondaryUsp: state.secondaryUsp,
          features: state.features,
          mentorName: state.mentorName,
          businessModel: state.businessModel,
          pitchText: state.pitchText,
          globalTimeRemaining: state.globalTimeRemaining,
          globalTotalTime: state.globalTotalTime,
          isTimerPaused: state.isTimerPaused,
          score: state.score,
          judgeFeedback: state.judgeFeedback,
          isGameStarted: state.isGameStarted,
          isGameOver: state.isGameOver,
          unlockedAchievements: state.unlockedAchievements,
          soundEnabled: state.soundEnabled,
          activeChaosEvent: state.activeChaosEvent,
          chaosHistory: state.chaosHistory,
          gameMode: state.gameMode,
          activeModifiers: state.activeModifiers,
          dailyModifier: state.dailyModifier,
          stats: state.stats,
          generatedUSPs: state.generatedUSPs,
          generatedBacklog: state.generatedBacklog,
          generatedBusinessModels: state.generatedBusinessModels,
          generatedAdvisorAdvice: state.generatedAdvisorAdvice,
          roastText: state.roastText,
          playerName: state.playerName,
          playerAvatar: state.playerAvatar,
          team: state.team,
          activeTeamChatMoment: state.activeTeamChatMoment,
          teamChatHistory: state.teamChatHistory,
          activeTeammateAdvice: state.activeTeammateAdvice,
          teamAdviceHistory: state.teamAdviceHistory,
          teamContributionLogs: state.teamContributionLogs,
        }),
      }
    ),
    { name: 'HackathonSimulatorStore' }
  )
);
