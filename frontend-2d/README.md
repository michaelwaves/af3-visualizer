# AlphaFold3 Pytorch Implementation Visualized

A 2-D, debugger-style walkthrough of the AlphaFold 3 forward pass, driven entirely by a
real capture of this repository's model running on PDB **721p** — the H-Ras P21 catalytic
domain, a GTP analogue (GNP) and a magnesium ion.

There is a 3-D companion in `../frontend`. This one is the flat, text-first version: a
call stack, a variables pane, per-step math and source, and a prompt.

## What is real

Everything on the page is measured, not illustrated.

| | |
|---|---|
| Model | `Alphafold3` at paper scale — 456,701,750 parameters |
| Input | 199 tokens over 1,354 atoms, from the mmCIF shipped in `data/test/pdb_data` |
| Alignment | the real ColabFold a3m, 15,953 sequences; top 64 one-hot encoded into the trunk |
| Template | the AlphaFold DB model of H-Ras, `AF-P01112-F1`, encoded as the real 108-wide pair feature |
| Activations | 35 modules hooked during one forward pass, with input and output shapes and statistics |
| Source | lifted out of the installed package with `inspect.getsourcelines`, so snippets cannot drift |
| Device | one NVIDIA L40, 5.9 s, 2.7 GB peak |

**The weights are randomly initialised.** No trained AlphaFold 3 checkpoint is publicly
released. Every shape, module, schedule, line number and code path is real; the numerical
*values* are a real forward pass of an untrained network, not a trained prediction. The
page says so on every step, and a few of the more interesting observations — the
zero-initialised LayerScale gates, the pairwise stream growing to 10¹⁵ across 48
untrained residual blocks, pLDDT sitting at 50 — are consequences of exactly that.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # typecheck + bundle into dist/
```

The payloads in `public/data` are committed, so the site runs without a GPU.

## Regenerating the capture

Needs a GPU and an environment with `alphafold3_pytorch` importable.

```bash
python tools/capture_trace.py --output-dir public/data --device cuda
python tools/extract_source.py --output public/data/source.json
```

`capture_trace.py` writes `trace.json` (module signatures and statistics), `maps.json`
(quantised activation maps), `tensors/*.json` (full-precision downloads),
`predictions.json` and `diffusion.json`. `extract_source.py` re-lifts the 30 code
snippets at the current commit.

Add or move a stop by editing `tools/watchlist.py` — the hook resolves submodules by
dotted path, and anything that fails to resolve is reported rather than silently skipped.

## Layout

```
src/
  model/       the authored walkthrough — 44 steps, the axis glossary, stage metadata
  data/        payload types and loading
  components/  header, call stack, stage, panels, figures, variables, terminal
  terminal/    the command registry behind the af3> prompt
  lib/         colour ramps, map decoding, .npy writing, formatting
  styles/      tokens, then one stylesheet per region
tools/         the GPU capture and the source extractor
```

## The prompt

`help` lists everything. The useful ones:

```
where                 what step execution is on
steps [stage]         list steps, filtered by input|embed|trunk|diffusion|confidence
goto <id|n>           jump
vars / print <var>    the variables in scope, and one in detail
stats [module]        recorded tensor statistics for a hooked module
modules               every module that was hooked, with call counts
whatis <axis>         what n, dp, nw, dsi… mean, with their sizes here
data / map / code     open the matching panel
download              save this step's recorded tensor
meta                  provenance of the capture
```

Arrow keys walk the pass; the prompt has history and tab completion.

## Checking it

```bash
npm run build
npx vite preview --port 5183
node tools/shoot.mjs http://localhost:5183 shots/
```

`shoot.mjs` walks a set of steps, screenshots each, and fails loudly on console errors.
