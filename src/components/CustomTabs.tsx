import { colors, spacingY } from '@/constants/theme';
import { BottomTabBarProps } from 'expo-router/build/react-navigation/bottom-tabs';
import * as Icons from 'phosphor-react-native';
import { Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
import { verticalScale } from '../../utils/styling';


export default function CustomTabs({ state, descriptors, navigation }: BottomTabBarProps) {
  const tabbarIcons: any = {
    index: (isFocused: boolean) => {
      return (
        <Icons.House
          size={verticalScale(30)}
          weight={isFocused ? "fill" : "regular"}
          color={isFocused ? colors.primary : colors.neutral400}
        />
      );
    },
    statistics: (isFocused: boolean) => {
      return (
        <Icons.ChartBar
          size={verticalScale(30)}
          weight={isFocused ? "fill" : "regular"}
          color={isFocused ? colors.primary : colors.neutral400}
        />
      );
    },
    wallet: (isFocused: boolean) => {
      return (
        <Icons.Wallet
          size={verticalScale(30)}
          weight={isFocused ? "fill" : "regular"}
          color={isFocused ? colors.primary : colors.neutral400}
        />
      );
    },
    profile: (isFocused: boolean) => {
      return (
        <Icons.User
          size={verticalScale(30)}
          weight={isFocused ? "fill" : "regular"}
          color={isFocused ? colors.primary : colors.neutral400}
        />
      );
    },
    

  }
  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label: any =
          options.tabBarLabel !== undefined
            ? options.tabBarLabel
            : options.title !== undefined
              ? options.title
              : route.name;

        const isFocused = state.index === index;

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

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.name}
            //href={buildHref(route.name, route.params)}
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabbarItem}
          >
            {
              tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)
            }
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: 'row',
    width: "100%",
    height: Platform.OS == "ios" ? verticalScale(73) : verticalScale(55),
    backgroundColor: colors.neutral800,
    alignItems: "center",
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  tabbarItem: {
    flex: 1,
    marginBottom: Platform.OS == "android" ? spacingY._10 : spacingY._5,
    justifyContent: "center",
    alignItems: "center"
  }
});