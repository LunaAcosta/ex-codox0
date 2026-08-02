import * as Icons from 'phosphor-react-native';
import { StyleSheet, View } from 'react-native';

import { colors, radius, spacingX, spacingY } from '../constants/theme';
import { verticalScale } from '../utils/styling';
import Typo from './Typo';

const EmptyState = ({
  title,
  description,
}: {
  title: string;
  description?: string;
}) => (
  <View style={styles.container}>
    <View style={styles.icon}>
      <Icons.Tray size={verticalScale(24)} color={colors.primary} weight="duotone" />
    </View>
    <Typo size={15} fontWeight="700">{title}</Typo>
    {description ? (
      <Typo size={12} color={colors.neutral400} style={styles.description}>{description}</Typo>
    ) : null}
  </View>
);

export default EmptyState;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: spacingX._20,
    gap: spacingY._7,
    borderRadius: radius._17,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  icon: {
    width: verticalScale(44),
    height: verticalScale(44),
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius._15,
    backgroundColor: `${colors.primary}18`,
  },
  description: {
    textAlign: 'center',
    lineHeight: verticalScale(17),
  },
});
