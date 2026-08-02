import { colors, radius } from '@/shared/constants/theme';
import { useRouter } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { BackButtonProps } from '../types';
import { verticalScale } from '../utils/styling';

const BackButton = ({
    style,
    iconSize = 26,
}: BackButtonProps) => {
    const router = useRouter();
    return (
        <TouchableOpacity 
        onPress={() => router.back()} 
        accessibilityRole="button"
        accessibilityLabel="Volver"
        activeOpacity={0.8}
        style={[styles.button, style]}>
            <CaretLeft size={verticalScale(iconSize)}
                color={colors.white}
                weight="bold" />
        </TouchableOpacity>
    )
}

export default BackButton

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.surfaceElevated,
        alignSelf: "flex-start",
        borderRadius: radius._12,
        borderCurve: "continuous",
        padding: 7,
        borderWidth: 1,
        borderColor: colors.border,
    },
});
