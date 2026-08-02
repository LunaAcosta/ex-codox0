import ImageUpload from '@/features/ocr/presentation/components/ImageUpload'
import BackButton from '@/shared/components/BackButton'
import Button from '@/shared/components/Button'
import Header from '@/shared/components/Header'
import Input from '@/shared/components/Input'
import ModalWrapper from '@/shared/components/ModalWrapper'
import Typo from '@/shared/components/Typo'
import { expenseCategories } from '@/shared/constants/data'
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme'
import useFetchData from '@/shared/hooks/useFetchData'
import { scale, verticalScale } from '@/shared/utils/styling'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { orderBy, where } from 'firebase/firestore'
import * as Icons from "phosphor-react-native"
import { useMemo, useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { useAuth } from '../../src/contexts/authContext'
import { extractDocumentData } from '../../src/features/ocr/application/services/ocrService'
import { createUpdateTransaction, deleteTransaction } from '../../src/features/transactions/application/services/transactionService'
import { TransactionType, WalletType } from '../../src/shared/types'

type TransactionParams = {
  id: string;
  type: string;
  amount: string;
  category?: string;
  date: string;
  description?: string;
  image?: string;
  uid?: string;
  walletId: string;
};

type TransactionKind = 'expense' | 'income';
type TransactionDraft = { transaction: TransactionType; amountInput: string };

const parseDeviceDate = (value?: string) => {
  if (!value) return new Date();
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (dateOnly) return new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]));
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
};

const isSameDeviceDay = (first: Date, second: Date) =>
  first.getFullYear() === second.getFullYear()
  && first.getMonth() === second.getMonth()
  && first.getDate() === second.getDate();

const createEmptyDraft = (type: TransactionKind): TransactionDraft => ({
  transaction: {
    type,
    amount: 0,
    description: '',
    category: type === 'income' ? 'income' : '',
    date: new Date(),
    walletId: '',
    image: null,
  },
  amountInput: '',
});

const TransactionModal = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const oldTransaction = useLocalSearchParams<TransactionParams>();
  const initialAmount = Number(oldTransaction.amount || 0);
  const initialType: TransactionKind = oldTransaction.type === 'income' ? 'income' : 'expense';
  const [activeType, setActiveType] = useState<TransactionKind>(initialType);
  const [drafts, setDrafts] = useState<Record<TransactionKind, TransactionDraft>>(() => {
    const initialDrafts = {
      expense: createEmptyDraft('expense'),
      income: createEmptyDraft('income'),
    };
    if (oldTransaction.id) {
      initialDrafts[initialType] = {
        transaction: {
          type: initialType,
          amount: initialAmount,
          description: oldTransaction.description || '',
          category: oldTransaction.category || (initialType === 'income' ? 'income' : ''),
          date: parseDeviceDate(oldTransaction.date),
          walletId: oldTransaction.walletId || '',
          image: oldTransaction.image || null,
        },
        amountInput: String(initialAmount),
      };
    }
    return initialDrafts;
  });
  const transaction = drafts[activeType].transaction;
  const amountInput = drafts[activeType].amountInput;
  const setTransaction = (next: TransactionType | ((current: TransactionType) => TransactionType)) => {
    setDrafts((currentDrafts) => {
      const current = currentDrafts[activeType];
      const updated = typeof next === 'function' ? next(current.transaction) : next;
      return { ...currentDrafts, [activeType]: { ...current, transaction: updated } };
    });
  };
  const setAmountInput = (value: string) => {
    setDrafts((currentDrafts) => ({
      ...currentDrafts,
      [activeType]: { ...currentDrafts[activeType], amountInput: value },
    }));
  };
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showDatePicket, setShowDatePicket] = useState(false)
  const router = useRouter();
  const selectedDate = transaction.date as Date;
  const deviceToday = new Date();
  const selectedDateIsToday = isSameDeviceDay(selectedDate, deviceToday);


  const constraints = useMemo(() => [
    where("uid", "==", uid),
    orderBy("created", "desc")
  ], [uid]);

  const {
    data: wallets,
  } = useFetchData<WalletType>("wallets", constraints);

  const formatDecimalAmount = (value: string) => {
    const sanitized = value.replace(/[^\d.]/g, '');
    const parts = sanitized.split('.');

    if (parts.length > 2) {
      return `${parts[0]}.${parts.slice(1).join('')}`;
    }

    if (parts[1] && parts[1].length > 2) {
      parts[1] = parts[1].slice(0, 2);
    }

    return parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
  };

  const formatMoney = (value: number | string | null | undefined) => {
    const parsed = Number(value ?? 0);
    return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
  };

  const onValueChange = (_event: any, selectedDate?: Date) => {
    if (selectedDate) {
      setTransaction((prev) => ({ ...prev, date: selectedDate }));
    }

    if (Platform.OS !== 'ios') {
      setShowDatePicket(false);
    }
  };

  const onDismiss = () => {
    setShowDatePicket(false);
  };

  const selectTransactionType = (type: 'expense' | 'income') => {
    setShowDatePicket(false);
    setActiveType(type);
  };
  const handleScanReceipt = async () => {
    if (!transaction.image) {
      Alert.alert('OCR', 'Sube primero una imagen del ticket/factura.');
      return;
    }

    setOcrLoading(true);
    const result = await extractDocumentData(transaction.image);
    setOcrLoading(false);

    if (!result.success || !result.data) {
      Alert.alert('OCR', result.msg || 'No se pudo analizar el documento.');
      return;
    }

    const extracted = result.data;
    const nextAmount = typeof extracted.amount === 'number' ? extracted.amount : Number(amountInput || 0);
    const nextCategory = extracted.category || transaction.category;
    const receiptDate = extracted.date ? parseDeviceDate(extracted.date) : null;

    setAmountInput(String(nextAmount));
    setTransaction((prev) => ({
      ...prev,
      amount: nextAmount,
      description: extracted.description || prev.description,
      category: nextCategory,
      date: receiptDate || prev.date,
    }));

    Alert.alert(
      'Recibo analizado',
      receiptDate
        ? `Aplicamos la fecha impresa en el recibo: ${receiptDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}. Revisa los campos antes de guardar.`
        : 'Completamos los datos visibles, pero no encontramos una fecha válida en el recibo. Conservamos la fecha seleccionada.',
    );
  };

  const onSubmit = async () => {
    const { type, description, category, date, walletId, image } = transaction;
    const amount = Number(amountInput || 0);

    if (!walletId || !date || !amountInput.trim() || (type === 'expense' && !category)) {
      Alert.alert("Transacción", "Por favor, complete todos los campos")
      return;
    }
    let transactionData: TransactionType = {
      type,
      amount,
      description,
      category,
      date,
      walletId,
      image: image ? image : null,
      uid: user?.uid
    }

    if(oldTransaction?.id) transactionData.id = oldTransaction.id;

    // todo: include transaction id for updating
    setLoading(true)
    const res = await createUpdateTransaction(transactionData);

    setLoading(false);
    if (res.success) {
      router.back();
    } else {
      Alert.alert("Transacción", res.msg)
    }
  };

  const onDelete = async () => {
    if (!oldTransaction?.id) return;
    setLoading(true);
    const res = await deleteTransaction(
      oldTransaction?.id, 
      oldTransaction.walletId
    );
    setLoading(false);
    if (res.success) {
      router.back()
    } else {
      Alert.alert("Transacción", res.msg)
    }
  }

  const showDeleteAlert = () => {
    Alert.alert(
      "Confirmar eliminación",
      "¿Estás seguro de que quieres eliminar esta transacción?",
      [
        {
          text: "Cancelar",
          onPress: () => console.log("Cancelar eliminación"),
          style: "cancel"
        },
        {
          text: "Eliminar",
          onPress: () => onDelete(),
          style: "destructive"
        },

      ]
    );

  }


  return (
    <ModalWrapper>
      <View style={styles.container}>
        <Header
          title={oldTransaction?.id ? "Editar movimiento" : "Nuevo movimiento"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        {/* Form */}
        <ScrollView contentContainerStyle={styles.form} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.typeSection}>
            <View>
              <Typo color={colors.neutral100} size={16} fontWeight="900">¿Qué deseas registrar?</Typo>
              <Typo color={colors.neutral400} size={11}>Elige una opción antes de completar el movimiento.</Typo>
            </View>
            <View style={styles.typeSelector}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: transaction.type === 'expense' }}
                style={[styles.typeOption, transaction.type === 'expense' && styles.expenseOptionActive]}
                onPress={() => selectTransactionType('expense')}
              >
                <View style={[styles.typeIcon, styles.expenseIcon]}><Icons.ArrowUpRight size={21} color={colors.rose} weight="bold" /></View>
                <View style={{ flex: 1 }}><Typo size={14} fontWeight="900">Gasto</Typo><Typo size={10} color={colors.neutral400}>Dinero que salió</Typo></View>
                {transaction.type === 'expense' && <Icons.CheckCircle size={19} color={colors.rose} weight="fill" />}
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: transaction.type === 'income' }}
                style={[styles.typeOption, transaction.type === 'income' && styles.incomeOptionActive]}
                onPress={() => selectTransactionType('income')}
              >
                <View style={[styles.typeIcon, styles.incomeIcon]}><Icons.ArrowDownLeft size={21} color={colors.green} weight="bold" /></View>
                <View style={{ flex: 1 }}><Typo size={14} fontWeight="900">Ingreso</Typo><Typo size={10} color={colors.neutral400}>Dinero que entró</Typo></View>
                {transaction.type === 'income' && <Icons.CheckCircle size={19} color={colors.green} weight="fill" />}
              </Pressable>
            </View>
          </View>

          {/* Wallet Items */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={14} fontWeight="700">¿En qué billetera?</Typo>
            {/* dropdown here */}
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={wallets.map(wallet => ({
                label: `${wallet?.name} ($${formatMoney(wallet?.amount)})`,
                value: wallet.id,
              }))}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              placeholder={'Seleccione billetera'}
              value={transaction.walletId}
              onChange={item => {
                setTransaction({ ...transaction, walletId: item.value || "" })
              }}
            />
          </View>

          {/* expense categories  */}
          {
            transaction.type === 'expense' && (
              <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={14} fontWeight="700">Categoría del gasto</Typo>
                {/* dropdown here */}
                <Dropdown
                  style={styles.dropdownContainer}
                  activeColor={colors.neutral700}
                  placeholderStyle={styles.dropdownPlaceholder}
                  selectedTextStyle={styles.dropdownSelectedText}
                  iconStyle={styles.dropdownIcon}
                  data={Object.values(expenseCategories)}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  itemTextStyle={styles.dropdownItemText}
                  itemContainerStyle={styles.dropdownItemContainer}
                  containerStyle={styles.dropdownListContainer}
                  placeholder={'Seleccione categoría'}
                  value={transaction.category}
                  onChange={item => {
                    setTransaction({ ...transaction, category: item.value || "" })
                  }}
                />
              </View>
            )
          }



          {/* date picker  */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={14} fontWeight="700">Fecha</Typo>
            <Pressable style={styles.dateInput} onPress={() => setShowDatePicket(true)}>
              <View style={styles.dateIcon}><Icons.CalendarBlank size={19} color={colors.primary} weight="fill" /></View>
              <View style={{ flex: 1 }}>
                <Typo size={13} fontWeight="800">{selectedDateIsToday ? 'Hoy' : selectedDate.toLocaleDateString('es-GT', { weekday: 'long' })}</Typo>
                <Typo size={10} color={colors.neutral400}>{selectedDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'long', year: 'numeric' })}</Typo>
              </View>
              {!selectedDateIsToday && <Pressable hitSlop={8} onPress={() => setTransaction((current) => ({ ...current, date: new Date() }))}><Typo size={10} color={colors.primary} fontWeight="800">Usar hoy</Typo></Pressable>}
              <Icons.CaretDown size={15} color={colors.neutral400} weight="bold" />
            </Pressable>
            {
              showDatePicket && (
                <View style={Platform.OS === 'ios' && styles.iosDatePicker}>
                  <DateTimePicker
                    themeVariant='dark'
                    value={transaction.date as Date}
                    textColor={colors.white}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    maximumDate={new Date()}
                    onValueChange={onValueChange}
                    onDismiss={onDismiss}
                  />
                  {Platform.OS === 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicket(false)}
                    >
                      <Typo size={13} color={colors.neutral900} fontWeight={"800"}>
                        Listo
                      </Typo>
                    </TouchableOpacity>
                  )
                  }
                </View>
              )
            }
          </View>
          {/* amount */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={14} fontWeight="700">Monto del {transaction.type === 'expense' ? 'gasto' : 'ingreso'}</Typo>
            <Input
              keyboardType="decimal-pad"
              inputMode="decimal"
              value={amountInput}
              icon={<Typo size={18} color={transaction.type === 'expense' ? colors.rose : colors.green} fontWeight="900">$</Typo>}
              placeholder="0.00"
              onChangeText={(value) => {
                const formattedValue = formatDecimalAmount(value);
                setAmountInput(formattedValue);
                setTransaction({
                  ...transaction,
                  amount: formattedValue === '' ? 0 : Number(formattedValue),
                });
              }}
            />
          </View>

          {/* Description */}
          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={14} fontWeight="700">Descripción</Typo>
              <Typo color={colors.neutral500} size={14}>(Opcional)</Typo>
            </View>
            <Input
              // placeholder="Salary"
              value={transaction.description}
              multiline
              containerStyle={{
                flexDirection: "row",
                height: verticalScale(100),
                alignItems: "flex-start",
                paddingVertical: 15
              }}
              onChangeText={(value) => setTransaction({
                ...transaction,
                description: value,
              })}
            />
          </View>

          {transaction.type === 'expense' && <View style={styles.receiptCard}>
            <View style={styles.flexRow}>
              <View style={styles.receiptIcon}><Icons.Receipt size={19} color={colors.primary} weight="fill" /></View>
              <View style={{ flex: 1 }}><Typo color={colors.neutral200} size={14} fontWeight="800">Completar con recibo</Typo><Typo color={colors.neutral400} size={10}>Opcional</Typo></View>
              <View style={styles.aiPill}><Icons.Sparkle size={12} color={colors.primary} weight="fill" /><Typo color={colors.primary} size={10} fontWeight="700">IA</Typo></View>
            </View>
            <Typo size={11} color={colors.neutral400}>Puedes llenar todo manualmente o subir un recibo para completar los campos automáticamente.</Typo>
            {/* Image input */}
            <ImageUpload
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) => setTransaction({ ...transaction, image: file })}
              placeholder="Agregar recibo" />
            <Button disabled={!transaction.image} onPress={handleScanReceipt} loading={ocrLoading} style={styles.scanButton}>
              <View style={styles.scanContent}><Icons.Scan size={18} color={colors.neutral900} weight="bold" /><Typo color={colors.neutral900} size={14} fontWeight="800">Analizar recibo con IA</Typo></View>
            </Button>
          </View>}
        </ScrollView>
      </View>
      <View style={styles.footer}>
        {oldTransaction?.id && !loading && (
          <Button
            onPress={showDeleteAlert}
            style={{
              backgroundColor: colors.rose,
              paddingHorizontal: spacingX._15
            }}
          >
            <Icons.Trash
              color={colors.white}
              size={verticalScale(24)}
              weight="bold"
            />
          </Button>
        )}
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1, backgroundColor: transaction.type === 'expense' ? colors.rose : colors.green }}>
          <Typo color={colors.neutral900} fontWeight={"800"}>
            
            {
              oldTransaction?.id
                ? "Guardar cambios"
                : transaction.type === 'expense' ? "Guardar gasto" : "Guardar ingreso"
            }
          </Typo>
        </Button>
      </View>

    </ModalWrapper>
  )
}

export default TransactionModal

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },
  form: {
    gap: spacingY._20,
    paddingVertical: spacingY._15,
    paddingBottom: spacingY._40,
  },

  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  inputContainer: {
    gap: spacingY._10,
  },
  typeSection: { gap: spacingY._12, padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  typeSelector: { flexDirection: 'row', gap: spacingX._10 },
  typeOption: { flex: 1, minHeight: verticalScale(82), flexDirection: 'row', alignItems: 'center', gap: spacingX._7, padding: spacingX._10, borderRadius: radius._17, backgroundColor: colors.surfaceElevated, borderWidth: 1.5, borderColor: colors.border },
  expenseOptionActive: { borderColor: colors.rose, backgroundColor: `${colors.rose}10` },
  incomeOptionActive: { borderColor: colors.green, backgroundColor: `${colors.green}10` },
  typeIcon: { width: 34, height: 34, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center' },
  expenseIcon: { backgroundColor: `${colors.rose}16` },
  incomeIcon: { backgroundColor: `${colors.green}16` },
  aiPill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: radius._20, backgroundColor: `${colors.primary}18` },
  receiptCard: { gap: spacingY._12, padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  receiptIcon: { width: 36, height: 36, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}16` },
  scanButton: { marginTop: spacingY._5 },
  scanContent: { flexDirection: 'row', alignItems: 'center', gap: spacingX._7 },
  iosDropDown: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.border,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },

  androidDropDown: {
    // flexDirection: "row", 
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    fontSize: verticalScale(14),
    color: colors.white,
    borderColor: colors.border,
    borderRadius: radius._17,
    borderCurve: "continuous",
    // paddingHorizontal: spacingX._15,
  },
  flexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacingX._5,
  },

  dateInput: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    gap: spacingX._10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  dateIcon: { width: 34, height: 34, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}14` },
  iosDatePicker: {
    // backgroundColor: "red",
  },
  datePickerButton: {
    backgroundColor: colors.primary,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacingX._15,
    borderRadius: radius._15,
    borderCurve: "continuous",
  },
  dropdownItemText: { color: colors.white },
  dropdownSelectedText: {
    color: colors.white,
    fontSize: verticalScale(14),
  },
  dropdownListContainer: {
    backgroundColor: colors.neutral900,
    borderRadius: radius._15,
    borderCurve: "continuous",
    paddingVertical: spacingY._7,
    top: 5,
    borderColor: colors.neutral500,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 15,
    elevation: 5,
  },
  dropdownPlaceholder: {
    color: colors.white,
  },
  dropdownItemContainer: {
    borderRadius: radius._15,
    marginHorizontal: spacingX._7,
  },
  dropdownIcon: {
    height: verticalScale(30),
    tintColor: colors.neutral300,
  },
});
