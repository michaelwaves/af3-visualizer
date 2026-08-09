"""Paths and knobs shared by every extractor."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass(frozen=True)
class ExtractionSettings:
    """Where the real data lives, and where the explainer expects its JSON."""

    repo_root: Path
    output_dir: Path
    device: str = "cuda"
    seed: int = 0

    @property
    def structure_cif(self) -> Path:
        """H-Ras P21 bound to a GTP analogue and a magnesium ion."""
        return self.repo_root / "data/test/pdb_data/mmcifs/21/721p-assembly1.cif"

    @property
    def msa_a3m(self) -> Path:
        """The real 15,953-sequence alignment shipped with the repository."""
        return self.repo_root / "data/test/pdb_data/data_caches/msa/msas/721p-assembly1A_protein.a3m"

    @property
    def template_hits(self) -> Path:
        return (
            self.repo_root
            / "data/test/pdb_data/data_caches/template/templates"
            / "721p-assembly1A_protein_pdball_230102_db.m8"
        )

    @property
    def template_cifs(self) -> list[Path]:
        root = self.repo_root / "data/test/pdb_data/mmcifs"
        return sorted(root.glob("*/*.cif"))

    def target(self, name: str) -> Path:
        self.output_dir.mkdir(parents=True, exist_ok=True)
        return self.output_dir / f"{name}.json"
