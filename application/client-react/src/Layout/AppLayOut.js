import React, { useState, useEffect } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaFacebookF, FaTwitter, FaUser } from "react-icons/fa";
import './AppLayOut.css';

const AppLayout = () => {
  const navigate = useNavigate();
  const [loggedInUser, setLoggedInUser] = useState(null);

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setLoggedInUser(storedUsername);
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('userId');
    setLoggedInUser(null);
    navigate('/');
  };

  const handleScrollToSection = (sectionId) => {
    navigate('/');
    setTimeout(() => {
      const section = document.getElementById(sectionId);
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="app-layout-container">
      <header className="app-layout-navbar">
        <div className="app-layout-logo" onClick={() => navigate('/')}>마침표</div>
        <nav className="app-layout-nav-menu">
          <button className="app-layout-navlink-button" onClick={() => handleScrollToSection('service')}>서비스 소개</button>
          <button className="app-layout-navlink-button" onClick={() => handleScrollToSection('features')}>특징</button>
          <button className="app-layout-navlink-button" onClick={() => handleScrollToSection('review')}>이용 후기</button>
          <button className="app-layout-navlink-button" onClick={() => handleScrollToSection('faq')}>FAQ</button>
        </nav>
        <div className="app-layout-nav-buttons">
          {loggedInUser ? (
            <>
              <span className="username-display">안녕하세요, {loggedInUser}님!</span>
              <button className="logout" onClick={handleLogout}>로그아웃</button>
            </>
          ) : (
            <>
              <button className="login" onClick={() => navigate('/login')}>로그인</button>
              <button className="signup" onClick={() => navigate('/register')}>회원가입</button>
            </>
          )}
        </div>
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="app-layout-footer">
        <div className="app-layout-footer-top">
          <div className="app-layout-footer-brand">
            <h4>마침표</h4>
            <p>블록체인 기반 유언장 공증 플랫폼으로<br />소중한 당신의 마지막 뜻을 안전하게 남기세요.</p>
            <div className="icons">
              <FaFacebookF />
              <FaTwitter />
              <FaUser />
            </div>
          </div>

          <div className="app-layout-footer-column">
            <h5>서비스</h5>
            <div onClick={() => navigate('/write')}>유언장 작성</div>
            <div>공증 서비스</div>
            <div>유언장 관리</div>
            <div>보안 정책</div>
          </div>

          <div className="app-layout-footer-column">
            <h5>회사 정보</h5>
            <div>회사 소개</div>
            <div>이용약관</div>
            <div>개인정보처리방침</div>
            <div>문의하기</div>
          </div>
        </div>

        <div className="app-layout-footer-bottom">
          <div>© 2023 마침표. All rights reserved.</div>
          <div>
            <input type="email" placeholder="이메일 주소" />
            <button>구독</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AppLayout;