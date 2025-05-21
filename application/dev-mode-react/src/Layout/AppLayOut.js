import React, { useState } from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import styled from "styled-components";
import { FaFacebookF, FaTwitter, FaUser } from "react-icons/fa";

// 전체 레이아웃
const Container = styled.div`
  background-color: #f9fafb;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

/* ---------------- NAVBAR ---------------- */

const Navbar = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 32px;
  background-color: #fff;
  border-bottom: 1px solid #eee;
`;

const Logo = styled.div`
  font-weight: 700;
  font-size: 20px;
  color: #111827;
  cursor: pointer;
`;

const NavMenu = styled.nav`
  display: flex;
  gap: 32px;
  font-size: 14px;

  a {
    color: #4b5563;
    text-decoration: none;

    &:hover {
      color: #6366f1;
    }
  }
`;

const NavButtons = styled.div`
  display: flex;
  gap: 12px;

  button {
    font-size: 14px;
    padding: 8px 16px;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 500;
  }

  .login {
    background-color: transparent;
    color: #6366f1;
    border: 1px solid #6366f1;
  }

  .signup {
    background-color: #6366f1;
    color: white;
    border: none;
  }
`;

/* ---------------- FOOTER ---------------- */

const Footer = styled.footer`
  background-color: #1f2937;
  color: #9ca3af;
  padding: 48px 32px 24px;
  font-family: 'Inter', sans-serif;
  margin-top: auto;
`;

const FooterTop = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 32px;
`;

const FooterBrand = styled.div`
  flex: 1;

  h4 {
    font-size: 18px;
    color: #ffffff;
    margin-bottom: 12px;
  }

  p {
    margin-bottom: 16px;
  }

  .icons {
    display: flex;
    gap: 16px;

    svg {
      font-size: 18px;
      cursor: pointer;

      &:hover {
        color: #ffffff;
      }
    }
  }
`;

const FooterColumn = styled.div`
  flex: 1;

  h5 {
    color: #ffffff;
    font-weight: 600;
    margin-bottom: 12px;
  }

  div {
    margin-bottom: 6px;
    cursor: pointer;

    &:hover {
      color: #ffffff;
    }
  }
`;

const FooterBottom = styled.div`
  border-top: 1px solid #374151;
  margin-top: 32px;
  padding-top: 24px;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  align-items: center;

  input {
    background-color: #374151;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 8px 0 0 8px;
    outline: none;
  }

  button {
    background-color: #6366f1;
    color: white;
    border: none;
    padding: 10px 16px;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
  }
`;

/* ---------------- MODAL ---------------- */

const ModalOverlay = styled.div`
  position: fixed;
  top: 0; left: 0;
  width: 100%; height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 32px;
  border-radius: 12px;
  width: 360px;
  max-width: 90%;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);

  h2 {
    margin-bottom: 16px;
    font-size: 20px;
  }

  form {
    display: flex;
    flex-direction: column;
    gap: 12px;

    input {
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 8px;
    }

    button[type="submit"] {
      background-color: #6366f1;
      color: white;
      padding: 10px;
      border: none;
      border-radius: 8px;
      cursor: pointer;

      &:hover {
        background-color: #4f46e5;
      }
    }
  }

  .footer-link {
    margin-top: 12px;
    font-size: 14px;
    text-align: center;
    color: #4b5563;
    cursor: pointer;

    &:hover {
      color: #6366f1;
    }
  }

  .close {
    margin-top: 16px;
    background: none;
    border: none;
    color: #6366f1;
    cursor: pointer;
  }
`;

/* ---------------- COMPONENT ---------------- */

const AppLayout = () => {
  const navigate = useNavigate();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showSignupModal, setShowSignupModal] = useState(false);

  return (
    <Container>
      {/* Navbar */}
      <Navbar>
        <Logo onClick={() => navigate('/')}>마침표</Logo>
        <NavMenu>
          <Link to="/service">서비스 소개</Link>
          <Link to="/features">특징</Link>
          <Link to="/review">이용 후기</Link>
          <Link to="/faq">FAQ</Link>
        </NavMenu>
        <NavButtons>
          <button className="login" onClick={() => setShowLoginModal(true)}>로그인</button>
          <button className="signup" onClick={() => setShowSignupModal(true)}>회원가입</button>
        </NavButtons>
      </Navbar>

      {/* Main content */}
      <main>
        <Outlet />
      </main>

      {/* Login Modal */}
      {showLoginModal && (
        <ModalOverlay onClick={() => setShowLoginModal(false)}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <h2>로그인</h2>
            <form>
              <input type="email" placeholder="이메일" required />
              <input type="password" placeholder="비밀번호" required />
              <button type="submit">로그인</button>
            </form>
            <div className="footer-link" onClick={() => {
              setShowLoginModal(false);
              setShowSignupModal(true);
            }}>
              아직 회원이 아니신가요? 회원가입
            </div>
            <button className="close" onClick={() => setShowLoginModal(false)}>닫기</button>
          </ModalContent>
        </ModalOverlay>
      )}

      {/* Signup Modal */}
      
      {showSignupModal && (
  <ModalOverlay onClick={() => setShowSignupModal(false)}>
    <ModalContent onClick={(e) => e.stopPropagation()}>
      <h2>회원가입</h2>
      <form>
        <input type="text" placeholder="이름" required />
        <input type="email" placeholder="이메일 (아이디)" required />
        <input type="password" placeholder="비밀번호" required />
        <input type="password" placeholder="비밀번호 확인" required />
        <input type="date" placeholder="생년월일" required />
        <input type="tel" placeholder="휴대폰 번호 (- 없이)" required />
        <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
  <input
    type="text"
    placeholder="인증번호 입력"
    style={{
      flex: 2,
      padding: "10px",
      border: "1px solid #ccc",
      borderRadius: "8px",
      width: "20px",
    }}
  />
  <button
    type="button"
    style={{
      flex: 1,
      background: "#6366f1",
      color: "#fff",
      border: "none",
      borderRadius: "8px",
      padding: "10px",
      fontSize: "15px",
      cursor: "pointer",
      whiteSpace: "nowrap",
      height: "42px"  // 입력창과 높이 맞추기
    }}
  >
    인증 요청
  </button>
</div>
        <button type="submit">회원가입</button>
      </form>
      <div className="footer-link" onClick={() => {
        setShowSignupModal(false);
        setShowLoginModal(true);
      }}>
        이미 계정이 있으신가요? 로그인
      </div>
      <button className="close" onClick={() => setShowSignupModal(false)}>닫기</button>
    </ModalContent>
  </ModalOverlay>
)}


      {/* Footer */}
      <Footer>
        <FooterTop>
          <FooterBrand>
            <h4>마침표</h4>
            <p>블록체인 기반 유언장 공증 플랫폼으로<br />소중한 당신의 마지막 뜻을 안전하게 남기세요.</p>
            <div className="icons">
              <FaFacebookF />
              <FaTwitter />
              <FaUser />
            </div>
          </FooterBrand>

          <FooterColumn>
            <h5>서비스</h5>
            <div onClick={() => navigate('/write')}>유언장 작성</div>
            <div>공증 서비스</div>
            <div>유언장 관리</div>
            <div>보안 정책</div>
          </FooterColumn>

          <FooterColumn>
            <h5>회사 정보</h5>
            <div>회사 소개</div>
            <div>이용약관</div>
            <div>개인정보처리방침</div>
            <div>문의하기</div>
          </FooterColumn>
        </FooterTop>

        <FooterBottom>
          <div>© 2023 마침표. All rights reserved.</div>
          <div>
            <input type="email" placeholder="이메일 주소" />
            <button>구독</button>
          </div>
        </FooterBottom>
      </Footer>
    </Container>
  );
};

export default AppLayout;
