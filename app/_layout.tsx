import Constants from 'expo-constants';
import { Href, Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { AuthProvider } from '../src/contexts/authContext';

type NotificationResponseLike = {
  notification: { request: { content: { data?: Record<string, unknown> } } };
};

const NotificationObserver = () => {
  const router = useRouter();

  useEffect(() => {
    if (Platform.OS === 'android' && Constants.appOwnership === 'expo') return;

    let active = true;
    let subscription: { remove: () => void } | undefined;
    const openNotification = (response: NotificationResponseLike | null) => {
      const route = response?.notification.request.content.data?.route;
      if (typeof route === 'string') router.push(route as Href);
    };

    import('expo-notifications')
      .then(async (Notifications) => {
        if (!active) return;
        openNotification(await Notifications.getLastNotificationResponseAsync());
        subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
      })
      .catch(() => undefined);

    return () => {
      active = false;
      subscription?.remove();
    };
  }, [router]);

  return null;
};

const StackLayout = () => {
  return <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name='index' /> 
    <Stack.Screen name='payment-reminders' />
    
    <Stack.Screen
      name='(modals)/profileModal'
      options={{ presentation: "modal" }}
    />
    <Stack.Screen
      name='(modals)/walletModal'
      options={{ presentation: "modal" }}
    />
    <Stack.Screen
      name='(modals)/transactionModal'
      options={{ presentation: "modal" }}
    />
  </Stack>
  
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationObserver />
      <StackLayout />
    </AuthProvider>
  );
}
