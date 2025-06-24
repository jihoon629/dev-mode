// application/rest/routes/authRoutes.js
const express = require('express');
const passport = require('passport'); // Passport는 여전히 라우트 레벨에서 인증 미들웨어로 사용
const AuthController = require('../controller/authController'); // 컨트롤러 가져오기

const router = express.Router();

// 로컬 회원가입 및 로그인 라우트
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Google OAuth 시작 라우트
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'], // 요청할 사용자 정보 범위
    session: false // JWT를 사용하므로 세션 비활성화
  })
);

// Google OAuth 콜백 라우트
// 1. passport.authenticate('google', ...) 미들웨어가 Google로부터의 응답을 처리하고 사용자 인증.
//    - 성공 시: req.user 객체를 채우고 다음 핸들러(AuthController.handleGoogleCallback) 호출.
//    - 실패 시: failureRedirect로 지정된 경로로 리디렉션.
// 2. AuthController.handleGoogleCallback이 req.user를 기반으로 JWT 생성 및 프론트엔드로 리디렉션.
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_authentication_failed`, // 인증 실패 시 리디렉션 경로
    session: false // JWT를 사용하므로 세션 비활성화
  }),
  AuthController.handleGoogleCallback // 인증 성공 후 실행될 컨트롤러 메소드
);

module.exports = router;