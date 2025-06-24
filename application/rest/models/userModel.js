// application/rest/models/userModel.js
const { dbPool } = require('../config');
const bcrypt = require('bcryptjs');

const User = {
  async create(username, email, password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    try {
      const [result] = await dbPool.query(sql, [username, email, hashedPassword]);
      return { id: result.insertId, username, email };
    } catch (error) {
      console.error('Error creating user:', error);
      throw error; // 이메일 중복 시 ER_DUP_ENTRY 발생 가능
    }
  },

  // username으로 사용자 찾기 (여러 명일 수 있으나, 보통 첫 번째 또는 특정 조건으로 찾음)
  // Google 로그인 시 username 생성에 사용될 수 있으므로 유지
  async findByUsername(username) {
    const sql = 'SELECT * FROM users WHERE username = ? LIMIT 1'; // 중복 가능하므로 LIMIT 1 추가 (선택적)
    try {
      const [rows] = await dbPool.query(sql, [username]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by username:', error);
      throw error;
    }
  },

  async findByEmail(email) { // 이메일은 UNIQUE해야 함
    const sql = 'SELECT * FROM users WHERE email = ?';
    try {
      const [rows] = await dbPool.query(sql, [email]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  },

  async findById(id) {
    const sql = 'SELECT id, username, email, created_at, google_id FROM users WHERE id = ?';
    try {
      const [rows] = await dbPool.query(sql, [id]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      throw error;
    }
  },

  async comparePassword(candidatePassword, hashedPasswordFromDb) {
    if (!hashedPasswordFromDb) return false;
    return bcrypt.compare(candidatePassword, hashedPasswordFromDb);
  },

  async findByGoogleId(googleId) {
    const sql = 'SELECT * FROM users WHERE google_id = ?';
    try {
      const [rows] = await dbPool.query(sql, [googleId]);
      return rows.length > 0 ? rows[0] : null;
    } catch (error)
 {
      console.error('Error finding user by googleId:', error);
      throw error;
    }
  },

  async findOrCreateByGoogle({ googleId, email, username }) {
    let user = await this.findByGoogleId(googleId);
    if (user) {
      return user;
    }

    user = await this.findByEmail(email); // 이메일로 기존 사용자 확인 (이메일은 UNIQUE)
    if (user) {
      if (!user.google_id) {
        const updateGoogleIdSql = 'UPDATE users SET google_id = ? WHERE id = ?';
        await dbPool.query(updateGoogleIdSql, [googleId, user.id]);
        user.google_id = googleId;
        console.log(`기존 사용자 ${email} (ID: ${user.id})에게 Google ID ${googleId}를 연결했습니다.`);
      } else if (user.google_id !== googleId) {
        console.error(`Error: Email ${email} is already associated with a different Google ID.`);
        throw new Error(`이메일 ${email}은(는) 이미 다른 Google 계정과 연결되어 있습니다.`);
      }
      return user;
    }

    // 새로운 Google 사용자를 위한 username 생성 로직
    // username이 중복될 수 있으므로, 생성 시 _숫자를 붙여 고유하게 만들려는 시도는 유지하는 것이 좋음
    let finalUsername = username;
    if (!finalUsername || finalUsername.trim() === "") {
        finalUsername = email.split('@')[0];
    }
    const baseUsername = finalUsername;
    let counter = 1;
    // DB에서 username UNIQUE 제약이 없어도, 시스템적으로는 덜 헷갈리게 하려면 중복 방지 시도 가능
    // 하지만 username이 이제 고유하지 않아도 된다면, 이 while 루프가 꼭 필요할지는 고민 필요.
    // 여기서는 일단 기존 로직(같은 username으로 Google 가입 시 _숫자 붙이기) 유지
    let tempUser = await this.findByUsername(finalUsername);
    while (tempUser && tempUser.google_id !== googleId) { // 다른 사람의 username과 겹치는지 확인
      finalUsername = `${baseUsername}_${counter++}`;
      tempUser = await this.findByUsername(finalUsername);
    }


    const insertSql = 'INSERT INTO users (username, email, google_id, password) VALUES (?, ?, ?, NULL)';
    try {
      const [result] = await dbPool.query(insertSql, [finalUsername, email, googleId]);
      return { id: result.insertId, username: finalUsername, email, google_id: googleId };
    } catch (error) {
      console.error('Error creating user via Google:', error);
      // ER_DUP_ENTRY는 이제 이메일 중복 시에만 발생해야 함 (username UNIQUE 제약 제거)
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('이미 사용 중인 이메일입니다. (DB)');
      }
      throw error;
    }

    
  }


  
};

module.exports = User;