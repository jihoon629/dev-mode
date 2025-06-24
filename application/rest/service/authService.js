// application/rest/service/authService.js
const jwt = require('jsonwebtoken');
const userModel = require('../models/userModel');
const { ensureFabricIdentity } = require('../utils/fabricWallet/fabric'); // 새로 추가!
const jwtConfig = require('../config/jwtConfig');

class AuthService {
    async register(username, email, password ) {
        try {
            const newUser = await userModel.create(
                username,
                email,
                password
            );

            if (!newUser || !newUser.id) {
                throw new Error('User creation in database failed.');
            }
            console.log('User created in MariaDB:', newUser);

            // Fabric 네트워크에 사용자 ID 등록/확인 로직 변경
            const fabricUserId = newUser.email;
            const fabricIdentityResult = await ensureFabricIdentity(fabricUserId); // fabric.js 함수 호출

            if (!fabricIdentityResult.success) {
                // ensureFabricIdentity가 이미 상세 오류를 로깅하므로, 여기서는 종합적인 메시지
                console.error(`Fabric identity processing failed for ${fabricUserId} after DB user creation: ${fabricIdentityResult.message}`);
                throw new Error(`User registered in DB, but Fabric identity processing failed: ${fabricIdentityResult.message}`);
            }
            // fabricIdentityResult.message는 "이미 존재" 또는 "성공적으로 생성/등록" 메시지를 포함
            console.log(`Fabric identity for user ${fabricUserId} processed: ${fabricIdentityResult.message}`);


            const tokenPayload = {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

            return {
                message: 'User registered successfully. Fabric ID also processed.', // 메시지 약간 수정
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
            };

        } catch (error) {
            console.error('Error in AuthService register:', error);
            if (error.message && error.message.includes('ER_DUP_ENTRY')) {
                 throw new Error('User with this email already exists.');
            }
            throw error;
        }
    }
  
    async login(email, password) {
        try {
            const user = await userModel.findByEmail(email);
            if (!user) {
                const error = new Error('User not found.');
                throw error;
            }

            if (user.provider === 'google' && !user.password) {
                const error = new Error('Please log in with your Google account.');
                throw error;
            }

            const isMatch = await userModel.comparePassword(password, user.password);
            if (!isMatch) {
                const error = new Error('Invalid credentials.');
                throw error;
            }

            // --- 로그인 성공 후 Fabric ID 확인 및 생성 로직 추가 ---
            const fabricUserId = user.email; // DB에서 조회한 사용자의 이메일 사용
            console.log(`[AuthService.login] User ${fabricUserId} logged in. Checking/Ensuring Fabric identity.`);
            const fabricProcessingResult = await ensureFabricIdentity(fabricUserId); // fabric.js 함수 호출

            let fabricMessageForResponse = fabricProcessingResult.message;

            if (!fabricProcessingResult.success) {
                // Fabric ID 처리 실패 시 오류 로깅.
                // 로그인은 성공했으므로, 로그인 자체를 실패 처리할 필요는 없을 수 있음.
                // 관리자 알림 등의 후속 조치 고려 가능.
                console.error(`[AuthService.login] Fabric identity processing failed for user ${fabricUserId} after successful login: ${fabricProcessingResult.message}`);
                // fabricMessageForResponse는 이미 오류 메시지를 담고 있음.
            } else {
                console.log(`[AuthService.login] Fabric identity for user ${fabricUserId} processed successfully during login: ${fabricProcessingResult.message}`);
            }
            // --- Fabric ID 처리 로직 끝 ---

            const tokenPayload = {
                id: user.id,
                email: user.email,
                username: user.username,
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

            return {
                message: 'Login successful.',
                id: user.id,
                username: user.username,
                email: user.email,
                token,
                fabricMessage: fabricMessageForResponse // Fabric ID 처리 결과 메시지 추가 (선택적)
            };
        } catch (error) {
            console.error('Error in AuthService login:', error);
            throw error;
        }
    }

    async findOrCreateGoogleUser(profile) {
        // googleId, email, displayName (username으로 사용)
        const googleUserData = this.getGoogleUser(profile); // username 포함 가능

        try {
            // userModel의 findOrCreateByGoogle은 { googleId, email, username } 객체를 받음
            const user = await userModel.findOrCreateByGoogle({
                googleId: googleUserData.googleId,
                email: googleUserData.email,
                username: googleUserData.name // 또는 별도의 username 생성 로직
            });

            if (!user || !user.id) {
                throw new Error('Google user creation/retrieval in database failed.');
            }
            console.log('Google user processed in MariaDB:', user);

            // Fabric ID 처리 로직 변경
            const fabricUserId = user.email;
            const fabricProcessingResult = await ensureFabricIdentity(fabricUserId); // fabric.js 함수 호출
            let fabricIdentityMessage = fabricProcessingResult.message; // ensureFabricIdentity의 메시지 사용

            if (!fabricProcessingResult.success) {
                // ensureFabricIdentity 내부에서 이미 오류 로깅됨
                console.error(`Fabric identity processing failed for Google user ${fabricUserId}: ${fabricProcessingResult.message}`);
            }
             console.log(`Fabric identity for Google user ${fabricUserId} processed: ${fabricProcessingResult.message}`);


            const tokenPayload = {
                id: user.id,
                email: user.email,
                username: user.username,
                provider: 'google',
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });

            return {
                message: 'Google login/registration successful.',
                id: user.id,
                username: user.username,
                email: user.email,
                token,
                fabricMessage: fabricIdentityMessage, // 처리 결과 메시지 전달
            };

        } catch (error) {
            console.error('Error in AuthService findOrCreateGoogleUser:', error);
            throw error;
        }
    }

     getGoogleUser(profile) {
        if (!profile || !profile.emails || !profile.emails.length) {
            throw new Error('Invalid Google profile data.');
        }
        return {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName, // username으로 사용될 수 있음
            firstName: profile.name && profile.name.givenName ? profile.name.givenName : '',
            lastName: profile.name && profile.name.familyName ? profile.name.familyName : '',
        };
    }
}
module.exports = new AuthService();