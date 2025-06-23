    // application/rest/controller/authController.js
    const AuthService = require('../service/authService');

    const AuthController = {
      // 회원가입 요청 처리
      async register(req, res, next) {
        try {
          const { username, email, password } = req.body;
          // AuthService의 register 함수 호출
          const user = await AuthService.register(username, email, password);
          // 성공 응답: 201 Created
          res.status(201).json({
            message: '회원가입이 성공적으로 완료되었습니다.',
            user // user 객체에는 id, username, email이 포함됨 (비밀번호 제외)
          });
        } catch (error) {
          // AuthService에서 던진 오류 또는 여기서 발생한 오류를 next로 전달하여
          // 중앙 에러 처리 미들웨어에서 처리하도록 함 (아직 없다면 콘솔에 로깅 후 500 에러 반환)
          console.error('Error in AuthController.register:', error.message);
          // res.status(400).json({ message: error.message || '회원가입 중 오류가 발생했습니다.' });
          next(error); // 중앙 에러 핸들러로 전달
        }
      },

      // 로그인 요청 처리
      async login(req, res, next) {
        try {
          const { usernameOrEmail, password } = req.body;
          // AuthService의 login 함수 호출
          const result = await AuthService.login(usernameOrEmail, password);
          // 성공 응답: 200 OK, 토큰과 사용자 정보 반환
          res.status(200).json({
            message: '로그인 성공',
            token: result.token,
            user: result.user // user 객체에는 id, username, email 등이 포함됨
          });
        } catch (error) {
          console.error('Error in AuthController.login:', error.message);
          // res.status(401).json({ message: error.message || '로그인 중 오류가 발생했습니다.' });
          next(error); // 중앙 에러 핸들러로 전달
        }
      }

      // TODO: (선택 사항) /me (내 정보 보기), /logout 등의 컨트롤러 함수 추가 가능
    };

    module.exports = AuthController;