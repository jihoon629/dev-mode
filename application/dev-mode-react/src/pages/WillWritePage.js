// src/pages/WillWritePage.js
import React, { useState } from 'react';
import styled from 'styled-components';
import { FaUpload, FaUser } from 'react-icons/fa';


const Container = styled.div`
  max-width: 960px;
  margin: 40px auto;
  padding: 24px;
`;

const Section = styled.div`
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 32px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
`;

const Label = styled.div`
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  margin-bottom: 16px;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: none;
`;

const UploadBox = styled.div`
  border: 1px dashed #ccc;
  padding: 32px;
  text-align: center;
  color: #777;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;

  svg {
    font-size: 20px;
    margin-bottom: 8px;
  }
`;

const ViewerItem = styled.div`
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
`;

const Checkbox = styled.label`
  display: flex;
  align-items: center;
  margin-top: 12px;
  input {
    margin-right: 8px;
  }
`;

const ButtonWrap = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 32px;
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  font-size: 14px;

  &.save {
    background: transparent;
    border: 1px solid #6366f1;
    color: #6366f1;
  }

  &.submit {
    background: #6366f1;
    color: white;
  }
`;

const StepProgress = styled.div`
  display: flex;
  justify-content: space-between;
  margin: 32px 0 48px;

  div {
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;

    span {
      margin-top: 8px;
      font-size: 14px;
      color: #666;
    }

    .circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background-color: #e5e7eb;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      color: #fff;
    }

    &.active .circle {
      background-color: #6366f1;
    }

    &.active span {
      color: #111827;
      font-weight: bold;
    }
  }
`;

const WillWritePage = () => {
  const [viewers, setViewers] = useState([{ name: "홍길동", desc: "배우자 & 집행인", id: "0xAbC...1234" }]);
  const [blockchain, setBlockchain] = useState(false);
  const [publicReq, setPublicReq] = useState(false);

  return (
    <Container>
      <h2>디지털 유언장 작성</h2>

      <StepProgress>
        <div className="active">
          <div className="circle">1</div>
          <span>기본 정보</span>
        </div>
        <div>
          <div className="circle">2</div>
          <span>내용 작성</span>
        </div>
        <div>
          <div className="circle">3</div>
          <span>열람자 지정</span>
        </div>
        <div>
          <div className="circle">4</div>
          <span>최종 확인</span>
        </div>
      </StepProgress>

      <Section>
        <Label>기본 정보</Label>
        <Input placeholder="유언장 제목" />
        <Input placeholder="작성자 이름" />
        <Input placeholder="주소" />
      </Section>

      <Section>
        <Label>유언장 내용</Label>
        <TextArea placeholder="유언장 내용을 작성해주세요..." />
        <button style={{ marginTop: "12px" }}>📎 문서 업로드하기</button>
      </Section>

      <Section>
        <Label>자필 문서 스캔 (선택사항)</Label>
        <UploadBox>
          <FaUpload />
          <div style={{ marginTop: 8 }}>
            이곳에 파일을 끌어다 놓거나 클릭하여 업로드하세요<br />
            지원 형식: JPG, PNG, PDF
          </div>
        </UploadBox>
      </Section>

      <Section>
        <Label>열람자 지정</Label>
        {viewers.map((v, i) => (
          <ViewerItem key={i}>
            <div>
              {v.name} <span style={{ color: "#888" }}>– {v.desc}</span>
            </div>
            <div style={{ fontFamily: "monospace" }}>{v.id}</div>
          </ViewerItem>
        ))}
        <button>+ 열람자 추가</button>
      </Section>

      <Section>
        <Label>고급 설정</Label>
        <Checkbox>
          <input type="checkbox" checked={blockchain} onChange={e => setBlockchain(e.target.checked)} />
          블록체인 등록 활성화
        </Checkbox>
        <Checkbox>
          <input type="checkbox" checked={publicReq} onChange={e => setPublicReq(e.target.checked)} />
          공증 신청
        </Checkbox>
      </Section>

      <ButtonWrap>
        <Button className="save">임시 저장</Button>
        <Button className="submit">작성 완료</Button>
      </ButtonWrap>
    </Container>
  );
};

export default WillWritePage;
