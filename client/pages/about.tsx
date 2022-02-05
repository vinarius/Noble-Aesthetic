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
        <div
          className={`h-32 bg-gray-600 text-white flex items-center`}>
          <div className='grid grid-flow-col grid-cols-2 grid-rows-2 ml-10'>
            <p className='text-4xl'>
              Who We Are
            </p>
          </div>
        </div>

        <div className={`${styles['h-30rem']} flex justify-end items-end`}>
          <img
            className='w-full h-full'
            alt='placeholder image'
            src='./office-1.jpg'
          />
          <div className={`absolute text-white bg-gray-500 w-full flex justify-end items-end ${styles['triangle-border']}`}>
            <p className='text-4xl mr-20 mb-5'>
              Lorem ipsum dolor sit amet.
            </p>
          </div>
        </div>

        <div className={`${styles['h-30rem']} bg-gray-600 text-white grid grid-cols-2 items-center`}>
          <p className='justify-self-center ml-20'>
            Lydia and Colleen are a daughter-mother, dynamic-duo, best friend partnership. Leading up to her first figure competition, Lydia purchased a basic, ready-made posing suit online. When Colleen flew in for the competition, she brought along some thread to tailor the suit to fit Lydia’s physique better, as well as some blinged-out connectors to replace the plain, material straps of the mail-order suit. This event got the wheels turning in both of their heads. What if Colleen could design her daughter’s next posing suit? It would be more cost effective, custom tailored, and designed to Lydia’s standards and specifications.
          </p>
          <img
            className='rounded'
            alt='placeholder image'
            src='https://via.placeholder.com/350'
          />
        </div>

        <div className={`${styles['h-30rem']} grid grid-cols-2 items-center`}>
          <img
            className='rounded justify-self-center'
            alt='placeholder image'
            src='https://via.placeholder.com/350'
          />
          <p className='justify-self-center mr-20'>
            Colleen is a seamstress by nature, having designed and sewn clothes for Lydia since she was a little girl. It was a no-brainer that these two would work together to create the perfect suit for Lydia’s 2017 competition season. Lydia sent her measurements to Minnesota where Colleen created a pattern and purchased some lovely gray material. Lydia received the suit in the mail a few weeks before her competition and it fit perfectly. Lydia had limited time to create a design that she would use to stone her suit. Only days before the competition, Colleen flew in with the crystals and Lydia decorated her masterpiece. The suit came together flawlessly and they both fell in love with the end product as well as the process. Lydia went on to win pro cards at both of her 2017 competitions with that suit.
          </p>
        </div>

        <div className='h-96 bg-gray-600 text-white grid max-w-lg'>
          <p>The enjoyment of the process and naturalness of which everything came together, fueled their little dream of designing suits into a brightly lit reality.</p>

          <p>
            The name Noble Aesthetic is based on the scriptures, Proverbs 31:10-31: The Wife of Noble Character. Through skill, hard work, and dedication, Lydia strives to use her passions to bring honor to, and provide for her household. Because all He has done, is doing, and promises to do, Lydia is set on devoting her ways to her Creator. It is her hope that God will use Noble Aesthetic to further His kingdom as He sees fit.
          </p>

          <p>For from Him and through Him and to Him are all things.</p>

          <p>To Him be glory forever! Amen.</p>
          <sub>- Romans 11:36</sub>


        </div>

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
