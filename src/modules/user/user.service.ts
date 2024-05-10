import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { UserRepository } from './user.repository';
import Redis from 'ioredis';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userRepository: UserRepository,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
  ) {}

  async saveProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findById(userId);
    const newExt = file.originalname.split('.').pop();

    let fileName: any;
    if (user.profileImage) {
      const urlParts = user.profileImage.split('/');
      fileName = urlParts[urlParts.length - 1];
    } else {
      const imageName = this.utilsService.getUUID();
      fileName = `${imageName}`;
    }

    const imageUrl = await this.awsService.imageUploadToS3(fileName, file, newExt);
    user.profileImage = imageUrl;
    await this.userRepository.saveUser(user);

    return { imageUrl };
  }
}
