import type { Step } from '../types'

/** The two evidence branches of the trunk: templates, then the alignment. */
export const trunkEvidenceSteps: Step[] = [
  {
    id: 'template_embedder',
    stage: 'trunk',
    title: 'Fold the template into the pair map',
    module: 'TemplateEmbedder',
    algorithm: 'Algorithm 16',
    sourceSymbol: 'TemplateEmbedder.forward',
    traceId: 'template_embedder',
    repeats: '×2 blocks per template',
    summary: 'Each template is embedded, run through Pairformer blocks, then averaged over templates.',
    detail: [
      'The 108-wide template feature is projected to 64 channels and added to a projection of the current pair map, so the template is always read *in the context of* what the trunk already believes. Two pairwise blocks then run over it — the same triangle machinery used in the main trunk, just narrower and shallower.',
      'The result is averaged over templates (one here, up to four in the paper) and projected back up to 128 channels. If no template is present the whole branch is masked to zero.',
    ],
    math: [
      { tex: 'u_{ij} = \\mathrm{Linear}(f^{\\text{tmpl}}_{ij}) + \\mathrm{Linear}(\\mathrm{LN}(z_{ij}))' },
      { tex: 'z \\mathrel{+}= \\gamma \\cdot \\mathrm{Linear}\\!\\left(\\mathrm{ReLU}\\!\\left(\\frac{1}{T}\\sum_{t=1}^{T} \\mathrm{PairformerBlocks}(u^{(t)})\\right)\\right)' },
    ],
    inputs: [
      { name: 'templates', symbolic: 'b t n n dt', concrete: [1, 1, 199, 199, 108] },
      { name: 'template_mask', symbolic: 'b t', concrete: [1, 1] },
      { name: 'pairwise_repr', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] },
    ],
    outputs: [{ name: 'embedded_template', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
  },
  {
    id: 'template_pairwise_block',
    stage: 'trunk',
    title: 'Triangle updates inside the template branch',
    module: 'PairwiseBlock',
    sourceSymbol: 'PairwiseBlock.forward',
    traceId: 'template_pairwise_block',
    summary: 'The same five sub-layers as the main trunk, at 64 channels instead of 128.',
    detail: [
      'Worth pausing on: the template branch is not a special-purpose encoder. It is literally `PairwiseBlock`, the same class the Pairformer stacks 48 of. AlphaFold 3 reuses one pairwise update everywhere it has a token × token object to refine.',
    ],
    inputs: [{ name: 'pairwise_repr', symbolic: 'b n n d', concrete: [1, 199, 199, 64] }],
    outputs: [{ name: 'pairwise_repr', symbolic: 'b n n d', concrete: [1, 199, 199, 64] }],
  },
  {
    id: 'template_to_out',
    stage: 'trunk',
    title: 'The LayerScale gate',
    module: 'template_embedder.to_out',
    traceId: 'template_to_out',
    summary: 'A learned per-channel gain, initialised to zero — so at init this branch contributes nothing.',
    detail: [
      'This step exists because of something the capture makes impossible to miss. The template branch output, measured at the module boundary, is *exactly* zero — every one of its 5,068,928 entries.',
      'That is not a bug and not a masking accident. `TemplateEmbedder` ends in `out * self.layerscale`, and `layerscale` is an `nn.Parameter` initialised to zeros. The branch is gated shut at initialisation and has to earn its way open during training. The same trick appears on `MSAModule.layerscale_output`.',
      'The activation shown here is taken one operation earlier, before the gate, so there is something real to look at: the signal the branch *would* contribute, standing at roughly ±1.8.',
    ],
    math: [{ tex: '\\text{out} = \\gamma \\odot \\mathrm{Linear}(\\bar{u}), \\qquad \\gamma \\sim \\mathbf{0} \\ \\text{at initialisation}' }],
    inputs: [{ name: 'avg_template_repr', symbolic: 'b n n d', concrete: [1, 199, 199, 64] }],
    outputs: [{ name: 'out', symbolic: 'b n n dp', concrete: [1, 199, 199, 128] }],
  },
]
