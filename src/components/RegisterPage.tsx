import React, { useState } from 'react';
import { useUser } from '../context/UserContext';

const RegisterPage: React.FC = () => {
  const { register, continueAsGuest } = useUser();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !email) {
      setError('Please enter username and email.');
      return;
    }
    register({ username, email });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Register</h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            className="w-full border p-2 rounded"
            type="text"
            placeholder="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
          />
          <input
            className="w-full border p-2 rounded"
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          {error && <div className="text-red-500 text-sm">{error}</div>}
          <button className="w-full bg-green-600 text-white py-2 rounded" type="submit">Register</button>
        </form>
        <div className="mt-4 text-center">
          <button className="text-blue-500 underline" onClick={continueAsGuest}>Continue as Guest</button>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
