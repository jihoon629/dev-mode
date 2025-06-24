// application/rest/utils/fabricWallet/fabric.js
const { Wallets } = require('fabric-network');
const path = require('path');
const { registerAndEnrollUser } = require('../../../sdk/registUser');
const defaultWalletPath = path.resolve(__dirname, '..', '..', '..', 'wallet'); // application/wallet

/**
 * 지정된 사용자의 Fabric ID가 지갑에 있는지 확인하고, 없으면 생성합니다.
 * @param {string} userId - 확인할 사용자 ID (예: 이메일)
 * @returns {Promise<{success: boolean, message: string}>} 작업 성공 여부 및 메시지
 */
async function ensureFabricIdentity(userId) {
  try {
    console.log(`[fabric.js] Ensuring Fabric identity for user: ${userId} in wallet: ${defaultWalletPath}`);
    const wallet = await Wallets.newFileSystemWallet(defaultWalletPath);
    const identityExists = await wallet.get(userId);

    if (identityExists) {
      const message = `Fabric identity for user ${userId} already exists.`;
      console.log(`[fabric.js] ${message}`);
      return { success: true, message: message };
    } else {
      console.log(`[fabric.js] Fabric identity for user ${userId} not found. Attempting to create using registerAndEnrollUser.`);
      // registerAndEnrollUser는 { success, message } 객체를 반환합니다.
      // 이 함수는 내부적으로 process.cwd()를 사용하여 지갑 경로를 결정하므로,
      // Node 프로세스 실행 위치에 따라 경로가 올바르게 application/wallet으로 해석되어야 합니다.
      const creationResult = await registerAndEnrollUser(userId);
      
      if (creationResult.success) {
        console.log(`[fabric.js] Successfully created Fabric identity for ${userId} via registerAndEnrollUser.`);
      } else {
        console.error(`[fabric.js] Failed to create Fabric identity for ${userId} via registerAndEnrollUser: ${creationResult.message}`);
      }
      return creationResult; // { success: boolean, message: string }
    }
  } catch (error) {
    const errorMessage = `Error in ensureFabricIdentity for ${userId}: ${error.message}`;
    console.error(`[fabric.js] ${errorMessage}`, error);
    return { success: false, message: errorMessage };
  }
}

module.exports = {
  ensureFabricIdentity,
};