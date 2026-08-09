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
| `source.json` | verbatim source for 17 methods, with file, line range and commit |
| `raw.json` + `raw/` | the mmCIF and a3m the featuriser read, shipped for the raw-input viewer |

Model weights are randomly initialised, so shapes, schedules and dynamics are
real but the predicted values are not a trained prediction. The payloads say so,
and the chapters that show them say so too.

### Where the pictures come from

Every matrix on screen is a real tensor, but each one had to be flattened to 2-D
to be drawn. **Inspect tensors** in the bottom-right opens a drawer that names
the module that produced it, its full shape, the exact reduction applied (for a
pair map: the mean over its 128 channels), summary statistics over the *full*
tensor, and whether the values depend on the untrained weights. From there you
can download the matrix as CSV or JSON — exactly the numbers being drawn.

### What the model is actually given

**Files** opens the input surface itself, with each file tagged by role:

- `alphafold3_input.py` — *model input*. One amino-acid sequence, one SMILES
  string, the word `Mg`. That is the whole thing.
- `721p-assembly1A_protein.a3m` — *model input*. The alignment, reduced to the
  per-column profile the model consumes (first 400 of 15,953 records shipped).
- `721p-assembly1.cif` — **reference only**. Never fed to the model. It is where
  the sequence and the ligand list were read from, and its coordinates are the
  ground truth the prediction is compared against.
- `predicted_structure.cif` / `.pdb` — *model output*. The sampled coordinates,
  with per-atom pLDDT in the B-factor column.

## Weights

There are no trained weights for this implementation. It is a faithful
reimplementation of the architecture that was never trained to convergence, and
nothing is published on the Hub. AlphaFold 3's official weights are request-only
from Google DeepMind and cannot be redistributed.

So every value from *this* model comes from randomly initialised weights.
Shapes, schedules, parameter counts, timings and sampler dynamics are all real;
its predicted structure is a real file in the right format holding a fold that
never happened.

The final chapter closes that gap with **Boltz-2** (MIT, open weights), an
AlphaFold 3-class model given the identical input — same sequence, same SMILES,
same ion, same 15,953-sequence alignment. It resolves the complex to the same
199 tokens and 1,354 atoms, and lands **0.75 Å CA RMSD** from the crystal.

```bash
pip install boltz
boltz predict hras.yaml --no_kernels --output_format mmcif
python tools/extract.py --boltz-dir <predictions>/hras
```

Two notes if you reproduce it: Boltz ships a CUDA 13 torch build, which needs
replacing on older drivers, and `--no_kernels` avoids the optional
`cuequivariance_torch` dependency. And 721P has been in the PDB since 1990, so
it is training data for every model of this generation — the 0.75 Å shows the
pipeline runs end to end, not blind accuracy.

Colour uses the 2nd–98th percentile of each matrix rather than min/max, because
a single outlier otherwise flattens a whole map to one shade.

`activations.json` is ~5 MB raw and ~1 MB gzipped; pair maps are kept at full
199 × 199 token resolution so the inspector shows real values, not a thumbnail.
Serve it with compression.

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
4. Define `pipeline` — a `PipelineStage[]` in forward-pass order, each naming the
   class actually invoked. Tag each chapter with `stage: '<id>'` and the map at
   the top of the scene tracks where the reader is.
5. Define `inspectables(data)` — the matrices the tensor inspector can show and
   export, each with the `Provenance` the extractor recorded.
6. Define `reference` — per chapter, the `Equation[]` (KaTeX) and the source
   snippet keys behind it. Snippets are pulled from the installed package by
   `tools/source_extractor.py`, so they cannot drift from the code that ran.
7. Export a `ModelPack` and point `data` at your JSON.
8. Render it: `<Explainer pack={yourPack} />`.

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
