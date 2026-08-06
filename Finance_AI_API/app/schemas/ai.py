from typing import Optional

from pydantic import BaseModel, Field


# ==========================================================
# REQUESTS
# ==========================================================


class ChatRequest(BaseModel):
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
    amount: Optional[float] = None
    date: Optional[str] = None
    description: str = "Documento escaneado"
    category: str = "others"
    rawText: Optional[str] = None


class OCRResponse(BaseModel):
    success: bool = True
    message: str = "Documento analizado correctamente."
    data: OCRData
