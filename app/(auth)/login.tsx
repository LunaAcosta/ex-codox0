import BackButton from '@/shared/components/BackButton';
import Button from '@/shared/components/Button';
import Input from '@/shared/components/Input';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import SurfaceCard from '@/shared/components/SurfaceCard';
import Typo from '@/shared/components/Typo';
import { colors, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';
import { auth } from '../../src/core/config/firebase';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña para continuar.');
      return;
    }
    setIsLoading(true);
    const result = await login(normalizedEmail, password);
    setIsLoading(false);
    if (!result.success) Alert.alert('No pudimos iniciar sesión', result.msg);
  };

  const handleResetPassword = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      Alert.alert('Recuperar contraseña', 'Escribe primero tu correo electrónico.');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, normalizedEmail);
      Alert.alert('Revisa tu correo', 'Te enviamos un enlace para restablecer tu contraseña.');
    } catch {
      Alert.alert('No se pudo enviar', 'Verifica el correo e intenta nuevamente.');
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <BackButton iconSize={24} />
          <View style={styles.heading}>
            <View style={styles.iconBadge}><Icons.HandWaving size={22} color={colors.primary} weight="fill" /></View>
            <Typo size={31} fontWeight="900">Qué bueno verte</Typo>
            <Typo size={14} color={colors.neutral400} style={styles.helper}>Ingresa para continuar construyendo una vida financiera más clara.</Typo>
          </View>

          <SurfaceCard style={styles.form}>
            <View style={styles.field}>
              <Typo size={12} color={colors.neutral300} fontWeight="700">CORREO</Typo>
              <Input value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="nombre@correo.com" icon={<Icons.At size={22} color={colors.neutral400} />} />
            </View>
            <View style={styles.field}>
              <Typo size={12} color={colors.neutral300} fontWeight="700">CONTRASEÑA</Typo>
              <Input value={password} onChangeText={setPassword} secureTextEntry={!showPassword} autoComplete="password" placeholder="Tu contraseña" icon={<Icons.Lock size={22} color={colors.neutral400} />} />
              <Pressable onPress={() => setShowPassword((current) => !current)} style={styles.showPassword}>
                <Typo size={11} color={colors.primary}>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</Typo>
              </Pressable>
            </View>
            <Pressable onPress={handleResetPassword} hitSlop={8} style={styles.forgot}>
              <Typo size={12} color={colors.primary} fontWeight="700">¿Olvidaste tu contraseña?</Typo>
            </Pressable>
            <Button loading={isLoading} onPress={handleSubmit}>
              <Typo fontWeight="800" color={colors.neutral900} size={15}>Iniciar sesión</Typo>
            </Button>
          </SurfaceCard>

          <View style={styles.footer}>
            <Typo size={13} color={colors.neutral400}>¿Primera vez en Ex-Codox?</Typo>
            <Pressable onPress={() => router.navigate('/(auth)/register')}><Typo size={13} fontWeight="800" color={colors.primary}>Crear cuenta</Typo></Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flexGrow: 1, paddingHorizontal: spacingX._20, paddingBottom: spacingY._30 },
  heading: { marginTop: spacingY._30, marginBottom: spacingY._25 },
  iconBadge: { width: 46, height: 46, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18`, marginBottom: spacingY._15 },
  helper: { lineHeight: verticalScale(20), marginTop: spacingY._7 },
  form: { gap: spacingY._17, padding: spacingX._20 },
  field: { gap: spacingY._7 },
  showPassword: { alignSelf: 'flex-end', marginTop: -spacingY._5 },
  forgot: { alignSelf: 'flex-end' },
  footer: { flexDirection: 'row', justifyContent: 'center', gap: spacingX._5, marginTop: spacingY._20 },
});
