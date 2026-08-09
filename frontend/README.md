# Model Explainer

An interactive 3D walkthrough of a deep learning model: narrated chapters on the
left, a live scene built from the model's own tensors on the right.

The first pack explains **AlphaFold 3**, using the implementation in this
repository. Every number on screen is measured — parameter counts come from an
instantiated model, tensor shapes from a real forward pass, the alignment from
the a3m file shipped in `data/`, and the species labels from UniProt.

```bash
npm install
npm run dev          # http://localhost:5173
```

The site reads pre-generated JSON from `public/data`, so it runs without a GPU.

## Regenerating the data

The extractor builds AlphaFold 3 at paper scale and runs it on a real complex —
H-Ras (721p) with its GTP analogue and magnesium ion.

```bash
python tools/extract.py                 # needs torch + this repo installed
python tools/extract.py --skip-model    # structure, MSA and template only
python tools/extract.py --offline       # skip UniProt species lookups
```

| file | what it holds |
| --- | --- |
| `structure.json` | H-Ras chain A: backbone, atoms, ligand, ion |
| `msa.json` | 48 alignment rows with resolved organisms, plus stats over all 15,953 |
| `template.json` | AlphaFold DB model of H-Ras, binned as AF3 bins templates |
| `features.json` | the real input tensors the featuriser produces |
| `model.json` | parameter census, depths, measured runtime and memory |
| `activations.json` | pair maps and attention captured from a forward pass |
| `predictions.json` | pLDDT, PAE and distogram from the confidence heads |
| `diffusion.json` | the EDM noise schedule and the sampler's real trajectory |

Model weights are randomly initialised, so shapes, schedules and dynamics are
real but the predicted values are not a trained prediction. The payloads say so,
and the chapters that show them say so too.

## Adding another model

The engine knows nothing about proteins. A pack supplies chapters and scenes;
everything else — narrative panel, table of contents, camera director, tensor
primitives, beat clock, keyboard navigation — is shared.

```
src/
  engine/            model-agnostic: layout, store, camera, primitives
  packs/
    alphafold3/
      pack.ts        chapters + scenes + data manifest
      chapters/*.ts  prose, one Chapter[] per section
      scenes/*.tsx   one component per chapter, reading the store
      components/    pack-specific 3D pieces
```

To add a pack — a PLM, Evo 2, Boltz, AlphaGenome:

1. Write `chapters/*.ts` as `Chapter[]`. Each beat is one paragraph, optionally
   with a `camera` shot, `highlight` ids, `drive` channels and a `shape` chip.
2. Write one scene component per chapter. Read progress with `useDrive(channel)`
   (0→1 while its beat plays) and `useHighlight(id)`.
3. Define `axes` — an `AxisDefinition` per symbol your shapes use. Shape chips
   print symbols only (`pairwise [b, n, n, dp]`); the legend beside the scene
   expands whichever axes the current beat mentions, and hovering a symbol in
   either place highlights it in the other.
4. Export a `ModelPack` and point `data` at your JSON.
5. Render it: `<Explainer pack={yourPack} />`.

Reusable primitives worth knowing: `TensorSlab` (a matrix as a lit slab),
`Caption` (billboarded label with a shape annotation), `Flow` (data moving
between tensors), and the `ramps` in `engine/theme.ts`, where colour encodes what
*kind* of tensor something is rather than which model it came from.

## Development

```bash
npm run typecheck
npm run build
node tools/contact-sheet.mjs shots     # one screenshot per chapter
node tools/shoot.mjs 5 4 out.png       # a single beat
```

Screenshot tools need `npm run dev` on port 5177 and drive the store through
`window.__explainer`, which is exposed in development builds only.
