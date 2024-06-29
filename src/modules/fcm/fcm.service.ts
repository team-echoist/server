import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FcmService {
  constructor(private readonly configService: ConfigService) {
    const serviceAccount: ServiceAccount = {
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      privateKey: this.configService.get<string>('FIREBASE_PRIVATE_KEY').replace(/\\n/g, '\n'),
      clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    };

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  }

  async sendPushNotification(deviceToken: string, title: string, body: string) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: deviceToken,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
}
