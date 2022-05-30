import { DateTime } from 'luxon';
import { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import React, { ReactElement } from 'react';
import { apiClient } from '../api/apiClient';
import { setAuthHeader } from '../appState/slices/auth';
import { useAppDispatch, useAppSelector } from '../appState/store';
import { stage } from '../getConfig';
import Login from '../pages/login';
import Footer from './footer';
import Navbar from './navbar';

type CheckAuthProps = Pick<AppProps, 'Component' | 'pageProps'>;

export default function CheckAuth({ Component, pageProps }: CheckAuthProps): ReactElement {
  const { isLoggedIn } = useAppSelector(state => state.auth);
  const dispatch = useAppDispatch();
  const router = useRouter();
  const { pathname } = router;
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
    router.replace('/login');
    return <Login />;
  }

  // if (pathname === '/_error') {
  //   console.log('error');
  //   router.replace('/');
  //   return <Loading />;
  // }

  // if (document.location.pathname !== pathname) {
  //   document.location.pathname = pathname;
  // }

  return <>
    {isLoggedIn && <Navbar />}
    <Component {...pageProps} />
    {isLoggedIn && <Footer />}
  </>;
}