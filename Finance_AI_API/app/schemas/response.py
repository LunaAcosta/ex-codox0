from typing import Any, Optional

from pydantic import BaseModel, Field


# ==========================================================
# RESPUESTA BASE
# ==========================================================


class ApiResponse(BaseModel):
    success: bool = Field(
        ..., description="Indica si la operación fue exitosa.", examples=[True]
    )

    message: str = Field(
        ...,
        description="Mensaje descriptivo del resultado.",
        examples=["Operación realizada correctamente."],
    )

    data: Optional[Any] = Field(
        default=None, description="Información devuelta por la operación."
    )


# ==========================================================
# RESPUESTA CON LISTADO
# ==========================================================


class ListResponse(ApiResponse):
    count: int = Field(
        ..., description="Cantidad de registros encontrados.", examples=[5]
    )


# ==========================================================
# ERROR
# ==========================================================


class ErrorResponse(BaseModel):
    success: bool = Field(
        default=False, description="Siempre será false cuando exista un error."
    )

    message: str = Field(..., description="Descripción del error.")

    data: Optional[Any] = Field(
        default=None, description="Siempre será null cuando exista un error."
    )
