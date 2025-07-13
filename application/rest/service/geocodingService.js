
// application/rest/service/geocodingService.js
const NodeGeocoder = require('node-geocoder');
const logger = require('../config/logger');

// .env 파일에서 API 키를 로드하는 것을 권장합니다.
// const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const GOOGLE_API_KEY = 'AIzaSyDco6eiL8iltEdylzgCkpTHSjz-TzlBDXA'; // 임시 API 키

const options = {
  provider: 'google',
  apiKey: GOOGLE_API_KEY,
  formatter: null
};

const geocoder = NodeGeocoder(options);

const geocodingService = {
  async getCoordinates(address) {
    if (!address) {
      logger.warn('[GeocodingService] 주소가 제공되지 않았습니다.');
      return null;
    }

    try {
      const res = await geocoder.geocode(address);
      if (res.length > 0) {
        const { latitude, longitude } = res[0];
        logger.info(`[GeocodingService] 주소 변환 성공: "${address}" -> lat:${latitude}, lon:${longitude}`);
        return { latitude, longitude };
      } else {
        logger.warn(`[GeocodingService] 주소를 찾을 수 없습니다: "${address}"`);
        return null;
      }
    } catch (error) {
      logger.error(`[GeocodingService] Geocoding 오류: ${error.message}`, { address, stack: error.stack });
      // 프로덕션에서는 오류를 다르게 처리할 수 있습니다 (예: 재시도 로직).
      return null; 
    }
  }
};

module.exports = geocodingService;
