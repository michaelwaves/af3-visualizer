"""Writes the sampled coordinates out as files you can open in a viewer."""

from __future__ import annotations

from pathlib import Path

import torch

HEADER = """data_AF3_PYTORCH_PREDICTION
#
_struct.title  '{title}'
_audit_conform.dict_name  mmcif_pdbx.dic
#
loop_
_atom_site.group_PDB
_atom_site.id
_atom_site.type_symbol
_atom_site.label_atom_id
_atom_site.label_comp_id
_atom_site.label_asym_id
_atom_site.label_seq_id
_atom_site.pdbx_PDB_ins_code
_atom_site.Cartn_x
_atom_site.Cartn_y
_atom_site.Cartn_z
_atom_site.occupancy
_atom_site.B_iso_or_equiv
_atom_site.auth_seq_id
_atom_site.auth_comp_id
_atom_site.auth_asym_id
_atom_site.auth_atom_id
_atom_site.pdbx_PDB_model_num
"""


def write_prediction(
    path: Path,
    positions: torch.Tensor,
    atoms: list[dict],
    plddt: list[float],
    title: str,
) -> Path:
    """Writes an mmCIF whose B-factor column carries per-atom pLDDT, as AlphaFold does."""
    rows = [HEADER.format(title=title)]

    for index, atom in enumerate(atoms):
        x, y, z = (float(value) for value in positions[index])
        # Both label_* and auth_* are written: most viewers key off auth_*, and
        # omitting them makes the file unreadable to standard mmCIF parsers.
        rows.append(
            f"{atom['group']:<6} {index + 1:<6} {atom['element']:<2} {atom['name']:<5} "
            f"{atom['residue']:<3} {atom['chain']:<2} {atom['residueIndex']:<5} . "
            f"{x:8.3f} {y:8.3f} {z:8.3f} 1.00 {plddt[index]:6.2f} "
            f"{atom['residueIndex']:<5} {atom['residue']:<3} {atom['chain']:<2} "
            f"{atom['name']:<5} 1"
        )

    rows.append("#")
    path.write_text("\n".join(rows) + "\n")
    return path


def write_pdb(
    path: Path,
    positions: torch.Tensor,
    atoms: list[dict],
    plddt: list[float],
) -> Path:
    """The same coordinates in PDB format, for tools that still prefer it."""
    lines = []

    for index, atom in enumerate(atoms):
        x, y, z = (float(value) for value in positions[index])
        record = "HETATM" if atom["group"] == "HETATM" else "ATOM"
        lines.append(
            f"{record:<6}{index + 1:>5} {atom['name']:<4}{atom['residue']:>4} "
            f"{atom['chain']}{atom['residueIndex']:>4}    "
            f"{x:8.3f}{y:8.3f}{z:8.3f}{1.0:6.2f}{plddt[index]:6.2f}"
            f"{atom['element']:>12}"
        )

    lines.append("END")
    path.write_text("\n".join(lines) + "\n")
    return path
