import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // useNavigate 훅 import
import willService from '../services/willService'; // willService import
import './LoginPageCss/LoginPage.css'; // CSS 파일 import

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate(); // useNavigate 인스턴스 생성

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);
    setMessage('');

    if (!username || !password) {
      setMessage('사용자 이름과 비밀번호를 모두 입력해주세요.');
      setIsLoading(false);
      return;
    }

    try {
      const response = await willService.loginUser({ username, password });
      const data = response.data; // axios는 data 객체에 응답 본문을 담아줍니다.

      // 성공적인 응답 (보통 HTTP 200 OK)
      setMessage(`로그인 성공! 사용자 ID: ${data.userId || data.message}`);
      sessionStorage.setItem('userId', data.userId); // 세션에 userId 저장
      // setUsername(''); // 성공 후 입력 필드 초기화 (선택 사항)
      // setPassword(''); // 성공 후 입력 필드 초기화 (선택 사항)
      navigate('/'); // 메인 페이지로 이동

    } catch (error) {
      console.error('로그인 요청 중 에러 발생:', error);
      if (error.response && error.response.data && error.response.data.error) {
        setMessage(error.response.data.error);
      } else {
        setMessage('로그인 중 오류가 발생했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // <div style={styles.container}>
    <div className="login-container">
      <h2>로그인</h2>
      <form onSubmit={handleSubmit}>
        {/* <div style={styles.formGroup}> */}
        <div className="login-form-group">
          {/* <label htmlFor="username" style={styles.label}>사용자 이름:</label> */}
          <label htmlFor="username" className="login-label">사용자 이름:</label>
          <input
            type="text"
            id="username"
            name="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            // style={styles.input}
            className="login-input"
            disabled={isLoading}
          />
        </div>
        {/* <div style={styles.formGroup}> */}
        <div className="login-form-group">
          {/* <label htmlFor="password" style={styles.label}>비밀번호:</label> */}
          <label htmlFor="password" className="login-label">비밀번호:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            // style={styles.input}
            className="login-input"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          // style={isLoading ? {...styles.button, ...styles.buttonDisabled} : styles.button}
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? '로그인 중...' : '로그인'}
        </button>
      </form>
      {message && (
        // <div style={
        //     message.startsWith('로그인 성공') ?
        //     {...styles.message, ...styles.successMessage} :
        //     styles.message
        // }>
        <div className={
            message.startsWith('로그인 성공') ?
            "login-message login-success-message" :
            "login-message"
        }>
          {message}
        </div>
      )}
    </div>
  );
};

export default LoginPage;