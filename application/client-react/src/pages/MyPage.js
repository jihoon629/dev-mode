import React from 'react';
import './MyPagecss/mypage.css';

const MyPage = () => {
  return (
    <div className="mypage-container">
      {/* 프로필 상단 */}
      <div className="mypage-profile">
        <div className="profile-info">
          <img src="/images/kim.PNG" alt="프로필" className="profile-image" />
          <div className="profile-text">
            <strong className="profile-name">김용현</strong>
            <p className="profile-email">kim.yh@example.com</p>
            <span className="profile-date">가입일: 2023년 8월</span>
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
          <img src="/images/write.png" alt="유언장" />
          <span>새 유언장 작성</span>
        </div>
        <div className="action-button">
          <img src="/images/users.png" alt="열람자" />
          <span>열람자 관리</span>
        </div>
        <div className="action-button">
          <img src="/images/shield.png" alt="보안" />
          <span>보안 설정</span>
        </div>
      </div>

      {/* 활동 내역 + 설정 */}
      <div className="mypage-columns">
        <div className="mypage-recent">
          <h4>최근 활동</h4>
          <ul>
            <li>
              <span>🕓 주 유언장 내용 수정</span>
              <span className="date">2023.11.15</span>
            </li>
            <li>
              <span>🕓 새로운 열람자 추가: 김미란</span>
              <span className="date">2023.11.13</span>
            </li>
            <li>
              <span>🕓 유언장 공증 완료</span>
              <span className="date">2023.11.10</span>
            </li>
            <li>
              <span>🕓 2단계 인증 활성화</span>
              <span className="date">2023.11.08</span>
            </li>
          </ul>
        </div>

        <div className="mypage-side">
          <div className="security-settings">
            <h4>보안 설정</h4>
            <ul>
              <li>🔑 2단계 인증</li>
              <li>🔔 알림 설정</li>
              <li>⚙️ 계정 설정</li>
            </ul>
          </div>

          <div className="linked-services">
            <h4>연동 서비스</h4>
            <p>공증 서비스 <span className="active">연동됨</span></p>
            <p>블록체인 지갑 <span className="active">연동됨</span></p>
          </div>

          <button className="logout-button">로그아웃</button>
        </div>
      </div>
    </div>
  );
};

export default MyPage;
