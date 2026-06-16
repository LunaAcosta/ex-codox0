import Button from '@/components/Button';
import HomeCard from '@/components/HomeCard';
import ScreenWrapper from '@/components/ScreenWrapper';
import TransactionList from '@/components/TransactionList';
import Typo from '@/components/Typo';
import { colors, spacingX, spacingY } from '@/constants/theme';
import useFetchData from '@/hooks/useFetchData';
import { useRouter } from 'expo-router';
import { limit, orderBy, where } from 'firebase/firestore';
import * as Icons from "phosphor-react-native";
import { useMemo } from 'react';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../../../contexts/authContext';
import { TransactionType } from '../../../types';
import { verticalScale } from '../../../utils/styling';


const Home = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? '';

  const router = useRouter();

  const constraints = useMemo(() => [
    where("uid", "==", uid),
    orderBy("date", "desc"),
    limit(30)
  ], [uid]);
  const {
    data: recentTransactions,
    error,
    loading: transactionsLoading,
  } = useFetchData<TransactionType>("transactions", constraints);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ gap: 4 }}>
            <Typo size={16} color={colors.neutral400}>Hola,</Typo>
            <Typo size={20} fontWeight="500">{user?.name}</Typo>
          </View>
          <TouchableOpacity style={styles.searchIcon}>
            <Icons.MagnifyingGlass
              size={verticalScale(22)}
              color={colors.neutral200}
              weight='bold'
            />
          </TouchableOpacity>
        </View>
        <ScrollView
          contentContainerStyle={styles.scrollViewStyle}
          showsHorizontalScrollIndicator={false}
        >
          {/* Card */}
          <View>
            <HomeCard />
          </View>
          <TransactionList
            data={recentTransactions}
            loading={transactionsLoading}
            emptyListMessage="¡Aún no se han añadido transacciones!"
            title="Transacciones recientes"
          />
        </ScrollView>
        <Button style={styles.floatingButton} onPress={() => router.push('/(modals)/transactionModal')}>
          <Icons.Plus
            color={colors.white}
            weight='bold'
            size={verticalScale(24)}
          />
        </Button>
      </View>
    </ScreenWrapper>
  )
}

export default Home

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    marginTop: verticalScale(8),
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacingY._10,
  },
  searchIcon: {
    backgroundColor: colors.neutral700,
    padding: spacingX._10,
    borderRadius: 50
  },
  floatingButton: {
    height: verticalScale(50),
    width: verticalScale(50),
    borderRadius: 100,
    position: "absolute",
    bottom: verticalScale(30),
    right: verticalScale(30)
  },
  scrollViewStyle: {
    marginTop: spacingY._10,
    paddingBottom: verticalScale(100),
    gap: spacingY._25
  }
})