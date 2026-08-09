"""Runs the real model on the real complex and records what actually happens."""

from __future__ import annotations

import time
from pathlib import Path

import torch

from capture import Recorder, capture_attention
from model_builder import BuiltModel, add_msa_and_templates, build_paper_scale_model
from atom_metadata import build_atom_metadata
from constants import NUM_MSA, NUM_SAMPLE_STEPS, NUM_TEMPLATES
from model_builder import GNP_SMILES
from structure_export import write_pdb, write_prediction
from output_payloads import _expected_plddt, diffusion_payload, prediction_payload
from payloads import activation_payload, feature_payload, model_payload
from settings import ExtractionSettings
from writer import write_json


def extract_model(settings: ExtractionSettings, sequence: str, msa_profile=None) -> list[Path]:
    """Writes the parameter census, measured shapes and real intermediate maps."""
    torch.manual_seed(settings.seed)
    built = build_paper_scale_model(sequence, settings.device)
    batch = add_msa_and_templates(
        built.batch, NUM_MSA, NUM_TEMPLATES, settings.device, msa_profile
    )
    built.batch.update(batch)

    recorder = _watch_trunk(built)
    attention: dict[str, torch.Tensor] = {}

    started = time.perf_counter()
    with torch.no_grad(), capture_attention(attention):
        _, logits = built.model(
            **batch,
            num_sample_steps=NUM_SAMPLE_STEPS,
            num_recycling_steps=1,
            return_confidence_head_logits=True,
            return_distogram_head_logits=True,
        )
    elapsed = time.perf_counter() - started
    recorder.release()

    # A second pass for the trajectory: asking for every diffusion timestep and
    # the confidence logits at once feeds a 4-D position tensor into a head that
    # expects 3-D, so the two requests cannot share a forward.
    with torch.no_grad():
        trajectory = built.model(
            **batch,
            num_sample_steps=NUM_SAMPLE_STEPS,
            num_recycling_steps=1,
            return_all_diffused_atom_pos=True,
        )

    return [
        write_json(settings.target("model"), model_payload(built, elapsed)),
        write_json(settings.target("activations"), activation_payload(recorder, attention)),
        write_json(settings.target("predictions"), prediction_payload(logits, built)),
        write_json(settings.target("diffusion"), diffusion_payload(built, trajectory)),
        write_json(settings.target("features"), feature_payload(built)),
        *_export_prediction(settings, built, trajectory, logits, sequence),
    ]


def _export_prediction(settings, built, trajectory, logits, sequence: str) -> list[Path]:
    """Writes the final sampled coordinates as files a structure viewer can open."""
    raw_dir = settings.output_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    final = trajectory[-1, 0].float().cpu()
    plddt = _expected_plddt(logits.plddt)
    atoms = build_atom_metadata(
        sequence, GNP_SMILES, "Mg", built.batch["molecule_atom_lens"][0].tolist()
    )
    title = "AlphaFold 3 (PyTorch reimplementation, untrained weights) - H-Ras + GNP + Mg"

    return [
        write_prediction(raw_dir / "predicted_structure.cif", final, atoms, plddt, title),
        write_pdb(raw_dir / "predicted_structure.pdb", final, atoms, plddt),
    ]


def _watch_trunk(built: BuiltModel) -> Recorder:
    model = built.model
    recorder = Recorder()
    recorder.watch("relative_position_encoding", model.relative_position_encoding, "Algorithm 3")
    recorder.watch("template_embedding", model.template_embedder, "Algorithm 16")
    recorder.watch("msa_embedding", model.msa_module, "Algorithm 8")
    recorder.watch("outer_product_mean", model.msa_module.layers[0][0], "Algorithm 9")
    recorder.watch("msa_pair_weighted_averaging", model.msa_module.layers[0][1], "Algorithm 10")
    recorder.watch(
        "triangle_multiplication_outgoing", model.pairformer.layers[0][0], "Algorithms 12–15"
    )
    recorder.watch("single_inputs", model.input_embedder, "Algorithm 2")
    recorder.watch("trunk_single", model.confidence_head.pairformer_stack, "Algorithm 17")
    return recorder
