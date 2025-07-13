// application/rest/utils/fabricWallet/fabric.js
const { Wallets } = require('fabric-network');
const path = require('path');
const logger = require('../../config/logger');
const { registerAndEnrollUser } = require('../../../sdk/registUser');
const defaultWalletPath = path.resolve(__dirname, '..', '..', '..', 'wallet');

/**
 * 지정된 사용자의 Fabric ID가 지갑에 있는지 확인하고, 없으면 생성합니다.
 * @param {string} userId - 확인할 사용자 ID (예: 이메일)
 * @returns {Promise<{success: boolean, message: string}>} 작업 성공 여부 및 메시지
 */
async function ensureFabricIdentity(userId) {
  try {
    logger.info(`[Fabric헬퍼] 사용자 [${userId}]의 Fabric ID 확인 시작. 지갑 경로: ${defaultWalletPath}`);
    const wallet = await Wallets.newFileSystemWallet(defaultWalletPath);
    const identityExists = await wallet.get(userId);

    if (identityExists) {
      const message = `사용자 [${userId}]의 Fabric ID가 이미 지갑에 존재합니다.`;
      logger.info(`[Fabric헬퍼] ${message}`);
      return { success: true, message: message };
    } else {
      logger.info(`[Fabric헬퍼] 사용자 [${userId}]의 Fabric ID를 찾을 수 없습니다. 신규 생성을 시도합니다.`);
      const creationResult = await registerAndEnrollUser(userId);
      
      if (creationResult.success) {
        logger.info(`[Fabric헬퍼] 사용자 [${userId}]의 Fabric ID를 성공적으로 생성했습니다.`);
      } else {
        logger.error(`[Fabric헬퍼] 사용자 [${userId}]의 Fabric ID 생성 실패. 원인: ${creationResult.message}`);
      }
      return creationResult;
    }
  } catch (error) {
    const errorMessage = `사용자 [${userId}]의 Fabric ID 처리 중 오류 발생: ${error.message}`;
    logger.error(`[Fabric헬퍼] ${errorMessage}`, { userId, error: error.stack }); // 스택 정보 포함
    return { success: false, message: errorMessage };
  }
}

module.exports = {
  ensureFabricIdentity,
};