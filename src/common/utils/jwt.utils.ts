import jwt from 'jsonwebtoken';

export const generateJWT = (id: number, email: string): string => {
  const secretKey = process.env.JWT_SECRET;
  const options = { expiresIn: '30m' };
  return jwt.sign({ id: id, email: email }, secretKey, options);
};
