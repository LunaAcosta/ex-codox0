import ScreenWrapper from '@/components/ScreenWrapper'
import Typo from '@/components/Typo'
import { spacingX } from '@/constants/theme'
import { StyleSheet, View } from 'react-native'
import { verticalScale } from '../../../utils/styling'

const Statistics = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Typo size={35} fontWeight={"600"}>Estadisticas</Typo>
      </View>
    </ScreenWrapper>
  )
}

export default Statistics

const styles = StyleSheet.create({
  container: {
      flex: 1,
      paddingHorizontal: spacingX._20,
      marginTop: verticalScale(8),
  }
})