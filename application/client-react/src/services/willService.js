import axios from 'axios'; //백엔드 API 호출 모듈 (axios)

const registerWill = (data) => axios.post('/will/register', data);
const getMyWills = () => axios.get('/will/mywills');
const getWillDetails = (id) => axios.get(`/will/details/${id}`);

export default {
  registerWill,
  getMyWills,
  getWillDetails
};
