import BackButton from '@/shared/components/BackButton';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import SurfaceCard from '@/shared/components/SurfaceCard';
import Typo from '@/shared/components/Typo';
import { colors, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { register } = useAuth();

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !password) {
      Alert.alert('Faltan datos', 'Completa tu nombre, correo y contraseña.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña muy corta', 'Usa al menos 6 caracteres.');
      return;
    }
    setIsLoading(true);
    const result = await register(email.trim().toLowerCase(), password, name.trim());
    setIsLoading(false);
    if (!result.success) Alert.alert('No pudimos crear la cuenta', result.msg);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton iconSize={24} />
          <View style={styles.heading}>
            <View style={styles.iconBadge}><Icons.RocketLaunch size={22} color={colors.primary} weight="fill" /></View>
            <Typo size={31} fontWeight="900">Crea tu espacio financiero</Typo>
            <Typo size={14} color={colors.neutral400} style={styles.helper}>Toma control de tus movimientos y recibe análisis personalizados.</Typo>
          </View>

          <SurfaceCard style={styles.form}>
            <View style={styles.field}>
              <Typo size={12} color={colors.neutral300} fontWeight="700">NOMBRE</Typo>
              <Input value={name} onChangeText={setName} autoComplete="name" placeholder="Cómo quieres que te llamemos" icon={<Icons.User size={22} color={colors.neutral400} />} />
            </View>
            <View style={styles.field}>
              <Typo size={12} color={colors.neutral300} fontWeight="700">CORREO</Typo>
              <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="nombre@correo.com" icon={<Icons.At size={22} color={colors.neutral400} />} />
            </View>
            <View style={styles.field}>
              <Typo size={12} color={colors.neutral300} fontWeight="700">CONTRASEÑA</Typo>
              <Input value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" placeholder="Mínimo 6 caracteres" icon={<Icons.Lock size={22} color={colors.neutral400} />} />
              <View style={styles.passwordHint}><Icons.CheckCircle size={14} color={password.length >= 6 ? colors.green : colors.neutral500} /><Typo size={11} color={colors.neutral400}>Al menos 6 caracteres</Typo></View>
            </View>
            <Button loading={isLoading} onPress={handleSubmit}>
              <Typo fontWeight="800" color={colors.neutral900} size={15}>Crear cuenta</Typo>
            </Button>
          </SurfaceCard>

          <View style={styles.footer}>
            <Typo size={13} color={colors.neutral400}>¿Ya tienes cuenta?</Typo>
            <Pressable onPress={() => router.navigate('/(auth)/login')}><Typo size={13} fontWeight="800" color={colors.primary}>Iniciar sesión</Typo></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Register;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: spacingX._20, paddingBottom: spacingY._30 },
  heading: { marginTop: spacingY._25, marginBottom: spacingY._20 },
  iconBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18`, marginBottom: spacingY._15 },
  helper: { lineHeight: verticalScale(20), marginTop: spacingY._7 },
  form: { gap: spacingY._15, padding: spacingX._20 },
  field: { gap: spacingY._7 },
  passwordHint: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacingX._5, marginTop: spacingY._20 },
});
