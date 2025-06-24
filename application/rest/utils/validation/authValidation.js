// application/rest/utils/validation/authValidation.js

// 간단한 오류 객체 생성 헬퍼
const createValidationError = (message, statusCode = 400) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
  };
  
  const validateRegistration = (username, email, password, role) => { // role 인자 추가
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
    // Role 유효성 검사 추가
    if (!role || typeof role !== 'string' || role.trim() === "") {
      throw createValidationError('Role is required and must be a non-empty string.');
    }
    const allowedRoles = ['worker', 'employer']; // 허용되는 역할 정의
    if (!allowedRoles.includes(role)) {
      throw createValidationError(`Invalid role. Allowed roles are: ${allowedRoles.join(', ')}.`);
    }
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