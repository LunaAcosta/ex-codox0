import { colors, radius, spacingX } from "@/constants/theme";
import { Image } from "expo-image";
import * as Icons from "phosphor-react-native";
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from "react-native-reanimated";
import { WalletType } from '../../types';
import { verticalScale } from "../../utils/styling";
import Typo from "./Typo";
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
    return (
        <Animated.View
            entering={FadeInDown.delay(index * 50)
            .springify()
            .damping(13)} 
        >
            <TouchableOpacity style={styles.container} onPress={openWallet}>
                <View style={styles.imageContainer}>
                    <Image
                        style={{flex: 1}}
                        source={item?.image}
                        transition={100}
                    />
                </View>
                <View style={styles.nameContainer}>
                    <Typo size={16}> {item?.name}</Typo>
                    <Typo size={12} color={colors.neutral400}> $ {item?.amount}</Typo>
                </View>
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
        marginBottom: verticalScale(17), // padding: spacingX._15,
    },
    imageContainer: {
        height: verticalScale(45),
        width: verticalScale(45),
        borderWidth: 1,
        borderColor: colors.neutral600,
        borderRadius: radius._12,
        borderCurve: "continuous",
        overflow: "hidden",
    },
    nameContainer: {
        flex: 1,
        gap: 2,
        marginLeft: spacingX._10,
    }
});
