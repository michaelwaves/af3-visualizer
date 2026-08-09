"""Lifts the real implementation out of the package, so snippets cannot drift."""

from __future__ import annotations

import inspect
import subprocess
from pathlib import Path

from alphafold3_pytorch import alphafold3 as af3
from alphafold3_pytorch import attention as attn

from settings import ExtractionSettings
from writer import write_json

# Each entry names something the chapters point at. Methods are given as
# (class, method) so the snippet is the function body, not the whole class.
TARGETS: list[tuple[str, object, str | None]] = [
    ("InputFeatureEmbedder.forward", af3.InputFeatureEmbedder, "forward"),
    ("RelativePositionEncoding.forward", af3.RelativePositionEncoding, "forward"),
    ("MSAModule.to_layers", af3.MSAModule, "to_layers"),
    ("OuterProductMean.forward", af3.OuterProductMean, "forward"),
    ("MSAPairWeightedAveraging.forward", af3.MSAPairWeightedAveraging, "forward"),
    ("TemplateEmbedder.forward", af3.TemplateEmbedder, "forward"),
    ("TriangleMultiplication.forward", af3.TriangleMultiplication, "forward"),
    ("TriangleAttention.forward", af3.TriangleAttention, "forward"),
    ("PairwiseBlock.forward", af3.PairwiseBlock, "forward"),
    ("AttentionPairBias.forward", af3.AttentionPairBias, "forward"),
    ("Attend.forward", attn.Attend, "forward"),
    ("ElucidatedAtomDiffusion.sample_schedule", af3.ElucidatedAtomDiffusion, "sample_schedule"),
    ("ElucidatedAtomDiffusion.sample", af3.ElucidatedAtomDiffusion, "sample"),
    (
        "ElucidatedAtomDiffusion.preconditioned_network_forward",
        af3.ElucidatedAtomDiffusion,
        "preconditioned_network_forward",
    ),
    ("DiffusionModule.forward", af3.DiffusionModule, "forward"),
    ("ConfidenceHead.forward", af3.ConfidenceHead, "forward"),
    ("DistogramHead.forward", af3.DistogramHead, "forward"),
]


def extract_source(settings: ExtractionSettings) -> Path:
    """Writes each snippet with its file, line range and the code itself."""
    snippets = {}
    for key, owner, method in TARGETS:
        # Unwrap first: decorators such as `@torch.no_grad` otherwise report the
        # decorator's own file rather than the module we want to point people at.
        target = inspect.unwrap(getattr(owner, method) if method else owner)
        try:
            code, start = inspect.getsourcelines(target)
        except (OSError, TypeError):
            continue
        path = Path(inspect.getsourcefile(target) or "")
        snippets[key] = {
            "symbol": key,
            "file": _relative(path, settings.repo_root),
            "startLine": start,
            "endLine": start + len(code) - 1,
            "lines": len(code),
            "code": inspect.cleandoc("".join(code).rstrip()),
        }

    return write_json(
        settings.target("source"),
        {
            "repository": "lucidrains/alphafold3-pytorch",
            "commit": _commit(settings.repo_root),
            "snippets": snippets,
        },
    )


def _relative(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return path.name


def _commit(root: Path) -> str | None:
    try:
        result = subprocess.run(
            ["git", "-C", str(root), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            timeout=10,
        )
        return result.stdout.strip() or None
    except Exception:
        return None
