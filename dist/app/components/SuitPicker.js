"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuitPicker = SuitPicker;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const SUITS = [
    { suit: 'hearts', symbol: '♥', color: '#c62828' },
    { suit: 'diamonds', symbol: '♦', color: '#c62828' },
    { suit: 'clubs', symbol: '♣', color: '#212121' },
    { suit: 'spades', symbol: '♠', color: '#212121' },
];
function SuitPicker({ visible, onSelect }) {
    return (<react_native_1.Modal visible={visible} transparent animationType="fade">
      <react_native_1.View style={styles.overlay}>
        <react_native_1.View style={styles.container}>
          <react_native_1.Text style={styles.title}>Choose a suit</react_native_1.Text>
          <react_native_1.View style={styles.grid}>
            {SUITS.map(({ suit, symbol, color }) => (<react_native_1.TouchableOpacity key={suit} style={styles.button} onPress={() => onSelect(suit)} activeOpacity={0.7}>
                <react_native_1.Text style={[styles.symbol, { color }]}>{symbol}</react_native_1.Text>
                <react_native_1.Text style={styles.label}>{suit}</react_native_1.Text>
              </react_native_1.TouchableOpacity>))}
          </react_native_1.View>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.Modal>);
}
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.65)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    container: {
        backgroundColor: '#fafafa',
        borderRadius: 20,
        padding: 24,
        width: 300,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 20,
        color: '#212121',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        justifyContent: 'space-between',
    },
    button: {
        width: '46%',
        backgroundColor: '#fff',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#e0e0e0',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
        elevation: 2,
    },
    symbol: {
        fontSize: 40,
        lineHeight: 48,
    },
    label: {
        fontSize: 12,
        color: '#757575',
        marginTop: 4,
        textTransform: 'capitalize',
        fontWeight: '500',
    },
});
//# sourceMappingURL=SuitPicker.js.map