import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { THEME } from '../utils/theme'

type Tab = 'signin' | 'signup'

// Username validation: 3-20 chars, letters/numbers/underscores
function validateUsername(v: string): string | null {
  if (v.length < 3) return 'At least 3 characters'
  if (v.length > 20) return 'Max 20 characters'
  if (!/^[a-zA-Z0-9_]+$/.test(v)) return 'Letters, numbers and underscores only'
  return null
}

function passwordStrength(p: string): 'weak' | 'good' | 'strong' {
  if (p.length < 8) return 'weak'
  const hasUpper = /[A-Z]/.test(p)
  const hasNumber = /[0-9]/.test(p)
  const hasSpecial = /[^a-zA-Z0-9]/.test(p)
  if (hasUpper && hasNumber && hasSpecial) return 'strong'
  if (hasNumber || hasUpper) return 'good'
  return 'weak'
}

const STRENGTH_COLOURS = { weak: THEME.danger, good: THEME.warning, strong: THEME.success }

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth()

  const [tab, setTab] = useState<Tab>('signin')
  const [showGuestSheet, setShowGuestSheet] = useState(false)

  // Sign in state
  const [siEmail, setSiEmail] = useState('')
  const [siPassword, setSiPassword] = useState('')
  const [siError, setSiError] = useState('')
  const [siLoading, setSiLoading] = useState(false)

  // Sign up state
  const [suUsername, setSuUsername] = useState('')
  const [suEmail, setSuEmail] = useState('')
  const [suPassword, setSuPassword] = useState('')
  const [suConfirm, setSuConfirm] = useState('')
  const [suUsernameError, setSuUsernameError] = useState('')
  const [suPasswordError, setSuPasswordError] = useState('')
  const [suConfirmError, setSuConfirmError] = useState('')
  const [suGeneralError, setSuGeneralError] = useState('')
  const [suSuccess, setSuSuccess] = useState(false)
  const [suLoading, setSuLoading] = useState(false)

  // Guest state
  const [guestName, setGuestName] = useState('')

  // Forgot password
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  async function handleSignIn() {
    setSiError('')
    setSiLoading(true)
    try {
      await signIn(siEmail.trim(), siPassword)
    } catch (e: unknown) {
      setSiError(e instanceof Error ? e.message : 'Invalid credentials')
    } finally {
      setSiLoading(false)
    }
  }

  async function handleForgotPassword() {
    if (!siEmail.trim()) {
      setSiError('Enter your email address first')
      return
    }
    setForgotLoading(true)
    await supabase.auth.resetPasswordForEmail(siEmail.trim())
    setForgotLoading(false)
    setForgotSent(true)
    setTimeout(() => setForgotSent(false), 4000)
  }

  function handleUsernameChange(v: string) {
    setSuUsername(v)
    setSuUsernameError(validateUsername(v) ?? '')
  }

  function handleSignUpPasswordChange(v: string) {
    setSuPassword(v)
    if (v.length > 0 && v.length < 8) setSuPasswordError('Minimum 8 characters')
    else setSuPasswordError('')
  }

  function handleConfirmChange(v: string) {
    setSuConfirm(v)
    if (v.length > 0 && v !== suPassword) setSuConfirmError('Passwords do not match')
    else setSuConfirmError('')
  }

  async function handleSignUp() {
    const usernameErr = validateUsername(suUsername)
    if (usernameErr) { setSuUsernameError(usernameErr); return }
    if (!suEmail.trim()) return
    if (suPassword.length < 8) { setSuPasswordError('Minimum 8 characters'); return }
    if (suPassword !== suConfirm) { setSuConfirmError('Passwords do not match'); return }

    setSuGeneralError('')
    setSuLoading(true)
    try {
      await signUp(suEmail.trim(), suPassword, suUsername.trim())
      setSuSuccess(true)
    } catch (e: unknown) {
      setSuGeneralError(e instanceof Error ? e.message : 'Sign up failed')
    } finally {
      setSuLoading(false)
    }
  }

  function handleGuestPlay() {
    if (!guestName.trim()) return
    setShowGuestSheet(false)
    continueAsGuest(guestName.trim())
  }

  const siCanSubmit = siEmail.trim().length > 0 && siPassword.length > 0 && !siLoading
  const suCanSubmit =
    !validateUsername(suUsername) &&
    suEmail.trim().length > 0 &&
    suPassword.length >= 8 &&
    suPassword === suConfirm &&
    !suLoading

  const strength = passwordStrength(suPassword)

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          {/* Title */}
          <Text style={styles.title}>Card Game</Text>

          {/* Tab buttons */}
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, tab === 'signin' && styles.tabActive]}
              onPress={() => setTab('signin')}
            >
              <Text style={[styles.tabText, tab === 'signin' && styles.tabTextActive]}>
                Sign in
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, tab === 'signup' && styles.tabActive]}
              onPress={() => setTab('signup')}
            >
              <Text style={[styles.tabText, tab === 'signup' && styles.tabTextActive]}>
                Create account
              </Text>
            </TouchableOpacity>
          </View>

          {/* Sign in form */}
          {tab === 'signin' && (
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={siEmail}
                onChangeText={setSiEmail}
                placeholder="you@example.com"
                placeholderTextColor="#757575"
                autoCapitalize="none"
                keyboardType="email-address"
                returnKeyType="next"
              />

              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                value={siPassword}
                onChangeText={setSiPassword}
                placeholder="Your password"
                placeholderTextColor="#757575"
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={siCanSubmit ? handleSignIn : undefined}
              />

              <TouchableOpacity
                style={[styles.primaryBtn, !siCanSubmit && styles.btnDisabled]}
                onPress={handleSignIn}
                disabled={!siCanSubmit}
              >
                <Text style={[styles.primaryBtnText, !siCanSubmit && styles.btnDisabledText]}>
                  {siLoading ? 'Signing in…' : 'Sign in'}
                </Text>
              </TouchableOpacity>

              {siError ? <Text style={styles.error}>{siError}</Text> : null}
              {forgotSent ? (
                <Text style={styles.successMsg}>Check your email for a reset link</Text>
              ) : null}

              <TouchableOpacity
                style={styles.textBtn}
                onPress={handleForgotPassword}
                disabled={forgotLoading}
              >
                <Text style={styles.textBtnText}>
                  {forgotLoading ? 'Sending…' : 'Forgot password?'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sign up form */}
          {tab === 'signup' && (
            <View style={styles.form}>
              {suSuccess ? (
                <View style={styles.successCard}>
                  <Text style={styles.successCardText}>
                    Check your email to confirm your account
                  </Text>
                </View>
              ) : (
                <>
                  <Text style={styles.label}>Username</Text>
                  <TextInput
                    style={[styles.input, suUsernameError ? styles.inputError : null]}
                    value={suUsername}
                    onChangeText={handleUsernameChange}
                    placeholder="3-20 chars, letters/numbers/_"
                    placeholderTextColor="#757575"
                    autoCapitalize="none"
                    maxLength={20}
                    returnKeyType="next"
                  />
                  {suUsernameError ? <Text style={styles.fieldError}>{suUsernameError}</Text> : null}

                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={suEmail}
                    onChangeText={setSuEmail}
                    placeholder="you@example.com"
                    placeholderTextColor="#757575"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="next"
                  />

                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={[styles.input, suPasswordError ? styles.inputError : null]}
                    value={suPassword}
                    onChangeText={handleSignUpPasswordChange}
                    placeholder="Minimum 8 characters"
                    placeholderTextColor="#757575"
                    secureTextEntry
                    returnKeyType="next"
                  />
                  {suPassword.length > 0 && (
                    <View style={styles.strengthRow}>
                      <View style={[styles.strengthBar, { backgroundColor: STRENGTH_COLOURS[strength] }]} />
                      <Text style={[styles.strengthLabel, { color: STRENGTH_COLOURS[strength] }]}>
                        {strength.charAt(0).toUpperCase() + strength.slice(1)}
                      </Text>
                    </View>
                  )}
                  {suPasswordError ? <Text style={styles.fieldError}>{suPasswordError}</Text> : null}

                  <Text style={styles.label}>Confirm password</Text>
                  <TextInput
                    style={[styles.input, suConfirmError ? styles.inputError : null]}
                    value={suConfirm}
                    onChangeText={handleConfirmChange}
                    placeholder="Re-enter password"
                    placeholderTextColor="#757575"
                    secureTextEntry
                    returnKeyType="go"
                    onSubmitEditing={suCanSubmit ? handleSignUp : undefined}
                  />
                  {suConfirmError ? <Text style={styles.fieldError}>{suConfirmError}</Text> : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, !suCanSubmit && styles.btnDisabled]}
                    onPress={handleSignUp}
                    disabled={!suCanSubmit}
                  >
                    <Text style={[styles.primaryBtnText, !suCanSubmit && styles.btnDisabledText]}>
                      {suLoading ? 'Creating account…' : 'Create account'}
                    </Text>
                  </TouchableOpacity>

                  {suGeneralError ? <Text style={styles.error}>{suGeneralError}</Text> : null}
                </>
              )}
            </View>
          )}

          {/* Guest button */}
          <TouchableOpacity
            style={styles.guestBtn}
            onPress={() => setShowGuestSheet(true)}
          >
            <Text style={styles.guestBtnText}>Continue as guest</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Guest name bottom sheet */}
      <Modal
        visible={showGuestSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setShowGuestSheet(false)}
      >
        <TouchableOpacity
          style={styles.sheetOverlay}
          activeOpacity={1}
          onPress={() => setShowGuestSheet(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Play as guest</Text>
            <TextInput
              style={styles.input}
              value={guestName}
              onChangeText={setGuestName}
              placeholder="Enter a name"
              placeholderTextColor="#757575"
              maxLength={20}
              autoFocus
              returnKeyType="go"
              onSubmitEditing={handleGuestPlay}
            />
            <TouchableOpacity
              style={[styles.primaryBtn, !guestName.trim() && styles.btnDisabled]}
              onPress={handleGuestPlay}
              disabled={!guestName.trim()}
            >
              <Text style={[styles.primaryBtnText, !guestName.trim() && styles.btnDisabledText]}>
                Play as guest
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: THEME.appBackground,
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
    color: THEME.gold,
    textAlign: 'center',
    letterSpacing: 1,
    marginBottom: 40,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: THEME.cardBackground,
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
    backgroundColor: THEME.surfaceBackground,
    borderWidth: 1,
    borderColor: THEME.gold,
  },
  tabText: {
    color: THEME.textMuted,
    fontWeight: '600',
    fontSize: 15,
  },
  tabTextActive: {
    color: THEME.gold,
  },
  form: {
    gap: 12,
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: THEME.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: -4,
  },
  input: {
    backgroundColor: THEME.cardBackground,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: THEME.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
  },
  inputError: {
    borderColor: THEME.danger,
  },
  primaryBtn: {
    backgroundColor: THEME.gold,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryBtnText: {
    color: THEME.appBackground,
    fontSize: 16,
    fontWeight: '800',
  },
  btnDisabled: {
    backgroundColor: THEME.cardBackground,
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.15)',
  },
  btnDisabledText: {
    color: THEME.textMuted,
  },
  error: {
    color: THEME.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  fieldError: {
    color: THEME.danger,
    fontSize: 12,
    marginTop: -6,
  },
  successMsg: {
    color: THEME.success,
    fontSize: 13,
    fontWeight: '500',
  },
  successCard: {
    backgroundColor: 'rgba(93,202,165,0.08)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: THEME.success,
    alignItems: 'center',
  },
  successCardText: {
    color: THEME.success,
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
    color: THEME.textMuted,
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
    color: THEME.textMuted,
    fontSize: 14,
    textDecorationLine: 'underline',
  },
  sheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: THEME.cardBackground,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: THEME.gold,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: THEME.textPrimary,
    marginBottom: 4,
  },
})
