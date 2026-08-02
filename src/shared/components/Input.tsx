import { colors, radius, spacingX } from '@/shared/constants/theme'
import { useState } from 'react'
import { StyleSheet, TextInput, View } from 'react-native'
import { InputProps } from '../types'
import { verticalScale } from '../utils/styling'

const Input = (props: InputProps) => {
  const [focused, setFocused] = useState(false)
  const { containerStyle, inputStyle, icon, inputRef, onFocus, onBlur, ...inputProps } = props
  return (
    <View
    style={[styles.container, focused && styles.focused, containerStyle]}
    >
      {icon}
      <TextInput style={[styles.input, inputStyle]}
      placeholderTextColor={colors.neutral400}
      ref={inputRef}
      {...inputProps}
      onFocus={(event) => {
        setFocused(true)
        onFocus?.(event)
      }}
      onBlur={(event) => {
        setFocused(false)
        onBlur?.(event)
      }}
      />
    </View>
  )
}

export default Input

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        height: verticalScale(54),
        alignItems: "center",
        justifyContent: "center",
        borderWidth:1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        borderCurve: "continuous",
        borderRadius: radius._17,
        paddingHorizontal: spacingX._15,
        gap: spacingX._10
    },
    focused: {
        borderColor: colors.primary,
        backgroundColor: colors.surfaceElevated,
    },
    input: {
        flex:1,
        color: colors.white,
        fontSize: verticalScale(14)
    }
})
