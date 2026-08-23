from typing import Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator


# ==========================================================
# REQUESTS
# ==========================================================


class ChatRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    uid: str = Field(
        ...,
        description="UID del usuario registrado en Firebase.",
        examples=["6NLMplhbdTPAoQz2R66Tb3p8ay43"],
        min_length=20,
        max_length=128,
    )

    question: str = Field(
        ...,
        description="Pregunta que el usuario desea realizar a la IA.",
        examples=["¿Cómo puedo ahorrar más dinero según mi situación financiera?"],
        min_length=2,
        max_length=500,
    )

    @field_validator("uid", "question")
    @classmethod
    def reject_blank_text(cls, value: str) -> str:
        normalized = value.strip()
        if not normalized:
            raise ValueError("El campo no puede estar vacío.")
        return normalized


# ==========================================================
# RESPONSES
# ==========================================================


class AIResponse(BaseModel):
    success: bool = Field(..., examples=[True])

    message: str = Field(..., examples=["Operación ejecutada correctamente."])

    data: dict


class ChatResponse(BaseModel):
    success: bool = True

    message: str = "Respuesta generada correctamente."

    data: dict


class ErrorResponse(BaseModel):
    success: bool = False

    message: str

    data: Optional[dict] = None


class OCRData(BaseModel):
    amount: Optional[float] = Field(default=None, ge=0, le=10_000_000)
    date: Optional[str] = Field(default=None, max_length=30)
    description: str = Field(default="Documento escaneado", max_length=200)
    category: str = Field(default="others", max_length=40)
    rawText: Optional[str] = Field(default=None, max_length=4_000)


class OCRResponse(BaseModel):
    success: bool = True
    message: str = "Documento analizado correctamente."
    data: OCRData
