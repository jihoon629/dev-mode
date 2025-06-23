// application/rest/routes/authRoutes.js
const express = require('express');
const AuthController = require('../controller/authController'); // 로컬 인증 컨트롤러
const passport = require('../config/passportConfig'); // Passport 설정 가져오기 (Google 전략 포함)
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config'); // JWT 설정 가져오기

const router = express.Router();

// --- 로컬 인증 라우트 ---

// POST /api/auth/register - 회원가입
router.post('/register', AuthController.register);

// POST /api/auth/login - 로그인
router.post('/login', AuthController.login);


// --- Google OAuth 라우트 ---

// 1. 사용자를 Google 인증 페이지로 리디렉션
// 프론트엔드에서 'Login with Google' 버튼 클릭 시 이 경로로 GET 요청
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// 2. Google 인증 후 콜백 처리
// Google이 사용자를 이 경로로 다시 리디렉션 (GCP에 등록된 URI와 일치해야 함)
router.get('/google/callback',
  passport.authenticate('google', {
    // failureRedirect: 'http://localhost:3000/login?error=google_auth_failed', // 프론트엔드 로그인 실패 페이지로 리디렉션
    failureMessage: true, // 실패 시 메시지를 세션에 저장 (세션 사용 안하면 큰 의미 없을 수 있음)
    session: false // 세션 사용 안 함
  }),
  (req, res) => {
    // Passport 인증 실패 시 (예: 사용자가 동의 안 함, 계정 문제 등)
    // passport.authenticate의 미들웨어가 에러를 발생시키거나 failureRedirect로 보냄
    // 만약 여기까지 왔는데 req.user가 없다면 예상치 못한 상황
    if (!req.user) {
      console.error('Google OAuth 콜백: req.user가 없습니다. 인증 실패로 간주합니다.');
      // 프론트엔드의 특정 실패 페이지로 리디렉션하거나 오류 메시지 전달
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=GoogleAuthenticationFailed`);
    }

    // Google 인증 성공 시, Passport가 req.user에 사용자 정보를 채워줍니다.
    // (passportConfig.js의 done(null, user)에서 전달된 user 객체)
    console.log('Google OAuth 콜백 성공, req.user:', req.user);

    // 우리 애플리케이션의 JWT 생성
    const payload = {
      id: req.user.id, // DB에 저장된 우리 시스템의 사용자 ID
      username: req.user.username
      // isGoogleUser: !!req.user.google_id // 필요하다면 JWT 페이로드에 포함
    };
    const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

    // 클라이언트(React 앱)의 특정 콜백 처리 페이지로 토큰과 함께 리디렉션
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrl = `${frontendUrl}/auth/social-callback?token=${token}`;

    console.log(`Google OAuth 성공, 토큰 발급. 리디렉션 URL: ${callbackUrl}`);
    res.redirect(callbackUrl);

    /* // 또는 JSON 응답으로 토큰 전달 (프론트엔드에서 다르게 처리해야 함)
    res.status(200).json({
      message: 'Google 로그인 성공',
      token,
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        isGoogleUser: !!req.user.google_id
      }
    });
    */
  }
);

module.exports = router;