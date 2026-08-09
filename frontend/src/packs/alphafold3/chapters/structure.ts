import type { Chapter } from '@engine/types'

export const structureChapters: Chapter[] = [
  {
    id: 'noise',
    stage: 'sample',
    title: 'Diffusion, and what it replaced',
    blurb: 'Rigid residue frames are gone; coordinates come out of a denoiser instead.',
    section: 'Structure',
    scene: 'noise',
    beats: [
      {
        id: 'af2',
        text: 'AlphaFold 2 ended with a structure module that predicted a rigid frame per residue and had equivariance built into its geometry. Elegant — but it assumes everything is a residue with a backbone.',
        camera: { position: [0, 9, 24], target: [0, 0, 0.8] },
      },
      {
        id: 'swap',
        text: 'AlphaFold 3 throws that out and predicts *raw atom coordinates* with a diffusion model. No frames, no equivariant layers, no assumption that the thing being folded is a polymer.',
        highlight: ['cloud'],
        drive: ['cloud'],
      },
      {
        id: 'augment',
        text: 'Equivariance is recovered the cheap way: every training example is randomly rotated and translated, 48 times per step. The model learns the symmetry instead of having it imposed.',
        drive: ['cloud', 'augment'],
        highlight: ['augment'],
      },
      {
        id: 'schedule',
        text: 'Sampling walks a noise schedule from σ = 1280 Å down to 0, in 32 steps. That maximum is *σ_max × σ_data* — 80 × 16 — and at that scale the atoms are pure noise, spread over a thousand ångström.',
        drive: ['cloud', 'augment', 'schedule'],
        highlight: ['schedule'],
        shape: { name: 'sigmas', dims: ['steps'], note: 'Karras ρ = 7 schedule, measured from the model' },
      },
      {
        id: 'rho',
        text: 'The spacing is not linear. A ρ = 7 schedule crowds the steps toward low noise, where the structure is actually decided — the first four steps cover half the range, the last twelve refine ångströms.',
        drive: ['cloud', 'augment', 'schedule'],
        highlight: ['schedule'],
      },
      {
        id: 'precondition',
        text: 'At each level the network is wrapped in Karras preconditioning: inputs scaled by *c_in*, output mixed with the current guess by *c_skip* and *c_out*. At high noise the network predicts almost everything; at low noise it barely edits.',
        drive: ['cloud', 'augment', 'schedule', 'precondition'],
        highlight: ['precondition'],
      },
      {
        id: 'churn',
        text: 'Sampling also adds noise back in — *S_churn = 80* — briefly re-roughening the structure at each step so the sampler can escape a bad basin instead of committing early.',
        drive: ['cloud', 'augment', 'schedule', 'precondition'],
      },
    ],
  },
  {
    id: 'diffusion-module',
    stage: 'denoise',
    title: 'The diffusion module',
    blurb: 'Algorithm 20 — atoms up to tokens, and back down.',
    section: 'Structure',
    scene: 'diffusion',
    beats: [
      {
        id: 'shape',
        text: 'The denoiser is the largest single component in the model: 279,320,006 parameters, more than the entire trunk. It runs once per sampling step.',
        camera: { position: [8, 9, 24], target: [0, 1.5, 0] },
        highlight: ['module'],
      },
      {
        id: 'conditioning',
        text: 'It is conditioned on everything the trunk produced — the single representation, the pair representation, the relative position encoding — plus a Fourier embedding of the current noise level.',
        highlight: ['conditioning'],
        drive: ['conditioning'],
      },
      {
        id: 'encoder',
        text: 'Noisy coordinates enter at atom resolution. A 3-block *atom encoder* processes them in those 27-atom windows, then pools to 199 token vectors of width 768.',
        drive: ['conditioning', 'encoder'],
        highlight: ['encoder'],
      },
      {
        id: 'token',
        text: 'A 24-block *token transformer* does the global reasoning — full attention across all 199 tokens, biased once more by the pair representation.',
        drive: ['conditioning', 'encoder', 'token'],
        highlight: ['token'],
        shape: { name: 'token transformer', dims: ['blocks', 'dim', 'heads'], sizes: [24, 768, 16] },
      },
      {
        id: 'decoder',
        text: 'Then a 3-block *atom decoder* broadcasts token updates back down to all 1,354 atoms and emits a coordinate update. Atoms → tokens → atoms, every single step.',
        drive: ['conditioning', 'encoder', 'token', 'decoder'],
        highlight: ['decoder'],
      },
      {
        id: 'trajectory',
        text: 'Watch the sampler run. The radius of gyration collapses from *2,232 Å* of pure noise to *19.9 Å* — a compact, protein-sized object — across 32 steps.',
        camera: { position: [1, 4, 23], target: [1, 0, 0] },
        drive: ['conditioning', 'encoder', 'token', 'decoder', 'trajectory'],
        highlight: ['trajectory'],
      },
      {
        id: 'caveat',
        text: 'These weights are randomly initialised, so the collapse is real but the fold is not. What this shows is the *dynamics* of the sampler — the part that is architecture rather than training.',
        drive: ['conditioning', 'encoder', 'token', 'decoder', 'trajectory'],
      },
    ],
  },
]
