/**
 * @file Curated Jury Panels Database
 *
 * Defines the 5 distinct hackathon judges with customizable personalities
 * and score category weights.
 *
 * @module data/judges
 */

import type { Judge } from '@/types/game';

export const JUDGES: Judge[] = [
  {
    id: 'judge-builder',
    name: 'Uday Sharma',
    avatar: '🔥',
    title: 'Indie Hacker & Product Builder',
    expertise: ['MVP Scoping', 'Rapid Prototyping', 'User Validation', 'Product-Led Growth'],
    personality: 'technical',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.40,
      design: 0.10,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-founder',
    name: 'Sarah Park',
    avatar: '🚀',
    title: 'Startup Accelerator Partner',
    expertise: ['Market Sizing', 'Growth Metrics', 'Elevator Pitches', 'Venture Viability'],
    personality: 'creative',
    scoringWeights: {
      innovation: 0.35,
      execution: 0.15,
      design: 0.10,
      pitch: 0.40,
    },
  },
  {
    id: 'judge-design',
    name: 'Maya Chen',
    avatar: '🎨',
    title: 'Product Design Director',
    expertise: ['User Experience', 'Interaction Design', 'Accessibility Scales', 'Visual Hierarchy'],
    personality: 'encouraging',
    scoringWeights: {
      innovation: 0.10,
      execution: 0.15,
      design: 0.50,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-investor',
    name: 'Raj Malhotra',
    avatar: '🦈',
    title: 'Venture Capital Partner',
    expertise: ['Unit Economics', 'Defensible Moats', 'Monetization Strategy', 'Market Scale'],
    personality: 'tough',
    scoringWeights: {
      innovation: 0.15,
      execution: 0.30,
      design: 0.10,
      pitch: 0.45,
    },
  },
  {
    id: 'judge-chaos',
    name: 'ByteLord.exe',
    avatar: '👾',
    title: 'Supreme Compiler Entity',
    expertise: ['Chaos Engineering', 'Null Pointer Panic', 'Meme Optimization', 'Glitch Architecture'],
    personality: 'creative',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.25,
      design: 0.25,
      pitch: 0.25,
    },
  },
];
