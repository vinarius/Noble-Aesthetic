import Head from 'next/head';
import React, { MouseEventHandler, ReactElement, useState } from 'react';
import Foo from '../components/foo';
import axios from 'axios';
import { useAppDispatch, useAppSelector } from '../appState/store';
import { addComment, removeComment } from '../appState/slices/auth';

export default function Home(): ReactElement {
  const dispatch = useAppDispatch();
  const appComments = useAppSelector(state => state.auth.comments);
  const [comments, setComments] = useState(appComments);

  async function getComments() {
    const randomNumber = Math.floor(Math.random() * 200) + 1;
    const { data } = await axios.get(`https://jsonplaceholder.typicode.com/comments/${randomNumber}`);
    setComments([...comments, data]);
    dispatch(addComment(data));
  }

  function deleteComment(id: number) {
    setComments(comments.filter(comment => comment.id !== id));
    dispatch(removeComment(id));
  }

  return (
    <>
      <Head>
        <title>Noble Aesthetic</title>
        <meta name='description' content='Welcome page' />
      </Head>

      <main className='w-full'>

        <div className='flex flex-col justify-center items-center h-screen'>
          <p className='text-xl md:text-6xl my-3'>Welcome to Noble Aesthetic</p>
          <p className='text-xl md:text-6xl my-3'>Coming Soon!</p>
        </div>

        <Foo />

        <br />

        <div className='w-full flex flex-col items-center justify-center my-80'>
          <button
          className='border-gray-900 p-3 m-5 bg-gray-600 text-white rounded'
          onClick={getComments}
          >
            Get Comments
          </button>

          <div className='flex flex-col items-center justify-center'>
            <h1 className='text-4xl font-extrabold my-5'>Sample comments</h1>
            <ul className='w-full flex flex-col items-center justify-center'>
              {comments.map((comment, index) => 
                <li key={index} className='border-2 rounded m-3 w-3/4'>
                  <p>Body: {comment.body}</p>
                  <p>Email: {comment.email}</p>
                  <p>Id: {comment.id}</p>
                  <p>Name: {comment.name}</p>
                  <p>PostId: {comment.postId}</p>
                  <button
                    className='border-gray-900 p-2 m-2 bg-red-500 text-white rounded'
                    onClick={(e)=>deleteComment(comment.id)}
                  >
                    Delete Comment
                  </button>
                </li>
              )}
            </ul>
          </div>
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
