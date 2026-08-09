"""Shapes the recorded tensors into the JSON payloads each chapter reads."""

from __future__ import annotations

import torch

from capture import Recorder, downsample, to_matrix
from constants import MAP_SIZE, NUM_MSA, NUM_TEMPLATES, SHARED_ALIASES
from model_builder import BuiltModel, count_parameters
from writer import quantise


def model_payload(built: BuiltModel, elapsed: float) -> dict:
    model = built.model
    census = [
        {"name": name, "parameters": count_parameters(child)}
        for name, child in model.named_children()
        if count_parameters(child) and name not in SHARED_ALIASES
    ]
    return {
        "totalParameters": count_parameters(model),
        "modules": sorted(census, key=lambda entry: -entry["parameters"]),
        "dimensions": {
            "single": model.dim_single if hasattr(model, "dim_single") else 384,
            "pairwise": 128,
            "token": 768,
            "atom": 128,
            "atompair": 16,
            "msa": 64,
            "atomsPerWindow": model.atoms_per_window,
        },
        "depths": {
            "pairformer": len(model.pairformer.layers),
            "msaModule": len(model.msa_module.layers),
            "templateEmbedder": len(model.template_embedder.pairformer_stack),
            "diffusionTokenTransformer": len(model.diffusion_module.token_transformer.layers),
            "atomEncoder": len(model.diffusion_module.atom_encoder.layers),
            "atomDecoder": len(model.diffusion_module.atom_decoder.layers),
            "confidencePairformer": len(model.confidence_head.pairformer_stack.layers),
        },
        "input": {
            "tokens": built.token_count,
            "atoms": built.atom_count,
            "msaDepth": NUM_MSA,
            "templates": NUM_TEMPLATES,
            "atomInputDim": built.batch["atom_inputs"].shape[-1],
            "atomPairInputDim": built.batch["atompair_inputs"].shape[-1],
            "windows": built.batch["atompair_inputs"].shape[1],
        },
        "measured": {
            "device": torch.cuda.get_device_name(0) if torch.cuda.is_available() else "cpu",
            "forwardSeconds": round(elapsed, 2),
            "peakMemoryGb": round(torch.cuda.max_memory_allocated() / 1024**3, 2)
            if torch.cuda.is_available()
            else 0.0,
            "moleculeAtomLens": built.batch["molecule_atom_lens"][0].tolist(),
            "isMoleculeTypes": built.batch["is_molecule_types"][0].float().mean(0).tolist(),
        },
    }


def activation_payload(recorder: Recorder, attention: dict) -> dict:
    maps = {
        name: quantise(downsample(torch.tensor(to_matrix(tensor)), MAP_SIZE))
        for name, tensor in recorder.tensors.items()
        if tensor.ndim >= 3 and tensor.shape[1] == tensor.shape[2]
    }
    heads = {
        name: quantise(downsample(tensor[0, 0], MAP_SIZE))
        for name, tensor in list(attention.items())[:4]
    }
    singles = {
        name: quantise(tensor[0, :, :128], 3)
        for name, tensor in recorder.tensors.items()
        if tensor.ndim == 3 and tensor.shape[1] != tensor.shape[2]
    }
    return {
        "size": MAP_SIZE,
        "pairMaps": maps,
        "singleMaps": singles,
        "attentionHeads": heads,
        "shapes": {name: list(tensor.shape) for name, tensor in recorder.tensors.items()},
    }


def feature_payload(built: BuiltModel) -> dict:
    """The real input tensors, so the featurisation chapter draws measured values."""
    batch = built.batch
    windowed = batch["atompair_inputs"][0, 0]
    return {
        "tensors": [
            _feature("atom_inputs", batch["atom_inputs"][0], "[m, dai]", "atom"),
            _feature("atompair_inputs", windowed.reshape(windowed.shape[0], -1),
                     "[nw, w, 2w, dapi] — one window", "atom"),
            _feature("additional_token_feats", batch["additional_token_feats"][0], "[n, dtf]", "single"),
            _feature("additional_molecule_feats", batch["additional_molecule_feats"][0].float(),
                     "[n, 5]", "single"),
            _feature("is_molecule_types", batch["is_molecule_types"][0].float(), "[n, 5]", "msa"),
            _feature("token_bonds", batch["token_bonds"][0].float(), "[n, n]", "pair"),
        ],
        "typeFractions": batch["is_molecule_types"][0].float().mean(0).tolist(),
        "typeNames": ["protein", "RNA", "DNA", "ligand", "metal ion"],
    }


def _feature(name: str, tensor: torch.Tensor, shape: str, role: str) -> dict:
    matrix = tensor.detach().float().cpu()
    rows = min(matrix.shape[0], 128)
    return {
        "name": name,
        "shape": shape,
        "role": role,
        "actualShape": list(tensor.shape),
        "values": quantise(matrix[:rows], 3),
    }
