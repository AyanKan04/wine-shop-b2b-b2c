const express = require('express');
const router = express.Router();
const upload = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/authMiddleware');

// Endpoint to upload a file (image, document, etc.)
router.post('/', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một tệp để tải lên.' });
  }

  // Construct the URL to access the uploaded file
  // Using the request protocol and host ensures it works across environments
  // Since we use express.static('/uploads', ...), the path is simply /uploads/filename
  const fileUrl = `/uploads/${req.file.filename}`;

  res.status(200).json({
    success: true,
    message: 'Tải lên thành công!',
    file_url: fileUrl,
    file_name: req.file.originalname
  });
});

module.exports = router;
