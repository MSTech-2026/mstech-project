import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useStore } from '../store';
import { Machine } from '../types';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography, spacing, radii } from '../theme';
import { Atmosphere } from '../components/Atmosphere';

export function MachineListScreen() {
  const machines = useStore((s) => s.machines);
  const pendingCount = useStore((s) => s.pendingCount);
  const profile = useStore((s) => s.profile);
  const signOut = useStore((s) => s.signOut);
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const insets = useSafeAreaInsets();

  const filtered = machines.filter(
    (m) =>
      m.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase()) ||
      m.model.toLowerCase().includes(search.toLowerCase())
  );

  const siteName = 'GIAL Guwahati';
  const siteCount = machines.length;

  return (
    <View style={styles.container}>
      <Atmosphere />
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <MaterialIcons name="factory" size={24} color={colors.primary} style={styles.headerIcon} />
        <View style={styles.headerTitles}>
          <Text style={styles.brand}>GIAL DSR</Text>
          <Text style={styles.greeting}>
            {profile ? profile.email.split('@')[0] : 'Technician'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={signOut}
          style={styles.logoutBtn}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
        >
          <MaterialIcons name="logout" size={18} color={colors.onSurfaceVariant} style={styles.logoutIcon} />
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <MaterialIcons name="cloud-upload" size={16} color={colors.onError} style={styles.syncIcon} />
          <Text style={styles.syncText}>
            {pendingCount} report{pendingCount > 1 ? 's' : ''} saved offline, will sync automatically
          </Text>
        </View>
      )}

      <View style={styles.secondaryHeader}>
        <View style={styles.secondaryHeaderText}>
          <Text style={styles.siteName}>{siteName}, {siteCount} machines</Text>
          <Text style={styles.siteMeta}>Operational Fleet Status</Text>
        </View>
      </View>

      <View style={[styles.searchWrap, searchFocused && styles.searchWrapFocused]}>
        <MaterialIcons
          name="search"
          size={20}
          color={searchFocused ? colors.primary : colors.text3}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search serial, location, or model..."
          placeholderTextColor={colors.text4}
          value={search}
          onChangeText={setSearch}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
          accessibilityLabel="Search machines"
          accessibilityHint="Type to filter machines by serial number, location, or model"
        />
      </View>

      <Text style={styles.countText}>
        {filtered.length} machine{filtered.length !== 1 ? 's' : ''}
      </Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Machine }) => (
          <View style={styles.machineCard}>
            <View style={styles.machineTop}>
              <Text style={styles.machineModel}>{item.model}</Text>
              <MaterialIcons name="more-vert" size={20} color={colors.text3} />
            </View>
            <TouchableOpacity
              style={styles.machineSerialRow}
              onPress={() => navigation.navigate('ReportEntry', { machine: item })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Machine ${item.serial_number}`}
              accessibilityHint="Double tap to log a report for this machine"
            >
              <Text style={styles.machineSerial}>{item.serial_number}</Text>
            </TouchableOpacity>
            <View style={styles.machineLocationRow}>
              <MaterialIcons name="location-on" size={16} color={colors.text3} style={styles.locationIcon} />
              <Text style={styles.machineLocation}>{item.location}</Text>
            </View>
            <TouchableOpacity
              style={styles.actionPrimary}
              onPress={() => navigation.navigate('ReportEntry', { machine: item })}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`New report for ${item.serial_number}`}
            >
              <Text style={styles.actionPrimaryText}>New DSR</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {search ? 'No machines match your search.' : 'No machines assigned to this site.'}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing['lg'], // 24px
    paddingHorizontal: spacing['xl'], // 32px
    backgroundColor: colors.surfaceContainerHigh,
    borderBottomWidth: StyleSheet.hairlineWidth, // 1px
    borderBottomColor: colors.borderStrong,
  },
  headerIcon: {
    marginRight: spacing['md'], // 16px
  },
  headerTitles: {
    flex: 1,
  },
  brand: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.primary,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  greeting: {
    ...typography.bodyMd, // 16px IBM Plex Serif
    color: colors.onSurface,
    textTransform: 'capitalize',
    marginTop: spacing['xs'], // 4px
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing['md'], // 16px
  },
  logoutIcon: {
    marginRight: spacing['xs'], // 4px
  },
  logout: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  syncBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warningBg,
    paddingVertical: spacing['md'], // 16px
    paddingHorizontal: spacing['lg'], // 24px
  },
  syncIcon: {
    marginRight: spacing['sm'], // 8px
  },
  syncText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onError, // Using error color for warning as per design
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  secondaryHeader: {
    paddingHorizontal: spacing['xl'], // 32px
    paddingTop: spacing['lg'], // 24px
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderStrong,
    paddingBottom: spacing['lg'], // 24px
  },
  secondaryHeaderText: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    paddingLeft: spacing['md'], // 16px
  },
  siteName: {
    ...typography.bodyLg, // 18px IBM Plex Serif
    color: colors.onSurface,
  },
  siteMeta: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    marginTop: spacing['xs'], // 4px
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing['xl'], // 32px
    marginTop: spacing['lg'], // 24px
    backgroundColor: colors.surfaceContainerHighest, // bg3 equivalent
    borderRadius: radii.sm, // 4px for interactive elements
    borderWidth: StyleSheet.hairlineWidth, // 1px
    borderColor: colors.borderDefault,
    paddingHorizontal: spacing['lg'], // 24px
  },
  searchWrapFocused: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  searchIcon: {
    marginRight: spacing['md'], // 16px
  },
  searchInput: {
    flex: 1,
    paddingVertical: spacing['md'], // 16px
    fontSize: typography.body.fontSize,
    color: colors.onSurface,
  },
  countText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    marginHorizontal: spacing['xl'], // 32px
    marginVertical: spacing['lg'], // 24px
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  list: {
    paddingHorizontal: spacing['xl'], // 32px
    paddingBottom: spacing['xl'], // 32px
  },
  machineCard: {
    backgroundColor: colors.surfaceContainerHigh, // bg2 equivalent
    borderRadius: radii.md, // 8px per reference cards
    borderWidth: StyleSheet.hairlineWidth, // 1px
    borderColor: colors.borderDefault,
    marginVertical: spacing['md'], // 16px
    padding: spacing['lg'], // 24px
    overflow: 'hidden',
  },
  machineTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing['sm'], // 8px
  },
  machineModel: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.primary, // Amber
    backgroundColor: colors.primaryContainer, // Amber container
    paddingHorizontal: spacing['sm'], // 8px
    paddingVertical: spacing['xs'], // 4px
    borderRadius: radii.sm, // 4px for interactive elements
    fontWeight: '600' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  machineSerialRow: {
    marginBottom: spacing['xs'], // 4px
  },
  machineSerial: {
    ...typography.displayLgMobile, // 32px Hanken Grotesk
    color: colors.onSurface,
    letterSpacing: -0.01,
  },
  machineLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationIcon: {
    marginRight: spacing['xs'], // 4px
  },
  machineLocation: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  actionPrimary: {
    alignItems: 'center',
    marginTop: spacing['lg'], // 24px
    paddingVertical: spacing['sm'], // 8px
    backgroundColor: colors.primary,
    borderRadius: radii.sm, // 4px
  },
  actionPrimaryText: {
    ...typography.label, // 12px Hanken Grotesk
    color: colors.onPrimary,
    fontWeight: '700' as const,
    textTransform: 'uppercase',
    letterSpacing: 0.08,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'], // 48px
  },
  emptyText: {
    ...typography.bodyMd, // 16px IBM Plex Serif
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
});
