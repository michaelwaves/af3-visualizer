"""Turns recorded observations into the JSON the walkthrough loads."""

from __future__ import annotations

from dataclasses import asdict
from pathlib import Path

from tensor_maps import decimate, drawable, quantise_map
from tracer import Observation
from writer import write_json

FULL_PRECISION_LIMIT = 512 * 512


def write_trace(directory: Path, meta: dict, observations: dict[str, Observation]) -> list[Path]:
    """Writes the step table, the paintable maps and the downloadable tensors."""
    directory.mkdir(parents=True, exist_ok=True)
    tensors = directory / "tensors"
    tensors.mkdir(exist_ok=True)

    steps, maps, written = [], {}, []
    for observation in observations.values():
        steps.append(_step(observation))
        if observation.tensor is None:
            continue
        reduced = drawable(observation.tensor, observation.kind)
        maps[observation.id] = {
            **quantise_map(decimate(reduced.matrix)),
            "reduction": reduced.reduction,
            "axes": list(reduced.axes),
            "fullShape": list(observation.tensor.shape),
        }
        written.append(_write_tensor(tensors, observation, reduced.matrix))

    return [
        write_json(directory / "trace.json", {"meta": meta, "steps": steps}),
        write_json(directory / "maps.json", maps),
        *written,
    ]


def _step(observation: Observation) -> dict:
    return {
        "id": observation.id,
        "module": observation.module,
        "qualifiedName": observation.qualified_name,
        "path": observation.path,
        "algorithm": observation.algorithm,
        "kind": observation.kind,
        "calls": observation.calls,
        "parameters": observation.parameters,
        "inputs": [asdict(binding) for binding in observation.inputs],
        "outputs": [asdict(binding) for binding in observation.outputs],
    }


def _write_tensor(directory: Path, observation: Observation, matrix) -> Path:
    """Ships the reduced matrix at full precision so people can download numbers."""
    payload = {
        "id": observation.id,
        "module": observation.module,
        "fullShape": list(observation.tensor.shape),
        "matrixShape": list(matrix.shape),
        "values": decimate(matrix, 512).round(5).tolist(),
    }
    return write_json(directory / f"{observation.id}.json", payload, decimals=5)
