import Button from '@/components/Button';
import ScreenWrapper from '@/components/ScreenWrapper';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import { useRouter } from 'expo-router';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { verticalScale } from '../../../utils/styling';

const Welcome = () => {

    const router = useRouter();

    return (
        <ScreenWrapper>
            <View style={styles.container}>
                {/* login button and imagen */}
                <View>
                    <TouchableOpacity onPress={()=> router.push('/(auth)/login')} style={styles.loginButton}>
                        <Typo fontWeight={"500"}>Iniciar Sesión</Typo>
                    </TouchableOpacity>
                    <Animated.Image
                        entering={FadeIn.duration(600)}
                        source={require("../../../assets/images/excodox.png")}
                        style={styles.welcomeImage}
                        resizeMode='contain'
                    />
                </View>
                {/* Footer*/}
                <View style={styles.footer}>
                    <Animated.View 
                    entering={FadeInDown.duration(1000).springify().damping(12)}
                    style={{ alignItems: "center" }}>
                        <Typo size={30} fontWeight={"500"}>
                            Domina tu dinero
                        </Typo>
                        <Typo size={40} fontWeight={"900"} color={colors.primary}>
                            EX - CODOX
                        </Typo>
                    </Animated.View>

                    <Animated.View 
                    entering={FadeInDown.duration(1000).delay(100).springify().damping(12)}
                    style={{ alignItems: "center", gap: 2 }}>
                        <Typo size={17} color={colors.textLight}>
                            Controla tu dinero y mejora tu
                        </Typo>
                        <Typo size={17} color={colors.textLight}>
                            vida financiera
                        </Typo>
                    </Animated.View>

                    <Animated.View 
                    entering={FadeInDown.duration(1000).delay(100).springify().damping(12)}
                    style={styles.buttonContainer}>
                        {/* Button */}
                        <Button onPress={()=> router.push('/(auth)/register')}>
                            <Typo size={18}
                            fontWeight={"700"}>COMENZAR</Typo>
                        </Button>
                    </Animated.View>
                </View>
            </View>
        </ScreenWrapper>
    );
}

export default Welcome

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingTop: spacingY._7
    },
    welcomeImage: {
        width: "85%",
        height: verticalScale(300),
        alignSelf: "center",

        marginTop: verticalScale(100),
    },
    loginButton: {
        alignSelf: "flex-end",
        marginRight: spacingY._20,
    },
    footer: {
        backgroundColor: colors.neutral900,
        alignItems: "center",
        paddingTop: verticalScale(30),
        paddingBottom: verticalScale(30),
        gap: spacingY._20,
        shadowColor: "white",
        shadowOffset: { width: 0, height: -10 },
        elevation: 10,
        shadowRadius: 25,
        shadowOpacity: 0.15,
    },
    buttonContainer: {
        width: "100%",
        paddingHorizontal: spacingX._25,
    },

});