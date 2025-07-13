// application/rest/controller/uploadController.js
const { upload } = require('../config/multerConfig');
const logger = require('../config/logger');
const path = require('path');

class UploadController {
  constructor() {
    this.uploadCertificateImages = this.uploadCertificateImages.bind(this);
  }

  // 자격증 이미지 업로드 (다중 파일)
  async uploadCertificateImages(req, res, next) {
    // multer 미들웨어 실행
    const uploadMiddleware = upload.array('certificateImages', 10); // 최대 10개 파일
    
    uploadMiddleware(req, res, (err) => {
      if (err) {
        logger.error(`[UploadController-uploadCertificateImages] 업로드 오류: ${err.message}`);
        
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            status: 'error',
            message: '파일 크기가 5MB를 초과했습니다.'
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            status: 'error',
            message: '최대 10개의 파일만 업로드 가능합니다.'
          });
        }
        
        return res.status(400).json({
          status: 'error',
          message: err.message || '파일 업로드 중 오류가 발생했습니다.'
        });
      }

      try {
        // 업로드된 파일이 없는 경우
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({
            status: 'error',
            message: '업로드할 파일이 없습니다.'
          });
        }

        // 업로드된 파일들의 URL 생성
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        const fileUrls = req.files.map(file => {
          return `${baseUrl}/uploads/certificates/${file.filename}`;
        });

        logger.info(`[UploadController-uploadCertificateImages] ${req.files.length}개 파일 업로드 완료`);

        res.status(200).json({
          status: 'success',
          message: `${req.files.length}개의 자격증 이미지가 성공적으로 업로드되었습니다.`,
          data: {
            imageUrls: fileUrls,
            uploadedFiles: req.files.map(file => ({
              originalName: file.originalname,
              filename: file.filename,
              size: file.size,
              mimetype: file.mimetype
            }))
          }
        });

      } catch (error) {
        logger.error(`[UploadController-uploadCertificateImages] 처리 오류: ${error.message}`, {
          stack: error.stack
        });
        next(error);
      }
    });
  }
}

module.exports = new UploadController();