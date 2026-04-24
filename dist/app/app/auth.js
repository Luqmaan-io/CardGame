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
exports.default = AuthScreen;
const react_1 = __importStar(require("react"));
const react_native_1 = require("react-native");
const AuthContext_1 = require("../context/AuthContext");
const supabase_1 = require("../lib/supabase");
const theme_1 = require("../utils/theme");
// Username validation: 3-20 chars, letters/numbers/underscores
function validateUsername(v) {
    if (v.length < 3)
        return 'At least 3 characters';
    if (v.length > 20)
        return 'Max 20 characters';
    if (!/^[a-zA-Z0-9_]+$/.test(v))
        return 'Letters, numbers and underscores only';
    return null;
}
function passwordStrength(p) {
    if (p.length < 8)
        return 'weak';
    const hasUpper = /[A-Z]/.test(p);
    const hasNumber = /[0-9]/.test(p);
    const hasSpecial = /[^a-zA-Z0-9]/.test(p);
    if (hasUpper && hasNumber && hasSpecial)
        return 'strong';
    if (hasNumber || hasUpper)
        return 'good';
    return 'weak';
}
const STRENGTH_COLOURS = { weak: theme_1.THEME.danger, good: theme_1.THEME.warning, strong: theme_1.THEME.success };
function AuthScreen() {
    const { signIn, signUp, continueAsGuest } = (0, AuthContext_1.useAuth)();
    const [tab, setTab] = (0, react_1.useState)('signin');
    const [showGuestSheet, setShowGuestSheet] = (0, react_1.useState)(false);
    // Sign in state
    const [siEmail, setSiEmail] = (0, react_1.useState)('');
    const [siPassword, setSiPassword] = (0, react_1.useState)('');
    const [siError, setSiError] = (0, react_1.useState)('');
    const [siLoading, setSiLoading] = (0, react_1.useState)(false);
    // Sign up state
    const [suUsername, setSuUsername] = (0, react_1.useState)('');
    const [suEmail, setSuEmail] = (0, react_1.useState)('');
    const [suPassword, setSuPassword] = (0, react_1.useState)('');
    const [suConfirm, setSuConfirm] = (0, react_1.useState)('');
    const [suUsernameError, setSuUsernameError] = (0, react_1.useState)('');
    const [suPasswordError, setSuPasswordError] = (0, react_1.useState)('');
    const [suConfirmError, setSuConfirmError] = (0, react_1.useState)('');
    const [suGeneralError, setSuGeneralError] = (0, react_1.useState)('');
    const [suSuccess, setSuSuccess] = (0, react_1.useState)(false);
    const [suLoading, setSuLoading] = (0, react_1.useState)(false);
    // Guest state
    const [guestName, setGuestName] = (0, react_1.useState)('');
    // Forgot password
    const [forgotLoading, setForgotLoading] = (0, react_1.useState)(false);
    const [forgotSent, setForgotSent] = (0, react_1.useState)(false);
    async function handleSignIn() {
        setSiError('');
        setSiLoading(true);
        try {
            await signIn(siEmail.trim(), siPassword);
        }
        catch (e) {
            setSiError(e instanceof Error ? e.message : 'Invalid credentials');
        }
        finally {
            setSiLoading(false);
        }
    }
    async function handleForgotPassword() {
        if (!siEmail.trim()) {
            setSiError('Enter your email address first');
            return;
        }
        setForgotLoading(true);
        await supabase_1.supabase.auth.resetPasswordForEmail(siEmail.trim());
        setForgotLoading(false);
        setForgotSent(true);
        setTimeout(() => setForgotSent(false), 4000);
    }
    function handleUsernameChange(v) {
        setSuUsername(v);
        setSuUsernameError(validateUsername(v) ?? '');
    }
    function handleSignUpPasswordChange(v) {
        setSuPassword(v);
        if (v.length > 0 && v.length < 8)
            setSuPasswordError('Minimum 8 characters');
        else
            setSuPasswordError('');
    }
    function handleConfirmChange(v) {
        setSuConfirm(v);
        if (v.length > 0 && v !== suPassword)
            setSuConfirmError('Passwords do not match');
        else
            setSuConfirmError('');
    }
    async function handleSignUp() {
        const usernameErr = validateUsername(suUsername);
        if (usernameErr) {
            setSuUsernameError(usernameErr);
            return;
        }
        if (!suEmail.trim())
            return;
        if (suPassword.length < 8) {
            setSuPasswordError('Minimum 8 characters');
            return;
        }
        if (suPassword !== suConfirm) {
            setSuConfirmError('Passwords do not match');
            return;
        }
        setSuGeneralError('');
        setSuLoading(true);
        try {
            await signUp(suEmail.trim(), suPassword, suUsername.trim());
            setSuSuccess(true);
        }
        catch (e) {
            setSuGeneralError(e instanceof Error ? e.message : 'Sign up failed');
        }
        finally {
            setSuLoading(false);
        }
    }
    function handleGuestPlay() {
        if (!guestName.trim())
            return;
        setShowGuestSheet(false);
        continueAsGuest(guestName.trim());
    }
    const siCanSubmit = siEmail.trim().length > 0 && siPassword.length > 0 && !siLoading;
    const suCanSubmit = !validateUsername(suUsername) &&
        suEmail.trim().length > 0 &&
        suPassword.length >= 8 &&
        suPassword === suConfirm &&
        !suLoading;
    const strength = passwordStrength(suPassword);
    return (<react_native_1.SafeAreaView style={styles.safe}>
      <react_native_1.KeyboardAvoidingView style={{ flex: 1 }} behavior={react_native_1.Platform.OS === 'ios' ? 'padding' : undefined}>
        <react_native_1.ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Title */}
          <react_native_1.Text style={styles.title}>Card Game</react_native_1.Text>

          {/* Tab buttons */}
          <react_native_1.View style={styles.tabRow}>
            <react_native_1.TouchableOpacity style={[styles.tab, tab === 'signin' && styles.tabActive]} onPress={() => setTab('signin')}>
              <react_native_1.Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                Sign in
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
            <react_native_1.TouchableOpacity style={[styles.tab, tab === 'signup' && styles.tabActive]} onPress={() => setTab('signup')}>
              <react_native_1.Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Create account
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>

          {/* Sign in form */}
          {tab === 'signin' && (<react_native_1.View style={styles.form}>
              <react_native_1.Text style={styles.label}>Email</react_native_1.Text>
              <react_native_1.TextInput style={styles.input} value={siEmail} onChangeText={setSiEmail} placeholder="you@example.com" placeholderTextColor="#757575" autoCapitalize="none" keyboardType="email-address" returnKeyType="next"/>

              <react_native_1.Text style={styles.label}>Password</react_native_1.Text>
              <react_native_1.TextInput style={styles.input} value={siPassword} onChangeText={setSiPassword} placeholder="Your password" placeholderTextColor="#757575" secureTextEntry returnKeyType="go" onSubmitEditing={siCanSubmit ? handleSignIn : undefined}/>

              <react_native_1.TouchableOpacity style={[styles.primaryBtn, !siCanSubmit && styles.btnDisabled]} onPress={handleSignIn} disabled={!siCanSubmit}>
                <react_native_1.Text style={[styles.primaryBtnText, !siCanSubmit && styles.btnDisabledText]}>
                  {siLoading ? 'Signing in…' : 'Sign in'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>

              {siError ? <react_native_1.Text style={styles.error}>{siError}</react_native_1.Text> : null}
              {forgotSent ? (<react_native_1.Text style={styles.successMsg}>Check your email for a reset link</react_native_1.Text>) : null}

              <react_native_1.TouchableOpacity style={styles.textBtn} onPress={handleForgotPassword} disabled={forgotLoading}>
                <react_native_1.Text style={styles.textBtnText}>
                  {forgotLoading ? 'Sending…' : 'Forgot password?'}
                </react_native_1.Text>
              </react_native_1.TouchableOpacity>
            </react_native_1.View>)}

          {/* Sign up form */}
          {tab === 'signup' && (<react_native_1.View style={styles.form}>
              {suSuccess ? (<react_native_1.View style={styles.successCard}>
                  <react_native_1.Text style={styles.successCardText}>
                    Check your email to confirm your account
                  </react_native_1.Text>
                </react_native_1.View>) : (<>
                  <react_native_1.Text style={styles.label}>Username</react_native_1.Text>
                  <react_native_1.TextInput style={[styles.input, suUsernameError ? styles.inputError : null]} value={suUsername} onChangeText={handleUsernameChange} placeholder="3-20 chars, letters/numbers/_" placeholderTextColor="#757575" autoCapitalize="none" maxLength={20} returnKeyType="next"/>
                  {suUsernameError ? <react_native_1.Text style={styles.fieldError}>{suUsernameError}</react_native_1.Text> : null}

                  <react_native_1.Text style={styles.label}>Email</react_native_1.Text>
                  <react_native_1.TextInput style={styles.input} value={suEmail} onChangeText={setSuEmail} placeholder="you@example.com" placeholderTextColor="#757575" autoCapitalize="none" keyboardType="email-address" returnKeyType="next"/>

                  <react_native_1.Text style={styles.label}>Password</react_native_1.Text>
                  <react_native_1.TextInput style={[styles.input, suPasswordError ? styles.inputError : null]} value={suPassword} onChangeText={handleSignUpPasswordChange} placeholder="Minimum 8 characters" placeholderTextColor="#757575" secureTextEntry returnKeyType="next"/>
                  {suPassword.length > 0 && (<react_native_1.View style={styles.strengthRow}>
                      <react_native_1.View style={[styles.strengthBar, { backgroundColor: STRENGTH_COLOURS[strength] }]}/>
                      <react_native_1.Text style={[styles.strengthLabel, { color: STRENGTH_COLOURS[strength] }]}>
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                      </react_native_1.Text>
                    </react_native_1.View>)}
                  {suPasswordError ? <react_native_1.Text style={styles.fieldError}>{suPasswordError}</react_native_1.Text> : null}

                  <react_native_1.Text style={styles.label}>Confirm password</react_native_1.Text>
                  <react_native_1.TextInput style={[styles.input, suConfirmError ? styles.inputError : null]} value={suConfirm} onChangeText={handleConfirmChange} placeholder="Re-enter password" placeholderTextColor="#757575" secureTextEntry returnKeyType="go" onSubmitEditing={suCanSubmit ? handleSignUp : undefined}/>
                  {suConfirmError ? <react_native_1.Text style={styles.fieldError}>{suConfirmError}</react_native_1.Text> : null}

                  <react_native_1.TouchableOpacity style={[styles.primaryBtn, !suCanSubmit && styles.btnDisabled]} onPress={handleSignUp} disabled={!suCanSubmit}>
                    <react_native_1.Text style={[styles.primaryBtnText, !suCanSubmit && styles.btnDisabledText]}>
                      {suLoading ? 'Creating account…' : 'Create account'}
                    </react_native_1.Text>
                  </react_native_1.TouchableOpacity>

                  {suGeneralError ? <react_native_1.Text style={styles.error}>{suGeneralError}</react_native_1.Text> : null}
                </>)}
            </react_native_1.View>)}

          {/* Guest button */}
          <react_native_1.TouchableOpacity style={styles.guestBtn} onPress={() => setShowGuestSheet(true)}>
            <react_native_1.Text style={styles.guestBtnText}>Continue as guest</react_native_1.Text>
          </react_native_1.TouchableOpacity>
        </react_native_1.ScrollView>
      </react_native_1.KeyboardAvoidingView>

      {/* Guest name bottom sheet */}
      <react_native_1.Modal visible={showGuestSheet} transparent animationType="slide" onRequestClose={() => setShowGuestSheet(false)}>
        <react_native_1.TouchableOpacity style={styles.sheetOverlay} activeOpacity={1} onPress={() => setShowGuestSheet(false)}>
          <react_native_1.View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <react_native_1.Text style={styles.sheetTitle}>Play as guest</react_native_1.Text>
            <react_native_1.TextInput style={styles.input} value={guestName} onChangeText={setGuestName} placeholder="Enter a name" placeholderTextColor="#757575" maxLength={20} autoFocus returnKeyType="go" onSubmitEditing={handleGuestPlay}/>
            <react_native_1.TouchableOpacity style={[styles.primaryBtn, !guestName.trim() && styles.btnDisabled]} onPress={handleGuestPlay} disabled={!guestName.trim()}>
              <react_native_1.Text style={[styles.primaryBtnText, !guestName.trim() && styles.btnDisabledText]}>
                Play as guest
              </react_native_1.Text>
            </react_native_1.TouchableOpacity>
          </react_native_1.View>
        </react_native_1.TouchableOpacity>
      </react_native_1.Modal>
    </react_native_1.SafeAreaView>);
}
const styles = react_native_1.StyleSheet.create({
    safe: {
        flex: 1,
        backgroundColor: theme_1.THEME.appBackground,
    },
    scroll: {
        paddingHorizontal: 24,
        paddingTop: 56,
        paddingBottom: 40,
        flexGrow: 1,
    },
    title: {
        fontSize: 38,
        fontWeight: '800',
        color: theme_1.THEME.gold,
        textAlign: 'center',
        letterSpacing: 1,
        marginBottom: 40,
    },
    tabRow: {
        flexDirection: 'row',
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 12,
        padding: 4,
        marginBottom: 28,
        gap: 4,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.15)',
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 9,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: theme_1.THEME.surfaceBackground,
        borderWidth: 1,
        borderColor: theme_1.THEME.gold,
    },
    tabText: {
        color: theme_1.THEME.textMuted,
        fontWeight: '600',
        fontSize: 15,
    },
    tabTextActive: {
        color: theme_1.THEME.gold,
    },
    form: {
        gap: 12,
        marginBottom: 8,
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        color: theme_1.THEME.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: -4,
    },
    input: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderRadius: 10,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: theme_1.THEME.textPrimary,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.2)',
    },
    inputError: {
        borderColor: theme_1.THEME.danger,
    },
    primaryBtn: {
        backgroundColor: theme_1.THEME.gold,
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 4,
    },
    primaryBtnText: {
        color: theme_1.THEME.appBackground,
        fontSize: 16,
        fontWeight: '800',
    },
    btnDisabled: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderWidth: 1,
        borderColor: 'rgba(201,168,76,0.15)',
    },
    btnDisabledText: {
        color: theme_1.THEME.textMuted,
    },
    error: {
        color: theme_1.THEME.danger,
        fontSize: 13,
        fontWeight: '500',
    },
    fieldError: {
        color: theme_1.THEME.danger,
        fontSize: 12,
        marginTop: -6,
    },
    successMsg: {
        color: theme_1.THEME.success,
        fontSize: 13,
        fontWeight: '500',
    },
    successCard: {
        backgroundColor: 'rgba(93,202,165,0.08)',
        borderRadius: 12,
        padding: 20,
        borderWidth: 1,
        borderColor: theme_1.THEME.success,
        alignItems: 'center',
    },
    successCardText: {
        color: theme_1.THEME.success,
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
    strengthRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginTop: -4,
    },
    strengthBar: {
        height: 3,
        flex: 1,
        borderRadius: 2,
    },
    strengthLabel: {
        fontSize: 12,
        fontWeight: '600',
        width: 48,
    },
    textBtn: {
        alignSelf: 'center',
        paddingVertical: 8,
    },
    textBtnText: {
        color: theme_1.THEME.textMuted,
        fontSize: 13,
    },
    guestBtn: {
        alignSelf: 'center',
        marginTop: 'auto',
        paddingTop: 32,
        paddingBottom: 8,
        paddingHorizontal: 16,
    },
    guestBtnText: {
        color: theme_1.THEME.textMuted,
        fontSize: 14,
        textDecorationLine: 'underline',
    },
    sheetOverlay: {
        flex: 1,
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.65)',
    },
    sheet: {
        backgroundColor: theme_1.THEME.cardBackground,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        gap: 16,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderColor: theme_1.THEME.gold,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: theme_1.THEME.textPrimary,
        marginBottom: 4,
    },
});
//# sourceMappingURL=auth.js.map