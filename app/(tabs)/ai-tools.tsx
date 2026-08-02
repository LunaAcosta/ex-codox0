import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { scale, verticalScale } from '@/shared/utils/styling';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'phosphor-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';

import { useAuth } from '../../src/contexts/authContext';
import {
  getFinanceApiOverview,
  runFinanceAiCapability,
} from '../../src/features/financeApi/application/financeApiService';
import { FinanceAiCapability } from '../../src/features/financeApi/types/FinanceApiTypes';

type CapabilityDefinition = {
  key: FinanceAiCapability;
  title: string;
  description: string;
  actionLabel: string;
  benefit: string;
  duration: string;
};

const capabilities: CapabilityDefinition[] = [
  {
    key: 'summary',
    title: 'Resumen financiero',
    description: 'Balance, ingresos, gastos, ahorro y acción prioritaria.',
    actionLabel: 'Ver mi resumen',
    benefit: 'Punto de partida', duration: '≈ 10 s',
  },
  {
    key: 'analyze',
    title: 'Análisis',
    description: 'Fortalezas, debilidades, riesgos y oportunidades.',
    actionLabel: 'Analizar mis finanzas',
    benefit: 'Detecta riesgos', duration: '≈ 15 s',
  },
  {
    key: 'recommend',
    title: 'Recomendaciones',
    description: 'Acciones breves y priorizadas para mejorar tus finanzas.',
    actionLabel: 'Recibir recomendaciones',
    benefit: 'Plan accionable', duration: '≈ 15 s',
  },
  {
    key: 'predict',
    title: 'Predicción',
    description: 'Tendencias, riesgos y oportunidades según tus datos.',
    actionLabel: 'Explorar mi tendencia',
    benefit: 'Anticipa escenarios', duration: '≈ 15 s',
  },
  {
    key: 'classify',
    title: 'Perfil financiero',
    description: 'Clasificación de tu comportamiento financiero actual.',
    actionLabel: 'Descubrir mi perfil',
    benefit: 'Conoce tus hábitos', duration: '≈ 10 s',
  },
];

const CapabilityIcon = ({ capability }: { capability: FinanceAiCapability }) => {
  const props = { color: colors.primary, size: scale(22), weight: 'fill' as const };

  switch (capability) {
    case 'summary':
      return <Icons.FileText {...props} />;
    case 'analyze':
      return <Icons.ChartBar {...props} />;
    case 'recommend':
      return <Icons.Lightbulb {...props} />;
    case 'predict':
      return <Icons.TrendUp {...props} />;
    case 'classify':
      return <Icons.UserFocus {...props} />;
  }
};

const AiTools = () => {
  const { user } = useAuth();
  const [apiStatus, setApiStatus] = useState<'loading' | 'online' | 'error'>('loading');
  const [overviewError, setOverviewError] = useState('');
  const [loadingCapability, setLoadingCapability] = useState<FinanceAiCapability | null>(null);
  const [results, setResults] = useState<Partial<Record<FinanceAiCapability, string>>>({});
  const [errors, setErrors] = useState<Partial<Record<FinanceAiCapability, string>>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [completedAt, setCompletedAt] = useState<Partial<Record<FinanceAiCapability, string>>>({});

  const loadOverview = useCallback(async () => {
    if (!user?.uid) return;

    setApiStatus('loading');
    setOverviewError('');
    try {
      const overview = await getFinanceApiOverview();
      setApiStatus(
        overview.health.status === 'running' ? 'online' : 'error',
      );
    } catch (error) {
      setApiStatus('error');
      setOverviewError(error instanceof Error ? error.message : 'No se pudo verificar la API.');
    }
  }, [user?.uid]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  const executeCapability = async (capability: FinanceAiCapability) => {
    if (!user?.uid || loadingCapability) return;

    setLoadingCapability(capability);
    setErrors((current) => ({ ...current, [capability]: undefined }));
    try {
      const result = await runFinanceAiCapability(user.uid, capability);
      setResults((current) => ({ ...current, [capability]: result.content }));
      setCompletedAt((current) => ({ ...current, [capability]: new Date().toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' }) }));
    } catch (error) {
      setErrors((current) => ({
        ...current,
        [capability]: error instanceof Error ? error.message : 'No se pudo completar la solicitud.',
      }));
    } finally {
      setLoadingCapability(null);
    }
  };

  const completedCount = Object.keys(results).length;
  const nextCapability = capabilities.find((capability) => !results[capability.key]);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <View><Typo size={12} color={colors.neutral400}>INTELIGENCIA PARA TUS METAS</Typo><Typo size={24} fontWeight="900">Laboratorio financiero</Typo></View>
          <View style={styles.headerIcon}><Icons.Sparkle size={21} color={colors.primary} weight="fill" /></View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          <LinearGradient colors={['#262033', '#171E2A']} style={styles.heroCard}>
            <View style={styles.heroTop}>
              <View style={styles.heroIcon}><Icons.Brain size={27} color={colors.primary} weight="duotone" /></View>
              <View style={styles.securePill}><Icons.ShieldCheck size={14} color={colors.green} weight="fill" /><Typo size={10} color={colors.green} fontWeight="700">Privado y personalizado</Typo></View>
            </View>
            <Typo size={21} fontWeight="900" style={styles.heroTitle}>Decisiones más claras, usando tus propios datos.</Typo>
            <Typo size={12} color={colors.neutral400} style={styles.heroDescription}>Elige una herramienta y recibe una respuesta breve, práctica y enfocada en tu situación.</Typo>

            <View style={styles.statusCard}>
            <View
              style={[
                styles.statusDot,
                {
                  backgroundColor:
                    apiStatus === 'online'
                      ? colors.green
                      : apiStatus === 'error'
                        ? colors.rose
                        : colors.primary,
                },
              ]}
            />
            <View style={styles.statusContent}>
              <Typo size={14} fontWeight="700">
                {apiStatus === 'online'
                  ? 'Todo listo para comenzar'
                  : apiStatus === 'error'
                    ? 'API no disponible'
                    : 'Verificando API…'}
              </Typo>
              <Typo size={12} color={colors.neutral400}>
                {apiStatus === 'online'
                  ? 'Elige una herramienta y avanza a tu ritmo.'
                  : overviewError || 'Preparando tus herramientas.'}
              </Typo>
            </View>
            </View>
          </LinearGradient>

          <View style={styles.journeyCard}>
            <View style={styles.journeyHeader}>
              <View><Typo size={11} color={colors.neutral400}>TU RUTA DE DESCUBRIMIENTO</Typo><Typo size={16} fontWeight="800">{completedCount === capabilities.length ? 'Perfil financiero completo' : `${completedCount} de ${capabilities.length} descubrimientos`}</Typo></View>
              <View style={styles.progressBadge}><Typo size={12} color={colors.primary} fontWeight="900">{Math.round((completedCount / capabilities.length) * 100)}%</Typo></View>
            </View>
            <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${(completedCount / capabilities.length) * 100}%` }]} /></View>
            <View style={styles.cacheNote}><Icons.ArrowsClockwise size={15} color={colors.blue} weight="fill" /><Typo size={11} color={colors.neutral300} style={{ flex: 1 }}>Tus resultados se conservan y se actualizan cuando cambian tus finanzas.</Typo></View>
            {nextCapability && <TouchableOpacity style={styles.nextStep} onPress={() => executeCapability(nextCapability.key)} disabled={Boolean(loadingCapability) || apiStatus !== 'online'}><View><Typo size={10} color={colors.neutral500}>SIGUIENTE PASO SUGERIDO</Typo><Typo size={13} fontWeight="800">{nextCapability.title}</Typo></View><Icons.ArrowRight size={18} color={colors.primary} weight="bold" /></TouchableOpacity>}
          </View>

          <View style={styles.sectionHeading}><Typo size={17} fontWeight="800">¿Qué quieres descubrir?</Typo><Typo size={11} color={colors.neutral400}>Puedes actualizar cada resultado cuando quieras</Typo></View>

          {capabilities.map((capability) => {
            const isLoading = loadingCapability === capability.key;
            const result = results[capability.key];
            const error = errors[capability.key];
            const isNext = nextCapability?.key === capability.key;

            return (
              <View key={capability.key} style={[styles.capabilityCard, isNext && styles.capabilityCardSuggested]}>
                <View style={styles.capabilityHeader}>
                  <View style={styles.iconContainer}>
                    <CapabilityIcon capability={capability.key} />
                  </View>
                  <View style={styles.capabilityText}>
                    <View style={styles.titleRow}>
                      <Typo size={15} fontWeight="700">{capability.title}</Typo>
                      {result && <Icons.CheckCircle size={18} color={colors.green} weight="fill" />}
                    </View>
                    <Typo size={12} color={colors.neutral400}>{capability.description}</Typo>
                    <View style={styles.metaRow}><View style={styles.metaPill}><Icons.Target size={12} color={colors.violet} weight="fill" /><Typo size={10} color={colors.neutral300}>{capability.benefit}</Typo></View><View style={styles.metaPill}><Icons.Timer size={12} color={colors.blue} weight="fill" /><Typo size={10} color={colors.neutral300}>{capability.duration}</Typo></View></View>
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.actionButton, (isLoading || apiStatus !== 'online') && styles.disabledButton]}
                  disabled={Boolean(loadingCapability) || apiStatus !== 'online'}
                  onPress={() => executeCapability(capability.key)}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.neutral900} />
                  ) : (
                    <Typo size={13} color={colors.neutral900} fontWeight="800">
                      {result ? 'Actualizar resultado' : capability.actionLabel}
                    </Typo>
                  )}
                </TouchableOpacity>

                {result ? (
                  <View style={styles.resultBox}>
                    <View style={styles.resultHeader}><View style={styles.resultStatus}><Icons.Sparkle size={13} color={colors.primary} weight="fill" /><Typo size={10} color={colors.primary} fontWeight="800">INSIGHT PERSONALIZADO</Typo></View><Typo size={10} color={colors.neutral500}>{completedAt[capability.key]}</Typo></View>
                    <Typo size={13} color={colors.textLight} style={styles.resultText}>{result}</Typo>
                    {capability.key === 'recommend' && <View style={styles.savedNote}><Icons.ClockCounterClockwise size={14} color={colors.green} weight="fill" /><Typo size={10} color={colors.green} fontWeight="700">Guardado en el historial de Codox</Typo></View>}
                  </View>
                ) : null}

                {error ? (
                  <Typo size={12} color={colors.rose} style={styles.errorText}>{error}</Typo>
                ) : null}
              </View>
            );
          })}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default AiTools;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacingY._10 },
  headerIcon: { width: 44, height: 44, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  scrollContent: {
    paddingBottom: verticalScale(100),
  },
  heroCard: { borderRadius: radius._24, padding: spacingX._20, marginTop: spacingY._7, borderWidth: 1, borderColor: '#393247' },
  heroTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroIcon: { width: 50, height: 50, borderRadius: radius._17, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  securePill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 6, borderRadius: radius._20, backgroundColor: `${colors.green}10` },
  heroTitle: { marginTop: spacingY._15, lineHeight: verticalScale(27), maxWidth: '90%' },
  heroDescription: { lineHeight: verticalScale(18), marginTop: spacingY._7 },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingX._10,
    padding: spacingX._12,
    backgroundColor: '#0B0F177A',
    borderRadius: radius._12,
    borderWidth: 1,
    borderColor: '#FFFFFF14',
    marginTop: spacingY._15,
  },
  statusDot: {
    width: scale(10),
    height: scale(10),
    borderRadius: scale(5),
  },
  statusContent: {
    flex: 1,
    gap: spacingY._5,
  },
  sectionHeading: { marginTop: spacingY._25, marginBottom: spacingY._12, gap: 3 },
  journeyCard: { padding: spacingX._15, marginTop: spacingY._15, borderRadius: radius._17, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  journeyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressBadge: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18`, borderWidth: 1, borderColor: `${colors.primary}44` },
  progressTrack: { height: 7, borderRadius: 5, overflow: 'hidden', backgroundColor: colors.background, marginTop: spacingY._12 },
  progressFill: { height: '100%', borderRadius: 5, backgroundColor: colors.primary },
  cacheNote: { flexDirection: 'row', alignItems: 'center', gap: spacingX._7, marginTop: spacingY._10 },
  nextStep: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacingX._10, marginTop: spacingY._12, borderRadius: radius._12, backgroundColor: `${colors.primary}0F` },
  capabilityCard: {
    backgroundColor: colors.surface,
    borderRadius: radius._17,
    padding: spacingX._15,
    marginBottom: spacingY._12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  capabilityCardSuggested: { borderColor: `${colors.primary}66` },
  capabilityHeader: {
    flexDirection: 'row',
    gap: spacingX._12,
  },
  iconContainer: {
    width: scale(46),
    height: scale(46),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._15,
    backgroundColor: `${colors.primary}1F`,
  },
  capabilityText: {
    flex: 1,
    gap: spacingY._5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacingX._5, marginTop: 2 },
  metaPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 4, borderRadius: radius._10, backgroundColor: colors.background },
  actionButton: {
    height: verticalScale(40),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius._12,
    marginTop: spacingY._12,
  },
  disabledButton: {
    opacity: 0.45,
  },
  resultBox: {
    backgroundColor: colors.background,
    borderRadius: radius._12,
    padding: spacingX._12,
    marginTop: spacingY._12,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  resultText: {
    lineHeight: verticalScale(19),
  },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacingY._7 },
  resultStatus: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  savedNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: spacingY._10, paddingTop: spacingY._7, borderTopWidth: 1, borderTopColor: colors.border },
  errorText: {
    marginTop: spacingY._10,
    lineHeight: verticalScale(17),
  },
});
