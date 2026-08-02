import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as Icons from 'phosphor-react-native';
import { Alert, StyleSheet, TouchableOpacity, View } from 'react-native';

import Typo from '../../../../shared/components/Typo';
import { ImageUploadProps } from '../../../../shared/types';
import { verticalScale } from '../../../../shared/utils/styling';
import { getFilePath } from '../../application/services/imageService';

const ImageUpload = ({ file = null, onSelect, onClear, containerStyle, imageStyle, placeholder = '' }: ImageUploadProps) => {
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: false });
    if (!result.canceled) onSelect(result.assets[0]);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso de cámara', 'Activa el acceso a la cámara para fotografiar tu recibo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.82, allowsEditing: false });
    if (!result.canceled) onSelect(result.assets[0]);
  };

  if (file) {
    return (
      <View style={[styles.previewCard, imageStyle]}>
        <Image style={styles.preview} source={getFilePath(file)} contentFit="cover" transition={150} />
        <View style={styles.previewOverlay}>
          <View style={styles.readyPill}><Icons.CheckCircle size={14} color={colors.green} weight="fill" /><Typo size={10} color={colors.green} fontWeight="700">Imagen lista</Typo></View>
          <TouchableOpacity accessibilityLabel="Eliminar imagen" style={styles.deleteButton} onPress={onClear}><Icons.Trash size={18} color={colors.white} weight="fill" /></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={styles.uploadIcon}><Icons.Receipt size={27} color={colors.primary} weight="duotone" /></View>
      <View style={styles.copy}>
        <Typo size={14} fontWeight="800">{placeholder || 'Agrega un comprobante'}</Typo>
        <Typo size={11} color={colors.neutral400} style={styles.description}>Fotografía o selecciona una imagen clara del recibo.</Typo>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.secondaryAction} onPress={pickImage}><Icons.Image size={17} color={colors.textLight} /><Typo size={11} fontWeight="700">Galería</Typo></TouchableOpacity>
        <TouchableOpacity style={styles.primaryAction} onPress={takePhoto}><Icons.Camera size={17} color={colors.neutral900} weight="fill" /><Typo size={11} color={colors.neutral900} fontWeight="800">Cámara</Typo></TouchableOpacity>
      </View>
    </View>
  );
};

export default ImageUpload;

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: spacingY._10, padding: spacingX._20, borderRadius: radius._17, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed', backgroundColor: colors.surface },
  uploadIcon: { width: 52, height: 52, borderRadius: radius._17, alignItems: 'center', justifyContent: 'center', backgroundColor: `${colors.primary}18` },
  copy: { alignItems: 'center', gap: 4 },
  description: { textAlign: 'center', lineHeight: verticalScale(16) },
  actions: { flexDirection: 'row', gap: spacingX._10, width: '100%' },
  secondaryAction: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius._12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceElevated },
  primaryAction: { flex: 1, minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: radius._12, backgroundColor: colors.primary },
  previewCard: { width: '100%', height: verticalScale(185), borderRadius: radius._17, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  preview: { flex: 1 },
  previewOverlay: { position: 'absolute', inset: 0, padding: spacingX._10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', backgroundColor: '#00000024' },
  readyPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: radius._20, backgroundColor: '#071B12E8' },
  deleteButton: { width: 36, height: 36, borderRadius: radius._12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#B42318E8' },
});
