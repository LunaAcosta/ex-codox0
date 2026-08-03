import { useFinancialData } from '@/features/financeApi/presentation/hooks/useFinancialData';
import { getProfileImage } from '@/features/ocr/application/services/imageService';
import HomeCard from '@/features/transactions/presentation/components/HomeCard';
import TransactionList from '@/features/transactions/presentation/components/TransactionList';
import Button from '@/shared/components/Button';
import EmptyState from '@/shared/components/EmptyState';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';

const Home = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const router = useRouter();
  const [selectedWalletId, setSelectedWalletId] = useState('all');
  const { transactions, wallets, reminders, error, loading, refresh } = useFinancialData(uid);
  const filteredTransactions = useMemo(
    () => transactions
      .filter((transaction) => selectedWalletId === 'all' || transaction.walletId === selectedWalletId)
      .sort((first, second) => {
        const firstTime = new Date(first.date).getTime();
        const secondTime = new Date(second.date).getTime();
        return (Number.isNaN(secondTime) ? 0 : secondTime) - (Number.isNaN(firstTime) ? 0 : firstTime);
      })
      .slice(0, 30),
    [selectedWalletId, transactions],
  );
  const greeting = new Date().getHours() < 12 ? 'Buenos días' : new Date().getHours() < 18 ? 'Buenas tardes' : 'Buenas noches';
  const pendingReminders = useMemo(
    () => reminders
      .filter((reminder) => reminder.status === 'pending' && (selectedWalletId === 'all' || reminder.walletId === selectedWalletId))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [reminders, selectedWalletId],
  );
  const pendingPayments = useMemo(
    () => pendingReminders.reduce((total, reminder) => total + Number(reminder.amount || 0), 0),
    [pendingReminders],
  );
  const formatCurrency = (value: number) => `$${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Typo size={12} color={colors.neutral400}>{greeting}</Typo>
            <Typo size={22} fontWeight="900">{user?.name || 'Tu espacio financiero'}</Typo>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/(tabs)/profile')}>
            <Image source={getProfileImage(user?.image)} style={styles.profileImage} contentFit="cover" transition={120} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={refresh} tintColor={colors.primary} />}>
          <HomeCard wallets={wallets} loading={loading} selectedWalletId={selectedWalletId} onSelectWallet={setSelectedWalletId} pendingPayments={pendingPayments} />

          <View>
            <Typo size={12} color={colors.neutral400} fontWeight="700" style={styles.sectionLabel}>ACCESOS RÁPIDOS</Typo>
            <View style={styles.quickActions}>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(modals)/transactionModal')}>
                <View style={[styles.quickIcon, { backgroundColor: `${colors.green}18` }]}><Icons.Plus size={20} color={colors.green} weight="bold" /></View>
                <Typo size={12} fontWeight="700">Movimiento</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/ai-tools')}>
                <View style={[styles.quickIcon, { backgroundColor: `${colors.violet}18` }]}><Icons.Brain size={20} color={colors.violet} weight="fill" /></View>
                <Typo size={12} fontWeight="700">Análisis IA</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/(tabs)/statistics')}>
                <View style={[styles.quickIcon, { backgroundColor: `${colors.blue}18` }]}><Icons.ChartBar size={20} color={colors.blue} weight="fill" /></View>
                <Typo size={12} fontWeight="700">Estadísticas</Typo>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickAction} onPress={() => router.push('/payment-reminders')}>
                <View style={[styles.quickIcon, { backgroundColor: `${colors.primary}18` }]}><Icons.CalendarCheck size={20} color={colors.primary} weight="fill" /></View>
                <Typo size={12} fontWeight="700">Próximos pagos</Typo>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.reminderCard} onPress={() => router.push('/payment-reminders')} activeOpacity={0.82}>
            <View style={styles.reminderHeading}>
              <View style={styles.reminderIcon}><Icons.ClockCountdown size={22} color={colors.primary} weight="fill" /></View>
              <View style={{ flex: 1 }}>
                <Typo size={15} fontWeight="900">Pagos por venir</Typo>
                <Typo size={11} color={colors.neutral400}>{pendingReminders.length ? `${pendingReminders.length} movimiento${pendingReminders.length === 1 ? '' : 's'} flotante${pendingReminders.length === 1 ? '' : 's'}` : 'Planifica tus gastos antes de que lleguen'}</Typo>
              </View>
              <Icons.CaretRight size={18} color={colors.neutral400} weight="bold" />
            </View>
            {pendingReminders.length > 0 && (
              <View style={styles.nextPayment}>
                <View style={{ flex: 1 }}>
                  <Typo size={12} fontWeight="800">{pendingReminders[0].title}</Typo>
                  <Typo size={10} color={colors.neutral400}>{new Date(pendingReminders[0].dueDate).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} · {wallets.find((wallet) => wallet.id === pendingReminders[0].walletId)?.name || 'Billetera'}</Typo>
                </View>
                <Typo size={14} color={colors.rose} fontWeight="900">−{formatCurrency(pendingReminders[0].amount)}</Typo>
              </View>
            )}
          </TouchableOpacity>

          {error ? (
            <EmptyState title="No pudimos cargar tus movimientos" description="Revisa tu conexión e inténtalo nuevamente." />
          ) : (
            <TransactionList data={filteredTransactions} loading={loading} emptyListMessage="No hay movimientos en esta selección" title={selectedWalletId === 'all' ? 'Actividad reciente' : 'Movimientos de la billetera'} />
          )}
        </ScrollView>

        <Button accessibilityLabel="Agregar transacción" style={styles.floatingButton} onPress={() => router.push('/(modals)/transactionModal')}>
          <Icons.Plus color={colors.neutral900} weight="bold" size={verticalScale(24)} />
        </Button>
      </View>
    </ScreenWrapper>
  );
};

export default Home;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacingY._10 },
  profileButton: { width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 2, borderColor: `${colors.primary}55` },
  profileImage: { width: '100%', height: '100%' },
  scroll: { paddingTop: spacingY._7, paddingBottom: verticalScale(110), gap: spacingY._25 },
  sectionLabel: { marginBottom: spacingY._10 },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacingX._10 },
  quickAction: { width: '48%', flexGrow: 1, alignItems: 'center', gap: spacingY._7, paddingVertical: spacingY._12, borderRadius: radius._15, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  quickIcon: { width: 38, height: 38, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center' },
  reminderCard: { padding: spacingX._15, gap: spacingY._12, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  reminderHeading: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10 },
  reminderIcon: { width: 42, height: 42, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}16` },
  nextPayment: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10, paddingTop: spacingY._10, borderTopWidth: 1, borderTopColor: colors.border },
  floatingButton: { height: verticalScale(54), width: verticalScale(54), borderRadius: 27, position: 'absolute', bottom: verticalScale(18), right: spacingX._20 },
});