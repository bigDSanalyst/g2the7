/**
 * Comparative SIMD Latency & Instruction Count Estimation Engine
 * Microarchitectural modeling for AVX-512 GFNI vs. ARM NEON vs. AVX2
 */

export interface InstructionDetail {
  mnemonic: string;
  countPerBlock: number;
  purpose: string;
  latencyCycles: number;
  reciprocalThroughput: number;
  executionPorts: string;
}

export interface ArchitectureLatencyModel {
  archId: 'avx512' | 'neon' | 'avx2' | 'wasm' | 'scalar';
  name: string;
  isaFamily: string;
  sampleHardware: string;
  regWidthBits: number;
  elementsPerVector: number;
  instructionsPerBlock: number;
  pipelinePorts: string;
  instructionDetails: InstructionDetail[];
  notes: string;
}

export interface ComparativeLatencyRow {
  archId: 'avx512' | 'neon' | 'avx2' | 'wasm' | 'scalar';
  name: string;
  isaFamily: string;
  sampleHardware: string;
  regWidth: string;
  elementsPerVector: number;
  vectorBlocks: number;
  instrsPerBlock: number;
  totalInstructions: number;
  estimatedCycles: number;
  cyclesPerElement: number;
  ipcEstimated: number;
  speedupVsScalar: number;
  pipelineStalls: number;
  breakdown: Array<{ mnemonic: string; totalCount: number; purpose: string }>;
}

export const ARCHITECTURE_LATENCY_MODELS: ArchitectureLatencyModel[] = [
  {
    archId: 'avx512',
    name: 'x86-64 AVX-512 + GFNI',
    isaFamily: 'AVX-512F / GFNI (Galois Field New Instructions)',
    sampleHardware: 'Intel Ice Lake, Sapphire Rapids, AMD Zen 4 / Zen 5',
    regWidthBits: 512,
    elementsPerVector: 64,
    instructionsPerBlock: 2,
    pipelinePorts: 'Port 0, Port 1 (Dual-issue GFNI)',
    instructionDetails: [
      {
        mnemonic: 'vmovdqa64',
        countPerBlock: 1,
        purpose: '512-bit vector load',
        latencyCycles: 3,
        reciprocalThroughput: 0.5,
        executionPorts: 'Port 2, Port 3 (Load Unit)',
      },
      {
        mnemonic: 'vgf2p8affineqb',
        countPerBlock: 1,
        purpose: 'Hardware 8x8 GF(2) affine transform',
        latencyCycles: 3,
        reciprocalThroughput: 0.5,
        executionPorts: 'Port 0, Port 1 (Vector ALU)',
      },
    ],
    notes: 'Single hardware instruction computes Matrix * Vector ^ Displacement over GF(2) for 64 bytes simultaneously. Zero bit-masking or shifts required.',
  },
  {
    archId: 'neon',
    name: 'ARM NEON (ASIMD)',
    isaFamily: 'ARMv8-A / ARMv9-A Advanced SIMD',
    sampleHardware: 'Apple M1/M2/M3/M4, Cortex-X2 / X3 / A715, AWS Graviton 3/4',
    regWidthBits: 128,
    elementsPerVector: 16,
    instructionsPerBlock: 7,
    pipelinePorts: 'Execution Pipeline 2 & 3 (TBL / EOR)',
    instructionDetails: [
      {
        mnemonic: 'vld1q_u8',
        countPerBlock: 1,
        purpose: '128-bit vector load',
        latencyCycles: 3,
        reciprocalThroughput: 1.0,
        executionPorts: 'Load Pipeline 0 / 1',
      },
      {
        mnemonic: 'vandq_u8',
        countPerBlock: 2,
        purpose: 'Low/high nibble masking (0x0F & 0x07)',
        latencyCycles: 1,
        reciprocalThroughput: 0.5,
        executionPorts: 'Vector ALU 0 / 1',
      },
      {
        mnemonic: 'vshrq_n_u8',
        countPerBlock: 1,
        purpose: 'Logical right shift by 4 bits',
        latencyCycles: 1,
        reciprocalThroughput: 0.5,
        executionPorts: 'Vector Shift Unit',
      },
      {
        mnemonic: 'vqtbl1q_u8',
        countPerBlock: 2,
        purpose: 'Dual 16-byte vector table lookups (LUT_low + LUT_high)',
        latencyCycles: 2,
        reciprocalThroughput: 1.0,
        executionPorts: 'TBL / Permute Pipeline',
      },
      {
        mnemonic: 'veorq_u8',
        countPerBlock: 1,
        purpose: 'Bitwise XOR combination (low ^ high)',
        latencyCycles: 1,
        reciprocalThroughput: 0.5,
        executionPorts: 'Vector ALU 0 / 1',
      },
    ],
    notes: 'Requires nibble splitting into 4-bit and 3-bit sub-indices, dual table byte lookups, and affine XOR combination. Out-of-order execution hides TBL latencies.',
  },
  {
    archId: 'avx2',
    name: 'x86-64 AVX2 + BMI2',
    isaFamily: 'x86-64 AVX2 (256-bit)',
    sampleHardware: 'Intel Haswell / Skylake, AMD Zen 1 / Zen 2 / Zen 3',
    regWidthBits: 256,
    elementsPerVector: 32,
    instructionsPerBlock: 7,
    pipelinePorts: 'Port 0, Port 1, Port 5 (Vector Shuffle)',
    instructionDetails: [
      {
        mnemonic: 'vmovdqa',
        countPerBlock: 1,
        purpose: '256-bit vector load',
        latencyCycles: 3,
        reciprocalThroughput: 0.5,
        executionPorts: 'Port 2, Port 3',
      },
      {
        mnemonic: 'vpand',
        countPerBlock: 2,
        purpose: 'Nibble masking (0x0F & 0x07)',
        latencyCycles: 1,
        reciprocalThroughput: 0.33,
        executionPorts: 'Port 0, 1, 5',
      },
      {
        mnemonic: 'vpsrli',
        countPerBlock: 1,
        purpose: 'Shift right by 4 bits',
        latencyCycles: 1,
        reciprocalThroughput: 1.0,
        executionPorts: 'Port 0',
      },
      {
        mnemonic: 'vpshufb',
        countPerBlock: 2,
        purpose: 'Parallel byte shuffle within 128-bit lanes',
        latencyCycles: 1,
        reciprocalThroughput: 1.0,
        executionPorts: 'Port 5',
      },
      {
        mnemonic: 'vpxor',
        countPerBlock: 1,
        purpose: 'Combine linear sub-maps',
        latencyCycles: 1,
        reciprocalThroughput: 0.33,
        executionPorts: 'Port 0, 1, 5',
      },
    ],
    notes: 'Processes 32 bytes per iteration with dual 128-bit PSHUFB lanes. Bottlenecked primarily by Port 5 shuffle unit.',
  },
  {
    archId: 'wasm',
    name: 'WebAssembly SIMD128',
    isaFamily: 'Wasm Fixed-Width SIMD',
    sampleHardware: 'V8 (Chrome / Node.js), SpiderMonkey, WebKit',
    regWidthBits: 128,
    elementsPerVector: 16,
    instructionsPerBlock: 7,
    pipelinePorts: 'JIT-translated host vector registers',
    instructionDetails: [
      {
        mnemonic: 'v128.load',
        countPerBlock: 1,
        purpose: '128-bit memory load',
        latencyCycles: 4,
        reciprocalThroughput: 1.0,
        executionPorts: 'Host load unit',
      },
      {
        mnemonic: 'v128.and / u8x16.shr',
        countPerBlock: 3,
        purpose: 'Nibble extraction',
        latencyCycles: 1,
        reciprocalThroughput: 0.5,
        executionPorts: 'Host vector ALU',
      },
      {
        mnemonic: 'i8x16.swizzle',
        countPerBlock: 2,
        purpose: 'Vector table lookup',
        latencyCycles: 2,
        reciprocalThroughput: 1.0,
        executionPorts: 'Host shuffle unit',
      },
      {
        mnemonic: 'v128.xor',
        countPerBlock: 1,
        purpose: 'Affine term merge',
        latencyCycles: 1,
        reciprocalThroughput: 0.5,
        executionPorts: 'Host vector ALU',
      },
    ],
    notes: 'Cross-platform deterministic execution inside browser engines with zero bounds-checking overhead.',
  },
  {
    archId: 'scalar',
    name: 'Scalar C++ Baseline',
    isaFamily: 'x86-64 / AArch64 General Purpose',
    sampleHardware: 'Generic Single-Core CPU',
    regWidthBits: 64,
    elementsPerVector: 1,
    instructionsPerBlock: 14,
    pipelinePorts: 'General integer ALU',
    instructionDetails: [
      {
        mnemonic: 'scalar_bit_ops',
        countPerBlock: 14,
        purpose: '7 bit-tests + 7 masks + parity XOR loops per index',
        latencyCycles: 1,
        reciprocalThroughput: 1.0,
        executionPorts: 'ALU',
      },
    ],
    notes: 'Unvectorized baseline with severe branch misprediction risk and instruction-level serialization.',
  },
];

/**
 * Computes comparative execution metrics across architectures for a given batch size
 */
export function computeComparativeLatency(batchSize = 256): ComparativeLatencyRow[] {
  const scalarBlocks = batchSize;
  const scalarInstructions = scalarBlocks * 14;
  const scalarCycles = batchSize * 3.5; // ~3.5 cycles per element

  return ARCHITECTURE_LATENCY_MODELS.map((model) => {
    const vectorBlocks = Math.ceil(batchSize / model.elementsPerVector);
    const totalInstructions = vectorBlocks * model.instructionsPerBlock;

    let estimatedCycles = 0;
    let ipc = 1.0;

    switch (model.archId) {
      case 'avx512':
        // 4 blocks for 256 points. Load (0.5) + vgf2p8affineqb (0.5)
        // Pipeline latency = 1.0 cycle per 64-element block + 1 cycle drain
        estimatedCycles = Math.max(3.0, vectorBlocks * 1.0 + 1.0);
        ipc = totalInstructions / estimatedCycles;
        break;

      case 'neon':
        // 16 blocks for 256 points. 7 instructions per block.
        // Dual-issue vector ALU + TBL pipeline = ~2.1 cycles per 16-element block + 2 cycles drain
        estimatedCycles = vectorBlocks * 2.1 + 2.0;
        ipc = totalInstructions / estimatedCycles;
        break;

      case 'avx2':
        // 8 blocks for 256 points.
        // Bottleneck on Port 5 for PSHUFB: ~2.2 cycles per block + 1.5 drain
        estimatedCycles = vectorBlocks * 2.2 + 1.5;
        ipc = totalInstructions / estimatedCycles;
        break;

      case 'wasm':
        estimatedCycles = vectorBlocks * 2.6 + 2.5;
        ipc = totalInstructions / estimatedCycles;
        break;

      case 'scalar':
        estimatedCycles = scalarCycles;
        ipc = 1.0;
        break;
    }

    const cyclesPerElement = estimatedCycles / batchSize;
    const speedupVsScalar = scalarCycles / estimatedCycles;

    const breakdown = model.instructionDetails.map((inst) => ({
      mnemonic: inst.mnemonic,
      totalCount: vectorBlocks * inst.countPerBlock,
      purpose: inst.purpose,
    }));

    return {
      archId: model.archId,
      name: model.name,
      isaFamily: model.isaFamily,
      sampleHardware: model.sampleHardware,
      regWidth: `${model.regWidthBits}-bit`,
      elementsPerVector: model.elementsPerVector,
      vectorBlocks,
      instrsPerBlock: model.instructionsPerBlock,
      totalInstructions,
      estimatedCycles: Math.round(estimatedCycles * 10) / 10,
      cyclesPerElement: Math.round(cyclesPerElement * 1000) / 1000,
      ipcEstimated: Math.round(ipc * 100) / 100,
      speedupVsScalar: Math.round(speedupVsScalar * 10) / 10,
      pipelineStalls: 0,
      breakdown,
    };
  });
}
