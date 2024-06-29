import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FcmService {
  constructor(private readonly configService: ConfigService) {
    const serviceAccount = JSON.parse(this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT'));

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
