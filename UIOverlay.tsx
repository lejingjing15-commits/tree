import React from 'react';
import { TreeMorphState } from '../types';
import { Sparkles, Box, TreePine } from 'lucide-react';

interface UIOverlayProps {
  treeState: TreeMorphState;
  onToggle: () => void;
}

export const UIOverlay: React.FC<UIOverlayProps> = ({ treeState, onToggle }) => {
  return (
    <div className="flex flex-col justify-between w-full h-full p-8 md:p-12">
      
      {/* Header */}
      <header className="flex flex-col items-center md:items-start animate-fade-in-down">
        <h1 className="text-4xl md:text-6xl font-display text-[#ffd700] tracking-widest drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]">
          ARIX
        </h1>
        <p className="mt-2 text-sm md:text-base font-body text-gray-300 tracking-[0.2em] uppercase border-t border-[#ffd700]/30 pt-2">
          Signature Interactive Holiday
        </p>
      </header>

      {/* Center Action (Only visible if needed, but we keep controls at bottom usually) */}
      <div className="flex-grow" />

      {/* Footer Controls */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-6 pointer-events-auto">
        
        {/* State Toggler */}
        <div className="flex gap-4">
          <button
            onClick={onToggle}
            className={`
              group relative flex items-center gap-3 px-8 py-4 
              border border-[#ffd700] overflow-hidden transition-all duration-500
              ${treeState === TreeMorphState.TREE_SHAPE ? 'bg-[#ffd700]/10' : 'bg-transparent'}
              hover:bg-[#ffd700]/20
            `}
          >
            {/* Animated Background Sweep */}
            <div className="absolute inset-0 w-0 bg-[#ffd700] transition-all duration-[250ms] ease-out group-hover:w-full opacity-10" />
            
            <span className="relative z-10 text-[#ffd700] font-display text-lg tracking-wider flex items-center gap-2">
              {treeState === TreeMorphState.TREE_SHAPE ? (
                <>
                  <Sparkles size={20} />
                  <span>SCATTER</span>
                </>
              ) : (
                <>
                  <TreePine size={20} />
                  <span>ASSEMBLE</span>
                </>
              )}
            </span>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="text-center md:text-right">
            <div className="text-[#ffd700]/60 text-xs tracking-widest uppercase mb-1 font-body">Current State</div>
            <div className="text-xl font-display text-white tracking-widest transition-all duration-700">
                {treeState === TreeMorphState.TREE_SHAPE ? "IMPERIAL FORM" : "ETHEREAL DUST"}
            </div>
        </div>
      </footer>
    </div>
  );
};