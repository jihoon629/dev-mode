// ... (기존 import 구문들)
import React, { useState, useEffect } from "react"; // useEffect 추가
import { FaUpload } from "react-icons/fa";
import './WillWritePageCss/WillWritePage.css';
import { useNavigate } from 'react-router-dom';
import willService from '../services/willService';


const WillWritePage = () => {
  const navigate = useNavigate();
  const [viewers, setViewers] = useState([]);
  const [blockchain, setBlockchain] = useState(false);
  const [publicReq, setPublicReq] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [content, setContent] = useState("");
  const [currentStep, setCurrentStep] = useState(1);
  const [willTitle, setWillTitle] = useState("");
  
  // 화면 표시용 실명 상태
  const [testatorDisplayRealName, setTestatorDisplayRealName] = useState(""); 
  // 서버 전송용 username 상태 (세션에서 가져옴)
  const [sessionUsername, setSessionUsername] = useState(""); 
  const [isLoadingRealName, setIsLoadingRealName] = useState(true); // 실명 로딩 상태

  const [apiStatus, setApiStatus] = useState({
    loading: false,
    error: null,
    data: null,
  });
  const [ocrInProgress, setOcrInProgress] = useState(false);
  const [ocrError, setOcrError] = useState(null);

  useEffect(() => {
    // 컴포넌트 마운트 시 세션에서 username 가져와서 실명 조회
    const usernameFromSession = sessionStorage.getItem('username');
    if (usernameFromSession) {
      setSessionUsername(usernameFromSession); // 서버 전송용 username 저장
      setIsLoadingRealName(true);
      willService.queryByName(usernameFromSession)
        .then(response => {
          setTestatorDisplayRealName(response.data.realName || usernameFromSession); // 화면 표시용 실명 설정
          setIsLoadingRealName(false);
        })
        .catch(error => {
          console.error("실명 조회 실패:", error);
          setTestatorDisplayRealName(usernameFromSession); // 실패 시 username이라도 표시
          setIsLoadingRealName(false);
        });
    } else {
      // 세션에 username이 없는 경우 (예: 로그인하지 않은 상태)
      setTestatorDisplayRealName("로그인 필요"); // 또는 다른 기본값
      setIsLoadingRealName(false);
      // 필요하다면 로그인 페이지로 리디렉션 등의 처리 추가
    }
  }, []); // 빈 배열 의존성으로 마운트 시 1회 실행

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    setUploadedFiles(files);

    if (files.length > 0) {
      const fileToProcess = files[0];
      setOcrInProgress(true);
      setOcrError(null);
      try {
        const response = await willService.extractTextFromImage(fileToProcess);
        const result = response.data;
        if (result.text !== undefined) {
          setContent(prevContent => prevContent ? `${prevContent}\n${result.text}` : result.text);
          if (result.text.trim() !== "" && currentStep < 2 && willTitle.trim() !== "" && testatorDisplayRealName.trim() !== "" && testatorDisplayRealName !== "로그인 필요") {
            setCurrentStep(2);
          }
        } else {
          throw new Error("OCR API did not return text in the expected format.");
        }
      } catch (error) {
        console.error("OCR 실패:", error);
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
    if (value.trim() !== "" && currentStep < 2 && willTitle.trim() !== "" && testatorDisplayRealName.trim() !== "" && testatorDisplayRealName !== "로그인 필요") {
      setCurrentStep(2);
    }
  };

  const handleAddViewer = () => {
    const newViewer = { name: "새 열람자", desc: "관계", id: "0xNew...5678" };
    setViewers((prev) => {
        const validPrevViewers = prev.filter(v => v.name && v.id);
        return [...validPrevViewers, newViewer];
    });
    if (currentStep < 3 && content.trim() !== "" && willTitle.trim() !== "" && testatorDisplayRealName.trim() !== "" && testatorDisplayRealName !== "로그인 필요") {
      setCurrentStep(3);
    }
  };

  const handleTitleChange = (e) => {
    const value = e.target.value;
    setWillTitle(value);
    // testatorName 대신 testatorDisplayRealName과 sessionUsername 유효성 검사
    if (value.trim() !== "" && content.trim() !== "" && sessionUsername && currentStep < 2) {
      setCurrentStep(2);
    } else if (value.trim() !== "" && sessionUsername && currentStep === 1) {
      setCurrentStep(1);
    }
  };

  // testatorName 입력 필드는 이제 화면 표시용 실명을 보여주고, 직접 수정은 불가하게 하거나, 
  // 수정해도 서버 전송값에는 영향 없도록 처리
  // const handleTestatorNameChange = (e) => { ... }; // 이 함수는 이제 직접 사용하지 않거나, 다른 용도로 변경

  const handleSubmit = async () => {
    // testatorName 대신 sessionUsername으로 유효성 검사 및 서버 전송
    if (!willTitle || !content || !sessionUsername) {
      setApiStatus({ loading: false, error: "유언장 제목, 내용, 작성자 정보(로그인 상태)는 필수 항목입니다.", data: null });
      return;
    }
    const beneficiariesToSend = viewers.length > 0 && viewers[0].name ? viewers.map(v => v.name) : [];
    setApiStatus({ loading: true, error: null, data: null });

    const willData = {
      title: willTitle,
      originalContent: content,
      beneficiaries: beneficiariesToSend,
      testatorId: sessionUsername, // 서버에는 세션에서 가져온 username을 전송
    };

    try {
      // willService.registerWill을 사용하도록 수정 (기존 fetch 대신)
      const response = await willService.registerWill(willData); 
      
      // axios 응답은 response.data에 실제 데이터가 들어있습니다.
      // 성공/실패 처리는 willService 내부 또는 여기서 HTTP status code 기준으로 할 수 있습니다.
      // 여기서는 willService.registerWill이 성공 시 데이터를, 실패 시 에러를 throw한다고 가정합니다.
      setApiStatus({ loading: false, error: null, data: response.data });
      console.log("등록 성공:", response.data);
      navigate('/success');

    } catch (error) {
      // axios 오류인 경우 error.response.data.error 등으로 서버에서 보낸 오류 메시지 접근 가능
      const errorMessage = error.response?.data?.error || error.message || "유언장 등록 중 알 수 없는 오류가 발생했습니다.";
      setApiStatus({ loading: false, error: errorMessage, data: null });
      console.error("등록 실패:", error);
    }
  };

  return (
    <div className="WillWritePage_Container">
      <h2 className="WillWritePage_Title">디지털 유언장 작성</h2>
      <div className="WillWritePage_Subtitle">작성 진행 상태</div>
      {/* ... (StepProgress 부분은 동일) ... */}
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
          {/* 작성자 이름 필드는 실명을 보여주고, readonly로 설정하거나 값 변경 핸들러를 제거 */}
          <input 
            className="WillWritePage_Input" 
            placeholder="작성자 이름 (자동 입력)" 
            value={isLoadingRealName ? "실명 로딩 중..." : testatorDisplayRealName} 
            readOnly // 사용자가 직접 수정하지 못하도록
          />
        </div>
      </div>

      {/* ... (나머지 유언장 내용, 파일 업로드, 열람자 지정, 고급 설정, 버튼 부분은 이전과 유사하게 유지) ... */}
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
            multiple
            onChange={handleFileChange}
            className="WillWritePage_UploadInput"
          />
        </label>
        <label htmlFor="handwritten-upload" className="WillWritePage_UploadButton">
          📎 문서 업로드하기
        </label>
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
        성공! 서버 응답: {JSON.stringify(apiStatus.data)}
        </div>}
    </div>
  );
};

export default WillWritePage;