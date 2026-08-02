import { ApiWallet } from '@/features/financeApi/types/FinanceApiTypes';
import { LinearGradient } from 'expo-linear-gradient';
import * as Icons from 'phosphor-react-native';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import Typo from '../../../../shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '../../../../shared/constants/theme';
import { scale, verticalScale } from '../../../../shared/utils/styling';

type HomeCardProps = {
  wallets: ApiWallet[];
  loading?: boolean;
  selectedWalletId: string;
  onSelectWallet: (walletId: string) => void;
  pendingPayments?: number;
};

const formatCurrency = (value: number) =>
  `$${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const HomeCard = ({ wallets, loading, selectedWalletId, onSelectWallet, pendingPayments = 0 }: HomeCardProps) => {
  const selectedWallets = useMemo(
    () => selectedWalletId === 'all' ? wallets : wallets.filter((wallet) => wallet.id === selectedWalletId),
    [selectedWalletId, wallets],
  );
  const totals = useMemo(
    () => selectedWallets.reduce(
      (result, wallet) => ({
        balance: result.balance + Number(wallet.amount || 0),
        income: result.income + Number(wallet.totalIncome || 0),
        expense: result.expense + Number(wallet.totalExpenses || 0),
      }),
      { balance: 0, income: 0, expense: 0 },
    ),
    [selectedWallets],
  );
  const selectedName = selectedWalletId === 'all'
    ? 'Todas las billeteras'
    : wallets.find((wallet) => wallet.id === selectedWalletId)?.name || 'Billetera';
  const walletOptions = useMemo(() => [
    { label: 'Todas las billeteras', value: 'all', count: wallets.length },
    ...wallets.map((wallet) => ({ label: wallet.name, value: wallet.id, count: 1 })),
  ], [wallets]);

  return (
    <LinearGradient colors={['#F9CC70', colors.primary, '#D98A16']} style={styles.card}>
      <View style={styles.decorOne} />
      <View style={styles.decorTwo} />
      <View style={styles.header}>
        <View>
          <Typo size={10} color="#5B3A08" fontWeight="800">SALDO · {selectedName.toUpperCase()}</Typo>
          <Typo size={30} color={colors.neutral900} fontWeight="900" style={styles.balance}>
            {loading ? '—' : formatCurrency(totals.balance)}
          </Typo>
          {pendingPayments > 0 && <Typo size={10} color="#6B4A15" fontWeight="700">Después de pagos: {formatCurrency(Math.max(totals.balance - pendingPayments, 0))}</Typo>}
        </View>
        <Dropdown
          accessibilityLabel="Seleccionar billetera"
          style={styles.walletDropdown}
          containerStyle={styles.dropdownMenu}
          itemContainerStyle={styles.dropdownItem}
          selectedTextStyle={styles.selectedText}
          placeholderStyle={styles.selectedText}
          inputSearchStyle={styles.searchInput}
          data={walletOptions}
          mode="modal"
          search={walletOptions.length > 6}
          searchPlaceholder="Buscar billetera"
          maxHeight={verticalScale(280)}
          labelField="label"
          valueField="value"
          value={selectedWalletId}
          onChange={(item) => onSelectWallet(item.value)}
          renderLeftIcon={() => <Icons.Wallet size={16} color={colors.neutral900} weight="fill" />}
          renderRightIcon={() => <View style={styles.countBubble}><Typo size={9} color={colors.neutral900} fontWeight="900">{selectedWallets.length}</Typo><Icons.CaretDown size={11} color={colors.neutral900} weight="bold" /></View>}
          renderItem={(item) => <View style={styles.dropdownOption}><View style={styles.dropdownOptionIcon}>{item.value === 'all' ? <Icons.SquaresFour size={16} color={colors.primary} weight="fill" /> : <Icons.Wallet size={16} color={colors.blue} weight="fill" />}</View><Typo size={12} fontWeight="700" style={{ flex: 1 }}>{item.label}</Typo>{item.value === selectedWalletId && <Icons.Check size={16} color={colors.primary} weight="bold" />}</View>}
        />
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#DDFBEA' }]}><Icons.ArrowDownLeft size={15} color="#087443" weight="bold" /></View>
          <View><Typo size={10} color="#6B4A15">Ingresos</Typo><Typo size={14} color="#075E38" fontWeight="800">{loading ? '—' : formatCurrency(totals.income)}</Typo></View>
        </View>
        <View style={styles.divider} />
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE4E2' }]}><Icons.ArrowUpRight size={15} color="#B42318" weight="bold" /></View>
          <View><Typo size={10} color="#6B4A15">Gastos</Typo><Typo size={14} color="#9B241A" fontWeight="800">{loading ? '—' : formatCurrency(totals.expense)}</Typo></View>
        </View>
      </View>
    </LinearGradient>
  );
};

export default HomeCard;

const styles = StyleSheet.create({
  card: { minHeight: scale(205), borderRadius: radius._24, padding: spacingX._20, gap: spacingY._15, overflow: 'hidden', shadowColor: colors.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 18, elevation: 6 },
  decorOne: { position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: '#FFFFFF20', right: -60, top: -90 },
  decorTwo: { position: 'absolute', width: 100, height: 100, borderRadius: 50, borderWidth: 18, borderColor: '#FFFFFF18', left: -40, bottom: -55 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacingX._7 },
  balance: { marginTop: spacingY._5, letterSpacing: -0.7 },
  walletDropdown: { width: scale(145), minHeight: verticalScale(38), flexDirection: 'row', gap: 5, paddingHorizontal: 9, borderRadius: radius._15, backgroundColor: '#FFFFFF66', borderWidth: 1, borderColor: '#7A4C1933' },
  dropdownMenu: { borderRadius: radius._17, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', paddingVertical: 5 },
  dropdownItem: { borderRadius: radius._12 },
  selectedText: { color: colors.neutral900, fontSize: verticalScale(10), fontWeight: '800', marginLeft: 5 },
  searchInput: { color: colors.text, borderRadius: radius._12, borderColor: colors.border, fontSize: verticalScale(11) },
  countBubble: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 5, height: 22, borderRadius: 11, backgroundColor: '#FFFFFF66' },
  dropdownOption: { minHeight: verticalScale(46), flexDirection: 'row', alignItems: 'center', gap: spacingX._10, paddingHorizontal: spacingX._12 },
  dropdownOptionIcon: { width: 30, height: 30, borderRadius: radius._10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  stats: { flexDirection: 'row', alignItems: 'center', padding: spacingX._12, borderRadius: radius._15, backgroundColor: '#FFFFFF4D' },
  statItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacingX._7 },
  statIcon: { width: verticalScale(31), height: verticalScale(31), borderRadius: radius._10, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 34, width: 1, backgroundColor: '#7A4C1933', marginHorizontal: spacingX._7 },
});
