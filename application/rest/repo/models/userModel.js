// application/rest/models/userModel.js (TypeORM 버전 - 예시)
const bcrypt = require('bcryptjs');
const logger = require('../../config/logger'); // 경로 수정 가능성
const { AppDataSource } = require('../../config/dbConfig'); // 수정된 경로 (AppDataSource 또는 dbConfig.js에서 export하는 객체 이름 사용)
const { UserEntity } = require('../entity/user.entity');
// User Repository 가져오기
const userRepository = AppDataSource.getRepository(UserEntity);

const UserModel = { // 객체 이름을 UserModel 등으로 변경하여 구분 (선택 사항)
  async create(username, email, password, role) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = password ? await bcrypt.hash(password, salt) : null; // 소셜 로그인의 경우 비번 없을 수 있음

    const newUser = userRepository.create({ // 엔티티 객체 생성
      username,
      email,
      password: hashedPassword,
      role,
      // provider는 기본값이 엔티티에 설정되어 있다면 생략 가능, 아니면 명시
      // provider: 'local', // 예시
    });

    try {
      await userRepository.save(newUser); // 데이터베이스에 저장
      logger.info(`[UserModel-create] 사용자 생성 완료. Email: ${email}, 역할: ${role}`);
      // save 후 newUser 객체에는 id 등 DB에서 생성된 값들이 채워집니다.
      return newUser;
    } catch (error) {
      logger.error(`[UserModel-create] 오류: ${error.message}`, { username, email, role, stack: error.stack });
      if (error.code === 'ER_DUP_ENTRY' || (error.driverError && error.driverError.code === 'ER_DUP_ENTRY')) { // TypeORM 오류 구조 확인 필요
        // ER_DUP_ENTRY는 MySQL/MariaDB 드라이버 레벨의 오류 코드입니다.
        // TypeORM은 이를 감싸서 다른 형태로 제공할 수 있으므로, 실제 오류 객체를 보고 확인해야 합니다.
        // 예를 들어, error.message.includes('UQ_SOME_CONSTRAINT_NAME') 등으로 특정 유니크 제약 조건 위반을 확인할 수도 있습니다.
        if (error.message.includes('users.email_unique') || error.message.includes('UQ_97672ac88f789774dd47f7c8be3')) { // 실제 제약조건 이름 확인 필요
            throw new Error(`이미 사용 중인 이메일 주소입니다: ${email}`);
        } else if (error.message.includes('users.username_unique') || error.message.includes('UQ_IDX_...')) { // username 유니크 제약조건이 있다면
            throw new Error(`이미 사용 중인 사용자 이름입니다: ${username}`);
        }
      }
      throw error;
    }
  },

  async findByUsername(username) {
    try {
      // findOneBy는 조건에 맞는 첫 번째 엔티티를 찾거나 없으면 null 반환
      const user = await userRepository.findOneBy({ username: username });
      return user;
    } catch (error) {
      logger.error(`[UserModel-findByUsername] 오류: ${error.message}`, { username, stack: error.stack });
      throw error;
    }
  },

  async findByEmail(email) {
    try {
      const user = await userRepository.findOneBy({ email: email });
      return user;
    } catch (error) {
      logger.error(`[UserModel-findByEmail] 오류: ${error.message}`, { email, stack: error.stack });
      throw error;
    }
  },

  async findById(id) {
    try {
      // PK로 조회 시 findOneBy({ id: id }) 또는 findOne({ where: { id: id } }) 사용
      const user = await userRepository.findOneBy({ id: id });
      return user;
    } catch (error) {
      logger.error(`[UserModel-findById] 오류: ${error.message}`, { id, stack: error.stack });
      throw error;
    }
  },

  async comparePassword(candidatePassword, hashedPasswordFromDb) {
    if (!hashedPasswordFromDb) return false;
    return bcrypt.compare(candidatePassword, hashedPasswordFromDb);
  },

  async findByGoogleId(googleId) {
    try {
      const user = await userRepository.findOneBy({ google_id: googleId });
      return user;
    } catch (error) {
      logger.error(`[UserModel-findByGoogleId] 오류: ${error.message}`, { googleId, stack: error.stack });
      throw error;
    }
  },

  // findOrCreateByGoogle는 로직이 좀 더 복잡하므로, 여러 Repository 메소드를 조합해야 합니다.
  async findOrCreateByGoogle({ googleId, email, username }) {
    try {
      let user = await this.findByGoogleId(googleId);
      if (user) {
        logger.info(`[UserModel-Google] 기존 Google ID 사용자 찾음. Email: ${user.email}`);
        return user;
      }

      user = await this.findByEmail(email);
      if (user) {
        if (!user.google_id) {
          user.google_id = googleId;
          await userRepository.save(user); // 기존 user 객체 업데이트
          logger.info(`[UserModel-Google] 기존 사용자 ${email} (ID: ${user.id})에게 Google ID ${googleId}를 연결했습니다.`);
        } else if (user.google_id !== googleId) {
          logger.error(`[UserModel-Google] 이메일 ${email}은(는) 이미 다른 Google ID(${user.google_id})와 연결되어 있습니다. 요청된 Google ID: ${googleId}`);
          throw new Error(`이메일 ${email}은(는) 이미 다른 Google 계정과 연결되어 있습니다.`);
        }
        return user;
      }

      // 사용자 이름 중복 처리 로직은 유지될 수 있음
      let finalUsername = username;
      if (!finalUsername || finalUsername.trim() === "") {
          finalUsername = email.split('@')[0];
      }
      const baseUsername = finalUsername;
      let counter = 1;
      let tempUser = await this.findByUsername(finalUsername);
      while (tempUser) { // google_id 조건은 여기서 빼고, 단순히 username 중복만 체크
        finalUsername = `${baseUsername}_${counter++}`;
        tempUser = await this.findByUsername(finalUsername);
      }
      
      const defaultRoleForNewGoogleUser = 'worker';
      logger.info(`[UserModel-Google] 신규 Google 사용자 생성 시도. Email: ${email}, Username: ${finalUsername}, 기본 역할: ${defaultRoleForNewGoogleUser}`);

      const newUser = userRepository.create({
        username: finalUsername,
        email,
        google_id: googleId,
        role: defaultRoleForNewGoogleUser,
        provider: 'google' // provider 명시
        // password는 NULL 허용이므로, 소셜 로그인은 비워둠
      });
      await userRepository.save(newUser);
      logger.info(`[UserModel-Google] 신규 Google 사용자 생성 완료. ID: ${newUser.id}`);
      return newUser;

    } catch (error) {
      logger.error(`[UserModel-Google] 생성/조회 오류: ${error.message}`, { googleId, email, username, stack: error.stack });
      // 중복 오류 처리는 create 메소드와 유사하게 처리 가능
      if (error.code === 'ER_DUP_ENTRY' || (error.driverError && error.driverError.code === 'ER_DUP_ENTRY')) {
         if (error.message.includes('users.email_unique') ) { // 실제 제약조건 이름 확인 필요
            throw new Error(`이미 사용 중인 이메일 주소입니다: ${email}`);
        } else if (error.message.includes('users.username_unique')) { // username 유니크 제약조건이 있다면
            throw new Error(`이미 사용 중인 사용자 이름입니다: ${username}`);
        } else if (error.message.includes('users.google_id_unique')) {
            throw new Error('이미 사용 중인 Google ID 입니다.');
        }
      }
      throw error;
    }
  },

  async update(id, updateData) {
    try {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('사용자를 찾을 수 없습니다.');
      }

      const updateFields = {};
      if (updateData.username !== undefined) updateFields.username = updateData.username;
      if (updateData.email !== undefined) updateFields.email = updateData.email;
      if (updateData.role !== undefined) updateFields.role = updateData.role;
      
      // 비밀번호 업데이트 시 해시 처리
      if (updateData.password !== undefined) {
        if (updateData.password) {
          const salt = await bcrypt.genSalt(10);
          updateFields.password = await bcrypt.hash(updateData.password, salt);
        } else {
          updateFields.password = null;
        }
      }

      const result = await userRepository.update(id, updateFields);
      
      if (result.affected === 0) {
        throw new Error('사용자 업데이트에 실패했습니다.');
      }

      logger.info(`[UserModel-update] 사용자 업데이트 완료. ID: ${id}`);
      return await this.findById(id);
      
    } catch (error) {
      logger.error(`[UserModel-update] 오류: ${error.message}`, { id, updateData, stack: error.stack });
      
      if (error.code === 'ER_DUP_ENTRY' || (error.driverError && error.driverError.code === 'ER_DUP_ENTRY')) {
        if (error.message.includes('users.email_unique')) {
          throw new Error(`이미 사용 중인 이메일 주소입니다: ${updateData.email}`);
        } else if (error.message.includes('users.username_unique')) {
          throw new Error(`이미 사용 중인 사용자 이름입니다: ${updateData.username}`);
        }
      }
      throw error;
    }
  }
};

module.exports = UserModel; // UserModel로 export