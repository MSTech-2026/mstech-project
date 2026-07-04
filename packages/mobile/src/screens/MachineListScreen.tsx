import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useStore } from '../store';
import { Machine } from '../types';
import { useNavigation } from '@react-navigation/native';
import { colors } from './LoginScreen';

export function MachineListScreen() {
  const machines = useStore((s) => s.machines);
  const pendingCount = useStore((s) => s.pendingCount);
  const profile = useStore((s) => s.profile);
  const signOut = useStore((s) => s.signOut);
  const navigation = useNavigation<any>();
  const [search, setSearch] = useState('');

  const filtered = machines.filter(
    (m) =>
      m.serial_number.toLowerCase().includes(search.toLowerCase()) ||
      m.location.toLowerCase().includes(search.toLowerCase()) ||
      m.model.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>
            {profile ? profile.email.split('@')[0] : 'Technician'}
          </Text>
          <Text style={styles.siteName}>GIAL Guwahati, 29 machines</Text>
        </View>
        <TouchableOpacity onPress={signOut} style={styles.logoutBtn}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      {pendingCount > 0 && (
        <View style={styles.syncBanner}>
          <Text style={styles.syncText}>
            {pendingCount} report{pendingCount > 1 ? 's' : ''} saved offline, will sync automatically
          </Text>
        </View>
      )}

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search serial, location, or model..."
          placeholderTextColor={colors.text4}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <Text style={styles.countText}>{filtered.length} machine{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }: { item: Machine }) => (
          <TouchableOpacity
            style={styles.machineCard}
            onPress={() => navigation.navigate('ReportEntry', { machine: item })}
            activeOpacity={0.7}
          >
            <View style={styles.machineHeader}>
              <Text style={styles.machineSerial}>{item.serial_number}</Text>
              <Text style={styles.machineModel}>{item.model}</Text>
            </View>
            <Text style={styles.machineLocation}>{item.location}</Text>
          </TouchableOpacity>
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
    backgroundColor: colors.bg0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.bg2,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text1,
    textTransform: 'capitalize',
  },
  siteName: {
    fontSize: 12,
    color: colors.text3,
    marginTop: 2,
  },
  logoutBtn: {
    padding: 8,
  },
  logout: {
    color: colors.text3,
    fontSize: 13,
    fontWeight: '500',
  },
  syncBanner: {
    backgroundColor: colors.warningBg,
    padding: 10,
    alignItems: 'center',
  },
  syncText: {
    color: colors.warningFg,
    fontSize: 12,
    fontWeight: '600',
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  searchInput: {
    backgroundColor: colors.bg2,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: colors.text1,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  countText: {
    fontSize: 12,
    color: colors.text3,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  machineCard: {
    backgroundColor: colors.bg2,
    borderRadius: 8,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: colors.borderDefault,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  machineSerial: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text1,
    fontVariant: ['tabular-nums'],
  },
  machineModel: {
    fontSize: 11,
    color: colors.accent,
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    overflow: 'hidden',
    fontWeight: '600',
  },
  machineLocation: {
    fontSize: 13,
    color: colors.text2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.text3,
    fontSize: 14,
  },
});
