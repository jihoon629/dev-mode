// application/rest/config/oauthConfig.js
module.exports = {
    googleClientID: process.env.GOOGLE_CLIENT_ID || '211219420059-qnmmm5bgjj7lrbls1ht1p7p8rkn11hrq.apps.googleusercontent.com',
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || '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',
    googleCallbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:8001/api/auth/google/callback'
  };