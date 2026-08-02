import { useFinancialData } from '@/features/financeApi/presentation/hooks/useFinancialData';
import TransactionList from '@/features/transactions/presentation/components/TransactionList';
import EmptyState from '@/shared/components/EmptyState';
import Loading from '@/shared/components/Loading';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { expenseCategories } from '@/shared/constants/data';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { scale, verticalScale } from '@/shared/utils/styling';
import SegmentedControl from '@react-native-segmented-control/segmented-control';
import * as Icons from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-gifted-charts';

import { useAuth } from '../../src/contexts/authContext';

type Period = 'week' | 'month' | 'year';
type ChartMode = 'bars' | 'lines' | 'categories';
type Bucket = { key: string; label: string; income: number; expense: number };

const periodValues: Period[] = ['week', 'month', 'year'];

const parseDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date(0) : date;
};

const money = (value: number) => `$${value.toLocaleString('es-GT', { maximumFractionDigits: 2 })}`;

const Statistics = () => {
  const [periodIndex, setPeriodIndex] = useState(0);
  const [chartMode, setChartMode] = useState<ChartMode>('bars');
  const [walletId, setWalletId] = useState('all');
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { transactions, wallets, loading, error, refresh } = useFinancialData(uid);
  const period = periodValues[periodIndex];

  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    if (period === 'week') start.setDate(start.getDate() - 6);
    if (period === 'month') start.setDate(1);
    if (period === 'year') start.setMonth(0, 1);

    return transactions.filter((transaction) => {
      const date = parseDate(transaction.date);
      return date >= start && date <= now && (walletId === 'all' || transaction.walletId === walletId);
    });
  }, [period, transactions, walletId]);

  const buckets = useMemo<Bucket[]>(() => {
    const now = new Date();
    let result: Bucket[];
    if (period === 'week') {
      result = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(now);
        date.setDate(now.getDate() - (6 - index));
        return { key: date.toLocaleDateString('en-CA'), label: date.toLocaleDateString('es-GT', { weekday: 'short' }).slice(0, 2), income: 0, expense: 0 };
      });
    } else if (period === 'month') {
      const days = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      result = Array.from({ length: Math.ceil(days / 7) }, (_, index) => ({ key: String(index), label: `${index * 7 + 1}-${Math.min((index + 1) * 7, days)}`, income: 0, expense: 0 }));
    } else {
      result = Array.from({ length: 12 }, (_, index) => ({ key: String(index), label: new Date(now.getFullYear(), index, 1).toLocaleDateString('es-GT', { month: 'short' }).slice(0, 3), income: 0, expense: 0 }));
    }

    filteredTransactions.forEach((transaction) => {
      const date = parseDate(transaction.date);
      const key = period === 'week'
        ? date.toLocaleDateString('en-CA')
        : period === 'month'
          ? String(Math.floor((date.getDate() - 1) / 7))
          : String(date.getMonth());
      const bucket = result.find((item) => item.key === key);
      if (!bucket) return;
      if (transaction.type === 'income') bucket.income += Number(transaction.amount || 0);
      if (transaction.type === 'expense') bucket.expense += Number(transaction.amount || 0);
    });
    return result;
  }, [filteredTransactions, period]);

  const totals = useMemo(() => filteredTransactions.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') acc.income += Number(transaction.amount || 0);
      if (transaction.type === 'expense') acc.expense += Number(transaction.amount || 0);
      return acc;
    },
    { income: 0, expense: 0 },
  ), [filteredTransactions]);

  const barData = buckets.flatMap((bucket) => [
    { value: bucket.income, label: bucket.label, frontColor: colors.green, spacing: 3 },
    { value: bucket.expense, frontColor: colors.rose },
  ]);
  const incomeLine = buckets.map((bucket) => ({ value: bucket.income, label: bucket.label }));
  const expenseLine = buckets.map((bucket) => ({ value: bucket.expense, label: bucket.label }));
  const categoryData = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredTransactions.filter((item) => item.type === 'expense').forEach((item) => grouped.set(item.category || 'others', (grouped.get(item.category || 'others') || 0) + Number(item.amount || 0)));
    return [...grouped.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([category, value]) => ({
      value,
      text: `${Math.round((value / Math.max(totals.expense, 1)) * 100)}%`,
      label: expenseCategories[category]?.label || category,
      color: expenseCategories[category]?.bgColor || colors.neutral500,
    }));
  }, [filteredTransactions, totals.expense]);

  const hasData = filteredTransactions.length > 0;
  const chartWidth = Math.max(width - scale(92), scale(250));

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <View><Typo size={12} color={colors.neutral400}>TU ACTIVIDAD</Typo><Typo size={24} fontWeight="900">Estadísticas</Typo></View>
          <View style={styles.headerIcon}><Icons.ChartLineUp size={22} color={colors.blue} weight="duotone" /></View>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}>
          <SegmentedControl values={['7 días', 'Este mes', 'Este año']} selectedIndex={periodIndex} onChange={(event) => setPeriodIndex(event.nativeEvent.selectedSegmentIndex)} tintColor={colors.primary} backgroundColor={colors.surface} appearance="dark" activeFontStyle={{ ...styles.segmentFont, color: colors.neutral900 }} fontStyle={{ ...styles.segmentFont, color: colors.neutral400 }} style={styles.segment} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.walletFilters}>
            <TouchableOpacity onPress={() => setWalletId('all')} style={[styles.walletChip, walletId === 'all' && styles.walletChipActive]}><Typo size={11} fontWeight="700" color={walletId === 'all' ? colors.neutral900 : colors.neutral300}>Todas</Typo></TouchableOpacity>
            {wallets.map((wallet) => <TouchableOpacity key={wallet.id} onPress={() => setWalletId(wallet.id)} style={[styles.walletChip, walletId === wallet.id && styles.walletChipActive]}><Typo size={11} fontWeight="700" color={walletId === wallet.id ? colors.neutral900 : colors.neutral300}>{wallet.name}</Typo></TouchableOpacity>)}
          </ScrollView>

          <View style={styles.summaryRow}>
            <View style={styles.summaryCard}><Typo size={10} color={colors.neutral400}>INGRESOS</Typo><Typo size={17} color={colors.green} fontWeight="900">{money(totals.income)}</Typo></View>
            <View style={styles.summaryCard}><Typo size={10} color={colors.neutral400}>GASTOS</Typo><Typo size={17} color={colors.rose} fontWeight="900">{money(totals.expense)}</Typo></View>
            <View style={styles.summaryCard}><Typo size={10} color={colors.neutral400}>BALANCE</Typo><Typo size={17} color={totals.income - totals.expense >= 0 ? colors.primary : colors.rose} fontWeight="900">{money(totals.income - totals.expense)}</Typo></View>
          </View>

          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <View><Typo size={11} color={colors.neutral400}>VISUALIZACIÓN</Typo><Typo size={18} fontWeight="900">{chartMode === 'bars' ? 'Ingresos vs. gastos' : chartMode === 'lines' ? 'Tendencia del periodo' : 'Gastos por categoría'}</Typo></View>
            </View>
            <View style={styles.chartModes}>
              {([['bars', Icons.ChartBar, 'Comparar'], ['lines', Icons.ChartLine, 'Tendencia'], ['categories', Icons.ChartDonut, 'Categorías']] as const).map(([mode, Icon, label]) => (
                <TouchableOpacity accessibilityLabel={`Ver ${label}`} key={mode} onPress={() => setChartMode(mode)} style={[styles.modeButton, chartMode === mode && styles.modeButtonActive]}>
                  <Icon size={16} color={chartMode === mode ? colors.neutral900 : colors.neutral400} weight="bold" />
                  <Typo size={10} color={chartMode === mode ? colors.neutral900 : colors.neutral400} fontWeight="800">{label}</Typo>
                </TouchableOpacity>
              ))}
            </View>
            {chartMode !== 'categories' && <View style={styles.legend}><View style={[styles.legendDot, { backgroundColor: colors.green }]} /><Typo size={10} color={colors.neutral400}>Ingresos</Typo><View style={[styles.legendDot, { backgroundColor: colors.rose }]} /><Typo size={10} color={colors.neutral400}>Gastos</Typo></View>}
            <View style={styles.chartContainer}>
              {loading ? <Loading color={colors.primary} /> : error ? <EmptyState title="No pudimos cargar tus datos" description={error} /> : !hasData ? <EmptyState title="Aún no hay datos en este periodo" description="Prueba otro periodo o billetera." /> : chartMode === 'bars' ? (
                <BarChart data={barData} width={chartWidth} barWidth={period === 'year' ? scale(6) : scale(11)} spacing={period === 'year' ? scale(5) : scale(10)} roundedTop hideRules yAxisLabelPrefix="$" yAxisThickness={0} xAxisThickness={0} yAxisLabelWidth={scale(42)} yAxisTextStyle={styles.axisText} xAxisLabelTextStyle={styles.axisText} noOfSections={4} minHeight={4} />
              ) : chartMode === 'lines' ? (
                <LineChart data={incomeLine} data2={expenseLine} width={chartWidth} color1={colors.green} color2={colors.rose} thickness={3} hideRules yAxisLabelPrefix="$" yAxisThickness={0} xAxisThickness={0} yAxisLabelWidth={scale(42)} yAxisTextStyle={styles.axisText} xAxisLabelTextStyle={styles.axisText} curved areaChart startFillColor1={`${colors.green}30`} startFillColor2={`${colors.rose}22`} endFillColor1="transparent" endFillColor2="transparent" />
              ) : categoryData.length ? (
                <View style={styles.pieRow}><PieChart data={categoryData} donut radius={scale(78)} innerRadius={scale(48)} centerLabelComponent={() => <View style={{ alignItems: 'center' }}><Typo size={10} color={colors.neutral400}>Gastos</Typo><Typo size={14} fontWeight="900">{money(totals.expense)}</Typo></View>} /><View style={styles.categoryLegend}>{categoryData.map((item) => <View key={item.label} style={styles.categoryLegendItem}><View style={[styles.legendDot, { backgroundColor: item.color }]} /><Typo size={10} color={colors.neutral300} style={{ flex: 1 }}>{item.label}</Typo><Typo size={10} fontWeight="700">{item.text}</Typo></View>)}</View></View>
              ) : <EmptyState title="Sin gastos para clasificar" description="La gráfica aparecerá cuando registres gastos." />}
            </View>
          </View>

          <TransactionList title="Movimientos del periodo" emptyListMessage="No hay transacciones en esta selección" data={filteredTransactions} loading={loading} />
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default Statistics;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  pageHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacingY._10 },
  headerIcon: { width: 44, height: 44, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.blue}18` },
  scroll: { gap: spacingY._15, paddingTop: spacingY._7, paddingBottom: verticalScale(100) },
  segment: { height: verticalScale(42), borderRadius: radius._12 },
  segmentFont: { fontSize: verticalScale(11), fontWeight: '700' },
  walletFilters: { gap: spacingX._7 },
  walletChip: { paddingHorizontal: spacingX._12, height: verticalScale(32), justifyContent: 'center', borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  walletChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  summaryRow: { flexDirection: 'row', gap: spacingX._7 },
  summaryCard: { flex: 1, backgroundColor: colors.surface, padding: spacingX._10, borderRadius: radius._15, borderWidth: 1, borderColor: colors.border, gap: 4 },
  chartCard: { backgroundColor: colors.surface, borderRadius: radius._17, padding: spacingX._15, borderWidth: 1, borderColor: colors.border },
  chartHeader: { gap: spacingY._5 },
  chartModes: { width: '100%', flexDirection: 'row', gap: 4, padding: 4, marginTop: spacingY._12, borderRadius: radius._15, backgroundColor: colors.background },
  modeButton: { flex: 1, minHeight: verticalScale(38), flexDirection: 'row', gap: 5, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center' },
  modeButtonActive: { backgroundColor: colors.primary },
  legend: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacingY._10 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  chartContainer: { minHeight: verticalScale(245), justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginTop: spacingY._10 },
  axisText: { color: colors.neutral500, fontSize: 9 },
  pieRow: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  categoryLegend: { flex: 1, marginLeft: spacingX._15, gap: spacingY._7 },
  categoryLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
