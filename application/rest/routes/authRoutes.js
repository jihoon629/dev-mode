// application/rest/routes/authRoutes.js
const express = require('express');
const passport = require('passport');
const authControllerInstance = require('../controller/authController'); // 컨트롤러 인스턴스 가져오기

const router = express.Router();

// 로컬 회원가입 및 로그인 라우트
// AuthController의 인스턴스 메소드 호출
router.post('/register', authControllerInstance.register);
router.post('/login', authControllerInstance.login);

// Google OAuth 시작 라우트
router.get('/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false
  })
);

// Google OAuth 콜백 라우트
router.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_authentication_failed`,
    session: false
  }),
  authControllerInstance.handleGoogleCallback // 인스턴스 메소드 호출
);

// 현재 로그인된 사용자 정보 가져오기
router.get('/me', passport.authenticate('jwt', { session: false }), authControllerInstance.getMe);

module.exports = router;