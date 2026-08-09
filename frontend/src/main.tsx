import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Explainer } from '@engine/Explainer'
import { useExplainer } from '@engine/store'
import { alphafold3Pack } from '@packs/alphafold3/pack'
import 'katex/dist/katex.min.css'
import './styles.css'

// Exposed so development tooling can drive the walkthrough to a given beat.
if (import.meta.env.DEV) {
  ;(window as unknown as { __explainer: typeof useExplainer }).__explainer = useExplainer
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Explainer pack={alphafold3Pack} />
  </StrictMode>,
)
