import { StyleSheet, View } from 'react-native'
import { HeaderProps } from '../types'
import Typo from './Typo'

const Header = ({ title = "", leftIcon, rightIcon, style }: HeaderProps) => {
    return (
        <View style={[styles.container, style]}>
            <View style={styles.side}>{leftIcon}</View>
            {
                title && (
                    <Typo
                        size={22}
                        fontWeight={"600"}
                        style={styles.title}
                    >
                        {title}
                    </Typo>
                )
            }
            <View style={[styles.side, styles.rightIcon]}>{rightIcon}</View>

        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        width: "100%",
        alignItems: "center",
        flexDirection: "row",
        minHeight: 44,
    },
    side: { width: 44, alignItems: 'flex-start' },
    rightIcon: { alignItems: 'flex-end' },
    title: { flex: 1, textAlign: "center" },
})
