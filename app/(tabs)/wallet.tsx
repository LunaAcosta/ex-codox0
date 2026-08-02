import EmptyState from '@/shared/components/EmptyState';
import Loading from '@/shared/components/Loading';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import useFetchData from '@/shared/hooks/useFetchData';
import { verticalScale } from '@/shared/utils/styling';
import WalletListItem from '@/features/wallet/presentation/components/WalletListItem';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { orderBy, where } from 'firebase/firestore';
import * as Icons from 'phosphor-react-native';
import { useMemo } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';
import { WalletType } from '../../src/shared/types';

const Wallet = () => {
  const router = useRouter();
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const constraints = useMemo(() => [where('uid', '==', uid), orderBy('created', 'desc')], [uid]);
  const { data: wallets, error, loading } = useFetchData<WalletType>('wallets', constraints);
  const totalBalance = wallets.reduce((total, wallet) => total + Number(wallet.amount || 0), 0);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.pageHeader}>
          <View><Typo size={12} color={colors.neutral400}>ORGANIZA TU DINERO</Typo><Typo size={24} fontWeight="900">Mis carteras</Typo></View>
          <TouchableOpacity accessibilityLabel="Agregar cartera" style={styles.addButton} onPress={() => router.push('/(modals)/walletModal')}>
            <Icons.Plus size={21} color={colors.neutral900} weight="bold" />
          </TouchableOpacity>
        </View>

        <LinearGradient colors={['#252033', '#1D2532']} style={styles.balanceCard}>
          <View style={styles.balanceIcon}><Icons.Wallet size={23} color={colors.primary} weight="duotone" /></View>
          <Typo size={11} color={colors.neutral400} fontWeight="700">PATRIMONIO DISPONIBLE</Typo>
          <Typo size={34} fontWeight="900" style={styles.balanceAmount}>
            ${totalBalance.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </Typo>
          <View style={styles.balanceFooter}>
            <Typo size={12} color={colors.neutral400}>{wallets.length} {wallets.length === 1 ? 'cartera conectada' : 'carteras conectadas'}</Typo>
            <Icons.ShieldCheck size={18} color={colors.green} weight="fill" />
          </View>
        </LinearGradient>

        <View style={styles.listHeader}>
          <Typo size={17} fontWeight="800">Tus carteras</Typo>
          <Typo size={11} color={colors.neutral400}>Toca una para editar</Typo>
        </View>

        {loading ? <Loading color={colors.primary} /> : error ? (
          <EmptyState title="No pudimos cargar tus carteras" description="Verifica tu conexión e intenta nuevamente." />
        ) : (
          <FlatList
            data={wallets}
            keyExtractor={(item, index) => item.id || String(index)}
            renderItem={({ item, index }) => <WalletListItem item={item} index={index} router={router} />}
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<EmptyState title="Crea tu primera cartera" description="Separa efectivo, cuentas bancarias o ahorros para conocer tu saldo real." />}
          />
        )}
      </View>
    </ScreenWrapper>
  );
};

export default Wallet;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  pageHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: spacingY._10 },
  addButton: { width: 44, height: 44, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  balanceCard: { minHeight: verticalScale(180), borderRadius: radius._24, padding: spacingX._20, marginTop: spacingY._12, borderWidth: 1, borderColor: '#3A4353' },
  balanceIcon: { position: 'absolute', right: spacingX._20, top: spacingY._20, width: 46, height: 46, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  balanceAmount: { marginTop: spacingY._12, letterSpacing: -0.7 },
  balanceFooter: { marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: spacingY._25, marginBottom: spacingY._12 },
  list: { paddingBottom: verticalScale(90), flexGrow: 1 },
});
