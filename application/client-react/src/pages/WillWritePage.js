// src/pages/WillWritePage.js
import React, { useState } from "react";
import styled from "styled-components";
import { FaUpload } from "react-icons/fa";

const Container = styled.div`
  max-width: 960px;
  margin: 40px auto;
  padding: 24px;
`;

const Title = styled.h2`
  text-align: center;
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 16px;
  margin-top: 0;
`;

const Subtitle = styled.div`
  text-align: center;
  font-size: 1rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 10px;
  margin-top: 0;
  letter-spacing: -0.01em;
`;

const StepProgress = styled.div`
  position: relative;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 48px;
  padding: 0 12px;

  &::before {
    content: "";
    position: absolute;
    top: 18px;
    left: 12px;
    right: 12px;
    height: 4px;
    background: #e5e7eb;
    z-index: 0;
    border-radius: 2px;
  }

  &::after {
    content: "";
    position: absolute;
    top: 18px;
    left: 12px;
    width: calc(((100% - 24px) / 4) * var(--progress));
    height: 4px;
    background: #6366f1;
    z-index: 1;
    border-radius: 2px;
  }

  div {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    flex: 1;
    cursor: default;

    .circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background-color: #e5e7eb;
      color: #666;
      font-weight: 700;
      line-height: 36px;
      text-align: center;
      margin-bottom: 8px;
      user-select: none;
    }

    &.active .circle {
      background-color: #6366f1;
      color: white;
    }

    span {
      font-size: 14px;
      color: #666;
      user-select: none;
    }

    &.active span {
      color: #111827;
      font-weight: 700;
    }
  }
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
  margin-bottom: 24px;
`;

const InlineInputs = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
`;

const Input = styled.input`
  flex: 1;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 14px;
`;

const FullWidthInput = styled(Input)`
  width: 100%;
`;

const TextArea = styled.textarea`
  width: 100%;
  height: 200px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  resize: none;
  font-size: 14px;
`;

const UploadButton = styled.button`
  margin-top: 12px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #6366f1;
  background: transparent;
  color: #6366f1;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: #6366f1;
    color: white;
  }
`;

const UploadInput = styled.input`
  display: none;
`;

const UploadBoxLabel = styled.label`
  border: 1px dashed #ccc;
  padding: 32px;
  text-align: center;
  color: #777;
  border-radius: 8px;
  cursor: pointer;
  margin-top: 16px;
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  svg {
    font-size: 20px;
    margin-bottom: 8px;
  }
`;

const FileNameList = styled.ul`
  margin-top: 12px;
  list-style: none;
  padding-left: 0;
  font-size: 14px;
  color: #444;
`;

const ViewerItem = styled.div`
  background: #f9fafb;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 12px;
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #111827;
`;

const AddViewerButton = styled.button`
  margin-top: 12px;
  padding: 10px 16px;
  font-size: 14px;
  cursor: pointer;
  border-radius: 8px;
  border: 1px solid #6366f1;
  background: transparent;
  color: #6366f1;
  transition: background-color 0.2s, color 0.2s;

  &:hover {
    background: #6366f1;
    color: white;
  }
`;

const CheckboxLabel = styled.label`
  display: flex;
  align-items: center;
  margin-top: 12px;
  font-size: 14px;
  color: #111827;

  input {
    margin-right: 8px;
  }
`;

const ButtonWrap = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 32px;
  gap: 12px;
`;

const Button = styled.button`
  padding: 12px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;

  &.save {
    background: transparent;
    border: 1px solid #6366f1;
    color: #6366f1;
  }

  &.save:hover {
    background: #6366f1;
    color: white;
  }

  &.submit {
    background: #6366f1;
    color: white;
    border: none;
  }

  &.submit:hover {
    background: #4f46e5;
  }
`;

const WillWritePage = () => {
  const [viewers, setViewers] = useState([
    { name: "홍길동", desc: "배우자 & 집행인", id: "0xAbC...1234" },
  ]);
  const [blockchain, setBlockchain] = useState(false);
  const [publicReq, setPublicReq] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);
  };

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    if (value.trim() !== "" && currentStep < 2) {
      setCurrentStep(2);
    }
  };

  const handleAddViewer = () => {
    const newViewer = { name: "새 열람자", desc: "관계", id: "0xNew...5678" };
    setViewers((prev) => [...prev, newViewer]);
    if (currentStep < 3) {
      setCurrentStep(3);
    }
  };

  return (
    <Container>
      <Title>디지털 유언장 작성</Title>
      <Subtitle>작성 진행 상태</Subtitle>
      <StepProgress style={{ "--progress": currentStep - 1 }}>
        <div className={currentStep === 1 ? "active" : ""}>
          <div className="circle">1</div>
          <span>기본 정보</span>
        </div>
        <div className={currentStep === 2 ? "active" : ""}>
          <div className="circle">2</div>
          <span>내용 작성</span>
        </div>
        <div className={currentStep === 3 ? "active" : ""}>
          <div className="circle">3</div>
          <span>열람자 지정</span>
        </div>
        <div className={currentStep === 4 ? "active" : ""}>
          <div className="circle">4</div>
          <span>최종 확인</span>
        </div>
      </StepProgress>

      <Section>
        <Label>기본 정보</Label>
        <InlineInputs>
          <Input placeholder="유언장 제목" />
          <Input placeholder="작성자 이름" />
        </InlineInputs>
        <FullWidthInput placeholder="주소" />
      </Section>

      <Section>
        <Label>유언장 내용</Label>
        <TextArea
          placeholder="유언장 내용을 작성해주세요..."
          value={content}
          onChange={handleContentChange}
        />
      </Section>

      <Section>
        <Label>자필 문서 스캔 (선택사항)</Label>
        <UploadBoxLabel htmlFor="handwritten-upload">
          <FaUpload />
          <div>
            이곳에 파일을 끌어다 놓거나 클릭하여 업로드하세요
            <br />
            지원 형식: JPG, PNG, PDF
          </div>
          <UploadInput
            id="handwritten-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.pdf"
            multiple
            onChange={handleFileChange}
          />
        </UploadBoxLabel>
        <UploadButton htmlFor="handwritten-upload" as="label">
          📎 문서 업로드하기
        </UploadButton>
        {uploadedFiles.length > 0 && (
          <FileNameList>
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </FileNameList>
        )}
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
        <AddViewerButton onClick={handleAddViewer}>
          + 열람자 추가
        </AddViewerButton>
      </Section>

      <Section>
        <Label>고급 설정</Label>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={blockchain}
            onChange={(e) => setBlockchain(e.target.checked)}
          />
          블록체인 등록 활성화
        </CheckboxLabel>
        <CheckboxLabel>
          <input
            type="checkbox"
            checked={publicReq}
            onChange={(e) => setPublicReq(e.target.checked)}
          />
          공증 신청
        </CheckboxLabel>
      </Section>

      <ButtonWrap>
        <Button className="save">임시 저장</Button>
        <Button className="submit">작성 완료</Button>
      </ButtonWrap>
    </Container>
  );
};

export default WillWritePage;
