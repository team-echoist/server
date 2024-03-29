import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { UserResDto } from '../user/dto/userRes.dto';
import { User } from '../../entities/user.entity';

@Injectable()
export class AuthService {
  generateJWT(user: UserResDto | User): string {
    const secretKey = process.env.JWT_SECRET || 'your-secret-key';
    const options = { expiresIn: '30m' };

    return jwt.sign({ username: user.email, id: user.id }, secretKey, options);
  }
}
