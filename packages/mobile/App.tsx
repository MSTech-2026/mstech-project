import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LoginScreen } from './src/screens/LoginScreen';
import { MachineListScreen } from './src/screens/MachineListScreen';
import { ReportEntryScreen } from './src/screens/ReportEntryScreen';
import { useStore } from './src/store';
import { startSyncListener } from './src/lib/sync';
import { supabase } from './src/lib/supabase';
import { colors } from './src/theme';
import { Atmosphere } from './src/components/Atmosphere';

const Stack = createNativeStackNavigator();

export default function App() {
  const user = useStore((s) => s.user);
  const isLoading = useStore((s) => s.isLoading);
  const initialize = useStore((s) => s.initialize);
  const setUser = useStore((s) => s.setUser);
  const refreshPendingCount = useStore((s) => s.refreshPendingCount);

  useEffect(() => {
    initialize();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        initialize();
      } else {
        setUser(null);
      }
    });

    startSyncListener((_count) => {
      refreshPendingCount();
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <Atmosphere />
        <StatusBar barStyle="light-content" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.surfaceContainerHigh },
          headerTintColor: colors.onSurface,
          headerTitleStyle: { fontWeight: '600' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        {user ? (
          <>
            <Stack.Screen
              name="MachineList"
              component={MachineListScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="ReportEntry"
              component={ReportEntryScreen}
              options={{ title: 'Log Report' }}
            />
          </>
        ) : (
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
