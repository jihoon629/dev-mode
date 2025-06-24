// application/rest/utils/validation/authValidation.js

// 간단한 오류 객체 생성 헬퍼
const createValidationError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };
  
  const validateRegistration = (username, email, password) => {
    if (!username || typeof username !== 'string' || username.trim() === "") {
      throw createValidationError('Username is required and must be a non-empty string.');
    }
    if (!email || typeof email !== 'string' || email.trim() === "") {
      throw createValidationError('Email is required and must be a non-empty string.');
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw createValidationError('Invalid email format.');
    }
    if (!password || typeof password !== 'string' || password.trim() === "") {
      throw createValidationError('Password is required and must be a non-empty string.');
    }
    if (password.length < 6) {
      throw createValidationError('Password must be at least 6 characters long.');
    }
    // 모든 유효성 검사 통과 시에는 아무것도 반환하지 않거나, true 등을 반환할 수 있습니다.
    // 여기서는 오류가 없으면 그냥 통과시킵니다 (오류 발생 시 throw).
  };
  
  const validateLogin = (email, password) => {


    if (!email || typeof email !== 'string' || email.trim() === "") {
      throw createValidationError('Email is required for login.');
    }
    // const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    // if (!emailRegex.test(email)) {
    //   throw createValidationError('Invalid email format for login.');
    // }
    if (!password || typeof password !== 'string' || password.trim() === "") {
      throw createValidationError('Password is required for login.');
    }
  };
  
  module.exports = {
    validateRegistration,
    validateLogin,
  };