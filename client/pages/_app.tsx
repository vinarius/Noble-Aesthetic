import React from 'react';

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import { store } from '../data/myStore';
import { Provider } from 'react-redux';
// import Navbar from '../components/navbar';
// import Footer from '../components/footer';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <Provider store={store}>
      <div>
        {/* <Navbar /> */}
        <Component {...pageProps} />
        {/* <Footer /> */}
      </div>
    </Provider>
  );
}
export default MyApp;
