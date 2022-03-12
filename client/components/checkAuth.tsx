import { AppProps } from 'next/app';
import React, { ReactElement, useEffect } from 'react';

import { useAppSelector } from '../appState/store';
import Footer from './footer';
import Navbar from './navbar';

import Router from 'next/router';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

import Login from '../pages/login';

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);

  if (!isLoggedIn && process.env.NEXT_PUBLIC_STAGE !== 'prod') {
    console.log('user is not logged in');
    return <Login />; // TODO: Doesn't change window.href
  }

  console.log('user is logged in');
  console.log('rendering child component tree');

  return <>
    <div>
      <Navbar />
      <Component {...pageProps} />
      <Footer />
    </div>
  </>;
}