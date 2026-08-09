"""Lifts the real implementation out of the package so snippets cannot drift.

    python tools/extract_source.py --output public/data/source.json
"""

from __future__ import annotations

import inspect
import json
import subprocess
import sys
from pathlib import Path

import click

REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT))

# Dotted names relative to the package; a trailing method is pulled off the class
# so the snippet is the function body rather than several hundred lines of class.
TARGETS = [
    "inputs.Alphafold3Input",
    "inputs.alphafold3_inputs_to_batched_atom_input",
    "alphafold3.LinearNoBiasThenOuterSum.forward",
    "alphafold3.InputFeatureEmbedder.forward",
    "alphafold3.AtomToTokenPooler.forward",
    "alphafold3.RelativePositionEncoding.forward",
    "alphafold3.TemplateEmbedder.forward",
    "alphafold3.MSAModule.forward",
    "alphafold3.MSAModule.to_layers",
    "alphafold3.OuterProductMean.forward",
    "alphafold3.MSAPairWeightedAveraging.forward",
    "alphafold3.Transition.forward",
    "alphafold3.TriangleMultiplication.forward",
    "alphafold3.TriangleAttention.forward",
    "alphafold3.PairwiseBlock.forward",
    "alphafold3.AttentionPairBias.forward",
    "alphafold3.PairformerStack.forward",
    "alphafold3.AdaptiveLayerNorm.forward",
    "alphafold3.DiffusionTransformer.forward",
    "alphafold3.SingleConditioning.forward",
    "alphafold3.PairwiseConditioning.forward",
    "alphafold3.DiffusionModule.forward",
    "alphafold3.ElucidatedAtomDiffusion.sample_schedule",
    "alphafold3.ElucidatedAtomDiffusion.preconditioned_network_forward",
    "alphafold3.ElucidatedAtomDiffusion.sample",
    "alphafold3.CentreRandomAugmentation.forward",
    "alphafold3.ConfidenceHead.forward",
    "alphafold3.DistogramHead.forward",
    "alphafold3.Alphafold3.forward",
    "attention.Attend.forward",
]


@click.command()
@click.option("--output", type=click.Path(path_type=Path), default=Path("public/data/source.json"))
def main(output: Path) -> None:
    """Writes each snippet with its file, line range and the code itself."""
    snippets = {}
    for target in TARGETS:
        snippet = _snippet(target)
        if snippet is None:
            click.echo(f"  ! could not resolve {target}")
            continue
        snippets[snippet["symbol"]] = snippet

    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(
        json.dumps(
            {
                "repository": "lucidrains/alphafold3-pytorch",
                "commit": _commit(),
                "snippets": snippets,
            },
            separators=(",", ":"),
        )
    )
    click.echo(f"  {output} — {len(snippets)} snippets, {output.stat().st_size / 1024:.0f} kb")


def _snippet(target: str) -> dict | None:
    resolved = _resolve(target)
    if resolved is None:
        return None
    # Unwrap first: decorators such as `@torch.no_grad` otherwise report the
    # decorator's own file rather than the module we want to point people at.
    unwrapped = inspect.unwrap(resolved)
    try:
        code, start = inspect.getsourcelines(unwrapped)
    except (OSError, TypeError):
        return None
    path = Path(inspect.getsourcefile(unwrapped) or "")
    return {
        "symbol": target.split(".", 1)[1],
        "file": _relative(path),
        "startLine": start,
        "endLine": start + len(code) - 1,
        "lines": len(code),
        "code": "".join(code).rstrip(),
    }


def _resolve(target: str):
    import alphafold3_pytorch

    parts = target.split(".")
    current = alphafold3_pytorch
    for part in parts:
        current = getattr(current, part, None)
        if current is None:
            return None
    return current


def _relative(path: Path) -> str:
    try:
        return str(path.relative_to(REPO_ROOT))
    except ValueError:
        return path.name


def _commit() -> str | None:
    result = subprocess.run(
        ["git", "-C", str(REPO_ROOT), "rev-parse", "--short", "HEAD"],
        capture_output=True,
        text=True,
        timeout=10,
    )
    return result.stdout.strip() or None


if __name__ == "__main__":
    main()
