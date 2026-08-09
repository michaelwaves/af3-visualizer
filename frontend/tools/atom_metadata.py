"""Names every predicted atom, so the exported structure opens in a real viewer."""

from __future__ import annotations

from alphafold3_pytorch.common.biomolecule import get_residue_constants
from alphafold3_pytorch.inputs import IS_PROTEIN
from rdkit import Chem

THREE_LETTER = {
    "A": "ALA", "R": "ARG", "N": "ASN", "D": "ASP", "C": "CYS", "Q": "GLN",
    "E": "GLU", "G": "GLY", "H": "HIS", "I": "ILE", "L": "LEU", "K": "LYS",
    "M": "MET", "F": "PHE", "P": "PRO", "S": "SER", "T": "THR", "W": "TRP",
    "Y": "TYR", "V": "VAL",
}


def build_atom_metadata(
    sequence: str, ligand_smiles: str, ion: str, molecule_atom_lens: list[int]
) -> list[dict]:
    """One record per atom, in the exact order the featuriser emits them.

    Protein atom names come from the same residue constants the repository uses
    when it writes structures; any residue whose atom count disagrees falls back
    to generic names rather than mislabelling it.
    """
    atoms: list[dict] = []
    constants = get_residue_constants(res_chem_index=IS_PROTEIN)

    for index, code in enumerate(sequence):
        residue = THREE_LETTER.get(code, "UNK")
        expected = molecule_atom_lens[index]
        names = [name for name in constants.restype_name_to_compact_atom_names[residue] if name]
        if len(names) != expected:
            names = [f"X{position + 1}" for position in range(expected)]
        for name in names:
            atoms.append(_record("ATOM", name[0], name, residue, "A", index + 1))

    atoms += _ligand_atoms(ligand_smiles, start_index=len(sequence) + 1)
    atoms.append(_record("HETATM", ion.upper(), ion.upper(), ion.upper(), "C", 1))
    return atoms


def _ligand_atoms(smiles: str, start_index: int) -> list[dict]:
    """Heavy atoms in RDKit order — the order the featuriser walks the molecule."""
    molecule = Chem.MolFromSmiles(smiles)
    counts: dict[str, int] = {}
    records = []

    for atom in molecule.GetAtoms():
        element = atom.GetSymbol()
        counts[element] = counts.get(element, 0) + 1
        records.append(
            _record("HETATM", element, f"{element}{counts[element]}", "GNP", "B", start_index)
        )
    return records


def _record(group: str, element: str, name: str, residue: str, chain: str, index: int) -> dict:
    return {
        "group": group,
        "element": element,
        "name": name,
        "residue": residue,
        "chain": chain,
        "residueIndex": index,
    }
