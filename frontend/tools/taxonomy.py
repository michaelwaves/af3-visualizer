"""Turns UniProt accessions into the organism each MSA row actually came from."""

from __future__ import annotations

import json
import re
import urllib.request
from dataclasses import dataclass

ENDPOINT = "https://rest.uniprot.org/uniprotkb/search"
BATCH = 25
UNIPROT_ACCESSION = re.compile(r"[OPQ][0-9][A-Z0-9]{3}[0-9]|[A-NR-Z][0-9]([A-Z][A-Z0-9]{2}[0-9]){1,2}")

# Checked against a lineage in order, so the most specific clade wins.
CLADE_ICONS: list[tuple[str, str, str]] = [
    ("Hominidae", "🦍", "great ape"),
    ("Primates", "🐒", "primate"),
    ("Rodentia", "🐭", "rodent"),
    ("Carnivora", "🐕", "carnivoran"),
    ("Chiroptera", "🦇", "bat"),
    ("Cetacea", "🐋", "whale"),
    ("Artiodactyla", "🐄", "hoofed mammal"),
    ("Mammalia", "🐘", "mammal"),
    ("Aves", "🐦", "bird"),
    ("Testudines", "🐢", "turtle"),
    ("Crocodylia", "🐊", "crocodilian"),
    ("Lepidosauria", "🦎", "lizard"),
    ("Amphibia", "🐸", "amphibian"),
    ("Chondrichthyes", "🦈", "shark or ray"),
    ("Actinopterygii", "🐟", "ray-finned fish"),
    ("Cephalochordata", "🐠", "lancelet"),
    ("Tunicata", "🐠", "tunicate"),
    ("Chordata", "🐠", "chordate"),
    ("Insecta", "🦋", "insect"),
    ("Arachnida", "🕷️", "arachnid"),
    ("Myriapoda", "🐛", "myriapod"),
    ("Crustacea", "🦐", "crustacean"),
    ("Arthropoda", "🦂", "arthropod"),
    ("Mollusca", "🐌", "mollusc"),
    ("Annelida", "🪱", "segmented worm"),
    ("Nematoda", "🪱", "nematode"),
    ("Platyhelminthes", "🎗️", "flatworm"),
    ("Rotifera", "🌀", "rotifer"),
    ("Cnidaria", "🪼", "cnidarian"),
    ("Echinodermata", "⭐", "echinoderm"),
    ("Porifera", "🧽", "sponge"),
    ("Metazoa", "🐛", "animal"),
    ("Fungi", "🍄", "fungus"),
    ("Viridiplantae", "🌿", "plant"),
    ("Rhodophyta", "🌺", "red alga"),
    ("Amoebozoa", "🫧", "amoeba"),
    ("Apicomplexa", "🧫", "apicomplexan"),
    ("Euglenozoa", "🌀", "euglenozoan"),
    ("Sar", "🧫", "SAR protist"),
    ("Bacteria", "🦠", "bacterium"),
    ("Archaea", "🌋", "archaeon"),
    ("Viruses", "👾", "virus"),
    ("Eukaryota", "🔬", "eukaryote"),
]


@dataclass(frozen=True)
class Organism:
    accession: str
    name: str
    icon: str
    clade: str


def lookup_organisms(accessions: list[str]) -> dict[str, Organism]:
    """Resolves accessions in batches; unresolvable ones are simply absent.

    Real alignments mix UniProt accessions with metagenomic read identifiers,
    which UniProt rejects — those are filtered out rather than failing a batch.
    """
    queryable = [accession for accession in accessions if UNIPROT_ACCESSION.fullmatch(accession)]
    resolved: dict[str, Organism] = {}
    for start in range(0, len(queryable), BATCH):
        resolved.update(_fetch_batch(queryable[start : start + BATCH]))
    return resolved


def _fetch_batch(accessions: list[str]) -> dict[str, Organism]:
    query = "+OR+".join(f"accession:{accession}" for accession in accessions)
    url = f"{ENDPOINT}?query={query}&fields=accession,organism_name,lineage&format=json&size={BATCH}"
    try:
        with urllib.request.urlopen(url, timeout=45) as response:
            results = json.loads(response.read()).get("results", [])
    except Exception:
        return {}

    organisms = {}
    for entry in results:
        organism = entry.get("organism", {})
        lineage = organism.get("lineage", [])
        icon, clade = classify(lineage)
        organisms[entry["primaryAccession"]] = Organism(
            accession=entry["primaryAccession"],
            name=organism.get("commonName") or organism.get("scientificName", "unknown"),
            icon=icon,
            clade=clade,
        )
    return organisms


def classify(lineage: list[str]) -> tuple[str, str]:
    """Maps a UniProt lineage onto the icon we draw beside its alignment row."""
    members = set(lineage)
    for clade, icon, label in CLADE_ICONS:
        if clade in members:
            return icon, label
    return "•", "unclassified"
