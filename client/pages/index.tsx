import Head from 'next/head';
import React, { ReactElement } from 'react';
import styles from '../styles/Home.module.css';

export default function Home(): ReactElement {
  return (
    <>
      <Head>
        <title>Noble Aesthetic</title>
        <meta name='description' content='Welcome page' />
      </Head>

      <main className='w-full'>
        <div className='h-96 flex items-center'>
          <div className='mx-auto md:max-w-lg'>
            <p className='text-5xl md:text-5xl'>
              Lorem, ipsum dolor.
            </p>
            <p className='mt-2 md:text-2xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        <div className={`${styles['h-30rem']} flex flex-col md:flex-row justify-around items-center`}>
          <img
            className='rounded'
            alt='placeholder image'
            src='https://via.placeholder.com/300'
          />
          <div>
            <p className='text-3xl'>
              Lorem ipsum dolor sit amet. 2
            </p>
            <p className='text-xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        <div className={`${styles['h-30rem']}  flex flex-col md:flex-row justify-around items-center`}>
          <div>
            <p className='text-3xl'>
              Lorem ipsum dolor sit amet. 3
            </p>
            <p className='text-xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
          <img
            className='rounded'
            alt='placeholder image'
            src='https://via.placeholder.com/300'
          />
        </div>

        <div className={`${styles['h-30rem']} flex flex-col md:flex-row justify-around items-center my-20`}>
          <div>
            <img
              className='rounded'
              alt='placeholder image'
              src='https://via.placeholder.com/300'
            />
            <div>
              <p className='text-2xl'>
                Lorem ipsum dolor sit amet. 4
              </p>
              <p className='text-xl'>
                Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>
          <div>
            <img
              className='rounded'
              alt='placeholder image'
              src='https://via.placeholder.com/300'
            />
            <div>
              <p className='text-2xl'>
                Lorem ipsum dolor sit amet. 4
              </p>
              <p className='text-xl'>
                Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
