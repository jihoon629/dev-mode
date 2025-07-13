// application/rest/config/passportConfig.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const AuthService = require('../service/authService');
const oauthConfig = require('./oauthConfig');
const jwtConfig = require('./jwtConfig');
const logger = require('./logger'); // logger 추가

// JWT Strategy Options
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: jwtConfig.secret,
};

// JWT Strategy
passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      logger.debug('[Passport JWT] Verifying token payload:', jwt_payload);
      // JWT 페이로드에서 사용자 ID를 사용하여 사용자 조회
      const user = await AuthService.findUserById(jwt_payload.id); // jwt_payload.id는 JWT에 저장된 사용자 ID
      if (user) {
        logger.info(`[Passport JWT] User authenticated successfully: ${user.email}`);
        return done(null, user); // 사용자 존재 시 user 객체 반환
      } else {
        logger.warn(`[Passport JWT] User not found for ID: ${jwt_payload.id}`);
        return done(null, false); // 사용자 존재하지 않을 시 false 반환
      }
    } catch (error) {
      logger.error('[Passport JWT] Error during authentication:', error);
      return done(error, false); // 에러 발생 시 에러 반환
    }
  })
);

passport.use(new GoogleStrategy({
    clientID: oauthConfig.googleClientID,
    clientSecret: oauthConfig.googleClientSecret,
    callbackURL: oauthConfig.googleCallbackURL,
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      // AuthService의 findOrCreateGoogleUser 함수를 사용하여 사용자 처리
      // 이 함수는 DB 사용자 조회/생성 및 Fabric ID 생성까지 처리하고,
      // JWT 토큰이 포함된 객체 대신 사용자 객체 자체를 반환하도록 하거나,
      // done(null, user)에 필요한 사용자 정보만 추출해서 전달해야 합니다.
      // Passport의 done 콜백은 보통 (error, user, info) 형태를 기대합니다.
      // AuthService.findOrCreateGoogleUser가 반환하는 객체에서 사용자 정보만 추출합니다.

      const authServiceResponse = await AuthService.findOrCreateGoogleUser(profile);
      
      // authServiceResponse가 성공적으로 사용자 정보를 포함하고 있다고 가정
      // 예: authServiceResponse = { user: {id, email, username, ...}, token, fabricMessage }
      // Passport done 콜백에는 사용자 객체를 전달해야 합니다.
      if (authServiceResponse && authServiceResponse.id) { // authService.findOrCreateGoogleUser가 사용자 객체의 주요 필드를 직접 반환한다고 가정
        const userForPassport = {
            id: authServiceResponse.id,
            email: authServiceResponse.email,
            username: authServiceResponse.username,
            googleId: profile.id, // profile에서 googleId를 명시적으로 추가 (userModel이 반환하지 않을 경우 대비)
            // 필요에 따라 accessToken 등을 user 객체에 추가할 수도 있음 (세션에 저장됨)
        };
        return done(null, userForPassport);
      } else {
        // AuthService에서 오류를 throw하지 않고, 실패를 나타내는 응답을 반환한 경우
        // 또는 예상치 못한 응��� 형식인 경우
        return done(new Error('Failed to process Google user via AuthService.'), null);
      }

    } catch (err) {
      // AuthService에서 오류를 throw한 경우
      console.error('Error during Google OAuth strategy verify callback:', err);
      return done(err, null);
    }
  }
));

// 사용자 정보를 세션에 저장하는 방법 정의
passport.serializeUser((user, done) => {
  // user 객체에서 세션에 저장할 고유 식별자 (예: user.id)를 선택
  done(null, user.id); // 일반적으로 DB의 사용자 ID를 사용
});

// 세션에서 사용자 정보를 불러오는 방법 정의
passport.deserializeUser(async (id, done) => {
  try {
    // 세션에 저장된 id를 사용하여 DB에서 전체 사용자 정보를 조회
    const user = await AuthService.findUserById(id); // AuthService에 findUserById 함수가 있다고 가정
                                                     // 또는 직접 User.findById(id) 사용
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

module.exports = passport;