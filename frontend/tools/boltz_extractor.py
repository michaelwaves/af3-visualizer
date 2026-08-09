"""Imports a real fold from Boltz-2, an open-weight model of the same family.

This repository's AlphaFold 3 has no trained weights, so nothing here can show
what a *folded* prediction looks like. Boltz-2 is MIT-licensed with downloadable
weights and takes the same input — sequence, SMILES, ion — so it stands in for
the trained article, clearly labelled as a different model.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

import numpy as np

from mmcif import centred_alpha_carbons, group_into_residues, parse_mmcif_atoms
from settings import ExtractionSettings
from writer import quantise, write_json

MODEL = {
    "name": "Boltz-2",
    "licence": "MIT",
    "href": "https://github.com/jwohlwend/boltz",
    "note": "an open-weight AlphaFold 3-class model, not this repository's implementation",
}


def extract_boltz(settings: ExtractionSettings, prediction_dir: Path) -> Path | None:
    """Reads the prediction and its confidence files; returns None if absent."""
    structure = next(prediction_dir.glob("*_model_0.cif"), None)
    if structure is None:
        return None

    atoms = parse_mmcif_atoms(structure)
    residues = group_into_residues([a for a in atoms if a.chain == "A" and not a.is_hetero])
    backbone = centred_alpha_carbons(residues)
    centre = np.mean([a.position for a in atoms], axis=0)

    confidence = json.loads((prediction_dir / f"confidence_{structure.stem}.json").read_text())
    plddt = np.load(prediction_dir / f"plddt_{structure.stem}.npz")["plddt"] * 100
    pae = np.load(prediction_dir / f"pae_{structure.stem}.npz")["pae"]

    raw_dir = settings.output_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)
    shutil.copy(structure, raw_dir / "boltz_prediction.cif")

    payload = {
        "model": MODEL,
        "backbone": quantise(backbone, 2),
        "residuePlddt": quantise(plddt[: len(residues)], 1),
        "tokenPlddt": quantise(plddt, 1),
        "pae": quantise(pae, 2),
        "ligands": _hetero_payload(atoms, centre),
        "rmsdToCrystal": _rmsd_to_crystal(backbone, settings),
        "confidence": {
            "score": round(confidence["confidence_score"], 3),
            "ptm": round(confidence["ptm"], 3),
            "iptm": round(confidence["iptm"], 3),
            "complexPlddt": round(confidence["complex_plddt"] * 100, 1),
        },
        "counts": {"atoms": len(atoms), "residues": len(residues), "tokens": int(plddt.shape[0])},
    }
    return write_json(settings.target("boltz"), payload)


def _hetero_payload(atoms, centre) -> list[dict]:
    groups: dict[str, list] = {}
    for atom in atoms:
        if atom.is_hetero or atom.chain in {"B", "C"}:
            groups.setdefault(atom.residue, []).append(atom)

    return [
        {
            "code": code,
            "kind": "metal ion" if len(members) == 1 else "ligand",
            "element": [a.element for a in members],
            "position": quantise([np.array(a.position) - centre for a in members], 2),
        }
        for code, members in groups.items()
    ]


def _rmsd_to_crystal(backbone: np.ndarray, settings: ExtractionSettings) -> float:
    """Kabsch-aligned CA RMSD — the honest measure of whether it got the fold."""
    crystal = group_into_residues(
        [
            atom
            for atom in parse_mmcif_atoms(settings.structure_cif)
            if not atom.is_hetero and atom.chain == "A"
        ]
    )
    target = centred_alpha_carbons(crystal)
    count = min(len(backbone), len(target))
    moving, fixed = backbone[:count], target[:count]

    u, _, vt = np.linalg.svd(moving.T @ fixed)
    flip = np.sign(np.linalg.det(vt.T @ u.T))
    rotation = vt.T @ np.diag([1.0, 1.0, flip]) @ u.T
    return round(float(np.sqrt(((moving @ rotation.T - fixed) ** 2).sum(1).mean())), 2)
