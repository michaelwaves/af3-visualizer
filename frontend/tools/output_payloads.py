"""Payloads for what the model produces: confidence heads and the sampler path."""

from __future__ import annotations

import torch

from capture import downsample
from constants import MAP_SIZE, NUM_SAMPLE_STEPS, UNTRAINED_NOTE
from model_builder import BuiltModel
from writer import quantise


def prediction_payload(logits, built: BuiltModel) -> dict:
    pae = logits.pae.softmax(1) if logits.pae is not None else None
    return {
        "plddt": quantise(_expected_plddt(logits.plddt)),
        "pae": quantise(downsample(_expected_bin(pae, 0.5, 32.0), MAP_SIZE)) if pae is not None else None,
        "distogram": quantise(
            downsample(_expected_bin(logits.distance.softmax(1), 2.0, 22.0), MAP_SIZE)
        ),
        "bins": {"distogram": 64, "pae": 64, "pde": 64, "plddt": logits.plddt.shape[1]},
        "tokenCount": built.token_count,
        "atomCount": built.atom_count,
        "note": UNTRAINED_NOTE,
    }


def diffusion_payload(built: BuiltModel, trajectory: torch.Tensor) -> dict:
    """The real EDM noise schedule, and the real path the sampler walked."""
    edm = built.model.edm
    sigmas = edm.sample_schedule(NUM_SAMPLE_STEPS).cpu()
    steps = trajectory[:, 0].float().cpu()
    return {
        "sigmas": quantise(sigmas),
        "sigmaData": edm.sigma_data,
        "sigmaMin": edm.sigma_min,
        "sigmaMax": edm.sigma_max,
        "rho": edm.rho,
        "stepScale": edm.step_scale,
        "churn": {"S_churn": edm.S_churn, "S_tmin": edm.S_tmin, "S_tmax": edm.S_tmax,
                  "S_noise": edm.S_noise},
        "preconditioning": [
            {"sigma": round(float(sigma), 3),
             "cSkip": round(float(edm.c_skip(sigma)), 4),
             "cOut": round(float(edm.c_out(sigma)), 4),
             "cIn": round(float(edm.c_in(sigma)), 4)}
            for sigma in sigmas
        ],
        "steps": quantise(steps[:, :: max(1, built.atom_count // 320)], 2),
        "radiusOfGyration": quantise([float(_radius_of_gyration(frame)) for frame in steps]),
        "note": UNTRAINED_NOTE,
    }


def _radius_of_gyration(frame: torch.Tensor) -> torch.Tensor:
    return (frame - frame.mean(0)).pow(2).sum(-1).mean().sqrt()


def _expected_plddt(plddt_logits: torch.Tensor) -> list[float]:
    """pLDDT is the expectation over 50 bins spanning 0-100."""
    bins = torch.linspace(0.5, 99.5, plddt_logits.shape[1], device=plddt_logits.device)
    return (plddt_logits.softmax(1)[0].T @ bins).cpu().tolist()


def _expected_bin(probabilities: torch.Tensor, low: float, high: float) -> torch.Tensor:
    bins = torch.linspace(low, high, probabilities.shape[1], device=probabilities.device)
    return torch.einsum("bcij,c->bij", probabilities, bins)[0].cpu()
