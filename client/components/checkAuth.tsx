import { AppProps } from 'next/app';
import React, { ReactElement, useEffect } from 'react';

import { useAppSelector } from '../appState/store';
import Footer from './footer';
import Navbar from './navbar';

import Router from 'next/router';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);

  if (!isLoggedIn) {
    console.log('user is not logged in');
    // Router.push('/login');
  } else {
    console.log('user is logged in');
  }

  return <>
    <div>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  </>;
}