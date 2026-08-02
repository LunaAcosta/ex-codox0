import { expenseCategories, incomeCategory } from '@/shared/constants/data'
import { colors, radius, spacingX, spacingY } from '@/shared/constants/theme'
import { FlashList } from "@shopify/flash-list"
import { useRouter } from 'expo-router'
import { Timestamp } from 'firebase/firestore'
import { StyleSheet, TouchableOpacity, View } from 'react-native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import Loading from '../../../../shared/components/Loading'
import EmptyState from '../../../../shared/components/EmptyState'
import Typo from '../../../../shared/components/Typo'
import { TransactionItemProps, TransactionListType, TransactionType } from '../../../../shared/types'
import { verticalScale } from '../../../../shared/utils/styling'

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage
}: TransactionListType) => {

  const router = useRouter()

  const handleClick = (item: TransactionType)=>{
    // todo: open transaction details
    router.push({
      pathname: "/(modals)/transactionModal",
      params: {
        id: item?.id,
        type: item?.type,
        amount: item?.amount?.toString(),
        category: item?.category,
        date: (item.date as Timestamp)?.toDate()?.toISOString(),
        description : item?.description,
        image: item?.image,
        uid: item?.uid,
        walletId : item?.walletId
      }
    })

  }
  return (
    <View style={styles.container}>
      {
        title && (
          <Typo size={20} fontWeight={"500"}>
            {title}
          </Typo>
        )
      }
      <View style={styles.list}>
        <FlashList
          data={data}
          renderItem={({ item, index }) => (
            <TransactionItem item={item} index={index} handleClick={handleClick}/> 
          )}
         // estimatedItemSize={60}
        />

      </View>

      {!loading && data.length === 0 && (
        <EmptyState
          title={emptyListMessage || 'Sin movimientos todavía'}
          description="Agrega una transacción para comenzar a ver tu actividad financiera."
        />
      )}
      {loading && (
        <View style={{ top: verticalScale(100)}}>
          <Loading/>
        </View>
      )

      }
    </View>
  )
}

const TransactionItem = ({
  item, index, handleClick
}: TransactionItemProps)=>{
  // console.log('item.description: ', item?.description)
  let category = item?.type === 'income'? incomeCategory : expenseCategories[item.category!]
  const IconComponent = category.icon;

  const rawDate = item?.date;
  const normalizedDate = rawDate instanceof Timestamp
    ? rawDate.toDate()
    : rawDate instanceof Date
      ? rawDate
      : new Date(rawDate);
  const date = Number.isNaN(normalizedDate.getTime()) ? 'Sin fecha' : normalizedDate.toLocaleDateString("es-GT", {
    day : "numeric",
    month: "short"
  })

  return (
    <Animated.View
    entering={FadeInDown.delay(index * 50)
      .springify()
      .damping(14)}
    >
      <TouchableOpacity style={styles.row} onPress={()=> handleClick(item)}>
        <View style={[styles.icon, {backgroundColor: category.bgColor}]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              weight="fill"
              color={colors.white}
            />
          )
          }
        </View>
        <View style={styles.categoryDes}>
          <Typo size={15} fontWeight="700">{category.label}</Typo>
          <Typo size={12} color={colors.neutral400} textProps={{numberOfLines: 1}}>
            {item?.description}
          </Typo>
        </View>
        <View style={styles.amountDate}>
          <Typo size={14} fontWeight="800" color={item?.type === "income" ? colors.green : colors.rose}>
            {`${item?.type === "income" ? "+ $": "- $"}${Number(item?.amount || 0).toFixed(2)}`}
          </Typo>
          <Typo size={13} color={colors.neutral400}>
            {date}
          </Typo>

        </View>
      </TouchableOpacity>
    </Animated.View>
  )
}

export default TransactionList

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
    //flex:1,
    //backgroundColor: "red"
  },
  list: {
    minHeight: 3
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,

    // list with backgroud
    backgroundColor: colors.neutral800,
    padding: spacingY._12,
    borderRadius: radius._15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous"
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignContent: "flex-end",
    gap: 3
  }
})
