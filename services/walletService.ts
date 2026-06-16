import { collection, deleteDoc, doc, getDocs, query, setDoc, where, writeBatch } from "firebase/firestore";
import { firebase } from "../config/firebase";
import { ResponseType, WalletType } from "../types";
import { uploadFileToCloudinary } from "./imageService";

export const createOrUpdateWallet = async (
    walletData: Partial<WalletType>
): Promise<ResponseType> => {
    try {
        let walletToSave = { ...walletData };

        if (walletData.image) {
            const imageUploadRes = await uploadFileToCloudinary(walletData.image, "wallets");
            if (!imageUploadRes.success) {
                return { success: false, msg: imageUploadRes.msg || "Failed to upload wallet icon" }
            }
            walletToSave.image = imageUploadRes.data;
        }
        if(!walletData?.id){
            {/* new wallet */}
            walletToSave.amount = 0;
            walletToSave.totalIncome = 0;
            walletToSave.totalExpenses = 0;
            walletToSave.created = new Date();
        }

        const walletRef = walletData?.id
        ? doc(firebase, "wallets", walletData?.id)
        : doc(collection(firebase, "wallets"));
        
        await setDoc(walletRef, walletToSave, {merge: true}); // update only the data provided
        return {success: true, data: {...walletToSave, id: walletRef.id}};

    } catch (error: any) {
        console.log("error creating or updating wallet", error);
        return { success: false, msg: error.message };
    }
};

export const deleteWallet = async (walletId: string):  Promise<ResponseType> =>{
    try{

        const walletRef = doc(firebase, "wallets", walletId);
        await deleteDoc(walletRef)

        deleteTransactionByWalletId(walletId);
        return { success: true, msg: "Wallet deleted succesfully"};

    }catch(err:any){
        console.log('error deleting wallet: ', err);
        return {success: false, msg: err.message}
    }
}

export const deleteTransactionByWalletId = async (walletId: string):  Promise<ResponseType> =>{
    try{
        let hasMoreTransaction = true;
        while(hasMoreTransaction){
            const transactionsQuery = query(
                collection(firebase, 'transactions'),
                where('walletId', '==', walletId)
            );
            const transactionsSnapshot = await getDocs(transactionsQuery)
            if(transactionsSnapshot.size == 0){
                hasMoreTransaction = false
                break;
            }

            const batch = writeBatch(firebase);

            transactionsSnapshot.forEach((transactionDoc)=>{
                batch.delete(transactionDoc.ref)
            })

            await batch.commit();

            console.log(`${transactionsSnapshot.size} transactions deleted in this bath`)
        } 
        return { 
            success: true, 
            msg: "All transactions deleted successfully"
        };


    }catch(err:any){
        console.log('error deleting wallet: ', err);
        return {success: false, msg: err.message}
    }
}