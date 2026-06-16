import { colors, radius } from '@/constants/theme'

import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import * as Icons from "phosphor-react-native"
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import { getFilePath } from '../../services/imageService'
import { ImageUploadProps } from '../../types'
import { scale, verticalScale } from '../../utils/styling'
import Typo from './Typo'

const ImageUpload = ({
    file = null,
    onSelect,
    onClear,
    containerStyle,
    imageStyle,
    placeholder = ""
}: ImageUploadProps) => {

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
            allowsEditing: false,
        });

        if (!result.canceled) {
            onSelect(result.assets[0]);
        }
    };



  return (
    <View>
      {
        !file && (
            <View style={[styles.inputContainer, containerStyle && containerStyle]}>
                <Icons.UploadSimple color={colors.neutral200}/>
                {placeholder && <Typo size={15}>{placeholder}</Typo>}
                <View style={styles.actionRow}>
                    <TouchableOpacity onPress={pickImage} style={styles.actionButton}>
                        <Typo size={13} color={colors.white}>Seleccionar Imagen</Typo>
                    </TouchableOpacity>
                </View>
            </View>
        )
      }
      {
        file && (
            <View style={[styles.fileCard, imageStyle && imageStyle]}>
                {String(file?.mimeType || '').toLowerCase().includes('pdf') ? (
                    <View style={styles.pdfPreview}>
                        <Icons.FilePdf size={verticalScale(32)} color={colors.white} />
                        <Typo size={13} color={colors.white}>{file?.name || 'Documento PDF'}</Typo>
                    </View>
                ) : (
                    <Image
                        style={{flex:1}}
                        source={getFilePath(file)}
                        contentFit='cover'
                        transition={100}
                    />
                )}
                <TouchableOpacity style={styles.deleteIcon} onPress={onClear}>
                    <Icons.XCircle
                        size={verticalScale(24)}
                        weight="fill"
                        color={colors.white}
                    />
                </TouchableOpacity>
            </View>
        )
      }
    </View>
  )
}

export default ImageUpload

const styles = StyleSheet.create({
    inputContainer: {
        minHeight: verticalScale(72),
        backgroundColor: colors.neutral700,
        borderRadius: radius._15,
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        gap: 8,
        borderWidth: 1,
        borderColor: colors.neutral500,
        borderStyle: "dashed",
        paddingVertical: 10,
        paddingHorizontal: 12,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: radius._12,
        backgroundColor: colors.primary,
    },

    fileCard: {
        height: scale(150),
        width: scale(150),
        borderRadius: radius._15,
        borderCurve: "continuous",
        overflow: "hidden",
        backgroundColor: colors.neutral700,
    },
    pdfPreview: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        backgroundColor: colors.neutral700,
    },
    deleteIcon: {
        position: "absolute",
        top: scale(6),
        right: scale(6),
        shadowColor: colors.black,
        shadowOffset: {width: 0, height: 5},
        shadowOpacity: 1,
        shadowRadius:10,
    }

})