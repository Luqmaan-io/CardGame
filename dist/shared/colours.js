"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PLAYER_COLOURS = void 0;
exports.assignRandomColour = assignRandomColour;
exports.PLAYER_COLOURS = [
    { id: 'red', hex: '#E24B4A', label: 'Red' },
    { id: 'blue', hex: '#378ADD', label: 'Blue' },
    { id: 'green', hex: '#639922', label: 'Green' },
    { id: 'amber', hex: '#EF9F27', label: 'Amber' },
    { id: 'purple', hex: '#7F77DD', label: 'Purple' },
    { id: 'teal', hex: '#1D9E75', label: 'Teal' },
];
function assignRandomColour(excludeColourIds = []) {
    const available = exports.PLAYER_COLOURS.filter((c) => !excludeColourIds.includes(c.id));
    const pool = available.length > 0 ? available : [...exports.PLAYER_COLOURS];
    return pool[Math.floor(Math.random() * pool.length)];
}
