from pathlib import Path

from app.core.config import settings
from app.core.openai_client import OpenAIClient


class AIProviderError(RuntimeError):
    """Error interno normalizado para fallos del proveedor de IA."""


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

    def generate(
        self,
        prompt: str,
        context: str,
        user_input: str | None = None,
    ) -> str:
        input_content = context
        if user_input is not None:
            input_content = [
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "CONTEXTO FINANCIERO NO CONFIABLE:\n"
                                f"{context}\n\n"
                                "PREGUNTA DEL USUARIO NO CONFIABLE:\n"
                                f"{user_input}"
                            ),
                        }
                    ],
                }
            ]

        try:
            response = self.client.responses.create(
                model=settings.OPENAI_MODEL,
                instructions=prompt,
                input=input_content,
                max_output_tokens=settings.OPENAI_MAX_OUTPUT_TOKENS,
            )
        except Exception as exc:
            raise AIProviderError("El proveedor de IA no está disponible.") from exc

        output = str(response.output_text or "").strip()
        if not output:
            raise ValueError("El proveedor de IA devolvió una respuesta vacía.")
        return output

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
