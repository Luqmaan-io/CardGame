export type HapticType = 'light' | 'medium' | 'warning' | 'success' | 'error';
export declare function useHaptics(): {
    trigger: (type: HapticType) => Promise<void>;
};
//# sourceMappingURL=useHaptics.d.ts.map