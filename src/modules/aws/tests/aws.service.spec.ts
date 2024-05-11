import { Test, TestingModule } from '@nestjs/testing';
import { AwsService } from '../aws.service';
import { ConfigService } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { Readable } from 'stream';

jest.mock('@aws-sdk/client-s3', () => {
  const sendMock = jest.fn().mockResolvedValue({
    $metadata: { httpStatusCode: 200 },
  });
  return {
    S3Client: jest.fn().mockImplementation(() => ({
      send: sendMock,
    })),
    PutObjectCommand: jest.fn(),
    sendMock,
  };
});

describe('AwsService', () => {
  let awsService: AwsService;
  let mockS3Client: jest.Mocked<S3Client>;
  const mockConfigService: ConfigService = {
    get: jest.fn((key: string) => {
      const configValues: Record<string, string> = {
        AWS_REGION: 'us-east-1',
        AWS_S3_ACCESS_KEY: 'ACCESS_KEY',
        AWS_S3_SECRET_ACCESS_KEY: 'SECRET_KEY',
        AWS_S3_BUCKET_NAME: 'bucket-name',
        AWS_CLOUD_FRONT: 'cloudfront.net',
      };
      return configValues[key];
    }),
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwsService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: S3Client, useValue: { send: jest.fn() } },
      ],
    }).compile();

    awsService = module.get<AwsService>(AwsService);
    mockS3Client = module.get(S3Client);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('정의 확인', () => {
    expect(awsService).toBeDefined();
    expect(mockConfigService).toBeDefined();
    expect(mockS3Client).toBeDefined();
  });

  // todo 외않되?
  // describe('imageUploadToS3', () => {
  //   it('should upload an image to S3 and return the URL', async () => {
  //     const fileName = 'testimage.png';
  //     const file = {
  //       buffer: Buffer.from('test file content'),
  //       originalname: 'testimage.png',
  //       encoding: '7bit',
  //       mimetype: 'image/png',
  //       size: 1024,
  //       fieldname: '',
  //       stream: new Readable(),
  //       destination: '',
  //       filename: '',
  //       path: '',
  //     };
  //     const ext = 'png';
  //
  //     const result = await awsService.imageUploadToS3(fileName, file, ext);
  //     expect(result).toEqual(`https://${mockConfigService.get('AWS_CLOUD_FRONT')}/${fileName}`);
  //     expect(mockS3Client.send).toHaveBeenCalled();
  //   });
  // });
});
