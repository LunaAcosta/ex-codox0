import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import Input from '@/components/input'
import ModalWrapper from '@/components/ModalWrapper'
import Typo from '@/components/Typo'
import { expenseCategories, transactionTypes } from '@/constants/data'
import { colors, radius, spacingX, spacingY } from '@/constants/theme'
import useFetchData from '@/hooks/useFetchData'
import DateTimePicker from '@react-native-community/datetimepicker'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { orderBy, where } from 'firebase/firestore'
import * as Icons from "phosphor-react-native"
import { useEffect, useMemo, useState } from 'react'
import { Alert, Platform, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { useAuth } from '../../../contexts/authContext'
import { extractDocumentData } from '../../../services/ocrService'
import { createUpdateTransaction, deleteTransaction } from '../../../services/transactionService'
import { TransactionType, WalletType } from '../../../types'
import { scale, verticalScale } from '../../../utils/styling'
const TransactionModal = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const [transaction, setTransaction] = useState<TransactionType>({
    type: 'expense',
    amount: 0,
    description: "",
    category: "",
    date: new Date(),
    walletId: "",
    image: null,

  })
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [amountInput, setAmountInput] = useState('');
  const [showDatePicket, setShowDatePicket] = useState(false)
  const router = useRouter();


  const constraints = useMemo(() => [
    where("uid", "==", uid),
    orderBy("created", "desc")
  ], [uid]);

  const {
    data: wallets,
    error: walletError,
    loading: walletLoading } = useFetchData<WalletType>("wallets", constraints);

  type paramType = {
    id: string,
    type: string,
    amount: string,
    category?: string,
    date: string,
    description?: string,
    image?: any,
    uid?: string,
    walletId: string
  }

  const oldTransaction: paramType =
    useLocalSearchParams();

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
  // console.log("old wallet", oldTransaction)

  useEffect(() => {
    if (oldTransaction?.id) {
      const parsedAmount = Number(oldTransaction.amount || 0);
      setTransaction({
        type: oldTransaction?.type,
        amount: parsedAmount,
        description: oldTransaction.description || "",
        category: oldTransaction.category || "",
        date: new Date(oldTransaction.date),
        walletId: oldTransaction.walletId,
        image: oldTransaction?.image
      });
      setAmountInput(String(parsedAmount));
    }
  }, []);

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

    setAmountInput(String(nextAmount));
    setTransaction((prev) => ({
      ...prev,
      amount: nextAmount,
      description: extracted.description || prev.description,
      category: nextCategory,
      date: extracted.date ? new Date(extracted.date) : prev.date,
    }));

    Alert.alert('OCR', 'Información extraída. Revisa los campos antes de guardar.');
  };

  const onSubmit = async () => {
    const { type, description, category, date, walletId, image } = transaction;
    const amount = Number(amountInput || 0);

    if (!walletId || !date || !amountInput.trim() || (type == 'expense' && !category)) {
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
          title={oldTransaction?.id ? "Actualizar transacción" : "Nueva transacción"}
          leftIcon={<BackButton />}
          style={{ marginBottom: spacingY._10 }}
        />
        {/* Form */}
        <ScrollView contentContainerStyle={styles.form} showsHorizontalScrollIndicator={false}>
          {/* Type Trasaction Item */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>Tipo</Typo>
            {/* dropdown here */}
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              // placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={transactionTypes}
              maxHeight={300}
              labelField="label"
              valueField="value"
              itemTextStyle={styles.dropdownItemText}
              itemContainerStyle={styles.dropdownItemContainer}
              containerStyle={styles.dropdownListContainer}
              // placeholder={!isFocus ? 'Select item' : '...'}
              value={transaction.type}
              onChange={item => {
                setTransaction({ ...transaction, type: item.value })
              }}
            />
          </View>

          {/* Wallet Items */}
          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200} size={16}>Billetera</Typo>
            {/* dropdown here */}
            <Dropdown
              style={styles.dropdownContainer}
              activeColor={colors.neutral700}
              placeholderStyle={styles.dropdownPlaceholder}
              selectedTextStyle={styles.dropdownSelectedText}
              iconStyle={styles.dropdownIcon}
              data={wallets.map(wallet => ({
                label: `${wallet?.name} ($${wallet.amount})`,
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
            transaction.type == 'expense' && (
              <View style={styles.inputContainer}>
                <Typo color={colors.neutral200} size={16}>Categorías de gastos</Typo>
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
            <Typo color={colors.neutral200} size={16} >Fecha</Typo>
            {!showDatePicket && (
              <Pressable
                style={styles.dateInput}
                onPress={() => setShowDatePicket(true)}
              >
                <Typo size={14}>
                  {(transaction.date as Date).toLocaleDateString()}
                </Typo>
              </Pressable>
            )}
            {
              showDatePicket && (
                <View style={Platform.OS == 'ios' && styles.iosDatePicker}>
                  <DateTimePicker
                    themeVariant='dark'
                    value={transaction.date as Date}
                    textColor={colors.white}
                    display={Platform.OS == "ios" ? "spinner" : "default"}
                    onValueChange={onValueChange}
                    onDismiss={onDismiss}
                  />
                  {Platform.OS == 'ios' && (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowDatePicket(false)}
                    >
                      <Typo size={15} fontWeight={"500"}>
                        OK
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
            <Typo color={colors.neutral200} size={16}>Monto</Typo>
            <Input
              keyboardType="decimal-pad"
              inputMode="decimal"
              value={amountInput}
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
              <Typo color={colors.neutral200} size={16}>Descripción</Typo>
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

          <View style={styles.inputContainer}>
            <View style={styles.flexRow}>
              <Typo color={colors.neutral200} size={16}>Recibo</Typo>
              <Typo color={colors.neutral500} size={14}>(Opcional)</Typo>
            </View>
            {/* Image input */}
            <ImageUpload
              file={transaction.image}
              onClear={() => setTransaction({ ...transaction, image: null })}
              onSelect={(file) => setTransaction({ ...transaction, image: file })}
              placeholder="Subir Imagen" />
            <Button onPress={handleScanReceipt} loading={ocrLoading} style={{ marginTop: spacingY._5 }}>
              <Typo  color={colors.white}  size={16} fontWeight={'500'}>ESCANEAR</Typo>
            </Button>
          </View>
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
        <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
          <Typo color={colors.white} fontWeight={"600"}>
            
            {
              oldTransaction?.id ? "ACTUALIZAR" : "CREAR"
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
  iosDropDown: {
    flexDirection: "row",
    height: verticalScale(54),
    alignItems: "center",
    justifyContent: "center",
    fontSize: verticalScale(14),
    borderWidth: 1,
    color: colors.white,
    borderColor: colors.neutral300,
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
    borderColor: colors.neutral300,
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
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: radius._17,
    borderCurve: "continuous",
    paddingHorizontal: spacingX._15,
  },
  iosDatePicker: {
    // backgroundColor: "red",
  },
  datePickerButton: {
    backgroundColor: colors.neutral700,
    alignSelf: "flex-end",
    padding: spacingY._7,
    marginRight: spacingX._7,
    paddingHorizontal: spacingY._15,
    borderRadius: radius._10,
  },
  dropdownContainer: {
    height: verticalScale(54),
    borderWidth: 1,
    borderColor: colors.neutral300,
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