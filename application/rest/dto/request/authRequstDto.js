// application/rest/dto/request/authRequestDto.js

class RegisterUserRequestDto {
    constructor(username, email, password) {
      this.username = username;
      this.email = email;
      this.password = password;
    }
  }
  
  // LoginUserRequestDto 수정: usernameOrEmail -> email
  class LoginUserRequestDto {
    constructor(email, password) { 
      this.email = email;           // 'this.email'로 저장
      this.password = password;
    }
  }
  
  module.exports = {
    RegisterUserRequestDto,
    LoginUserRequestDto,
  };