import type { GraphEdge, GraphNode } from '../types'
import { port, portId } from './port'

const G = 'edm'
const p = (name: string, side: 'in' | 'out') => portId(G, name, side)

/** Inside `ElucidatedAtomDiffusion.sample` — Algorithm 18. */
export const edmNodes: GraphNode[] = [
  port(G, 'single_trunk_repr', 'b n dst', 'in', [1, 199, 384]),
  port(G, 'pairwise_trunk', 'b n n dpt', 'in', [1, 199, 199, 128]),
  port(G, 'single_inputs_repr', 'b n dsi', 'in', [1, 199, 417]),
  port(G, 'atom_feats', 'b m da', 'in', [1, 1354, 128]),
  {
    id: 'sample_schedule',
    label: 'Noise schedule',
    module: 'sample_schedule',
    kind: 'op',
    group: G,
    sourceSymbol: 'ElucidatedAtomDiffusion.sample_schedule',
    summary: '33 levels from 1280 Å to 0, by the Karras ρ = 7 rule.',
    detail: [
      'Interpolate linearly in σ^(1/ρ) with ρ = 7, which puts far more steps at low noise where the structure is being finalised than at high noise where it is still a cloud. Everything is scaled by σ_data = 16 Å, so the first level is 80 × 16 = 1280 Å.',
    ],
  },
  {
    id: 'init_noise',
    label: 'Initial noise',
    module: 'σ₀ · 𝒩(0, I)',
    kind: 'op',
    group: G,
    summary: 'A cloud of 1354 atoms with radius of gyration ≈ 2240 Å.',
  },
  {
    id: 'centre_random_augmentation',
    label: 'Random re-frame',
    module: 'CentreRandomAugmentation',
    kind: 'op',
    group: G,
    sourceSymbol: 'CentreRandomAugmentation.forward',
    summary: 'A random rotation and translation before every step.',
    detail: [
      'The denoiser is not equivariant by construction, so equivariance is enforced by never letting it see a preferred frame.',
    ],
  },
  {
    id: 'churn',
    label: 'Stochastic churn',
    module: 'S_churn = 80',
    kind: 'op',
    group: G,
    summary: 'Adds a little noise back before each step, then denoises further.',
    detail: [
      'σ̂ = σᵢ(1 + γ), and the extra noise injected is √(σ̂² − σᵢ²) · ε with ε drawn at S_noise = 1.003. Churn lets the sampler escape errors it made at higher noise.',
    ],
  },
  {
    id: 'preconditioning',
    label: 'Preconditioning',
    module: 'preconditioned_network_forward',
    kind: 'op',
    group: G,
    sourceSymbol: 'ElucidatedAtomDiffusion.preconditioned_network_forward',
    summary: 'Four σ-dependent scalars keep input and target at unit scale.',
    detail: [
      'D(x; σ) = c_skip·x + c_out·F(c_in·x; σ). At σ = 1280 the skip term is ~1.6 × 10⁻⁴ and c_out = 16 — the network predicts the structure outright. At the last steps c_skip → 1 and c_out → 0 — it is nudging coordinates that are nearly right.',
    ],
  },
  {
    id: 'diffusion_module',
    label: 'Denoiser',
    module: 'DiffusionModule',
    kind: 'group',
    group: G,
    algorithm: 'Algorithm 20',
    sourceSymbol: 'DiffusionModule.forward',
    traceId: 'diffusion_module',
    repeats: '×63 calls',
    summary: '279 M parameters — 61 % of the model. Open it.',
    detail: [
      'Called twice per sampling step for the second-order Heun correction, minus one at the final step where σ = 0 makes the correction unnecessary: 32 × 2 − 1 = 63.',
    ],
  },
  {
    id: 'heun',
    label: 'Heun step',
    module: '2nd-order correction',
    kind: 'op',
    group: G,
    summary: 'Euler toward the denoised point, evaluate again, average the two slopes.',
    detail: [
      'The measured trajectory is the clearest single number here: the radius of gyration falls from about 2240 Å at step 0 to 19.3 Å at step 32.',
    ],
  },
  port(G, 'sampled_atom_pos', 'b m 3', 'out', [1, 1354, 3]),
]

export const edmEdges: GraphEdge[] = [
  { from: 'sample_schedule', to: 'init_noise', tensor: 'sigmas', symbolic: 'ts+1', concrete: [33] },
  { from: 'init_noise', to: 'centre_random_augmentation', tensor: 'atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
  { from: 'centre_random_augmentation', to: 'churn', tensor: 'atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
  { from: 'churn', to: 'preconditioning', tensor: 'noised_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
  { from: 'sample_schedule', to: 'preconditioning', tensor: 'sigma', symbolic: 'b', concrete: [1] },
  { from: 'preconditioning', to: 'diffusion_module', tensor: 'c_in · x', symbolic: 'b m 3', concrete: [1, 1354, 3] },
  { from: p('single_trunk_repr', 'in'), to: 'diffusion_module', tensor: 'single_trunk_repr', symbolic: 'b n dst' },
  { from: p('pairwise_trunk', 'in'), to: 'diffusion_module', tensor: 'pairwise_trunk', symbolic: 'b n n dpt' },
  { from: p('single_inputs_repr', 'in'), to: 'diffusion_module', tensor: 'single_inputs_repr', symbolic: 'b n dsi' },
  { from: p('atom_feats', 'in'), to: 'diffusion_module', tensor: 'atom_feats', symbolic: 'b m da' },
  { from: 'diffusion_module', to: 'heun', tensor: 'denoised', symbolic: 'b m 3', concrete: [1, 1354, 3] },
  { from: 'heun', to: p('sampled_atom_pos', 'out'), tensor: 'sampled_atom_pos', symbolic: 'b m 3' },
  { from: 'heun', to: 'centre_random_augmentation', tensor: 'next of 32 steps', symbolic: 'b m 3', loop: true },
]
