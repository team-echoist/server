import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: this.configService.get<string>('EMAIL_SERVICE'),
      host: this.configService.get<string>('EMAIL_HOST'),
      port: this.configService.get<number>('EMAIL_PORT'),
      secure: this.configService.get<boolean>('EMAIL_SECURE'),
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const env = this.configService.get<string>('ENV');
    const baseVerificationUrl =
      env === 'dev'
        ? 'http://localhost:3000/api/auth/register'
        : 'https://linkedoutapp.com/api/auth/register';
    const verificationUrl = `${baseVerificationUrl}?token=${token}`;

    await this.transporter.sendMail({
      from: `"Supported by Linked-out" <linkedoutapp@gmail.com>`,
      to: to,
      subject: 'Verify Your Email',
      html: `Click here to verify your email: <a href="${verificationUrl}">${verificationUrl}</a>`,
    });
  }
}
