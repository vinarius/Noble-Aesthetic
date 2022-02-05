import Head from 'next/head';
import React, { ReactElement } from 'react';

import styles from '../styles/About.module.css';

export default function Home(): ReactElement {
  return (
    <>
      <Head>
        <title>Noble Aesthetic - About</title>
        <meta name='description' content='About page' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <main className='w-full'>
        {/* 1 */}
        <div
          className={`h-32 bg-gray-600 text-white flex items-center`}>
          <div className='grid grid-flow-col grid-cols-2 grid-rows-2 ml-10'>
            <p className='text-4xl'>
              The about page
            </p>
            <p className='text-xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        {/* 2 */}
        <div className={`${styles['h-30rem']} flex justify-end items-end`}>
          <img
            className='w-full h-full'
            alt='placeholder image'
            src='./office-1.jpg'
          />
          <div className={`absolute bg-white w-full flex justify-end items-center ${styles['triangle-border']}`}>
            <p className='text-4xl mr-10'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        {/* 3 */}
        <div className={`${styles['h-30rem']} bg-gray-600 text-white flex justify-around items-center`}>
          <div>
            <p className='text-4xl'>
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

        {/* 4 */}
        <div className={`${styles['h-30rem']} flex justify-around items-center mt-20 mb-20`}>
          <div>
            <img
              className='rounded'
              alt='placeholder image'
              src='https://via.placeholder.com/300'
            />
            <div>
              <p className='text-4xl'>
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
              <p className='text-4xl'>
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
