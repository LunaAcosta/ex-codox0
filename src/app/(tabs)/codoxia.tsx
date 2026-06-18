import Button from '@/components/Button'
import FinancialAssistantModal from '@/components/FinancialAssistantModal'
import Header from '@/components/Header'
import ScreenWrapper from '@/components/ScreenWrapper'
import { colors, spacingX, spacingY } from '@/constants/theme'
import useFetchData from '@/hooks/useFetchData'
import { where } from 'firebase/firestore'
import * as Icons from "phosphor-react-native"
import { useMemo, useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { useAuth } from '../../../contexts/authContext'
import { TransactionType, WalletType } from '../../../types'
import { verticalScale } from "../../../utils/styling"

const CodoxIA = () => {
  const [showAssistant, setShowAssistant] = useState(false);
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  // Fetch transactions for the user
  const transactionConstraints = useMemo(() => [
    where("uid", "==", uid)
  ], [uid]);

  const {
    data: transactions,
    loading: transactionsLoading,
  } = useFetchData<TransactionType>("transactions", transactionConstraints);

  // Fetch wallets for the user
  const walletConstraints = useMemo(() => [
    where("uid", "==", uid)
  ], [uid]);

  const {
    data: wallets,
    loading: walletsLoading,
  } = useFetchData<WalletType>("wallets", walletConstraints);

  const handleOpenAssistant = () => {
    setShowAssistant(true);
  };

  const handleCloseAssistant = () => {
    setShowAssistant(false);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title='Codox IA' style={{ marginVertical: spacingY._10 }} />
        <Button 
          style={styles.floatingButton}
          onPress={handleOpenAssistant}
        >
          <Icons.ChatCircleDotsIcon
            color={colors.white}
            weight='bold'
            size={verticalScale(30)}
          />
        </Button>
      </View>
      
      <FinancialAssistantModal
        isVisible={showAssistant}
        onClose={handleCloseAssistant}
        transactions={transactions}
        wallets={wallets}
      />
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