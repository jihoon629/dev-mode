// application/rest/controller/authController.js
const authServiceInstance = require('../service/authService'); // AuthService 인스턴스 가져오기
const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwtConfig');
const { validateRegistration, validateLogin } = require('../utils/validation/authValidation'); // 다시 사용

const { RegisterUserRequestDto, LoginUserRequestDto } = require('../dto/request/authRequstDto');
const { UserResponseDto, RegistrationSuccessResponseDto, LoginSuccessResponseDto } = require('../dto/response/authResponseDto');

class AuthController {

  constructor() {
    this.authService = authServiceInstance; 
    this.register = this.register.bind(this);
    this.login = this.login.bind(this);
    this.handleGoogleCallback = this.handleGoogleCallback.bind(this);
  }

  async register(req, res, next) {
    try {
      const { username, email, password, role } = req.body;
      // 기존 유효성 검사 함수 호출
      validateRegistration(username, email, password, role);

      // DTO는 데이터 구조화 용도로만 사용 (class-validator 없이)
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
      // class-validator는 유효성 검사 실패 시 ValidationError 배열을 포함하는 에러를 throw 합니다.
      if (Array.isArray(error) && error[0] instanceof require('class-validator').ValidationError) {
        // 유효성 검사 오류를 클라이언트에게 좀 더 친절하게 전달할 수 있습니다.
        // 여기서는 간단히 첫 번째 오류 메시지만 사용하거나, 모든 오류를 조합할 수 있습니다.
        // const messages = error.map(err => Object.values(err.constraints)).flat();
        const firstErrorMessage = Object.values(error[0].constraints)[0];
        const validationError = new Error(firstErrorMessage || '입력값이 유효하지 않습니다.');
        validationError.statusCode = 400;
        return next(validationError);
      }
      // console.error('Error in AuthController.register:', error.message); // 중앙 로거가 처리
      // if (!error.statusCode) { // 중앙 에러 핸들러에서 상태 코드 설정 가능
      //   error.statusCode = 500;
      // }
      next(error);
    }
  }

  async login(req, res, next) {
    try {
      const {  email, password } = req.body;
         // 1. 기존 유효성 검사 함수 호출 (class-validator 미사용 시)
         validateLogin(email, password); // from authValidation.js

         // 2. DTO 인스턴스 생성 (올바른 클래스 이름 사용)
         const loginDto = new LoginUserRequestDto(email, password); // LoginUserRequestDto 사용
   
         // 3. 서비스 호출
         const authServiceResult = await this.authService.login( // 서비스 결과 변수명 변경
           loginDto.email,
           loginDto.password
         );

  // 4. 응답 생성 (authServiceResult 사용하도록 수정)
  const userResponse = new UserResponseDto(
    authServiceResult.id,          // loginResult -> authServiceResult
    authServiceResult.username,    // loginResult -> authServiceResult
    authServiceResult.email        // loginResult -> authServiceResult
  );
  const responseDto = new LoginSuccessResponseDto(
    authServiceResult.message || '로그인 성공', // loginResult -> authServiceResult
    authServiceResult.token,                  // loginResult -> authServiceResult
    userResponse
  );
      res.status(200).json(responseDto);
    } catch (error) {
      if (Array.isArray(error) && error[0] instanceof require('class-validator').ValidationError) {
        const firstErrorMessage = Object.values(error[0].constraints)[0];
        const validationError = new Error(firstErrorMessage || '입력값이 유효하지 않습니다.');
        validationError.statusCode = 400;
        return next(validationError);
      }
      // console.error('Error in AuthController.login:', error.message);
      // if (!error.statusCode && (error.message === 'User not found.' || error.message === 'Invalid credentials.')) {
      //   error.statusCode = 401;
      // } else if (!error.statusCode) {
      //   error.statusCode = 500;
      // }
      next(error);
    }
  }

  async handleGoogleCallback(req, res, next) {
    try {
      if (!req.user) {
        // console.error('Google OAuth Callback: req.user is not set.'); // 로거 사용 권장
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        return res.redirect(`${frontendUrl}/login?error=GoogleAuthenticationFailedUpstream`);
      }

      // console.log('Google OAuth Callback in Controller. req.user:', req.user); // 로거 사용 권장

      const payload = {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
      };

      const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const callbackUrlWithToken = `${frontendUrl}/auth/social-callback?token=${token}`;

      // console.log(`JWT for Google user. Redirecting to: ${callbackUrlWithToken}`); // 로거 사용 권장
      res.redirect(callbackUrlWithToken);
    } catch (error) {
      // console.error('Error in AuthController.handleGoogleCallback:', error); // 로거 사용 권장
      // const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      // const errorMessage = error.message ? encodeURIComponent(error.message) : 'UnknownError';
      // res.redirect(`${frontendUrl}/login?error=GoogleCallbackProcessingError&message=${errorMessage}`);
      next(error); // 중앙 에러 핸들러로 전달
    }
  }
}

// AuthController의 인스턴스를 export 합니다.
module.exports = new AuthController();