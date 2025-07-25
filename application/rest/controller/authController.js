// application/rest/controller/authController.js
const authServiceInstance = require('../service/authService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
const { validateRegistration, validateLogin } = require('../utils/validation/authValidation');
const { handleValidationError } = require('../utils/errorHandler');
const { RegisterUserRequestDto, LoginUserRequestDto } = require('../dto/request/authRequstDto');
const { UserResponseDto, RegistrationSuccessResponseDto, LoginSuccessResponseDto } = require('../dto/response/authResponseDto');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

class AuthController {

  constructor() {
    this.authService = authServiceInstance;
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.handleGoogleCallback = this.handleGoogleCallback.bind(this);
    this.getMe = this.getMe.bind(this);
    this.logout = this.logout.bind(this); // logout 바인딩 추가
  }

  async logout(req, res, next) {
    try {
      // res.clearCookie('token', { path: '/' }); // 토큰 쿠키 삭제 (세션 스토리지 사용 시 불필요)
      res.status(200).json({ message: '로그아웃되었습니다.' });
    } catch (error) {
      next(error);
    }
  }

  async getMe(req, res, next) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Not authenticated' });
      }
      res.status(200).json({ id: req.user.id, username: req.user.username, email: req.user.email,role: req.user.role });
    } catch (error) {
      next(error);
    }
  }

  async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;
      validateRegistration(username, email, password, role);

      const registerDto = new RegisterUserRequestDto(username, email, password, role);
      const registeredUserData = await this.authService.register(
        registerDto.username,
        registerDto.email,
        registerDto.password,
        registerDto.role
      );

      const userResponse = new UserResponseDto(registeredUserData.id, registeredUserData.username, registeredUserData.email);
      const responseDto = new RegistrationSuccessResponseDto('회원가입이 성공적으로 완료되었습니다.', userResponse);

      res.status(201).json(responseDto);
    } catch (error) {
      handleValidationError(error, next);
    }
  }

  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      validateLogin(email, password);

      const loginDto = new LoginUserRequestDto(email, password);
      const authServiceResult = await this.authService.login(
        loginDto.email,
        loginDto.password
      );

      const userResponse = new UserResponseDto(
        authServiceResult.id,
        authServiceResult.username,
        authServiceResult.email,
        authServiceResult.role
      );
      const isProduction = process.env.NODE_ENV === 'production';

      const responseDto = new LoginSuccessResponseDto(
        authServiceResult.message || '로그인 성공',
        authServiceResult.token, // 토큰을 응답 본문에 포함
        userResponse
      );
      res.status(200).json(responseDto);
    } catch (error) {
      handleValidationError(error, next);
    }
  }

  async handleGoogleCallback(req, res, next) {
    try {
      if (!req.user) {
        return res.redirect(`${FRONTEND_URL}/login?error=GoogleAuthenticationFailedUpstream`);
      }

      const payload = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      };

      res.redirect(`${FRONTEND_URL}/auth/social-callback?token=${token}`); // 토큰을 쿼리 파라미터로 전달
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();