import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { AwsService } from '../aws/aws.service';

@Injectable()
export class FirebaseService {
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

  async sendPushAlert(fcmToken: string, title: string, body: string) {
    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: fcmToken,
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // async verifyUserToken(userToken: string): Promise<admin.auth.DecodedIdToken> {
  //   try {
  //     return await admin.auth().verifyIdToken(userToken);
  //   } catch (error) {
  //     throw new UnauthorizedException('Invalid Firebase token');
  //   }
  // }
}
