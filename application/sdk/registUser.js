    // application/sdk/registUser.js

    'use strict';

    const FabricCAServices = require('fabric-ca-client');
    const { Wallets } = require('fabric-network');
    const fs =require('fs');
    const path = require('path');

    // ccp와 wallet 경로는 이 함수가 호출되는 컨텍스트에 맞게 설정되거나,
    // 또는 이 함수를 사용하는 쪽에서 주입받도록 할 수 있습니다.
    // 여기서는 기존 방식을 유지하되, 필요시 수정 가능성을 염두에 둡니다.
    const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json');
    const walletPath = path.join(process.cwd(), '..', 'wallet'); // registUser.js가 sdk 폴더에서 실행된다고 가정


    async function registerAndEnrollUser(userIdToRegister, affiliation = 'org1.department1') { // 사용자 ID를 인자로 받음
        try {
            const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));
            const caURL = ccp.certificateAuthorities['ca.org1.example.com'].url;
            const ca = new FabricCAServices(caURL);

            const wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Wallet path: ${walletPath}`); // 경로 확인용

            const userIdentity = await wallet.get(userIdToRegister);
            if (userIdentity) {
                console.log(`An identity for the user "${userIdToRegister}" already exists in the wallet`);
                return { success: false, message: `Identity for user "${userIdToRegister}" already exists.` };
            }

            const adminIdentity = await wallet.get('admin');
            if (!adminIdentity) {
                console.log('An identity for the admin user "admin" does not exist in the wallet');
                console.log('Run the enrollAdmin.js application before retrying');
                return { success: false, message: 'Admin identity not found. Cannot register new user.' };
            }

            const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
            const adminUser = await provider.getUserContext(adminIdentity, 'admin');

            const secret = await ca.register({
                affiliation: affiliation,
                enrollmentID: userIdToRegister,
                role: 'client'
            }, adminUser);

            const enrollment = await ca.enroll({
                enrollmentID: userIdToRegister,
                enrollmentSecret: secret
            });

            const x509Identity = {
                credentials: {
                    certificate: enrollment.certificate,
                    privateKey: enrollment.key.toBytes(),
                },
                mspId: 'Org1MSP',
                type: 'X.509',
            };

            await wallet.put(userIdToRegister, x509Identity);
            console.log(`Successfully registered and enrolled user "${userIdToRegister}" and imported it into the wallet`);
            return { success: true, message: `User "${userIdToRegister}" registered and enrolled successfully.` };

        } catch (error) {
            console.error(`Failed to register user "${userIdToRegister}": ${error}`);
            // process.exit(1); // API로 사용될 때는 process.exit(1)을 호출하면 안 됨
            return { success: false, message: `Failed to register user "${userIdToRegister}": ${error.message}` };
        }
    }

    // 기존 main() 함수 호출 부분은 제거하거나, CLI에서 직접 실행할 때만 동작하도록 조건 처리
    // async function main() {
    //     await registerAndEnrollUser('appUser'); // 예시 사용자 ID
    // }
    // main();

    module.exports = { registerAndEnrollUser }; // 함수를 export