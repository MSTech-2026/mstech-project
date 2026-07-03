import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import Animated, {
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useStore } from '../store';
import { Machine } from '../types';
import { useNavigation } from '@react-navigation/native';
import { colors } from './LoginScreen';

function MachineCard({ item, index, onPress }: { item: Machine; index: number; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
      <Pressable
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15 }); }}
        onPress={onPress}
      >
        <Animated.View style={[styles.machineCard, animatedStyle]}>
          <View style={styles.machineHeader}>
            <Text style={styles.machineSerial}>{item.serial_number}</Text>
            <Text style={styles.machineModel}>{item.model}</Text>
          </View>
          <Text style={styles.machineLocation}>{item.location}</Text>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

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
        <Pressable onPress={signOut} style={styles.logoutBtn}>
          {({ pressed }) => {
            const scale = useSharedValue(1);
            scale.value = withSpring(pressed ? 0.96 : 1, { damping: 15 });
            const animatedStyle = useAnimatedStyle(() => ({
              transform: [{ scale: scale.value }],
            }));
            return (
              <Animated.View style={animatedStyle}>
                <Text style={styles.logout}>Sign out</Text>
              </Animated.View>
            );
          }}
        </Pressable>
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
          accessibilityLabel="Search machines"
          accessibilityHint="Search by serial number, location, or model"
        />
      </View>

      <Text style={styles.countText}>{filtered.length} machine{filtered.length !== 1 ? 's' : ''}</Text>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }: { item: Machine; index: number }) => (
          <MachineCard
            item={item}
            index={index}
            onPress={() => navigation.navigate('ReportEntry', { machine: item })}
          />
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
    padding: 24,
    paddingTop: 64,
    backgroundColor: colors.bg1,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text0,
    textTransform: 'capitalize',
  },
  siteName: {
    fontSize: 13,
    color: colors.text2,
    marginTop: 4,
  },
  logoutBtn: {
    padding: 8,
  },
  logout: {
    color: colors.text2,
    fontSize: 14,
    fontWeight: '600',
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
    backgroundColor: colors.bg1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: colors.text0,
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
    backgroundColor: colors.bg1,
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.borderDefault,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  machineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  machineSerial: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text0,
    fontVariant: ['tabular-nums'],
  },
  machineModel: {
    fontSize: 11,
    color: colors.focus,
    backgroundColor: colors.accentSubtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    overflow: 'hidden',
    fontWeight: '700',
    textTransform: 'uppercase',
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
