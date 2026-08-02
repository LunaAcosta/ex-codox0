import { colors } from '@/shared/constants/theme';
import { StatusBar, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapperProps } from '../types';

const ScreenWrapper = ({style, children}: ScreenWrapperProps) => {
  const insets = useSafeAreaInsets();
  const paddingTop = Math.max(insets.top, 14);
  return (
    <View 
    style={[
        {
            paddingTop,
            flex:1,
            backgroundColor: colors.background
        },
    style,
    ]}
    >
      <StatusBar barStyle='light-content' backgroundColor={colors.background}/>
      {children}
    </View>
  )
}

export default ScreenWrapper
