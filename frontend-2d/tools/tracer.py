"""Records the real inputs and outputs of every watched module."""

from __future__ import annotations

from dataclasses import dataclass, field

import torch
from torch import Tensor, nn

from tensor_maps import statistics
from watchlist import Watchpoint


@dataclass
class Binding:
    """One argument or return value of a watched call, described honestly."""

    name: str
    shape: list[int]
    dtype: str
    stats: dict | None


@dataclass
class Observation:
    """Everything the debugger knows about one module's first invocation."""

    id: str
    module: str
    qualified_name: str
    path: str
    algorithm: str | None
    kind: str
    inputs: list[Binding]
    outputs: list[Binding]
    calls: int
    parameters: int
    tensor: Tensor | None


@dataclass
class Tracer:
    """Attaches forward hooks and keeps the first call of each watchpoint."""

    observations: dict[str, Observation] = field(default_factory=dict)
    handles: list = field(default_factory=list)
    counts: dict[str, int] = field(default_factory=dict)

    def attach(self, model: nn.Module, watchpoints) -> list[str]:
        """Hooks every watchpoint that resolves, returning the ones that did not."""
        missing = []
        for point in watchpoints:
            try:
                module = model.get_submodule(point.path)
            except AttributeError:
                missing.append(point.path)
                continue
            self.handles.append(
                module.register_forward_hook(self._make_hook(point, module), with_kwargs=True)
            )
        return missing

    def release(self) -> None:
        for handle in self.handles:
            handle.remove()
        self.handles.clear()

    def _make_hook(self, point: Watchpoint, module: nn.Module):
        parameters = sum(p.numel() for p in module.parameters())

        def hook(_module, args, kwargs, output):
            self.counts[point.id] = self.counts.get(point.id, 0) + 1
            if point.id in self.observations:
                self.observations[point.id].calls = self.counts[point.id]
                return
            self.observations[point.id] = Observation(
                id=point.id,
                module=type(module).__name__,
                qualified_name=f"{type(module).__module__}.{type(module).__name__}",
                path=point.path,
                algorithm=point.algorithm,
                kind=point.kind,
                inputs=_bindings(args, kwargs),
                outputs=[_describe(name, value) for name, value in _named_outputs(output)],
                calls=self.counts[point.id],
                parameters=parameters,
                tensor=_primary(output),
            )

        return hook


def _bindings(args, kwargs) -> list[Binding]:
    named = [(f"arg{index}", value) for index, value in enumerate(args)]
    named += list(kwargs.items())
    return [_describe(name, value) for name, value in named if _worth_showing(value)]


def _describe(name: str, value) -> Binding:
    if torch.is_tensor(value):
        floating = value.is_floating_point()
        return Binding(
            name=name,
            shape=list(value.shape),
            dtype=str(value.dtype).replace("torch.", ""),
            stats=statistics(value) if floating else None,
        )
    return Binding(name=name, shape=[], dtype=type(value).__name__, stats=None)


def _worth_showing(value) -> bool:
    return torch.is_tensor(value) or isinstance(value, (int, float, bool))


def _named_outputs(output) -> list[tuple[str, object]]:
    """Keeps the real field names of NamedTuple returns like ConfidenceHeadLogits."""
    if hasattr(output, "_asdict"):
        return list(output._asdict().items())
    if isinstance(output, tuple):
        return [(f"out{index}", value) for index, value in enumerate(output)]
    return [("return", output)]


def _as_tuple(output):
    return tuple(value for _, value in _named_outputs(output))


def _primary(output) -> Tensor | None:
    for candidate in _as_tuple(output):
        if torch.is_tensor(candidate) and candidate.is_floating_point() and candidate.ndim >= 2:
            return candidate.detach().float().cpu()
    return None
