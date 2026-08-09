"""Reduces real tensors to drawable matrices and to compact wire formats."""

from __future__ import annotations

import base64
from dataclasses import dataclass

import numpy as np
import torch
from torch import Tensor

MAX_SIDE = 256


@dataclass(frozen=True)
class DrawableMap:
    """A 2-D reduction of a tensor, plus the honest description of the squash."""

    matrix: np.ndarray
    reduction: str
    axes: tuple[str, str]


def drawable(tensor: Tensor, kind: str) -> DrawableMap:
    """Collapses any recorded tensor down to the matrix the browser paints."""
    squeezed = tensor.detach().float().cpu()
    if squeezed.ndim >= 1 and squeezed.shape[0] == 1:
        squeezed = squeezed[0]

    if kind == "pair" and squeezed.ndim == 3:
        return DrawableMap(_numpy(squeezed.mean(-1)), f"mean over {squeezed.shape[-1]} channels", ("token j", "token i"))
    if kind == "msa" and squeezed.ndim == 3:
        return DrawableMap(_numpy(squeezed.mean(-1)), f"mean over {squeezed.shape[-1]} channels", ("token", "MSA row"))
    if kind == "coords" and squeezed.ndim == 2 and squeezed.shape[-1] == 3:
        return DrawableMap(_numpy(squeezed), "x, y, z per atom", ("axis", "atom"))
    if squeezed.ndim == 2:
        return DrawableMap(_numpy(squeezed), "no reduction", ("channel", "row"))
    if squeezed.ndim == 3:
        return DrawableMap(_numpy(squeezed.mean(0)), f"mean over leading {squeezed.shape[0]}", ("channel", "row"))
    if squeezed.ndim == 4:
        return DrawableMap(_numpy(squeezed[0].mean(-1)), "index 0, mean over channels", ("j", "i"))
    return DrawableMap(_numpy(squeezed.reshape(1, -1)), "flattened", ("element", ""))


def quantise_map(matrix: np.ndarray) -> dict:
    """Packs a matrix as base64 uint8 plus the true range, for fast painting."""
    low, high = float(np.nanmin(matrix)), float(np.nanmax(matrix))
    span = high - low
    scaled = np.zeros_like(matrix, dtype=np.uint8) if span == 0 else np.clip(
        (matrix - low) / span * 255.0, 0, 255
    ).astype(np.uint8)
    return {
        "rows": int(matrix.shape[0]),
        "cols": int(matrix.shape[1]),
        "min": round(low, 6),
        "max": round(high, 6),
        "data": base64.b64encode(scaled.tobytes()).decode("ascii"),
    }


def statistics(tensor: Tensor) -> dict:
    """Summary of the full tensor, computed before any reduction is applied."""
    values = tensor.detach().float().flatten()
    finite = values[torch.isfinite(values)]
    if finite.numel() == 0:
        return {"min": 0.0, "max": 0.0, "mean": 0.0, "std": 0.0, "elements": int(values.numel())}
    return {
        "min": round(float(finite.min()), 5),
        "max": round(float(finite.max()), 5),
        "mean": round(float(finite.mean()), 5),
        "std": round(float(finite.std()), 5) if finite.numel() > 1 else 0.0,
        "absMean": round(float(finite.abs().mean()), 5),
        "zeroFraction": round(float((finite == 0).float().mean()), 5),
        "elements": int(values.numel()),
    }


def decimate(matrix: np.ndarray, limit: int = MAX_SIDE) -> np.ndarray:
    """Area-averages an oversized matrix so the payload stays small."""
    if max(matrix.shape) <= limit:
        return matrix
    tensor = torch.from_numpy(matrix)[None, None]
    rows = min(matrix.shape[0], limit)
    cols = min(matrix.shape[1], limit)
    return torch.nn.functional.adaptive_avg_pool2d(tensor, (rows, cols))[0, 0].numpy()


def _numpy(tensor: Tensor) -> np.ndarray:
    array = tensor.detach().float().cpu().numpy()
    return array if array.ndim == 2 else array.reshape(1, -1)
