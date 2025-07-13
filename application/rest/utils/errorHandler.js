
// application/rest/utils/errorHandler.js
const { ValidationError } = require('class-validator');

function handleValidationError(error, next) {
  if (Array.isArray(error) && error[0] instanceof ValidationError) {
    const firstErrorMessage = Object.values(error[0].constraints)[0];
    const validationError = new Error(firstErrorMessage || '입력값이 유효하지 않습니다.');
    validationError.statusCode = 400;
    return next(validationError);
  }
  next(error);
}

module.exports = { handleValidationError };
