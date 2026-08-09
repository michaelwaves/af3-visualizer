import type { ChapterReference } from '@engine/types'

/** Equations transcribed from the implementation, not from the paper's notation. */
export const trunkReference: Record<string, ChapterReference> = {
  relpos: {
    snippets: ['RelativePositionEncoding.forward'],
    equations: [
      {
        label: 'clipped relative sequence offset',
        latex: String.raw`d^{\text{res}}_{ij} = \begin{cases}
\operatorname{clip}\!\left(r_i - r_j + r_{\max},\; 0,\; 2r_{\max}\right) & \text{same chain} \\[4pt]
2r_{\max} + 1 & \text{otherwise}
\end{cases}`,
        note: 'Everything beyond r_max = 32 residues collapses into one bucket — that is the band you see, and the extra "otherwise" bucket is the bright ligand block.',
        where: [
          { symbol: 'r_i', meaning: 'residue index of token i' },
          { symbol: 'r_{\\max} = 32', meaning: 'clipping radius' },
        ],
      },
      {
        label: 'pair seed',
        latex: String.raw`z_{ij} = \operatorname{Linear}\Big(\big[\,\text{onehot}(d^{\text{res}}_{ij}),\; \text{onehot}(d^{\text{tok}}_{ij}),\; s^{\text{ent}}_{ij},\; \text{onehot}(d^{\text{chain}}_{ij})\,\big]\Big)`,
        note: '(2·32+2) + (2·32+2) + 1 + (2·2+2) = 139 one-hot inputs, projected to 128 channels.',
      },
    ],
  },

  msa: {
    snippets: ['MSAModule.to_layers'],
    equations: [
      {
        label: 'MSA initialisation',
        latex: String.raw`m_{si} = \operatorname{Linear}\big([\,\text{onehot}(a_{si}),\, \delta_{si}\,]\big) + \operatorname{Linear}(s_i)`,
        where: [
          { symbol: 'a_{si}', meaning: 'residue at row s, column i' },
          { symbol: '\\delta_{si}', meaning: 'has-deletion and deletion-value features' },
          { symbol: 's_i', meaning: 'single representation, broadcast down every row' },
        ],
      },
      {
        label: 'column conservation',
        latex: String.raw`C_i = 1 - \frac{-\sum_{a} p_{ia}\log p_{ia}}{\log 20}`,
        note: 'Computed over all 15,953 rows for the strip beneath the alignment. Not part of the model — it is how the picture is coloured.',
      },
    ],
  },

  'msa-pair': {
    snippets: ['OuterProductMean.forward', 'MSAPairWeightedAveraging.forward'],
    equations: [
      {
        label: 'outer product mean · Algorithm 9',
        latex: String.raw`z_{ij} \mathrel{+}= \operatorname{Linear}\left(\operatorname{flatten}\left(\frac{1}{N_s}\sum_{s} a_{si} \otimes b_{sj}\right)\right)`,
        note: 'a and b are 32-wide projections of the alignment, so the outer product is 32×32 = 1024 numbers per pair before the projection to 128.',
        where: [
          { symbol: 'a_{si}, b_{sj}', meaning: 'the two halves of Linear(LayerNorm(m))' },
          { symbol: 'N_s', meaning: 'number of unmasked alignment rows' },
        ],
      },
      {
        label: 'pair-weighted averaging · Algorithm 10',
        latex: String.raw`w^h_{ij} = \operatorname*{softmax}_{j}\big(\operatorname{Linear}^h(\operatorname{LayerNorm}(z_{ij}))\big), \qquad
\tilde{m}^h_{si} = g^h_{si} \odot \sum_{j} w^h_{ij}\, v^h_{sj}`,
        note: 'Note what is absent: no query, no key. The pair representation supplies the attention weights directly.',
      },
    ],
  },

  templates: {
    snippets: ['TemplateEmbedder.forward'],
    equations: [
      {
        label: 'template features',
        latex: String.raw`t_{ij} = \big[\,\text{onehot}_{39}(\lVert x_i - x_j \rVert),\; \hat{u}_{ij},\; m^{\beta}_{i},\; m^{\text{bb}}_{i},\; \text{onehot}_{32}(a_i),\; \text{onehot}_{32}(a_j)\,\big]`,
        note: '39 + 3 + 1 + 1 + 32 + 32 = 108 numbers per residue pair.',
        where: [
          { symbol: '\\hat{u}_{ij}', meaning: 'unit vector to j in residue i’s backbone frame' },
          { symbol: 'm^{\\beta}, m^{\\text{bb}}', meaning: 'was the β-carbon / backbone frame resolved?' },
        ],
      },
      {
        label: 'gated output',
        latex: String.raw`z_{ij} \mathrel{+}= \gamma \odot \operatorname{Linear}\!\left(\operatorname{ReLU}\left(\frac{1}{N_t}\sum_{t} \operatorname{LayerNorm}(t^{(t)}_{ij})\right)\right)`,
        note: 'γ is a learned per-channel scale initialised at zero, so an untrained model ignores templates entirely.',
      },
    ],
  },

  triangles: {
    snippets: ['TriangleMultiplication.forward', 'TriangleAttention.forward'],
    equations: [
      {
        label: 'triangle multiplication, outgoing · Algorithm 12',
        latex: String.raw`z_{ij} \leftarrow g_{ij} \odot \operatorname{Linear}\left(\operatorname{LayerNorm}\left(\sum_{k} a_{ik} \odot b_{jk}\right)\right)`,
        note: 'The incoming variant sums a_ki ⊙ b_kj instead. Both make edge (i,j) a function of every path through a third token k.',
        where: [
          { symbol: 'a, b', meaning: 'the two halves of a gated linear unit over z' },
          { symbol: 'g_{ij}', meaning: 'sigmoid gate, also computed from z' },
        ],
      },
      {
        label: 'triangle attention, starting node · Algorithm 14',
        latex: String.raw`\alpha^h_{ijk} = \operatorname*{softmax}_{k}\left(\frac{q^h_{ij}\cdot k^h_{ik}}{\sqrt{c}} + \operatorname{Linear}^h(z_{jk})\right), \qquad
o^h_{ij} = \sum_{k} \alpha^h_{ijk}\, v^h_{ik}`,
        note: 'Row i attends along itself, but the logits are biased by the pair value at the third vertex — the geometry constraint enters through that bias.',
      },
      {
        label: 'why it matters',
        latex: String.raw`\lVert x_i - x_j \rVert \;\le\; \lVert x_i - x_k \rVert + \lVert x_k - x_j \rVert`,
        note: 'No arrangement of points can violate this. Routing every update through k is how the matrix is pushed toward distances that some 3-D structure could actually realise.',
      },
    ],
  },

  pairformer: {
    snippets: ['PairwiseBlock.forward', 'AttentionPairBias.forward', 'Attend.forward'],
    equations: [
      {
        label: 'attention with pair bias · Algorithm 24',
        latex: String.raw`A^h_{ij} = \operatorname*{softmax}_{j}\left(\frac{q^h_i \cdot k^h_j}{\sqrt{c}} + \underbrace{\operatorname{Linear}^h\big(\operatorname{LayerNorm}(z_{ij})\big)}_{\text{one scalar per head}}\right)`,
        note: 'This is the only channel by which the pair representation steers the single representation — 128 channels squeezed to 16 numbers, one per head.',
      },
      {
        label: 'one block',
        latex: String.raw`\begin{aligned}
z &\mathrel{+}= \text{TriMul}^{\text{out}}(z) ,\quad z \mathrel{+}= \text{TriMul}^{\text{in}}(z) \\
z &\mathrel{+}= \text{TriAttn}^{\text{start}}(z) ,\quad z \mathrel{+}= \text{TriAttn}^{\text{end}}(z) \\
z &\mathrel{+}= \text{Transition}(z) \\
s &\mathrel{+}= \text{AttnPairBias}(s, z) ,\quad s \mathrel{+}= \text{Transition}(s)
\end{aligned}`,
        note: 'Repeated 48 times. The logits are soft-clamped with tanh before the softmax, which is why nothing here blows up at depth.',
      },
    ],
  },
}
