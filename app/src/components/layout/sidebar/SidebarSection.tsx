/**
 * KG-Oversight - Section accordéon pour sidebar
 * Avec animation Framer Motion
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { badgeColors, type BadgeColor } from '@/styles/colors';
import { collapseContent, rotateChevron } from '@/lib/animations';
import type { LucideIcon } from 'lucide-react';

interface SidebarSectionProps {
  title: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeColor?: BadgeColor;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export function SidebarSection({
  title,
  icon: Icon,
  badge,
  badgeColor = 'slate',
  defaultOpen = false,
  children,
}: SidebarSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between group"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500 group-hover:text-slate-400 transition-colors" />
          <span className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
            {title}
          </span>
          {badge !== undefined && (
            <span
              className={cn(
                'px-1.5 py-0.5 text-[10px] font-medium rounded-full',
                badgeColors[badgeColor]
              )}
            >
              {badge}
            </span>
          )}
        </div>
        <motion.div
          variants={rotateChevron}
          animate={isOpen ? 'open' : 'closed'}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className="w-4 h-4 text-slate-600" />
        </motion.div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            variants={collapseContent}
            initial="initial"
            animate="animate"
            exit="exit"
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SidebarSection;
