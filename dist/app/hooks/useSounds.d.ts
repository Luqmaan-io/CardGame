declare const SOUND_MODULES: {
    readonly card_slide: any;
    readonly card_deal: any;
    readonly card_flip: any;
    readonly card_draw: any;
    readonly power_card: any;
    readonly penalty: any;
    readonly on_cards: any;
    readonly win: any;
    readonly shuffle: any;
    readonly timeout: any;
};
export type SoundName = keyof typeof SOUND_MODULES;
export declare function useSounds(): {
    playSound: (name: SoundName) => void;
    isMuted: boolean;
    toggleMute: () => void;
};
export {};
//# sourceMappingURL=useSounds.d.ts.map