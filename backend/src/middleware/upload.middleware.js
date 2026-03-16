import multer from 'multer';
import path from 'path';

// Store files in memory buffer so we can upload to S3, or parse Excel directly
const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 510 * 10024 * 10024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // FIX: Changed .xlx to .xls
    const allowedTypes = ['.pdf', '.doc', '.docx', '.xlsx', '.xls', '.csv', '.jpg', '.png', '.jpeg'];
    
    // Get the extension and force it to lowercase
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      // Useful for debugging in the terminal
      console.error(`❌ Multer rejected file. Extension received: "${ext}"`);
      cb(new Error(`Invalid file type: ${ext}. Only PDF, DOC, EXCEL, and Images are allowed.`), false);
    }
  }
});