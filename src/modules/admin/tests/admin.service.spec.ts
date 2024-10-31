import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from '../admin.service';
import { AdminRepository } from '../admin.repository';
import { UserRepository } from '../../user/user.repository';
import { EssayRepository } from '../../essay/essay.repository';
import { UserService } from '../../user/user.service';
import { MailService } from '../../mail/mail.service';
import { UtilsService } from '../../utils/utils.service';
import { AwsService } from '../../aws/aws.service';
import { SupportService } from '../../support/support.service';
import { SupportRepository } from '../../support/support.repository';
import { AlertService } from '../../alert/alert.service';
import { GeulroquisService } from '../../geulroquis/geulroquis.service';
import { CronService } from '../../cron/cron.service';
import { NicknameService } from '../../nickname/nickname.service';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('bull');
jest.mock('../admin.repository');
jest.mock('../../user/user.service');
jest.mock('../../user/user.repository');
jest.mock('../../essay/essay.repository');
jest.mock('../../support/support.repository');
jest.mock('../../utils/utils.service');
jest.mock('../../aws/aws.service');
jest.mock('../../mail/mail.service');
jest.mock('../../support/support.service');
jest.mock('../../alert/alert.service');
jest.mock('../../firebase/firebase.service');
jest.mock('../../geulroquis/geulroquis.service');
jest.mock('../../cron/cron.service');
jest.mock('../../nickname/nickname.service');

describe('AdminService', () => {
  let service: AdminService;
  let adminRepository: jest.Mocked<AdminRepository>;
  let userService: jest.Mocked<UserService>;
  let userRepository: jest.Mocked<UserRepository>;
  let essayRepository: jest.Mocked<EssayRepository>;
  let supportRepository: jest.Mocked<SupportRepository>;
  let utilsService: jest.Mocked<UtilsService>;
  let awsService: jest.Mocked<AwsService>;
  let mailService: jest.Mocked<MailService>;
  let supportService: jest.Mocked<SupportService>;
  let alertService: jest.Mocked<AlertService>;
  let geulroquisService: jest.Mocked<GeulroquisService>;
  let cronService: jest.Mocked<CronService>;
  let nicknameService: jest.Mocked<NicknameService>;

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    getex: jest.fn(),
  };

  beforeEach(async () => {
    const RedisInstance = jest.fn(() => mockRedis);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        AdminRepository,
        UserService,
        UserRepository,
        EssayRepository,
        MailService,
        UtilsService,
        AwsService,
        SupportService,
        SupportRepository,
        AlertService,
        GeulroquisService,
        NicknameService,
        CronService,
        { provide: 'default_IORedisModuleConnectionToken', useFactory: RedisInstance },
        {
          provide: 'BullQueue_admin',
          useValue: {
            add: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    adminRepository = module.get(AdminRepository) as jest.Mocked<AdminRepository>;
    userRepository = module.get(UserRepository) as jest.Mocked<UserRepository>;
    essayRepository = module.get(EssayRepository) as jest.Mocked<EssayRepository>;
    utilsService = module.get(UtilsService) as jest.Mocked<UtilsService>;
    essayRepository = module.get(EssayRepository) as jest.Mocked<EssayRepository>;
    supportRepository = module.get(SupportRepository) as jest.Mocked<SupportRepository>;
    awsService = module.get(AwsService) as jest.Mocked<AwsService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    supportService = module.get(SupportService) as jest.Mocked<SupportService>;

    utilsService.transformToDto.mockImplementation((_, any) => any);
    utilsService.extractPartContent.mockImplementation((any) => any);
  });
});
