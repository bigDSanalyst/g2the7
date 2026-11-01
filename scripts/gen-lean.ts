// Prints the Lean file for the canonical matrix. CI diffs it against
// agl72_proof.lean, so the export and the checked file cannot drift.
import { generateLean4Source } from '../src/math/lean4Proofs';
import { PRESET_MATRICES } from '../src/math/algebra';

const canonical = PRESET_MATRICES.find((p) => p.id === 'circulant_c3');
if (!canonical) throw new Error('canonical preset circulant_c3 not found');
process.stdout.write(generateLean4Source(canonical.matrix, canonical.displacementK));
