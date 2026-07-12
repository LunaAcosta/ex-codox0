import Button from '@/components/Button'
import FinancialAssistantModal from '@/components/FinancialAssistantModal'
import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import useFetchData from '@/hooks/useFetchData'
import { where } from 'firebase/firestore'
import * as Icons from 'phosphor-react-native'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native'
import { useAuth } from '../../../contexts/authContext'
import {
  analyzeFinancials,
  FinancialInsights,
  getDailyTip,
  getRecommendationHistory,
  markRecommendationAsRead,
  RecommendationRecord,
} from '../../../services/recommendationService'
import { TransactionType, WalletType } from '../../../types'
import { scale, verticalScale } from '../../../utils/styling'

// ─────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────

const SectionCard = ({
  children,
  style,
}: {
  children: React.ReactNode
  style?: object
}) => <View style={[cardStyles.card, style]}>{children}</View>

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.neutral800,
    borderRadius: radius._10,
    padding: spacingX._15,
    marginBottom: spacingY._12,
  },
})

const SectionTitle = ({
  icon,
  title,
}: {
  icon: React.ReactNode
  title: string
}) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(8), marginBottom: spacingY._10 }}>
    {icon}
    <Typo size={14} fontWeight="700" color={colors.text}>
      {title}
    </Typo>
  </View>
)

const AlertBadge = ({ severity }: { severity: 'low' | 'medium' | 'high' }) => {
  const colorMap = { low: colors.green, medium: colors.primary, high: colors.rose }
  return (
    <View
      style={{
        width: scale(8),
        height: scale(8),
        borderRadius: 4,
        backgroundColor: colorMap[severity],
        marginRight: scale(8),
        marginTop: verticalScale(4),
      }}
    />
  )
}

const RiskIndicator = ({ level }: { level: 'green' | 'yellow' | 'red' }) => {
  const colorMap = { green: '#16a34a', yellow: '#ca8a04', red: colors.rose }
  const labelMap = { green: 'Bajo', yellow: 'Moderado', red: 'Alto' }
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: scale(6),
        backgroundColor: `${colorMap[level]}22`,
        paddingHorizontal: scale(10),
        paddingVertical: verticalScale(4),
        borderRadius: radius._6,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: scale(8),
          height: scale(8),
          borderRadius: 4,
          backgroundColor: colorMap[level],
        }}
      />
      <Typo size={11} color={colorMap[level]} fontWeight="600">
        Riesgo {labelMap[level]}
      </Typo>
    </View>
  )
}

// ─────────────────────────────────────────────
// Main Screen
// ─────────────────────────────────────────────

const CodoxIA = () => {
  const [showAssistant, setShowAssistant] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [insights, setInsights] = useState<FinancialInsights | null>(null)
  const [dailyTip, setDailyTip] = useState<string>('')
  const [history, setHistory] = useState<RecommendationRecord[]>([])
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingTip, setLoadingTip] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRecs, setExpandedRecs] = useState(false)
  const fadeAnim = useRef(new Animated.Value(0)).current

  const { user } = useAuth()
  const uid = user?.uid ?? ''

  const transactionConstraints = useMemo(() => [where('uid', '==', uid)], [uid])
  const walletConstraints = useMemo(() => [where('uid', '==', uid)], [uid])

  const { data: transactions, loading: transactionsLoading } =
    useFetchData<TransactionType>('transactions', transactionConstraints)

  const { data: wallets, loading: walletsLoading } =
    useFetchData<WalletType>('wallets', walletConstraints)

  const dataReady = !transactionsLoading && !walletsLoading

  const computeInsights = useCallback(async () => {
    if (!dataReady || !uid) return
    setLoadingInsights(true)
    const result = analyzeFinancials(transactions, wallets)
    setInsights(result)
    setLoadingInsights(false)

    setLoadingTip(true)
    const tip = await getDailyTip(uid, result)
    setDailyTip(tip)
    setLoadingTip(false)

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [dataReady, uid, transactions, wallets])

  useEffect(() => {
    computeInsights()
  }, [computeInsights])

  const loadHistory = useCallback(async () => {
    if (!uid) return
    const h = await getRecommendationHistory(uid, 20)
    setHistory(h)
  }, [uid])

  useEffect(() => {
    if (showHistory) loadHistory()
  }, [showHistory, loadHistory])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await computeInsights()
    if (showHistory) await loadHistory()
    setRefreshing(false)
  }, [computeInsights, loadHistory, showHistory])

  const handleMarkRead = async (id: string) => {
    if (!uid) return
    await markRecommendationAsRead(uid, id)
    setHistory((prev) =>
      prev.map((r) => (r.id === id ? { ...r, read: true } : r))
    )
  }

  const formatDate = (date: Date | null) => {
    if (!date) return '—'
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
    })
  }

  const formatCurrency = (n: number) =>
    `$${Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  const isLoading = transactionsLoading || walletsLoading || loadingInsights

  return (
    <ScreenWrapper>
      <View style={styles.wrapper}>
        <Header title="Codox IA" style={{ marginBottom: spacingY._10 }} />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Typo size={13} color={colors.neutral400} style={{ marginTop: spacingY._10 }}>
                Analizando tus finanzas…
              </Typo>
            </View>
          ) : (
            <Animated.View style={{ opacity: fadeAnim }}>
              {/* ── 1. Financial Status ── */}
              {insights && (
                <SectionCard style={styles.statusCard}>
                  <Typo size={12} color={colors.neutral400} fontWeight="600">
                    ESTADO FINANCIERO ACTUAL
                  </Typo>
                  <View style={styles.statusRow}>
                    <View style={styles.statItem}>
                      <Typo size={11} color={colors.neutral400}>Saldo total</Typo>
                      <Typo size={18} fontWeight="700" color={colors.primary}>
                        {formatCurrency(insights.totalBalance)}
                      </Typo>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Typo size={11} color={colors.neutral400}>Ingresos mes</Typo>
                      <Typo size={18} fontWeight="700" color={colors.green}>
                        {formatCurrency(insights.currentMonthIncome)}
                      </Typo>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Typo size={11} color={colors.neutral400}>Gastos mes</Typo>
                      <Typo size={18} fontWeight="700" color={colors.rose}>
                        {formatCurrency(insights.currentMonthExpenses)}
                      </Typo>
                    </View>
                  </View>

                  {/* Savings bar */}
                  {insights.currentMonthIncome > 0 && (
                    <View style={{ marginTop: spacingY._10 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: verticalScale(4) }}>
                        <Typo size={11} color={colors.neutral400}>Tasa de ahorro</Typo>
                        <Typo size={11} fontWeight="600"
                          color={insights.savingsRate >= 15 ? colors.green : insights.savingsRate >= 5 ? colors.primary : colors.rose}>
                          {insights.savingsRate.toFixed(1)}%
                        </Typo>
                      </View>
                      <View style={styles.progressBg}>
                        <View
                          style={[
                            styles.progressFill,
                            {
                              width: `${Math.min(Math.max(insights.savingsRate, 0), 100)}%` as any,
                              backgroundColor:
                                insights.savingsRate >= 15
                                  ? colors.green
                                  : insights.savingsRate >= 5
                                    ? colors.primary
                                    : colors.rose,
                            },
                          ]}
                        />
                      </View>
                    </View>
                  )}
                </SectionCard>
              )}
              {/* ── 4. Category Analysis ── */}
              {insights && insights.categoryAnalysis.length > 0 && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.ChartPieSlice color={colors.primary} weight="fill" size={scale(18)} />}
                    title="Análisis de categorías"
                  />
                  {insights.categoryAnalysis.slice(0, 5).map((cat) => (
                    <View key={cat.category} style={styles.catRow}>
                      <View style={[styles.catDot, { backgroundColor: cat.bgColor }]} />
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          <Typo size={12} color={colors.text}>{cat.label}</Typo>
                          <Typo size={12} fontWeight="600" color={colors.text}>
                            {formatCurrency(cat.amount)}
                          </Typo>
                        </View>
                        <View style={styles.progressBg}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(cat.percentage, 100)}%` as any,
                                backgroundColor: cat.bgColor,
                              },
                            ]}
                          />
                        </View>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 2 }}>
                          <Typo size={10} color={colors.neutral400}>{cat.percentage.toFixed(1)}% del gasto</Typo>
                          {cat.trendPercent !== 0 && (
                            <Typo
                              size={10}
                              color={cat.trendPercent > 0 ? colors.rose : colors.green}
                            >
                              {cat.trendPercent > 0 ? '▲' : '▼'}{' '}
                              {Math.abs(cat.trendPercent).toFixed(0)}% vs mes anterior
                            </Typo>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                </SectionCard>
              )}

              {/* ── 2. Daily Tip ── */}
              {transactions.length > 0 && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.LightbulbFilament color={colors.primary} weight="fill" size={scale(18)} />}
                    title="Consejo financiero del día"
                  />
                  {loadingTip ? (
                    <ActivityIndicator color={colors.primary} size="small" />
                  ) : (
                    <Typo size={13} color={colors.textLight} style={{ lineHeight: 20 }}>
                      {dailyTip || 'Cargando consejo…'}
                    </Typo>
                  )}
                </SectionCard>
              )}

              {/* ── 3. Alerts ── */}
              {insights && insights.alerts.length > 0 && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.WarningCircle color={colors.rose} weight="fill" size={scale(18)} />}
                    title="Alertas inteligentes"
                  />
                  {insights.alerts.map((alert) => (
                    <View key={alert.id} style={styles.alertRow}>
                      <AlertBadge severity={alert.severity} />
                      <Typo size={12} color={colors.textLight} style={{ flex: 1, lineHeight: 18 }}>
                        {alert.message}
                      </Typo>
                    </View>
                  ))}
                </SectionCard>
              )}

              {insights && insights.alerts.length === 0 && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.WarningCircle color={colors.green} weight="fill" size={scale(18)} />}
                    title="Alertas inteligentes"
                  />
                  <View style={styles.emptyState}>
                    <Icons.CheckCircle color={colors.green} weight="fill" size={scale(24)} />
                    <Typo size={12} color={colors.neutral400} style={{ marginTop: spacingY._5 }}>
                      Sin alertas activas. ¡Buen trabajo!
                    </Typo>
                  </View>
                </SectionCard>
              )}



              {/* ── 5. Balance Projection ── */}
              {insights && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.CalendarCheck color={colors.primary} weight="fill" size={scale(18)} />}
                    title="Proyección de agotamiento de saldo"
                  />
                  {insights.balanceProjection.dailyAverage > 0 ? (
                    <>
                      <View style={styles.projGrid}>
                        <View style={styles.projItem}>
                          <Typo size={10} color={colors.neutral400}>Saldo disponible</Typo>
                          <Typo size={15} fontWeight="700" color={colors.text}>
                            {formatCurrency(insights.balanceProjection.availableBalance)}
                          </Typo>
                        </View>
                        <View style={styles.projItem}>
                          <Typo size={10} color={colors.neutral400}>Promedio diario</Typo>
                          <Typo size={15} fontWeight="700" color={colors.text}>
                            {formatCurrency(insights.balanceProjection.dailyAverage)}
                          </Typo>
                        </View>
                        <View style={styles.projItem}>
                          <Typo size={10} color={colors.neutral400}>Días restantes</Typo>
                          <Typo size={15} fontWeight="700"
                            color={
                              insights.balanceProjection.riskLevel === 'red'
                                ? colors.rose
                                : insights.balanceProjection.riskLevel === 'yellow'
                                  ? colors.primary
                                  : colors.green
                            }
                          >
                            {insights.balanceProjection.daysRemaining ?? '—'} días
                          </Typo>
                        </View>
                        <View style={styles.projItem}>
                          <Typo size={10} color={colors.neutral400}>Fecha estimada</Typo>
                          <Typo size={13} fontWeight="600" color={colors.text}>
                            {formatDate(insights.balanceProjection.estimatedDepletionDate)}
                          </Typo>
                        </View>
                      </View>
                      <View style={{ marginTop: spacingY._10 }}>
                        <RiskIndicator level={insights.balanceProjection.riskLevel} />
                      </View>
                      {insights.balanceProjection.daysRemaining !== null && (
                        <Typo size={12} color={colors.textLighter} style={{ marginTop: spacingY._10, lineHeight: 18 }}>
                          Si mantienes tus hábitos actuales de gasto, tu saldo podría agotarse aproximadamente el{' '}
                          <Typo size={12} fontWeight="700" color={colors.primary}>
                            {formatDate(insights.balanceProjection.estimatedDepletionDate)}
                          </Typo>
                          {' '}({insights.balanceProjection.daysRemaining} días restantes).
                        </Typo>
                      )}
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Typo size={12} color={colors.neutral400}>
                        Registra gastos para calcular la proyección de saldo.
                      </Typo>
                    </View>
                  )}
                </SectionCard>
              )}

              {/* ── 6. Month Projection ── */}
              {insights && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.TrendUp color={colors.primary} weight="fill" size={scale(18)} />}
                    title="Proyección de fin de mes"
                  />
                  {insights.currentMonthExpenses > 0 ? (
                    <View style={styles.projGrid}>
                      <View style={styles.projItem}>
                        <Typo size={10} color={colors.neutral400}>Gasto proyectado</Typo>
                        <Typo size={15} fontWeight="700" color={colors.rose}>
                          {formatCurrency(insights.monthProjection.estimatedMonthlyExpense)}
                        </Typo>
                      </View>
                      <View style={styles.projItem}>
                        <Typo size={10} color={colors.neutral400}>Ahorro proyectado</Typo>
                        <Typo
                          size={15}
                          fontWeight="700"
                          color={insights.monthProjection.estimatedSavings >= 0 ? colors.green : colors.rose}
                        >
                          {insights.monthProjection.estimatedSavings >= 0 ? '' : '-'}
                          {formatCurrency(insights.monthProjection.estimatedSavings)}
                        </Typo>
                      </View>
                      <View style={[styles.projItem, { width: '100%' }]}>
                        <Typo size={10} color={colors.neutral400}>Ingresos del mes</Typo>
                        <Typo size={15} fontWeight="700" color={colors.green}>
                          {formatCurrency(insights.monthProjection.currentMonthIncome)}
                        </Typo>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.emptyState}>
                      <Typo size={12} color={colors.neutral400}>
                        Sin datos suficientes para proyectar el mes.
                      </Typo>
                    </View>
                  )}
                </SectionCard>
              )}

              {/* ── 7. Personalized Recommendations ── */}
              {insights && insights.personalizedRecommendations.length > 0 && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.Sparkle color={colors.primary} weight="fill" size={scale(18)} />}
                    title="Recomendaciones personalizadas"
                  />
                  {(expandedRecs
                    ? insights.personalizedRecommendations
                    : insights.personalizedRecommendations.slice(0, 2)
                  ).map((rec, i) => (
                    <View key={i} style={styles.recRow}>
                      <View style={styles.recBullet}>
                        <Typo size={11} color={colors.neutral900} fontWeight="700">{i + 1}</Typo>
                      </View>
                      <Typo size={12} color={colors.textLight} style={{ flex: 1, lineHeight: 18 }}>
                        {rec}
                      </Typo>
                    </View>
                  ))}
                  {insights.personalizedRecommendations.length > 2 && (
                    <TouchableOpacity
                      onPress={() => setExpandedRecs((v) => !v)}
                      style={{ alignSelf: 'center', marginTop: spacingY._7 }}
                    >
                      <Typo size={12} color={colors.primary} fontWeight="600">
                        {expandedRecs ? 'Ver menos' : `Ver ${insights.personalizedRecommendations.length - 2} más`}
                      </Typo>
                    </TouchableOpacity>
                  )}
                </SectionCard>
              )}

              {/* ── 8. Recommendation History ── */}
              {transactions.length > 0 && (
                <SectionCard>
                  <Pressable
                    onPress={() => setShowHistory((v) => !v)}
                    style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
                  >
                    <SectionTitle
                      icon={<Icons.ClockCounterClockwise color={colors.neutral400} weight="fill" size={scale(18)} />}
                      title="Historial de recomendaciones"
                    />
                    <Icons.CaretDown
                      color={colors.neutral400}
                      size={scale(16)}
                      style={{
                        transform: [{ rotate: showHistory ? '180deg' : '0deg' }],
                      }}
                    />
                  </Pressable>

                  {showHistory && (
                    <>
                      {history.length === 0 ? (
                        <View style={styles.emptyState}>
                          <Typo size={12} color={colors.neutral400}>No hay historial aún.</Typo>
                        </View>
                      ) : (
                        history.map((record) => (
                          <TouchableOpacity
                            key={record.id}
                            onPress={() => record.id && !record.read && handleMarkRead(record.id)}
                            style={[
                              styles.historyRow,
                              record.read && { opacity: 0.6 },
                            ]}
                          >
                            <View style={{ flex: 1 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: scale(6), marginBottom: 2 }}>
                                <View
                                  style={[
                                    styles.historyTypeBadge,
                                    {
                                      backgroundColor:
                                        record.type === 'daily_tip'
                                          ? `${colors.primary}33`
                                          : record.type === 'alert'
                                            ? `${colors.rose}33`
                                            : `${colors.green}33`,
                                    },
                                  ]}
                                >
                                  <Typo
                                    size={9}
                                    fontWeight="600"
                                    color={
                                      record.type === 'daily_tip'
                                        ? colors.primary
                                        : record.type === 'alert'
                                          ? colors.rose
                                          : colors.green
                                    }
                                  >
                                    {record.type === 'daily_tip'
                                      ? 'Consejo'
                                      : record.type === 'alert'
                                        ? 'Alerta'
                                        : 'Recomendación'}
                                  </Typo>
                                </View>
                                <Typo size={10} color={colors.neutral400}>{record.date}</Typo>
                                {!record.read && (
                                  <View style={styles.unreadDot} />
                                )}
                              </View>
                              <Typo size={12} color={colors.textLight} style={{ lineHeight: 17 }}>
                                {record.text}
                              </Typo>
                            </View>
                          </TouchableOpacity>
                        ))
                      )}
                    </>
                  )}
                </SectionCard>
              )}

              {/* bottom padding */}
              <View style={{ height: verticalScale(80) }} />
            </Animated.View>
          )}
        </ScrollView>

        {/* FAB – Chat assistant */}
        <Button style={styles.floatingButton} onPress={() => setShowAssistant(true)}>
          <Icons.ChatCircleDots color={colors.white} weight="fill" size={verticalScale(24)} />
        </Button>
      </View>

      <FinancialAssistantModal
        isVisible={showAssistant}
        onClose={() => setShowAssistant(false)}
        transactions={transactions}
        wallets={wallets}
      />
    </ScreenWrapper>
  )
}

export default CodoxIA

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  scroll: {
    paddingTop: spacingY._5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: verticalScale(80),
  },
  statusCard: {
    borderWidth: 1,
    borderColor: `${colors.primary}44`,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacingY._10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: verticalScale(3),
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.neutral700,
    marginHorizontal: spacingX._5,
  },
  progressBg: {
    height: verticalScale(5),
    backgroundColor: colors.neutral700,
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: verticalScale(3),
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacingY._7,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
    paddingVertical: spacingY._7,
  },
  catDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: 5,
    marginTop: verticalScale(4),
  },
  projGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingY._10,
  },
  projItem: {
    width: '47%',
    gap: verticalScale(3),
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacingY._12,
    gap: spacingY._5,
  },
  recRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: scale(10),
    paddingVertical: spacingY._7,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  recBullet: {
    width: scale(20),
    height: scale(20),
    borderRadius: 10,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: verticalScale(1),
  },
  historyRow: {
    flexDirection: 'row',
    paddingVertical: spacingY._10,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
  historyTypeBadge: {
    paddingHorizontal: scale(6),
    paddingVertical: verticalScale(2),
    borderRadius: radius._3,
  },
  unreadDot: {
    width: scale(6),
    height: scale(6),
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: 'absolute',
    bottom: verticalScale(30),
    right: verticalScale(30),
  },
})