import xlsx from 'xlsx';
import AppError from './AppError.js';

/**
 * Parses an Excel buffer and returns an array of JSON objects.
 * @param {Buffer} fileBuffer - The buffer from the uploaded multer file.
 * @returns {Array<Object>}
 */
export const parseExcelToJSON = (fileBuffer) => {
  try {
    const workbook = xlsx.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Converts the first sheet to an array of objects
    const data = xlsx.utils.sheet_to_json(sheet, { raw: false });
    return data;
  } catch (error) {
    throw new AppError('Failed to parse Excel file. Please ensure the format is correct.', 400);
  }
};