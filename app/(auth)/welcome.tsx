import Button from '@/shared/components/Button';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { scale, verticalScale } from '@/shared/utils/styling';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

const benefits = [
  { icon: Icons.ChartLineUp, label: 'Entiende tus gastos' },
  { icon: Icons.Sparkle, label: 'Recibe guía con IA' },
  { icon: Icons.ShieldCheck, label: 'Tus datos, protegidos' },
];

const Welcome = () => {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <LinearGradient
        colors={[colors.background, '#17140D', colors.background]}
        locations={[0, 0.48, 1]}
        style={styles.container}
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.brandIcon}>
              <Icons.Wallet size={20} color={colors.neutral900} weight="fill" />
            </View>
            <Typo size={16} fontWeight="800">Ex-Codox</Typo>
          </View>
          <Pressable onPress={() => router.push('/(auth)/login')} hitSlop={12}>
            <Typo size={14} fontWeight="700" color={colors.primary}>Ingresar</Typo>
          </Pressable>
        </View>

        <Animated.View entering={FadeIn.duration(500)} style={styles.heroVisual}>
          <View style={styles.glow} />
          <Image
            source={require('../../assets/images/excodox.png')}
            style={styles.welcomeImage}
            resizeMode="contain"
          />
          <View style={styles.insightBadge}>
            <Icons.TrendUp size={18} color={colors.green} weight="bold" />
            <View>
              <Typo size={10} color={colors.neutral400}>Progreso mensual</Typo>
              <Typo size={14} fontWeight="800" color={colors.green}>+18% ahorro</Typo>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(700).springify().damping(14)} style={styles.content}>
          <View style={styles.badge}>
            <Icons.Sparkle size={14} color={colors.primary} weight="fill" />
            <Typo size={11} color={colors.primary} fontWeight="700">FINANZAS CON INTELIGENCIA</Typo>
          </View>
          <Typo size={34} fontWeight="900" style={styles.title}>
            Tu dinero, más claro.{`\n`}<Typo size={34} fontWeight="900" color={colors.primary}>Tus metas, más cerca.</Typo>
          </Typo>
          <Typo size={15} color={colors.neutral400} style={styles.subtitle}>
            Registra movimientos, escanea recibos y recibe recomendaciones basadas únicamente en tus finanzas.
          </Typo>

          <View style={styles.benefits}>
            {benefits.map(({ icon: Icon, label }) => (
              <View key={label} style={styles.benefitItem}>
                <Icon size={17} color={colors.primary} weight="duotone" />
                <Typo size={11} color={colors.textLight}>{label}</Typo>
              </View>
            ))}
          </View>

          <Button onPress={() => router.push('/(auth)/register')} style={styles.mainButton}>
            <View style={styles.buttonContent}>
              <Typo size={16} fontWeight="800" color={colors.neutral900}>Crear mi cuenta</Typo>
              <Icons.ArrowRight size={20} color={colors.neutral900} weight="bold" />
            </View>
          </Button>
        </Animated.View>
      </LinearGradient>
    </ScreenWrapper>
  );
};

export default Welcome;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: spacingY._7 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10 },
  brandIcon: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center', borderRadius: radius._12, backgroundColor: colors.primary },
  heroVisual: { flex: 1, minHeight: verticalScale(245), alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', width: scale(220), height: scale(220), borderRadius: scale(110), backgroundColor: `${colors.primary}15` },
  welcomeImage: { width: '80%', height: verticalScale(235) },
  insightBadge: { position: 'absolute', right: 5, bottom: 18, flexDirection: 'row', gap: 8, alignItems: 'center', paddingHorizontal: 12, paddingVertical: 9, borderRadius: radius._12, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  content: { paddingBottom: spacingY._20 },
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: radius._20, backgroundColor: `${colors.primary}16`, marginBottom: spacingY._12 },
  title: { lineHeight: verticalScale(40), letterSpacing: -0.7 },
  subtitle: { lineHeight: verticalScale(21), marginTop: spacingY._12 },
  benefits: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacingY._20 },
  benefitItem: { alignItems: 'center', gap: spacingY._5, maxWidth: '31%' },
  mainButton: { height: verticalScale(56) },
  buttonContent: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10 },
});
