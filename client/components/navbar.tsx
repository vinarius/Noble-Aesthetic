import Link from 'next/link';
import Router from 'next/router';
import React, { ReactElement, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { setLogin } from '../appState/slices/auth';
import { useAppDispatch, useAppSelector } from '../appState/store';


export default function Navbar(): ReactElement {
  const username = useAppSelector(state => state.user.username);
  const accessToken = useAppSelector(state => state.auth.accessToken);
  const dispatch = useAppDispatch();

  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    await apiClient.users.logout(accessToken as string); // TODO: getting a 401 on logout lambda

    dispatch(
      setLogin({
        AccessToken: '',
        ExpiresIn: 0,
        IdToken: '',
        isLoggedIn: false,
        RefreshToken: ''
      })
    );

    Router.push('/login');

    setIsLoggingOut(false);
  };

  return <>
    <header className='w-full'>
      <nav className='w-full flex items-center justify-between bg-black text-white text-lg'>
        <div className='m-4 p-1 rounded cursor-pointer'>
          Profile: {username}
        </div>

        <div className='flex m-5'>
          <div className='mx-2'>
            <Link href="/about">
              <a className='m-2'>
                About
              </a>
            </Link>
            <Link href="/">
              <a className='m-2'>
                Inventory
              </a>
            </Link>
            <Link href="/">
              <a className='m-2'>
                Contact Us
              </a>
            </Link>
          </div>
          <div
            onClick={handleLogout}
            className='mx-2 cursor-pointer'
          >
            {isLoggingOut ? 'Logging Out...' : 'Logout'}
          </div>
        </div>
      </nav>
    </header>
  </>;
}