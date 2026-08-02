import BackButton from '@/shared/components/BackButton';
import Button from '@/shared/components/Button';
import Header from '@/shared/components/Header';
import Input from '@/shared/components/Input';
import ScreenWrapper from '@/shared/components/ScreenWrapper';
import Typo from '@/shared/components/Typo';
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { verticalScale } from '@/shared/utils/styling';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import * as Icons from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';

import { useAuth } from '../src/contexts/authContext';
import {
  attachReminderNotification,
  cancelPaymentReminder,
  createPaymentReminder,
  processPaymentReminder,
} from '../src/features/financeApi/application/financeApiService';
import {
  cancelPaymentNotification,
  schedulePaymentNotification,
} from '../src/features/financeApi/application/notificationService';
import { useFinancialData } from '../src/features/financeApi/presentation/hooks/useFinancialData';
import { PaymentReminder } from '../src/features/financeApi/types/FinanceApiTypes';

type PickerMode = 'date' | 'time' | null;

const tomorrowMorning = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(9, 0, 0, 0);
  return date;
};

const money = (value: number) => `$${value.toLocaleString('es-GT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PaymentReminders = () => {
  const { user } = useAuth();
  const uid = user?.uid ?? '';
  const { wallets, reminders, loading, refresh } = useFinancialData(uid);
  const [formOpen, setFormOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [walletId, setWalletId] = useState('');
  const [dueDate, setDueDate] = useState(tomorrowMorning);
  const [autoCharge, setAutoCharge] = useState(false);
  const [pickerMode, setPickerMode] = useState<PickerMode>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const pending = useMemo(
    () => reminders.filter((item) => item.status === 'pending').sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [reminders],
  );
  const completed = useMemo(
    () => reminders.filter((item) => item.status === 'completed').sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime()).slice(0, 5),
    [reminders],
  );
  const floatingTotal = pending.reduce((total, item) => total + Number(item.amount || 0), 0);
  const walletOptions = wallets.map((wallet) => ({ label: `${wallet.name} · ${money(Number(wallet.amount || 0))}`, value: wallet.id }));

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setWalletId('');
    setDueDate(tomorrowMorning());
    setAutoCharge(false);
    setPickerMode(null);
    setFormOpen(false);
  };

  const handleDateChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS !== 'ios') setPickerMode(null);
    if (!selected) return;
    const next = new Date(dueDate);
    if (pickerMode === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
    setDueDate(next);
  };

  const saveReminder = async () => {
    const numericAmount = Number(amount.replace(',', '.'));
    if (!title.trim() || !walletId || !Number.isFinite(numericAmount) || numericAmount <= 0) {
      Alert.alert('Completa el recordatorio', 'Indica un nombre, una billetera y un monto válido.');
      return;
    }
    if (dueDate.getTime() <= Date.now()) {
      Alert.alert('Revisa la fecha', 'El pago debe programarse para una fecha futura.');
      return;
    }

    try {
      setSaving(true);
      const created = await createPaymentReminder(uid, {
        title: title.trim(),
        amount: numericAmount,
        walletId,
        dueDate: dueDate.toISOString(),
        category: 'services',
        autoCharge,
      });
      const notificationId = await schedulePaymentNotification(created);
      if (notificationId) await attachReminderNotification(uid, created.id, notificationId);
      resetForm();
      await refresh();
      Alert.alert('Pago planificado', notificationId ? 'Te avisaremos cuando llegue la fecha.' : 'Se guardó el pago. Puedes procesarlo desde esta pantalla.');
    } catch (error) {
      Alert.alert('No pudimos guardar el pago', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
    } finally {
      setSaving(false);
    }
  };

  const processReminder = (reminder: PaymentReminder) => {
    Alert.alert('Confirmar pago', `Se registrará ${money(reminder.amount)} como gasto en esta billetera.`, [
      { text: 'Ahora no', style: 'cancel' },
      {
        text: 'Registrar gasto',
        onPress: async () => {
          try {
            setBusyId(reminder.id);
            await processPaymentReminder(uid, reminder.id);
            await cancelPaymentNotification(reminder.notificationId);
            await refresh();
          } catch (error) {
            Alert.alert('No pudimos procesarlo', error instanceof Error ? error.message : 'Revisa el saldo de la billetera.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  const cancelReminder = (reminder: PaymentReminder) => {
    Alert.alert('Cancelar recordatorio', 'El movimiento flotante desaparecerá y no afectará tu saldo.', [
      { text: 'Conservar', style: 'cancel' },
      {
        text: 'Cancelar pago',
        style: 'destructive',
        onPress: async () => {
          try {
            setBusyId(reminder.id);
            await cancelPaymentReminder(uid, reminder.id);
            await cancelPaymentNotification(reminder.notificationId);
            await refresh();
          } catch (error) {
            Alert.alert('No pudimos cancelarlo', error instanceof Error ? error.message : 'Inténtalo nuevamente.');
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Header title="Próximos pagos" leftIcon={<BackButton />} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.summaryCard}>
            <View style={styles.summaryIcon}><Icons.ClockCountdown size={28} color={colors.neutral900} weight="fill" /></View>
            <View style={{ flex: 1 }}>
              <Typo size={11} color="#6B4A15" fontWeight="800">MOVIMIENTOS FLOTANTES</Typo>
              <Typo size={27} color={colors.neutral900} fontWeight="900">{money(floatingTotal)}</Typo>
              <Typo size={11} color="#6B4A15">Aún no se descuentan del saldo real</Typo>
            </View>
          </View>

          {!formOpen ? (
            <Pressable style={styles.addCard} onPress={() => setFormOpen(true)}>
              <View style={styles.addIcon}><Icons.Plus size={21} color={colors.primary} weight="bold" /></View>
              <View style={{ flex: 1 }}><Typo size={14} fontWeight="900">Planificar un pago</Typo><Typo size={11} color={colors.neutral400}>Reserva mentalmente el gasto y recibe un aviso</Typo></View>
              <Icons.CaretRight size={17} color={colors.neutral400} weight="bold" />
            </Pressable>
          ) : (
            <View style={styles.formCard}>
              <View style={styles.formHeading}><View style={{ flex: 1 }}><Typo size={17} fontWeight="900">Nuevo pago</Typo><Typo size={11} color={colors.neutral400}>Sólo se descontará cuando sea procesado</Typo></View><Pressable onPress={resetForm} hitSlop={10}><Icons.X size={19} color={colors.neutral400} weight="bold" /></Pressable></View>
              <View style={styles.field}><Typo size={12} color={colors.neutral300} fontWeight="700">Nombre</Typo><Input value={title} onChangeText={setTitle} placeholder="Ej. Internet, alquiler o seguro" /></View>
              <View style={styles.field}><Typo size={12} color={colors.neutral300} fontWeight="700">Monto</Typo><Input value={amount} onChangeText={(value) => setAmount(value.replace(/[^\d.,]/g, ''))} keyboardType="decimal-pad" placeholder="0.00" /></View>
              <View style={styles.field}>
                <Typo size={12} color={colors.neutral300} fontWeight="700">Billetera</Typo>
                <Dropdown style={styles.dropdown} containerStyle={styles.dropdownMenu} itemTextStyle={styles.dropdownText} selectedTextStyle={styles.dropdownText} placeholderStyle={styles.dropdownPlaceholder} data={walletOptions} search={walletOptions.length > 6} searchPlaceholder="Buscar billetera" labelField="label" valueField="value" value={walletId} placeholder="Selecciona una billetera" onChange={(item) => setWalletId(item.value)} />
              </View>
              <View style={styles.field}>
                <Typo size={12} color={colors.neutral300} fontWeight="700">Fecha y hora</Typo>
                <View style={styles.dateRow}>
                  <Pressable style={styles.dateButton} onPress={() => setPickerMode('date')}><Icons.CalendarBlank size={17} color={colors.primary} /><Typo size={12} fontWeight="700">{dueDate.toLocaleDateString('es-GT', { day: 'numeric', month: 'short', year: 'numeric' })}</Typo></Pressable>
                  <Pressable style={styles.dateButton} onPress={() => setPickerMode('time')}><Icons.Clock size={17} color={colors.primary} /><Typo size={12} fontWeight="700">{dueDate.toLocaleTimeString('es-GT', { hour: '2-digit', minute: '2-digit' })}</Typo></Pressable>
                </View>
                {pickerMode && <DateTimePicker themeVariant="dark" value={dueDate} mode={pickerMode} display={Platform.OS === 'ios' ? 'spinner' : 'default'} minimumDate={pickerMode === 'date' ? new Date() : undefined} onChange={handleDateChange} />}
                {Platform.OS === 'ios' && pickerMode && <Pressable style={styles.pickerDone} onPress={() => setPickerMode(null)}><Typo size={12} color={colors.neutral900} fontWeight="900">Listo</Typo></Pressable>}
              </View>
              <View style={styles.autoRow}>
                <View style={styles.autoIcon}><Icons.Lightning size={19} color={colors.violet} weight="fill" /></View>
                <View style={{ flex: 1 }}><Typo size={13} fontWeight="800">Cobro automático</Typo><Typo size={10} color={colors.neutral400}>Al llegar la fecha se convertirá en gasto</Typo></View>
                <Switch value={autoCharge} onValueChange={setAutoCharge} trackColor={{ false: colors.neutral600, true: colors.primaryDark }} thumbColor={autoCharge ? colors.primary : colors.neutral300} />
              </View>
              <Button onPress={saveReminder} loading={saving}><Typo color={colors.neutral900} fontWeight="900">Guardar recordatorio</Typo></Button>
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionTitle}><Typo size={15} fontWeight="900">Pendientes</Typo><View style={styles.count}><Typo size={10} color={colors.primary} fontWeight="900">{pending.length}</Typo></View></View>
            {!loading && pending.length === 0 ? (
              <View style={styles.empty}><Icons.CalendarCheck size={30} color={colors.neutral500} weight="duotone" /><Typo size={13} color={colors.neutral400}>No tienes pagos programados</Typo></View>
            ) : pending.map((reminder) => (
              <View key={reminder.id} style={styles.reminderItem}>
                <View style={styles.itemTop}>
                  <View style={styles.itemIcon}><Icons.Receipt size={20} color={colors.primary} weight="fill" /></View>
                  <View style={{ flex: 1 }}><Typo size={14} fontWeight="900">{reminder.title}</Typo><Typo size={10} color={colors.neutral400}>{new Date(reminder.dueDate).toLocaleString('es-GT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · {wallets.find((wallet) => wallet.id === reminder.walletId)?.name || 'Billetera'}</Typo></View>
                  <Typo size={15} color={colors.rose} fontWeight="900">−{money(reminder.amount)}</Typo>
                </View>
                <View style={styles.itemFooter}>
                  <View style={[styles.modePill, reminder.autoCharge && styles.modePillAuto]}>{reminder.autoCharge ? <Icons.Lightning size={11} color={colors.violet} weight="fill" /> : <Icons.HandTap size={11} color={colors.blue} weight="fill" />}<Typo size={9} color={reminder.autoCharge ? colors.violet : colors.blue} fontWeight="800">{reminder.autoCharge ? 'Automático' : 'Manual'}</Typo></View>
                  <View style={{ flex: 1 }} />
                  <Pressable disabled={busyId === reminder.id} onPress={() => cancelReminder(reminder)} style={styles.textButton}><Typo size={10} color={colors.neutral400} fontWeight="700">Cancelar</Typo></Pressable>
                  <Pressable disabled={busyId === reminder.id} onPress={() => processReminder(reminder)} style={styles.processButton}><Icons.Check size={13} color={colors.neutral900} weight="bold" /><Typo size={10} color={colors.neutral900} fontWeight="900">Procesar</Typo></Pressable>
                </View>
              </View>
            ))}
          </View>

          {completed.length > 0 && <View style={styles.section}><Typo size={15} fontWeight="900">Procesados recientemente</Typo>{completed.map((reminder) => <View key={reminder.id} style={styles.completedItem}><Icons.CheckCircle size={19} color={colors.green} weight="fill" /><View style={{ flex: 1 }}><Typo size={12} fontWeight="800">{reminder.title}</Typo><Typo size={9} color={colors.neutral400}>{new Date(reminder.processedAt || reminder.dueDate).toLocaleDateString('es-GT')}</Typo></View><Typo size={12} color={colors.neutral300} fontWeight="800">{money(reminder.amount)}</Typo></View>)}</View>}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
};

export default PaymentReminders;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: spacingX._20 },
  content: { paddingTop: spacingY._15, paddingBottom: verticalScale(70), gap: spacingY._20 },
  summaryCard: { flexDirection: 'row', alignItems: 'center', gap: spacingX._15, padding: spacingX._20, borderRadius: radius._24, backgroundColor: colors.primary },
  summaryIcon: { width: 52, height: 52, borderRadius: radius._17, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF55' },
  addCard: { flexDirection: 'row', alignItems: 'center', gap: spacingX._12, padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  addIcon: { width: 40, height: 40, borderRadius: radius._15, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}16` },
  formCard: { gap: spacingY._15, padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  formHeading: { flexDirection: 'row', alignItems: 'flex-start' },
  field: { gap: spacingY._7 },
  dropdown: { height: verticalScale(54), paddingHorizontal: spacingX._15, borderWidth: 1, borderColor: colors.border, borderRadius: radius._17 },
  dropdownMenu: { borderRadius: radius._15, backgroundColor: colors.surfaceElevated, borderColor: colors.border },
  dropdownText: { color: colors.text, fontSize: verticalScale(12) },
  dropdownPlaceholder: { color: colors.neutral500, fontSize: verticalScale(12) },
  dateRow: { flexDirection: 'row', gap: spacingX._7 },
  dateButton: { flex: 1, minHeight: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacingX._5, paddingHorizontal: spacingX._7, borderRadius: radius._15, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  pickerDone: { alignSelf: 'flex-end', paddingHorizontal: spacingX._15, paddingVertical: spacingY._7, borderRadius: radius._12, backgroundColor: colors.primary },
  autoRow: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10, padding: spacingX._12, borderRadius: radius._15, backgroundColor: colors.surfaceElevated },
  autoIcon: { width: 35, height: 35, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.violet}18` },
  section: { gap: spacingY._10 },
  sectionTitle: { flexDirection: 'row', alignItems: 'center', gap: spacingX._7 },
  count: { minWidth: 23, height: 23, paddingHorizontal: 6, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  empty: { minHeight: 120, alignItems: 'center', justifyContent: 'center', gap: spacingY._7, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' },
  reminderItem: { gap: spacingY._12, padding: spacingX._15, borderRadius: radius._20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10 },
  itemIcon: { width: 39, height: 39, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}16` },
  itemFooter: { flexDirection: 'row', alignItems: 'center', gap: spacingX._7, paddingTop: spacingY._10, borderTopWidth: 1, borderTopColor: colors.border },
  modePill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius._20, backgroundColor: `${colors.blue}14` },
  modePillAuto: { backgroundColor: `${colors.violet}14` },
  textButton: { paddingHorizontal: spacingX._10, paddingVertical: spacingY._7 },
  processButton: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacingX._10, paddingVertical: spacingY._7, borderRadius: radius._12, backgroundColor: colors.primary },
  completedItem: { flexDirection: 'row', alignItems: 'center', gap: spacingX._10, padding: spacingX._12, borderRadius: radius._15, backgroundColor: colors.surface },
});
