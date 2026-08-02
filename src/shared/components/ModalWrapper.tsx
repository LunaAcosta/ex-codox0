import { colors, spacingY } from '@/shared/constants/theme'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ModalWrapperProps } from '../types'

const ModalWrapper = ({
    style,
    children,
    bg= colors.neutral800
}:ModalWrapperProps) => {
  const insets = useSafeAreaInsets()
  return (
    <View style={[
      styles.container,
      {
        backgroundColor:bg,
        paddingTop: Math.max(insets.top, spacingY._15),
        paddingBottom: Math.max(insets.bottom, spacingY._10),
      },
      style && style,
    ]}>
      {children}
    </View>
  )
}

export default ModalWrapper

const styles = StyleSheet.create({
    container: {
        flex: 1,
    }
})
