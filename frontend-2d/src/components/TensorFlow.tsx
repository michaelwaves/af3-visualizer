import type { TensorSpec } from '@/model/types'
import { ShapeChip } from './ShapeChip'

interface TensorFlowProps {
  inputs: TensorSpec[]
  outputs: TensorSpec[]
}

/** The module signature: what goes in, what comes out, with hoverable axes. */
export function TensorFlow({ inputs, outputs }: TensorFlowProps) {
  return (
    <div className="flow">
      <Column title="in" tone="in" tensors={inputs} />
      <div className="flow__arrow" aria-hidden>
        →
      </div>
      <Column title="out" tone="out" tensors={outputs} />
    </div>
  )
}

function Column({
  title,
  tone,
  tensors,
}: {
  title: string
  tone: 'in' | 'out'
  tensors: TensorSpec[]
}) {
  return (
    <div className={`flow__column flow__column--${tone}`}>
      <div className="section-label">{title}</div>
      {tensors.length === 0 && <p className="flow__none">—</p>}
      <ul className="flow__list">
        {tensors.map((tensor) => (
          <li key={tensor.name} className="flow__item">
            <span className="flow__name">{tensor.name}</span>
            <ShapeChip symbolic={tensor.symbolic} concrete={tensor.concrete} tone={tone} />
            {tensor.note && <span className="flow__note">{tensor.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  )
}
