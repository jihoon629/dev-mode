// application/rest/config/passportConfig.js
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/userModel');
const oauthConfig = require('./oauthConfig'); // oauthConfig.js 에서 설정값 가져오기

passport.use(new GoogleStrategy({
    clientID: oauthConfig.googleClientID,             // oauthConfig에서 가져오도록 수정
    clientSecret: oauthConfig.googleClientSecret,     // oauthConfig에서 가져오도록 수정
    callbackURL: oauthConfig.googleCallbackURL,       // oauthConfig에서 가져오도록 수정
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    const googleId = profile.id;
    const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
    // displayName이 없을 경우를 대비하여 username을 좀 더 견고하게 생성
    let username = profile.displayName || '';
    if (!username && email) {
        username = email.split('@')[0];
    }
    if (!username) { // displayName도 없고 email도 없는 극단적인 경우 (거의 없음)
        username = `user_${googleId.substring(0, 8)}`; // 임시 고유 이름
    }

    if (!email) {
      return done(new Error('Google 계정에서 이메일 정보를 가져올 수 없습니다. 이메일 공개에 동의해주세요.'), null);
    }

    try {
      let user = await User.findByGoogleId(googleId);

      if (user) {
        return done(null, user); // 기존 Google 사용자 로그인
      } else {
        // Google ID로 사용자가 없는 경우
        let existingUserByEmail = await User.findByUsernameOrEmail(email);
        if (existingUserByEmail) {
          // 이메일이 이미 사용 중인 경우: 기존 계정에 googleId 연결
          console.warn(`이메일 ${email} 사용자가 이미 존재합니다. Google ID ${googleId}를 연결합니다.`);
          // User 모델에 updateGoogleId(userId, googleId) 같은 함수가 있다면 사용
          // 여기서는 findOrCreateByGoogle 함수가 이 로직을 처리하도록 기대
          const updatedUser = await User.findOrCreateByGoogle({
            googleId,
            email,
            username: existingUserByEmail.username, // 기존 사용자 이름 유지
          });
          return done(null, updatedUser);

        } else {
          // 완전히 새로운 사용자: Google 정보로 생성
          const newUser = await User.findOrCreateByGoogle({
            googleId,
            email,
            username, // 이 username은 User.findOrCreateByGoogle 내부에서 중복 처리 필요
          });
          return done(null, newUser);
        }
      }
    } catch (err) {
      return done(err, null);
    }
  }
));



module.exports = passport;