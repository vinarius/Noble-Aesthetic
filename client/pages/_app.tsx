import '../styles/globals.css';

import React from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '../appState/store';
import CheckAuth from '../components/checkAuth';
import Loading from '../components/loading';

import type { AppProps } from 'next/app';
function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <CheckAuth
          Component={Component}
          pageProps={pageProps}
        />
      </PersistGate>
    </Provider>
  );
}
export default MyApp;
