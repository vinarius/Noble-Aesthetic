import '../styles/globals.css';

import React, { useEffect } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';

import { persistor, store } from '../appState/store';
import Loading from '../components/loading';

import type { AppProps } from 'next/app';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

function MyApp({ Component, pageProps }: AppProps) {


  useEffect(()=>{
    console.log('executed useEffect in _app');
  });

  return (
    <Provider store={store}>
      <PersistGate loading={<Loading />} persistor={persistor}>
        <div>
          <Navbar />
          <Component {...pageProps} />
          <Footer />
        </div>
      </PersistGate>
    </Provider>
  );
}
export default MyApp;
