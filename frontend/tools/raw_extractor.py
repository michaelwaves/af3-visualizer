"""Ships the input files, and is explicit about which ones the model actually sees."""

from __future__ import annotations

import json
from pathlib import Path

from model_builder import GNP_SMILES
from predicted_files import predicted_structures
from settings import ExtractionSettings
from writer import write_json

# The alignment is 3.7 MB; shipping a head keeps the page light while still
# showing real records. The full file stays in the repository.
A3M_RECORDS = 400


def extract_raw_inputs(settings: ExtractionSettings, sequence: str) -> Path:
    """Writes what the featuriser is given, plus the files those strings came from."""
    raw_dir = settings.output_dir / "raw"
    raw_dir.mkdir(parents=True, exist_ok=True)

    entries = [
        _model_input(raw_dir, sequence),
        _alignment(settings.msa_a3m, raw_dir, settings),
        _reference_structure(settings.structure_cif, raw_dir, settings),
        *predicted_structures(raw_dir),
    ]
    return write_json(settings.target("raw"), {"inputs": entries})


def _model_input(raw_dir: Path, sequence: str) -> dict:
    """The entire input surface: a sequence, a SMILES string and an ion name."""
    payload = {
        "proteins": [sequence],
        "ligands": [GNP_SMILES],
        "metal_ions": ["Mg"],
    }
    text = (
        "# Exactly what Alphafold3Input receives. No coordinates anywhere.\n"
        "from alphafold3_pytorch.inputs import Alphafold3Input\n\n"
        "alphafold3_input = Alphafold3Input(\n"
        f"    proteins = [\n        '{sequence}'\n    ],\n"
        f"    ligands = ['{GNP_SMILES}'],\n"
        "    metal_ions = ['Mg'],\n"
        ")\n\n"
        "# As JSON:\n" + json.dumps(payload, indent=2) + "\n"
    )
    name = "alphafold3_input.py"
    (raw_dir / name).write_text(text)
    return {
        "key": "input",
        "label": name,
        "format": "python",
        "role": "model input",
        "path": f"data/raw/{name}",
        "repositoryPath": "constructed by frontend/tools/model_builder.py",
        "bytes": len(text.encode()),
        "lines": text.count("\n") + 1,
        "truncated": False,
        "note": (
            "This is the whole input: one amino-acid sequence, one SMILES string, "
            "one ion name. Everything else on this page is derived from it."
        ),
    }


def _alignment(source: Path, raw_dir: Path, settings: ExtractionSettings) -> dict:
    lines = source.read_text().splitlines()
    total_records = sum(1 for line in lines if line.startswith(">"))

    kept, records = [], 0
    for line in lines:
        if line.startswith(">"):
            records += 1
            if records > A3M_RECORDS:
                break
        kept.append(line)

    text = "\n".join(kept) + "\n"
    (raw_dir / source.name).write_text(text)
    return {
        "key": "msa",
        "label": source.name,
        "format": "a3m",
        "role": "model input",
        "path": f"data/raw/{source.name}",
        "repositoryPath": str(source.relative_to(settings.repo_root)),
        "bytes": len(text.encode()),
        "lines": len(kept),
        "truncated": True,
        "totalRecords": total_records,
        "note": (
            f"First {A3M_RECORDS} of {total_records:,} aligned sequences. Searched from the "
            "query sequence, then reduced to the per-column profile the model consumes. "
            "Lowercase columns are insertions relative to the query."
        ),
    }


def _reference_structure(source: Path, raw_dir: Path, settings: ExtractionSettings) -> dict:
    """Deliberately labelled as *not* an input — it is where the sequence came from."""
    text = source.read_text()
    (raw_dir / source.name).write_text(text)
    return {
        "key": "structure",
        "label": source.name,
        "format": "mmCIF",
        "role": "reference only",
        "path": f"data/raw/{source.name}",
        "repositoryPath": str(source.relative_to(settings.repo_root)),
        "bytes": len(text.encode()),
        "lines": text.count("\n") + 1,
        "truncated": False,
        "note": (
            "Never given to the model. It supplies the sequence and the list of bound "
            "molecules, and its coordinates are the ground truth the prediction is "
            "compared against. Feeding it in would be answer-leakage."
        ),
    }
