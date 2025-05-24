import React, { useState } from 'react';
import styled from 'styled-components';
import { FaLock, FaRegCheckCircle, FaCheckCircle } from 'react-icons/fa';
import { Link } from 'react-router-dom';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px 20px;
  font-family: 'Noto Sans KR', sans-serif;
  color: #333;
`;

const TitleWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 30px;
`;

const Line = styled.div`
  flex: 1;
  height: 1px;
  background-color: #ddd;
`;

const TitleText = styled.h1`
  margin: 0 20px;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: -1px;
`;

const SubText = styled.div`
  font-size: 14px;
  color: #666;
  margin-bottom: 8px;
`;

const Input = styled.input`
  width: 100%;
  max-width: 400px;
  padding: 16px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  border-radius: 12px;
  font-size: 16px;
  box-sizing: border-box;
  outline: none;
  &:focus {
    border-color: #574bff;
  }
`;

const OptionGroup = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  max-width: 400px;
  margin-bottom: 30px;
  font-size: 14px;
  color: #666;
`;

const OptionItem = styled.div`
  display: flex;
  align-items: center;
  margin-right: 20px;
  cursor: pointer;
  & svg {
    margin-right: 6px;
    width: 18px;
    height: 18px;
  }
`;

const LoginButton = styled.button`
  width: 100%;
  max-width: 420px;
  padding: 18px;
  background-color: #574bff;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 15px;
  &:hover {
    background-color: #4633d6;
  }
`;

const FindLinks = styled.div`
  font-size: 14px;
  color: #999;
  margin-bottom: 40px;
  & > a {
    color: inherit;
    text-decoration: none;
    margin: 0 8px;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SignupBox = styled.div`
  width: 100%;
  max-width: 420px;
  padding: 16px;
  background-color: #f5f5f5;
  border-radius: 12px;
  font-size: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-sizing: border-box;
  & > a {
    color: #574bff;
    text-decoration: none;
    font-weight: 500;
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoginPage = () => {
  const [saveId, setSaveId] = useState(false);

  return (
    <Container>
      <SubText>삶의 마지막을 장식하는</SubText>
      <TitleWrapper>
        <Line />
        <TitleText>마침표</TitleText>
        <Line />
      </TitleWrapper>
      <Input type="text" placeholder="아이디" />
      <Input type="password" placeholder="비밀번호" />
      <OptionGroup>
        <OptionItem onClick={() => setSaveId(!saveId)}>
          {saveId ? <FaCheckCircle color="#574bff" /> : <FaRegCheckCircle color="#ccc" />} 아이디 저장
        </OptionItem>
        <OptionItem>
          <FaLock color="#e74c3c" /> 보안 접속
        </OptionItem>
      </OptionGroup>
      <LoginButton>로그인</LoginButton>
      <FindLinks>
        <a href="#">아이디 찾기</a>|
        <a href="#">비밀번호 찾기</a>
      </FindLinks>
      <SignupBox>
        <span>아직 회원이 아니신가요?</span>
        <Link to="/register">회원가입</Link>
      </SignupBox>
    </Container>
  );
};

export default LoginPage;
