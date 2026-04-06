import { Injectable, OnModuleInit } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';

@Injectable()
export class MediaService implements OnModuleInit {
  private readonly uploadPath = path.resolve('uploads/chat');

  onModuleInit() {
    // Ensure upload directories exist
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
  }

  /**
   * Save a file from memory buffer (fallback for cases where diskStorage isn't used)
   */
  async saveLocalFile(file: Express.Multer.File): Promise<string> {
    // If file was already saved to disk by multer diskStorage, just return the filename
    if (file.filename) {
      return file.filename;
    }

    // Fallback: save from buffer (memory storage)
    const fileExt = path.extname(file.originalname) || '.webm';
    const fileName = `${Date.now()}-${Math.floor(Math.random() * 10000)}${fileExt}`;
    const filePath = path.join(this.uploadPath, fileName);

    return new Promise((resolve, reject) => {
      fs.writeFile(filePath, file.buffer, (err) => {
        if (err) return reject(err);
        resolve(fileName);
      });
    });
  }

  async getFileStream(
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string }> {
    const filePath = path.join(this.uploadPath, fileName);
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${fileName}`);
    }

    const stream = fs.createReadStream(filePath);
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';

    const mimeMap: Record<string, string> = {
      '.wav': 'audio/wav',
      '.mp3': 'audio/mpeg',
      '.m4a': 'audio/mp4',
      '.webm': 'audio/webm',
      '.ogg': 'audio/ogg',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.mp4': 'video/mp4',
    };

    contentType = mimeMap[ext] || contentType;

    return { stream, contentType };
  }

  async deleteFile(fileName: string): Promise<void> {
    const filePath = path.join(this.uploadPath, fileName);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}
