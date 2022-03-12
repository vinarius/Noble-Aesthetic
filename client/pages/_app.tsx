import '../styles/globals.css';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store, useAppSelector } from '../appState/store';
import Loading from '../components/loading';

import type { AppProps } from 'next/app';
import CheckAuth from '../components/checkAuth';

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
