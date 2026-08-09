"""Runs the real model on the real complex and records what actually happens."""

from __future__ import annotations

import time
from pathlib import Path

import torch

from capture import Recorder, capture_attention
from model_builder import BuiltModel, add_msa_and_templates, build_paper_scale_model
from constants import NUM_MSA, NUM_SAMPLE_STEPS, NUM_TEMPLATES
from output_payloads import diffusion_payload, prediction_payload
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
    ]


def _watch_trunk(built: BuiltModel) -> Recorder:
    model = built.model
    recorder = Recorder()
    recorder.watch("relative_position_encoding", model.relative_position_encoding)
    recorder.watch("template_embedding", model.template_embedder)
    recorder.watch("msa_embedding", model.msa_module)
    recorder.watch("outer_product_mean", model.msa_module.layers[0][0])
    recorder.watch("msa_pair_weighted_averaging", model.msa_module.layers[0][1])
    recorder.watch("triangle_multiplication_outgoing", model.pairformer.layers[0][0])
    recorder.watch("single_inputs", model.input_embedder)
    recorder.watch("trunk_single", model.confidence_head.pairformer_stack)
    return recorder
