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
exports.AnimationOverlay = void 0;
exports.animId = animId;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const Card_1 = require("./Card");
function AnimatingCard({ task, onDone }) {
    const pos = (0, react_1.useRef)(new react_native_1.Animated.ValueXY({ x: task.fromX, y: task.fromY })).current;
    // Scale: pop up slightly when landing
    const scale = (0, react_1.useRef)(new react_native_1.Animated.Value(1)).current;
    (0, react_1.useEffect)(() => {
        const timer = setTimeout(() => {
            react_native_1.Animated.parallel([
                react_native_1.Animated.timing(pos, {
                    toValue: { x: task.toX, y: task.toY },
                    duration: task.duration,
                    useNativeDriver: false,
                }),
                // Subtle scale-up during flight for depth
                react_native_1.Animated.sequence([
                    react_native_1.Animated.timing(scale, {
                        toValue: 1.08,
                        duration: task.duration * 0.5,
                        useNativeDriver: false,
                    }),
                    react_native_1.Animated.timing(scale, {
                        toValue: 1.0,
                        duration: task.duration * 0.5,
                        useNativeDriver: false,
                    }),
                ]),
            ]).start(() => {
                task.onComplete?.();
                onDone(task.id);
            });
        }, task.delay);
        return () => clearTimeout(timer);
    }, []); // Run once only on mount
    return (<react_native_1.Animated.View style={[
            styles.flyingCard,
            {
                left: pos.x,
                top: pos.y,
                transform: [{ scale }],
            },
        ]}>
      <Card_1.Card card={task.card ?? { rank: 'A', suit: 'spades' }} faceDown={task.card === null}/>
    </react_native_1.Animated.View>);
}
// ─── AnimationOverlay ─────────────────────────────────────────────────────────
exports.AnimationOverlay = (0, react_1.forwardRef)(function AnimationOverlay(_props, ref) {
    const [tasks, setTasks] = (0, react_1.useState)([]);
    const idCounter = (0, react_1.useRef)(0);
    const handleDone = (0, react_1.useCallback)((id) => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
    }, []);
    (0, react_1.useImperativeHandle)(ref, () => ({
        addCards(newTasks) {
            setTasks((prev) => [...prev, ...newTasks]);
        },
        clearAll() {
            setTasks([]);
        },
    }));
    if (tasks.length === 0)
        return null;
    return (<react_native_1.View style={styles.overlay} pointerEvents="none">
        {tasks.map((task) => (<AnimatingCard key={task.id} task={task} onDone={handleDone}/>))}
      </react_native_1.View>);
});
// ─── ID helper ────────────────────────────────────────────────────────────────
// Call this to generate unique IDs for animation tasks.
let _uidCounter = 0;
function animId() {
    return `anim_${++_uidCounter}`;
}
// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = react_native_1.StyleSheet.create({
    overlay: {
        ...react_native_1.StyleSheet.absoluteFillObject,
        zIndex: 100,
    },
    flyingCard: {
        position: 'absolute',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 10,
    },
});
//# sourceMappingURL=AnimationOverlay.js.map