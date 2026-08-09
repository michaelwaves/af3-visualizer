import type { Step } from '../types'

/** Sampling: 32 noise levels, 63 denoiser calls, one structure. */
export const diffusionSteps: Step[] = [
  {
    id: 'edm_schedule',
    stage: 'diffusion',
    title: 'Build the noise schedule',
    module: 'ElucidatedAtomDiffusion.sample_schedule',
    sourceSymbol: 'ElucidatedAtomDiffusion.sample_schedule',
    summary: '33 noise levels from 1280 Å down to 0, spaced by the Karras ρ = 7 rule.',
    detail: [
      'AlphaFold 3 does not fold with an equivariant structure module the way AlphaFold 2 did. It generates coordinates with a diffusion model, and this is the ladder it climbs down.',
      'The spacing is the EDM rule from Karras et al.: interpolate linearly in σ^(1/ρ) with ρ = 7, which puts many more steps at low noise where the structure is being finalised than at high noise where it is still a cloud. Everything is scaled by σ_data = 16 Å, so the first level is 80 × 16 = 1280 Å — far larger than the molecule.',
    ],
    math: [
      {
        tex: '\\sigma_i = \\sigma_{\\text{data}}\\left(\\sigma_{\\max}^{1/\\rho} + \\frac{i}{N-1}\\left(\\sigma_{\\min}^{1/\\rho} - \\sigma_{\\max}^{1/\\rho}\\right)\\right)^{\\rho}',
        caption: 'σ_max = 80, σ_min = 0.002, ρ = 7, N = 32, then a final σ = 0 is appended',
      },
    ],
    inputs: [{ name: 'num_sample_steps', symbolic: 'int', note: '32' }],
    outputs: [{ name: 'sigmas', symbolic: 'ts+1', concrete: [33], note: '1280 → 0' }],
    defines: [
      {
        name: 'sigmas',
        symbolic: 'ts+1',
        concrete: [33],
        dtype: 'float32',
        description: 'The noise ladder, in ångström. Step 0 is pure noise; the last entry is exactly 0.',
      },
      {
        name: 'atom_pos',
        symbolic: 'b m 3',
        concrete: [1, 1354, 3],
        dtype: 'float32',
        description: 'The coordinates being denoised. Starts as σ₀ · 𝒩(0, I) — a cloud with radius of gyration ≈ 2240 Å.',
      },
    ],
  },
  {
    id: 'preconditioning',
    stage: 'diffusion',
    title: 'Precondition the network call',
    module: 'preconditioned_network_forward',
    sourceSymbol: 'ElucidatedAtomDiffusion.preconditioned_network_forward',
    summary: 'Four σ-dependent scalars keep the network\'s input and target unit-scale at every noise level.',
    detail: [
      'A denoiser has to work across six orders of magnitude of noise. Rather than expect one network to handle that, EDM wraps it in scalars that depend on σ, so the wrapped network always sees inputs of roughly unit variance and always predicts a target of roughly unit variance.',
      'At σ = 1280 the skip term is essentially zero and the network output is scaled by 16 — it is predicting the structure outright. At σ = 0.03 the skip term is ~1 and the output scale is tiny — it is making a small correction to coordinates that are nearly right.',
    ],
    math: [
      { tex: 'c_{\\text{skip}} = \\frac{\\sigma_{\\text{data}}^2}{\\sigma^2 + \\sigma_{\\text{data}}^2}, \\quad c_{\\text{out}} = \\frac{\\sigma \\cdot \\sigma_{\\text{data}}}{\\sqrt{\\sigma^2 + \\sigma_{\\text{data}}^2}}' },
      { tex: 'c_{\\text{in}} = \\frac{1}{\\sqrt{\\sigma^2 + \\sigma_{\\text{data}}^2}}, \\quad c_{\\text{noise}} = \\tfrac{1}{4}\\ln \\sigma' },
      { tex: 'D_\\theta(x; \\sigma) = c_{\\text{skip}}\\,x + c_{\\text{out}}\\,F_\\theta\\!\\left(c_{\\text{in}}\\,x;\\ \\sigma\\right)', caption: 'equation (7) of Karras et al.' },
    ],
    inputs: [
      { name: 'noised_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
      { name: 'sigma', symbolic: 'b', concrete: [1] },
    ],
    outputs: [{ name: 'denoised', symbolic: 'b m 3', concrete: [1, 1354, 3] }],
  },
]
