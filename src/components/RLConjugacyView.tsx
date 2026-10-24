/**
 * Reinforcement Learning for Finite Group Conjugacy Exploration
 * Explores AGL(7,2) conjugacy classes under hard invariant barriers
 * Includes interactive Pareto frontier, 7-stage diffusion heatmap, and candidate adoption
 */

import React, { useState } from 'react';
import { BitMatrix7, RLCandidate } from '../types/crypto';
import {
  computeConjugate,
  computeParetoFrontier,
  evaluateRLCandidate,
  generateRandomInvertibleP,
  INITIAL_RL_CANDIDATES,
} from '../math/rlConjugacy';
import { generateDiffusionHeatmap, HeatmapRow } from '../math/butterfly';
import { Play, RotateCcw, CheckCircle2, AlertTriangle, Sparkles, ArrowRight } from 'lucide-react';

interface RLConjugacyViewProps {
  currentMatrix: BitMatrix7;
  displacementK: number;
  onAdoptMatrix: (m: BitMatrix7) => void;
}

export const RLConjugacyView: React.FC<RLConjugacyViewProps> = ({
  currentMatrix,
  displacementK,
  onAdoptMatrix,
}) => {
  const [candidates, setCandidates] = useState<RLCandidate[]>(INITIAL_RL_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand_gen14');
  const [generationCount, setGenerationCount] = useState<number>(55);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const heatmapData: HeatmapRow[] = generateDiffusionHeatmap(selectedCandidate.matrix);

  const runSearchStep = () => {
    setIsSearching(true);
    setTimeout(() => {
      const nextGen = generationCount + 1;
      const seed = Date.now() + nextGen * 997;
      const randomP = generateRandomInvertibleP(seed);
      const conjugateL = computeConjugate(currentMatrix, randomP);

      if (conjugateL) {
        const newCandidate = evaluateRLCandidate(
          `cand_gen${nextGen}`,
          nextGen,
          conjugateL,
          randomP,
          displacementK
        );
        const updated = computeParetoFrontier([newCandidate, ...candidates]);
        setCandidates(updated);
        setSelectedCandidateId(newCandidate.id);
        setGenerationCount(nextGen);
      }
      setIsSearching(false);
    }, 250);
  };

  const resetExploration = () => {
    setCandidates(INITIAL_RL_CANDIDATES);
    setSelectedCandidateId('cand_gen14');
    setGenerationCount(55);
  };

  return (
    <div className="space-y-6">
      {/* Pillar 2 Header */}
      <div className="p-5 rounded-lg bg-[#0e121d] border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400">
                Pillar 2: Algebraic Exploration Agent
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs font-mono text-purple-400">
                AlphaEvolve Conjugacy Search
              </span>
            </div>
            <h3 className="text-base font-semibold text-white tracking-tight">
              Reinforcement Learning for Finite Group Conjugacy Exploration
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Searches the conjugacy orbit L' = P · L · P⁻¹ within AGL(7,2) to optimize secondary NTT performance metrics. Invariants B(L) = 4 and zero fixed points are enforced as hard constraint barriers in the reward function, while the agent optimizes 7-stage differential dispersion and minimizes cache access clustering.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={runSearchStep}
              disabled={isSearching}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors cursor-pointer font-semibold shadow-sm shadow-cyan-900/30 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {isSearching ? 'Sampling Orbit...' : 'Run RL Search Step'}
            </button>
            <button
              onClick={resetExploration}
              className="p-1.5 rounded bg-[#151b2a] border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset candidates"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Pareto Frontier & Diffusion Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Pareto Frontier Scatter Plot & Search Metrics (6 Cols) */}
        <div className="lg:col-span-6 space-y-4">
          <div className="p-5 rounded-lg bg-[#0e121d] border border-slate-800">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
                Multi-Objective Pareto Frontier
              </h4>
              <span className="text-[11px] font-mono text-cyan-400">
                Gen #{generationCount} · {candidates.length} Orbits Evaluated
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Trade-off between Differential Diffusion (higher is better) and Local Clustering Stride (lower is better):
            </p>

            {/* Scatter Canvas */}
            <div className="relative h-64 bg-[#07090e] rounded border border-slate-800 p-4">
              {/* Axis Labels */}
              <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400">
                ▲ Differential Diffusion (0 - 100%)
              </div>
              <div className="absolute bottom-2 right-3 text-[10px] font-mono text-slate-400">
                Local Memory Clustering (Lower = Smoother Stride) ▶
              </div>

              {/* Grid Lines */}
              <div className="absolute inset-8 border-b border-l border-slate-800">
                <div className="absolute inset-0 grid grid-rows-4 grid-cols-4 pointer-events-none opacity-20">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <div key={i} className="border-r border-t border-slate-600" />
                  ))}
                </div>

                {/* Plot Candidates */}
                {candidates.map((cand) => {
                  const isSelected = cand.id === selectedCandidateId;
                  // Normalized positioning
                  // X: clustering from 10 to 60
                  const xPct = Math.min(95, Math.max(5, ((cand.localClustering - 15) / 45) * 100));
                  // Y: diffusion from 10 to 100 (inverted for top=100)
                  const yPct = Math.min(95, Math.max(5, 100 - ((cand.diffDiffusion - 10) / 90) * 100));

                  const isBarrierBreached = cand.rewardScore === 0;

                  return (
                    <button
                      key={cand.id}
                      onClick={() => setSelectedCandidateId(cand.id)}
                      style={{ left: `${xPct}%`, top: `${yPct}%` }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform hover:scale-125 z-10 ${
                        isSelected ? 'scale-125 z-20' : ''
                      }`}
                      title={`${cand.id}: Diff=${cand.diffDiffusion}%, Clust=${cand.localClustering}, Reward=${cand.rewardScore}`}
                    >
                      {isBarrierBreached ? (
                        <div className="w-3 h-3 flex items-center justify-center text-rose-500 font-bold text-xs">
                          ✕
                        </div>
                      ) : cand.isPareto ? (
                        <div
                          className={`w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white shadow-sm shadow-cyan-400/50 ${
                            isSelected ? 'ring-2 ring-cyan-300 ring-offset-2 ring-offset-black' : ''
                          }`}
                        />
                      ) : (
                        <div
                          className={`w-2.5 h-2.5 rounded-full bg-slate-500 hover:bg-slate-300 ${
                            isSelected ? 'ring-2 ring-cyan-300' : ''
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                <span>Pareto-Optimal Candidate</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <span>Dominated</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Hard Barrier Breached (B &lt; 4)</span>
              </div>
            </div>
          </div>

          {/* Selected Candidate Details & Adoption */}
          <div className="p-4 rounded-lg bg-[#0e121d] border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h5 className="text-xs font-semibold uppercase tracking-wider text-white">
                  Active Candidate: {selectedCandidate.id}
                </h5>
                <span className="text-[11px] font-mono text-slate-400">
                  Generation {selectedCandidate.generation} · Reward Score: {selectedCandidate.rewardScore}
                </span>
              </div>

              <button
                onClick={() => onAdoptMatrix(selectedCandidate.matrix)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Adopt as Active Matrix
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="p-2 rounded bg-[#07090e] border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Branch B(L)</span>
                <div className={`text-sm font-semibold mt-0.5 ${selectedCandidate.branchNumber >= 4 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedCandidate.branchNumber}
                </div>
              </div>
              <div className="p-2 rounded bg-[#07090e] border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Fixed Points</span>
                <div className={`text-sm font-semibold mt-0.5 ${selectedCandidate.zeroFixedPoints ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {selectedCandidate.zeroFixedPoints ? '0 (Locked)' : 'Detected'}
                </div>
              </div>
              <div className="p-2 rounded bg-[#07090e] border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Diffusion</span>
                <div className="text-sm font-semibold text-cyan-300 mt-0.5">
                  {selectedCandidate.diffDiffusion}%
                </div>
              </div>
              <div className="p-2 rounded bg-[#07090e] border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase">Clustering</span>
                <div className="text-sm font-semibold text-slate-300 mt-0.5">
                  {selectedCandidate.localClustering}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: 7-Stage Differential Diffusion Heatmap (6 Cols) */}
        <div className="lg:col-span-6 p-5 rounded-lg bg-[#0e121d] border border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">
              7-Stage Differential Diffusion Heatmap
            </h4>
            <span className="text-[11px] font-mono text-cyan-400">
              16 Basis Differences × 7 Butterfly Layers
            </span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Measures Hamming weight of active bit differences as they propagate across the 7 butterfly stages:
          </p>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-xs font-mono text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="py-1 px-1.5">Input Δb</th>
                  <th className="py-1 px-1 text-center">wt_in</th>
                  {Array.from({ length: 7 }).map((_, s) => (
                    <th key={s} className="py-1 px-1 text-center">
                      Stg {s}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {heatmapData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20">
                    <td className="py-1 px-1.5 text-slate-300 whitespace-nowrap">
                      {row.diffName} <span className="text-slate-500">({row.diffHex})</span>
                    </td>
                    <td className="py-1 px-1 text-center text-slate-400">{row.inWeight}</td>
                    {row.stageWeights.map((w, s) => {
                      // Color ramp from w=1 (dark cyan) to w=7 (bright phosphor cyan)
                      let bgClass = 'bg-cyan-950/40 text-cyan-500';
                      if (w >= 6) bgClass = 'bg-cyan-400 text-slate-950 font-bold';
                      else if (w >= 4) bgClass = 'bg-cyan-600/80 text-white font-semibold';
                      else if (w >= 3) bgClass = 'bg-cyan-800/60 text-cyan-200';
                      else if (w >= 2) bgClass = 'bg-cyan-900/40 text-cyan-300';

                      return (
                        <td key={s} className="py-1 px-1 text-center">
                          <span
                            className={`inline-block w-6 py-0.5 text-center rounded text-[11px] ${bgClass}`}
                          >
                            {w}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-4 pt-2 border-t border-slate-800">
            <span>Color Ramp: 1 active bit (dark) ➔ 7 active bits (full diffusion)</span>
            <span className="text-cyan-400">Rapid 7-Stage Dispersion</span>
          </div>
        </div>
      </div>
    </div>
  );
};
