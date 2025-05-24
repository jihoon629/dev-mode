import axios from 'axios'; //백엔드 API 호출 모듈 (axios)
axios.defaults.baseURL = 'http://localhost:8001';

const registerWill = (data) => axios.post('/register', data);
const getMyWills = () => axios.get('/mywills');
const getWillDetails = (id) => axios.get(`/details/${id}`);

const extractTextFromImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/ocr/extract-text', formData);
};
const loginUser = (credentials) => axios.post('/auth/login', credentials); // { username, password }

const registerUser = (userData) => axios.post('/auth/register', userData); // { username, password }

export default {
  registerWill,
  getMyWills,
  getWillDetails,
  extractTextFromImage,
  loginUser,
  registerUser

};