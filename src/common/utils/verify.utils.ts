export async function generateToken(): Promise<string> {
  const { randomBytes } = await import('crypto');
  return randomBytes(16).toString('hex');
}
