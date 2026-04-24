import React from 'react';
export interface ToastMessage {
    id: number;
    text: string;
}
interface ToastProps {
    messages: ToastMessage[];
    onExpire: (id: number) => void;
}
export declare function Toast({ messages, onExpire }: ToastProps): React.JSX.Element | null;
export {};
//# sourceMappingURL=Toast.d.ts.map