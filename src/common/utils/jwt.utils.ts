import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

export const generateJWT = (id: number, email: string): string => {
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '1440m' }; // todo 귀찮아서 일단 길게해놓음
  return jwt.sign({ id: id, email: email }, secretKey, options);
};
