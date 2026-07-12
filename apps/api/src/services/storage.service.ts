import fs from "fs";
import path from "path";
import { env } from "../config/env";
import logger from "../utils/logger";

export interface IStorageService {
  saveFile(fileName: string, buffer: Buffer): Promise<string>;
  deleteFile(fileUrl: string): Promise<void>;
}

class LocalStorageService implements IStorageService {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(env.LOCAL_UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
      logger.info(`[Storage] Created upload directory at: ${this.uploadDir}`);
    }
  }

  async saveFile(fileName: string, buffer: Buffer): Promise<string> {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(fileName)}`;
    const filePath = path.join(this.uploadDir, uniqueName);
    
    await fs.promises.writeFile(filePath, buffer);
    logger.info(`[Storage] File saved: ${uniqueName}`);
    
    // Return relative URL for static file serving
    return `/uploads/${uniqueName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);
    
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      logger.info(`[Storage] File deleted: ${fileName}`);
    } else {
      logger.warn(`[Storage] Attempted to delete non-existent file: ${fileName}`);
    }
  }
}

export const storageService = new LocalStorageService();
export default storageService;
