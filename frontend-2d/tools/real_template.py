"""Builds the 108-wide template feature from a real independent H-Ras model."""

from __future__ import annotations

import gzip
import shutil
import tempfile
from pathlib import Path

import numpy as np
import torch

from mmcif import group_into_residues, parse_mmcif_atoms

DISTANCE_BINS = np.linspace(3.25, 50.75, 39)
RESTYPE_WIDTH = 32
FEATURE_WIDTH = 39 + 3 + 1 + 1 + RESTYPE_WIDTH + RESTYPE_WIDTH
AMINO_ACIDS = "ARNDCQEGHILKMFPSTWYV"


def build_template(archive: Path, tokens: int, device: str) -> tuple[torch.Tensor, torch.Tensor]:
    """Encodes one template as AlphaFold 3 encodes it: distogram, direction, types.

    The template is the AlphaFold DB model of H-Ras — a genuinely independent
    structure of the same protein, which is what a template is supposed to be.
    """
    frames, codes = _backbone_frames(archive)
    covered = min(len(frames), tokens)

    features = np.zeros((tokens, tokens, FEATURE_WIDTH), dtype=np.float32)
    positions = np.array([frame[0] for frame in frames[:covered]])
    distances = np.linalg.norm(positions[:, None] - positions[None, :], axis=-1)

    block = features[:covered, :covered]
    block[..., : 39] = np.eye(39, dtype=np.float32)[np.digitize(distances, DISTANCE_BINS) - 1]
    block[..., 39:42] = _unit_vectors(frames[:covered], positions)
    block[..., 42] = 1.0
    block[..., 43] = 1.0
    one_hot = _restype_one_hot(codes[:covered])
    block[..., 44:76] = one_hot[:, None, :]
    block[..., 76:108] = one_hot[None, :, :]

    templates = torch.from_numpy(features)[None, None].to(device)
    mask = torch.ones(1, 1, dtype=torch.bool, device=device)
    return templates, mask


def _backbone_frames(archive: Path) -> tuple[list[tuple[np.ndarray, np.ndarray]], list[str]]:
    """Reads N, CA and C per residue and turns them into orthonormal frames."""
    with tempfile.TemporaryDirectory() as workspace:
        plain = Path(workspace) / "model.cif"
        with gzip.open(archive, "rb") as source, plain.open("wb") as target:
            shutil.copyfileobj(source, target)
        residues = group_into_residues(
            [atom for atom in parse_mmcif_atoms(plain) if not atom.is_hetero]
        )

    frames, codes = [], []
    for residue in residues:
        atoms = {atom.name: np.array(atom.position) for atom in residue.atoms}
        if not {"N", "CA", "C"} <= atoms.keys():
            continue
        frames.append((atoms["CA"], _rotation(atoms["N"], atoms["CA"], atoms["C"])))
        codes.append(residue.code)
    return frames, codes


def _rotation(nitrogen: np.ndarray, alpha: np.ndarray, carbon: np.ndarray) -> np.ndarray:
    """Gram-Schmidt frame from the backbone, as `rigid_from_three_points` builds it."""
    first = _normalise(carbon - alpha)
    projection = nitrogen - alpha
    second = _normalise(projection - first * projection.dot(first))
    return np.stack([first, second, np.cross(first, second)])


def _unit_vectors(frames, positions: np.ndarray) -> np.ndarray:
    """Direction from residue i to residue j, expressed in residue i's own frame."""
    displacement = positions[None, :, :] - positions[:, None, :]
    norms = np.linalg.norm(displacement, axis=-1, keepdims=True)
    directions = displacement / np.clip(norms, 1e-6, None)
    rotations = np.stack([frame[1] for frame in frames])
    return np.einsum("iab,ijb->ija", rotations, directions).astype(np.float32)


def _restype_one_hot(codes: list[str]) -> np.ndarray:
    one_hot = np.zeros((len(codes), RESTYPE_WIDTH), dtype=np.float32)
    for index, code in enumerate(codes):
        position = AMINO_ACIDS.find(code)
        one_hot[index, position if position >= 0 else 20] = 1.0
    return one_hot


def _normalise(vector: np.ndarray) -> np.ndarray:
    return vector / max(float(np.linalg.norm(vector)), 1e-6)
