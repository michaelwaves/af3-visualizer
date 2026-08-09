"""Generates every JSON payload the explainer renders, from real data.

    python tools/extract.py --output-dir public/data

Structure, alignment and template payloads need only the repository's own files.
The model payloads instantiate AlphaFold 3 at paper scale and run it on a GPU.
"""

from __future__ import annotations

import json
from pathlib import Path

import click

from msa_extractor import extract_msa
from msa_profile import column_profile
from settings import ExtractionSettings
from structure_extractor import extract_structure
from template_extractor import extract_template


@click.command()
@click.option(
    "--repo-root",
    type=click.Path(exists=True, path_type=Path),
    default=Path(__file__).resolve().parents[2],
    help="Checkout of alphafold3-pytorch, which supplies the real inputs.",
)
@click.option(
    "--output-dir",
    type=click.Path(path_type=Path),
    default=Path(__file__).resolve().parents[1] / "public/data",
    help="Where the explainer loads its JSON from.",
)
@click.option("--device", default="cuda", help="Device to run the forward pass on.")
@click.option("--skip-model", is_flag=True, help="Skip the GPU passes.")
@click.option("--offline", is_flag=True, help="Skip UniProt species lookups.")
def main(repo_root: Path, output_dir: Path, device: str, skip_model: bool, offline: bool) -> None:
    """Writes structure, MSA, template and model payloads into the output directory."""
    settings = ExtractionSettings(repo_root=repo_root.resolve(), output_dir=output_dir.resolve())

    report(extract_structure(settings))
    sequence = json.loads(settings.target("structure").read_text())["sequence"]
    report(extract_msa(settings, resolve_species=not offline))
    report(extract_template(settings, sequence))

    if skip_model:
        click.echo("skipped the model passes")
        return

    from model_extractor import extract_model  # imported late: pulls in torch

    profile = column_profile(settings.msa_a3m)
    for path in extract_model(replace_device(settings, device), sequence, profile):
        report(path)


def replace_device(settings: ExtractionSettings, device: str) -> ExtractionSettings:
    return ExtractionSettings(
        repo_root=settings.repo_root, output_dir=settings.output_dir, device=device
    )


def report(path: Path) -> None:
    click.echo(f"  {path.name:<18} {path.stat().st_size / 1024:>8.0f} kb")


if __name__ == "__main__":
    main()
