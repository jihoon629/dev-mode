// application/rest/dto/response/authResponseDto.js


  
  // --- 응답(Response) DTOs ---
  
  // 공통 사용자 정보 응답 DTO (비밀번호 등 민감 정보 제외)
  class UserResponseDto {
    constructor(id, username, email,role) {
      this.id = id;
      this.username = username;
      this.email = email;
      this.role = role;
      // 필요에 따라 created_at 등 추가 정보 포함 가능
    }
  }
  
  // 회원가입 성공 응답 DTO
  class RegistrationSuccessResponseDto {
    constructor(message, userResponseDto) {
      this.message = message;
      this.user = userResponseDto; // UserResponseDto 사용
    }
  }
  
  // 로그인 성공 응답 DTO
  class LoginSuccessResponseDto {
    constructor(message, token, userResponseDto) {
      this.message = message;
      this.token = token;
      this.user = userResponseDto; // UserResponseDto 사용
    }
  }
  
  module.exports = {

    // 응답 DTOs
    UserResponseDto,
    RegistrationSuccessResponseDto,
    LoginSuccessResponseDto,
  };