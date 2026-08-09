# AlphaFold3 Pytorch Implementation Visualized — the graph

The AlphaFold 3 computational graph as a node canvas: every module is a node, every
tensor is a labelled edge, and any node with a sub-graph can be opened. Click a node to
inspect it — real shapes, real statistics, the source that runs, the activation it
produced.

Driven by the same capture as `../frontend-2d`: one real forward pass over PDB **721p**
(H-Ras P21, a GTP analogue, a magnesium ion) on an NVIDIA L40.

## Layout

```
Alphafold3.forward                     15 nodes — PDB in, structure and confidences out
├── Input embedder                     18   Algorithm 2
├── Trunk                              10   the recycling loop
│   ├── Template embedder               8   Algorithm 16
│   ├── MSA module                     11   Algorithms 8–11
│   └── Pairformer stack                7   Algorithm 17
│       └── Pairwise block              7   Algorithms 11–15
├── Diffusion sampler                  12   Algorithm 18
│   └── Denoiser                       15   Algorithms 5, 6, 20–23
└── Confidence head                    15   Algorithm 31
```

118 nodes across ten levels. Nodes carrying a filled dot were recorded in the capture:
their input and output shapes, dtypes and statistics come from the real call, not from
the paper.

## Reading it

- **Click** a node — the drawer shows what it is, what it consumes and produces, the
  implementation at its real line numbers, and its recorded activation.
- **Open ↳** (or double-click) descends into a group; the breadcrumb walks back up.
- Selecting a node **lights its wires** and names the tensors on them. `auto / all / none`
  in the breadcrumb bar controls how many tensor labels are drawn — `auto` keeps the
  canvas quiet.
- **Search** finds any module anywhere in the tree, by label, class or algorithm number,
  and tells you which level it lives on.
- Every axis symbol on a shape — `b`, `n`, `m`, `s`, `nw`, `dp`, `dsi` — is hoverable, with
  the wording from the codebase's own `global ein notation` legend and its size here.
- Activations download as `.npy`, `.csv` or `.json`.

## Running it

```bash
npm install
npm run dev            # http://localhost:5173
npm run build
```

The payloads are **not duplicated**: `vite.config.ts` points `publicDir` at
`../frontend-2d/public`, so both sites read one copy of the capture. Regenerate it with
`python tools/capture_trace.py` in `frontend-2d`.

## What is real, and what is not

Shapes, module structure, algorithm numbers, call counts, schedules and every line of
source are real. **The weights are randomly initialised** — no trained AlphaFold 3
checkpoint is publicly released — so the numerical values are a real forward pass of an
untrained network, not a prediction. The bar along the bottom says so, and three of the
more interesting things on the canvas follow directly from it: the zero-initialised
LayerScale gates on the template and MSA branches, the pairwise stream reaching 10¹⁵
after 48 untrained residual blocks, and pLDDT sitting at 50.

The graph's edges were read off `Alphafold3.forward` and the module bodies rather than
inferred, so the dataflow — including the recycling and sampling feedback edges, drawn
dashed — matches what the code actually does.

## Layout of the source

```
src/
  graph/         the graph itself: types, the ten levels, dagre layout
  canvas/        React Flow node and edge components
  inspector/     the drawer — signature, code, activation, neighbours
  components/    header, search, breadcrumb, provenance, shared chips
  data/, lib/    payload loading, colour ramps, .npy writing (shared with frontend-2d)
tools/           screenshot and sweep scripts
```

## Checking it

```bash
npm run build && npx vite preview --port 5184
node tools/sweep.mjs http://localhost:5184   # opens all 118 nodes and every drawer tab
node tools/shoot.mjs http://localhost:5184 shots/
```
