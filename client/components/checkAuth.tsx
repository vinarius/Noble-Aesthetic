import { AppProps } from 'next/app';
import React, { ReactElement } from 'react';

import { useAppSelector } from '../appState/store';
import Footer from './footer';
import Navbar from './navbar';

import Router from 'next/router';
import Login from '../pages/login';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);
  const { pathname } = Router;

  if (
    pathname !== '/login' &&
    !isLoggedIn &&
    process.env.NEXT_PUBLIC_STAGE !== 'prod'
  ) {
    Router.push('/login');
    return <Login />;
  }

  return <>
    {isLoggedIn && <Navbar />}
    <Component {...pageProps} />
    {isLoggedIn && <Footer />}
  </>;
}