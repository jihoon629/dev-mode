// ... (import 구문 등은 동일)
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import willService from '../services/willService';

export default function WillDetails() {
  const [willData, setWillData] = useState(null); 
  const [displayData, setDisplayData] = useState(null); 
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const { willId } = useParams(); 

  useEffect(() => {
    if (!willId) {
      setErrorMsg("유언장 ID가 제공되지 않았습니다.");
      return;
    }

    const fetchDetailsAndRealName = async () => {
      setLoading(true);
      setErrorMsg('');
      setWillData(null); 
      setDisplayData(null); 

      const loggedInUsername = sessionStorage.getItem('username'); // 현재 로그인한 사용자

      if (!loggedInUsername) {
        setErrorMsg("로그인이 필요합니다. 사용자 정보를 찾을 수 없습니다.");
        setLoading(false);
        return;
      }

      try {
        const rawData = await willService.getWillDetails(willId, loggedInUsername); 
        setWillData(rawData); 

        let currentUserRealName = loggedInUsername; 
        try {
          const nameRes = await willService.queryByName(loggedInUsername); 
          currentUserRealName = nameRes.data.realName || loggedInUsername; 
        } catch (nameErr) {
          console.error(`현재 사용자 실명 조회 실패 (username: ${loggedInUsername}):`, nameErr);
        }
        
        // 화면에 표시할 데이터 구성
        setDisplayData({
          title: rawData.title,
          originalContent: rawData.originalContent, 
          creationTimestamp: new Date(rawData.creationTimestamp * 1000).toLocaleString(),
          testatorRealName: currentUserRealName, // 현재 로그인 사용자의 실명
          willID_display: rawData.willID, 
          // testatorID_from_will 필드 제거
        });

      } catch (err) {
        let message = '유언장 조회 실패';
        if (err.data && err.data.message) { 
          message += `: ${err.data.message}`;
        } else if (err.data && err.data.error) {
          message += `: ${err.data.error}`;
        } else if (err.message) {
          message += `: ${err.message}`;
        }
        setErrorMsg(message);
        console.error("WillDetails fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetailsAndRealName();
  }, [willId]); 

  if (!willId && !loading && !errorMsg) return <p>유언장 ID가 선택되지 않았습니다.</p>;

  return (
    <div className="will-details-container form-group mt-4" style={styles.container}>
      <h3 style={styles.header}>유언장 상세 보기</h3>
      {loading && <p>조회 중...</p>}
      {errorMsg && <p className="text-danger" style={styles.errorText}>{errorMsg}</p>}
      
      {displayData && (
        <div style={styles.detailsBox}>
          <div style={styles.detailItem}>
            <strong style={styles.label}>블록체인 Will ID:</strong>
            <p style={styles.value}>{displayData.willID_display || 'N/A'}</p>
          </div>
          <div style={styles.detailItem}>
            <strong style={styles.label}>제목:</strong>
            <p style={styles.value}>{displayData.title || '제목 없음'}</p>
          </div>
          <div style={styles.detailItem}>
            <strong style={styles.label}>유언자:</strong> 
            <p style={styles.value}>{displayData.testatorRealName}</p>
          </div>
          {/* "유언장에 기록된 작성자 ID" 표시 부분 제거 */}
          <div style={styles.detailItem}>
            <strong style={styles.label}>작성일시:</strong>
            <p style={styles.value}>{displayData.creationTimestamp}</p>
          </div>
          <div style={styles.detailItem}>
            <strong style={styles.label}>유언 내용:</strong>
            <pre style={{...styles.value, ...styles.contentBox}}>{displayData.originalContent || '내용 없음'}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ... (styles 객체는 이전과 동일하게 유지)
const styles = {
  container: {
    maxWidth: '700px',
    margin: '20px auto',
    padding: '20px',
    border: '1px solid #e0e0e0',
    borderRadius: '8px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.05)',
    fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif'
  },
  header: {
    textAlign: 'center',
    color: '#333',
    marginBottom: '25px',
    borderBottom: '2px solid #007bff',
    paddingBottom: '10px'
  },
  detailsBox: {
    padding: '15px',
    backgroundColor: '#fff',
    borderRadius: '5px',
  },
  detailItem: {
    marginBottom: '18px',
    paddingBottom: '10px',
    borderBottom: '1px dashed #eee',
  },
  label: {
    display: 'block',
    color: '#555',
    fontWeight: 'bold',
    marginBottom: '5px',
    fontSize: '0.95em',
  },
  value: {
    color: '#222',
    margin: '0',
    fontSize: '1em',
    lineHeight: '1.6',
    whiteSpace: 'pre-wrap', 
    wordBreak: 'break-word', 
  },
  contentBox: {
    backgroundColor: '#f9f9f9',
    padding: '15px',
    borderRadius: '4px',
    border: '1px solid #eee',
    minHeight: '100px',
  },
  errorText: {
    color: '#dc3545',
    textAlign: 'center',
  }
};