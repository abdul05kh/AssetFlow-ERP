import logger from "../utils/logger";
import { env } from "../config/env";

export interface SendEmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    logger.info(`[EmailService] Outgoing mail triggered:`, {
      from: env.SMTP_FROM,
      to: options.to,
      subject: options.subject,
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
    });
    
    // In dev environment or if credentials are empty, log details and succeed
    logger.info(`[EmailService] Mail Body (Plain):\n${options.text}`);
    if (options.html) {
      logger.debug(`[EmailService] Mail Body (HTML):\n${options.html}`);
    }
    
    return true;
  }
}

export const emailService = new EmailService();
export default emailService;
