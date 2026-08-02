import Typo from '@/shared/components/Typo';
import { colors, radius, spacingY } from '@/shared/constants/theme';
import { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import * as Icons from 'phosphor-react-native';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { verticalScale } from '../../../src/shared/utils/styling';

const tabs = {
  index: { label: 'Inicio', Icon: Icons.House },
  wallet: { label: 'Carteras', Icon: Icons.Wallet },
  statistics: { label: 'Datos', Icon: Icons.ChartBar },
  codoxia: { label: 'Codox', Icon: Icons.ChatCircleDots },
  'ai-tools': { label: 'IA', Icon: Icons.Brain },
  profile: { label: 'Perfil', Icon: Icons.User },
};

export default function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, spacingY._5) }]}>
      {state.routes.map((route) => {
        const config = tabs[route.name as keyof typeof tabs];
        if (!config) return null;

        const { options } = descriptors[route.key];
        const isFocused = state.routes[state.index]?.key === route.key;
        const Icon = config.Icon;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel || config.label}
            testID={options.tabBarButtonTestID}
            activeOpacity={0.8}
            onPress={onPress}
            onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
            style={styles.tabbarItem}
          >
            <View style={[styles.iconContainer, isFocused && styles.iconContainerActive]}>
              <Icon
                size={verticalScale(21)}
                weight={isFocused ? 'fill' : 'regular'}
                color={isFocused ? colors.neutral900 : colors.neutral400}
              />
            </View>
            <Typo
              size={9}
              fontWeight={isFocused ? '700' : '500'}
              color={isFocused ? colors.primary : colors.neutral400}
            >
              {config.label}
            </Typo>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: 'row',
    width: '100%',
    minHeight: Platform.OS === 'ios' ? verticalScale(68) : verticalScale(64),
    paddingTop: spacingY._7,
    paddingHorizontal: 4,
    backgroundColor: colors.surface,
    alignItems: 'center',
    borderTopColor: colors.border,
    borderTopWidth: 1,
  },
  tabbarItem: {
    flex: 1,
    minHeight: verticalScale(48),
    justifyContent: 'center',
    alignItems: 'center',
    gap: 2,
  },
  iconContainer: {
    width: verticalScale(36),
    height: verticalScale(28),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._12,
  },
  iconContainerActive: {
    backgroundColor: colors.primary,
  },
});
