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

  private getHtmlTemplate(
    title: string,
    message: string,
    template: string,
    verificationUrl?: string,
  ) {
    const templatePath = path.resolve(process.cwd(), `src/modules/mail/template/${template}.html`);
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
        : 'https://linkedoutapp.com/api/auth/register';

    const verificationUrl = `${baseVerificationUrl}?token=${token}`;
    const title = '안녕하세요! 링크드아웃에 가입해주셔서 감사합니다 :)';
    const message = `회원가입 완료를 위해 아래의 버튼을 클릭하세요.`;
    const htmlContent = this.getHtmlTemplate(title, message, 'signupTemplate', verificationUrl);

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 회원가입을 위한 이메일 인증입니다.',
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.resolve(process.cwd(), 'src/modules/mail/template/logo.png'),
          cid: 'logo',
          contentDisposition: 'inline',
        },
      ],
    });
  }

  async sendActiveComplete(to: string) {
    const title = '안녕하세요! 링크드아웃 입니다 :)';
    const message = `요청하신 관리자 계정이 활성화되어 사용하실 수 있습니다.`;
    const htmlContent = this.getHtmlTemplate(title, message, 'activeTemplate');

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '관리자 계정 활성화 완료.',
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.resolve(process.cwd(), 'src/modules/mail/template/logo.png'),
          cid: 'logo',
          contentDisposition: 'inline',
        },
      ],
    });
  }

  async sendPasswordResetEmail(to: string, token: string): Promise<void> {
    const env = this.configService.get<string>('ENV');
    const baseVerificationUrl =
      env === 'dev'
        ? 'http://localhost:3000/api/auth/password/reset-verify'
        : 'https://linkedoutapp.com/api/auth/password/reset-verify';

    const verificationUrl = `${baseVerificationUrl}?token=${token}`;
    const title = '안녕하세요! 링크드아웃 입니다 :)';
    const message = `비밀번호을 재설정 하시려면 아래의 버튼을 클릭하세요.`;
    const htmlContent = this.getHtmlTemplate(title, message, 'passwordTemplate', verificationUrl);

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 비밀번호 재설정을 위한 이메일 인증입니다.',
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.resolve(process.cwd(), 'src/modules/mail/template/logo.png'),
          cid: 'logo',
          contentDisposition: 'inline',
        },
      ],
    });
  }

  async updateEmail(to: string, token: string): Promise<void> {
    const env = this.configService.get<string>('ENV');
    const baseVerificationUrl =
      env === 'dev'
        ? 'http://localhost:3000/api/auth/change-email'
        : 'https://linkedoutapp.com/api/auth/change-email';

    const verificationUrl = `${baseVerificationUrl}?token=${token}`;
    const title = '안녕하세요! 링크드아웃 입니다 :)';
    const message = `이메일 변경을 완료를 위해 아래의 버튼을 클릭하세요.`;
    const htmlContent = this.getHtmlTemplate(
      title,
      message,
      'updateEmailTemplate',
      verificationUrl,
    );

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 서비스 이메일 변경 위한 이메일 인증입니다.',
      html: htmlContent,
      attachments: [
        {
          filename: 'logo.png',
          path: path.resolve(process.cwd(), 'src/modules/mail/template/logo.png'),
          cid: 'logo',
          contentDisposition: 'inline',
        },
      ],
    });
  }
}
