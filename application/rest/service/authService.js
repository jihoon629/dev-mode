// application/rest/service/authService.js
const User = require('../models/userModel');
const jwt = require('jsonwebtoken');
const { jwt: jwtConfig } = require('../config'); // config/index.js 에서 jwt 설정 가져오기

const AuthService = {
  // 회원가입 로직
  async register(username, email, password) {
    // 입력값 유효성 검사 (간단한 예시, 실제로는 더 견고하게)
    if (!username || !email || !password) {
      throw new Error('사용자 이름, 이메일, 비밀번호는 모두 필수입니다.');
    }
    if (password.length < 6) {
        throw new Error('비밀번호는 6자 이상이어야 합니다.');
    }
    // 이메일 형식 검사 등 추가 가능

    try {
      // 사용자 중복 체크 (username 또는 email)
      const existingUser = await User.findByUsernameOrEmail(username) || await User.findByUsernameOrEmail(email);
      if (existingUser) {
        if (existingUser.username === username) {
            throw new Error('이미 사용 중인 사용자 이름입니다.');
        }
        if (existingUser.email === email) {
            throw new Error('이미 사용 중인 이메일입니다.');
        }
      }

      // 사용자 생성
      const newUser = await User.create(username, email, password);
      // 회원가입 성공 시 반환할 사용자 정보 (비밀번호 제외)
      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email
      };
    } catch (error) {
      // userModel.create 에서 던진 SQL 오류 등을 여기서 처리하거나 다시 던짐
      // 예를 들어, SQL UNIQUE 제약 조건 위반 오류 코드(ER_DUP_ENTRY) 등을 확인하여 구체적인 메시지 반환 가능
      if (error.code === 'ER_DUP_ENTRY') { // MySQL/MariaDB의 중복 에러 코드
        // 실제로는 error.message 등을 분석하여 username인지 email인지 구분 필요
        throw new Error('이미 사용 중인 사용자 이름 또는 이메일입니다. (DB)');
      }
      console.error('Error in AuthService.register:', error.message);
      throw error; // 컨트롤러에서 처리하도록 다시 던짐
    }
  },

  // 로그인 로직
  async login(usernameOrEmail, password) {
    if (!usernameOrEmail || !password) {
      throw new Error('사용자 이름(또는 이메일)과 비밀번호는 모두 필수입니다.');
    }

    try {
      const user = await User.findByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      // 데이터베이스에서 가져온 해시된 비밀번호와 입력된 비밀번호 비교
      const isMatch = await User.comparePassword(password, user.password);
      if (!isMatch) {
        throw new Error('비밀번호가 일치하지 않습니다.');
      }

      // 로그인 성공: JWT 생성
      const payload = {
        id: user.id,
        username: user.username
        // 필요에 따라 다른 정보 추가 가능 (예: 역할 role)
      };

      const token = jwt.sign(payload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

      return {
        token,
        user: { // 클라이언트에게 반환할 사용자 정보 (비밀번호 등 민감 정보 제외)
          id: user.id,
          username: user.username,
          email: user.email
        }
      };
    } catch (error) {
      console.error('Error in AuthService.login:', error.message);
      throw error;
    }
  }
};

module.exports = AuthService;