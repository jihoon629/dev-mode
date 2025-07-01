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

      // JWT를 HTTP-only 쿠키로 설정
      res.cookie('token', authServiceResult.token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        maxAge: 3600 * 1000,
        path: '/'
      });

      const responseDto = new LoginSuccessResponseDto(
        authServiceResult.message || '로그인 성공',
        null, // 토큰은 쿠키로 전송되므로 응답 본문에서는 제거
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

      const isProduction = process.env.NODE_ENV === 'production';
      const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
      res.cookie('token', token, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'None' : 'Lax',
        maxAge: 3600 * 1000,
        path: '/'
      });

      res.redirect(`${FRONTEND_URL}/auth/social-callback`); // 토큰 없이 리다이렉트
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();