"""Builds a real template: an independent H-Ras structure, binned as AF3 bins it."""

from __future__ import annotations

import gzip
import shutil
import tempfile
from pathlib import Path

import numpy as np

from mmcif import centred_alpha_carbons, group_into_residues, parse_mmcif_atoms
from settings import ExtractionSettings
from writer import quantise, write_json

# template_parsing.py bins template distances into 39 bins over this range.
DISTANCE_BINS = np.linspace(3.25, 50.75, 39)

FEATURE_BREAKDOWN = [
    {"name": "template_distogram", "width": 39, "note": "39 bins, 3.25–50.75 Å"},
    {"name": "template_unit_vector", "width": 3, "note": "direction in residue i's frame"},
    {"name": "template_pseudo_beta_mask", "width": 1, "note": "is the β-carbon resolved?"},
    {"name": "template_backbone_frame_mask", "width": 1, "note": "is the N–CA–C frame intact?"},
    {"name": "template_restype (i)", "width": 32, "note": "one-hot residue identity"},
    {"name": "template_restype (j)", "width": 32, "note": "one-hot residue identity"},
]


def extract_template(settings: ExtractionSettings, target_sequence: str) -> Path:
    """Compares the AlphaFold DB model of H-Ras against the crystal structure."""
    template = _alphafold_db_backbone(settings)
    target = _crystal_backbone(settings)
    shared = min(len(template), len(target), len(target_sequence))

    template_distances = _pairwise_distances(template[:shared])
    target_distances = _pairwise_distances(target[:shared])

    payload = {
        "source": "AlphaFold DB AF-P01112-F1 (H-Ras) — an independent model of the same protein",
        "residues": shared,
        "bins": quantise(DISTANCE_BINS, 2),
        "binCount": len(DISTANCE_BINS),
        "featureWidth": sum(entry["width"] for entry in FEATURE_BREAKDOWN),
        "features": FEATURE_BREAKDOWN,
        "templateDistances": quantise(template_distances, 1),
        "targetDistances": quantise(target_distances, 1),
        "binnedTemplate": np.digitize(template_distances, DISTANCE_BINS).tolist(),
        "agreement": round(float(np.mean(np.abs(template_distances - target_distances))), 2),
        "backbone": quantise(template[:shared], 2),
    }
    return write_json(settings.target("template"), payload)


def _alphafold_db_backbone(settings: ExtractionSettings) -> np.ndarray:
    archive = settings.repo_root / "data/test/afdb_data/mmcifs/P01112/AF-P01112-F1-model_v4.cif.gz"
    with tempfile.TemporaryDirectory() as workspace:
        plain = Path(workspace) / "model.cif"
        with gzip.open(archive, "rb") as source, plain.open("wb") as target:
            shutil.copyfileobj(source, target)
        residues = group_into_residues(
            [atom for atom in parse_mmcif_atoms(plain) if not atom.is_hetero]
        )
    return centred_alpha_carbons(residues)


def _crystal_backbone(settings: ExtractionSettings, chain: str = "A") -> np.ndarray:
    residues = group_into_residues(
        [
            atom
            for atom in parse_mmcif_atoms(settings.structure_cif)
            if not atom.is_hetero and atom.chain == chain
        ]
    )
    return centred_alpha_carbons(residues)


def _pairwise_distances(coordinates: np.ndarray) -> np.ndarray:
    difference = coordinates[:, None, :] - coordinates[None, :, :]
    return np.sqrt((difference**2).sum(-1))
