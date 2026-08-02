import ScreenWrapper from '@/shared/components/ScreenWrapper';
import SurfaceCard from '@/shared/components/SurfaceCard';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import { signOut } from '@firebase/auth';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';
import { auth } from '../../src/core/config/firebase';
import { getProfileImage } from '../../src/features/ocr/application/services/imageService';

type ProfileAction = {
  title: string;
  description: string;
  color: string;
  Icon: typeof Icons.User;
  onPress: () => void;
  destructive?: boolean;
};

const Profile = () => {
  const { user } = useAuth();
  const router = useRouter();

  const confirmLogout = () => {
    Alert.alert('Cerrar sesión', 'Tendrás que ingresar nuevamente para acceder a tus finanzas.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Cerrar sesión', style: 'destructive', onPress: () => signOut(auth) },
    ]);
  };

  const actions: ProfileAction[] = [
    { title: 'Editar perfil', description: 'Actualiza tu nombre y fotografía', color: colors.violet, Icon: Icons.User, onPress: () => router.push('/(modals)/profileModal') },
    { title: 'Preferencias', description: 'Moneda, notificaciones y apariencia', color: colors.blue, Icon: Icons.SlidersHorizontal, onPress: () => Alert.alert('Próximamente', 'Estamos preparando preferencias personalizadas.') },
    { title: 'Privacidad y seguridad', description: 'Cómo protegemos tu información', color: colors.green, Icon: Icons.ShieldCheck, onPress: () => Alert.alert('Privacidad', 'Tus análisis de IA se limitan al usuario autenticado. Nunca compartimos datos entre cuentas.') },
    { title: 'Cerrar sesión', description: 'Salir de forma segura de este dispositivo', color: colors.rose, Icon: Icons.SignOut, onPress: confirmLogout, destructive: true },
  ];

  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHeader}><View><Typo size={12} color={colors.neutral400}>TU CUENTA</Typo><Typo size={24} fontWeight="900">Perfil</Typo></View></View>

        <SurfaceCard style={styles.userCard}>
          <View style={styles.avatarWrapper}>
            <Image source={getProfileImage(user?.image)} style={styles.avatar} contentFit="cover" transition={100} />
            <View style={styles.verifiedBadge}><Icons.Check size={12} color={colors.neutral900} weight="bold" /></View>
          </View>
          <View style={styles.userDetails}>
            <Typo size={21} fontWeight="900">{user?.name || 'Usuario Ex-Codox'}</Typo>
            <Typo size={13} color={colors.neutral400}>{user?.email}</Typo>
          </View>
        </SurfaceCard>

        <View style={styles.sectionHeader}><Typo size={17} fontWeight="800">Cuenta y seguridad</Typo><Typo size={11} color={colors.neutral400}>Administra tu experiencia</Typo></View>
        <SurfaceCard style={styles.actionsCard}>
          {actions.map(({ title, description, color, Icon, onPress, destructive }, index) => (
            <TouchableOpacity key={title} activeOpacity={0.75} onPress={onPress} style={[styles.action, index < actions.length - 1 && styles.actionBorder]}>
              <View style={[styles.actionIcon, { backgroundColor: `${color}18` }]}><Icon size={21} color={color} weight="duotone" /></View>
              <View style={styles.actionContent}><Typo size={14} fontWeight="700" color={destructive ? colors.rose : colors.text}>{title}</Typo><Typo size={11} color={colors.neutral400}>{description}</Typo></View>
              <Icons.CaretRight size={17} color={colors.neutral500} weight="bold" />
            </TouchableOpacity>
          ))}
        </SurfaceCard>

        <Typo size={10} color={colors.neutral500} style={styles.version}>Ex-Codox · Tu espacio financiero</Typo>
      </ScrollView>
    </ScreenWrapper>
  );
};

export default Profile;

const styles = StyleSheet.create({
  container: { paddingHorizontal: spacingX._20, paddingBottom: verticalScale(100) },
  pageHeader: { marginVertical: spacingY._10 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: spacingX._15, padding: spacingX._20, marginTop: spacingY._12 },
  avatarWrapper: { position: 'relative' },
  avatar: { width: verticalScale(76), height: verticalScale(76), borderRadius: radius._24, backgroundColor: colors.neutral700 },
  verifiedBadge: { position: 'absolute', right: -4, bottom: -4, width: 24, height: 24, borderRadius: 12, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.surface },
  userDetails: { flex: 1, gap: spacingY._5 },
  sectionHeader: { marginTop: spacingY._25, marginBottom: spacingY._10 },
  actionsCard: { padding: 0, overflow: 'hidden' },
  action: { flexDirection: 'row', alignItems: 'center', gap: spacingX._12, padding: spacingX._15 },
  actionBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  actionIcon: { width: 42, height: 42, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center' },
  actionContent: { flex: 1, gap: 3 },
  version: { textAlign: 'center', marginTop: spacingY._25 },
});
