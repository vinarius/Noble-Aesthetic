import React, { FormEvent, ReactElement, useState } from 'react';
import { apiClient } from '../api/apiClient';
import { useAppDispatch } from '../appState/store';
import { setLogin } from '../appState/slices/auth';

import styles from './login.module.css';

export default function Login(): ReactElement {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useAppDispatch();

  const handleSubmitLogin = async (event: FormEvent) => {
    event.preventDefault();
    // const response = await apiClient.users.login({ email: username, password }).catch(err => console.error('logging an error here:', err));
    const response = {
      success: true,
      payload: {
          AccessToken: 'eyJraWQiOiIyTm9NOVBkS3JvdngrRW9zamVudmllczArb3U2Tkd4ZWRZNEQyNWF1VmFFPSIsImFsZyI6IlJTMjU2In0.eyJvcmlnaW5fanRpIjoiZGMyYWRjNTctMGFjYS00ZTI1LTkxNGYtMjFlMjEyZDY3MmEzIiwic3ViIjoiNTRiOTVmMzUtMWYxMi00ZTlkLThlOTQtMzRjOWMxNGNmN2VlIiwiZXZlbnRfaWQiOiI4ZTNhOWE5Zi0zNzllLTQ2ODMtYTBiYy1iNjI5MDQ1Y2ZjMTgiLCJ0b2tlbl91c2UiOiJhY2Nlc3MiLCJzY29wZSI6ImF3cy5jb2duaXRvLnNpZ25pbi51c2VyLmFkbWluIiwiYXV0aF90aW1lIjoxNjQ3NzE3MTk4LCJpc3MiOiJodHRwczpcL1wvY29nbml0by1pZHAudXMtZWFzdC0xLmFtYXpvbmF3cy5jb21cL3VzLWVhc3QtMV9DYUl2d0JRMngiLCJleHAiOjE2NDc4MDM1OTgsImlhdCI6MTY0NzcxNzE5OCwianRpIjoiMGI4YjAzNjYtN2IxNi00ZDc4LTg5ZjgtYWQ2ZDFiZmU0OWJhIiwiY2xpZW50X2lkIjoiN29uZ2UyaWg3bzIwcGpqYzAwMHJsamRkZGYiLCJ1c2VybmFtZSI6IjU0Yjk1ZjM1LTFmMTItNGU5ZC04ZTk0LTM0YzljMTRjZjdlZSJ9.coiBDtWLsNGLWK8fILN3MaeOpvRcEZK6CyjzKCqZg9j-Nizj9NHLGYClDaZID4qNpt5NuOySGiXIZKw5jiQ5Zm5_xz754YSKQp37LiZPnSf1lpY4Um5n085jMwhdaUWG9rC-6cAsa4IsjJdKWgQ-h5xw2rfBVvNXbp2FfrpsxP7PmNm2bcDSfNA1TAhmepvzXz9xed0x0EdAWi7H4NYsdRP2jyWCnDtIlz0EbsWgn4Uk24pUe1vJvogFjAQXAz2F2oHIb6uQtqICBnLsutb8s55RLQPtdMNXm0ZD514OrbPWoVuTvvNgtsiOM0O5E1OMVE-78rOR7hvpcFYhXirv-w',
          ExpiresIn: 86400,
          IdToken: 'eyJraWQiOiJsMWY4YVdqWjFvSm1wSnFjUUNKamxnUGVVZjJCUGZNd1p4T1ZcL3Z6R3NDND0iLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiI1NGI5NWYzNS0xZjEyLTRlOWQtOGU5NC0zNGM5YzE0Y2Y3ZWUiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLnVzLWVhc3QtMS5hbWF6b25hd3MuY29tXC91cy1lYXN0LTFfQ2FJdndCUTJ4IiwiY29nbml0bzp1c2VybmFtZSI6IjU0Yjk1ZjM1LTFmMTItNGU5ZC04ZTk0LTM0YzljMTRjZjdlZSIsIm9yaWdpbl9qdGkiOiJkYzJhZGM1Ny0wYWNhLTRlMjUtOTE0Zi0yMWUyMTJkNjcyYTMiLCJhdWQiOiI3b25nZTJpaDdvMjBwampjMDAwcmxqZGRkZiIsImV2ZW50X2lkIjoiOGUzYTlhOWYtMzc5ZS00NjgzLWEwYmMtYjYyOTA0NWNmYzE4IiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2NDc3MTcxOTgsImV4cCI6MTY0NzgwMzU5OCwiaWF0IjoxNjQ3NzE3MTk4LCJqdGkiOiI1OTgzY2QxMi0zMzFhLTQ3YmYtYTE3OS0zMmFkN2ZkYjA4ZGUiLCJlbWFpbCI6InZpbmRldmNjbUBnbWFpbC5jb20ifQ.Q4L_jPfRFvwhe4oh9PJ8c33kGQ5tE5h0HLDvJGD7bAY4mTCXoZkomCOehMcPXHWJkvqC-yvb_63isLxf2ctxZgQIF7loNFAi_ph03oRQt5zmewPL01KLliYBxQ9s55F-vCZ138UFOsg91AjvLKT7qJ7lLnmPgRgt63EkAvnTIb1tEcV4KiKO3ZW_AyrVUf-HbvNo6scI2NNQ4wyOD4iOlKyKeD2aSzVEy7olY8rCQs3S7GEcxDGWTQbD93LLlyGdeVLfBAhUXHQ3-n9hMel1rftX4vJ6xj0C3SvMvY6VEbnUnaj8EWlpv6EaOCGDonFqhsjaivWD4G07jF7ctx6R6g',
          RefreshToken: 'eyJjdHkiOiJKV1QiLCJlbmMiOiJBMjU2R0NNIiwiYWxnIjoiUlNBLU9BRVAifQ.SE7NTX_yHlGmEcKSJqzyDlqNsZlfx-tqQTXZXMyB0hREqesMZ4ygCOFBabJC9wRyBKq9VwWkau6vi7alonwH0ScI_rigw51hgFpHmY3J-hmsVxapw4zfEC0XafFLafCqiCyYx54Wh3i88ErsSzfc1e70HHzvrd9wkd43eIiYR9OjGkEV8y9Y6ylCp9nPs5CwalXYP_HK1jhdQw8KAR3guM5msB5l_WlZ7Cfu5khkDckYHryonEdKIj90Pig-rSID-oLRyKrwL7io_s2Lr67t0hZobfzTUhcP9-dm6f3M6JrppQV-jyErrPL6m89sKROJVL67936FlvwiB0g4WFrYaQ.rpR4RmnEeyvLyTIT.iiMr0tnF_iPPYw9VqRhUN_HELdcGArttTDwxgwSzmFbKQc1hROr6aXTkfjKmMbBkyvsBzuJfVm6MGPLAnrqSnp691Lz0gosEc_jFMqpmtnnoP4fW9vpiu_9jeGYzdzZVDeGrZ5abdQ53E2ISwSG2OcveNuW61oP1SICc7RXwedejlB3zPQsAfbiCA0m7z1HgZWKFkWkoyS7A40obPkVog_4dq7xiWBYvUFcAbeZlebbO8wJwn2dhxdzaetwl7ywNL0IXOUjyEPcRCNoAyNXF-CPQuC7XsW3ms7dMMmDkUZXREuqEclj6X-LfGykvlQQj9m3JwzubjSuyy1MXeqvp9AJLwcB5wrwUeHNcpIKaHKpuXxCW7VR_-ct5vaINGjS59GIkkxBG-Tt7sIJIBUcLNVRH1Or-D4zRy4QAxG25IvhQFOV0_W8E_-v7nHAE8L5e5i1BFcVv5jWAedaIRNoWoaMSuSa4ePOVtToRk6AK9seLeA73LxvhWwmXDZUawkLvbbrYFww43mps-cNRKN30uxjOTqWA3aMcMPpb5S07VNXHDKeMwaG-vN4LUJWkr53CjQWMatu8YnZ1MObGHYpzzbsD1sMXeWtE_CBTHFd6dFsPF5uvaBPKMbb58UIxhsL7FC4ZmKuaRKO5e2rfvKwLgXBLZXASkqUuF1sg5sV9PWuKGzsYE0INrBb6Ujvf3YUFGvS91961_bzPciP8kh-0S1Gx6guwQAsDQVaME-J0OQl8yKCwx4zG9JBbbyn68PTPhvEG-jeTTiX6dqPhvn5u0jBBfN-1yIJ6ASs_X89d1dv-RT7x_aGrfP4sCvkLA4IW9reYlXEOwPGGDUV8MtyGTdwVH7ag5jlsl2k43b5TKgM_LJI-d-BZ0UQL6o6p0aavHvUQIV1j_AyE1tHCb8Ox7kem6M3wE6gTzF62zoXp8bS8tmmLOSViI7dMENWTM6RNpcodIrbLBPVHj-17mx6gfRFupRDcHqQzYlCW2sV3CArWTnkUTBiiWm3_m5n_A_cBcwLLI0W_SCqd8nxS801MM7nFIydaYJ2GcE7Rxn166aELFjlddjDbOcNBJhT2wCQbg8P6IbUe-d1hHhub0yQCM4Dgv54mfD0AkApCmWgwgYMXb8RNclbefAOpRhVo5okD9pa4E5FBhE0Linj1HUz3Jjs_wmXnKUa6kq6lJIgan8BWCv3SX_1htWSeRZapq8CaLWEUGyPoRY1sMam3L-fP624RsUbkOoPRaqqy5K5UpJyubOYWAOiJPov7erEkCe5bkzCA4thV8fDtlLHvYJ-zJ6UZTu_tv-gNQU28BHu2eraNqjOLuqJUrIQTrEM.vedGqu8XbqPp-Af7fZsCaQ'
      }
      },
      user: {
        phoneNumber: '',
        dataKey: 'details',
        birthdate: '',
        lastName: '',
        userName: 'vindevccm@gmail.com',
        address: {
          zip: '',
          country: '',
          state: '',
          line2: '',
          city: '',
          line1: ''
        },
        firstName: '',
        gender: ''
      }
    };

    const {  } = response;
    dispatch(setLogin({}))
    console.log('response:', response);
  };

  return <div className={`w-full flex justify-center items-center h-screen ${styles['bg-image-dumbbell']}`}>
    <form
      className='bg-gray-100 rounded-md opacity-95 h-96 w-80 md:w-96 flex flex-col justify-center items-center'
      onSubmit={(event)=>handleSubmitLogin(event)}
    >
      <p className='my-5 text-4xl'>Noble Aesthetic</p>
      <div className='my-5 flex flex-col'>
        <input
          name='username'
          className='my-1 h-12 text-lg p-2 w-72 md:w-80 rounded-md'
          type='text'
          placeholder='Email'
          onChange={(e)=>setUsername(e.target.value)}
        />
        <input
          name='password'
          className='my-1 h-12 text-lg p-2 w-72 md:w-80 rounded-md'
          type='password'
          placeholder='Password'
          onChange={(e)=>setPassword(e.target.value)}
        />
        <button
          type='submit'
          className='w-72 md:w-80 mt-2 text-xl p-1 bg-gray-300 rounded-md'
        >
          Login
        </button>
      </div>
      <hr className='to-black h-1 w-3/4 my-3' />
      <p>Forgot Password?</p>
    </form>
  </div>;
}