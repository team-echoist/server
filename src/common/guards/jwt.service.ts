import * as jwt from 'jsonwebtoken';
import { UserResDto } from '../../modules/user/dto/userRes.dto';

export const generateJWT = (user: UserResDto): string => {
  const secretKey = process.env.JWT_SECRET || 'your-secret-key';
  const options = { expiresIn: '30m' };

  return jwt.sign({ username: user.email, id: user.id }, secretKey, options);
};
