"""Compact JSON output, so the browser downloads numbers rather than prose."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import numpy as np


def write_json(path: Path, payload: dict[str, Any], decimals: int = 3) -> Path:
    """Writes a payload, rounding floats so coordinate dumps stay small."""
    path.write_text(json.dumps(_compact(payload, decimals), separators=(",", ":")))
    return path


def _compact(value: Any, decimals: int) -> Any:
    if isinstance(value, dict):
        return {key: _compact(item, decimals) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_compact(item, decimals) for item in value]
    if isinstance(value, np.ndarray):
        return _compact(value.tolist(), decimals)
    if isinstance(value, (np.floating, float)):
        return round(float(value), decimals)
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.bool_,)):
        return bool(value)
    return value


def quantise(array: np.ndarray, decimals: int = 3) -> list:
    """Flattens an array to a rounded nested list ready for JSON."""
    return np.round(np.asarray(array, dtype=np.float64), decimals).tolist()
