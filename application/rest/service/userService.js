// application/rest/service/userService.js
const UserModel = require('../repo/models/userModel');
const { invokeChaincode } = require('../sdk');
const logger = require('../config/logger');

class UserService {
    /**
     * 특정 사용자의 모든 경력 기록을 체인코드에서 조회합니다.
     * @param {number} userId - 경력을 조회할 사용자의 ID
     * @returns {Promise<Array>} 경력 기록 배열
     */
    async getUserExperience(userId) {
        logger.info(`[UserService] Fetching work experience for user ID: ${userId}`);
        
        // 1. DB에서 사용자 정보를 찾아 Fabric Identity(email)를 얻습니다.
        const user = await UserModel.findById(userId);
        if (!user || !user.email) {
            throw new Error('사용자를 찾을 수 없거나 이메일 정보가 없습니다.');
        }
        const identity = user.email;

        try {
            // 2. 체인코드의 GetWorkHistoryForWorker 함수를 호출합니다.
            const resultBuffer = await invokeChaincode(true, identity, 'GetWorkHistoryForWorker', [userId.toString()]);
            
            if (resultBuffer && resultBuffer.length > 0) {
                const resultString = resultBuffer.toString('utf8');
                return JSON.parse(resultString);
            }
            return []; // 경력이 없는 경우 빈 배열 반환
        } catch (error) {
            logger.error(`[UserService] Failed to get work history from chaincode for user ${userId}: ${error.message}`, { stack: error.stack });
            // 체인코드에서 발생한 오류를 그대로 전달
            throw error;
        }
    }
}

module.exports = new UserService();
