import BackButton from '@/components/BackButton'
import Button from '@/components/Button'
import Header from '@/components/Header'
import ImageUpload from '@/components/ImageUpload'
import Input from '@/components/input'
import ModalWrapper from '@/components/ModalWrapper'
import Typo from '@/components/Typo'
import { colors, spacingX, spacingY } from '@/constants/theme'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Icons from "phosphor-react-native"
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, View } from 'react-native'
import { useAuth } from '../../../contexts/authContext'
import { createOrUpdateWallet, deleteWallet } from '../../../services/walletService'
import { WalletType } from '../../../types'
import { scale, verticalScale } from '../../../utils/styling'
const WalletModal = () => {
    const { user, updateUserData } = useAuth();
    const [wallet, setWallet] = useState<WalletType>({
        name: "",
        image: null,
    })
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const oldWallet : {name : string, image: string, id: string} =
        useLocalSearchParams()
   // console.log("old wallet", oldWallet)

    useEffect(()=>{
        if(oldWallet?.id){
            setWallet({
                name:oldWallet?.name,
                image:oldWallet?.image
            });
        }
    }, []);
    
    const onSubmit = async () => {
        let { name, image } = wallet;
        if (!name.trim()|| !image) {
            Alert.alert("Billetera", "Por favor, completa todos los campos");
            return;
        }
        const data: WalletType = {
            name,
            image,
            uid: user?.uid
        };
        // Todo: include  wallet id if updating 
        if(oldWallet?.id) data.id = oldWallet?.id;
        setLoading(true)
        const res = await createOrUpdateWallet(data);
        setLoading(false);
        // console.log('result: ', res)
        if (res.success) {
            router.back();
        } else {
            Alert.alert("Billetera", res.msg)
        }
    };

    const onDelete = async ()=>{
       if(!oldWallet?.id) return;
       setLoading(true);
       const res = await deleteWallet(oldWallet?.id);
       setLoading(false);
       if(res.success){
        router.back()
       }else {
        Alert.alert("Billetera", res.msg)
       }
    }

    const showDeleteAlert = ()=> {
        Alert.alert(
            "Confirmar eliminación", 
            "¿Está seguro de que desea hacer esto?\nEsta acción eliminará todas las transacciones relacionadas con esta billetera.",
            [
                {
                    text: "Cancelar",
                    onPress: ()=> console.log("Cancelar eliminación"),
                    style: "cancel"
                },
                {
                    text: "Eliminar",
                    onPress: ()=> onDelete(),
                    style: "destructive"
                },

            ]
        );

    }
    return (
        <ModalWrapper>
            <View style={styles.container}>
                <Header
                    title={oldWallet?.id? "Actualizar Billetera":"Nueva Billetera"}
                    leftIcon={<BackButton />}
                    style={{ marginBottom: spacingY._10 }}
                />
                {/* Form */}
                <ScrollView contentContainerStyle={styles.form}>
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Nombre</Typo>
                        <Input
                            placeholder="Salario..."
                            value={wallet.name}
                            onChangeText={(value) => setWallet({ ...wallet, name: value })}
                        />
                    </View>
                    <View style={styles.inputContainer}>
                        <Typo color={colors.neutral200}>Imagen</Typo>
                        {/* Image input */}
                        <ImageUpload 
                            file={wallet.image } 
                            onClear={()=> setWallet({...wallet, image: null})}
                            onSelect={(file)=>setWallet({...wallet, image: file})}
                            placeholder="Subir Imagen"/>
                    </View>
                </ScrollView>
            </View>
            <View style={styles.footer}>
                {oldWallet?.id && !loading && (
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
                            oldWallet?.id? "ACTUALIZAR": "AGREGAR BILLETERA"
                        }
                    </Typo>
                </Button>
            </View>

        </ModalWrapper>
    )
}

export default WalletModal

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: "space-between",
        paddingHorizontal: spacingY._20,
        //paddingVertical: spacingY._30
    },
    footer: {
        alignItems: "center",
        flexDirection: "row",
        justifyContent: "center",
        paddingHorizontal: spacingX._20,
        gap: scale(12),
        paddingTop: spacingY._15,
        borderTopColor: colors.neutral700,
        marginBottom: spacingY._15,
        borderTopWidth: 1
    },
    form: {
        gap: spacingY._30,
        marginTop: spacingY._15
    },
    avatarContainer: {
        position: "relative",
        alignSelf: "center"
    },
    avatar: {
        alignSelf: "center",
        backgroundColor: colors.neutral300,
        height: verticalScale(135),
        width: verticalScale(135),
        borderRadius: 200,
        borderWidth: 1,
        //overflow: "hidden",
        //position: "relative"
    },

    editIcon: {
        position: "absolute",
        bottom: spacingY._5,
        right: spacingY._7,
        borderRadius: 100,
        backgroundColor: colors.neutral100,
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
        padding: spacingY._7,
    },
    inputContainer: {
        gap: spacingY._10
    }
});