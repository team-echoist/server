import { Test, TestingModule } from '@nestjs/testing';

import { AwsService } from '../../../adapters/aws/core/aws.service';
import { GeulroquisService } from '../../../extensions/essay/geulroquis/core/geulroquis.service';
import { AlertService } from '../../../extensions/management/alert/core/alert.service';
import { SupportService } from '../../../extensions/management/support/core/support.service';
import { SupportRepository } from '../../../extensions/management/support/infrastructure/support.repository';
import { CronService } from '../../../utils/cron/core/cron.service';
import { MailService } from '../../../utils/mail/core/mail.service';
import { NicknameService } from '../../../utils/nickname/core/nickname.service';
import { ToolService } from '../../../utils/tool/core/tool.service';
import { EssayRepository } from '../../essay/infrastructure/essay.repository';
import { UserService } from '../../user/core/user.service';
import { UserRepository } from '../../user/infrastructure/user.repository';
import { AdminService } from '../core/admin.service';
import { AdminRepository } from '../infrastructure/admin.repository';

jest.mock('typeorm-transactional', () => ({
  initializeTransactionalContext: jest.fn(),
  patchTypeORMRepositoryWithBaseRepository: jest.fn(),
  Transactional: () => (target, key, descriptor: any) => descriptor,
}));
jest.mock('bull');
jest.mock('../infrastructure/admin.repository');
jest.mock('../../user/core/user.service');
jest.mock('../../user/infrastructure/user.repository');
jest.mock('../../essay/infrastructure/essay.repository');
jest.mock('../../support/support.repository');
jest.mock('../../util/util.service');
jest.mock('../../aws/core/aws.service');
jest.mock('../../mail/mail.service');
jest.mock('../../support/support.service');
jest.mock('../../alert/core/alert.service');
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
  let utilsService: jest.Mocked<ToolService>;
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
        ToolService,
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
    utilsService = module.get(ToolService) as jest.Mocked<ToolService>;
    essayRepository = module.get(EssayRepository) as jest.Mocked<EssayRepository>;
    supportRepository = module.get(SupportRepository) as jest.Mocked<SupportRepository>;
    awsService = module.get(AwsService) as jest.Mocked<AwsService>;
    mailService = module.get(MailService) as jest.Mocked<MailService>;
    supportService = module.get(SupportService) as jest.Mocked<SupportService>;

    utilsService.transformToDto.mockImplementation((_, any) => any);
    utilsService.extractPartContent.mockImplementation((any) => any);
  });
});
