import { useMemo } from 'react'
import { Html } from '@react-three/drei'
import { categoricalTexture } from '@engine/scene/texture'
import { palette } from '@engine/theme'
import type { MsaData } from '../data'

/** Residue classes, the grouping an alignment viewer colours by. */
const CLASS_COLORS: Record<string, string> = {
  hydrophobic: '#f0a05a',
  polar: '#7bd88f',
  acidic: '#f0664f',
  basic: '#5b8dee',
  special: '#a78bfa',
  gap: '#141821',
}

const RESIDUE_CLASS: Record<string, keyof typeof CLASS_COLORS> = {
  A: 'hydrophobic', V: 'hydrophobic', L: 'hydrophobic', I: 'hydrophobic', M: 'hydrophobic',
  F: 'hydrophobic', W: 'hydrophobic', Y: 'hydrophobic',
  S: 'polar', T: 'polar', N: 'polar', Q: 'polar',
  D: 'acidic', E: 'acidic',
  K: 'basic', R: 'basic', H: 'basic',
  C: 'special', G: 'special', P: 'special',
  '-': 'gap',
}

export interface MsaStackProps {
  msa: MsaData
  width: number
  height: number
  /** 0..1 — how many rows have dropped in. */
  reveal?: number
  showLabels?: boolean
}

/**
 * The alignment as one textured sheet, with a species icon per row. Every row is
 * a real UniProt entry resolved to a real organism.
 */
export const MsaStack = ({ msa, width, height, reveal = 1, showLabels = true }: MsaStackProps) => {
  const visibleRows = Math.max(1, Math.round(msa.rows.length * reveal))

  const texture = useMemo(() => {
    const alphabet = msa.alphabet
    const categories = msa.tokens.map((row, rowIndex) =>
      row.map((token) => (rowIndex < visibleRows ? paletteIndex(alphabet[token]) : PALETTE.length - 1)),
    )
    return categoricalTexture(categories, PALETTE)
  }, [msa, visibleRows])

  const rowHeight = height / msa.rows.length

  return (
    <group>
      <mesh>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial map={texture} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0, -0.02]}>
        <planeGeometry args={[width * 1.015, height * 1.02]} />
        <meshBasicMaterial color={palette.line} />
      </mesh>

      {showLabels &&
        msa.rows.slice(0, visibleRows).map((row, index) => (
          <Html
            key={row.accession + index}
            position={[-width / 2 - 0.15, height / 2 - (index + 0.5) * rowHeight, 0]}
            distanceFactor={15}
            style={{ pointerEvents: 'none', transform: 'translate(-100%, -50%)' }}
          >
            <div className="msa-row-label" title={row.organism ?? row.accession}>
              <span className="msa-identity">{Math.round(row.identity * 100)}%</span>
              <span className="msa-organism">{row.organism ?? row.accession}</span>
              <span className="msa-icon">{row.icon}</span>
            </div>
          </Html>
        ))}
    </group>
  )
}

const CLASS_ORDER: (keyof typeof CLASS_COLORS)[] = [
  'hydrophobic', 'polar', 'acidic', 'basic', 'special', 'gap',
]
const PALETTE = [...CLASS_ORDER.map((name) => CLASS_COLORS[name]), '#0a0c11']

const paletteIndex = (residue: string): number => {
  const residueClass = RESIDUE_CLASS[residue] ?? 'gap'
  return CLASS_ORDER.indexOf(residueClass)
}

export const MSA_LEGEND = CLASS_ORDER.map((name) => ({ name, color: CLASS_COLORS[name] }))
