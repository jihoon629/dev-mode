import React, { useState } from 'react';
import styled, { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    background-color: #f5f5f5;
    font-family: 'Noto Sans KR', sans-serif;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 40px 20px;
`;

const Content = styled.div`
  width: 100%;
  max-width: 800px;
  background-color: #fff;
  padding: 40px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  border-radius: 4px;
  color: #333;
`;

const Title = styled.h2`
  font-size: 24px;
  margin-bottom: 8px;
`;

const SubTitle = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 24px;
`;

const SectionWrapper = styled.div`
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 24px;
  background-color: #f5f5f5;
`;

const SectionHeader = styled.div`
  background-color: #f2f2f2;
  padding: 12px 16px;
  font-weight: 500;
  font-size: 14px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #ddd;
`;

const SectionContent = styled.div`
  padding: 16px;
  background-color: #fff;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 12px;
`;

const Label = styled.label`
  width: 120px;
  font-size: 14px;
  &.required::after {
    content: ' *';
    color: #e74c3c;
  }
`;

const Input = styled.input`
  flex: 1;
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
`;

const Select = styled.select`
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 8px;
`;

const Button = styled.button`
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #333;
  background: #fff;
  cursor: pointer;
  border-radius: 4px;
  margin-right: 8px;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #574bff;
  color: #fff;
  font-size: 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #4633d6;
  }
`;

const RegisterPage = () => {
  const [memberType, setMemberType] = useState('personal');
  const [gender, setGender] = useState('male');
  const [birthType, setBirthType] = useState('solar');

  return (
    <>
      <GlobalStyle />
      <PageWrapper>
        <Content>
          <Title>가입을 시작합니다.</Title>
          <SubTitle>마침표에 오신것을 환영합니다.</SubTitle>

          <SectionWrapper>
            <SectionHeader>회원인증</SectionHeader>
            <SectionContent>
              <Row>
                <label>
                  <input
                    type="radio"
                    name="memberType"
                    value="personal"
                    checked={memberType === 'personal'}
                    onChange={() => setMemberType('personal')}
                  /> 개인회원
                </label>
              </Row>
            </SectionContent>
          </SectionWrapper>

          <SectionWrapper>
            <SectionHeader>
              <span>기본정보</span>
              <span style={{ color: '#e74c3c', fontSize: '12px' }}>필수</span>
            </SectionHeader>
            <SectionContent>
              <Row>
                <Label className="required">아이디</Label>
                <Input type="text" placeholder="아이디 입력" />
              </Row>
              <Row>
                <Label className="required">비밀번호</Label>
                <Input type="password" placeholder="비밀번호 입력" />
              </Row>
              <Row>
                <Label className="required">비밀번호 확인</Label>
                <Input type="password" placeholder="비밀번호 재입력" />
              </Row>
              <Row>
                <Label className="required">이름</Label>
                <Input type="text" placeholder="이름 입력" />
              </Row>
              <Row>
                <Label>주소</Label>
                <Input type="text" placeholder="우편번호" style={{ maxWidth: '120px' }} />
                <Button>주소검색</Button>
              </Row>
              <Row>
                <Label />
                <Input type="text" placeholder="기본주소" />
              </Row>
              <Row>
                <Label />
                <Input type="text" placeholder="나머지 주소(선택 입력 가능)" />
              </Row>
              <Row>
                <Label>일반전화</Label>
                <Select>
                  <option>02</option>
                  <option>031</option>
                  <option>010</option>
                </Select>
                <Input type="text" style={{ maxWidth: '100px' }} />
                <Input type="text" style={{ maxWidth: '100px' }} />
              </Row>
              <Row>
                <Label className="required">휴대전화</Label>
                <Select>
                  <option>010</option>
                  <option>011</option>
                </Select>
                <Input type="text" style={{ maxWidth: '100px' }} />
                <Input type="text" style={{ maxWidth: '100px' }} />
              </Row>
              <Row>
                <Label>이메일</Label>
                <Input type="email" placeholder="example@domain.com" />
              </Row>
            </SectionContent>
          </SectionWrapper>

          <SectionWrapper>
            <SectionHeader>추가정보</SectionHeader>
            <SectionContent>
              <Row>
                <Label className="required">성별</Label>
                <label style={{ marginRight: '16px' }}>
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={gender === 'male'}
                    onChange={() => setGender('male')}
                  /> 남자
                </label>
                <label>
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={gender === 'female'}
                    onChange={() => setGender('female')}
                  /> 여자
                </label>
              </Row>
              <Row>
                <Label className="required">생년월일</Label>
                <label style={{ marginRight: '16px' }}>
                  <input
                    type="radio"
                    name="birthType"
                    value="solar"
                    checked={birthType === 'solar'}
                    onChange={() => setBirthType('solar')}
                  /> 양력
                </label>
                <label style={{ marginRight: '16px' }}>
                  <input
                    type="radio"
                    name="birthType"
                    value="lunar"
                    checked={birthType === 'lunar'}
                    onChange={() => setBirthType('lunar')}
                  /> 음력
                </label>
                <Input type="text" placeholder="년" style={{ maxWidth: '80px' }} />
                <Input type="text" placeholder="월" style={{ maxWidth: '50px' }} />
                <Input type="text" placeholder="일" style={{ maxWidth: '50px' }} />
              </Row>
            </SectionContent>
          </SectionWrapper>

          <SubmitButton>가입하기</SubmitButton>
        </Content>
      </PageWrapper>
    </>
  );
};

export default RegisterPage;
