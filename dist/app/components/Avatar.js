"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Avatar;
const react_1 = __importDefault(require("react"));
const react_native_1 = require("react-native");
const avatarData_1 = require("../assets/avatars/avatarData");
function Avatar({ avatarId, size = 48, colourHex = '#378ADD', showRing = true, }) {
    const avatar = avatarData_1.AVATAR_DATA.find(a => a.id === avatarId) ?? avatarData_1.AVATAR_DATA[0];
    const ringWidth = showRing ? 3 : 0;
    const innerSize = size - ringWidth * 2;
    if (react_native_1.Platform.OS === 'web') {
        return (<div style={{
                width: size,
                height: size,
                borderRadius: size / 2,
                border: showRing ? `${ringWidth}px solid ${colourHex}` : 'none',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxSizing: 'border-box',
            }}>
        <svg width={innerSize} height={innerSize} viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <circle cx="100" cy="100" r="100" fill={avatar.bgColour}/>
          <g dangerouslySetInnerHTML={{ __html: avatar.svg }}/>
        </svg>
      </div>);
    }
    // Native fallback — coloured circle with initial letter
    return (<react_native_1.View style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: showRing ? ringWidth : 0,
            borderColor: showRing ? colourHex : 'transparent',
            backgroundColor: avatar.bgColour,
            alignItems: 'center',
            justifyContent: 'center',
        }}>
      <react_native_1.Text style={{
            color: '#ffffff',
            fontSize: size * 0.35,
            fontWeight: '500',
        }}>
        {avatar.label[0]}
      </react_native_1.Text>
    </react_native_1.View>);
}
//# sourceMappingURL=Avatar.js.map