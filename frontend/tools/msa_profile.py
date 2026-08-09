"""Per-column alignment statistics AlphaFold 3 feeds in as token features."""

from __future__ import annotations

from pathlib import Path

import numpy as np

from msa_extractor import MSA_ALPHABET, _strip_insertions, read_a3m


def column_profile(path: Path, width: int = 32) -> np.ndarray:
    """Per-column residue frequencies — the `profile` AlphaFold 3 feeds per token.

    This is the real 32-wide distribution over the whole alignment, not a stand-in.
    """
    rows = read_a3m(path)
    matrix = np.array([list(row.sequence) for row in rows])
    profile = np.zeros((matrix.shape[1], width), dtype=np.float32)

    for column in range(matrix.shape[1]):
        for index, residue in enumerate(MSA_ALPHABET[:width]):
            profile[column, index] = (matrix[:, column] == residue).mean()
    return profile


def column_deletion_mean(path: Path) -> np.ndarray:
    """Mean lowercase-insertion count per column, the other token-level MSA feature."""
    text = path.read_text().splitlines()
    width = len(_strip_insertions("".join(_first_record(text))))
    totals = np.zeros(width, dtype=np.float32)
    count = 0

    for chunks in _records(text):
        sequence = "".join(chunks)
        deletions, column = np.zeros(width, dtype=np.float32), 0
        for character in sequence:
            if character.islower():
                if column < width:
                    deletions[column] += 1
            elif column < width:
                column += 1
        totals += deletions
        count += 1
    return totals / max(count, 1)


def _records(lines: list[str]):
    chunks: list[str] = []
    started = False
    for line in lines:
        if line.startswith(">"):
            if started:
                yield chunks
            chunks, started = [], True
        elif line:
            chunks.append(line.strip())
    if started:
        yield chunks


def _first_record(lines: list[str]) -> list[str]:
    return next(_records(lines))
