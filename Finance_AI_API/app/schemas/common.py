from typing import Any, Optional

from pydantic import BaseModel, Field


class ApiResponse(BaseModel):
    success: bool = Field(
        ..., description="Indica si la operación fue exitosa.", example=True
    )

    message: str = Field(
        ...,
        description="Mensaje descriptivo de la operación.",
        example="Operación realizada correctamente.",
    )

    data: Optional[Any] = Field(
        default=None, description="Información devuelta por la API."
    )


class ErrorResponse(BaseModel):
    success: bool = Field(default=False, example=False)

    message: str = Field(..., example="Usuario no encontrado.")

    error: Optional[Any] = Field(default=None)
