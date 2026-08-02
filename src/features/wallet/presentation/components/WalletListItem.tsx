import Typo from "@/shared/components/Typo";
import { colors, radius, spacingX } from "@/shared/constants/theme";
import { WalletType } from '@/shared/types';
import { verticalScale } from "@/shared/utils/styling";
import { Image } from "expo-image";
import * as Icons from "phosphor-react-native";
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from "react-native-reanimated";
const WalletListItem = ({
    item,
    index,
    router
}: {
    item: WalletType,
    index: number,
    router: any // Router
}) => {
    const openWallet = ()=>{
        router.push({
            pathname : "/(modals)/walletModal",
            params: {
                id: item?.id,
                name: item?.name,
                image: item?.image
            }
        })
    }
    const amountValue = Number(item?.amount ?? 0)
    const formattedAmount = Number.isFinite(amountValue) ? amountValue.toFixed(2) : '0.00'
    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50)
            .springify()
            .damping(13)} 
        >
            <TouchableOpacity style={styles.container} onPress={openWallet}>
                <View style={styles.imageContainer}>
                    {item?.image ? <Image style={{flex: 1}} source={item.image} transition={100} /> : <View style={styles.fallbackIcon}><Icons.Wallet size={21} color={colors.primary} weight="duotone" /></View>}
                </View>
                <View style={styles.nameContainer}>
                    <Typo size={15} fontWeight="700">{item?.name}</Typo>
                    <Typo size={12} color={colors.neutral400}>Saldo disponible</Typo>
                </View>
                <Typo size={14} color={colors.primary} fontWeight="800">${formattedAmount}</Typo>
                <Icons.CaretRight
                    size={verticalScale(20)}
                    weight="bold"
                    color={colors.white}
                />
            </TouchableOpacity>
        </Animated.View>
    )
}

export default WalletListItem


const styles = StyleSheet.create({
    container: {
        flexDirection: "row", 
        alignItems: "center",
        marginBottom: verticalScale(10),
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius._15,
        padding: spacingX._12,
    },
    imageContainer: {
        height: verticalScale(45),
        width: verticalScale(45),
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: radius._12,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    fallbackIcon: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}12` },
    nameContainer: {
        flex: 1,
        gap: 2,
        marginLeft: spacingX._10,
    }
});
