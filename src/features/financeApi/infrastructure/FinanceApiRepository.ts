import { apiClient } from "@/core/network/apiClient";

import {
  ApiEnvelope,
  ApiUser,
  FinanceAiCapability,
  FinanceAiResult,
  FinancialData,
  HealthData,
  MetadataData,
  RawAiData,
  RootData,
  RecommendationsResponse,
  PaymentReminder,
  PaymentReminderInput,
  UsersResponse,
} from "../types/FinanceApiTypes";

const responseField: Record<FinanceAiCapability, keyof RawAiData> = {
  summary: "summary",
  analyze: "analysis",
  recommend: "recommendations",
  predict: "prediction",
  classify: "classification",
};

export class FinanceApiRepository {
  getRoot(): Promise<ApiEnvelope<RootData>> {
    return apiClient.get<ApiEnvelope<RootData>>("/");
  }

  getHealth(): Promise<ApiEnvelope<HealthData>> {
    return apiClient.get<ApiEnvelope<HealthData>>("/health/");
  }

  getMetadata(): Promise<ApiEnvelope<MetadataData>> {
    return apiClient.get<ApiEnvelope<MetadataData>>("/metadata/");
  }

  getAuthenticatedUsers(): Promise<UsersResponse> {
    return apiClient.get<UsersResponse>("/users/");
  }

  getUser(uid: string): Promise<ApiEnvelope<ApiUser>> {
    return apiClient.get<ApiEnvelope<ApiUser>>(`/users/${encodeURIComponent(uid)}`);
  }

  getFinancialData(uid: string): Promise<ApiEnvelope<FinancialData>> {
    return apiClient.get<ApiEnvelope<FinancialData>>(`/data/financial/${encodeURIComponent(uid)}`);
  }

  getRecommendations(uid: string): Promise<RecommendationsResponse> {
    return apiClient.get<RecommendationsResponse>(`/data/recommendations/${encodeURIComponent(uid)}`);
  }

  markRecommendationRead(uid: string, recommendationId: string): Promise<ApiEnvelope<null>> {
    return apiClient.patch<ApiEnvelope<null>, undefined>(
      `/data/recommendations/${encodeURIComponent(uid)}/${encodeURIComponent(recommendationId)}/read`,
      undefined,
    );
  }

  createPaymentReminder(uid: string, input: PaymentReminderInput): Promise<ApiEnvelope<PaymentReminder>> {
    return apiClient.post<ApiEnvelope<PaymentReminder>, PaymentReminderInput>(`/data/reminders/${encodeURIComponent(uid)}`, input);
  }

  saveReminderNotification(uid: string, reminderId: string, notificationId: string): Promise<ApiEnvelope<null>> {
    return apiClient.patch<ApiEnvelope<null>, { notificationId: string }>(`/data/reminders/${encodeURIComponent(uid)}/${encodeURIComponent(reminderId)}/notification`, { notificationId });
  }

  processPaymentReminder(uid: string, reminderId: string): Promise<ApiEnvelope<PaymentReminder>> {
    return apiClient.post<ApiEnvelope<PaymentReminder>, undefined>(`/data/reminders/${encodeURIComponent(uid)}/${encodeURIComponent(reminderId)}/process`, undefined);
  }

  cancelPaymentReminder(uid: string, reminderId: string): Promise<ApiEnvelope<null>> {
    return apiClient.delete<ApiEnvelope<null>>(`/data/reminders/${encodeURIComponent(uid)}/${encodeURIComponent(reminderId)}`);
  }

  async runCapability(
    capability: FinanceAiCapability,
    uid: string,
  ): Promise<FinanceAiResult> {
    const response = await apiClient.post<ApiEnvelope<RawAiData>, undefined>(
      `/ai/${capability}/${encodeURIComponent(uid)}`,
      undefined,
    );
    const content = response.data[responseField[capability]];

    if (typeof content !== "string" || !content.trim()) {
      throw new Error("La API devolvió una respuesta vacía.");
    }

    return { uid: response.data.uid, capability, content: content.trim() };
  }
}
