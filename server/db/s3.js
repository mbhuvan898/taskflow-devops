const AWS    = require('aws-sdk');
const multer = require('multer');
const multerS3 = require('multer-s3');
require('dotenv').config();

const s3 = new AWS.S3({
  accessKeyId:     process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region:          process.env.AWS_REGION || 'us-east-1',
});

const ALLOWED = [
  'image/jpeg','image/png','image/gif','image/webp',
  'application/pdf','text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/* Multer + S3 storage */
const upload = multer({
  storage: multerS3({
    s3,
    bucket:      process.env.S3_BUCKET,
    acl:         'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    metadata: (req, file, cb) =>
      cb(null, { uploadedBy: req.user?.id || 'anon' }),
    key: (req, file, cb) => {
      const ext  = file.originalname.split('.').pop();
      const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      cb(null, `taskflow/${req.user?.id || 'anon'}/${Date.now()}-${safe}`);
    },
  }),
  limits:     { fileSize: 10 * 1024 * 1024 },   // 10 MB
  fileFilter: (req, file, cb) =>
    ALLOWED.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error(`File type not allowed: ${file.mimetype}`)),
});

/* Delete a file from S3 by its public URL */
async function deleteFile(url) {
  if (!url) return;
  try {
    const key = decodeURIComponent(url.split('.amazonaws.com/')[1]);
    await s3.deleteObject({ Bucket: process.env.S3_BUCKET, Key: key }).promise();
  } catch (e) {
    console.warn('S3 delete skipped:', e.message);
  }
}

module.exports = { upload, deleteFile, s3 };
