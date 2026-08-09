"""Reads the real H-Ras assembly out of its mmCIF into browser-ready arrays."""

from __future__ import annotations

from pathlib import Path

import numpy as np

from mmcif import METAL_ELEMENTS, Atom, Residue, group_into_residues, parse_mmcif_atoms
from settings import ExtractionSettings
from writer import quantise, write_json


def extract_structure(settings: ExtractionSettings, chain: str = "A") -> Path:
    """Writes coordinates, per-residue atom counts and the ligand/ion entities.

    Assembly 1 of 721p is a dimer. We keep a single chain so the structure shown
    matches the monomer-plus-ligand complex the featuriser is given.
    """
    atoms = [atom for atom in parse_mmcif_atoms(settings.structure_cif) if atom.chain == chain]
    residues = group_into_residues([atom for atom in atoms if not atom.is_hetero])
    hetero = [atom for atom in atoms if atom.is_hetero]
    centre = np.mean([atom.position for atom in atoms], axis=0)

    payload = {
        "name": "721p — H-Ras P21 catalytic domain",
        "source": f"RCSB 721p, assembly 1, chain {chain} (shipped in this repository)",
        "chain": chain,
        "sequence": "".join(residue.code for residue in residues),
        "residues": [_residue_payload(residue, centre) for residue in residues],
        "backbone": quantise([residue.alpha_carbon - centre for residue in residues]),
        "atoms": _atom_payload(atoms, centre),
        "ligands": _ligand_payload(hetero, centre),
        "counts": {
            "residues": len(residues),
            "proteinAtoms": sum(len(residue.atoms) for residue in residues),
            "heteroAtoms": len(hetero),
            "totalAtoms": len(atoms),
        },
    }
    return write_json(settings.target("structure"), payload)


def _residue_payload(residue: Residue, centre: np.ndarray) -> dict:
    return {
        "code": residue.code,
        "name": residue.name,
        "index": residue.index,
        "atomCount": len(residue.atoms),
        "ca": quantise(residue.alpha_carbon - centre),
        "bFactor": round(float(np.mean([atom.b_factor for atom in residue.atoms])), 2),
    }


def _atom_payload(atoms: list[Atom], centre: np.ndarray) -> dict:
    return {
        "element": [atom.element for atom in atoms],
        "position": quantise([np.array(atom.position) - centre for atom in atoms], 2),
        "residueIndex": [atom.residue_index for atom in atoms],
        "isHetero": [atom.is_hetero for atom in atoms],
    }


def _ligand_payload(hetero: list[Atom], centre: np.ndarray) -> list[dict]:
    """One entry per hetero *residue instance*, so two ions stay two ions."""
    groups: dict[tuple[str, int], list[Atom]] = {}
    for atom in hetero:
        groups.setdefault((atom.residue, atom.residue_index), []).append(atom)

    return [
        {
            "code": code,
            "residueIndex": index,
            "kind": "metal ion" if code.upper() in METAL_ELEMENTS else "ligand",
            "atomCount": len(members),
            "element": [atom.element for atom in members],
            "atomName": [atom.name for atom in members],
            "position": quantise([np.array(atom.position) - centre for atom in members], 2),
        }
        for (code, index), members in sorted(groups.items(), key=lambda item: item[0][1])
    ]
