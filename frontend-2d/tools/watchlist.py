"""Every module the walkthrough stops at, in forward-pass order."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class Watchpoint:
    """One stop in the debugger: a real submodule and how to draw its output."""

    id: str
    path: str
    algorithm: str | None = None
    kind: str = "pair"


WATCHPOINTS: tuple[Watchpoint, ...] = (
    # --- input featurisation ---------------------------------------------
    Watchpoint("input_embedder", "input_embedder", "Algorithm 2", "single"),
    Watchpoint("atom_transformer", "input_embedder.atom_transformer", "Algorithm 7", "atom"),
    Watchpoint(
        "atom_attention_pair_bias",
        "input_embedder.atom_transformer.layers.0.2.branch.fn",
        "Algorithm 24",
        "atom",
    ),
    # --- pairwise initialisation ------------------------------------------
    Watchpoint(
        "relative_position_encoding", "relative_position_encoding", "Algorithm 3", "pair"
    ),
    Watchpoint("token_bond_feats", "token_bond_to_pairwise_feat", None, "pair"),
    # --- templates ---------------------------------------------------------
    Watchpoint("template_embedder", "template_embedder", "Algorithm 16", "pair"),
    # Captured before the LayerScale gate, which is zero-initialised: without
    # this the only picture of the template branch would be a blank matrix.
    Watchpoint("template_to_out", "template_embedder.to_out", None, "pair"),
    Watchpoint(
        "template_pairwise_block", "template_embedder.pairformer_stack.0", None, "pair"
    ),
    Watchpoint(
        "template_tri_mult_outgoing",
        "template_embedder.pairformer_stack.0.tri_mult_outgoing.fn",
        "Algorithm 12",
        "pair",
    ),
    # --- MSA ---------------------------------------------------------------
    Watchpoint("msa_module", "msa_module", "Algorithm 8", "pair"),
    Watchpoint("msa_pairwise_final", "msa_module.layers.3.3", None, "pair"),
    Watchpoint("msa_init_proj", "msa_module.msa_init_proj", None, "msa"),
    Watchpoint("outer_product_mean", "msa_module.layers.0.0", "Algorithm 9", "pair"),
    Watchpoint(
        "msa_pair_weighted_averaging", "msa_module.layers.0.1", "Algorithm 10", "msa"
    ),
    Watchpoint("msa_transition", "msa_module.layers.0.2", "Algorithm 11", "msa"),
    Watchpoint("msa_pairwise_block", "msa_module.layers.0.3", None, "pair"),
    # --- pairformer trunk ---------------------------------------------------
    Watchpoint("pairformer_block", "pairformer.layers.0.0.branch", None, "pair"),
    Watchpoint(
        "tri_mult_outgoing",
        "pairformer.layers.0.0.branch.tri_mult_outgoing.fn",
        "Algorithm 12",
        "pair",
    ),
    Watchpoint(
        "tri_mult_incoming",
        "pairformer.layers.0.0.branch.tri_mult_incoming.fn",
        "Algorithm 13",
        "pair",
    ),
    Watchpoint(
        "tri_attn_starting",
        "pairformer.layers.0.0.branch.tri_attn_starting.fn",
        "Algorithm 14",
        "pair",
    ),
    Watchpoint(
        "tri_attn_ending",
        "pairformer.layers.0.0.branch.tri_attn_ending.fn",
        "Algorithm 15",
        "pair",
    ),
    Watchpoint(
        "pairwise_transition",
        "pairformer.layers.0.0.branch.pairwise_transition.fn",
        "Algorithm 11",
        "pair",
    ),
    Watchpoint(
        "single_attention_pair_bias", "pairformer.layers.0.1.branch.fn", "Algorithm 24", "single"
    ),
    Watchpoint("single_transition", "pairformer.layers.0.2.branch.fn", "Algorithm 11", "single"),
    Watchpoint("pairformer_stack", "pairformer", "Algorithm 17", "single"),
    # --- diffusion ----------------------------------------------------------
    Watchpoint("diffusion_module", "diffusion_module", "Algorithm 20", "coords"),
    Watchpoint(
        "single_conditioning", "diffusion_module.single_conditioner", "Algorithm 21", "single"
    ),
    Watchpoint(
        "pairwise_conditioning", "diffusion_module.pairwise_conditioner", "Algorithm 22", "pair"
    ),
    Watchpoint("atom_encoder", "diffusion_module.atom_encoder", "Algorithm 5", "atom"),
    Watchpoint(
        "atom_to_token_pool", "diffusion_module.atom_feats_to_pooled_token", None, "single"
    ),
    Watchpoint("token_transformer", "diffusion_module.token_transformer", "Algorithm 23", "single"),
    Watchpoint("atom_decoder", "diffusion_module.atom_decoder", "Algorithm 6", "atom"),
    # --- heads ---------------------------------------------------------------
    Watchpoint("confidence_head", "confidence_head", "Algorithm 31", "logits"),
    Watchpoint("confidence_pairformer", "confidence_head.pairformer_stack", "Algorithm 17", "single"),
    Watchpoint("distogram_head", "distogram_head", None, "logits"),
)
