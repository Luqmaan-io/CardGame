export declare const PLAYER_COLOURS: readonly [{
    readonly id: "red";
    readonly hex: "#E24B4A";
    readonly label: "Red";
}, {
    readonly id: "blue";
    readonly hex: "#378ADD";
    readonly label: "Blue";
}, {
    readonly id: "green";
    readonly hex: "#639922";
    readonly label: "Green";
}, {
    readonly id: "amber";
    readonly hex: "#EF9F27";
    readonly label: "Amber";
}, {
    readonly id: "purple";
    readonly hex: "#7F77DD";
    readonly label: "Purple";
}, {
    readonly id: "teal";
    readonly hex: "#1D9E75";
    readonly label: "Teal";
}];
export type PlayerColour = typeof PLAYER_COLOURS[number];
export declare function assignRandomColour(excludeColourIds?: string[]): PlayerColour;
//# sourceMappingURL=colours.d.ts.map