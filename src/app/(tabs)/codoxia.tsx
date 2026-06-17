import Button from '@/components/Button'
import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, spacingX, spacingY } from '@/constants/theme'
import * as Icons from "phosphor-react-native"
import { StyleSheet, View } from 'react-native'
import { verticalScale } from '../../../utils/styling'

const CodoxIA = () => {
  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title='CodoxIA' style={{ marginVertical: spacingY._10 }} />
        <Button style={styles.floatingButton}>
          <Icons.ChatCircleDotsIcon
            color={colors.white}
            weight='bold'
            size={verticalScale(30)}
          />
        </Button>
      </View>
    </ScreenWrapper>
  )
}

export default CodoxIA

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
  },
  floatingButton: {
      height: verticalScale(50),
      width: verticalScale(50),
      borderRadius: 100,
      position: "absolute",
      bottom: verticalScale(30),
      right: verticalScale(30)
    },
  // userInfo: {
  //   marginTop: verticalScale(30),
  //   alignItems: "center",
  //   gap: spacingY._15
  // },
  // avatarContainer: {
  //   position: "relative",
  //   alignSelf: "center"
  // },
  // avatar: {
  //   alignSelf: "center",
  //   backgroundColor: colors.neutral300,
  //   height: verticalScale(135),
  //   width: verticalScale(135),
  //   borderRadius: 200,
  //   //overflow: "hidden",
  //   //position: "relative"
  // },
  // editIcon: {
  //   position: "absolute",
  //   bottom: 5,
  //   right: 8,
  //   borderRadius: 50,
  //   backgroundColor: colors.neutral100,
  //   shadowColor: colors.black,
  //   shadowOffset: { width: 0, height: 0 },
  //   shadowOpacity: 0.25,
  //   shadowRadius: 10,
  //   elevation: 4,
  //   padding: 5
  // },
  // nameContainer: {
  //   gap: verticalScale(4),
  //   alignItems: "center",
  // },
  // listIcon: {
  //   height: verticalScale(44),
  //   width: verticalScale(44),
  //   backgroundColor: colors.neutral500,
  //   alignItems: "center",
  //   justifyContent: "center",
  //   borderRadius: radius._15,
  //   borderCurve: "continuous"
  // },
  // listItem: {
  //   marginBottom: verticalScale(17),
  // },
  // accountOptions: {
  //   marginTop: spacingY._35
  // },
  // flexRow: {
  //   flexDirection: "row",
  //   alignItems: "center",
  //   gap: spacingX._10
  // }
})