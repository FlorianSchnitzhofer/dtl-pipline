from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class PromptTemplate:
    """Simple template holder for LLM prompts."""

    description: str
    template: str

    def format(self, **kwargs: str) -> str:
        return self.template.format(**kwargs)


class PromptBuilder:
    """Factory for prompts to keep wording consistent across the API."""

    def ontology(self, *, title: str, legal_text: str) -> str:
        return ONTOLOGY_PROMPT.format(title=title, legal_text=legal_text)

    def configuration(self, *, title: str, legal_text: str) -> str:
        return CONFIGURATION_PROMPT.format(title=title, legal_text=legal_text)

    def interface(self, *, title: str, legal_text: str) -> str:
        return INTERFACE_PROMPT.format(title=title, legal_text=legal_text)

    def tests(self, *, title: str, legal_text: str) -> str:
        return TEST_PROMPT.format(title=title, legal_text=legal_text)

    def logic(self, *, title: str, legal_text: str) -> str:
        return LOGIC_PROMPT.format(title=title, legal_text=legal_text)

    def segmentation(self, *, law_name: str, law_identifier: str, full_text: str) -> str:
        return SEGMENTATION_PROMPT.format(
            law_name=law_name,
            law_identifier=law_identifier,
            full_text=full_text,
        )


ONTOLOGY_PROMPT = PromptTemplate(
    description="OWL extraction for a DTL",
    template=(
        "You are an expert knowledge engineer creating an OWL ontology to explain all the key terms for this legal text.\n"
        "Return a JSON object with key `ontology_owl` (string).\n"
        "The `ontology_owl` must be valid, consistent, error-free OWL with oonly semantic definitions of key terms of the law text.\n"
        "Keep identifiers stable.\n"
        "DTL Title: {title}\n"
        "Legal text to analyze:\n{legal_text}"
    ),
)


CONFIGURATION_PROMPT = PromptTemplate(
    description="Extract numeric and threshold configuration as OWL",
    template=(
        "You are creating an OWL configuration snippet that captures measurable parameters, thresholds.\n"
        "Return a JSON object with key `configuration_owl` (string).\n"
        "The configuration_owl must be valid, consistent, error-free OWL with only measurable parameters and thresholds\n"
        "Keep identifiers stable and include data types.\n"
        "DTL Title: {title}\n"
        "Legal text to analyze:\n{legal_text}"
    ),
)


INTERFACE_PROMPT = PromptTemplate(
    description="Generate API surface",
    template=(
        "Design an interface for executing the Digital Twin Law logic.\n"
        "Return a JSON object with these keys:\n"
        "- function_name: concise snake_case function name.\n"
        "- inputs: array of objects with name, type, description.\n"
        "- outputs: array mirroring inputs fields.\n"
        "- mcp_spec: optional JSON MCP/tool spec; always include a human readable hint string.\n"
        "Ensure all values are JSON-serializable.\n"
        "Title: {title}\n"
        "Source text:\n{legal_text}"
    ),
)


TEST_PROMPT = PromptTemplate(
    description="Generate executable test cases",
    template=(
        "Propose test cases for validating the Digital Twin Law implementation.\n"
        "Return a JSON object with key `tests` that is an array of objects containing:\n"
        "name (string), input (JSON object), expected_output (JSON object), description (string hint).\n"
        "Use clear names and minimal but valid JSON structures.\n"
        "DTL Title: {title}\n"
        "Context:\n{legal_text}"
    ),
)


LOGIC_PROMPT = PromptTemplate(
    description="Generate executable pseudo code",
    template=(
        "Translate the legal text into executable programming logic.\n"
        "Return a JSON object with keys `language` (string, always 'Python') and `code` (string).\n"
        "The code must be valid Python, start with comments summarising the legal reasoning, and implement the logic described.\n"
        "Do not include any extra keys or prose outside the JSON object.\n"
        "DTL Title: {title}\n"
        "Context:\n{legal_text}"
    ),
)


SEGMENTATION_PROMPT = PromptTemplate(
    description="Segment a law into candidate DTLs",
    template=(
        "Segment the following law into high-level Digital Twin Law functions.\n"
        "Return a single valid JSON object with the key `segments`. Each item in `segments` MUST include:"
        "- title: a short, precise functional name\n"
        "- description: a concise explanation of the legal function\n"
        "- legal_text: an exact verbatim excerpt from the provided legal text and MUST be a continuous substring of the provided text\n"
        "- legal_reference: pinpoint citation\n"
        "Law: {law_name} ({law_identifier})\n"
        "Full text excerpt:\n{full_text}"
    ),
)


prompt_builder = PromptBuilder()
