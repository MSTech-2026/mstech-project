import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';

export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const initialize = useStore((s) => s.initialize);

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
      <View style={styles.inner}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>GIAL DSR</Text>
          <Text style={styles.subtitle}>Daily Service Reporting</Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@gial.com"
            placeholderTextColor={colors.text4}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoCorrect={false}
            accessibilityLabel="Email address"
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.text4}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            accessibilityLabel="Password"
          />

          {error ? <Text style={styles.error}>Error: {error}</Text> : null}

          <Pressable
            onPress={handleLogin}
            disabled={loading}
          >
            {({ pressed }) => {
              const scale = useSharedValue(1);
              scale.value = withSpring(pressed ? 0.96 : 1, { damping: 15 });
              const animatedStyle = useAnimatedStyle(() => ({
                transform: [{ scale: scale.value }],
              }));

              return (
                <Animated.View
                  style={[
                    styles.button,
                    loading && styles.buttonDisabled,
                    animatedStyle,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.accentFg} />
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </Animated.View>
              );
            }}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export const colors = {
  bg0: '#F8FAFC',          // Light background
  bg1: '#FFFFFF',          // Card background / inputs
  bg2: '#F1F5F9',          // Shaded background (secondary surface)
  bg3: '#E2E8F0',          // Accent shade surface
  bg4: '#CBD5E1',          // Stronger gray surface
  borderSubtle: '#F1F5F9',
  borderDefault: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text0: '#111827',        // Primary text
  text1: '#475569',        // Secondary text
  text2: '#64748B',        // Steel gray / info
  text3: '#94A3B8',        // Muted text
  text4: '#CBD5E1',
  accent: '#0F1B4C',        // Midnight Blue
  accentHover: '#142A73',
  accentActive: '#0A1336',
  accentSubtle: '#EEF2FF',  // Hover background
  accentFg: '#FFFFFF',
  focus: '#2563EB',
  verified: '#22C55E',      // Brand success
  verifiedBg: '#DCFCE7',
  verifiedFg: '#15803D',
  failed: '#EF4444',        // Brand error
  failedBg: '#FEE2E2',
  failedFg: '#B91C1C',
  bypass: '#F59E0B',        // Brand warning
  bypassBg: '#FEF3C7',
  bypassFg: '#B45309',
  warning: '#F59E0B',
  warningBg: '#FEF3C7',
  warningFg: '#B45309',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  headerBlock: {
    marginBottom: 36,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.text0,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: colors.text3,
    marginTop: 4,
  },
  formCard: {
    backgroundColor: colors.bg1,
    borderRadius: 16,
    padding: 32,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  label: {
    fontSize: 12,
    color: colors.text1,
    marginBottom: 8,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bg0,
    borderRadius: 8,
    padding: 14,
    fontSize: 15,
    color: colors.text0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.accentFg,
    fontSize: 15,
    fontWeight: '600',
  },
  error: {
    color: colors.failed,
    fontSize: 13,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
});
