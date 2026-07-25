import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRoute, useNavigation } from '@react-navigation/native';
import { submitReport } from '../lib/sync';
import { useStore } from '../store';
import { Machine } from '../types';
import { colors, typography, spacing, radii } from '../theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Atmosphere } from '../components/Atmosphere';

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
  const insets = useSafeAreaInsets();

  const today = new Date().toISOString().split('T')[0];

  const [sampleCount, setSampleCount] = useState('');
  const [evkStatus, setEvkStatus] = useState<'verified' | 'failed' | 'bypass' | null>(null);
  const [failureReason, setFailureReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sampleFocused, setSampleFocused] = useState(false);
  const profile = useStore((s) => s.profile);
  const user = useStore((s) => s.user);

  const canSubmit = sampleCount.trim() !== '' && parseInt(sampleCount) >= 0 && evkStatus !== null;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (submitted) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }).start();
    }
  }, [submitted, scaleAnim]);

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
        <Atmosphere />
        <View style={[styles.successContainer, { paddingTop: insets.top + 20 }]}>
          <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
            <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
              <MaterialIcons name="check" size={44} color={colors.verified} />
            </Animated.View>
            <View style={styles.successRing} />

            <Text style={styles.successTitle}>Report submitted</Text>
            <Text style={styles.successSubtitle}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>

            <View style={styles.successCard}>
              <View style={styles.successCardAccent} />

              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Serial Number</Text>
                <Text style={styles.successCardValue}>{machine.serial_number}</Text>
              </View>

              <View style={styles.successCardDivider} />

              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>EVK Status</Text>
                <View style={styles.successBadgeWrap}>
                  <View
                    style={[
                      styles.successBadgeDot,
                      evkStatus === 'verified' && styles.dotVerified,
                      evkStatus === 'failed' && styles.dotFailed,
                      evkStatus === 'bypass' && styles.dotBypass,
                    ]}
                  />
                  <Text
                    style={[
                      styles.successBadgeText,
                      evkStatus === 'verified' && styles.textVerified,
                      evkStatus === 'failed' && styles.textFailed,
                      evkStatus === 'bypass' && styles.textBypass,
                    ]}
                  >
                    {evkStatus!.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.successCardDivider} />

              <View style={styles.successCardRow}>
                <Text style={styles.successCardLabel}>Sample Count</Text>
                <Text style={styles.successCardValueMono}>{sampleCount} cycles</Text>
              </View>
            </View>

            <View style={styles.syncRow}>
              <MaterialIcons name="cloud-done" size={16} color={colors.verified} />
              <Text style={styles.syncText}>Synchronized</Text>
              <View style={styles.syncSep} />
              <Text style={styles.syncRef}>#GIAL-{machine.serial_number.slice(-4).toUpperCase()}</Text>
            </View>
          </ScrollView>

          <View style={styles.successFooter}>
            <TouchableOpacity
              style={styles.doneButtonPrimary}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <MaterialIcons name="arrow-back" size={18} color={colors.onPrimary} style={styles.doneButtonIconLeft} />
              <Text style={styles.doneButtonTextPrimary}>Back to machines</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Atmosphere />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.machineInfo}>
          <View style={styles.machineAccent} />
          <View style={styles.machineInfoInner}>
            <Text style={styles.machineMeta}>Serial Number</Text>
            <Text style={styles.machineSerial}>{machine.serial_number}</Text>
            <View style={styles.machineGrid}>
              <View>
                <Text style={styles.machineMeta}>Model</Text>
                <Text style={styles.machineDetail}>{machine.model}</Text>
              </View>
              <View>
                <Text style={styles.machineMeta}>Location</Text>
                <Text style={styles.machineDetail}>{machine.location}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>Report date</Text>
          <Text style={styles.dateValue}>{today}</Text>
        </View>

        <Text style={styles.label}>Sample count</Text>
        <View style={[styles.inputWrap, sampleFocused && styles.inputWrapFocused]}>
          <TextInput
            style={styles.input}
            placeholder="0"
            placeholderTextColor={colors.text4}
            value={sampleCount}
            onChangeText={(text) => setSampleCount(text.replace(/[^0-9]/g, ''))}
            keyboardType="numeric"
            onFocus={() => setSampleFocused(true)}
            onBlur={() => setSampleFocused(false)}
            accessibilityLabel="Sample count"
            accessibilityHint="Enter the sample count from the machine register"
          />
          <Text style={styles.inputSuffix}>Unit/cycles</Text>
        </View>

        <Text style={styles.label}>EVK status</Text>
        <View style={styles.evkRow}>
          {EVK_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[
                styles.evkButton,
                evkStatus === opt.value && styles.evkButtonActive,
                opt.value === 'verified' && evkStatus === 'verified' && styles.evkVerified,
                opt.value === 'failed' && evkStatus === 'failed' && styles.evkFailed,
                opt.value === 'bypass' && evkStatus === 'bypass' && styles.evkBypass,
              ]}
              onPress={() => setEvkStatus(opt.value)}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`${opt.label} status`}
              accessibilityHint="Double tap to select this EVK status"
            >
              <Text
                style={[
                  styles.evkButtonText,
                  evkStatus === opt.value && styles.evkButtonTextActive,
                ]}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {evkStatus === 'failed' && (
          <>
            <Text style={styles.label}>Failure reason</Text>
            <TextInput
              style={[styles.input, styles.reasonInput, styles.reasonInputFailed]}
              placeholder="Describe the verification failure..."
              placeholderTextColor={colors.text4}
              value={failureReason}
              onChangeText={setFailureReason}
              multiline
              numberOfLines={3}
              accessibilityLabel="Failure reason"
              accessibilityHint="Describe why the verification failed"
            />
          </>
        )}
      </ScrollView>

      <View style={[styles.actionBar, { paddingBottom: insets.bottom }]}>
        <TouchableOpacity
          style={[styles.submitButton, !canSubmit && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={!canSubmit || submitting}
          activeOpacity={0.7}
        >
          {submitting ? (
            <ActivityIndicator color={colors.onPrimary} />
          ) : (
            <>
              <Text style={styles.submitButtonText}>Submit report</Text>
              <MaterialIcons name="send" size={20} color={colors.onPrimary} style={styles.submitButtonIcon} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: spacing['xl'], // 32px
    paddingTop: spacing['xl'] + 20,
  },
  machineInfo: {
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    marginBottom: spacing['xl'], // 32px
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
  },
  machineAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.primary,
  },
  machineInfoInner: {
    padding: spacing['lg'], // 24px
    paddingLeft: spacing['lg'] + 4,
  },
  machineMeta: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  machineSerial: {
    ...typography.metricXl, // 32px Hanken Grotesk
    color: colors.primary,
    fontWeight: '700' as const,
    marginBottom: spacing['md'], // 16px
    fontVariant: ['tabular-nums' as const],
  },
  machineGrid: {
    flexDirection: 'row',
    marginTop: spacing['md'], // 16px
    paddingTop: spacing['md'], // 16px
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    gap: spacing['lg'], // 24px
  },
  machineDetail: {
    ...typography.headlineMd, // 24px Hanken Grotesk
    color: colors.onSurface,
    fontSize: 18,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['xl'], // 32px
    backgroundColor: colors.surfaceContainerHigh,
    padding: spacing['lg'], // 24px
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
  },
  dateLabel: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  dateValue: {
    ...typography.bodyMd, // 16px IBM Plex Serif
    color: colors.onSurface,
    fontWeight: '600' as const,
    fontVariant: ['tabular-nums' as const],
  },
  label: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    marginBottom: spacing['xs'], // 4px
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.08, // 8% as per design
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLowest,
    borderRadius: radii.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
    paddingHorizontal: spacing['lg'], // 24px
    paddingVertical: spacing['md'], // 16px
    marginBottom: spacing['lg'], // 24px
  },
  inputWrapFocused: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  input: {
    flex: 1,
    fontSize: 20,
    color: colors.primary,
    fontFamily: typography.mono.fontFamily,
    fontWeight: '600' as const,
  },
  inputSuffix: {
    ...typography.label,
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  reasonInput: {
    minHeight: 80,
    textAlignVertical: 'top',
    padding: spacing['lg'], // 24px
    fontSize: typography.body.fontSize,
    color: colors.onSurface,
    fontFamily: typography.body.fontFamily,
  },
  reasonInputFailed: {
    borderColor: colors.failed,
  },
  evkRow: {
    flexDirection: 'row',
    gap: 0,
    marginBottom: spacing['lg'], // 24px
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  evkButton: {
    flex: 1,
    paddingVertical: spacing['lg'], // 24px
    paddingHorizontal: spacing['md'], // 16px
    alignItems: 'center',
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.borderDefault,
    backgroundColor: colors.surfaceContainerHigh,
  },
  evkButtonActive: {
    borderColor: colors.primary,
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
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.08, // 8% as per design
  },
  evkButtonTextActive: {
    color: colors.onSurface,
  },
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    paddingHorizontal: spacing['xl'], // 32px
    paddingTop: spacing['md'], // 16px
  },
  submitButton: {
    backgroundColor: colors.primary, // Amber
    borderRadius: radii.md,
    paddingVertical: spacing['lg'], // 24px
    paddingHorizontal: spacing['xl'], // 32px
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onPrimary, // Dark amber text on primary background
    fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.08, // 8% as per design
  },
  submitButtonIcon: {
    marginLeft: spacing['sm'], // 8px
  },
  // Success state
  successContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  successContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing['xl'],
  },
  successCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 3,
    borderColor: colors.verified,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['lg'],
    backgroundColor: colors.verifiedBg,
  },
  successRing: {
    position: 'absolute',
    top: 0,
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.verifiedBg,
    opacity: 0.5,
  },
  successTitle: {
    ...typography.headlineMd,
    color: colors.onSurface,
    marginBottom: spacing['xs'],
  },
  successSubtitle: {
    ...typography.caption,
    color: colors.text3,
    marginBottom: spacing['xl'],
  },
  successCard: {
    width: '100%',
    backgroundColor: colors.surfaceContainerHigh,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderDefault,
    overflow: 'hidden',
    marginBottom: spacing['lg'],
  },
  successCardAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: colors.verified,
  },
  successCardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['md'],
    paddingHorizontal: spacing['lg'],
    paddingLeft: spacing['lg'] + 4,
  },
  successCardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderStrong,
    marginLeft: spacing['lg'] + 4,
    marginRight: spacing['lg'],
  },
  successCardLabel: {
    ...typography.label,
    color: colors.text3,
  },
  successCardValue: {
    ...typography.bodyMd,
    color: colors.onSurface,
    fontWeight: '600',
  },
  successCardValueMono: {
    ...(typography.mono as object),
    color: colors.primary,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  successBadgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['xs'],
  },
  successBadgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotVerified: {
    backgroundColor: colors.verified,
  },
  dotFailed: {
    backgroundColor: colors.failed,
  },
  dotBypass: {
    backgroundColor: colors.bypass,
  },
  successBadgeText: {
    ...typography.label,
    fontWeight: '700',
  },
  textVerified: {
    color: colors.verified,
  },
  textFailed: {
    color: colors.failed,
  },
  textBypass: {
    color: colors.bypass,
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing['xs'],
  },
  syncText: {
    ...typography.label,
    color: colors.onSurfaceVariant,
  },
  syncSep: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.borderStrong,
  },
  syncRef: {
    ...typography.label,
    color: colors.text3,
  },
  successFooter: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderStrong,
    paddingHorizontal: spacing['xl'],
    paddingTop: spacing['md'],
    paddingBottom: spacing['md'],
  },
  doneButtonPrimary: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    paddingVertical: spacing['lg'],
    paddingHorizontal: spacing['xl'],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonTextPrimary: {
    ...typography.label,
    color: colors.onPrimary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  doneButtonIconLeft: {
    marginRight: spacing['sm'],
  },
});
