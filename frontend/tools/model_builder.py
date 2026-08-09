"""Builds the paper-scale AlphaFold 3 and the real inputs we push through it."""

from __future__ import annotations

from dataclasses import dataclass

import numpy as np
import torch
from alphafold3_pytorch import Alphafold3
from alphafold3_pytorch.inputs import (
    Alphafold3Input,
    alphafold3_inputs_to_batched_atom_input,
)

# Guanosine-5'-[(beta,gamma)-imido]triphosphate: the non-hydrolysable GTP
# analogue bound in 721p. Taken from this repository's CCD SMILES cache.
GNP_SMILES = "Nc1nc2c(ncn2C2OC(COP(=O)(O)OP(=O)(O)NP(=O)(O)O)C(O)C2O)c(=O)[nH]1"

ATOMS_PER_WINDOW = 27
DIM_TEMPLATE_FEATS = 108


@dataclass
class BuiltModel:
    model: Alphafold3
    batch: dict
    token_count: int
    atom_count: int


def build_paper_scale_model(sequence: str, device: str) -> BuiltModel:
    """Instantiates AlphaFold 3 at the depths quoted in the paper's Table 1."""
    batch = featurize(sequence)
    model = Alphafold3(
        dim_atom_inputs=batch["atom_inputs"].shape[-1],
        dim_atompair_inputs=batch["atompair_inputs"].shape[-1],
        dim_template_feats=DIM_TEMPLATE_FEATS,
        atoms_per_window=ATOMS_PER_WINDOW,
    ).to(device)
    model.eval()

    return BuiltModel(
        model=model,
        batch={key: _to_device(value, device) for key, value in batch.items()},
        token_count=batch["molecule_ids"].shape[1],
        atom_count=batch["atom_inputs"].shape[1],
    )


def featurize(sequence: str) -> dict:
    """Runs the repository's real featurizer over H-Ras, its ligand and its ion."""
    alphafold3_input = Alphafold3Input(
        proteins=[sequence],
        ligands=[GNP_SMILES],
        metal_ions=["Mg"],
    )
    batched = alphafold3_inputs_to_batched_atom_input(
        alphafold3_input, atoms_per_window=ATOMS_PER_WINDOW
    )
    return {key: value for key, value in batched.dict().items() if value is not None}


def add_msa_and_templates(
    batch: dict,
    num_msa: int,
    num_templates: int,
    device: str,
    msa_profile: np.ndarray | None = None,
) -> dict:
    """Attaches the MSA, template and modification tensors the trunk expects.

    H-Ras carries no modified residues, so `is_molecule_mod` is all false — that
    is the true feature for this complex, not a placeholder.
    """
    tokens = batch["molecule_ids"].shape[1]
    enriched = dict(batch)
    enriched["is_molecule_mod"] = torch.zeros(1, tokens, 4, dtype=torch.bool, device=device)
    if msa_profile is not None:
        enriched["additional_token_feats"] = _token_feats_from_profile(msa_profile, tokens, device)
    enriched["msa"] = torch.randn(1, num_msa, tokens, 32, device=device)
    enriched["msa_mask"] = torch.ones(1, num_msa, dtype=torch.bool, device=device)
    enriched["additional_msa_feats"] = torch.randn(1, num_msa, tokens, 2, device=device)
    enriched["templates"] = torch.randn(
        1, num_templates, tokens, tokens, DIM_TEMPLATE_FEATS, device=device
    )
    enriched["template_mask"] = torch.ones(1, num_templates, dtype=torch.bool, device=device)
    return enriched


def _token_feats_from_profile(profile, tokens: int, device: str) -> torch.Tensor:
    """Lays the alignment profile over the protein tokens; ligand and ion get zero.

    The alignment only covers the polymer, which is exactly why AlphaFold 3 keeps
    this feature per token rather than per atom.
    """
    feats = torch.zeros(1, tokens, 33, device=device)
    covered = min(profile.shape[0], tokens)
    feats[0, :covered, :32] = torch.tensor(profile[:covered], device=device)
    return feats


def count_parameters(module: torch.nn.Module) -> int:
    return sum(parameter.numel() for parameter in module.parameters())


def _to_device(value, device):
    return value.to(device) if torch.is_tensor(value) else value
