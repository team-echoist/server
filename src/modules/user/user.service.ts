import { Injectable } from '@nestjs/common';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';
import { plainToInstance } from 'class-transformer';
import { UtilsService } from '../utils/utils.service';
import { AwsService } from '../aws/aws.service';
import { UserRepository } from './user.repository';
import { UserResDto } from './dto/response/userRes.dto';
import { UpdateUserReqDto } from './dto/request/updateUserReq.dto';
import { UpdateFullUserReqDto } from '../admin/dto/request/updateFullUserReq.dto';
import { ProfileImageResDto } from './dto/response/profileImageRes.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly userRepository: UserRepository,
    private readonly utilsService: UtilsService,
    private readonly awsService: AwsService,
  ) {}

  async findUserById(userId: number) {
    return this.userRepository.findUserById(userId);
  }

  async saveProfileImage(userId: number, file: Express.Multer.File) {
    const user = await this.userRepository.findUserById(userId);
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

    return plainToInstance(ProfileImageResDto, imageUrl, { excludeExtraneousValues: true });
  }

  async updateUser(userId: number, data: UpdateUserReqDto | UpdateFullUserReqDto) {
    const user = await this.userRepository.findUserById(userId);
    if (data.password) {
      data.password = await bcrypt.hash(data.password, 10);
    }
    const updatedUser = await this.userRepository.updateUser(user, data);
    return plainToInstance(UserResDto, updatedUser, { excludeExtraneousValues: true });
  }
}
