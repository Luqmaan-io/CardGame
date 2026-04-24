"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = AvatarPickerModal;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const avatarData_1 = require("../assets/avatars/avatarData");
const Avatar_1 = __importDefault(require("./Avatar"));
function AvatarPickerModal({ visible, currentAvatarId, colourHex, onSelect, onClose, }) {
    function handleSelect(avatarId) {
        onSelect(avatarId);
        onClose();
    }
    return (<react_native_1.Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <react_native_1.View style={styles.overlay}>
        <react_native_1.View style={styles.sheet}>
          <react_native_1.View style={styles.header}>
            <react_native_1.Text style={styles.title}>Choose your avatar</react_native_1.Text>
            <react_native_1.TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <react_native_1.Text style={styles.closeBtnText}>✕</react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          <react_native_1.ScrollView contentContainerStyle={styles.grid} showsVerticalScrollIndicator={false}>
            {avatarData_1.AVATAR_DATA.map(({ id }) => {
            const isSelected = id === currentAvatarId;
            return (<react_native_1.TouchableOpacity key={id} onPress={() => handleSelect(id)} style={styles.cell} activeOpacity={0.75}>
                  <react_native_1.View style={styles.avatarWrapper}>
                    <Avatar_1.default avatarId={id} size={72} colourHex={colourHex} showRing={isSelected}/>
                    {isSelected && (<react_native_1.View style={[styles.checkBadge, { backgroundColor: colourHex }]}>
                        <react_native_1.Text style={styles.checkText}>✓</react_native_1.Text>
                      </react_native_1.View>)}
                    {!isSelected && (<react_native_1.View style={styles.unselectedRing}/>)}
                  </react_native_1.View>
                </react_native_1.TouchableOpacity>);
        })}
          </react_native_1.ScrollView>
        </react_native_1.View>
      </react_native_1.View>
    </react_native_1.Modal>);
}
const styles = react_native_1.StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: '#1e1e1e',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingBottom: react_native_1.Platform.OS === 'ios' ? 40 : 24,
        maxHeight: '80%',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#2a2a2a',
    },
    title: {
        flex: 1,
        fontSize: 17,
        fontWeight: '700',
        color: '#ffffff',
    },
    closeBtn: {
        width: 32,
        height: 32,
        alignItems: 'center',
        justifyContent: 'center',
    },
    closeBtnText: {
        color: '#757575',
        fontSize: 16,
        fontWeight: '600',
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        paddingTop: 16,
        gap: 8,
    },
    cell: {
        width: '22%',
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarWrapper: {
        position: 'relative',
    },
    checkBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1e1e1e',
    },
    checkText: {
        color: '#ffffff',
        fontSize: 10,
        fontWeight: '900',
    },
    unselectedRing: {
        position: 'absolute',
        top: -1,
        left: -1,
        right: -1,
        bottom: -1,
        borderRadius: 38,
        borderWidth: 1,
        borderColor: '#3a3a3a',
    },
});
//# sourceMappingURL=AvatarPickerModal.js.map