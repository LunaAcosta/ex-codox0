from pathlib import Path

from app.core.config import settings
from app.core.openai_client import OpenAIClient


class OpenAIService:
    def __init__(self):

        self.client = OpenAIClient.get_client()

    # =====================================================
    # LOAD PROMPT
    # =====================================================

    def _load_prompt(self, prompt_name: str) -> str:

        prompt_path = (
            Path(__file__).resolve().parents[1] / "prompts" / f"{prompt_name}.txt"
        )

        with open(prompt_path, "r", encoding="utf-8") as file:
            return file.read()

    # =====================================================
    # GENERIC GENERATION
    # =====================================================

    def generate(self, prompt: str, context: str) -> str:

        response = self.client.responses.create(
            model=settings.OPENAI_MODEL,
            instructions=prompt,
            input=context,
            max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
        )

        return response.output_text

    # =====================================================
    # GENERATE FROM PROMPT FILE
    # =====================================================

    def generate_from_prompt(self, prompt_name: str, context: str) -> str:

        prompt = self._load_prompt(prompt_name)

        return self.generate(
            prompt=prompt,
            context=context,
        )

    # =====================================================
    # BACKWARD COMPATIBILITY
    # =====================================================

    def generate_summary(self, context: str) -> str:

        return self.generate_from_prompt(
            "summary",
            context,
        )
