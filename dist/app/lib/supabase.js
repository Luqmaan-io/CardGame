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
exports.supabase = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const react_native_1 = require("react-native");
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables. ' +
        'Ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY ' +
        'are set in app/.env');
}
// Singleton pattern — only one client ever created
let supabaseInstance = null;
const getSupabaseClient = () => {
    if (supabaseInstance)
        return supabaseInstance;
    const ExpoSecureStoreAdapter = {
        getItem: (key) => {
            if (react_native_1.Platform.OS === 'web') {
                return Promise.resolve(localStorage.getItem(key));
            }
            return Promise.resolve().then(() => __importStar(require('expo-secure-store'))).then(m => m.getItemAsync(key));
        },
        setItem: (key, value) => {
            if (react_native_1.Platform.OS === 'web') {
                localStorage.setItem(key, value);
                return Promise.resolve();
            }
            return Promise.resolve().then(() => __importStar(require('expo-secure-store'))).then(m => m.setItemAsync(key, value));
        },
        removeItem: (key) => {
            if (react_native_1.Platform.OS === 'web') {
                localStorage.removeItem(key);
                return Promise.resolve();
            }
            return Promise.resolve().then(() => __importStar(require('expo-secure-store'))).then(m => m.deleteItemAsync(key));
        },
    };
    supabaseInstance = (0, supabase_js_1.createClient)(supabaseUrl, supabaseAnonKey, {
        auth: {
            storage: ExpoSecureStoreAdapter,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: react_native_1.Platform.OS === 'web', // true on web, false on native
        },
    });
    return supabaseInstance;
};
exports.supabase = getSupabaseClient();
//# sourceMappingURL=supabase.js.map