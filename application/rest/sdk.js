'use strict';

const { Wallets, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

const channelName = 'channel1';
const chaincodeName = 'abstore';

const walletPath = path.join(process.cwd(), '..', 'wallet');
const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
const org1UserId = 'appUser';
async function send(type, func, args, res, result){
    try {
        const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        const gateway = new Gateway();

        try {
            await gateway.connect(ccp, {
                wallet,
                identity: org1UserId,
                discovery: { enabled: true, asLocalhost: false }
            });
            console.log('Success to connect network');

            const network = await gateway.getNetwork(channelName);
            console.log('Success to connect channel1');
            const contract = network.getContract(chaincodeName);

            if(type){
                result = await contract.evaluateTransaction(func, ...args);
                res.json(result.toString());
            } else {
                result = await contract.submitTransaction(func, ...args);
                res.json("Success");
            }
            

        } catch (error) {
            console.error('Error in SDK send function:', error); // 상세 오류 로깅 추가
            res.status(500).send({ error: `Failed to process request: ${error.message || error}`}); // 클라이언트에게 보다 구체적인 메시지 전달
        } finally {
            if (gateway && gateway. Hdisconnect) { // gateway가 연결된 경우에만 disconnect 호출
                 gateway.disconnect();
            }
        }
    } catch (error) {
        console.error('Error setting up gateway or wallet:', error); // 초기 설정 오류 로깅 추가
        res.status(500).send({ error: `Server setup error: ${error.message || error}`});
    }
}
module.exports = {
    send:send
}
