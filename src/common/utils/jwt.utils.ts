import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

export const generateJWT = (id: number, email: string, black: boolean): string => {
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '30m' };
  return jwt.sign({ id: id, email: email, black: black }, secretKey, options);
};
