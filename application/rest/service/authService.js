// application/rest/service/authService.js
const jwt = require('jsonwebtoken');
const userModel = require('../repo/models/userModel');
const { ensureFabricIdentity } = require('../utils/fabricWallet/fabric');
const jwtConfig = require('../config/jwtConfig');
const logger = require('../config/logger');

class AuthService {

    async register(username, email, password, role) { // role 인자 추가
        logger.info(`[Auth서비스-회원가입] 사용자 등록 시도. 사용자명: ${username}, 이메일: ${email}, 역할: ${role}`);
        try {
            const newUser = await userModel.create(
                username,
                email,
                password, 
                role      
            );

            if (!newUser || !newUser.id) {
                logger.error('[Auth서비스-회원가입] 데이터베이스 사용자 생성 실패.', { username, email, role });
                throw new Error('데이터베이스 사용자 생성에 실패했습니다.');
            }
            logger.info(`[Auth서비스-회원가입] 데이터베이스 사용자 생성 완료. 사용자ID: ${newUser.id}, 이메일: ${newUser.email}, 역할: ${newUser.role}`);

            const fabricUserId = newUser.email; // 또는 newUser.id 등 Fabric ID로 사용할 고유값
            logger.debug(`[Auth서비스-회원가입] 사용자 [${fabricUserId}]의 Fabric ID 처리를 시작합니다.`);
            const fabricIdentityResult = await ensureFabricIdentity(fabricUserId); // fabric.js의 함수 사용

            if (!fabricIdentityResult.success) {
                logger.error(`[Auth서비스-회원가입] 데이터베이스 사용자 생성 후 Fabric ID 처리 실패. 사용자: ${fabricUserId}, 원인: ${fabricIdentityResult.message}`);
                // 필요시 여기서 DB에 생성된 사용자 롤백 처리 고려
                throw new Error(`데이터베이스 사용자는 등록되었으나, Fabric ID 처리 중 오류가 발생했습니다: ${fabricIdentityResult.message}`);
            }
            logger.info(`[Auth서비스-회원가입] 사용자 [${fabricUserId}] Fabric ID 처리 완료. 결과: ${fabricIdentityResult.message}`);

            const tokenPayload = {
                id: newUser.id,
                email: newUser.email,
                username: newUser.username,
                role: newUser.role, // JWT 페이로드에 role 추가
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
            logger.info(`[Auth서비스-회원가입] 사용자 [${newUser.email}] JWT 토큰 발급 완료 (역할: ${newUser.role}).`);

            return {
                message: '회원가입 및 Fabric ID 처리가 성공적으로 완료되었습니다.',
                id: newUser.id,
                username: newUser.username,
                email: newUser.email,
                role: newUser.role, // 반환값에 role 추가
            };

        } catch (error) {
            logger.error(`[Auth서비스-회원가입] ${email} (역할: ${role}) 사용자 등록 중 오류 발생: ${error.message}`, { username, email, role, stack: error.stack });
            if (error.message && error.message.includes('ER_DUP_ENTRY')) { // MariaDB/MySQL 중복 에러 코드 확인 필요
                 throw new Error('이미 사용 중인 이메일 또는 사용자명입니다.'); // DB 제약조건에 따라 메시지 수정
            }
            throw error; // 에러를 그대로 다시 throw하여 중앙 에러 핸들러에서 처리
        }
    }

    async login(email, password) {
        logger.info(`[Auth서비스-로그인] 사용자 로그인 시도. 이메일: ${email}`);
        try {
            const user = await userModel.findByEmail(email);
            if (!user) {
                logger.warn(`[Auth서비스-로그인] 사용자를 찾을 수 없음. 이메일: ${email}`);
                throw new Error('사용자를 찾을 수 없습니다.');
            }

            if (user.provider === 'google' && !user.password) {
                logger.warn(`[Auth서비스-로그인] Google 계정 사용자의 일반 로그인 시도. 이메일: ${email}`);
                throw new Error('Google 계정으로 로그인해주세요.');
            }

            const isMatch = await userModel.comparePassword(password, user.password);
            if (!isMatch) {
                logger.warn(`[Auth서비스-로그인] 비밀번호 불일치. 이메일: ${email}`);
                throw new Error('잘못된 인증 정보입니다.');
            }
            logger.info(`[Auth서비스-로그인] 사용자 인증 성공. 이메일: ${email}`);

            const fabricUserId = user.email;
            logger.debug(`[Auth서비스-로그인] 사용자 [${fabricUserId}] 로그인 성공. Fabric ID 처리를 시작합니다.`);
            const fabricProcessingResult = await ensureFabricIdentity(fabricUserId);
            let fabricMessageForResponse = fabricProcessingResult.message;

            if (!fabricProcessingResult.success) {
                logger.error(`[Auth서비스-로그인] 로그인 성공 후 Fabric ID 처리 실패. 사용자: ${fabricUserId}, 원인: ${fabricProcessingResult.message}`);
            } else {
                logger.info(`[Auth서비스-로그인] 사용자 [${fabricUserId}] Fabric ID 처리 성공 (로그인 시). 결과: ${fabricProcessingResult.message}`);
            }

            const tokenPayload = {
                id: user.id,
                email: user.email,
                username: user.username,
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
            logger.info(`[Auth서비스-로그인] 사용자 [${email}] JWT 토큰 발급 완료.`);

            return {
                message: '로그인 성공.',
                id: user.id,
                username: user.username,
                email: user.email,
                token,
                fabricMessage: fabricMessageForResponse
            };
        } catch (error) {
            logger.error(`[Auth서비스-로그인] ${email} 사용자 로그인 중 오류 발생: ${error.message}`, { email, stack: error.stack });
            throw error;
        }
    }

    async findOrCreateGoogleUser(profile) {
        const googleUserData = this.getGoogleUser(profile);
        logger.info(`[Auth서비스-Google] Google 사용자 처리 시작. 이메일: ${googleUserData.email}, GoogleID: ${googleUserData.googleId}`);
        try {
            const user = await userModel.findOrCreateByGoogle({
                googleId: googleUserData.googleId,
                email: googleUserData.email,
                username: googleUserData.name
            });

            if (!user || !user.id) {
                logger.error('[Auth서비스-Google] 데이터베이스에서 Google 사용자 조회/생성 실패.', { googleId: googleUserData.googleId });
                throw new Error('데이터베이스에서 Google 사용자 조회/생성에 실패했습니다.');
            }
            logger.info(`[Auth서비스-Google] 데이터베이스 Google 사용자 처리 완료. 사용자ID: ${user.id}, 이메일: ${user.email}`);

            const fabricUserId = user.email;
            logger.debug(`[Auth서비스-Google] Google 사용자 [${fabricUserId}]의 Fabric ID 처리를 시작합니다.`);
            const fabricProcessingResult = await ensureFabricIdentity(fabricUserId);
            let fabricIdentityMessage = fabricProcessingResult.message;

            if (!fabricProcessingResult.success) {
                logger.error(`[Auth서비스-Google] Google 사용자 ${fabricUserId} Fabric ID 처리 실패. 원인: ${fabricProcessingResult.message}`);
            }
             logger.info(`[Auth서비스-Google] Google 사용자 [${fabricUserId}] Fabric ID 처리 완료. 결과: ${fabricProcessingResult.message}`);

            const tokenPayload = {
                id: user.id,
                email: user.email,
                username: user.username,
                provider: 'google',
            };
            const token = jwt.sign(tokenPayload, jwtConfig.secret, { expiresIn: jwtConfig.expiresIn });
            logger.info(`[Auth서비스-Google] Google 사용자 [${user.email}] JWT 토큰 발급 완료.`);

            return {
                message: 'Google 로그인/회원가입 성공.',
                id: user.id,
                username: user.username,
                email: user.email,
                token,
                fabricMessage: fabricIdentityMessage,
            };

        } catch (error) {
            logger.error(`[Auth서비스-Google] Google 사용자 ${googleUserData.email} 처리 중 오류: ${error.message}`, { googleId: googleUserData.googleId, stack: error.stack });
            throw error;
        }
    }

     getGoogleUser(profile) {
        if (!profile || !profile.emails || !profile.emails.length) {
            logger.error('[Auth서비스-Google] Google 프로필 정보가 유효하지 않습니다.', { profile });
            throw new Error('Google 프로필 정보가 유효하지 않습니다.');
        }
        return {
            googleId: profile.id,
            email: profile.emails[0].value,
            name: profile.displayName,
            firstName: profile.name && profile.name.givenName ? profile.name.givenName : '',
            lastName: profile.name && profile.name.familyName ? profile.name.familyName : '',
        };
    }
}
module.exports = new AuthService();