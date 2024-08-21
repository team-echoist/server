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

  private getHtmlTemplate(title: string, message: string, template: string, options?: string) {
    const templatePath = path.resolve(process.cwd(), `src/modules/mail/template/${template}.html`);
    let html = fs.readFileSync(templatePath, 'utf8');
    html = html.replace(/{{title}}/g, title);
    html = html.replace(/{{message}}/g, message);

    if (options.startsWith('http://') || options.startsWith('https://')) {
      html = html.replace(/{{verificationUrl}}/g, options);
    } else {
      html = html.replace(/{{sixDigit}}/g, options);
    }
    return html;
  }

  async sendVerificationEmail(to: string, code: string): Promise<void> {
    const title = '안녕하세요! 요청하신 인증번호를 보내드립니다:)';
    const message = `아래의 인증번호 6자리를 인증번호 입력창에 입력해주세요`;
    const htmlContent = this.getHtmlTemplate(title, message, 'verifyTemplate', code);

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 인증번호 안내',
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

  async sendPasswordResetEmail(to: string, code: string): Promise<void> {
    const title = '안녕하세요! 링크드아웃에서 요청하신 임시 비밀번호를 보내드립니다:)';
    const message = `아래의 임시 비밀번호를 이용해 로그인 후 비밀번호를 변경해주세요`;
    const htmlContent = this.getHtmlTemplate(title, message, 'verifyTemplate', code);

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '링크드아웃 비밀번호 재설정',
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
      subject: '관리자 계정 활성화',
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

  async rootAuthenticationEmail(to: string, token: string): Promise<void> {
    const env = this.configService.get<string>('ENV');
    const baseVerificationUrl =
      env === 'dev'
        ? 'http://localhost:3000/api/admin/root/super/init'
        : 'https://linkedoutapp.com/api/admin/root/super/init';

    const verificationUrl = `${baseVerificationUrl}?token=${token}`;
    const title = '안녕하세요! 링크드아웃 입니다 :)';
    const message = `루트관리자 인증을 위한 메일입니다. 아래 링크를 클릭시 돌이킬 수 없는 치명적인 작업이 실행됩니다. 신중하게 결정하세요.`;
    const htmlContent = this.getHtmlTemplate(
      title,
      message,
      'rootAuthMailTemplate',
      verificationUrl,
    );

    await this.transporter.sendMail({
      from: `"LinkedOut" <linkedoutapp@gmail.com>`,
      to: to,
      subject: '',
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
