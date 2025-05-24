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
    if (!willId) return;

    const fetchDetailsAndRealName = async () => {
      setLoading(true);
      setErrorMsg('');
      setWillData(null);
      setDisplayData(null);

      try {
        // 1. 유언장 상세 정보 가져오기
        const res = await willService.getWillDetails(willId);
        const rawData = res.data;
        setWillData(rawData); // 원본 데이터 저장

        // 2. 세션 스토리지에서 현재 로그인한 사용자의 username 가져오기
        const loggedInUsername = sessionStorage.getItem('username');
        let realName = '알 수 없음'; // 기본값

        if (loggedInUsername) {
          try {
            // 3. 세션의 username으로 실명 조회
            const nameRes = await willService.queryByName(loggedInUsername);
            realName = nameRes.data.realName || loggedInUsername; // 실명 없으면 세션의 username 표시
          } catch (nameErr) {
            console.error(`실명 조회 실패 (username: ${loggedInUsername}):`, nameErr);
            realName = loggedInUsername; // 실명 조회 실패 시 세션의 username을 그대로 사용
          }
        } else {
          // 세션에 username이 없는 경우 (예: 로그아웃 상태로 상세 페이지 접근 시도 등)
          // rawData.testatorID (해시된 값)를 표시하거나, '알 수 없음' 등으로 처리
          // 여기서는 일단 '알 수 없음'으로 처리하고, 필요시 rawData.testatorID를 사용할 수 있습니다.
          console.warn('세션에서 사용자 이름을 찾을 수 없어 유언자 실명을 조회할 수 없습니다.');
        }
        
        // 4. 화면에 표시할 데이터 구성
        setDisplayData({
          title: rawData.title,
          originalContent: rawData.originalContent,
          creationTimestamp: new Date(rawData.creationTimestamp * 1000).toLocaleString(),
          testatorRealName: realName, // 세션 username으로 조회한 실명
        });

      } catch (err) {
        setErrorMsg('유언장 조회 실패: ' + (err.response?.data?.error || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchDetailsAndRealName();
  }, [willId]); // willId가 변경될 때마다 실행

  if (!willId) return <p>유언장 ID가 선택되지 않았습니다.</p>;

  return (
    <div className="will-details-container form-group mt-4" style={styles.container}>
      <h3 style={styles.header}>유언장 상세 보기</h3>
      {loading && <p>조회 중...</p>}
      {errorMsg && <p className="text-danger" style={styles.errorText}>{errorMsg}</p>}
      
      {displayData && (
        <div style={styles.detailsBox}>
          <div style={styles.detailItem}>
            <strong style={styles.label}>제목:</strong>
            <p style={styles.value}>{displayData.title || '제목 없음'}</p>
          </div>
          <div style={styles.detailItem}>
            <strong style={styles.label}>유언자 (실명):</strong>
            <p style={styles.value}>{displayData.testatorRealName}</p>
          </div>
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
      
      {/* 원본 데이터 보기 (디버깅용) */}
      {/* {willData && (
        <>
          <h4 style={{marginTop: '30px'}}>원본 데이터 (Raw Data)</h4>
          <pre className="response-area" style={{ backgroundColor: '#f8f9fa', padding: '10px', border: '1px solid #ccc', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
            {JSON.stringify(willData, null, 2)}
          </pre>
        </>
      )} */}
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