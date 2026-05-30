'use client';

/**
 * @file DropZone — Generic droppable zone component.
 *
 * A visually-rich drop target for @dnd-kit drag-and-drop interactions.
 * Shows contextual states (default, drag-over, at-capacity) with smooth
 * animations and glassmorphism styling.
 *
 * @example
 * ```tsx
 * <DropZone id="my-stack" label="My Stack" capacity={5} currentCount={2}>
 *   {selectedItems.map(item => <TechCard key={item.id} ... />)}
 * </DropZone>
 * ```
 */

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

// ─── Props ──────────────────────────────────────────────────────────────────────

export interface DropZoneProps {
  /** Unique identifier used by @dnd-kit to register this droppable */
  id: string;
  /** Content rendered inside the zone (typically draggable children) */
  children: React.ReactNode;
  /** Optional label displayed at the top of the zone */
  label?: string;
  /** Max number of items this zone can hold */
  capacity?: number;
  /** Current number of items in the zone */
  currentCount?: number;
  /** Extra class applied when a draggable is hovering over this zone */
  acceptClassName?: string;
  /** Additional CSS classes merged onto the outer wrapper */
  className?: string;
}

// ─── Component ──────────────────────────────────────────────────────────────────

/**
 * A generic droppable zone that integrates with @dnd-kit's `DndContext`.
 *
 * Visual states:
 * - **Default** — dashed border, subtle glass background
 * - **Drag-over** — solid border, neon glow, background highlight
 * - **At capacity** — muted border, "full" indicator
 *
 * Includes an optional capacity indicator rendered as text + progress bar.
 */
export function DropZone({
  id,
  children,
  label,
  capacity,
  currentCount = 0,
  acceptClassName,
  className,
}: DropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  const isFull = capacity !== undefined && currentCount >= capacity;
  const capacityPercentage =
    capacity !== undefined ? Math.min((currentCount / capacity) * 100, 100) : 0;

  return (
    <motion.div
      ref={setNodeRef}
      layout
      className={cn(
        // Base styling — always visible as a drop target
        'relative rounded-lg min-h-[140px] p-4 transition-all duration-200',
        // Default dashed border
        !isOver && !isFull && 'border border-dashed border-neutral-300 bg-neutral-50/40',
        // Drag-over: solid border + highlight
        isOver && !isFull && [
          'border border-solid border-neutral-800 bg-neutral-100/60',
          'shadow-[0_4px_12px_rgba(0,0,0,0.03)]',
          acceptClassName,
        ],
        // At capacity
        isFull && 'border border-solid border-neutral-200 bg-neutral-50/80 opacity-90',
        className,
      )}
    >
      {/* ── Header: Label + Capacity ─────────────────────────────────────── */}
      {(label || capacity !== undefined) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {label && (
            <h3
              className={cn(
                'text-xs font-mono font-bold uppercase tracking-wider',
                isOver ? 'text-neutral-900' : 'text-neutral-500',
                'transition-colors duration-200',
              )}
            >
              {label}
            </h3>
          )}

          {capacity !== undefined && (
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'text-[10px] font-mono tabular-nums',
                  isFull ? 'text-amber-600 font-bold' : 'text-neutral-400',
                )}
              >
                {currentCount}/{capacity} slots
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Capacity Progress Bar ────────────────────────────────────────── */}
      {capacity !== undefined && (
        <div className="mb-3 h-1 w-full overflow-hidden rounded-full bg-neutral-100">
          <motion.div
            className={cn(
              'h-full rounded-full',
              isFull
                ? 'bg-amber-500'
                : capacityPercentage > 70
                  ? 'bg-neutral-600'
                  : 'bg-neutral-800',
            )}
            initial={false}
            animate={{ width: `${capacityPercentage}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>
      )}

      {/* ── Drop zone content ────────────────────────────────────────────── */}
      <div className="relative z-10">
        {children}
      </div>

      {/* ── Empty state ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {currentCount === 0 && !isOver && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5"
          >
            <Inbox className="h-6 w-6 text-neutral-300" />
            <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              {isFull ? 'Zone is full' : 'Drag items here'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Drag-over pulse ring ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isOver && !isFull && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-neutral-400/20 pulse-ring"
          />
        )}
      </AnimatePresence>

      {/* ── Full overlay ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isOver && isFull && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-lg bg-neutral-100/80 backdrop-blur-[1px]"
          >
            <span className="text-xs font-mono uppercase font-bold text-neutral-700">
              Zone is full
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default DropZone;
