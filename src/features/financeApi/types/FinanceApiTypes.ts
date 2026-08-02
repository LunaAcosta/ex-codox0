export type ApiEnvelope<TData> = {
  success: boolean;
  message: string;
  data: TData;
};

export type FinanceAiCapability =
  | "summary"
  | "analyze"
  | "recommend"
  | "predict"
  | "classify";

export type FinanceAiResult = {
  uid: string;
  content: string;
  capability: FinanceAiCapability;
};

export type ApiWallet = {
  id: string;
  name: string;
  amount?: number;
  totalIncome?: number;
  totalExpenses?: number;
  image?: unknown;
  uid?: string;
  created?: string;
};

export type ApiTransaction = {
  id: string;
  type: string;
  amount: number;
  category?: string;
  date: string;
  description?: string;
  image?: unknown;
  uid?: string;
  walletId: string;
};

export type FinancialData = {
  wallets: ApiWallet[];
  transactions: ApiTransaction[];
  reminders: PaymentReminder[];
};

export type PaymentReminder = {
  id: string;
  uid: string;
  title: string;
  amount: number;
  walletId: string;
  dueDate: string;
  category: string;
  autoCharge: boolean;
  status: "pending" | "completed" | "cancelled";
  notificationId?: string;
  transactionId?: string;
  createdAt: string;
  processedAt?: string | null;
};

export type PaymentReminderInput = Pick<PaymentReminder, "title" | "amount" | "walletId" | "dueDate" | "category" | "autoCharge">;

export type ApiRecommendation = {
  id: string;
  type: "daily_tip" | "alert" | "projection" | "recommendation";
  text?: string;
  recommendation?: string;
  date: string;
  read: boolean;
  source?: string;
  createdAt: string;
};

export type RootData = {
  version: string;
  status: string;
  documentation: string;
};

export type HealthData = {
  status: string;
  firebase: string;
  openai: string;
  version: string;
  timestamp: string;
};

export type MetadataData = {
  name: string;
  version: string;
  description: string;
  framework: string;
  database: string;
  ai: string;
  model: string;
};

export type ApiUser = {
  uid: string;
  name?: string | null;
  email?: string | null;
  [key: string]: unknown;
};

export type UsersResponse = ApiEnvelope<ApiUser[]> & {
  count: number;
};

export type RecommendationsResponse = ApiEnvelope<ApiRecommendation[]> & {
  count: number;
};

export type RawAiData = {
  uid: string;
  summary?: string;
  analysis?: string;
  recommendations?: string;
  prediction?: string;
  classification?: string;
};
