"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Toast = Toast;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
function SingleToast({ message, onExpire, }) {
    const opacity = (0, react_1.useRef)(new react_native_1.Animated.Value(0)).current;
    (0, react_1.useEffect)(() => {
        react_native_1.Animated.sequence([
            react_native_1.Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: false }),
            react_native_1.Animated.delay(3600),
            react_native_1.Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: false }),
        ]).start(() => onExpire());
    }, []);
    return (<react_native_1.Animated.View style={[styles.toast, { opacity }]}>
      <react_native_1.Text style={styles.toastText}>{message.text}</react_native_1.Text>
    </react_native_1.Animated.View>);
}
function Toast({ messages, onExpire }) {
    if (messages.length === 0)
        return null;
    return (<react_native_1.View style={styles.container} pointerEvents="none">
      {messages.map((msg) => (<SingleToast key={msg.id} message={msg} onExpire={() => onExpire(msg.id)}/>))}
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        position: 'absolute',
        top: 56,
        left: 0,
        right: 0,
        alignItems: 'center',
        gap: 8,
        zIndex: 999,
    },
    toast: {
        backgroundColor: 'rgba(18,18,18,0.93)',
        borderRadius: 24,
        paddingHorizontal: 22,
        paddingVertical: 11,
        borderWidth: 1,
        borderColor: 'rgba(255,193,7,0.4)',
    },
    toastText: {
        color: '#ffc107',
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
});
//# sourceMappingURL=Toast.js.map