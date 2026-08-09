"""Knobs shared by the extraction passes and the payload builders."""

MAP_SIZE = 96
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
