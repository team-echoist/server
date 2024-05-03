import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { DashboardResDto } from './dto/dashboardRes.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Admin')
@UseGuards(AuthGuard('jwt'), AdminGuard)
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get()
  @ApiOperation({
    summary: 'Dashboard',
    description:
      '총 가입자, 프리미엄 구독자, 오늘 가입자, 오늘자 에세이, 총 에세이, 발행된 에세이, 링크드아웃된 에세이, 처리되지않은 리포트, 처리되지 않은 리뷰',
  })
  @ApiResponse({ status: 200, type: DashboardResDto })
  async dashboard() {
    return await this.adminService.dashboard();
  }
}
