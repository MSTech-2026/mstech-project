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
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your password"
            placeholderTextColor={colors.text4}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.error}>Error: {error}</Text> : null}

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color={colors.accentFg} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

export const colors = {
  bg0: '#171412',
  bg1: '#1e1b18',
  bg2: '#272320',
  bg3: '#302b27',
  bg4: '#3d3732',
  borderSubtle: '#302b27',
  borderDefault: '#3d3732',
  borderStrong: '#524b44',
  text0: '#f2efec',
  text1: '#dbd5cf',
  text2: '#b3aaa0',
  text3: '#8c8278',
  text4: '#6b6158',
  accent: '#d4940a',
  accentHover: '#e0a820',
  accentActive: '#b87e08',
  accentSubtle: '#302510',
  accentFg: '#171412',
  focus: '#d4940a',
  verified: '#3daa6d',
  verifiedBg: '#1a3328',
  verifiedFg: '#b8eacc',
  failed: '#d44a3a',
  failedBg: '#331a16',
  failedFg: '#ecc8c3',
  bypass: '#b89a3d',
  bypassBg: '#332a16',
  bypassFg: '#ece0c3',
  warning: '#d4a43d',
  warningBg: '#332a16',
  warningFg: '#171412',
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
    backgroundColor: colors.bg2,
    borderRadius: 10,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  label: {
    fontSize: 11,
    color: colors.text3,
    marginBottom: 6,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: colors.bg1,
    borderRadius: 6,
    padding: 12,
    fontSize: 15,
    color: colors.text1,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  button: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: colors.accentFg,
    fontSize: 15,
    fontWeight: '700',
  },
  error: {
    color: colors.failed,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
});
