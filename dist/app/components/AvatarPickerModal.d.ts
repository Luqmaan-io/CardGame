import React from 'react';
type AvatarPickerProps = {
    visible: boolean;
    currentAvatarId: string;
    colourHex: string;
    onSelect: (avatarId: string) => void;
    onClose: () => void;
};
export default function AvatarPickerModal({ visible, currentAvatarId, colourHex, onSelect, onClose, }: AvatarPickerProps): React.JSX.Element;
export {};
//# sourceMappingURL=AvatarPickerModal.d.ts.map