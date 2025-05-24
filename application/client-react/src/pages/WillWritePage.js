// src/pages/WillWritePage.js
import React, { useState } from "react";
import { FaUpload } from "react-icons/fa";
import './WillWritePageCss/WillWritePage.css'; // CSS 파일 임포트
import { useNavigate } from 'react-router-dom'; // useNavigate 훅 임포트
import willService from '../services/willService'; // default export를 가져옴


const WillWritePage = () => {
  const navigate = useNavigate(); // useNavigate 훅 사용
  const [viewers, setViewers] = useState([
    // 초기 열람자 데이터가 비어있도록 수정 또는 필요시 기본값 설정
    // { name: "홍길동", desc: "배우자 & 집행인", id: "0xAbC...1234" },
  ]);
  const [blockchain, setBlockchain] = useState(false);
  const [publicReq, setPublicReq] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [willTitle, setWillTitle] = useState("");
  const [testatorName, setTestatorName] = useState("");
  const [apiStatus, setApiStatus] = useState({
    loading: false,
    error: null,
    data: null,
  });
  const [ocrInProgress, setOcrInProgress] = useState(false); // OCR 진행 상태 추가
  const [ocrError, setOcrError] = useState(null); // OCR 오류 상태 추가

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);

    if (files.length > 0) {
      const fileToProcess = files[0]; // 첫 번째 파일만 처리한다고 가정

      setOcrInProgress(true);
      setOcrError(null);

      try {
        // willService를 사용하여 OCR API 호출 - 함수 이름을 extractTextFromImage로 수정
        const response = await willService.extractTextFromImage(fileToProcess);

        // axios 응답은 response.data에 실제 데이터가 들어있습니다.
        const result = response.data;

        if (result.text !== undefined) { // text 속성이 있는지 확인 (빈 문자열일 수도 있음)
          setContent(prevContent => prevContent ? `${prevContent}\n${result.text}` : result.text);
          if (result.text.trim() !== "" && currentStep < 2 && willTitle.trim() !== "" && testatorName.trim() !== "") {
            setCurrentStep(2);
          }
        } else {
          // 응답은 성공(2xx)했지만, 예상한 text 필드가 없는 경우
          throw new Error("OCR API did not return text in the expected format.");
        }
      } catch (error) {
        console.error("OCR 실패:", error);
        // axios 오류인 경우 error.response.data.error 등으로 서버에서 보낸 오류 메시지 접근 가능
        const errorMessage = error.response?.data?.error || error.message || "OCR 처리 중 알 수 없는 오류가 발생했습니다.";
        setOcrError(errorMessage);
      } finally {
        setOcrInProgress(false);
      }
    }
  };


  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    if (value.trim() !== "" && currentStep < 2 && willTitle.trim() !== "" && testatorName.trim() !== "") {
      setCurrentStep(2);
    }
  };

  const handleAddViewer = () => {
    // viewers 배열에 빈 객체가 있는 경우, 첫번째 추가는 해당 객체를 업데이트 하거나,
    // 빈 객체 없이 시작하고 싶다면 초기 상태를 []로 변경하는 것을 고려해주세요.
    // 현재는 무조건 새 열람자를 추가합니다.
    const newViewer = { name: "새 열람자", desc: "관계", id: "0xNew...5678" };
    setViewers((prev) => {
        // 초기 상태가 [{}] 이고, 첫번째 viewer가 비어있다면 그걸 채우는 로직이 필요할 수 있습니다.
        // 여기서는 간단하게 항상 추가하는 로직으로 갑니다.
        // 만약 prev가 [{}] 이고, 그 객체가 비어있는 것을 의미한다면, 필터링이 필요합니다.
        const validPrevViewers = prev.filter(v => v.name && v.id); // 유효한 열람자만 필터링
        return [...validPrevViewers, newViewer];
    });
    if (currentStep < 3 && content.trim() !== "" && willTitle.trim() !== "" && testatorName.trim() !== "") {
      setCurrentStep(3);
    }
  };
  const handleTitleChange = (e) => {
    const value = e.target.value;
    setWillTitle(value);
    if (value.trim() !== "" && content.trim() !== "" && testatorName.trim() !== "" && currentStep < 2) {
      setCurrentStep(2);
    } else if (value.trim() !== "" && testatorName.trim() !== "" && currentStep === 1) { // 정확히 1단계일때 기본정보만으로 1단계 유지
      setCurrentStep(1);
    }
  };

  const handleTestatorNameChange = (e) => {
    const value = e.target.value;
    setTestatorName(value);
    if (value.trim() !== "" && content.trim() !== "" && willTitle.trim() !== "" && currentStep < 2) {
      setCurrentStep(2);
    } else if (value.trim() !== "" && willTitle.trim() !== "" && currentStep === 1) { // 정확히 1단계일때 기본정보만으로 1단계 유지
      setCurrentStep(1);
    }
  };


 
  const handleSubmit = async () => {
    if (!willTitle || !content || !testatorName) {
      setApiStatus({ loading: false, error: "유언장 제목, 내용, 작성자 이름은 필수 항목입니다.", data: null });
      return;
    }
    // 열람자 목록이 비어있을 경우 빈 배열로 처리 (서버에서 null을 허용하지 않을 수 있음)
    const beneficiariesToSend = viewers.length > 0 && viewers[0].name ? viewers.map(v => v.name) : [];


    setApiStatus({ loading: true, error: null, data: null });

    const willData = {
      title: willTitle,
      originalContent: content,
      beneficiaries: beneficiariesToSend, // 수정된 열람자 목록 사용
      testatorId: testatorName,
    };

    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(willData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP error! status: ${response.status}`);
      }

      setApiStatus({ loading: false, error: null, data: result });
      // 성공 시, 다음 단계로 이동 (currentStep 업데이트는 선택 사항)
      // setCurrentStep(4); // 최종 확인 단계로 UI를 업데이트 할 수도 있음
      console.log("등록 성공:", result);
      navigate('/success'); // 성공 페이지로 이동

    } catch (error) {
      setApiStatus({ loading: false, error: error.message, data: null });
      console.error("등록 실패:", error);
    }
  };


  return (
    <div className="WillWritePage_Container">
      <h2 className="WillWritePage_Title">디지털 유언장 작성</h2>
      <div className="WillWritePage_Subtitle">작성 진행 상태</div>
      <div className="WillWritePage_StepProgress" style={{ "--progress": currentStep - 1 }}>
        <div className={`WillWritePage_StepProgress_StepItem ${currentStep >= 1 ? "active" : ""}`}>
          <div className="WillWritePage_StepProgress_Circle">1</div>
          <span className="WillWritePage_StepProgress_StepName">기본 정보</span>
        </div>
        <div className={`WillWritePage_StepProgress_StepItem ${currentStep >= 2 ? "active" : ""}`}>
          <div className="WillWritePage_StepProgress_Circle">2</div>
          <span className="WillWritePage_StepProgress_StepName">내용 작성</span>
        </div>
        <div className={`WillWritePage_StepProgress_StepItem ${currentStep >= 3 ? "active" : ""}`}>
          <div className="WillWritePage_StepProgress_Circle">3</div>
          <span className="WillWritePage_StepProgress_StepName">열람자 지정</span>
        </div>
        <div className={`WillWritePage_StepProgress_StepItem ${currentStep >= 4 ? "active" : ""}`}>
          <div className="WillWritePage_StepProgress_Circle">4</div>
          <span className="WillWritePage_StepProgress_StepName">최종 확인</span>
        </div>
      </div>

      <div className="WillWritePage_Section">
        <div className="WillWritePage_Label">기본 정보</div>
        <div className="WillWritePage_InlineInputs">
          <input className="WillWritePage_Input" placeholder="유언장 제목" value={willTitle} onChange={handleTitleChange} />
          <input className="WillWritePage_Input" placeholder="작성자 이름" value={testatorName} onChange={handleTestatorNameChange} />
        </div>
      </div>

      <div className="WillWritePage_Section">
        <div className="WillWritePage_Label">유언장 내용</div>
        <textarea
          className="WillWritePage_TextArea"
          placeholder="유언장 내용을 작성해주세요..."
          value={content}
          onChange={handleContentChange}
        />
      </div>
      <div className="WillWritePage_Section">
        <div className="WillWritePage_Label">자필 문서 스캔 (선택사항)</div>
        <label htmlFor="handwritten-upload" className="WillWritePage_UploadBoxLabel">
          <FaUpload />
          <div>
            이곳에 파일을 끌어다 놓거나 클릭하여 업로드하세요
            <br />
            지원 형식: JPG, PNG, PDF
          </div>
          <input
            id="handwritten-upload"
            type="file"
            accept=".jpg,.jpeg,.png,.webp"
            multiple // 여러 파일 업로드 가능성은 있지만, OCR은 첫 파일만 처리합니다.
            onChange={handleFileChange}
            className="WillWritePage_UploadInput"
          />
        </label>
        <label htmlFor="handwritten-upload" className="WillWritePage_UploadButton">
          📎 문서 업로드하기
        </label>
        {/* OCR 진행 상태 및 오류 메시지 표시 */}
        {ocrInProgress && <div style={{ marginTop: '10px', textAlign: 'center' }}>OCR 처리 중...</div>}
        {ocrError && <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>OCR 오류: {ocrError}</div>}
        {uploadedFiles.length > 0 && (
          <ul className="WillWritePage_FileNameList">
            {uploadedFiles.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>
        )}
      </div>
      <div className="WillWritePage_Section">
        <div className="WillWritePage_Label">열람자 지정</div>
        {viewers.map((v, i) => (
          <div key={i} className="WillWritePage_ViewerItem">
            <div>
              {v.name} <span style={{ color: "#888" }}>– {v.desc}</span>
            </div>
            <div style={{ fontFamily: "monospace" }}>{v.id}</div>
          </div>
        ))}
        <button onClick={handleAddViewer} className="WillWritePage_AddViewerButton">
          + 열람자 추가
        </button>
      </div>

      <div className="WillWritePage_Section">
        <div className="WillWritePage_Label">고급 설정</div>
        <label className="WillWritePage_CheckboxLabel">
          <input
            type="checkbox"
            checked={blockchain}
            onChange={(e) => setBlockchain(e.target.checked)}
          />
          블록체인 등록 활성화
        </label>
        <label className="WillWritePage_CheckboxLabel">
          <input
            type="checkbox"
            checked={publicReq}
            onChange={(e) => setPublicReq(e.target.checked)}
          />
          공증 신청
        </label>
      </div>

      <div className="WillWritePage_ButtonWrap">
        <button className="WillWritePage_Button WillWritePage_Button--save">임시 저장</button>
        <button className="WillWritePage_Button WillWritePage_Button--submit" onClick={handleSubmit} disabled={apiStatus.loading}>
          {apiStatus.loading ? "처리 중..." : "작성 완료"}
        </button>
      </div>
      {apiStatus.error && <div style={{ color: 'red', marginTop: '10px', textAlign: 'center' }}>오류: {apiStatus.error}</div>}
      {apiStatus.data && <div style={{ color: 'green', marginTop: '10px', textAlign: 'center' }}>
        성공! 블록체인 Will ID: {apiStatus.data.blockchainWillId}, DB ID: {apiStatus.data.dbRecordId}
        </div>}
    </div>
  );
};

export default WillWritePage;