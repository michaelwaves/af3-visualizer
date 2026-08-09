"""A deliberately small PDBx reader — the explainer only ever needs `_atom_site`."""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path

import numpy as np

THREE_TO_ONE = {
    "ALA": "A", "ARG": "R", "ASN": "N", "ASP": "D", "CYS": "C", "GLN": "Q",
    "GLU": "E", "GLY": "G", "HIS": "H", "ILE": "I", "LEU": "L", "LYS": "K",
    "MET": "M", "PHE": "F", "PRO": "P", "SER": "S", "THR": "T", "TRP": "W",
    "TYR": "Y", "VAL": "V",
}

METAL_ELEMENTS = {"MG", "ZN", "CA", "FE", "MN", "NA", "K", "CU", "CO", "NI"}


@dataclass
class Atom:
    element: str
    name: str
    residue: str
    residue_index: int
    chain: str
    is_hetero: bool
    position: tuple[float, float, float]
    b_factor: float


@dataclass
class Residue:
    name: str
    code: str
    index: int
    atoms: list[Atom] = field(default_factory=list)

    @property
    def alpha_carbon(self) -> np.ndarray:
        for atom in self.atoms:
            if atom.name == "CA":
                return np.array(atom.position)
        return np.mean([atom.position for atom in self.atoms], axis=0)


def parse_mmcif_atoms(path: Path) -> list[Atom]:
    columns: list[str] = []
    atoms: list[Atom] = []

    for line in path.read_text().splitlines():
        if line.startswith("_atom_site."):
            columns.append(line.strip().split(".", 1)[1])
        elif line.startswith(("ATOM", "HETATM")):
            row = dict(zip(columns, line.split()))
            atoms.append(
                Atom(
                    element=row["type_symbol"],
                    name=row["label_atom_id"],
                    residue=row["label_comp_id"],
                    residue_index=int(row["auth_seq_id"]),
                    chain=row["auth_asym_id"],
                    is_hetero=line.startswith("HETATM"),
                    position=(
                        float(row["Cartn_x"]),
                        float(row["Cartn_y"]),
                        float(row["Cartn_z"]),
                    ),
                    b_factor=float(row["B_iso_or_equiv"]),
                )
            )
    return atoms


def group_into_residues(atoms: list[Atom]) -> list[Residue]:
    """Keys on chain as well as index, so a dimer does not collapse into one chain."""
    residues: dict[tuple[str, int], Residue] = {}
    for atom in atoms:
        residue = residues.setdefault(
            (atom.chain, atom.residue_index),
            Residue(atom.residue, THREE_TO_ONE.get(atom.residue, "X"), atom.residue_index),
        )
        residue.atoms.append(atom)
    return [residues[key] for key in sorted(residues)]


def centred_alpha_carbons(residues: list[Residue]) -> np.ndarray:
    coordinates = np.array([residue.alpha_carbon for residue in residues])
    return coordinates - coordinates.mean(axis=0)
