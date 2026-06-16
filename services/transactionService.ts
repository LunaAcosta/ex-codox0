import { collection, deleteDoc, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { firebase } from "../config/firebase";
import { ResponseType, TransactionType, WalletType } from "../types";
import { uploadFileToCloudinary } from "./imageService";
import { createOrUpdateWallet } from "./walletService";


export const createUpdateTransaction = async (
    transactionData: Partial<TransactionType>
): Promise<ResponseType> => {
    try {
        const { id, type, walletId, amount, image } = transactionData;
        if (!amount || amount <= 0 || !type) {
            return { success: false, msg: "Invalid transaction data!" }
        }
        if (!walletId || typeof walletId !== 'string' || !walletId.trim()) {
            return { success: false, msg: "Please select a wallet before saving the transaction." }
        }
        if (id) {
            // todo: update transaction
            const oldTransactionSnapshot = await getDoc(doc(firebase, "transactions", id));
            const oldTransaction = oldTransactionSnapshot.data() as TransactionType;
            const shouldRevertOrignal =
                oldTransaction.type != type ||
                oldTransaction.amount != amount ||
                oldTransaction.walletId != walletId;
            if (shouldRevertOrignal) {
                let res = await revertAndUpdateWallets(oldTransaction, Number(amount), type, walletId);
                if (!res.success) return res;
            }
        } else {
            // update wallet for new transaction
            let res = await updateWalletForNewTransaction(
                walletId,
                Number(amount!),
                type
            );
            if (!res.success) return res;
        }

        if (image) {
            const imageUploadRes = await uploadFileToCloudinary(
                image,
                "transactions",
            );
            if (!imageUploadRes.success) {
                return {
                    success: false,
                    msg: imageUploadRes.msg || "Failed to upload receipt"
                }
            }
            transactionData.image = imageUploadRes.data;
        }

        const transactionRef = id
            ? doc(firebase, "transactions", id)
            : doc(collection(firebase, "transactions"))

        await setDoc(transactionRef, transactionData, { merge: true });
        // todo: delete all transactions related to this wallet 
        return {
            success: true,
            data: { ...transactionData, id: transactionRef.id }
        };

    } catch (err: any) {
        console.log('error creating or updating transaction: ', err);
        return { success: false, msg: err.message }
    }
};

const updateWalletForNewTransaction = async (
    walletId: string,
    amount: number,
    type: string
) => {
    try {
        if (!walletId || typeof walletId !== 'string' || !walletId.trim()) {
            return { success: false, msg: "Invalid wallet selected." };
        }

        const walletRef = doc(firebase, "wallets", walletId)
        const walletSnapshot = await getDoc(walletRef);
        if (!walletSnapshot.exists()) {
            console.log('error update wallet for new transaction: ');
            return { success: false, msg: "Wallets not found" }
        }

        const walletData = walletSnapshot.data() as WalletType | undefined;

        if (!walletData) {
            return { success: false, msg: "Wallet data not found." };
        }

        if (type == "expense" && Number(walletData.amount || 0) - amount < 0) {
            return {
                success: false,
                msg: "Selected wallet don't have enough balance"
            };
        }

        const updateType = type == 'income' ? "totalIncome" : "totalExpenses"
        const updatedWalletAmount =
            type == "income"
                ? Number(walletData.amount || 0) + amount
                : Number(walletData.amount || 0) - amount;
        const updatedTotals =
            type == "income"
                ? Number(walletData.totalIncome || 0) + amount
                : Number(walletData.totalExpenses || 0) + amount;

        await updateDoc(walletRef, {
            amount: updatedWalletAmount,
            [updateType]: updatedTotals
        })
        return { success: true };

    } catch (err: any) {
        console.log('error update wallet for new transaction: ', err);
        return { success: false, msg: err.message }
    }
};


const revertAndUpdateWallets = async (
    oldTransaction: TransactionType,
    newTrasactionAmount: number,
    newTrasactionType: string,
    newWalletId: string
) => {
    try {
        if (!oldTransaction?.walletId || !newWalletId || typeof oldTransaction.walletId !== 'string' || typeof newWalletId !== 'string') {
            return { success: false, msg: "Invalid wallet reference for transaction update." };
        }

        const orignalWalletSnapshot = await getDoc(
            doc(firebase, "wallets", oldTransaction.walletId)
        );

        if (!orignalWalletSnapshot.exists()) {
            return { success: false, msg: "Original wallet not found." };
        }

        const orignalWallet = orignalWalletSnapshot.data() as WalletType;

        let newWalletSnapshot = await getDoc(
            doc(firebase, "wallets", newWalletId)
        );

        if (!newWalletSnapshot.exists()) {
            return { success: false, msg: "Selected wallet not found." };
        }

        let newWallet = newWalletSnapshot.data() as WalletType;

        const revertType = oldTransaction.type == "income" ? "totalIncome" : "totalExpenses";

        const revertIncomeExpense: number =
            oldTransaction.type == "income"
                ? -Number(oldTransaction.amount)
                : Number(oldTransaction.amount);

        const revertedWalletAmount = Number(orignalWallet.amount || 0) + revertIncomeExpense;

        const revertedIncomeExpenseAmount =
            Number(orignalWallet[revertType] || 0) - Number(oldTransaction.amount || 0)

        if (newTrasactionType == 'expense') {

            // if user tries to convert income to expense on the same wallet 
            // or if the user tries to increase the expense amount and don´t have enough balance 
            if (
                oldTransaction.walletId == newWalletId &&
                revertedWalletAmount < newTrasactionAmount
            ) {
                return {
                    success: false,
                    msg: "The selected wallet don't have enough balance",
                };
            }

            // if user tries to add expense from a new wallet but the wallet don't have anough balance
            if (Number(newWallet.amount || 0) < newTrasactionAmount) {
                return {
                    success: false,
                    msg: "The selected wallet don't have enough balance",
                };
            }
        }

        await createOrUpdateWallet({
            id: oldTransaction.walletId,
            amount: revertedWalletAmount,
            [revertType]: revertedIncomeExpenseAmount,
        })

        //////////////////////////////////////////////////////


        // refeth the newwallet beca we may have just upate it

        newWalletSnapshot = await getDoc(
            doc(firebase, "wallets", newWalletId)
        );

        newWallet = newWalletSnapshot.data() as WalletType;

        const updateType =
            newTrasactionType == 'income' ? "totalIncome" : "totalExpenses";

        const updatedTransactionAmount: number =
            newTrasactionType == "income"
                ? Number(newTrasactionAmount)
                : -Number(newTrasactionAmount)


        const newWalletAmount = Number(newWallet.amount || 0) + updatedTransactionAmount

        const newIncomeExpenseAmount = Number(newWallet[updateType] || 0) + Number(newTrasactionAmount);

        await createOrUpdateWallet({
            id: newWalletId,
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount
        });
        return { success: true };
    } catch (err: any) {
        console.log('error update wallet for new transaction: ', err);
        return { success: false, msg: err.message }
    }
}

export const deleteTransaction = async (
    transactionId: string,
    walletId: string
) => {
    try {

        const transactionRef =  doc(firebase, "transactions", transactionId)

        const transactionSnapshot = await getDoc(transactionRef);

        if (!transactionSnapshot.exists()) {
            return { success: false, msg: "Transaction not found" }
        }
        const transactionData = transactionSnapshot.data() as TransactionType;

        const transactionType = transactionData?.type;
        const transactionAmount = transactionData?.amount;

        const walletSnapshot = await getDoc(
            doc(firebase, "wallets", walletId)
        );
        const walletData = walletSnapshot.data() as WalletType;

        const updateType = transactionType == 'income'? "totalIncome": "totalExpenses";
        const newWalletAmount = 
            walletData?.amount! -
            (transactionType == "income"? transactionAmount : -transactionAmount);

        const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount;
                
        if(transactionType == 'expense' && newWalletAmount<0){
            return { success: false, msg: "You cannot delete this transaction"}
        }

        await createOrUpdateWallet({
            id: walletId,
            amount: newWalletAmount,
            [updateType] : newIncomeExpenseAmount
        });

        await deleteDoc(transactionRef);

        return { success: true };
    } catch (err: any) {
        console.log('error update wallet for new transaction: ', err);
        return { success: false, msg: err.message }
    }
};



