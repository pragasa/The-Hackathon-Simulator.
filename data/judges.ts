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
    id: 'judge-tech',
    name: 'Dr. Priya Kapoor',
    avatar: '⚡',
    title: 'CTO, NeuralScale Systems',
    expertise: ['System Architecture', 'API Scalability', 'Database Locks', 'Performance Optimization'],
    personality: 'technical',
    scoringWeights: {
      innovation: 0.20,
      execution: 0.45,
      design: 0.10,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-startup',
    name: 'Alex Nakamura',
    avatar: '🚀',
    title: 'CEO, Moonshot Labs',
    expertise: ['Disruptive Innovation', 'Storytelling', 'Growth Tiers', 'Product Metrics'],
    personality: 'creative',
    scoringWeights: {
      innovation: 0.35,
      execution: 0.15,
      design: 0.20,
      pitch: 0.30,
    },
  },
  {
    id: 'judge-ux',
    name: 'Marcus Rivera',
    avatar: '🎨',
    title: 'Head of Design, Pixel & Co.',
    expertise: ['UI/UX Design', 'Design Systems', 'Accessibility', 'Typography Scale'],
    personality: 'encouraging',
    scoringWeights: {
      innovation: 0.15,
      execution: 0.15,
      design: 0.45,
      pitch: 0.25,
    },
  },
  {
    id: 'judge-investor',
    name: 'Victoria Chen',
    avatar: '🦈',
    title: 'Managing Partner, Apex Ventures',
    expertise: ['Venture Capital', 'Unit Economics', 'Market Scale', 'Monetization Flows'],
    personality: 'tough',
    scoringWeights: {
      innovation: 0.20,
      execution: 0.30,
      design: 0.15,
      pitch: 0.35,
    },
  },
  {
    id: 'judge-chaos',
    name: 'Lord Bugsworth',
    avatar: '👾',
    title: 'Dean of Compiler Anarchy',
    expertise: ['Chaos Theory', 'Non-deterministic Loops', 'Null Pointers', 'Retro Hacks'],
    personality: 'tough',
    scoringWeights: {
      innovation: 0.25,
      execution: 0.25,
      design: 0.25,
      pitch: 0.25,
    },
  },
];
