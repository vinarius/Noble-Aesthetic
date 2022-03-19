import React, { FormEvent, ReactElement, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useAppDispatch } from '../appState/store';
import { setLogin } from '../appState/slices/auth';
import { setUser } from '../appState/slices/user';

import styles from './login.module.css';
import { LoginResponse } from '../models/api/users';
import Router from 'next/router';

import { useAppSelector } from '../appState/store';

export default function Login(): ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);
  const dispatch = useAppDispatch();
  
  const handleSubmitLogin = async (event: FormEvent) => {
    event.preventDefault();
    setIsLoggingIn(true);
    const {  } = await apiClient.users.login({ email: username, password });

    if (success) {
      dispatch(setLogin({
        ...payload,
        isLoggedIn: true
      }));
      
      apiClient.axios.setAuthToken(payload.IdToken);
      
      dispatch(setUser(user));
      
      Router.push('/');
      
      setIsLoggingIn(false);
    }
  };

  const isLoggedIn = useAppSelector(state => state.auth.isLoggedIn);
  if (isLoggedIn) {
    Router.push('/');
    return <div className='h-screen w-screen invisible'></div>;
  }

  return <div className={`w-full flex justify-center items-center h-screen ${styles['bg-image-dumbbell']}`}>
    <form
      className='bg-gray-100 rounded-md opacity-95 h-96 w-80 md:w-96 flex flex-col justify-center items-center'
      onSubmit={(event) => handleSubmitLogin(event)}
    >
      <p className='my-5 text-4xl'>Noble Aesthetic</p>
      <div className='my-5 flex flex-col'>
        <input
          name='username'
          className='my-1 h-12 text-lg p-2 w-72 md:w-80 rounded-md'
          type='text'
          placeholder='Email'
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          name='password'
          className='my-1 h-12 text-lg p-2 w-72 md:w-80 rounded-md'
          type='password'
          placeholder='Password'
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          type='submit'
          className='w-72 md:w-80 mt-2 text-xl p-1 bg-gray-300 rounded-md'
        >
          Login
        </button>
        <div
          className={`${!isLoggingIn && 'invisible'}`}
        >Logging in...</div>
      </div>
      <hr className='to-black h-1 w-3/4 my-3' />
      <p>Forgot Password?</p>
    </form>
  </div>;
}