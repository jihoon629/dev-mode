// application/rest/ocrController.js
const vision = require('@google-cloud/vision');
const path = require('path'); // path 모듈은 여전히 유용합니다.


if (typeof Headers === 'undefined') {
    global.Headers = require('node-fetch').Headers;
  }
  if (typeof fetch === 'undefined') {
    global.fetch = require('node-fetch');
  }

// Vision API 클라이언트 인스턴스 생성
// gcp-credentials.json 파일이 ocrController.js와 같은 디렉토리에 있는 경우
const keyFilePath = path.join(__dirname, 'gcp-credentials.json');

let client;
try {
  client = new vision.ImageAnnotatorClient({
    keyFilename: keyFilePath,
  });
  console.log("Vision API 클라이언트가 성공적으로 초기화되었습니다. 키 파일:", keyFilePath); // 초기화 성공 로그 추가
} catch (error) {
  console.error("Vision API 클라이언트 초기화 실패. 서비스 계정 키 파일 경로를 확인하세요:", keyFilePath, error);
}

const extractText = async (req, res) => {
  if (!client) {
    return res.status(500).json({ error: "OCR 서비스 초기화에 실패했습니다. 서버 설정을 확인하세요." });
  }
  if (!req.file) {
    return res.status(400).json({ error: "파일이 업로드되지 않았습니다." });
  }
  if (!req.file.buffer) {
    return res.status(400).json({ error: "업로드된 파일에 데이터가 없습니다." });
  }

  try {
    const imageContent = req.file.buffer.toString('base64');

    // documentTextDetection은 이미지 객체 자체를 인자로 받을 수 있습니다.
    const [result] = await client.documentTextDetection({
        image: { content: imageContent },
    });

    const fullTextAnnotation = result.fullTextAnnotation;

    let extractedText = "";
    if (fullTextAnnotation && fullTextAnnotation.text) {
      extractedText = fullTextAnnotation.text;
      console.log("Vision API에서 텍스트 추출 성공:", extractedText.substring(0, 100) + "..."); // 추출된 텍스트 일부 로깅
    } else {
      extractedText = "";
      console.log("Vision API에서 텍스트를 감지하지 못했습니다.");
    }

    res.json({ text: extractedText });

  } catch (error) {
    console.error("Google Cloud Vision API 처리 중 오류 발생:", error); // 오류 메시지 명확화
    res.status(500).json({
      error: "OCR 처리 중 서버에서 오류가 발생했습니다.",
      details: error.message
    });
  }
};

module.exports = {
  extractText,
};