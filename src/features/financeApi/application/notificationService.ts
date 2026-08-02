import Constants from 'expo-constants';
import { Platform } from 'react-native';

let notificationHandlerConfigured = false;

const loadNotifications = async () => {
  const isAndroidExpoGo = Platform.OS === 'android' && Constants.appOwnership === 'expo';
  if (Platform.OS === 'web' || isAndroidExpoGo) return null;
  try {
    const Notifications = await import('expo-notifications');
    if (!notificationHandlerConfigured) {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowBanner: true,
          shouldShowList: true,
          shouldPlaySound: true,
          shouldSetBadge: false,
        }),
      });
      notificationHandlerConfigured = true;
    }
    return Notifications;
  } catch {
    // Expo Go no incluye notificaciones Android desde SDK 53.
    // El recordatorio continúa funcionando y se habilita en development builds.
    return null;
  }
};

export const requestNotificationPermission = async () => {
  const Notifications = await loadNotifications();
  if (!Notifications) return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('payment-reminders', {
      name: 'Recordatorios de pago',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 200, 250],
      lightColor: '#F6B94A',
    });
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
};

export const schedulePaymentNotification = async (reminder: { id: string; title: string; amount: number; dueDate: string }) => {
  const Notifications = await loadNotifications();
  if (!Notifications || !(await requestNotificationPermission())) return null;
  const date = new Date(reminder.dueDate);
  if (date.getTime() <= Date.now()) return null;
  return Notifications.scheduleNotificationAsync({
    content: {
      title: `Pago próximo: ${reminder.title}`,
      body: `Tienes un pago programado de $${reminder.amount.toFixed(2)}.`,
      data: { reminderId: reminder.id, route: '/payment-reminders' },
      sound: true,
    },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date, channelId: 'payment-reminders' },
  });
};

export const cancelPaymentNotification = async (notificationId?: string) => {
  const Notifications = await loadNotifications();
  if (Notifications && notificationId) {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }
};
