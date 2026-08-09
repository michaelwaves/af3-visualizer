import { useEffect, useRef } from 'react'
import { STEPS } from '@/model/steps'
import { STAGES } from '@/model/types'
import { useWalkthrough } from '@/store/useWalkthrough'

/** The left rail: where in the forward pass execution currently sits. */
export function CallStack() {
  const index = useWalkthrough((state) => state.index)
  const goTo = useWalkthrough((state) => state.goTo)
  const current = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    current.current?.scrollIntoView({ block: 'nearest' })
  }, [index])

  return (
    <nav className="rail" aria-label="Forward pass">
      {STAGES.map((stage) => {
        const steps = STEPS.map((step, position) => ({ step, position })).filter(
          (entry) => entry.step.stage === stage.id,
        )
        const active = steps.some((entry) => entry.position === index)
        return (
          <section key={stage.id} className={`rail__stage ${active ? 'is-active' : ''}`}>
            <header className="rail__stage-head">
              <span className="rail__stage-label">{stage.label}</span>
              <span className="rail__stage-count">{steps.length}</span>
            </header>
            <ul className="rail__list">
              {steps.map(({ step, position }) => (
                <li key={step.id}>
                  <button
                    ref={position === index ? current : undefined}
                    className={`rail__step ${position === index ? 'is-current' : ''} ${
                      position < index ? 'is-done' : ''
                    }`}
                    onClick={() => goTo(position)}
                    aria-current={position === index ? 'step' : undefined}
                  >
                    <span className="rail__pointer">{position === index ? '▸' : ''}</span>
                    <span className="rail__step-text">
                      <span className="rail__step-title">{step.title}</span>
                      <span className="rail__step-module">{step.module}</span>
                    </span>
                    {step.algorithm && (
                      <span className="rail__algo">{step.algorithm.replace('Algorithm ', 'Alg ')}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )
      })}
    </nav>
  )
}
