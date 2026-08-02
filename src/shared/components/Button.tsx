import { colors, radius } from '@/shared/constants/theme'
import { StyleSheet, TouchableOpacity } from 'react-native'
import { CustomButtonProps } from '../types'
import { verticalScale } from '../utils/styling'
import Loading from './Loading'

const Button = ({
    style,
    onPress,
    loading = false,
    children,
    disabled,
    ...touchableProps
}: CustomButtonProps) => {
    return (
        <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.82}
            {...touchableProps}
            onPress={onPress}
            disabled={disabled || loading}
            style={[styles.button, (disabled || loading) && styles.disabled, style]}
        >
            {loading ? <Loading color={colors.neutral900}/> : children}
        </TouchableOpacity>
    )
}

export default Button

const styles = StyleSheet.create({
    button: {
        backgroundColor: colors.primary,
        borderRadius: radius._15,
        borderCurve: "continuous",
        height: verticalScale(52),
        justifyContent: "center",
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 3,
    },
    disabled: {
        opacity: 0.55,
        shadowOpacity: 0,
    }
})
