/** Steps whose measured data deserves a picture of its own, beyond the activation map. */
export const STEPS_WITH_DATA = new Set([
  'msa_search',
  'msa_features',
  'template_features',
  'edm_schedule',
  'preconditioning',
  'edm_sample',
  'confidence_head',
  'distogram_head',
  'outputs',
])
