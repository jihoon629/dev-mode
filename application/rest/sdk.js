'use strict';

const { Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client'); // CA 클라이언트 추가
const path = require('path');
const fs = require('fs');

// --- 기본 설정 ---
// TODO: 이 설정들은 config 파일로 옮기는 것을 권장합니다.
const channelName = 'channel1';
const chaincodeName = 'abstore';
const walletPath = path.join(process.cwd(), '..', 'wallet'); // 이 경로는 프로젝트 루트의 'wallet' 폴더를 가리킵니다. 실제 위치에 맞게 조정 필요.
const ccpPath = path.resolve(__dirname, '..', 'connection-org1.json'); // sdk.js 기준 상대 경로
const defaultMspId = 'Org1MSP'; // 네트워크 구성에 맞는 MSP ID로 수정
const defaultCaName = 'ca.org1.example.com'; // 네트워크 구성에 맞는 CA 이름으로 수정

// --- 헬퍼 함수 ---
async function getCcp() {
  const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
  return JSON.parse(ccpJSON);
}

async function getWallet() {
  // 지갑 폴더가 없으면 생성
  if (!fs.existsSync(walletPath)) {
    console.log(`Wallet directory does not exist, creating: ${walletPath}`);
    fs.mkdirSync(walletPath, { recursive: true });
  }
  return Wallets.newFileSystemWallet(walletPath);
}

// --- 관리자 및 사용자 등록/인롤 함수 ---

async function enrollAdmin(adminUserId = 'admin', adminUserPasswd = 'adminpw') {
  console.log(`Attempting to enroll admin user: ${adminUserId}`);
  try {
    const ccp = await getCcp();
    // CA 정보 가져오기 (ccp 파일 내의 CA 이름 확인 필요)
    const caInfo = ccp.certificateAuthorities[defaultCaName];
    if (!caInfo) {
      throw new Error(`CA named "${defaultCaName}" not found in CCP`);
    }
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);

    const wallet = await getWallet();
    const adminIdentity = await wallet.get(adminUserId);

    if (adminIdentity) {
      console.log(`Admin user "${adminUserId}" already exists in the wallet`);
      return { success: true, message: `Admin user "${adminUserId}" already exists.` };
    }

    // 관리자 인롤
    const enrollment = await ca.enroll({ enrollmentID: adminUserId, enrollmentSecret: adminUserPasswd });
    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: defaultMspId,
      type: 'X.509',
    };
    await wallet.put(adminUserId, x509Identity);
    console.log(`Successfully enrolled admin user "${adminUserId}" and imported it into the wallet`);
    return { success: true, message: `Admin user "${adminUserId}" enrolled successfully.` };
  } catch (error) {
    console.error(`Failed to enroll admin user "${adminUserId}": ${error.stack}`);
    throw error; // 오류를 다시 던져서 호출한 쪽에서 처리하도록 함
  }
}

async function registerAndEnrollUser(registrarUserId, userIdToRegister, affiliation = 'org1.department1', userRole = 'client') {
  console.log(`Attempting to register and enroll user: ${userIdToRegister} by registrar: ${registrarUserId}`);
  if (!registrarUserId || !userIdToRegister) {
    throw new Error('Registrar User ID and User ID to register must be provided.');
  }

  try {
    const ccp = await getCcp();
    const wallet = await getWallet();

    // 등록을 수행할 관리자(등록기관) ID 확인
    const registrarIdentity = await wallet.get(registrarUserId);
    if (!registrarIdentity) {
      const errMsg = `Registrar user "${registrarUserId}" not found in wallet. Ensure admin is enrolled.`;
      console.error(errMsg);
      throw new Error(errMsg);
    }

    // 사용자 존재 여부 확인 (지갑 기준)
    const userIdentity = await wallet.get(userIdToRegister);
    if (userIdentity) {
      console.log(`User "${userIdToRegister}" already exists in the wallet`);
      return { success: true, message: `User "${userIdToRegister}" already exists in the wallet.` };
    }

    // Gateway를 통해 관리자 컨텍스트 생성
    const gateway = new Gateway();
    await gateway.connect(ccp, {
      wallet,
      identity: registrarUserId,
      discovery: { enabled: true, asLocalhost: (ccp.peers && Object.keys(ccp.peers).some(key => key.includes('localhost'))) } // CCP에 localhost가 있으면 true
    });
    console.log('Gateway object after connect:', gateway); // gateway 객체 상태 확인
    console.log('Type of gateway.getClient:', typeof gateway.getClient); // getClient 메소드 타입 확인


    const client = gateway.getClient();
    const caClient = client.getCertificateAuthority();
    const adminUserContext = await client.getUserContext(registrarUserId); // 관리자 사용자 컨텍스트

    // CA에 사용자 등록
    console.log(`Registering user "${userIdToRegister}" with CA...`);
    const secret = await caClient.register({
      affiliation: affiliation,
      enrollmentID: userIdToRegister,
      role: userRole,
    }, adminUserContext);
    console.log(`Successfully registered user "${userIdToRegister}" with CA.`);

    // 사용자 인롤
    console.log(`Enrolling user "${userIdToRegister}" with CA...`);
    const enrollment = await caClient.enroll({
      enrollmentID: userIdToRegister,
      enrollmentSecret: secret
    });
    console.log(`Successfully enrolled user "${userIdToRegister}".`);

    const x509Identity = {
      credentials: {
        certificate: enrollment.certificate,
        privateKey: enrollment.key.toBytes(),
      },
      mspId: defaultMspId,
      type: 'X.509',
    };
    await wallet.put(userIdToRegister, x509Identity);
    console.log(`Successfully enrolled user "${userIdToRegister}" and imported it into the wallet`);

    gateway.disconnect();
    return { success: true, message: `User "${userIdToRegister}" registered and enrolled successfully.` };

  } catch (error) {
    console.error(`Failed to register and enroll user "${userIdToRegister}": ${error.stack}`);
    throw error;
  }
}


// --- 기존 send 함수 (체인코드 호출) ---
// TODO: send 함수도 identity를 파라미터로 받아 동적으로 처리하는 것을 고려
const org1UserId = 'appUser'; // 이 부분은 registerAndEnrollUser로 생성된 사용자의 ID로 대체되어야 함
async function send(type, func, args, res, result) {
    try {
        const ccp = await getCcp();
        const wallet = await getWallet();
        console.log(`Wallet path: ${walletPath}`);

        // 현재는 'appUser'로 고정되어 있음. 실제로는 회원가입된 사용자의 ID를 사용해야 함.
        const identityToUse = org1UserId; // 또는 req.user.fabricId 등 요청 컨텍스트에서 가져옴
        const userIdentity = await wallet.get(identityToUse);
        if (!userIdentity) {
            console.error(`Identity for user "${identityToUse}" not found in wallet.`);
            return res.status(401).send({ error: `User identity "${identityToUse}" not found. Please register/enroll.` });
        }

        const gateway = new Gateway();
        try {
            await gateway.connect(ccp, {
                wallet,
                identity: identityToUse, // 동적 ID 사용
                discovery: { enabled: true, asLocalhost: (ccp.peers && Object.keys(ccp.peers).some(key => key.includes('localhost'))) }
            });
            console.log(`Successfully connected to network as ${identityToUse}`);

            const network = await gateway.getNetwork(channelName);
            const contract = network.getContract(chaincodeName);

            if (type) { // true: query, false: invoke
                console.log(`Evaluating transaction: ${func} with args: ${args}`);
                result = await contract.evaluateTransaction(func, ...args);
                console.log(`Transaction evaluated successfully. Result: ${result.toString()}`);
                // evaluateTransaction의 결과는 Buffer이므로, JSON으로 파싱 시도 전에 문자열로 변환 확인
                try {
                    // 결과가 JSON 문자열 형태일 경우 파싱 시도
                    res.json(JSON.parse(result.toString()));
                } catch (parseError) {
                    // JSON 파싱 실패 시 일반 문자열로 응답
                    res.send(result.toString());
                }
            } else {
                console.log(`Submitting transaction: ${func} with args: ${args}`);
                result = await contract.submitTransaction(func, ...args);
                // submitTransaction은 보통 결과로 아무것도 반환하지 않거나 (undefined), 트랜잭션 ID를 반환할 수 있음
                // 여기서는 성공 메시지만 반환
                console.log(`Transaction submitted successfully. Result (if any): ${result}`);
                res.json({ message: "Transaction submitted successfully", transactionId: result ? result.toString() : undefined });
            }
        } catch (error) {
            console.error(`Error during transaction processing for ${identityToUse}:`, error.stack);
            res.status(500).send({ error: `Failed to process transaction: ${error.message || error}` });
        } finally {
            if (gateway && typeof gateway.disconnect === 'function') {
                gateway.disconnect();
                console.log('Gateway disconnected.');
            }
        }
    } catch (error) {
        console.error('Error setting up gateway or wallet:', error.stack);
        res.status(500).send({ error: `Server setup error: ${error.message || error}` });
    }
}

module.exports = {
  send,
  enrollAdmin,
  registerAndEnrollUser,
  getWallet, // 외부에서 지갑 객체 접근이 필요할 경우 export
  getCcp    // 외부에서 CCP 객체 접근이 필요할 경우 export
};