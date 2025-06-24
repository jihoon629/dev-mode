// application/rest/controller/authController.js
const AuthService = require('../service/authService');
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
const { validateRegistration, validateLogin } = require('../utils/validation/authValidation'); // 유효성 검사 함수 임포트

const { RegisterUserRequestDto, LoginUserRequestDto } = require('../dto/request/authRequstDto');
const {
  UserResponseDto,
  RegistrationSuccessResponseDto,
  LoginSuccessResponseDto
} = require('../dto/response/authResponseDto');

const AuthController = {
  async register(req, res, next) {
    try {
      const { username, email, password } = req.body;

      // 유효성 검사 호출
      validateRegistration(username, email, password);

      const registerDto = new RegisterUserRequestDto(username, email, password);

      const registeredUserData = await AuthService.register(
        registerDto.username,
        registerDto.email,
        registerDto.password
      );

      const userResponse = new UserResponseDto(registeredUserData.id, registeredUserData.username, registeredUserData.email);
      const responseDto = new RegistrationSuccessResponseDto('회원가입이 성공적으로 완료되었습니다.', userResponse);

      res.status(201).json(responseDto);
    } catch (error) {
      console.error('Error in AuthController.register:', error.message);
      if (!error.statusCode) {
        error.statusCode = 500;
      }
      next(error);
    }
  },

  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // 유효성 검사 호출
      validateLogin(email, password);
console.log("아니 시발: "+email);

      const loginDto = new LoginUserRequestDto(email, password);

      const loginResult = await AuthService.login(
        loginDto.email,
        loginDto.password
      );

      const userResponse = new UserResponseDto(loginResult.id, loginResult.username, loginResult.email);
      const responseDto = new LoginSuccessResponseDto(loginResult.message || '로그인 성공', loginResult.token, userResponse);

      res.status(200).json(responseDto);
    } catch (error) {
      console.error('Error in AuthController.login:', error.message);
      if (!error.statusCode) {
        error.statusCode = (error.message === 'User not found.' || error.message === 'Invalid credentials.') ? 401 : 500;
      }
      next(error);
    }
  },

  // ... (handleGoogleCallback 메소드는 유효성 검사 로직이 없었으므로 그대로) ...
  async handleGoogleCallback(req, res, next) { 
  try {
    if (!req.user) {
 
      console.error('Google OAuth Callback: req.user is not set. Authentication may have failed before reaching controller.');
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/login?error=GoogleAuthenticationFailedUpstream`);
    }

    console.log('Google OAuth Callback in Controller executed. req.user:', req.user);

    const payload = {
      id: req.user.id,
      username: req.user.username,
      email: req.user.email, 
    };

    const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const callbackUrlWithToken = `${frontendUrl}/auth/social-callback?token=${token}`; 

    console.log(`JWT issued for Google user. Redirecting to: ${callbackUrlWithToken}`);
    res.redirect(callbackUrlWithToken);

  } catch (error) {
    console.error('Error in AuthController.handleGoogleCallback:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const errorMessage = error.message ? encodeURIComponent(error.message) : 'UnknownError';
    res.redirect(`${frontendUrl}/login?error=GoogleCallbackProcessingError&message=${errorMessage}`);
  }
}
};

module.exports = AuthController;