import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  // constructor(private configService: ConfigService) {
  //   this.transporter = nodemailer.createTransport({
  //     service: this.configService.get<string>('EMAIL_SERVICE'),
  //     host: this.configService.get<string>('EMAIL_HOST'),
  //     port: this.configService.get<number>('EMAIL_PORT'),
  //     secure: this.configService.get<boolean>('EMAIL_SECURE'),
  //     auth: {
  //       user: this.configService.get<string>('EMAIL_USER'),
  //       pass: this.configService.get<string>('EMAIL_PASSWORD'),
  //     },
  //   });
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE,
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT, 10),
      secure: process.env.EMAIL_SECURE === 'true', // Assuming EMAIL_SECURE is a boolean-like string ('true'/'false')
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    // const env = this.configService.get<string>('ENV');
    const env = process.env.ENV;
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
