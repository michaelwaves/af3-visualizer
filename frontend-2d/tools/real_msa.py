"""Builds the MSA tensor AlphaFold 3 consumes out of the real ColabFold a3m."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np
import torch

# 20 amino acids + unknown, 4 RNA + unknown, 4 DNA + unknown, gap: NUM_MSA_ONE_HOT.
MSA_ALPHABET = "ARNDCQEGHILKMFPSTWYVX" + "AUCGX" + "ATCGX" + "-"
GAP_INDEX = MSA_ALPHABET.index("-")
UNKNOWN_INDEX = MSA_ALPHABET.index("X")


@dataclass(frozen=True)
class AlignmentTensors:
    """The one-hot alignment plus the two per-pair meta features from the paper."""

    one_hot: torch.Tensor
    additional: torch.Tensor
    mask: torch.Tensor
    depth_used: int
    depth_total: int


def build_alignment(a3m: Path, tokens: int, depth: int, device: str) -> AlignmentTensors:
    """Encodes the top `depth` alignment rows over the protein tokens.

    Rows are the real homologs ColabFold found. Ligand and ion tokens carry no
    alignment, so they stay at the gap symbol — which is the true feature.
    """
    sequences, deletions = read_a3m(a3m)
    chosen = sequences[:depth]
    chosen_deletions = deletions[:depth]

    indices = np.full((depth, tokens), GAP_INDEX, dtype=np.int64)
    deletion_counts = np.zeros((depth, tokens), dtype=np.float32)
    for row, (sequence, gaps) in enumerate(zip(chosen, chosen_deletions)):
        width = min(len(sequence), tokens)
        indices[row, :width] = [_encode(character) for character in sequence[:width]]
        deletion_counts[row, :width] = gaps[:width]

    one_hot = torch.zeros(1, depth, tokens, len(MSA_ALPHABET), device=device)
    one_hot.scatter_(3, torch.from_numpy(indices).to(device)[None, ..., None], 1.0)

    has_deletion = torch.from_numpy((deletion_counts > 0).astype(np.float32)).to(device)
    deletion_value = torch.from_numpy(np.arctan(deletion_counts / 3.0) * (2 / np.pi)).to(device)
    additional = torch.stack([has_deletion, deletion_value], dim=-1)[None]

    return AlignmentTensors(
        one_hot=one_hot,
        additional=additional,
        mask=torch.ones(1, depth, dtype=torch.bool, device=device),
        depth_used=len(chosen),
        depth_total=len(sequences),
    )


def read_a3m(path: Path) -> tuple[list[str], list[list[int]]]:
    """Reads a3m records, converting lowercase insertions into deletion counts."""
    sequences: list[str] = []
    deletions: list[list[int]] = []
    for record in _records(path.read_text().splitlines()):
        aligned, gaps, pending = [], [], 0
        for character in record:
            if character.islower():
                pending += 1
                continue
            aligned.append(character.upper())
            gaps.append(pending)
            pending = 0
        sequences.append("".join(aligned))
        deletions.append(gaps)
    return sequences, deletions


def _records(lines: list[str]):
    chunks: list[str] = []
    started = False
    for line in lines:
        if line.startswith(">"):
            if started:
                yield "".join(chunks)
            chunks, started = [], True
        elif line.strip():
            chunks.append(line.strip())
    if started:
        yield "".join(chunks)


def _encode(character: str) -> int:
    if character == "-":
        return GAP_INDEX
    position = MSA_ALPHABET[:20].find(character)
    return position if position >= 0 else UNKNOWN_INDEX
