import React, { ReactElement } from 'react';

import Link from 'next/link';

export default function Navbar(): ReactElement {
  return <>
    <header className='w-full'>
      <nav className='w-full flex items-center justify-center bg-gray-600 text-white text-lg'>
        <Link href="/">
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
      </nav>
    </header>
  </>;
}