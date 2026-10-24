/**
 * Reinforcement Learning for Finite Group Conjugacy Exploration
 * Explores AGL(7,2) conjugacy classes under hard invariant barriers.
 * Includes real-time progress graph tracking reward (algebraic distance & diffusion) over training epochs,
 * multi-objective Pareto frontier, 7-stage diffusion heatmap, and candidate adoption.
 */

import React, { useState, useEffect, useRef } from 'react';
import { BitMatrix7, RLCandidate } from '../types/crypto';
import {
  computeAlgebraicDistance,
  computeConjugate,
  computeParetoFrontier,
  evaluateRLCandidate,
  generateRandomInvertibleP,
  INITIAL_RL_CANDIDATES,
} from '../math/rlConjugacy';
import { generateDiffusionHeatmap, HeatmapRow } from '../math/butterfly';
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Activity,
  TrendingUp,
  ShieldCheck,
  AlertTriangle,
  Layers,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface RLConjugacyViewProps {
  currentMatrix: BitMatrix7;
  displacementK: number;
  onAdoptMatrix: (m: BitMatrix7) => void;
}

interface EpochPoint {
  epoch: number;
  reward: number;
  bestSoFar: number;
  algebraicDistance: number;
  diffDiffusion: number;
  localClustering: number;
  branchNumber: number;
  zeroFixedPoints: boolean;
  isBarrierBreached: boolean;
  isPareto: boolean;
  candidateId: string;
}

export const RLConjugacyView: React.FC<RLConjugacyViewProps> = ({
  currentMatrix,
  displacementK,
  onAdoptMatrix,
}) => {
  const [candidates, setCandidates] = useState<RLCandidate[]>(INITIAL_RL_CANDIDATES);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>('cand_gen42');
  const [epochCount, setEpochCount] = useState<number>(55);
  const [isAutoTraining, setIsAutoTraining] = useState<boolean>(false);
  const [hoveredEpoch, setHoveredEpoch] = useState<EpochPoint | null>(null);

  // Graph layer visibility toggles
  const [showBestEnvelope, setShowBestEnvelope] = useState<boolean>(true);
  const [showAlgebraicDist, setShowAlgebraicDist] = useState<boolean>(true);
  const [showBreaches, setShowBreaches] = useState<boolean>(true);

  // Pre-seed epoch history
  const [epochHistory, setEpochHistory] = useState<EpochPoint[]>(() => {
    let runningMax = 0;
    const initialPoints: EpochPoint[] = [
      { epoch: 0, reward: 78.4, bestSoFar: 78.4, algebraicDistance: 14, diffDiffusion: 74.2, localClustering: 41.5, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_base' },
      { epoch: 6, reward: 72.1, bestSoFar: 78.4, algebraicDistance: 12, diffDiffusion: 70.0, localClustering: 44.0, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: false, candidateId: 'cand_gen6' },
      { epoch: 14, reward: 92.1, bestSoFar: 92.1, algebraicDistance: 21, diffDiffusion: 86.8, localClustering: 36.2, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen14' },
      { epoch: 19, reward: 0.0, bestSoFar: 92.1, algebraicDistance: 0, diffDiffusion: 14.3, localClustering: 5.2, branchNumber: 2, zeroFixedPoints: false, isBarrierBreached: true, isPareto: false, candidateId: 'cand_barrier_breach' },
      { epoch: 28, reward: 84.6, bestSoFar: 92.1, algebraicDistance: 17, diffDiffusion: 79.5, localClustering: 33.1, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen28' },
      { epoch: 35, reward: 79.2, bestSoFar: 92.1, algebraicDistance: 15, diffDiffusion: 75.4, localClustering: 39.2, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: false, candidateId: 'cand_gen35' },
      { epoch: 42, reward: 94.3, bestSoFar: 94.3, algebraicDistance: 24, diffDiffusion: 89.4, localClustering: 38.0, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen42' },
      { epoch: 49, reward: 0.0, bestSoFar: 94.3, algebraicDistance: 8, diffDiffusion: 35.0, localClustering: 22.0, branchNumber: 3, zeroFixedPoints: false, isBarrierBreached: true, isPareto: false, candidateId: 'cand_gen49_fail' },
      { epoch: 55, reward: 88.2, bestSoFar: 94.3, algebraicDistance: 19, diffDiffusion: 82.0, localClustering: 31.8, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen55' },
    ];
    return initialPoints;
  });

  const selectedCandidate =
    candidates.find((c) => c.id === selectedCandidateId) || candidates[0];

  const heatmapData: HeatmapRow[] = generateDiffusionHeatmap(selectedCandidate.matrix);

  // Single exploration step
  const executeStep = () => {
    setEpochCount((prevEpoch) => {
      const nextEpoch = prevEpoch + 1;
      const seed = Date.now() + nextEpoch * 1013;
      const randomP = generateRandomInvertibleP(seed);
      const conjugateL = computeConjugate(currentMatrix, randomP);

      if (conjugateL) {
        const newCandidate = evaluateRLCandidate(
          `cand_gen${nextEpoch}`,
          nextEpoch,
          conjugateL,
          randomP,
          displacementK,
          currentMatrix
        );

        setCandidates((prev) => computeParetoFrontier([newCandidate, ...prev]));

        setEpochHistory((prevHistory) => {
          const currentMax = prevHistory.reduce((m, p) => Math.max(m, p.reward), 0);
          const newMax = Math.max(currentMax, newCandidate.rewardScore);
          const isBreached = newCandidate.rewardScore === 0;

          const point: EpochPoint = {
            epoch: nextEpoch,
            reward: newCandidate.rewardScore,
            bestSoFar: newMax,
            algebraicDistance: newCandidate.algebraicDistance,
            diffDiffusion: newCandidate.diffDiffusion,
            localClustering: newCandidate.localClustering,
            branchNumber: newCandidate.branchNumber,
            zeroFixedPoints: newCandidate.zeroFixedPoints,
            isBarrierBreached: isBreached,
            isPareto: newCandidate.isPareto,
            candidateId: newCandidate.id,
          };
          return [...prevHistory, point];
        });

        if (newCandidate.rewardScore > 0) {
          setSelectedCandidateId(newCandidate.id);
        }
      }
      return nextEpoch;
    });
  };

  // Real-time automated training loop
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (isAutoTraining) {
      timer = setInterval(() => {
        executeStep();
      }, 350);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isAutoTraining, currentMatrix, displacementK]);

  const resetExploration = () => {
    setIsAutoTraining(false);
    setCandidates(INITIAL_RL_CANDIDATES);
    setSelectedCandidateId('cand_gen42');
    setEpochCount(55);
    setEpochHistory([
      { epoch: 0, reward: 78.4, bestSoFar: 78.4, algebraicDistance: 14, diffDiffusion: 74.2, localClustering: 41.5, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_base' },
      { epoch: 6, reward: 72.1, bestSoFar: 78.4, algebraicDistance: 12, diffDiffusion: 70.0, localClustering: 44.0, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: false, candidateId: 'cand_gen6' },
      { epoch: 14, reward: 92.1, bestSoFar: 92.1, algebraicDistance: 21, diffDiffusion: 86.8, localClustering: 36.2, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen14' },
      { epoch: 19, reward: 0.0, bestSoFar: 92.1, algebraicDistance: 0, diffDiffusion: 14.3, localClustering: 5.2, branchNumber: 2, zeroFixedPoints: false, isBarrierBreached: true, isPareto: false, candidateId: 'cand_barrier_breach' },
      { epoch: 28, reward: 84.6, bestSoFar: 92.1, algebraicDistance: 17, diffDiffusion: 79.5, localClustering: 33.1, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen28' },
      { epoch: 35, reward: 79.2, bestSoFar: 92.1, algebraicDistance: 15, diffDiffusion: 75.4, localClustering: 39.2, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: false, candidateId: 'cand_gen35' },
      { epoch: 42, reward: 94.3, bestSoFar: 94.3, algebraicDistance: 24, diffDiffusion: 89.4, localClustering: 38.0, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen42' },
      { epoch: 49, reward: 0.0, bestSoFar: 94.3, algebraicDistance: 8, diffDiffusion: 35.0, localClustering: 22.0, branchNumber: 3, zeroFixedPoints: false, isBarrierBreached: true, isPareto: false, candidateId: 'cand_gen49_fail' },
      { epoch: 55, reward: 88.2, bestSoFar: 94.3, algebraicDistance: 19, diffDiffusion: 82.0, localClustering: 31.8, branchNumber: 4, zeroFixedPoints: true, isBarrierBreached: false, isPareto: true, candidateId: 'cand_gen55' },
    ]);
  };

  // Calculations for SVG chart
  const maxEpoch = Math.max(60, epochHistory[epochHistory.length - 1]?.epoch || 60);
  const minEpoch = 0;
  const maxReward = 110;
  const minReward = 0;

  const width = 760;
  const height = 210;
  const padL = 46;
  const padR = 24;
  const padT = 20;
  const padB = 30;

  const chartW = width - padL - padR;
  const chartH = height - padT - padB;

  const getX = (ep: number) => padL + ((ep - minEpoch) / (maxEpoch - minEpoch)) * chartW;
  const getY = (val: number) => padT + chartH - (Math.max(0, Math.min(maxReward, val)) / maxReward) * chartH;

  // Build SVG polyline points
  const rewardPoints = epochHistory
    .filter((p) => !p.isBarrierBreached)
    .map((p) => `${getX(p.epoch)},${getY(p.reward)}`)
    .join(' ');

  const bestEnvelopePoints = epochHistory
    .map((p) => `${getX(p.epoch)},${getY(p.bestSoFar)}`)
    .join(' ');

  const algDistPoints = epochHistory
    .filter((p) => !p.isBarrierBreached)
    .map((p) => `${getX(p.epoch)},${getY(p.algebraicDistance * 3.5)}`) // scaled to 0..100
    .join(' ');

  // Summary statistics
  const peakReward = epochHistory.reduce((m, p) => Math.max(m, p.reward), 0);
  const breachedCount = epochHistory.filter((p) => p.isBarrierBreached).length;
  const breachRate = ((breachedCount / Math.max(1, epochHistory.length)) * 100).toFixed(1);
  const validPoints = epochHistory.filter((p) => !p.isBarrierBreached);
  const meanAlgDist = validPoints.length > 0
    ? (validPoints.reduce((sum, p) => sum + p.algebraicDistance, 0) / validPoints.length).toFixed(1)
    : '0';

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
              onClick={() => setIsAutoTraining(!isAutoTraining)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer font-semibold shadow-sm ${
                isAutoTraining
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-900/30'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-cyan-900/30'
              }`}
            >
              {isAutoTraining ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  Pause Training
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Auto-Train Agent
                </>
              )}
            </button>
            <button
              onClick={executeStep}
              disabled={isAutoTraining}
              className="px-3 py-1.5 rounded bg-[#151b2a] border border-slate-700 text-slate-300 hover:text-white text-xs font-medium transition-colors cursor-pointer disabled:opacity-40"
              title="Run 1 Epoch"
            >
              Step 1 Epoch
            </button>
            <button
              onClick={resetExploration}
              className="p-1.5 rounded bg-[#151b2a] border border-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Reset training history"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Progress Graph: Reward & Algebraic Distance over Training Epochs */}
      <div className="p-5 rounded-lg bg-[#0e121d] border border-slate-800 space-y-4">
        {/* Top telemetry strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              Real-Time Training Progress: Reward &amp; Algebraic Distance
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks the composite RL reward R(L') across training epochs as the agent searches AGL(7,2) conjugacy classes.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-[#151b2a] px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px]">EPOCH:</span>
              <span className="text-white font-bold">{epochCount}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#151b2a] px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px]">PEAK REWARD:</span>
              <span className="text-emerald-400 font-bold">{peakReward}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#151b2a] px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px]">MEAN DIST:</span>
              <span className="text-purple-300 font-bold">{meanAlgDist}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-[#151b2a] px-2.5 py-1 rounded border border-slate-800">
              <span className="text-slate-400 text-[10px]">BARRIER REJECTS:</span>
              <span className="text-rose-400 font-bold">{breachedCount} ({breachRate}%)</span>
            </div>
          </div>
        </div>

        {/* SVG Progress Graph */}
        <div className="relative bg-[#07090e] rounded-lg border border-slate-800 p-3 overflow-x-auto">
          {/* Active training indicator */}
          {isAutoTraining && (
            <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[#101726]/90 border border-cyan-500/40 px-2.5 py-1 rounded-full text-[10px] font-mono text-cyan-300 backdrop-blur">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>Agent Exploring Conjugacy Orbits...</span>
            </div>
          )}

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[680px] h-[220px]">
            <defs>
              <linearGradient id="rewardAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Gridlines & Y-Axis Labels */}
            {[0, 25, 50, 75, 100].map((val) => {
              const y = getY(val);
              return (
                <g key={val}>
                  <line
                    x1={padL}
                    y1={y}
                    x2={width - padR}
                    y2={y}
                    stroke="#1e293b"
                    strokeDasharray="2 4"
                    strokeWidth="1"
                  />
                  <text
                    x={padL - 8}
                    y={y + 3.5}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="end"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X-Axis Epoch Labels */}
            {Array.from({ length: 7 }).map((_, i) => {
              const ep = Math.round((maxEpoch / 6) * i);
              const x = getX(ep);
              return (
                <g key={i}>
                  <line
                    x1={x}
                    y1={padT}
                    x2={x}
                    y2={height - padB}
                    stroke="#1e293b"
                    strokeDasharray="2 4"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={height - padB + 16}
                    fill="#64748b"
                    fontSize="10"
                    fontFamily="monospace"
                    textAnchor="middle"
                  >
                    Ep {ep}
                  </text>
                </g>
              );
            })}

            {/* Hard Constraint Barrier Threshold Line (y = 0 / breach barrier) */}
            <line
              x1={padL}
              y1={getY(0)}
              x2={width - padR}
              y2={getY(0)}
              stroke="#e11d48"
              strokeWidth="1.5"
              strokeOpacity="0.6"
            />
            <text
              x={width - padR}
              y={getY(0) - 4}
              fill="#f43f5e"
              fontSize="9"
              fontFamily="monospace"
              textAnchor="end"
            >
              Barrier Threshold [B(L) &lt; 4 or Fixed Point] ➔ Reward = 0
            </text>

            {/* Best So Far Pareto Envelope Line */}
            {showBestEnvelope && (
              <polyline
                fill="none"
                stroke="#10b981"
                strokeWidth="1.5"
                strokeDasharray="4 3"
                points={bestEnvelopePoints}
                strokeOpacity="0.85"
              />
            )}

            {/* Algebraic Distance Curve */}
            {showAlgebraicDist && (
              <polyline
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
                points={algDistPoints}
                strokeOpacity="0.7"
              />
            )}

            {/* Primary Reward Curve */}
            <polyline
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2.5"
              points={rewardPoints}
            />

            {/* Epoch Data Points */}
            {epochHistory.map((pt) => {
              const cx = getX(pt.epoch);
              const cy = getY(pt.reward);
              const isSelected = selectedCandidateId === pt.candidateId;

              if (pt.isBarrierBreached) {
                if (!showBreaches) return null;
                return (
                  <g
                    key={pt.epoch}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredEpoch(pt)}
                    onMouseLeave={() => setHoveredEpoch(null)}
                  >
                    <line
                      x1={cx - 4}
                      y1={cy - 4}
                      x2={cx + 4}
                      y2={cy + 4}
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                    <line
                      x1={cx - 4}
                      y1={cy + 4}
                      x2={cx + 4}
                      y2={cy - 4}
                      stroke="#f43f5e"
                      strokeWidth="2"
                    />
                  </g>
                );
              }

              return (
                <circle
                  key={pt.epoch}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 6 : pt.isPareto ? 4.5 : 3.5}
                  fill={isSelected ? '#22d3ee' : pt.isPareto ? '#10b981' : '#06b6d4'}
                  stroke="#ffffff"
                  strokeWidth={isSelected ? 2 : 1}
                  className="cursor-pointer transition-transform hover:scale-150"
                  onMouseEnter={() => setHoveredEpoch(pt)}
                  onMouseLeave={() => setHoveredEpoch(null)}
                  onClick={() => {
                    const found = candidates.find((c) => c.id === pt.candidateId);
                    if (found) setSelectedCandidateId(found.id);
                  }}
                />
              );
            })}
          </svg>

          {/* Hover Tooltip Card */}
          {hoveredEpoch && (
            <div
              className="absolute z-30 pointer-events-none p-2.5 rounded bg-[#10141f]/95 border border-cyan-500/50 shadow-xl shadow-black/80 font-mono text-[11px] text-slate-200"
              style={{
                left: Math.min(chartW - 80, Math.max(60, getX(hoveredEpoch.epoch) - 60)),
                top: Math.max(10, getY(hoveredEpoch.reward) - 85),
              }}
            >
              <div className="font-bold text-white flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                <span className="text-cyan-400">Epoch #{hoveredEpoch.epoch}</span>
                <span className={hoveredEpoch.isBarrierBreached ? 'text-rose-400' : 'text-emerald-400'}>
                  {hoveredEpoch.isBarrierBreached ? 'Barrier Breached' : 'Passed Invariants'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                <span>Reward: <strong className="text-white">{hoveredEpoch.reward}</strong></span>
                <span>Best So Far: <strong className="text-emerald-400">{hoveredEpoch.bestSoFar}</strong></span>
                <span>Algebraic Dist: <strong className="text-purple-300">{hoveredEpoch.algebraicDistance}</strong></span>
                <span>Diffusion: <strong className="text-cyan-300">{hoveredEpoch.diffDiffusion}%</strong></span>
                <span>Branch B(L): <strong className={hoveredEpoch.branchNumber >= 4 ? 'text-emerald-400' : 'text-rose-400'}>{hoveredEpoch.branchNumber}</strong></span>
                <span>Clustering: <strong className="text-slate-300">{hoveredEpoch.localClustering}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* Graph Layer Toggles & Legend */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-400 pt-1">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 bg-cyan-400" />
              <span className="text-cyan-300 font-semibold">Reward Score R(L')</span>
            </div>

            <button
              onClick={() => setShowBestEnvelope(!showBestEnvelope)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                showBestEnvelope ? 'text-emerald-400' : 'text-slate-600 line-through'
              }`}
            >
              <span className="w-3 h-0.5 border-t border-dashed border-emerald-400" />
              <span>Best-so-far Envelope</span>
            </button>

            <button
              onClick={() => setShowAlgebraicDist(!showAlgebraicDist)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                showAlgebraicDist ? 'text-purple-400' : 'text-slate-600 line-through'
              }`}
            >
              <span className="w-3 h-0.5 bg-purple-400" />
              <span>Algebraic Distance Metric</span>
            </button>

            <button
              onClick={() => setShowBreaches(!showBreaches)}
              className={`flex items-center gap-1.5 cursor-pointer transition-colors ${
                showBreaches ? 'text-rose-400' : 'text-slate-600 line-through'
              }`}
            >
              <span className="font-bold text-rose-500">✕</span>
              <span>Barrier Breaches (B &lt; 4)</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500">
            Click any point on curve to load matrix
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
                Epoch #{epochCount} · {candidates.length} Orbits Evaluated
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Trade-off between Differential Diffusion (higher is better) and Local Clustering Stride (lower is better):
            </p>

            {/* Scatter Canvas */}
            <div className="relative h-60 bg-[#07090e] rounded border border-slate-800 p-4">
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
                  const xPct = Math.min(95, Math.max(5, ((cand.localClustering - 15) / 45) * 100));
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
                      title={`${cand.id}: Diff=${cand.diffDiffusion}%, Clust=${cand.localClustering}, Dist=${cand.algebraicDistance}, Reward=${cand.rewardScore}`}
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
                  Epoch #{selectedCandidate.generation} · Reward: {selectedCandidate.rewardScore} · Alg Dist: {selectedCandidate.algebraicDistance}
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
