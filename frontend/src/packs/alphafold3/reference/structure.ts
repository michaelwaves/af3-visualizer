import type { ChapterReference } from '@engine/types'

/** The diffusion side: Karras preconditioning, the schedule, and the sampler. */
export const structureReference: Record<string, ChapterReference> = {
  embedder: {
    snippets: ['InputFeatureEmbedder.forward'],
    equations: [
      {
        label: 'atoms up to tokens',
        latex: String.raw`s^{\text{inputs}}_i = \operatorname{Linear}\left(\frac{1}{|A_i|}\sum_{a \in A_i} q_a\right) \;\Vert\; f_i`,
        where: [
          { symbol: 'A_i', meaning: 'the atoms belonging to token i' },
          { symbol: 'q_a', meaning: 'atom features after the windowed atom transformer' },
          { symbol: 'f_i', meaning: 'the 33 extra token features (alignment profile, deletion mean)' },
        ],
      },
      {
        label: 'two representations',
        latex: String.raw`s_i = \operatorname{Linear}(s^{\text{inputs}}_i) + E[a_i], \qquad
z_{ij} = \operatorname{Linear}(s^{\text{inputs}}_i) + \operatorname{Linear}(s^{\text{inputs}}_j) + E'[a_i] + E'[a_j]`,
        note: 'The pair representation starts life as an outer *sum*, not an outer product — it is cheap, and the triangle operations supply the structure later.',
      },
    ],
  },

  noise: {
    snippets: [
      'ElucidatedAtomDiffusion.sample_schedule',
      'ElucidatedAtomDiffusion.preconditioned_network_forward',
    ],
    equations: [
      {
        label: 'noise schedule · Karras ρ = 7',
        latex: String.raw`\sigma_i = \sigma_{\text{data}}\left(\sigma_{\max}^{1/\rho} + \frac{i}{N-1}\left(\sigma_{\min}^{1/\rho} - \sigma_{\max}^{1/\rho}\right)\right)^{\rho}, \qquad \sigma_N = 0`,
        note: 'With σ_data = 16, σ_max = 80 and ρ = 7, the first level is 1280 Å. The exponent is what crowds the steps toward low noise.',
        where: [
          { symbol: '\\sigma_{\\text{data}} = 16', meaning: 'assumed standard deviation of real coordinates, in ångström' },
          { symbol: 'N = 32', meaning: 'sampling steps' },
        ],
      },
      {
        label: 'preconditioning · Karras Table 1',
        latex: String.raw`\begin{aligned}
D(x;\sigma) &= c_{\text{skip}}(\sigma)\,x + c_{\text{out}}(\sigma)\, F\big(c_{\text{in}}(\sigma)\,x,\; c_{\text{noise}}(\sigma)\big) \\[4pt]
c_{\text{skip}} &= \frac{\sigma_{\text{data}}^2}{\sigma^2 + \sigma_{\text{data}}^2}, \quad
c_{\text{out}} = \frac{\sigma\,\sigma_{\text{data}}}{\sqrt{\sigma^2 + \sigma_{\text{data}}^2}}, \quad
c_{\text{in}} = \frac{1}{\sqrt{\sigma^2 + \sigma_{\text{data}}^2}}, \quad
c_{\text{noise}} = \tfrac{1}{4}\ln \sigma
\end{aligned}`,
        note: 'At high noise c_skip → 0, so the network output *is* the prediction. At low noise c_skip → 1 and the network only nudges what it already has.',
        where: [{ symbol: 'F', meaning: 'the DiffusionModule itself' }],
      },
      {
        label: 'churn',
        latex: String.raw`\gamma_i = \begin{cases} \min\!\left(\frac{S_{\text{churn}}}{N},\, \sqrt{2}-1\right) & \sigma_i \in [S_{\text{tmin}}, S_{\text{tmax}}] \\ 0 & \text{otherwise}\end{cases}, \qquad
\hat{\sigma} = \sigma(1 + \gamma)`,
        note: 'S_churn = 80 over 32 steps saturates at √2 − 1, so almost every step re-roughens before it denoises.',
      },
    ],
  },

  'diffusion-module': {
    snippets: ['DiffusionModule.forward', 'ElucidatedAtomDiffusion.sample'],
    equations: [
      {
        label: 'one sampler step · Heun',
        latex: String.raw`\begin{aligned}
\hat{x} &= x + \sqrt{\hat{\sigma}^2 - \sigma^2}\; S_{\text{noise}}\,\varepsilon, \qquad \varepsilon \sim \mathcal{N}(0, I) \\[4pt]
d &= \frac{\hat{x} - D(\hat{x};\hat{\sigma})}{\hat{\sigma}} \\[4pt]
x' &= \hat{x} + (\sigma_{\text{next}} - \hat{\sigma})\, d \cdot \lambda \\[4pt]
x_{\text{next}} &= \hat{x} + \tfrac{1}{2}(\sigma_{\text{next}} - \hat{\sigma})\big(d + d'\big)\cdot \lambda \quad \text{if } \sigma_{\text{next}} \neq 0
\end{aligned}`,
        note: 'd is the score direction. The second-order correction d′ re-evaluates the network at x′, which is why 32 steps costs 63 network calls, not 32.',
        where: [{ symbol: '\\lambda = 1.5', meaning: 'step_scale — AlphaFold 3 overshoots the ODE step deliberately' }],
      },
      {
        label: 'atoms → tokens → atoms',
        latex: String.raw`q \xrightarrow{\;\text{AtomEncoder}_{3}\;} \operatorname{pool} \xrightarrow{\;\text{TokenTransformer}_{24}\;} \operatorname{broadcast} \xrightarrow{\;\text{AtomDecoder}_{3}\;} \Delta x \in \mathbb{R}^{m \times 3}`,
        note: 'The token transformer is where global reasoning happens; the atom stages exist so the model can speak about chemistry the token grid cannot express.',
      },
    ],
  },

  confidence: {
    snippets: ['ConfidenceHead.forward', 'DistogramHead.forward'],
    equations: [
      {
        label: 'pLDDT as an expectation',
        latex: String.raw`\text{pLDDT}_a = \sum_{b=1}^{50} v_b \cdot \operatorname*{softmax}_b\big(\operatorname{Linear}(s_a)\big), \qquad v_b = b - 0.5`,
        note: 'The head predicts a distribution over 50 bins spanning 0–100, then it is read out as a mean. Same trick for PAE and the distogram, with 64 bins each.',
      },
      {
        label: 'distogram',
        latex: String.raw`p_{ij} = \operatorname*{softmax}\big(\operatorname{Linear}(z_{ij} + z_{ji})\big), \qquad
\mathbb{E}[d_{ij}] = \sum_{b=1}^{64} \delta_b\, p_{ijb}, \quad \delta \in [2, 22]\,\text{Å}`,
        note: 'Symmetrised before the projection, so the predicted distance matrix is symmetric by construction.',
      },
    ],
  },
}
