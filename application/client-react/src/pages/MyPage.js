import React, { useState, useEffect } from 'react'; // useState, useEffect import
import willService from '../services/willService'; // willService import (경로 확인)
import './MyPagecss/mypage.css';

const MyPage = () => {
  const [userRealName, setUserRealName] = useState('');
  const [username, setUsername] = useState('');
  const [isLoadingProfile, setIsLoadingProfile] = useState(true); // 프로필 정보 로딩 상태
  const [profileError, setProfileError] = useState('');

  useEffect(() => {
    const storedUsername = sessionStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername); // 세션의 username 상태에 저장
      setIsLoadingProfile(true); // 로딩 시작
      willService.queryByName(storedUsername)
        .then(response => {
          setUserRealName(response.data.realName || storedUsername); // 실명 또는 username
          setIsLoadingProfile(false);
        })
        .catch(err => {
          console.error("실명 조회 실패:", err);
          setProfileError('실명 정보를 불러오는 데 실패했습니다.');
          setUserRealName(storedUsername); // 에러 시 username 표시
          setIsLoadingProfile(false);
        });
    } else {
      setProfileError('로그인 정보가 없습니다.');
      setIsLoadingProfile(false);
    }
  }, []); // 컴포넌트 마운트 시 한 번만 실행


  // 로그아웃 함수 (AppLayout.js의 로그아웃과 유사하게 필요시 구현)
  // const handleLogout = () => {
  //   sessionStorage.removeItem('username');
  //   sessionStorage.removeItem('userId');
  //   // navigate('/'); // 예시: 홈으로 이동
  //   window.location.reload(); // 페이지 새로고침하여 AppLayout 등에서 상태 반영
  // };

  return (
    <div className="mypage-container">
      {/* 프로필 상단 */}
      <div className="mypage-profile">
        <div className="profile-info">
          <img src="/images/kim.PNG" alt="프로필 사진" className="profile-image" />
          <div className="profile-text">
            {isLoadingProfile ? (
              <strong className="profile-name">로딩 중...</strong>
            ) : profileError ? (
              <strong className="profile-name" style={{ color: 'red' }}>{username || '오류'}</strong>
            ) : (
              <strong className="profile-name">{userRealName}</strong>
            )}
            {username && <p className="profile-username-display">({username})</p>}
          </div>
        </div>
        <button className="edit-profile-button">프로필 수정</button>
      </div>

      {/* 유언장 통계 */}
      <div className="mypage-stats">
        {[
          { label: '작성 중인 유언장', value: 2 },
          { label: '공증 진행 중', value: 1 },
          { label: '공증 완료', value: 3 },
          { label: '지정 열람자', value: 5 },
        ].map((item, index) => (
          <div className="stat-card" key={index}>
            <div className="stat-value">{item.value}</div>
            <div className="stat-label">{item.label}</div>
          </div>
        ))}
      </div>

      {/* 빠른 작업 */}
      <div className="mypage-actions">
        <div className="action-button">
          <img src="/images/E1.PNG" alt="새 유언장 작성" />
          <span>새 유언장 작성</span>
        </div>
        <div className="action-button">
          <img src="/images/E2.PNG" alt="열람자 관리" />
          <span>열람자 관리</span>
        </div>
        <div className="action-button">
          <img src="/images/E3.PNG" alt="보안 설정" />
          <span>보안 설정</span>
        </div>
      </div>

      {/* 활동 내역 + 설정 */}
      <div className="mypage-columns">
        {/* 최근 활동 */}
        <div className="mypage-recent">
          <h4>최근 활동</h4>
          <ul>
            {[
              { text: '주 유언장 내용 수정', date: '2023.11.15' },
              { text: '새로운 열람자 추가: 김미란', date: '2023.11.13' },
              { text: '유언장 공증 완료', date: '2023.11.10' },
              { text: '2단계 인증 활성화', date: '2023.11.08' },
            ].map((item, index) => (
              <li key={index}>
                <span>
                  <img src="/images/E7.PNG" alt="시계 아이콘" className="icon" />
                  {item.text}
                </span>
                <span className="date">{item.date}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* 사이드 설정 */}
        <div className="mypage-side">
          {/* 보안 설정 */}

        <div className="security-settings">
          <h4>보안 설정</h4>
          <ul className="settings-list">
            <li>
              <div className="settings-item">
                <img src="/images/E4.PNG" alt="2단계 인증" className="icon" />
                <span>2단계 인증</span>
                <img src="/images/E9.PNG" alt="화살표" className="arrow" />
              </div>
            </li>
            <li>
              <div className="settings-item">
                <img src="/images/E5.PNG" alt="알림 설정" className="icon" />
                <span>알림 설정</span>
                <img src="/images/E9.PNG" alt="화살표" className="arrow" />
              </div>
            </li>
            <li>
              <div className="settings-item">
                <img src="/images/E6.PNG" alt="계정 설정" className="icon" />
                <span>계정 설정</span>
                <img src="/images/E9.PNG" alt="화살표" className="arrow" />
              </div>
            </li>
          </ul>
        </div>


          {/* 연동 서비스 */}
          <div className="linked-services">
            <h4>연동 서비스</h4>
            <p>
              공증 서비스 <span className="active">연동됨</span>
            </p>
            <p>
              블록체인 지갑 <span className="active">연동됨</span>
            </p>
          </div>

          {/* 로그아웃 버튼 */}
          {/* <button className="logout-button" onClick={handleLogout}> */}
          <button className="logout-button">
            <img src="/images/E8.PNG" alt="로그아웃 아이콘" className="icon" />
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;