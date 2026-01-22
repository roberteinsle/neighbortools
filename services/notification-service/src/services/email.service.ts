import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import type { Language } from '@neighbortools/shared-types';

const prisma = new PrismaClient();

interface EmailOptions {
  to: string;
  subject: string;
  templateKey: string;
  data: Record<string, any>;
  language?: Language;
}

interface SmtpSettings {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  fromEmail: string;
  fromName: string;
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private templateCache: Map<string, Handlebars.TemplateDelegate> = new Map();

  async getSmtpConfig(): Promise<SmtpSettings | null> {
    // Try environment variables first
    if (process.env.SMTP_HOST) {
      return {
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        fromEmail: process.env.SMTP_FROM || 'noreply@neighbortools.net',
        fromName: process.env.SMTP_FROM_NAME || 'NeighborTools',
      };
    }

    // Fall back to database config
    const config = await prisma.smtpConfig.findFirst({
      where: { isActive: true },
    });

    if (!config) return null;

    return {
      host: config.host,
      port: config.port,
      secure: config.secure,
      user: config.user,
      password: config.password,
      fromEmail: config.fromEmail,
      fromName: config.fromName,
    };
  }

  async initializeTransporter(): Promise<boolean> {
    const config = await this.getSmtpConfig();

    if (!config) {
      console.warn('No SMTP configuration found');
      return false;
    }

    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: {
        user: config.user,
        pass: config.password,
      },
    });

    return true;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const { to, subject, templateKey, data, language = 'EN' } = options;

    // Create email log entry
    const emailLog = await prisma.emailLog.create({
      data: {
        recipient: to,
        subject,
        templateKey,
        status: 'PENDING',
      },
    });

    try {
      // Initialize transporter if needed
      if (!this.transporter) {
        const initialized = await this.initializeTransporter();
        if (!initialized) {
          throw new Error('SMTP not configured');
        }
      }

      // Get SMTP config for from address
      const config = await this.getSmtpConfig();
      if (!config) {
        throw new Error('SMTP not configured');
      }

      // Load and compile template
      const html = await this.renderTemplate(templateKey, language, data);

      // Send email
      await this.transporter!.sendMail({
        from: `"${config.fromName}" <${config.fromEmail}>`,
        to,
        subject,
        html,
      });

      // Update email log
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'SENT',
          sentAt: new Date(),
        },
      });

      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Update email log with error
      await prisma.emailLog.update({
        where: { id: emailLog.id },
        data: {
          status: 'FAILED',
          error: errorMessage,
        },
      });

      console.error(`Failed to send email to ${to}:`, errorMessage);
      return false;
    }
  }

  async renderTemplate(
    templateKey: string,
    language: Language,
    data: Record<string, any>
  ): Promise<string> {
    const cacheKey = `${templateKey}_${language}`;

    // Check cache
    if (this.templateCache.has(cacheKey)) {
      return this.templateCache.get(cacheKey)!(data);
    }

    // Load template
    const langCode = language.toLowerCase();
    const templatePath = path.join(
      process.cwd(),
      'src',
      'templates',
      langCode,
      `${templateKey}.hbs`
    );

    let templateContent: string;
    try {
      templateContent = await fs.readFile(templatePath, 'utf-8');
    } catch {
      // Fallback to English
      const fallbackPath = path.join(
        process.cwd(),
        'src',
        'templates',
        'en',
        `${templateKey}.hbs`
      );
      templateContent = await fs.readFile(fallbackPath, 'utf-8');
    }

    // Compile and cache
    const template = Handlebars.compile(templateContent);
    this.templateCache.set(cacheKey, template);

    return template(data);
  }

  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.transporter) {
        const initialized = await this.initializeTransporter();
        if (!initialized) {
          return { success: false, error: 'SMTP not configured' };
        }
      }

      await this.transporter!.verify();
      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return { success: false, error: errorMessage };
    }
  }

  clearTransporter(): void {
    this.transporter = null;
  }
}
