import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useRoute, useNavigation } from '@react-navigation/native';
import { submitReport } from '../lib/sync';
import { useStore } from '../store';
import { Machine } from '../types';
import { colors } from './LoginScreen';

const EVK_OPTIONS: Array<{ label: string; value: 'verified' | 'failed' | 'bypass' }> = [
  { label: 'Verified', value: 'verified' },
  { label: 'Failed', value: 'failed' },
  { label: 'Bypass', value: 'bypass' },
];

export function ReportEntryScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const refreshPendingCount = useStore((s) => s.refreshPendingCount);
  const machine: Machine = route.params.machine;

  const today = new Date().toISOString().split('T')[0];

  const [sampleCount, setSampleCount] = useState('');
  const [evkStatus, setEvkStatus] = useState<'verified' | 'failed' | 'bypass' | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const profile = useStore((s) => s.profile);
  const user = useStore((s) => s.user);

  const canSubmit = sampleCount.trim() !== '' && parseInt(sampleCount) >= 0 && evkStatus !== null;

  const handleSubmit = async () => {
    if (!canSubmit || !profile?.site_id || !user?.id) return;

    setSubmitting(true);
    const result = await submitReport(
      profile.site_id,
      user.id,
      {
        machine_id: machine.id,
        report_date: today,
        sample_count: parseInt(sampleCount),
        evk_status: evkStatus!,
        verification_failure_reason: evkStatus === 'failed' ? failureReason : undefined,
      }
    );

    setSubmitting(false);

    if (result.success) {
      await refreshPendingCount();
      if (result.offline) {
        Alert.alert('Saved offline', 'Report saved locally. Will sync when connection is restored.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        setSubmitted(true);
      }
    } else {
      if (result.error === 'DUPLICATE_REPORT') {
        Alert.alert('Duplicate report', 'A report for this machine today already exists.');
      } else if (result.error === 'RLS_FORBIDDEN') {
        Alert.alert('Access denied', 'You do not have permission to submit reports.');
      } else {
        Alert.alert('Submission failed', result.error || 'Please try again.');
      }
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <View style={styles.successCard}>
          <View style={styles.successCircle}>
            <Text style={styles.successCheckmark}>&#10003;</Text>
          </View>
          <Text style={styles.successTitle}>Report submitted</Text>
          <Text style={styles.successDetail}>
            {machine.serial_number} &mdash; {evkStatus}
          </Text>
          <Text style={styles.successDetail}>Sample count: {sampleCount}</Text>
          <Pressable
            onPress={() => navigation.goBack()}
          >
            {({ pressed }) => {
              const scale = useSharedValue(1);
              scale.value = withSpring(pressed ? 0.96 : 1, { damping: 15 });
              const animatedStyle = useAnimatedStyle(() => ({
                transform: [{ scale: scale.value }],
              }));

              return (
                <Animated.View style={[styles.submitButton, animatedStyle]}>
                  <Text style={styles.submitButtonText}>Back to machines</Text>
                </Animated.View>
              );
            }}
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.machineInfo}>
        <Text style={styles.machineSerial}>{machine.serial_number}</Text>
        <Text style={styles.machineMeta}>{machine.model}</Text>
        <Text style={styles.machineMeta}>{machine.location}</Text>
      </View>

      <View style={styles.dateRow}>
        <Text style={styles.dateLabel}>Report date</Text>
        <Text style={styles.dateValue}>{today}</Text>
      </View>

      <Text style={styles.label}>Sample count</Text>
      <TextInput
        style={styles.input}
        placeholder="0"
        placeholderTextColor={colors.text4}
        value={sampleCount}
        onChangeText={(text) => setSampleCount(text.replace(/[^0-9]/g, ''))}
        keyboardType="numeric"
        accessibilityLabel="Sample count"
        accessibilityHint="Enter the sample count from the machine register"
      />

      <Text style={styles.label}>EVK status</Text>
      <View style={styles.evkRow}>
        {EVK_OPTIONS.map((opt) => (
          <Pressable
            key={opt.value}
            onPress={() => setEvkStatus(opt.value)}
            style={{ flex: 1 }}
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
                    styles.evkButton,
                    evkStatus === opt.value && styles.evkButtonActive,
                    opt.value === 'verified' && evkStatus === 'verified' && styles.evkVerified,
                    opt.value === 'failed' && evkStatus === 'failed' && styles.evkFailed,
                    opt.value === 'bypass' && evkStatus === 'bypass' && styles.evkBypass,
                    animatedStyle,
                  ]}
                >
                  <Text
                    style={[
                      styles.evkButtonText,
                      evkStatus === opt.value && styles.evkButtonTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Animated.View>
              );
            }}
          </Pressable>
        ))}
      </View>

      {evkStatus === 'failed' && (
        <>
          <Text style={styles.label}>Failure reason</Text>
          <TextInput
            style={[styles.input, styles.reasonInput]}
            placeholder="Describe the verification failure..."
            placeholderTextColor={colors.text4}
            value={failureReason}
            onChangeText={setFailureReason}
            multiline
            numberOfLines={3}
            accessibilityLabel="Verification failure reason"
            accessibilityHint="Describe why the verification failed"
          />
        </>
      )}

      <Pressable
        onPress={handleSubmit}
        disabled={!canSubmit || submitting}
      >
        {({ pressed }) => {
          const scale = useSharedValue(1);
          scale.value = withSpring(pressed && canSubmit ? 0.96 : 1, { damping: 15 });
          const animatedStyle = useAnimatedStyle(() => ({
            transform: [{ scale: scale.value }],
          }));

          return (
            <Animated.View
              style={[
                styles.submitButton,
                !canSubmit && styles.submitButtonDisabled,
                animatedStyle,
              ]}
            >
              {submitting ? (
                <ActivityIndicator color={colors.accentFg} />
              ) : (
                <Text style={styles.submitButtonText}>Submit report</Text>
              )}
            </Animated.View>
          );
        }}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  content: {
    padding: 20,
  },
  machineInfo: {
    backgroundColor: colors.bg1,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  machineSerial: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text0,
    marginBottom: 6,
    fontVariant: ['tabular-nums'],
  },
  machineMeta: {
    fontSize: 13,
    color: colors.text2,
    marginTop: 2,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    backgroundColor: colors.bg1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  dateLabel: {
    fontSize: 14,
    color: colors.text1,
    fontWeight: '500',
  },
  dateValue: {
    fontSize: 15,
    color: colors.text0,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
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
    backgroundColor: colors.bg1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text0,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  reasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  evkRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  evkButton: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    backgroundColor: colors.bg1,
    alignItems: 'center',
  },
  evkButtonActive: {
    borderColor: colors.accent,
  },
  evkVerified: {
    backgroundColor: colors.verifiedBg,
    borderColor: colors.verified,
  },
  evkFailed: {
    backgroundColor: colors.failedBg,
    borderColor: colors.failed,
  },
  evkBypass: {
    backgroundColor: colors.bypassBg,
    borderColor: colors.bypass,
  },
  evkButtonText: {
    fontSize: 14,
    color: colors.text2,
    fontWeight: '600',
  },
  evkButtonTextActive: {
    color: colors.text0,
  },
  submitButton: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
    width: '100%',
  },
  submitButtonDisabled: {
    opacity: 0.4,
  },
  submitButtonText: {
    color: colors.accentFg,
    fontSize: 15,
    fontWeight: '600',
  },
  successCard: {
    backgroundColor: colors.bg1,
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    margin: 20,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  successCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  successCheckmark: {
    fontSize: 28,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text0,
    marginBottom: 16,
  },
  successDetail: {
    fontSize: 14,
    color: colors.text2,
    marginBottom: 4,
  },
  doneButton: {
    marginTop: 32,
    backgroundColor: colors.bg2,
    borderRadius: 6,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  doneButtonText: {
    color: colors.text1,
    fontSize: 14,
    fontWeight: '600',
  },
});
