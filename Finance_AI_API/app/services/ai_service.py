from enum import Enum
import hashlib
import json
import time

from app.core.logger import logger

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
    # FINGERPRINT
    # ======================================================

    @staticmethod
    def _fingerprint(profile: dict) -> str:
        financial_data = {
            "user": {
                "name": (profile.get("user") or {}).get("name")
            },
            "summary": profile.get("summary"),
            "wallets": sorted(
                profile.get("wallets") or [],
                key=lambda item: str(item.get("id", "")),
            ),
            "transactions": sorted(
                profile.get("transactions") or [],
                key=lambda item: str(item.get("id", "")),
            ),
        }

        serialized = json.dumps(
            financial_data,
            sort_keys=True,
            default=str,
        )

        return hashlib.sha256(
            serialized.encode("utf-8")
        ).hexdigest()

    # ======================================================
    # BUILD CONTEXT
    # ======================================================

    def _build_context(self, uid: str) -> str:
        profile = self.finance.build_finance_profile(uid)
        return ContextBuilder.build(profile)

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

    def execute(
        self,
        uid: str,
        capability: AICapability,
        request_id: str | None = None,
    ):
        """
        Ejecuta una capacidad de IA y registra métricas de
        rendimiento por etapa sin exponer información sensible.
        """

        total_start = time.perf_counter()

        # --------------------------------------------------
        # 1. Construcción del perfil financiero
        # --------------------------------------------------

        profile_start = time.perf_counter()

        profile = self.finance.build_finance_profile(uid)

        profile_ms = (
            time.perf_counter() - profile_start
        ) * 1000

        if profile.get("user") is None:

            logger.warning(
                "Usuario no encontrado",
                extra={
                    "extra_fields": {
                        "event": "ai_user_not_found",
                        "request_id": request_id,
                        "capability": capability.value,
                    }
                },
            )

            raise ValueError("Usuario no encontrado.")

        # --------------------------------------------------
        # 2. Fingerprint
        # --------------------------------------------------

        fingerprint_start = time.perf_counter()

        fingerprint = self._fingerprint(profile)

        fingerprint_ms = (
            time.perf_counter() - fingerprint_start
        ) * 1000

        # --------------------------------------------------
        # 3. Consulta de caché
        # --------------------------------------------------

        cache_start = time.perf_counter()

        cached = self.finance.repository.get_ai_cache(
            uid,
            capability.value,
        )

        cache_ms = (
            time.perf_counter() - cache_start
        ) * 1000

        cache_hit = bool(
            cached
            and cached.get("fingerprint") == fingerprint
            and cached.get("content")
        )

        # --------------------------------------------------
        # 4. Retorno desde caché
        # --------------------------------------------------

        if cache_hit:

            total_ms = (
                time.perf_counter() - total_start
            ) * 1000

            logger.info(
                "AI cache hit",
                extra={
                    "extra_fields": {
                        "event": "ai_cache_hit",
                        "request_id": request_id,
                        "capability": capability.value,
                        "cache_hit": True,
                        "profile_ms": round(profile_ms, 2),
                        "fingerprint_ms": round(fingerprint_ms, 2),
                        "cache_ms": round(cache_ms, 2),
                        "context_ms": 0,
                        "ai_ms": 0,
                        "save_cache_ms": 0,
                        "save_recommendation_ms": 0,
                        "total_ms": round(total_ms, 2),
                    }
                },
            )

            return cached["content"]

        # --------------------------------------------------
        # 5. Construcción del contexto
        # --------------------------------------------------

        context_start = time.perf_counter()

        context = ContextBuilder.build(profile)

        context_ms = (
            time.perf_counter() - context_start
        ) * 1000

        # --------------------------------------------------
        # 6. Construcción del prompt
        # --------------------------------------------------

        prompt_start = time.perf_counter()

        prompt = self._get_prompt(capability)

        prompt_ms = (
            time.perf_counter() - prompt_start
        ) * 1000

        # --------------------------------------------------
        # 7. Llamada a IA
        # --------------------------------------------------

        ai_start = time.perf_counter()

        content = self.openai.generate(
            prompt=prompt,
            context=context,
        )

        ai_ms = (
            time.perf_counter() - ai_start
        ) * 1000

        # --------------------------------------------------
        # 8. Guardar caché
        # --------------------------------------------------

        save_cache_start = time.perf_counter()

        self.finance.repository.save_ai_cache(
            uid,
            capability.value,
            fingerprint,
            content,
        )

        save_cache_ms = (
            time.perf_counter() - save_cache_start
        ) * 1000

        # --------------------------------------------------
        # 9. Guardar recomendación
        # --------------------------------------------------

        save_recommendation_ms = 0.0

        if capability == AICapability.RECOMMEND:

            recommendation_start = time.perf_counter()

            self.finance.repository.save_recommendation(
                uid,
                content,
                source="ai_recommend",
            )

            save_recommendation_ms = (
                time.perf_counter() - recommendation_start
            ) * 1000

        # --------------------------------------------------
        # 10. Tiempo total
        # --------------------------------------------------

        total_ms = (
            time.perf_counter() - total_start
        ) * 1000

        # --------------------------------------------------
        # 11. Log estructurado
        # --------------------------------------------------

        logger.info(
            "AI request completed",
            extra={
                "extra_fields": {
                    "event": "ai_request_completed",
                    "request_id": request_id,
                    "capability": capability.value,
                    "cache_hit": False,
                    "profile_ms": round(profile_ms, 2),
                    "fingerprint_ms": round(fingerprint_ms, 2),
                    "cache_ms": round(cache_ms, 2),
                    "context_ms": round(context_ms, 2),
                    "prompt_ms": round(prompt_ms, 2),
                    "ai_ms": round(ai_ms, 2),
                    "save_cache_ms": round(save_cache_ms, 2),
                    "save_recommendation_ms": round(
                        save_recommendation_ms,
                        2,
                    ),
                    "total_ms": round(total_ms, 2),
                }
            },
        )

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
        financiera, responde exactamente:
        "Solo puedo ayudarte con tus finanzas personales."

        Pregunta: {question}
        """

        return self.openai.generate(
            prompt=prompt,
            context=context,
        )