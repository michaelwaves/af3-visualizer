"""Records what real tensors flow through a real forward pass."""

from __future__ import annotations

from contextlib import contextmanager
from dataclasses import dataclass, field

import torch
from torch import Tensor, nn


@dataclass
class Source:
    """Where a recorded tensor came from, so the viewer can be told honestly."""

    module: str
    qualified_name: str
    algorithm: str | None = None


@dataclass
class Recorder:
    """Collects module outputs by name, keeping only the first hit for each."""

    tensors: dict[str, Tensor] = field(default_factory=dict)
    sources: dict[str, Source] = field(default_factory=dict)
    handles: list = field(default_factory=list)

    def watch(self, name: str, module: nn.Module, algorithm: str | None = None) -> None:
        self.sources[name] = Source(
            module=type(module).__name__,
            qualified_name=f"{type(module).__module__}.{type(module).__name__}",
            algorithm=algorithm,
        )

        def hook(_module, _inputs, output):
            tensor = output[0] if isinstance(output, tuple) else output
            if torch.is_tensor(tensor) and name not in self.tensors:
                self.tensors[name] = tensor.detach().float().cpu()

        self.handles.append(module.register_forward_hook(hook))

    def release(self) -> None:
        for handle in self.handles:
            handle.remove()
        self.handles.clear()

    def __getitem__(self, name: str) -> Tensor:
        return self.tensors[name]


@contextmanager
def capture_attention(store: dict[str, Tensor], limit: int = 8):
    """Intercepts softmax so we record true attention probabilities, not proxies.

    The implementation calls `sim.softmax(dim = -1)` inside `Attend`, so there is
    no module output to hook — patching the tensor method is the only way to see
    the real distribution rather than recomputing it and hoping we match.
    """
    original = Tensor.softmax
    seen = {"count": 0}

    def recording_softmax(self, *args, **kwargs):
        result = original(self, *args, **kwargs)
        if result.ndim == 4 and seen["count"] < limit:
            store[f"attention_{seen['count']}"] = result.detach().float().cpu()
            seen["count"] += 1
        return result

    Tensor.softmax = recording_softmax
    try:
        yield store
    finally:
        Tensor.softmax = original


def to_matrix(tensor: Tensor, reduce_channels: str = "mean") -> list[list[float]]:
    """Collapses a [..., i, j, c] tensor down to the i×j matrix we can draw."""
    squeezed = tensor.squeeze(0)
    if squeezed.ndim == 3:
        squeezed = squeezed.mean(-1) if reduce_channels == "mean" else squeezed.norm(dim=-1)
    return squeezed.tolist()


def downsample(matrix: Tensor, size: int) -> Tensor:
    """Area-averages a square matrix so large maps stay small over the wire."""
    if matrix.shape[-1] <= size:
        return matrix
    return torch.nn.functional.adaptive_avg_pool2d(matrix[None, None], size)[0, 0]


def statistics(tensor: Tensor) -> dict:
    """Summary of the *full* tensor, before any reduction the viewer will see."""
    values = tensor.flatten()
    return {
        "min": round(float(values.min()), 4),
        "max": round(float(values.max()), 4),
        "mean": round(float(values.mean()), 4),
        "std": round(float(values.std()), 4),
        "elements": int(values.numel()),
    }
