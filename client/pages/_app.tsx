import type { AppProps } from 'next/app';
import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { persistor, store } from '../appState/store';
import CheckAuth from '../components/checkAuth';
import '../styles/globals.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={null /* TODO: Loading screen */} persistor={persistor}>
        <CheckAuth
          Component={Component}
          pageProps={pageProps}
        />
      </PersistGate>
    </Provider>
  );
}
export default MyApp;
