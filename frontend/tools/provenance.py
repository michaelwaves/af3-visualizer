"""Records how each drawn matrix was reduced from its full tensor."""

from __future__ import annotations

import torch

from capture import Recorder, statistics
from constants import MAP_SIZE, SINGLE_CHANNELS


def tensor_provenance(
    name: str, tensor: torch.Tensor, drawn: torch.Tensor, recorder: Recorder, is_pair: bool
) -> dict:
    source = recorder.sources.get(name)
    channels = tensor.shape[-1]
    reductions = []
    if is_pair:
        reductions.append(f"mean over {channels} channels")
        if tensor.shape[1] > MAP_SIZE:
            reductions.append(f"average-pooled {tensor.shape[1]}→{drawn.shape[-1]}")
    else:
        reductions.append(f"first {min(channels, SINGLE_CHANNELS)} of {channels} channels")

    return {
        "kind": "pair" if is_pair else "single",
        "module": source.module if source else None,
        "qualifiedName": source.qualified_name if source else None,
        "algorithm": source.algorithm if source else None,
        "fullShape": list(tensor.shape),
        "drawnShape": list(drawn.shape),
        "reduction": " · ".join(reductions),
        "statistics": statistics(tensor),
        # Relative positions are a one-hot of the input pushed through a linear
        # map: the banding is structural, so it survives whatever the weights are.
        "dependsOnWeights": name != "relative_position_encoding",
    }


def attention_provenance(name: str, tensor: torch.Tensor, drawn: torch.Tensor) -> dict:
    return {
        "kind": "attention",
        "module": "Attend",
        "qualifiedName": "alphafold3_pytorch.attention.Attend",
        "algorithm": "softmax(qk/√d + pair bias)",
        "fullShape": list(tensor.shape),
        "drawnShape": list(drawn.shape),
        "reduction": f"batch 0, head 0 of {tensor.shape[1]}"
        + (f" · average-pooled {tensor.shape[-1]}→{drawn.shape[-1]}"
           if tensor.shape[-1] > MAP_SIZE else ""),
        "statistics": statistics(tensor),
        "dependsOnWeights": True,
        "note": f"captured as row {name.split('_')[-1]} of the softmax calls in this pass",
    }
