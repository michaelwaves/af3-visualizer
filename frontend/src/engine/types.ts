import type { ComponentType } from 'react'
import type { Vector3Tuple } from 'three'
import type { InspectableTensor } from './inspector/types'

/** Where the camera sits for a beat. Interpolated between beats by the director. */
export interface CameraShot {
  position: Vector3Tuple
  target: Vector3Tuple
  /** Seconds to ease into this shot. Defaults to the engine's standard glide. */
  duration?: number
}

/** A single narrated step. Beats are the atomic unit of the walkthrough. */
export interface Beat {
  id: string
  /** Prose shown in the narrative panel. Supports *emphasis* and `code` spans. */
  text: string
  camera?: CameraShot
  /** Scene element ids spotlit while this beat is active. */
  highlight?: string[]
  /** Named scalars the scene reads, eased from 0 to 1 while the beat plays. */
  drive?: string[]
  /** Optional shape annotation rendered as a chip under the prose. */
  shape?: TensorShape
}

/** A labelled tensor shape, e.g. pairwise_repr [b, n, n, dp]. */
export interface TensorShape {
  name: string
  /** Axis symbols only — sizes and meanings are resolved from the pack's glossary. */
  dims: string[]
  /** Per-shape sizes, where they differ from the glossary default. */
  sizes?: number[]
  note?: string
}

/** What one axis symbol means, and how big it is on the walkthrough's example. */
export interface AxisDefinition {
  /** Short name, e.g. "tokens". */
  label: string
  /** One clause explaining what the axis counts. */
  meaning: string
  /** Default size for this walkthrough's example input. */
  size?: number
  /** Groups the legend, e.g. "sequence" or "channels". */
  group?: string
}

/** One step of the model's forward pass, named after the code that runs it. */
export interface PipelineStage {
  id: string
  label: string
  /** The class actually invoked, e.g. `PairformerStack`. */
  module: string
  /** Where it lives, for people who want to go read it. */
  qualifiedName?: string
  algorithm?: string
  /** Marks stages that run inside the recycling loop. */
  loop?: boolean
  note?: string
}

export interface Chapter {
  id: string
  title: string
  /** Which pipeline stage this chapter is explaining. */
  stage?: string
  /** Short line shown in the table of contents. */
  blurb: string
  /** Section grouping in the table of contents, e.g. "Trunk". */
  section: string
  /** Key into the pack's scene registry. */
  scene: string
  beats: Beat[]
}

/** Scene components receive nothing; they pull live state from the engine store. */
export type SceneComponent = ComponentType

/**
 * A self-contained description of one model. Swap the pack, keep the engine:
 * the narrative panel, camera director, primitives and layout are model-agnostic.
 */
export interface ModelPack {
  id: string
  title: string
  subtitle: string
  /** Credit line rendered in the title card. */
  source: { label: string; href: string }
  chapters: Chapter[]
  scenes: Record<string, SceneComponent>
  /** Axis symbols used across the pack's shape annotations. */
  axes: Record<string, AxisDefinition>
  /** The forward pass in execution order, for the progress map. */
  pipeline: PipelineStage[]
  /** Matrices the inspector can show and export, derived from the loaded data. */
  inspectables: (data: Record<string, unknown>) => InspectableTensor[]
  /** JSON payloads fetched once at boot, keyed by name. */
  data: Record<string, string>
}
