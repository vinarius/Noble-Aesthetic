import { DateTime } from 'luxon';
import { AppProps } from 'next/app';
import Router from 'next/router';
import React, { ReactElement } from 'react';
import { apiClient } from '../api/apiClient';
import { setAuthHeader } from '../appState/slices/auth';
import { useAppDispatch, useAppSelector } from '../appState/store';
import { config } from '../getConfig';
import Login from '../pages/login';
import Footer from './footer';
import Loading from './loading';
import Navbar from './navbar';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

const { stage } = config;

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const { pathname } = Router;
  const { idToken, tokenExpiration, isAuthHeaderSet } = useAppSelector(state => state.auth);

  if (!isAuthHeaderSet && idToken && tokenExpiration && tokenExpiration > DateTime.utc()) {
    apiClient.axios.setAuthToken(idToken);
    dispatch(
      setAuthHeader()
    );
  }

  if (idToken && tokenExpiration && tokenExpiration < DateTime.utc()) {
    // TODO: refreshToken
  }

  if (
    pathname !== '/login' &&
    !isLoggedIn &&
    stage !== 'prod'
  ) {
    Router.push('/login');
    return <Login />;
  }

  if (pathname === '/_error') {
    Router.push('/');
    return <Loading />;
  }

  console.log('pathname:', pathname);

  return <>
    {isLoggedIn && <Navbar />}
    <Component {...pageProps} />
    {isLoggedIn && <Footer />}
  </>;
}