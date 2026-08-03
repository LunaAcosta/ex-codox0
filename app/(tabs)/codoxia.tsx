import FinancialAssistantModal from '@/features/codoxia/presentation/components/FinancialAssistantModal'
import { useFinancialData } from '@/features/financeApi/presentation/hooks/useFinancialData'
import Button from '@/shared/components/Button'
import ScreenWrapper from '@/shared/components/ScreenWrapper'
import Typo from '@/shared/components/Typo'
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme'
import { scale, verticalScale } from '@/shared/utils/styling'
import * as Icons from 'phosphor-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
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
import { useAuth } from '../../src/contexts/authContext'
import {
  analyzeFinancials,
  getDailyTip,
  getRecommendationHistory,
  markRecommendationAsRead,
  RecommendationRecord,
} from '../../src/features/recommendations/application/services/recommendationService'

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
    borderRadius: radius._20,
    padding: spacingX._15,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
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
  const [activeView, setActiveView] = useState<'today' | 'future' | 'guidance'>('today')
  const [showAssistant, setShowAssistant] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [dailyTip, setDailyTip] = useState<string>('')
  const [history, setHistory] = useState<RecommendationRecord[]>([])
  const [loadingTip, setLoadingTip] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedRecs, setExpandedRecs] = useState(false)
  const [fadeAnim] = useState(() => new Animated.Value(0))

  const { user } = useAuth()
  const uid = user?.uid ?? ''

  const { transactions: apiTransactions, wallets: apiWallets, loading: financialDataLoading, refresh: refreshFinancialData } = useFinancialData(uid)
  const transactions = useMemo(() => apiTransactions.map((transaction) => ({ ...transaction, image: transaction.image as any })), [apiTransactions])
  const wallets = useMemo(() => apiWallets.map((wallet) => ({ ...wallet, image: wallet.image || null, created: wallet.created ? new Date(wallet.created) : undefined })), [apiWallets])
  const dataReady = !financialDataLoading
  const insights = useMemo(
    () => dataReady && uid ? analyzeFinancials(transactions, wallets) : null,
    [dataReady, transactions, uid, wallets],
  )
  const displayAlerts = useMemo(() => {
    if (!insights) return []
    if (insights.alerts.length) return insights.alerts
    if (!transactions.length) return [{ id: 'start', severity: 'low' as const, message: 'Registra ingresos y gastos para que Codox pueda vigilar cambios importantes.' }]
    if (insights.currentMonthIncome === 0 && insights.currentMonthExpenses > 0) return [{ id: 'income_missing', severity: 'medium' as const, message: `Tienes $${insights.currentMonthExpenses.toFixed(2)} en gastos este mes y aún no hay ingresos registrados.` }]
    if (insights.savingsRate >= 20) return [{ id: 'healthy_saving', severity: 'low' as const, message: `Este mes conservas el ${insights.savingsRate.toFixed(0)}% de tus ingresos. Tu ritmo de ahorro es saludable.` }]
    const topCategory = insights.categoryAnalysis[0]
    if (topCategory) return [{ id: 'top_category', severity: 'low' as const, message: `${topCategory.label} es tu principal categoría de gasto con $${topCategory.amount.toFixed(2)} este mes.` }]
    return [{ id: 'stable', severity: 'low' as const, message: `Tu saldo disponible es de $${insights.totalBalance.toFixed(2)} y no se detectan cambios de riesgo.` }]
  }, [insights, transactions.length])

  useEffect(() => {
    if (!insights || !uid) return

    let active = true
    void getDailyTip(uid, insights).then((tip) => {
      if (!active) return
      setDailyTip(tip)
      setLoadingTip(false)
    })

    fadeAnim.setValue(0)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()

    return () => { active = false }
  }, [fadeAnim, insights, uid])

  const loadHistory = useCallback(async () => {
    if (!uid) return
    const h = await getRecommendationHistory(uid, 20)
    setHistory(h)
  }, [uid])

  const toggleHistory = useCallback(async () => {
    const willShow = !showHistory
    setShowHistory(willShow)
    if (willShow) await loadHistory()
  }, [loadHistory, showHistory])

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await refreshFinancialData()
    if (insights && uid) {
      setLoadingTip(true)
      setDailyTip(await getDailyTip(uid, insights))
      setLoadingTip(false)
    }
    if (showHistory) await loadHistory()
    setRefreshing(false)
  }, [insights, loadHistory, refreshFinancialData, showHistory, uid])

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

  const isLoading = financialDataLoading

  return (
    <ScreenWrapper>
      <View style={styles.wrapper}>
        <View style={styles.pageHeader}>
          <View style={{ flex: 1 }}><Typo size={12} color={colors.neutral400}>BIENESTAR FINANCIERO</Typo><Typo size={24} fontWeight="900">Tu panorama</Typo><Typo size={11} color={colors.neutral400}>Lo importante, explicado de forma simple</Typo></View>
          <View style={styles.headerIcon}><Icons.Sparkle size={21} color={colors.primary} weight="fill" /></View>
        </View>

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
          <TouchableOpacity activeOpacity={0.82} style={styles.assistantBanner} onPress={() => setShowAssistant(true)}>
            <View style={styles.assistantBannerIcon}><Icons.ChatCircleDots size={25} color={colors.primary} weight="duotone" /></View>
            <View style={{ flex: 1 }}><Typo size={15} fontWeight="800">Pregunta a tu asistente</Typo><Typo size={11} color={colors.neutral400}>Respuestas breves basadas en tus datos</Typo></View>
            <Icons.ArrowRight size={19} color={colors.primary} weight="bold" />
          </TouchableOpacity>
          <View style={styles.viewSelector}>
            {([
              { key: 'today' as const, label: 'Hoy', icon: Icons.Heart },
              { key: 'future' as const, label: 'Futuro', icon: Icons.CalendarCheck },
              { key: 'guidance' as const, label: 'Consejos', icon: Icons.LightbulbFilament },
            ]).map((option) => {
              const OptionIcon = option.icon
              const selected = activeView === option.key
              return <Pressable key={option.key} accessibilityRole="tab" accessibilityState={{ selected }} onPress={() => setActiveView(option.key)} style={[styles.viewOption, selected && styles.viewOptionActive]}><OptionIcon size={16} color={selected ? colors.neutral900 : colors.neutral400} weight="fill" /><Typo size={11} color={selected ? colors.neutral900 : colors.neutral400} fontWeight="800">{option.label}</Typo></Pressable>
            })}
          </View>
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
              {activeView === 'today' && insights && (
                <SectionCard style={styles.statusCard}>
                  <View style={styles.balanceHeading}>
                    <View><Typo size={10} color={colors.neutral400} fontWeight="700">SALDO DISPONIBLE</Typo><Typo size={27} fontWeight="900" color={colors.primary}>{formatCurrency(insights.totalBalance)}</Typo></View>
                    <View style={[styles.healthPill, { backgroundColor: `${insights.savingsRate >= 15 ? colors.green : insights.savingsRate >= 5 ? colors.primary : colors.rose}18` }]}><Icons.Heartbeat size={15} color={insights.savingsRate >= 15 ? colors.green : insights.savingsRate >= 5 ? colors.primary : colors.rose} weight="fill" /><Typo size={9} color={insights.savingsRate >= 15 ? colors.green : insights.savingsRate >= 5 ? colors.primary : colors.rose} fontWeight="900">{insights.savingsRate >= 15 ? 'Buen ritmo' : insights.savingsRate >= 5 ? 'En progreso' : 'Revisar gastos'}</Typo></View>
                  </View>
                  <View style={styles.statusRow}>
                    <View style={styles.statItem}>
                      <View style={[styles.miniStatIcon, { backgroundColor: `${colors.green}16` }]}><Icons.ArrowDownLeft size={16} color={colors.green} weight="bold" /></View>
                      <View><Typo size={10} color={colors.neutral400}>Ingresó este mes</Typo><Typo size={15} fontWeight="800" color={colors.green}>{formatCurrency(insights.currentMonthIncome)}</Typo></View>
                    </View>
                    <View style={styles.statItem}>
                      <View style={[styles.miniStatIcon, { backgroundColor: `${colors.rose}16` }]}><Icons.ArrowUpRight size={16} color={colors.rose} weight="bold" /></View>
                      <View><Typo size={10} color={colors.neutral400}>Gastó este mes</Typo><Typo size={15} fontWeight="800" color={colors.rose}>{formatCurrency(insights.currentMonthExpenses)}</Typo></View>
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
              {activeView === 'today' && insights && insights.categoryAnalysis.length > 0 && (
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
              {activeView === 'guidance' && transactions.length > 0 && (
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
              {activeView === 'today' && insights && (
                <SectionCard>
                  <SectionTitle
                    icon={<Icons.WarningCircle color={displayAlerts.some((alert) => alert.severity === 'high') ? colors.rose : colors.primary} weight="fill" size={scale(18)} />}
                    title="Alertas inteligentes"
                  />
                  {displayAlerts.map((alert) => (
                    <View key={alert.id} style={styles.alertRow}>
                      <AlertBadge severity={alert.severity} />
                      <Typo size={12} color={colors.textLight} style={{ flex: 1, lineHeight: 18 }}>
                        {alert.message}
                      </Typo>
                    </View>
                  ))}
                </SectionCard>
              )}

              {activeView === 'guidance' && transactions.length === 0 && (
                <SectionCard style={styles.guidanceEmpty}>
                  <View style={styles.guidanceEmptyIcon}><Icons.LightbulbFilament size={25} color={colors.primary} weight="fill" /></View>
                  <Typo size={14} fontWeight="800">Tus consejos aparecerán aquí</Typo>
                  <Typo size={11} color={colors.neutral400} style={{ textAlign: 'center' }}>Registra algunos ingresos y gastos para recibir orientación basada en tu actividad.</Typo>
                </SectionCard>
              )}



              {/* ── 5. Balance Projection ── */}
              {activeView === 'future' && insights && (
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
              {activeView === 'future' && insights && (
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
              {activeView === 'guidance' && insights && insights.personalizedRecommendations.length > 0 && (
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
              {activeView === 'guidance' && transactions.length > 0 && (
                <SectionCard>
                  <Pressable
                    onPress={toggleHistory}
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
          <Icons.ChatCircleDots color={colors.neutral900} weight="fill" size={verticalScale(20)} />
          <Typo size={12} color={colors.neutral900} fontWeight="800">Preguntar</Typo>
        </Button>
      </View>

      <FinancialAssistantModal
        isVisible={showAssistant}
        onClose={() => setShowAssistant(false)}
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
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacingY._10 },
  headerIcon: { width: 44, height: 44, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  assistantBanner: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10, padding: spacingX._12, borderRadius: radius._17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginBottom: spacingY._15 },
  assistantBannerIcon: { width: 44, height: 44, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  viewSelector: { flexDirection: 'row', gap: spacingX._7, padding: 5, marginBottom: spacingY._15, borderRadius: radius._17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  viewOption: { flex: 1, minHeight: verticalScale(42), flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, borderRadius: radius._12 },
  viewOptionActive: { backgroundColor: colors.primary },
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
    padding: spacingX._20,
  },
  balanceHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacingX._10 },
  healthPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 6, borderRadius: radius._20 },
  statusRow: {
    flexDirection: 'row',
    gap: spacingX._10,
    marginTop: spacingY._10,
  },
  statItem: {
    flex: 1,
    minHeight: verticalScale(58),
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._7,
    padding: spacingX._10,
    borderRadius: radius._15,
    backgroundColor: colors.surfaceElevated,
  },
  miniStatIcon: { width: 30, height: 30, borderRadius: radius._10, alignItems: 'center', justifyContent: 'center' },
  guidanceEmpty: { alignItems: 'center', gap: spacingY._7, paddingVertical: spacingY._25 },
  guidanceEmptyIcon: { width: 48, height: 48, borderRadius: radius._17, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}16` },
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
    minWidth: verticalScale(112),
    borderRadius: radius._20,
    position: 'absolute',
    bottom: verticalScale(30),
    right: verticalScale(20),
    flexDirection: 'row',
    gap: spacingX._7,
  },
})