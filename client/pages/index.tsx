import Head from 'next/head';
import React, { ReactElement } from 'react';

export default function Home(): ReactElement {

  return (
    <>
      <Head>
        <title>Noble Aesthetic</title>
        <meta name='description' content='Welcome page' />
        {/* <link rel='icon' href='/favicon.ico' /> */}
      </Head>

      <main className='w-full'>

        <div className='flex flex-col justify-center items-center h-screen'>
          <p className='text-xl md:text-6xl my-3'>Welcome to Noble Aesthetic</p>
          <p className='text-xl md:text-6xl my-3'>Coming Soon!</p>
        </div>

        {/*         
        <div className='h-96 bg-gray-600 text-white flex items-center'>
          <div className='grid grid-flow-col grid-cols-2 grid-rows-2 ml-10'>
            <p className='text-4xl'>
              Lorem ipsum dolor sit amet. 1
            </p>
            <p className='text-xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        <div className='h-96 flex justify-around items-center'>
          <img
            className='rounded'
            alt='placeholder image'
            src='https://via.placeholder.com/300'
          />
          <div>
            <p className='text-4xl'>
              Lorem ipsum dolor sit amet. 2
            </p>
            <p className='text-xl'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        <div className='h-96 bg-gray-600 text-white flex justify-around items-center'>
          <div>
            <p className='text-4xl'>
              Lorem ipsum dolor sit amet. 2
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

        <div className='flex justify-around items-center mt-20 mb-20'>
          <div>
            <img
              className='rounded'
              alt='placeholder image'
              src='https://via.placeholder.com/300'
            />
            <div>
              <p className='text-4xl'>
                Lorem ipsum dolor sit amet. 2
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
                Lorem ipsum dolor sit amet. 2
              </p>
              <p className='text-xl'>
                Lorem ipsum dolor sit amet.
              </p>
            </div>
          </div>
        </div>
        */}


      </main>
    </>
  );
}
