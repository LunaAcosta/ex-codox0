import { Timestamp } from 'firebase/firestore';
import { expenseCategories } from '../../../../shared/constants/data';
import { TransactionType, WalletType } from '../../../../shared/types';
import { getApiRecommendationHistory, markApiRecommendationRead, runFinanceAiCapability } from '../../../financeApi/application/financeApiService';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export type RecommendationRecord = {
  id?: string;
  type: 'daily_tip' | 'alert' | 'projection' | 'recommendation';
  text: string;
  date: string; // YYYY-MM-DD
  read: boolean;
  createdAt: Date | Timestamp | string;
};

export type FinancialAlert = {
  id: string;
  severity: 'low' | 'medium' | 'high';
  message: string;
  category?: string;
};

export type CategoryAnalysis = {
  category: string;
  label: string;
  amount: number;
  percentage: number;
  trendPercent: number; // positive = increased vs last month
  bgColor: string;
};

export type BalanceProjection = {
  availableBalance: number;
  dailyAverage: number;
  estimatedDepletionDate: Date | null;
  daysRemaining: number | null;
  riskLevel: 'green' | 'yellow' | 'red';
};

export type MonthProjection = {
  estimatedMonthlyExpense: number;
  estimatedSavings: number;
  currentMonthIncome: number;
};

export type FinancialInsights = {
  totalBalance: number;
  currentMonthIncome: number;
  currentMonthExpenses: number;
  savingsRate: number;
  categoryAnalysis: CategoryAnalysis[];
  alerts: FinancialAlert[];
  balanceProjection: BalanceProjection;
  monthProjection: MonthProjection;
  personalizedRecommendations: string[];
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

const todayString = (): string => new Date().toISOString().split('T')[0];

const getCategoryLabel = (value: string): string => {
  return expenseCategories[value]?.label ?? value;
};

const getCategoryColor = (value: string): string => {
  return expenseCategories[value]?.bgColor ?? '#525252';
};

const getTransactionDate = (date: TransactionType['date']): Date => {
  if (date instanceof Timestamp) return date.toDate();
  if (typeof date === 'string') return new Date(date);
  return date as Date;
};

// ─────────────────────────────────────────────
// Core Financial Analysis Engine
// ─────────────────────────────────────────────

export const analyzeFinancials = (
  transactions: TransactionType[],
  wallets: WalletType[]
): FinancialInsights => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const dayOfMonth = now.getDate();

  const prevMonthStart = new Date(currentYear, currentMonth - 1, 1);
  const prevMonthEnd = new Date(currentYear, currentMonth, 0);
  const currentMonthStart = new Date(currentYear, currentMonth, 1);

  // Aggregate totals
  let currentMonthIncome = 0;
  let currentMonthExpenses = 0;
  const currentExpenseByCategory: Record<string, number> = {};
  const prevExpenseByCategory: Record<string, number> = {};

  // Daily spending for last 30 days
  const last30DaysStart = new Date();
  last30DaysStart.setDate(last30DaysStart.getDate() - 30);
  let last30DaysExpenses = 0;
  let todayExpenses = 0;
  const todayStr = todayString();

  transactions.forEach((tx) => {
    const txDate = getTransactionDate(tx.date);
    const isCurrentMonth =
      txDate >= currentMonthStart && txDate <= now;
    const isPrevMonth = txDate >= prevMonthStart && txDate <= prevMonthEnd;
    const isLast30Days = txDate >= last30DaysStart;
    const isTodayTx =
      txDate.toISOString().split('T')[0] === todayStr;

    if (isCurrentMonth) {
      if (tx.type === 'income') currentMonthIncome += tx.amount || 0;
      if (tx.type === 'expense') {
        currentMonthExpenses += tx.amount || 0;
        const cat = tx.category || 'others';
        currentExpenseByCategory[cat] =
          (currentExpenseByCategory[cat] || 0) + (tx.amount || 0);
      }
    }

    if (isPrevMonth && tx.type === 'expense') {
      const cat = tx.category || 'others';
      prevExpenseByCategory[cat] =
        (prevExpenseByCategory[cat] || 0) + (tx.amount || 0);
    }

    if (isLast30Days && tx.type === 'expense') {
      last30DaysExpenses += tx.amount || 0;
    }

    if (isTodayTx && tx.type === 'expense') {
      todayExpenses += tx.amount || 0;
    }
  });

  const totalBalance = wallets.reduce((s, w) => s + (w.amount || 0), 0);
  const savingsRate =
    currentMonthIncome > 0
      ? ((currentMonthIncome - currentMonthExpenses) / currentMonthIncome) * 100
      : 0;

  // Category analysis
  const categoryAnalysis: CategoryAnalysis[] = Object.entries(
    currentExpenseByCategory
  )
    .map(([cat, amount]) => {
      const prev = prevExpenseByCategory[cat] || 0;
      const trendPercent =
        prev > 0 ? ((amount - prev) / prev) * 100 : 0;
      return {
        category: cat,
        label: getCategoryLabel(cat),
        amount,
        percentage:
          currentMonthExpenses > 0
            ? (amount / currentMonthExpenses) * 100
            : 0,
        trendPercent,
        bgColor: getCategoryColor(cat),
      };
    })
    .sort((a, b) => b.amount - a.amount);

  // Alerts
  const alerts: FinancialAlert[] = [];

  // Top category dominance
  if (categoryAnalysis.length > 0 && categoryAnalysis[0].percentage > 40) {
    const top = categoryAnalysis[0];
    alerts.push({
      id: 'cat_dominant',
      severity: 'medium',
      message: `Tu categoría "${top.label}" representa el ${top.percentage.toFixed(0)}% de tus gastos mensuales.`,
      category: top.category,
    });
  }

  // Low savings rate
  if (currentMonthIncome > 0 && savingsRate < 10) {
    alerts.push({
      id: 'low_savings',
      severity: 'high',
      message: `Tu ahorro actual representa menos del 10% de tus ingresos este mes.`,
    });
  }

  // Spending spike vs last month
  const prevMonthTotal = Object.values(prevExpenseByCategory).reduce(
    (s, v) => s + v,
    0
  );
  if (
    prevMonthTotal > 0 &&
    currentMonthExpenses > prevMonthTotal * 1.25
  ) {
    const pct = (
      ((currentMonthExpenses - prevMonthTotal) / prevMonthTotal) *
      100
    ).toFixed(0);
    alerts.push({
      id: 'spending_spike',
      severity: 'high',
      message: `Tus gastos este mes aumentaron un ${pct}% respecto al mes anterior.`,
    });
  }

  // Category trend spike
  categoryAnalysis.forEach((cat) => {
    if (cat.trendPercent > 25 && cat.amount > 20) {
      alerts.push({
        id: `trend_${cat.category}`,
        severity: 'medium',
        message: `Se detectó un incremento del ${cat.trendPercent.toFixed(0)}% en tus gastos de "${cat.label}".`,
        category: cat.category,
      });
    }
  });

  // Daily average exceeded
  const dailyAvg30 = last30DaysExpenses / 30;
  if (dailyAvg30 > 0 && todayExpenses > dailyAvg30 * 1.5) {
    alerts.push({
      id: 'daily_exceeded',
      severity: 'medium',
      message: `Tu gasto de hoy ($${todayExpenses.toFixed(2)}) supera en más de un 50% tu promedio diario ($${dailyAvg30.toFixed(2)}).`,
    });
  }

  // Balance projection
  const dailyAverage = last30DaysExpenses / 30;
  let daysRemaining: number | null = null;
  let estimatedDepletionDate: Date | null = null;
  let riskLevel: 'green' | 'yellow' | 'red' = 'green';

  if (dailyAverage > 0 && totalBalance > 0) {
    daysRemaining = Math.floor(totalBalance / dailyAverage);
    estimatedDepletionDate = new Date();
    estimatedDepletionDate.setDate(
      estimatedDepletionDate.getDate() + daysRemaining
    );
    if (daysRemaining < 15) riskLevel = 'red';
    else if (daysRemaining < 30) riskLevel = 'yellow';
    else riskLevel = 'green';
  }

  // Month projection
  const dailyRate =
    dayOfMonth > 0 ? currentMonthExpenses / dayOfMonth : 0;
  const estimatedMonthlyExpense = dailyRate * daysInMonth;
  const estimatedSavings = currentMonthIncome - estimatedMonthlyExpense;

  // Personalized recommendations (rule-based)
  const personalizedRecommendations: string[] = buildRecommendations({
    savingsRate,
    categoryAnalysis,
    daysRemaining,
  });

  return {
    totalBalance,
    currentMonthIncome,
    currentMonthExpenses,
    savingsRate,
    categoryAnalysis,
    alerts,
    balanceProjection: {
      availableBalance: totalBalance,
      dailyAverage,
      estimatedDepletionDate,
      daysRemaining,
      riskLevel,
    },
    monthProjection: {
      estimatedMonthlyExpense,
      estimatedSavings,
      currentMonthIncome,
    },
    personalizedRecommendations,
  };
};

// ─────────────────────────────────────────────
// Rule-Based Recommendations
// ─────────────────────────────────────────────

interface RecommendationInput {
  savingsRate: number;
  categoryAnalysis: CategoryAnalysis[];
  daysRemaining: number | null;
}

const buildRecommendations = (input: RecommendationInput): string[] => {
  const recs: string[] = [];
  const {
    savingsRate,
    categoryAnalysis,
    daysRemaining,
  } = input;

  if (categoryAnalysis.length === 0) {
    recs.push(
      'Comienza registrando tus transacciones para obtener recomendaciones personalizadas.'
    );
    return recs;
  }

  // Savings recommendation
  if (savingsRate < 10) {
    recs.push(
      `Considera separar el 10% de tus ingresos en una cuenta de ahorro al inicio de cada mes.`
    );
  } else if (savingsRate >= 20) {
    recs.push(
      `¡Excelente! Mantienes un nivel de ahorro del ${savingsRate.toFixed(0)}%. Considera invertir parte de ese ahorro.`
    );
  }

  // Top spending category reduction
  if (
    categoryAnalysis.length > 0 &&
    categoryAnalysis[0].percentage > 30
  ) {
    const top = categoryAnalysis[0];
    const possibleSaving = top.amount * 0.15;
    recs.push(
      `Reducir un 15% tus gastos en "${top.label}" podría ahorrarte $${possibleSaving.toFixed(2)} adicionales al mes.`
    );
  }

  // Dining/entertainment specific
  const dining = categoryAnalysis.find((c) =>
    ['dining', 'entertainmet'].includes(c.category)
  );
  if (dining && dining.percentage > 20) {
    recs.push(
      `Tus gastos en "${dining.label}" representan el ${dining.percentage.toFixed(0)}% de tu gasto mensual. Considera cocinar en casa más frecuentemente.`
    );
  }

  // Balance depletion warning
  if (daysRemaining !== null && daysRemaining < 30) {
    recs.push(
      `Tu saldo podría agotarse en ${daysRemaining} días. Revisa tus gastos para extender tu liquidez.`
    );
  }

  // Positive reinforcement
  if (savingsRate >= 15 && categoryAnalysis.length > 0) {
    recs.push(
      `Mantienes un buen control financiero. Sigue registrando tus transacciones para mejores análisis.`
    );
  }

  return recs.slice(0, 4);
};

// ─────────────────────────────────────────────
// Daily Tip Generation
// ─────────────────────────────────────────────

export const generateDailyTip = async (
  uid: string,
  insights: FinancialInsights
): Promise<string> => {
  const hasData =
    insights.currentMonthIncome > 0 ||
    insights.currentMonthExpenses > 0;

  if (!hasData) {
    return 'Aún no tienes transacciones registradas. ¡Empieza registrando tus ingresos y gastos para recibir recomendaciones personalizadas!';
  }

  try {
    const response = await runFinanceAiCapability(uid, 'recommend');
    return response.content;
  } catch {
    // Fallback rule-based tip
    return buildFallbackTip(insights);
  }
};

const buildFallbackTip = (insights: FinancialInsights): string => {
  const { savingsRate, categoryAnalysis, currentMonthIncome } = insights;

  if (currentMonthIncome === 0) {
    return 'Registra tus ingresos y gastos diarios para obtener recomendaciones financieras precisas.';
  }
  if (savingsRate < 0) {
    return 'Tus gastos superan tus ingresos este mes. Revisa tus gastos para evitar un déficit financiero.';
  }
  if (savingsRate < 10) {
    return 'Tu nivel de ahorro es bajo. Intenta reducir gastos no esenciales para mejorar tu situación financiera.';
  }
  if (categoryAnalysis.length > 0 && categoryAnalysis[0].percentage > 40) {
    return `Gastas demasiado en ${categoryAnalysis[0].label}. Considera ajustar ese gasto para mejorar tu equilibrio financiero.`;
  }
  if (savingsRate >= 20) {
    return 'Mantienes un excelente control financiero. Considera invertir parte de tus ahorros para hacer crecer tu patrimonio.';
  }
  return 'Estás cerca de cumplir tus metas de ahorro. ¡Mantén el ritmo!';
};

// ─────────────────────────────────────────────
// Firestore: Daily Tip
// ─────────────────────────────────────────────

export const getDailyTip = async (
  uid: string,
  insights: FinancialInsights
): Promise<string> => {
  try {
    return await generateDailyTip(uid, insights);
  } catch {
    return buildFallbackTip(insights);
  }
};

// ─────────────────────────────────────────────
// Firestore: Recommendation History
// ─────────────────────────────────────────────

export const getRecommendationHistory = async (
  uid: string,
  limitCount = 20
): Promise<RecommendationRecord[]> => {
  try {
    const records = await getApiRecommendationHistory(uid);
    return records.slice(0, limitCount).map((record) => ({
      id: record.id,
      type: record.type || 'recommendation',
      text: record.text || record.recommendation || 'Recomendación financiera',
      date: record.date,
      read: Boolean(record.read),
      createdAt: record.createdAt,
    }));
  } catch {
    return [];
  }
};

export const markRecommendationAsRead = async (
  uid: string,
  recommendationId: string
): Promise<void> => {
  await markApiRecommendationRead(uid, recommendationId);
};
