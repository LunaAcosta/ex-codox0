import { FinanceApiRepository } from "../infrastructure/FinanceApiRepository";
import { FinanceAiCapability, FinancialData, PaymentReminderInput } from "../types/FinanceApiTypes";

const repository = new FinanceApiRepository();
const financialDataCache = new Map<string, FinancialData>();

export const getFinanceApiOverview = async () => {
  const health = await repository.getHealth();
  return { health: health.data };
};

export const runFinanceAiCapability = (
  uid: string,
  capability: FinanceAiCapability,
) => repository.runCapability(capability, uid);

export const getFinancialData = async (uid: string, force = false) => {
  if (!force && financialDataCache.has(uid)) return financialDataCache.get(uid)!;
  const response = await repository.getFinancialData(uid);
  financialDataCache.set(uid, response.data);
  return response.data;
};

export const invalidateFinancialData = (uid?: string) => {
  if (uid) financialDataCache.delete(uid);
  else financialDataCache.clear();
};

export const getApiRecommendationHistory = async (uid: string) => {
  const response = await repository.getRecommendations(uid);
  return response.data;
};

export const markApiRecommendationRead = (uid: string, recommendationId: string) =>
  repository.markRecommendationRead(uid, recommendationId);

export const createPaymentReminder = async (uid: string, input: PaymentReminderInput) => {
  const response = await repository.createPaymentReminder(uid, input);
  invalidateFinancialData(uid);
  return response.data;
};

export const attachReminderNotification = (uid: string, reminderId: string, notificationId: string) =>
  repository.saveReminderNotification(uid, reminderId, notificationId);

export const processPaymentReminder = async (uid: string, reminderId: string) => {
  const response = await repository.processPaymentReminder(uid, reminderId);
  invalidateFinancialData(uid);
  return response.data;
};

export const cancelPaymentReminder = async (uid: string, reminderId: string) => {
  await repository.cancelPaymentReminder(uid, reminderId);
  invalidateFinancialData(uid);
};
