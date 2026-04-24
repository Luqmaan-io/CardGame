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
exports.TurnTimer = TurnTimer;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const theme_1 = require("../utils/theme");
function TurnTimer({ timerStartedAt, turnDuration = 30, currentPlayerColourHex, isMyTurn = false, currentPlayerName, }) {
    const [secondsLeft, setSecondsLeft] = (0, react_1.useState)(turnDuration || 30);
    (0, react_1.useEffect)(() => {
        const total = turnDuration || 30;
        if (!timerStartedAt || turnDuration === 0) {
            setSecondsLeft(total);
            return;
        }
        function tick() {
            const elapsed = Math.floor((Date.now() - timerStartedAt) / 1000);
            setSecondsLeft(Math.max(0, total - elapsed));
        }
        tick();
        const id = setInterval(tick, 500);
        return () => clearInterval(id);
    }, [timerStartedAt, turnDuration]);
    // No limit — show turn label only, no progress bar
    if (turnDuration === 0) {
        return (<react_native_1.View style={styles.container}>
        <react_native_1.View style={styles.labelRow}>
          <react_native_1.Text style={[styles.turnLabel, { color: isMyTurn ? theme_1.THEME.gold : theme_1.THEME.textSecondary }]}>
            {isMyTurn ? 'Your turn' : currentPlayerName ? `${currentPlayerName}'s turn` : ''}
          </react_native_1.Text>
        </react_native_1.View>
      </react_native_1.View>);
    }
    const total = turnDuration || 30;
    const fraction = secondsLeft / total;
    const color = secondsLeft <= Math.ceil(total * 0.27)
        ? theme_1.THEME.danger
        : secondsLeft <= Math.ceil(total * 0.5)
            ? theme_1.THEME.warning
            : (currentPlayerColourHex ?? theme_1.THEME.success);
    return (<react_native_1.View style={styles.container}>
      {/* Turn label */}
      <react_native_1.View style={styles.labelRow}>
        <react_native_1.Text style={[styles.turnLabel, { color: isMyTurn ? theme_1.THEME.gold : theme_1.THEME.textSecondary }]}>
          {isMyTurn ? 'Your turn' : currentPlayerName ? `${currentPlayerName}'s turn` : ''}
        </react_native_1.Text>
      </react_native_1.View>

      {/* Progress bar */}
      <react_native_1.View style={styles.barRow}>
        <react_native_1.View style={styles.track}>
          <react_native_1.View style={[styles.fill, { flex: fraction, backgroundColor: color }]}/>
          <react_native_1.View style={{ flex: 1 - fraction }}/>
        </react_native_1.View>
        <react_native_1.Text style={[styles.label, { color }]}>{secondsLeft}s</react_native_1.Text>
      </react_native_1.View>
    </react_native_1.View>);
}
const styles = react_native_1.StyleSheet.create({
    container: {
        paddingHorizontal: 16,
        paddingVertical: 6,
        backgroundColor: 'transparent',
        gap: 4,
    },
    labelRow: {
        alignItems: 'center',
    },
    turnLabel: {
        fontSize: 13,
        fontWeight: '500',
        textAlign: 'center',
    },
    barRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    track: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.15)',
        flexDirection: 'row',
        overflow: 'hidden',
    },
    fill: {
        borderRadius: 3,
    },
    label: {
        fontSize: 13,
        fontWeight: '700',
        width: 28,
        textAlign: 'right',
    },
});
//# sourceMappingURL=TurnTimer.js.map