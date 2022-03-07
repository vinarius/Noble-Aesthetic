import React, { ReactElement } from 'react';

import { decrement, increment } from '../appState/slices/counter';
import { useAppDispatch, useAppSelector } from '../appState/store';

export default function Foo(): ReactElement {
  const dispatch = useAppDispatch();
  const count = useAppSelector(state => state.counter.count);

  return <>
    <div>
      <button
        onClick={()=>dispatch(increment())}
        className='border-gray-900 p-3 m-5 bg-gray-600 text-white rounded'
      >
        Click to increment!
      </button>
      <button
        onClick={()=>dispatch(decrement())}
        className='border-gray-900 p-3 m-5 bg-gray-600 text-white rounded'
      >
        Click to decrement!
      </button>

      <p>Count: {count}</p>
    </div>
  </>;
}