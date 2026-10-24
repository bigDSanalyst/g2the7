/**
 * Top Navigation Bar following the Universal Top Bar Contract
 * Zone 1: Single text wordmark
 * Zone 2: 4-5 concise single-line navigation links
 * Zone 3: 1 primary action button
 */

import React from 'react';
import { Download } from 'lucide-react';

export type ActiveTab = 'matrix' | 'lean4' | 'rl_search' | 'simd_codegen' | 'butterfly';

interface NavbarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  onExportLean: () => void;
  onOpenPqVerify: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onExportLean,
  onOpenPqVerify,
}) => {
  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 border-b border-slate-800 bg-[#0a0d14]/90 backdrop-blur sticky top-0 z-50">
      {/* Zone 1: Brand Wordmark */}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onSelectTab('matrix');
        }}
        className="text-base font-semibold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
      >
        AGL(7,2) Cryptographic Workbench
      </a>

      {/* Zone 2: 5 Clean Single-Line Nav Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectTab('matrix')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'matrix' ? 'text-cyan-400 border-cyan-400' : 'border-transparent'
          }`}
        >
          Structural Matrix
        </button>
        <button
          onClick={() => onSelectTab('lean4')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'lean4' ? 'text-cyan-400 border-cyan-400' : 'border-transparent'
          }`}
        >
          Lean 4 Proofs
        </button>
        <button
          onClick={() => onSelectTab('rl_search')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'rl_search' ? 'text-cyan-400 border-cyan-400' : 'border-transparent'
          }`}
        >
          RL Conjugacy Orbit
        </button>
        <button
          onClick={() => onSelectTab('simd_codegen')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'simd_codegen' ? 'text-cyan-400 border-cyan-400' : 'border-transparent'
          }`}
        >
          SIMD Vector Codegen
        </button>
        <button
          onClick={() => onSelectTab('butterfly')}
          className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-0.5 border-b-2 ${
            activeTab === 'butterfly' ? 'text-cyan-400 border-cyan-400' : 'border-transparent'
          }`}
        >
          256-Point Butterfly
        </button>
      </nav>

      {/* Zone 3: Primary Action & Bridge */}
      <div className="flex items-center gap-2.5 shrink-0">
        <button
          onClick={onOpenPqVerify}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-md hover:from-emerald-300 hover:to-teal-300 transition-all whitespace-nowrap shrink-0 cursor-pointer shadow-sm shadow-emerald-950/40 border border-emerald-300/30"
          title="Export complete C constants, CBMC harness, and Lean 4 proofs for pq-verify"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
          Export to pq-verify
        </button>

        <button
          onClick={onExportLean}
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#151b2a] border border-slate-700/80 rounded-md hover:bg-slate-800 hover:text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          Lean 4
        </button>
      </div>
    </header>
  );
};
