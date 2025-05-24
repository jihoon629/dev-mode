import React, { useState } from 'react';
import willService from '../services/willService';

const RegisterPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [birth, setBirth] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!username || !password || !confirmPassword || !name || !phone || !birth) {
      setMessage('모든 필드를 입력해주세요.');
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setMessage('비밀번호가 일치하지 않습니다.');
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
        setMessage('비밀번호는 최소 6자 이상이어야 합니다.');
        setIsLoading(false);
        return;
    }

    try {
      const response = await willService.registerUser({ username, password, name, phone, birth });

      setMessage(`회원가입 성공! ${response.data.message || ''}`);
      setUsername('');
      setPassword('');
      setConfirmPassword('');
      setName('');
      setPhone('');
      setBirth('');

    } catch (error) {
      console.error('회원가입 요청 중 에러 발생:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('회원가입 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const styles = {
    container: {
      maxWidth: '400px',
      margin: '50px auto',
      padding: '20px',
      border: '1px solid #ccc',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      fontFamily: 'Arial, sans-serif',
    },
    formGroup: {
      marginBottom: '15px',
    },
    label: {
      display: 'block',
      marginBottom: '5px',
      fontWeight: 'bold',
    },
    input: {
      width: 'calc(100% - 20px)',
      padding: '10px',
      border: '1px solid #ddd',
      borderRadius: '4px',
      boxSizing: 'border-box',
    },
    button: {
      width: '100%',
      padding: '10px 15px',
      backgroundColor: '#28a745',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer',
      fontSize: '16px',
    },
    buttonDisabled: {
      backgroundColor: '#aaa',
      cursor: 'not-allowed',
    },
    message: {
      marginTop: '15px',
      padding: '10px',
      borderRadius: '4px',
      backgroundColor: '#f8d7da',
      color: '#721c24',
      border: '1px solid #f5c6cb',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
        border: '1px solid #c3e6cb',
    }
  };

  return (
    <div style={styles.container}>
      <h2>회원가입</h2>
      <form onSubmit={handleSubmit}>
        <div style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>사용자 이름:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="password" style={styles.label}>비밀번호:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="confirmPassword" style={styles.label}>비밀번호 확인:</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="name" style={styles.label}>이름:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="phone" style={styles.label}>전화번호:</label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <div style={styles.formGroup}>
          <label htmlFor="birth" style={styles.label}>생년월일 (YYYY-MM-DD):</label>
          <input
            type="date"
            id="birth"
            name="birth"
            value={birth}
            onChange={(e) => setBirth(e.target.value)}
            style={styles.input}
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          style={isLoading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          disabled={isLoading}
        >
          {isLoading ? '가입 처리 중...' : '회원가입'}
        </button>
      </form>
      {message && (
        <div style={
            message.startsWith('회원가입 성공') ?
            {...styles.message, ...styles.successMessage} :
            styles.message
        }>
          {message}
        </div>
      )}
    </div>
  );
};

export default RegisterPage;