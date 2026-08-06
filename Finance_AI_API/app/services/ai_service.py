from enum import Enum
import hashlib
import json

from app.services.finance_service import FinanceService
from app.services.context_builder import ContextBuilder
from app.services.openai_service import OpenAIService


# ==========================================================
# AI CAPABILITIES
# ==========================================================


class AICapability(str, Enum):
    SUMMARY = "summary"
    ANALYZE = "analyze"
    RECOMMEND = "recommend"
    PREDICT = "predict"
    CLASSIFY = "classify"


# ==========================================================
# AI SERVICE
# ==========================================================


class AIService:
    def __init__(self):

        self.finance = FinanceService()
        self.openai = OpenAIService()

    # ======================================================
    # BUILD CONTEXT
    # ======================================================

    @staticmethod
    def _fingerprint(profile: dict) -> str:
        financial_data = {
            "user": {"name": (profile.get("user") or {}).get("name")},
            "summary": profile.get("summary"),
            "wallets": sorted(profile.get("wallets") or [], key=lambda item: str(item.get("id", ""))),
            "transactions": sorted(profile.get("transactions") or [], key=lambda item: str(item.get("id", ""))),
        }
        serialized = json.dumps(financial_data, sort_keys=True, default=str)
        return hashlib.sha256(serialized.encode("utf-8")).hexdigest()

    def _build_context(self, uid: str) -> str:
        return ContextBuilder.build(self.finance.build_finance_profile(uid))

    # ======================================================
    # PROMPTS
    # ======================================================

    def _get_prompt(self, capability: AICapability):

        common_rules = """
            Eres el asesor financiero de Ex-Codox.
            Responde siempre en español y únicamente sobre finanzas personales.
            Usa exclusivamente los datos del contexto del usuario autenticado.
            No inventes cifras, hechos ni datos faltantes.
            No menciones datos personales innecesarios ni información de otros usuarios.
            Si faltan datos, indícalo claramente en una sola oración.
            Si la solicitud no es financiera, responde exactamente:
            "Solo puedo ayudarte con tus finanzas personales."
            Sé directo, descriptivo y breve. No incluyas introducciones ni despedidas.
        """

        prompts = {
            AICapability.SUMMARY: f"""
            {common_rules}
            Resume la situación financiera en máximo 70 palabras.
            Incluye balance, ingresos, gastos, ahorro y una acción prioritaria.
            """,
            AICapability.ANALYZE: f"""
            {common_rules}
            Presenta máximo cuatro viñetas: fortaleza, debilidad, riesgo y oportunidad.
            Cada viñeta debe tener una sola oración y basarse en una cifra disponible.
            """,
            AICapability.RECOMMEND: f"""
            {common_rules}
            Da como máximo tres recomendaciones priorizadas y accionables.
            Usa una oración corta por recomendación e indica el beneficio esperado.
            """,
            AICapability.PREDICT: f"""
            {common_rules}
            Describe una tendencia, un riesgo y una oportunidad en máximo tres viñetas.
            Expresa incertidumbre; no presentes estimaciones como garantías.
            """,
            AICapability.CLASSIFY: f"""
            {common_rules}
            Clasifica el perfil como Conservador, Equilibrado, Arriesgado,
            Alto gastador o Excelente ahorrador. Responde con la categoría y
            una justificación de máximo 35 palabras.
            """,
        }

        return prompts[capability]

    # ======================================================
    # EXECUTE
    # ======================================================

    def execute(self, uid: str, capability: AICapability):

        profile = self.finance.build_finance_profile(uid)
        if profile.get("user") is None:
            raise ValueError("Usuario no encontrado.")

        fingerprint = self._fingerprint(profile)
        cached = self.finance.repository.get_ai_cache(uid, capability.value)
        if cached and cached.get("fingerprint") == fingerprint and cached.get("content"):
            return cached["content"]

        context = ContextBuilder.build(profile)

        prompt = self._get_prompt(capability)
        content = self.openai.generate(prompt=prompt, context=context)
        self.finance.repository.save_ai_cache(uid, capability.value, fingerprint, content)

        if capability == AICapability.RECOMMEND:
            self.finance.repository.save_recommendation(uid, content, source="ai_recommend")

        return content

    # ======================================================
    # CHAT
    # ======================================================

    def chat(
        self,
        uid: str,
        question: str,
    ):

        user = self.finance.get_user(uid)

        if user is None:
            raise ValueError("Usuario no encontrado.")

        context = self._build_context(uid)

        prompt = f"""
        Eres el asistente financiero de Ex-Codox.
        Responde siempre en español, en máximo 80 palabras y únicamente sobre
        finanzas personales del usuario autenticado. Usa solo el contexto
        proporcionado; no inventes cifras ni reveles información personal
        innecesaria. Si faltan datos, dilo brevemente. Si la pregunta no es
        financiera, responde exactamente: "Solo puedo ayudarte con tus finanzas personales."

        Pregunta: {question}
        """

        return self.openai.generate(
            prompt=prompt,
            context=context,
        )
