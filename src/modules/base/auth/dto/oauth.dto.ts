import { IsString } from 'class-validator';

export class OauthDto {
  @IsString()
  platform!: string;

  @IsString()
  platformId!: string;

  @IsString()
  email?: string | null;

  @IsString()
  accessToken?: string;
}
