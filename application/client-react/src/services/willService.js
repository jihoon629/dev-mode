import axios from 'axios'; //백엔드 API 호출 모듈 (axios)
axios.defaults.baseURL = 'http://localhost:8001';

const registerWill = (data) => axios.post('/register', data);
const getWillDetails = async (id, username) => {
  if (!id) throw new Error("Will ID is required.");
  if (!username) throw new Error("Username is required for fetching will details.");

  try {
    // 백엔드 컨트롤러 경로: /api/details/:willId?username=someuser
    // API_URL을 사용하여 전체 URL 구성
    const response = await axios.get(`/details/${id}`, { 
      params: { username } 
    });
    return response.data; 
  } catch (error) {
    console.error(`willService.getWillDetails: Failed for ID ${id}, user ${username}`, error.response?.data || error.message);
    // 에러 객체에 response가 있을 경우, 해당 내용을 포함하여 throw 할 수 있습니다.
    // 이렇게 하면 호출부에서 좀 더 상세한 에러 정보를 얻을 수 있습니다.
    if (error.response) {
        throw error.response; 
    }
    throw error;
  }
};

const getMyWills = async (username) => {
  if (!username) {
    // 이 검사는 WillList.js에서도 하지만, 서비스 함수 자체에서도 방어적으로 추가하는 것이 좋습니다.
    console.error("willService.getMyWills: Username is required.");
    // 에러를 throw 하거나, 빈 배열/특정 에러 객체를 반환할 수 있습니다.
    // 여기서는 호출하는 쪽에서 try-catch로 처리한다고 가정하고 에러를 throw합니다.
    throw new Error("Username is required to fetch wills.");
  }

  try {
    // 컨트롤러에서 설정한 엔드포인트: /api/wills/my-wills
    // axios.get(url, { params: { key: value } }) 형태로 쿼리 파라미터를 전달합니다.
    const response = await axios.get('/wills/my-wills', {
      params: {
        username: username // /api/wills/my-wills?username=someuser 형태의 요청이 됨
      }
    });
    // 컨트롤러에서 res.status(200).json(myWills) 형태로 응답하므로,
    // response.data에 실제 유언장 목록이 들어있습니다.
    return response.data;
  } catch (error) {
    // API 호출 실패 시 에러 로깅 및 재throw 또는 커스텀 에러 처리
    console.error(`willService.getMyWills: Failed to fetch wills for ${username}`, error.response?.data || error.message);
    throw error; // 에러를 다시 throw하여 호출부(WillList.js)에서 처리하도록 함
  }
};
const extractTextFromImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  return axios.post('/ocr/extract-text', formData);
};
const loginUser = (credentials) => axios.post('/auth/login', credentials); // { username, password }

const registerUser = (userData) => axios.post('/auth/register', userData); // { username, password }

    const queryByName = (username) => axios.get(`/queryByName/${username}`); // 수정된 코드

export default {
  registerWill,
  getMyWills,
  getWillDetails,
  extractTextFromImage,
  loginUser,
  registerUser,
  queryByName

};