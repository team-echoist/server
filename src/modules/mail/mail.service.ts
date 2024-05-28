import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

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

  private getHtmlTemplate(title: string, message: string, verificationUrl: string) {
    const templatePath = path.resolve(
      process.cwd(),
      'src/modules/mail/template/emailTemplate.html',
    );
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace('{{title}}', title);
    html = html.replace('{{message}}', message);
    html = html.replace('{{verificationUrl}}', verificationUrl);
    return html;
  }

  async sendVerificationEmail(to: string, token: string): Promise<void> {
    const env = this.configService.get<string>('ENV');
    const baseVerificationUrl =
      env === 'dev'
        ? 'http://localhost:3000/api/auth/register'
        : 'https://www.linkedoutapp.com/api/auth/register';

    const verificationUrl = `${baseVerificationUrl}?token=${token}`;
    const title = '안녕하세요! 링크드아웃에 가입해주셔서 감사합니다 :)';
    const message = `회원가입 완료를 위해 아래의 버튼을 클릭하세요.`;
    const htmlContent = this.getHtmlTemplate(title, message, verificationUrl);

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 회원가입을 위한 이메일 인증입니다.',
      html: htmlContent,
      attachments: [
        {
          filename: 'img.png',
          path: path.resolve(process.cwd(), 'src/modules/mail/template/img.png'),
          cid: 'logo',
        },
      ],
    });
  }
}
