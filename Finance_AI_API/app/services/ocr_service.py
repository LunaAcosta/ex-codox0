import base64
import json
import re
from datetime import datetime

from app.core.config import settings
from app.core.openai_client import OpenAIClient


ALLOWED_CATEGORIES = {
    "supermarket",
    "rent",
    "services",
    "transportation",
    "entertainmet",
    "dining",
    "health",
    "insurance",
    "saving",
    "clothing",
    "personal",
    "education",
    "income",
    "others",
}

CATEGORY_ALIASES = {
    "groceries": "supermarket",
    "supermercado": "supermarket",
    "restaurant": "dining",
    "restaurante": "dining",
    "entertainment": "entertainmet",
    "entretenimiento": "entertainmet",
    "transport": "transportation",
    "transporte": "transportation",
    "utilities": "services",
    "servicios": "services",
    "education": "education",
    "educación": "education",
    "salary": "income",
    "salario": "income",
}


class OCRService:
    def __init__(self):
        self.client = OpenAIClient.get_client()

    @staticmethod
    def _extract_json(output_text: str) -> dict:
        fenced = re.sub(r"^```(?:json)?\s*|\s*```$", "", output_text.strip())
        start = fenced.find("{")
        if start < 0:
            raise ValueError("No se pudo interpretar el documento.")

        # raw_decode reads the first complete JSON object and safely ignores
        # Markdown, explanations or a duplicated object added by the model.
        try:
            parsed, _ = json.JSONDecoder().raw_decode(fenced[start:])
        except json.JSONDecodeError as exc:
            raise ValueError("No se pudo interpretar el documento.") from exc

        if not isinstance(parsed, dict):
            raise ValueError("No se pudo interpretar el documento.")
        return parsed

    @staticmethod
    def _normalize_category(value: object) -> str:
        category = str(value or "others").strip().lower()
        category = CATEGORY_ALIASES.get(category, category)
        return category if category in ALLOWED_CATEGORIES else "others"

    @staticmethod
    def _normalize_date(value: object) -> str | None:
        if value is None:
            return None
        raw_date = str(value).strip()
        if not raw_date:
            return None

        for date_format in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%m/%d/%Y"):
            try:
                return datetime.strptime(raw_date, date_format).date().isoformat()
            except ValueError:
                continue
        return None

    def extract(self, content: bytes, content_type: str) -> dict:
        encoded = base64.b64encode(content).decode("ascii")
        data_url = f"data:{content_type};base64,{encoded}"

        response = self.client.responses.create(
            model=settings.OPENAI_OCR_MODEL,
            instructions=(
                "Eres un OCR financiero para tickets, facturas y recibos. "
                "Extrae únicamente información visible; no inventes datos. "
                "La fecha debe ser la fecha de compra, transacción o emisión impresa en el documento. "
                "No uses la fecha actual, la fecha de escaneo ni una fecha de vencimiento. "
                "Si aparecen varias fechas, prioriza la identificada como fecha de compra, transacción o emisión. "
                "Responde solo JSON válido, sin Markdown."
            ),
            input=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "input_text",
                            "text": (
                                "Devuelve amount como número, date en formato YYYY-MM-DD, "
                                "description breve y category como uno de: supermarket, rent, "
                                "services, transportation, entertainmet, dining, health, "
                                "insurance, saving, clothing, personal, education, income, others. "
                                "Usa null cuando monto o fecha de la transacción no sean visibles."
                            ),
                        },
                        {"type": "input_image", "image_url": data_url},
                    ],
                }
            ],
            max_output_tokens=350,
        )

        output_text = str(response.output_text or "").strip()
        parsed = self._extract_json(output_text)

        amount = parsed.get("amount")
        try:
            amount = float(amount) if amount is not None else None
        except (TypeError, ValueError):
            amount = None

        return {
            "amount": amount,
            "date": self._normalize_date(parsed.get("date")),
            "description": str(parsed.get("description") or "Documento escaneado")[:160],
            "category": self._normalize_category(parsed.get("category")),
            "rawText": output_text,
        }
