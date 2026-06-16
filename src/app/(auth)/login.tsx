import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import Input from '@/components/input'
import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useRouter } from 'expo-router'
import * as Icons from 'phosphor-react-native'
import { useRef, useState } from 'react'
import { Alert, Pressable, StyleSheet, View } from 'react-native'
import { useAuth } from '../../../contexts/authContext'
import { verticalScale } from '../../../utils/styling'

const Login = () => {

  const emailRef = useRef("");
  const passwordRef = useRef("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const {login: loginUser} = useAuth()
  
  const handleSubmit = async ()=>{
    if(!emailRef.current || !passwordRef.current){
      Alert.alert("Acceso", "Por favor, completa todos los campos");
      return;
    }
   setIsLoading(true);
   const res = await loginUser(emailRef.current, passwordRef.current);
   setIsLoading(false);
   if(!res.success){
    Alert.alert("Acceso", res.msg)
   }
  };
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* back button*/}
        <BackButton iconSize={28} />

        <View style={{ gap: 5, marginTop: spacingY._20 }}>
          <Typo size={30} fontWeight={"800"}>Hola,</Typo>
          <Typo size={30} fontWeight={"800"}>Bienvenido de nuevo</Typo>
        </View>
        {/* form*/}
        <View style={styles.form}>
          <Typo size={16} color={colors.textLighter}>
            Ingresa tu información para continuar
          </Typo>
          {/* input */}
          <Input
            placeholder='Correo electrónico'
            onChangeText={(value) => (emailRef.current = value)}
            icon={<Icons.AtIcon size={verticalScale(26)}
              color={colors.neutral300}
              weight='fill'
            />}
          />
          <Input
            placeholder='Contraseña'
            secureTextEntry
            onChangeText={(value) => (passwordRef.current = value)}
            icon={<Icons.LockIcon size={verticalScale(26)}
              color={colors.neutral300}
              weight='fill'
            />}
          />
          <Typo size={14} color={colors.text} style={{alignSelf: "flex-end"}}>
            ¿Olvidaste tu contraseña?
          </Typo>
          <Button loading= {isLoading} onPress={handleSubmit}>
            <Typo fontWeight={"700"} color={colors.white} size={18}>
              INICIAR SESION
            </Typo>
          </Button>
        </View>
        {/* footer */}
        <View style={styles.footer}>
          <Typo size={15}>¿No tienes una cuenta?</Typo>
          <Pressable onPress={()=> router.navigate('/(auth)/register')}>
            <Typo size={15} fontWeight={"700"} color={colors.primary}>Regístrate</Typo>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  )
}

export default Login

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacingY._30,
    paddingHorizontal: spacingX._20,
  },
  welcomeText: {
    fontSize: verticalScale(20),
    fontWeight: "bold",
    color: colors.text,
  },
  form: {
    gap: spacingY._20,
  },
  forgotPassword: {
    textAlign: "right",
    fontWeight: "500",
    color: colors.text,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },
  footerText: {
    textAlign: "center",
    color: colors.text,
    fontSize: verticalScale(15),
  }
});