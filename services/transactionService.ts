import { colors } from "@/constants/theme";
import { collection, deleteDoc, doc, getDoc, getDocs, orderBy, query, setDoc, Timestamp, updateDoc, where } from "firebase/firestore";
import { firebase } from "../config/firebase";
import { ResponseType, TransactionType, WalletType } from "../types";
import { getLast12Months, getLast7Days, getYearRange } from "../utils/common";
import { scale } from "../utils/styling";
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

        const transactionRef = doc(firebase, "transactions", transactionId)

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

        const updateType = transactionType == 'income' ? "totalIncome" : "totalExpenses";
        const newWalletAmount =
            walletData?.amount! -
            (transactionType == "income" ? transactionAmount : -transactionAmount);

        const newIncomeExpenseAmount = walletData[updateType]! - transactionAmount;

        if (transactionType == 'expense' && newWalletAmount < 0) {
            return { success: false, msg: "You cannot delete this transaction" }
        }

        await createOrUpdateWallet({
            id: walletId,
            amount: newWalletAmount,
            [updateType]: newIncomeExpenseAmount
        });

        await deleteDoc(transactionRef);

        return { success: true };
    } catch (err: any) {
        console.log('error update wallet for new transaction: ', err);
        return { success: false, msg: err.message }
    }
};


export const fetWeeklyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firebase;
        const today = new Date()
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);

        const transactionQuery = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(sevenDaysAgo)),
            where("date", "<=", Timestamp.fromDate(today)),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(transactionQuery);
        const weeklyData = getLast7Days();
        const transactions: TransactionType[] = [];

        // maping each transactio in day 

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType;
            transaction.id = doc.id;
            transactions.push(transaction)

            // const transactionDate = (transaction.date as Timestamp)
            //     .toDate()
            //     .toISOString()
            //     .split("T")[0];

            const transactionDate = new Date(
                transaction.date.toDate()
            ).toLocaleDateString('en-CA');

            

            const dayData = weeklyData.find((day) => day.date == transactionDate);

            if (dayData) {
                if (transaction.type === "income") {
                    dayData.income += transaction.amount;
                } else if (transaction.type === "expense") {
                    dayData.expense += transaction.amount
                }
            }
        });

        const stats = weeklyData.flatMap((day) => [
            {
                value: day.income,
                label: day.day,
                spacing: scale(4),
                labelWidth: scale(30),
                frontColor: colors.primary,
            },
            {
                value: day.expense,
                frontColor: colors.rose
            }
        ]);

        return {
            success: true,
            data: {
                stats,
                transactions
            }
        }
    } catch (err: any) {
        console.log('error update wallet for new transaction: ', err);
        return { success: false, msg: err.message }
    }
};

export const fetMoothlyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firebase;
        const today = new Date()
        const twelveMonthsAgo = new Date(today);
        twelveMonthsAgo.setMonth(today.getMonth() - 12);

        const transactionQuery = query(
            collection(db, "transactions"),
            where("date", ">=", Timestamp.fromDate(twelveMonthsAgo)),
            where("date", "<=", Timestamp.fromDate(today)),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(transactionQuery);
        const monthlyData = getLast12Months();
        const transactions: TransactionType[] = [];

        // maping each transactio in day 

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType;
            transaction.id = doc.id;
            transactions.push(transaction);

            const transactionDate = (transaction.date as Timestamp).toDate();
            const monthName = transactionDate.toLocaleString("default", {
                month: "short"
            })

            const shortYear = transactionDate.getFullYear().toString().slice(-2);
            const monthData = monthlyData.find(
                (month) => month.month === `${monthName} ${shortYear}`
            );

            if (monthData) {
                if (transaction.type === "income") {
                    monthData.income += transaction.amount;
                } else if (transaction.type === "expense") {
                    monthData.expense += transaction.amount
                }
            }
        });

        const stats = monthlyData.flatMap((month) => [
            {
                value: month.income,
                label: month.month,
                spacing: scale(4),
                labelWidth: scale(30),
                frontColor: colors.primary,
            },
            {
                value: month.expense,
                frontColor: colors.rose
            }
        ]);

        return {
            success: true,
            data: {
                stats,
                transactions
            }
        }
    } catch (error: any) {
        console.log('Error fetching montly transactions: ', error);
        return { 
            success: false, 
            msg: "Failed to fetch monthly transactions"
        }
    }
};

export const fetchYearlyStats = async (
    uid: string
): Promise<ResponseType> => {
    try {
        const db = firebase;

        const transactionQuery = query(
            collection(db, "transactions"),
            orderBy("date", "desc"),
            where("uid", "==", uid)
        );

        const querySnapshot = await getDocs(transactionQuery);
        const transactions: TransactionType[] = [];

        const firstTransaction = querySnapshot.docs.reduce((earliest, doc)=>{
            const transactionDate = doc.data().date.toDate();
            return transactionDate < earliest ? transactionDate: earliest;
        }, new Date())

        const firstYear = firstTransaction.getFullYear();
        const currentYear = new Date().getFullYear()

        const yearlyData = getYearRange(firstYear, currentYear)

        // maping each transactio in day 

        querySnapshot.forEach((doc) => {
            const transaction = doc.data() as TransactionType;
            transaction.id = doc.id;
            transactions.push(transaction);

            const transactionYear = (transaction.date as Timestamp).toDate().getFullYear();
           

            const yearData = yearlyData.find(
                (item: any) => item.year === transactionYear.toString()
            );

            if (yearData) {
                if (transaction.type === "income") {
                    yearData.income += transaction.amount;
                } else if (transaction.type === "expense") {
                    yearData.expense += transaction.amount
                }
            }
        });

        const stats = yearlyData.flatMap((year:any) => [
            {
                value: year.income,
                label: year.year,
                spacing: scale(4),
                labelWidth: scale(35),
                frontColor: colors.primary,
            },
            {
                value: year.expense,
                frontColor: colors.rose
            }
        ]);

        return {
            success: true,
            data: {
                stats,
                transactions
            }
        }
    } catch (error: any) {
        console.log('Error fetching year transactions: ', error);
        return { 
            success: false, 
            msg: "Failed to fetch year transactions"
        }
    }
};

