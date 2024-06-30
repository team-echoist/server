import { Injectable } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class FcmService {
  constructor(private readonly awsService: AwsService) {}

  async onModuleInit() {
    try {
      const serviceAccount = await this.awsService.getServiceAccountKey();
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
    } catch (error) {
      console.error('Failed to load service account key file from S3:', error);
      throw error;
    }
  }

  async sendPushAlert(deviceToken: string, title: string, body: string) {
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
