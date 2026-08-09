"""Turns the shipped a3m alignment into rows, statistics and species labels."""

from __future__ import annotations

import gzip
from dataclasses import dataclass
from pathlib import Path

import numpy as np

from settings import ExtractionSettings
from taxonomy import lookup_organisms
from writer import quantise, write_json

# The MSA one-hot AlphaFold 3 actually consumes: 20 amino acids + unknown,
# 4 RNA + unknown, 4 DNA + unknown, and a gap. See NUM_MSA_ONE_HOT.
MSA_ALPHABET = "ARNDCQEGHILKMFPSTWYVX" + "AUCGX" + "ATCGX" + "-"
AMINO_ACIDS = "ARNDCQEGHILKMFPSTWYV"
DISPLAY_ROWS = 48
CANDIDATE_ROWS = 260


@dataclass
class AlignmentRow:
    accession: str
    sequence: str
    identity: float


def extract_msa(settings: ExtractionSettings, resolve_species: bool = True) -> Path:
    """Writes a display subsample plus statistics computed over *every* row."""
    rows = read_a3m(settings.msa_a3m)
    query, homologs = rows[0], rows[1:]
    matrix = np.array([list(row.sequence) for row in rows])

    candidates = stratified_sample(homologs, CANDIDATE_ROWS)
    organisms = lookup_organisms([row.accession for row in candidates]) if resolve_species else {}
    sampled = prefer_named_organisms(candidates, organisms, DISPLAY_ROWS - 1)

    payload = {
        "source": settings.msa_a3m.name,
        "depth": len(rows),
        "length": len(query.sequence),
        "query": query.sequence,
        "alphabet": MSA_ALPHABET,
        "alphabetSize": len(MSA_ALPHABET),
        "rows": [_row_payload(row, organisms) for row in [query, *sampled]],
        "tokens": [[MSA_ALPHABET.index(c) if c in MSA_ALPHABET else 20 for c in row.sequence]
                   for row in [query, *sampled]],
        "conservation": quantise(column_conservation(matrix)),
        "gapFraction": quantise((matrix == "-").mean(axis=0)),
        "identityHistogram": _identity_histogram(homologs),
    }
    return write_json(settings.target("msa"), payload)


def read_a3m(path: Path) -> list[AlignmentRow]:
    """Reads a3m, dropping lowercase insertion columns to recover query width."""
    opener = gzip.open if path.suffix == ".gz" else open
    with opener(path, "rt") as handle:
        text = handle.read()

    rows: list[AlignmentRow] = []
    accession, chunks = None, []
    for line in text.splitlines():
        if line.startswith(">"):
            if accession is not None:
                rows.append(AlignmentRow(accession, _strip_insertions("".join(chunks)), 0.0))
            accession = line[1:].split()[0].split("\t")[0]
            chunks = []
        elif line:
            chunks.append(line.strip())
    if accession is not None:
        rows.append(AlignmentRow(accession, _strip_insertions("".join(chunks)), 0.0))

    width = len(rows[0].sequence)
    rows = [row for row in rows if len(row.sequence) == width]
    query = rows[0].sequence
    return [AlignmentRow(row.accession, row.sequence, sequence_identity(query, row.sequence))
            for row in rows]


def _strip_insertions(sequence: str) -> str:
    return "".join(character for character in sequence if not character.islower())


def sequence_identity(query: str, other: str) -> float:
    matches = sum(1 for a, b in zip(query, other) if a == b and a != "-")
    aligned = sum(1 for a, b in zip(query, other) if a != "-" and b != "-")
    return matches / aligned if aligned else 0.0


def stratified_sample(rows: list[AlignmentRow], count: int) -> list[AlignmentRow]:
    """Spreads the display rows across the identity range, as AF3's sampler does."""
    ordered = sorted(rows, key=lambda row: -row.identity)
    if len(ordered) <= count:
        return ordered
    picks = np.linspace(0, len(ordered) - 1, count).round().astype(int)
    return [ordered[index] for index in dict.fromkeys(picks.tolist())]


def prefer_named_organisms(
    candidates: list[AlignmentRow], organisms: dict, count: int
) -> list[AlignmentRow]:
    """Keeps the identity spread, but fills it with rows we can name a species for."""
    named = [row for row in candidates if row.accession in organisms]
    chosen = stratified_sample(named, count)
    if len(chosen) < count:
        remaining = [row for row in candidates if row not in chosen]
        chosen += stratified_sample(remaining, count - len(chosen))
    return sorted(chosen, key=lambda row: -row.identity)


def column_conservation(matrix: np.ndarray) -> np.ndarray:
    """1 - normalised Shannon entropy over the 20 amino acids, per column."""
    conservation = np.zeros(matrix.shape[1])
    for column in range(matrix.shape[1]):
        counts = np.array([(matrix[:, column] == residue).sum() for residue in AMINO_ACIDS])
        total = counts.sum()
        if total == 0:
            continue
        probabilities = counts[counts > 0] / total
        entropy = -(probabilities * np.log(probabilities)).sum()
        conservation[column] = 1.0 - entropy / np.log(len(AMINO_ACIDS))
    return conservation


def _row_payload(row: AlignmentRow, organisms: dict) -> dict:
    organism = organisms.get(row.accession)
    return {
        "accession": row.accession,
        "identity": round(row.identity, 3),
        "gaps": row.sequence.count("-"),
        "organism": organism.name if organism else None,
        "icon": organism.icon if organism else "•",
        "clade": organism.clade if organism else "unresolved",
    }


def _identity_histogram(rows: list[AlignmentRow], bins: int = 20) -> list[int]:
    counts, _ = np.histogram([row.identity for row in rows], bins=bins, range=(0.0, 1.0))
    return counts.tolist()
