    // application/rest/config/jwtConfig.js
    module.exports = {
        secret: '155788848', // 실제 프로덕션에서는 환경 변수로 관리해야 합니다.
        expiresIn: '1h' // 토큰 만료 시간 (예: 1시간)
      };