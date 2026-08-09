"""Runs AlphaFold 3 on 721p and records every module the walkthrough shows.

    python tools/capture_trace.py --output-dir public/data

Unlike the 3-D explainer's extraction, the alignment and the template fed in
here are the real ColabFold a3m and the real AlphaFold DB model, not noise.
"""

from __future__ import annotations

import sys
import time
from pathlib import Path

import click
import torch

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "frontend/tools"))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from model_builder import build_paper_scale_model  # noqa: E402
from real_msa import build_alignment  # noqa: E402
from real_template import build_template  # noqa: E402
from tracer import Tracer  # noqa: E402
from trace_writer import write_trace  # noqa: E402
from watchlist import WATCHPOINTS  # noqa: E402

MSA_A3M = REPO_ROOT / "data/test/pdb_data/data_caches/msa/msas/721p-assembly1A_protein.a3m"
TEMPLATE_CIF = REPO_ROOT / "data/test/afdb_data/mmcifs/P01112/AF-P01112-F1-model_v4.cif.gz"
STRUCTURE_CIF = REPO_ROOT / "data/test/pdb_data/mmcifs/21/721p-assembly1.cif"

UNTRAINED_NOTE = (
    "Captured from this repository's AlphaFold 3 at paper scale with randomly initialised "
    "weights — no trained checkpoint is publicly released. Every shape, module, schedule "
    "and code path below is real; the numerical values are a real forward pass of an "
    "untrained network, not a trained prediction."
)


@click.command()
@click.option("--output-dir", type=click.Path(path_type=Path), default=Path("public/data"))
@click.option("--device", default="cuda")
@click.option("--msa-depth", default=64, help="Alignment rows fed to the MSA module.")
@click.option("--sample-steps", default=32, help="Diffusion sampling steps.")
def main(output_dir: Path, device: str, msa_depth: int, sample_steps: int) -> None:
    """Writes trace.json, maps.json and one downloadable tensor per module."""
    torch.manual_seed(0)
    sequence = _sequence()
    click.echo(f"building paper-scale model on {device} for {len(sequence)} residues")
    built = build_paper_scale_model(sequence, device)
    batch = _batch(built, device, msa_depth)

    tracer = Tracer()
    missing = tracer.attach(built.model, WATCHPOINTS)
    for path in missing:
        click.echo(f"  ! watchpoint did not resolve: {path}")

    started = time.perf_counter()
    with torch.no_grad():
        _, logits = built.model(**batch, num_sample_steps=sample_steps, num_recycling_steps=1,
                                return_confidence_head_logits=True,
                                return_distogram_head_logits=True)
    elapsed = time.perf_counter() - started
    tracer.release()

    meta = _meta(built, batch, elapsed, device, sample_steps)
    written = write_trace(output_dir.resolve(), meta, tracer.observations)
    written += _write_outputs(output_dir.resolve(), built, batch, logits, sample_steps)
    for path in written:
        click.echo(f"  {path.relative_to(output_dir.resolve().parent)}")
    click.echo(f"recorded {len(tracer.observations)} modules in {elapsed:.1f}s")


def _batch(built, device: str, msa_depth: int) -> dict:
    """Attaches the real alignment and the real template to the real features."""
    tokens = built.token_count
    alignment = build_alignment(MSA_A3M, tokens, msa_depth, device)
    templates, template_mask = build_template(TEMPLATE_CIF, tokens, device)

    batch = dict(built.batch)
    batch["msa"] = alignment.one_hot
    batch["msa_mask"] = alignment.mask
    batch["additional_msa_feats"] = alignment.additional
    batch["templates"] = templates
    batch["template_mask"] = template_mask
    batch["is_molecule_mod"] = torch.zeros(1, tokens, 4, dtype=torch.bool, device=device)
    built.batch.update(batch)
    return batch


def _write_outputs(directory: Path, built, batch: dict, logits, sample_steps: int) -> list[Path]:
    """Confidence maps and the sampler trajectory, from this same input.

    A second forward is needed for the trajectory: asking for every diffusion
    timestep and the confidence logits at once feeds a 4-D position tensor into
    a head that expects 3-D, so the two requests cannot share a pass.
    """
    from output_payloads import diffusion_payload, prediction_payload
    from writer import write_json

    with torch.no_grad():
        trajectory = built.model(**batch, num_sample_steps=sample_steps,
                                 num_recycling_steps=1, return_all_diffused_atom_pos=True)

    return [
        write_json(directory / "predictions.json", prediction_payload(logits, built)),
        write_json(directory / "diffusion.json", diffusion_payload(built, trajectory)),
    ]


def _meta(built, batch: dict, elapsed: float, device: str, sample_steps: int) -> dict:
    model = built.model
    return {
        "pdbId": "721p",
        "title": "H-Ras P21 catalytic domain, GNP and Mg²⁺",
        "device": torch.cuda.get_device_name(0) if device.startswith("cuda") else device,
        "forwardSeconds": round(elapsed, 2),
        "peakMemoryGb": round(torch.cuda.max_memory_allocated() / 1e9, 2)
        if device.startswith("cuda")
        else None,
        "totalParameters": sum(p.numel() for p in model.parameters()),
        "tokens": built.token_count,
        "atoms": built.atom_count,
        "msaDepth": int(batch["msa"].shape[1]),
        "msaSource": MSA_A3M.name,
        "templates": int(batch["templates"].shape[1]),
        "templateSource": TEMPLATE_CIF.name,
        "sampleSteps": sample_steps,
        "recyclingSteps": 1,
        "torch": torch.__version__,
        "note": UNTRAINED_NOTE,
        "dims": {"single": 384, "pairwise": 128, "msa": 64, "atom": 128,
                 "atompair": 16, "token": 768, "atomsPerWindow": 27},
    }


def _sequence() -> str:
    """The chain A sequence of 721p, read from the mmCIF shipped in the repository."""
    from mmcif import group_into_residues, parse_mmcif_atoms

    residues = group_into_residues(
        [a for a in parse_mmcif_atoms(STRUCTURE_CIF) if not a.is_hetero and a.chain == "A"]
    )
    return "".join(residue.code for residue in residues)


if __name__ == "__main__":
    main()
