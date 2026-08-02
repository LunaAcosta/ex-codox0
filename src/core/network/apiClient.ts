import { isAxiosError } from "axios";

import { API_BASE_URL } from "../config/api";
import { httpClient } from "./httpClient";

type FastApiErrorBody = {
  detail?: string;
  message?: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const toApiError = (error: unknown): ApiError => {
  if (!isAxiosError<FastApiErrorBody>(error)) {
    return new ApiError("Ocurrió un error inesperado al consultar el servicio.");
  }

  if (!error.response) {
    return new ApiError(
      `No fue posible conectar con Finance AI API (${API_BASE_URL}). Verifica que el teléfono y la computadora estén en la misma red Wi-Fi.`,
    );
  }

  const message =
    error.response.data?.detail ||
    error.response.data?.message ||
    "Finance AI API no pudo procesar la solicitud.";

  return new ApiError(message, error.response.status);
};

const wait = (milliseconds: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, milliseconds));

const withNetworkRetry = async <TResponse>(request: () => Promise<TResponse>) => {
  try {
    return await request();
  } catch (error) {
    if (!isAxiosError(error) || error.response) throw error;
    await wait(600);
    return request();
  }
};

export const apiClient = {
  async get<TResponse>(path: string): Promise<TResponse> {
    try {
      const response = await httpClient.get<TResponse>(path);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async post<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
    try {
      const response = await httpClient.post<TResponse>(path, body);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async patch<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
    try {
      const response = await httpClient.patch<TResponse>(path, body);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async delete<TResponse>(path: string): Promise<TResponse> {
    try {
      const response = await httpClient.delete<TResponse>(path);
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },

  async postForm<TResponse>(path: string, body: FormData): Promise<TResponse> {
    try {
      const response = await withNetworkRetry(() =>
        httpClient.post<TResponse>(path, body, {
          headers: { "Content-Type": "multipart/form-data" },
        }),
      );
      return response.data;
    } catch (error) {
      throw toApiError(error);
    }
  },
};
