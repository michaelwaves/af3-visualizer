"""Knobs shared by the extraction passes and the payload builders."""

# Pair maps are kept at full token resolution: 199×199 is small enough to ship,
# and the inspector lets people download exactly what they are looking at.
MAP_SIZE = 200
SINGLE_CHANNELS = 128

# Only the heads the scenes actually draw; each full-resolution map is ~250 kB.
ATTENTION_MAPS = 2
NUM_MSA = 64
NUM_TEMPLATES = 2
NUM_SAMPLE_STEPS = 32

# `edm` is the sampler wrapping `diffusion_module`; counting both would
# double-count shared weights, so the census reports the module once.
SHARED_ALIASES = {"edm"}

UNTRAINED_NOTE = (
    "Produced by this repository's model at paper scale with randomly initialised "
    "weights. Shapes, schedules and dynamics are real; the values are not a "
    "trained prediction."
)
