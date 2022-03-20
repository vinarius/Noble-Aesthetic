import { DateTime } from 'luxon';
import { AppProps } from 'next/app';
import Router from 'next/router';
import React, { ReactElement } from 'react';

import { apiClient } from '../api/apiClient';
import { setAuthHeader } from '../appState/slices/auth';
import { useAppDispatch, useAppSelector } from '../appState/store';
import Login from '../pages/login';
import Footer from './footer';
import Navbar from './navbar';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const { pathname } = Router;
  const { idToken, tokenExpiration, isAuthHeaderSet } = useAppSelector(state => state.auth);

  if (!isAuthHeaderSet && idToken && tokenExpiration && tokenExpiration > DateTime.utc()) {
    apiClient.axios.setAuthToken(idToken);
    dispatch(
      setAuthHeader()
    )
  }

  if (idToken && tokenExpiration && tokenExpiration < DateTime.utc()) {
    // TODO: refreshToken
  }

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