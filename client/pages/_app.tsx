import React from 'react';

import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

import styles from '../styles/Home.module.css';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <div className={styles.container}>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  );
}
export default MyApp;
