import BackButton from '@/shared/components/BackButton';
import Button from '@/shared/components/Button';
import Header from '@/shared/components/Header';
import ModalWrapper from '@/shared/components/ModalWrapper';
import Typo from '@/shared/components/Typo';
import { expenseCategories, incomeCategory } from '@/shared/constants/data';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Icons from 'phosphor-react-native';
import { ScrollView, StyleSheet, View } from 'react-native';

import { useAuth } from '../../src/contexts/authContext';
import { useFinancialData } from '../../src/features/financeApi/presentation/hooks/useFinancialData';

type DetailParams = {
  id?: string;
  type?: string;
  amount?: string;
  category?: string;
  date?: string;
  description?: string;
  image?: string;
  uid?: string;
  walletId?: string;
};

const TransactionDetails = () => {
  const params = useLocalSearchParams<DetailParams>();
  const router = useRouter();
  const { user } = useAuth();
  const { wallets } = useFinancialData(user?.uid ?? '');
  const isIncome = params.type === 'income';
  const category = isIncome ? incomeCategory : expenseCategories[params.category || ''] || expenseCategories.others;
  const CategoryIcon = category.icon;
  const amount = Number(params.amount || 0);
  const parsedDate = params.date ? new Date(params.date) : null;
  const validDate = parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null;
  const walletName = wallets.find((wallet) => wallet.id === params.walletId)?.name || 'Billetera';
  const accent = isIncome ? colors.green : colors.rose;

  const editMovement = () => router.replace({
    pathname: '/(modals)/transactionModal',
    params,
  });

  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header title="Resumen del movimiento" leftIcon={<BackButton />} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.hero, { borderColor: `${accent}55` }]}>
            <View style={[styles.heroIcon, { backgroundColor: `${accent}18` }]}><CategoryIcon size={28} color={accent} weight="fill" /></View>
            <View style={styles.typePill}><Typo size={10} color={accent} fontWeight="900">{isIncome ? 'INGRESO' : 'GASTO'}</Typo></View>
            <Typo size={32} color={accent} fontWeight="900">{isIncome ? '+' : '−'} ${amount.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Typo>
            <Typo size={13} color={colors.neutral400}>{category.label}</Typo>
          </View>

          <View style={styles.summaryCard}>
            <View style={styles.detailRow}><View style={styles.detailIcon}><Icons.CalendarBlank size={18} color={colors.primary} weight="fill" /></View><View style={{ flex: 1 }}><Typo size={10} color={colors.neutral400}>Fecha</Typo><Typo size={13} fontWeight="800">{validDate ? validDate.toLocaleDateString('es-GT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Sin fecha'}</Typo></View></View>
            <View style={styles.divider} />
            <View style={styles.detailRow}><View style={styles.detailIcon}><Icons.Wallet size={18} color={colors.blue} weight="fill" /></View><View style={{ flex: 1 }}><Typo size={10} color={colors.neutral400}>Billetera</Typo><Typo size={13} fontWeight="800">{walletName}</Typo></View></View>
            <View style={styles.divider} />
            <View style={styles.detailRow}><View style={styles.detailIcon}><Icons.Note size={18} color={colors.violet} weight="fill" /></View><View style={{ flex: 1 }}><Typo size={10} color={colors.neutral400}>Descripción</Typo><Typo size={13} fontWeight="700">{params.description?.trim() || 'Sin descripción'}</Typo></View></View>
            {params.image && <><View style={styles.divider} /><View style={styles.detailRow}><View style={styles.detailIcon}><Icons.Receipt size={18} color={colors.green} weight="fill" /></View><View style={{ flex: 1 }}><Typo size={10} color={colors.neutral400}>Comprobante</Typo><Typo size={13} fontWeight="700">Recibo adjunto</Typo></View><Icons.CheckCircle size={19} color={colors.green} weight="fill" /></View></>}
          </View>

          <Button onPress={editMovement} style={styles.editButton}><Icons.PencilSimple size={18} color={colors.neutral900} weight="bold" /><Typo color={colors.neutral900} fontWeight="900">Editar movimiento</Typo></Button>
        </ScrollView>
      </View>
    </ModalWrapper>
  );
};

export default TransactionDetails;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  content: { paddingTop: spacingY._20, paddingBottom: verticalScale(40), gap: spacingY._20 },
  hero: { alignItems: 'center', gap: spacingY._7, paddingVertical: spacingY._25, borderRadius: radius._24, backgroundColor: colors.surface, borderWidth: 1 },
  heroIcon: { width: 58, height: 58, borderRadius: radius._20, alignItems: 'center', justifyContent: 'center' },
  typePill: { paddingHorizontal: spacingX._10, paddingVertical: 4, borderRadius: radius._20, backgroundColor: colors.surfaceElevated },
  summaryCard: { padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  detailRow: { minHeight: verticalScale(58), flexDirection: 'row', alignItems: 'center', gap: spacingX._10 },
  detailIcon: { width: 36, height: 36, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceElevated },
  divider: { height: 1, backgroundColor: colors.border },
  editButton: { flexDirection: 'row', gap: spacingX._7 },
});