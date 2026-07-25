import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { colors, typography, spacing, radii } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from '../components/Atmosphere';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const initialize = useStore((s) => s.initialize);
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    setError('');
    setLoading(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (!profile || profile.role !== 'technician') {
        await supabase.auth.signOut();
        setError('Access restricted to field technicians only.');
        setLoading(false);
        return;
      }

      await initialize();
    }

    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Atmosphere />
      <View style={[styles.inner, { paddingTop: insets.top }]}>
        <View style={styles.headerBlock}>
          <View style={styles.brandRow}>
            <MaterialIcons name="factory" size={32} color={colors.primary} />
            <View style={styles.brandLine} />
          </View>
          <Text style={styles.title}>GIAL DSR</Text>
          <Text style={styles.subtitle}>Daily Service Reporting</Text>
        </View>

        <View style={styles.formCard}>
          <View style={styles.cornerAccent} />

          <Text style={styles.label}>Operator Email Address</Text>
          <View style={[styles.inputWrap, emailFocused && styles.inputWrapFocused]}>
            <MaterialIcons
              name="email"
              size={20}
              color={emailFocused ? colors.primary : colors.text3}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="OPERATOR@GIAL.COM"
              placeholderTextColor={colors.surfaceContainerHighest}
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              autoCorrect={false}
              accessibilityLabel="Email address"
              accessibilityHint="Enter your GIAL email address"
            />
          </View>

          <Text style={styles.label}>Security Access Code</Text>
          <View style={[styles.inputWrap, passwordFocused && styles.inputWrapFocused]}>
            <MaterialIcons
              name="lock"
              size={20}
              color={passwordFocused ? colors.primary : colors.text3}
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.surfaceContainerHighest}
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              secureTextEntry={!showPassword}
              accessibilityLabel="Password"
              accessibilityHint="Enter your password"
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              style={styles.eyeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              activeOpacity={0.7}
              accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              accessibilityHint="Toggle password visibility"
            >
              <MaterialIcons
                name={showPassword ? 'visibility' : 'visibility-off'}
                size={22}
                color={showPassword ? colors.primary : colors.text3}
              />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Sign in"
            accessibilityState={{ disabled: loading }}
          >
            {loading ? (
              <ActivityIndicator color={colors.onPrimary} />
            ) : (
              <>
                <Text style={styles.buttonText}>Sign in</Text>
                <MaterialIcons name="login" size={20} color={colors.onPrimary} style={styles.buttonIcon} />
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <View style={styles.footerLeft}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>System Status: Online</Text>
          </View>
          <Text style={styles.buildText}>V.2.4.0-STABLE</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'], // 48px margin-desktop
  },
  headerBlock: {
    marginBottom: spacing['2xl'], // 48px
    alignItems: 'flex-start',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing['md'], // 16px
  },
  brandLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.borderStrong,
    marginLeft: spacing['sm'], // 8px
  },
  title: {
    ...typography.displayLgMobile, // 32px Hanken Grotesk
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: -0.01, // -0.01em for display-lg-mobile
  },
  subtitle: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    marginTop: spacing['xs'], // 4px
  },
  formCard: {
    backgroundColor: colors.surfaceContainerHigh, // bg2 equivalent
    borderRadius: 0, // Structural elements have 0px radius per design
    padding: spacing['xl'], // 32px
    borderWidth: StyleSheet.hairlineWidth, // 1px border
    borderColor: colors.borderStrong,
    // Add industrial accent line (left border)
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    overflow: 'hidden',
  },
  cornerAccent: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 32,
    height: 32,
    borderTopWidth: 2,
    borderRightWidth: 2,
    borderColor: colors.primary,
    transform: [{ translateX: 1 }, { translateY: -1 }],
  },
  label: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    marginBottom: spacing['xs'], // 4px
    textTransform: 'uppercase',
    letterSpacing: 0.08, // 8% as per design
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow, // bg1 equivalent
    borderRadius: radii.sm, // 4px for interactive elements
    borderWidth: StyleSheet.hairlineWidth, // 1px border
    borderColor: colors.borderStrong,
    paddingHorizontal: spacing['lg'], // 24px
    paddingVertical: spacing['md'], // 16px
    marginBottom: spacing['lg'], // 24px
  },
  inputWrapFocused: {
    borderBottomWidth: 2, // 2px Amber on focus
    borderBottomColor: colors.primary,
  },
  inputIcon: {
    marginRight: spacing['md'], // 16px
  },
  eyeButton: {
    padding: spacing['xs'],
    marginLeft: spacing['sm'],
  },
  input: {
    flex: 1,
    fontSize: typography.body.fontSize,
    color: colors.onSurface,
    fontFamily: typography.mono.fontFamily,
  },
  button: {
    backgroundColor: colors.primaryContainer, // Amber container
    borderRadius: radii.md, // 8px for interactive elements
    paddingVertical: spacing['lg'], // 24px
    paddingHorizontal: spacing['xl'], // 32px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing['md'], // 16px
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onPrimary, // Dark amber text on primary background
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  buttonIcon: {
    marginLeft: spacing['sm'], // 8px
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing['2xl'], // 48px
    paddingTop: spacing['lg'], // 24px
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 9999,
    backgroundColor: colors.primary,
    marginRight: spacing['sm'], // 8px
  },
  statusText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurface,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
    fontWeight: '600' as const,
  },
  buildText: {
    ...(typography.mono as object), // 14px JetBrains Mono
    color: colors.text3,
    fontSize: 10,
    fontVariant: ['tabular-nums' as const],
    fontFamily: typography.mono.fontFamily,
    fontWeight: '600' as const,
  },
  error: {
    ...typography.body, // 14px IBM Plex Serif
    color: colors.error,
    marginBottom: spacing['lg'], // 24px
    textAlign: 'center',
  },
});
