import React, { JSX, useEffect } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import AppStack from './Navigation/AppStack';
import AuthStack from './Navigation/AuthStack';
import { store } from './utils/store';
import { RefreshProvider } from './Context/RefreshContext';
import { useAppDispatch, useAppSelector } from './hooks/hooks';
import { initializeUser } from './slices/authSlice';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { UserProvider } from './Context/UserContext';
import { DateProvider } from './Context/DateProvider';
import { PaperProvider } from 'react-native-paper';
import { colors } from './css/colorsIndex';

function AppContent() {
  const dispatch = useAppDispatch();
  const { isAuthenticated } = useAppSelector((state) => state.auth);



  useEffect(() => {
    // Initialize user session from AsyncStorage
    dispatch(initializeUser());
  }, [dispatch]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar
          backgroundColor={colors.accent_blue}
          barStyle="dark-content"
          translucent
      />
      <PaperProvider>
        <UserProvider>
          <DateProvider>
            <RefreshProvider>
              <NavigationContainer>
                {isAuthenticated ? <AppStack /> : <AuthStack />}
              </NavigationContainer>
            </RefreshProvider>
          </DateProvider>
        </UserProvider>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

export default function App(): JSX.Element {



  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  );
}
