import type { Step } from '../types'

/** The denoiser itself: an hourglass from atoms to tokens and back. */
export const diffusionDenoiserSteps: Step[] = [
  {
    id: 'diffusion_module',
    stage: 'diffusion',
    title: 'The denoiser',
    module: 'DiffusionModule',
    algorithm: 'Algorithm 20',
    sourceSymbol: 'DiffusionModule.forward',
    traceId: 'diffusion_module',
    repeats: '×63 calls',
    summary: 'Atom encoder → token transformer → atom decoder. 279 M parameters, 61 % of the model.',
    detail: [
      'The largest single component in AlphaFold 3, and it runs 63 times in this pass — twice per sampling step for the second-order Heun correction, minus one at the final step where σ = 0 makes the correction unnecessary.',
      'Its shape is an hourglass. Atoms are encoded locally at 128 channels, pooled up to 199 tokens at 768 channels where a 24-block transformer does the global reasoning, then broadcast back down to atoms to predict a coordinate update. Global attention runs over 199 tokens, never over 1354 atoms.',
      'Everything it needs from the trunk arrives as conditioning: the single and pairwise representations, the raw single inputs, and the relative position encoding.',
    ],
    inputs: [
      { name: 'noised_atom_pos', symbolic: 'b m 3', concrete: [1, 1354, 3] },
      { name: 'times', symbolic: 'b', concrete: [1] },
      { name: 'single_trunk_repr', symbolic: 'b n dst', concrete: [1, 199, 384] },
      { name: 'single_inputs_repr', symbolic: 'b n dsi', concrete: [1, 199, 417] },
      { name: 'pairwise_trunk', symbolic: 'b n n dpt', concrete: [1, 199, 199, 128] },
      { name: 'pairwise_rel_pos_feats', symbolic: 'b n n dpr', concrete: [1, 199, 199, 128] },
    ],
    outputs: [{ name: 'atom_pos_update', symbolic: 'b m 3', concrete: [1, 1354, 3] }],
  },
  {
    id: 'single_conditioning',
    stage: 'diffusion',
    title: 'Condition on the trunk and on the noise level',
    module: 'SingleConditioning',
    algorithm: 'Algorithm 21',
    sourceSymbol: 'SingleConditioning.forward',
    traceId: 'single_conditioning',
    summary: 'Concatenate trunk single with raw single inputs, then add a Fourier embedding of ln σ.',
    detail: [
      'The trunk\'s 384-channel single representation is concatenated with the 417-channel raw inputs to give 801 channels — the skip connection around the trunk made explicit.',
      'The noise level is then folded in. σ is passed through a random Fourier feature embedding of (¼ ln σ) and added, so the denoiser always knows how far from the data manifold it currently is. Without that it could not decide between "sketch the fold" and "nudge a side chain".',
    ],
    math: [{ tex: 's^{\\text{cond}} = \\left[\\,s^{\\text{trunk}} \\,\\Vert\\, s^{\\text{inputs}}\\,\\right] + \\mathrm{Fourier}\\!\\left(\\tfrac{1}{4}\\ln\\sigma\\right)' }],
    inputs: [
      { name: 'times', symbolic: 'b', concrete: [1] },
      { name: 'single_trunk_repr', symbolic: 'b n dst', concrete: [1, 199, 384] },
      { name: 'single_inputs_repr', symbolic: 'b n dsi', concrete: [1, 199, 417] },
    ],
    outputs: [{ name: 'single_cond', symbolic: 'b n (dst+dsi)', concrete: [1, 199, 801] }],
  },
  {
    id: 'pairwise_conditioning',
    stage: 'diffusion',
    title: 'Condition the pair map',
    module: 'PairwiseConditioning',
    algorithm: 'Algorithm 22',
    sourceSymbol: 'PairwiseConditioning.forward',
    traceId: 'pairwise_conditioning',
    summary: 'Trunk pair map plus relative position encoding, through two transition blocks.',
    detail: [
      'The denoiser gets its own copy of the pair map: the trunk output concatenated with the relative position encoding, projected to 128 and refined by two transitions. This is what supplies the attention bias inside the token transformer.',
    ],
    inputs: [
      { name: 'pairwise_trunk', symbolic: 'b n n dpt', concrete: [1, 199, 199, 128] },
      { name: 'pairwise_rel_pos_feats', symbolic: 'b n n dpr', concrete: [1, 199, 199, 128] },
    ],
    outputs: [{ name: 'pairwise_cond', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
  },
]
