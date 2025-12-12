import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import crypto from 'crypto';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const access = promisify(fs.access);

export interface FileUploadResult {
  filename: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export class FileStorageService {
  private uploadDir: string;
  private maxFileSize: number; // in bytes
  private allowedMimeTypes: string[];

  constructor() {
    this.uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
    this.maxFileSize = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default
    this.allowedMimeTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'image/jpeg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-zip-compressed',
    ];
  }

  /**
   * Initialize upload directory
   */
  async initialize() {
    try {
      await access(this.uploadDir);
    } catch {
      await mkdir(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate file
   */
  validateFile(file: Express.Multer.File): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new Error(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`
      );
    }

    // Check mime type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new Error(`File type ${file.mimetype} is not allowed`);
    }
  }

  /**
   * Generate unique filename
   */
  generateFilename(originalFilename: string): string {
    const ext = path.extname(originalFilename);
    const hash = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now();
    return `${timestamp}-${hash}${ext}`;
  }

  /**
   * Save file to disk
   */
  async saveFile(file: Express.Multer.File): Promise<FileUploadResult> {
    await this.initialize();

    // Validate file
    this.validateFile(file);

    // Generate unique filename
    const filename = this.generateFilename(file.originalname);
    const filePath = path.join(this.uploadDir, filename);

    // Save file
    await writeFile(filePath, file.buffer);

    // Generate file URL (relative path)
    const fileUrl = `/uploads/${filename}`;

    return {
      filename,
      fileUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
    };
  }

  /**
   * Delete file from disk
   */
  async deleteFile(filename: string): Promise<void> {
    const filePath = path.join(this.uploadDir, filename);

    try {
      await access(filePath);
      await unlink(filePath);
    } catch (error) {
      // File doesn't exist or can't be deleted
      console.error(`Failed to delete file ${filename}:`, error);
    }
  }

  /**
   * Get file path
   */
  getFilePath(filename: string): string {
    return path.join(this.uploadDir, filename);
  }

  /**
   * Check if file exists
   */
  async fileExists(filename: string): Promise<boolean> {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export const fileStorageService = new FileStorageService();
