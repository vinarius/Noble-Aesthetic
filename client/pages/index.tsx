import Head from 'next/head';
import React, { ReactElement } from 'react';

import styles from '../styles/Home.module.css';

export default function Home(): ReactElement {
  return (
    <div className={styles.container}>
      <Head>
        <title>Noble Aesthetic</title>
        <meta name="description" content="Welcome page" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to Noble Aesthetic!
        </h1>
      </main>

      <footer className={styles.footer}>
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Cum placeat, debitis voluptatibus earum quas, dolores cumque, quaerat aperiam sint ipsa cupiditate exercitationem? Vel inventore, impedit fuga at voluptas cupiditate ipsam.
      </footer>
    </div>
  );
}
