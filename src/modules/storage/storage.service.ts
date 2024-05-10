import { Injectable } from '@nestjs/common';
import * as path from 'path';
import { UserRepository } from '../user/user.repository';

@Injectable()
export class StorageService {
  constructor(private readonly userRepository: UserRepository) {}

  async uploadProfileImage(userId: number, file: Express.Multer.File) {
    const imageUrl: string = path.join('profile', file.filename);
    return this.userRepository.profileImageUpload(userId, imageUrl);
  }
}
