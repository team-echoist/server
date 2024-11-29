import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request as ExpressRequest } from 'express';

import { JwtAuthGuard } from '../../../../common/guards/jwtAuth.guard';
import { OptionalParseIntPipe } from '../../../../common/pipes/optionalParseInt.pipe';
import { EssayService } from '../core/essay.service';
import { CreateEssayReqDto } from '../dto/request/createEssayReq.dto';
import { ThumbnailReqDto } from '../dto/request/ThumbnailReq.dto';
import { UpdateEssayReqDto } from '../dto/request/updateEssayReq.dto';
import { EssayResDto } from '../dto/response/essayRes.dto';
import { ThumbnailResDto } from '../dto/response/ThumbnailRes.dto';

@ApiTags('Essay-command')
@UseGuards(JwtAuthGuard)
@Controller('essays')
export class EssayCommandController {
  constructor(private readonly essayService: EssayService) {}

  @Post()
  @ApiOperation({
    summary: '에세이 작성',
    description: `
  사용자가 새로운 에세이를 작성하는 데 사용됩니다. 에세이는 다양한 상태를 가질 수 있으며, 모니터링 상태의 사용자는 특정 조건을 만족해야 합니다.
    
  **추가 정보:**
  - 에세이 작성 후, 사용된 태그에 따라 사용자 경험치가 증가합니다.
    - 각 태그는 특정 뱃지와 연관되어 있습니다.
    - 태그가 이미 사용된 경우 경험치가 증가하지 않습니다.
    - 태그가 처음 사용된 경우 경험치가 증가하며, 경험치가 10에 도달하면 레벨업이 가능합니다.

  **모니터링 유저의 경우:**
  - 에세이가 발행(public), 링크드아웃(linkedOut) 혹은 땅에묻기(burial) 상태일 때 리뷰 대기 상태로 전환됩니다.
  - 리뷰 대기 상태에서는 관리자가 에세이를 검토한 후에만 발행됩니다.

  **주의 사항:**
  - 요청 바디의 모든 필드 키는 필수이지만 특정 필드는 값이 비어있어도 됩니다(스키마 참조).
  - \`burial\` 요청의 경우 좌표 데이터가 필수로 필요합니다.
  `,
  })
  @ApiBody({
    type: CreateEssayReqDto,
    examples: {
      default: {
        summary: '요청 예시',
        value: {
          title: '올해도 솔로',
          content:
            '<p>2024년도 이제 한달정도 남았다.. 올해에는 특별한 사건없이 무난하게 흘러갔다.</p><p>밖에는 크리스마스가 곧 다가오다보니.. 크리스마스 트리가 한창이다.</p><p>놀러가고 싶은데.. 집에서 코딩이랑 게임만 하다보니 트렌드에 뒤쳐졌다..</p><p>놀러갈곳 추천해주는 ai가 있으면 참 좋을것 같다.</p><p>함만들어 볼까낫!!</p>',
          linkedOutGauge: 3,
          thumbnail: 'https://cdn.linkedoutapp.com/images/f389e79e-0973-43cc-9ad3-530730634cde',
          status: 'private',
          latitude: 37.5665,
          longitude: 126.978,
          location: '우리집',
          tags: ['기쁨', '행복', '생각'],
        },
      },
    },
  })
  @ApiResponse({ status: 201, type: EssayResDto })
  async saveEssay(@Req() req: ExpressRequest, @Body() createEssayDto: CreateEssayReqDto) {
    return this.essayService.saveEssay(req.user, req.device, createEssayDto);
  }

  @Put(':essayId')
  @ApiOperation({
    summary: '에세이 업데이트',
    description: `
  기존에 작성한 에세이를 업데이트합니다. 요청자는 에세이의 작성자여야 하며, 모니터링된 사용자일 경우 에세이 상태 변경에 제약이 있을 수 있습니다.
  \`location\` 은 변경할 수 있지만 좌표를 변경할 수 없습니다.

  **경로 파라미터:**
  - \`essayId\` (number, required): 업데이트할 에세이의 ID

  **요청 바디:**
  - \`title\` (string): 에세이 제목
  - \`content\` (string): 에세이 내용
  - \`tags\` (string[]): 태그 목록
  - \`linkedOutGauge\` (number): 링크드아웃 게이지
  - \`storyId\` (number): 스토리 ID
  - \`status\` (string): 에세이 상태 (예: public, private, linkedout)
  - \`location\` (string): 장소 이름

  **동작 과정:**
  1. 요청자의 ID로 사용자 엔티티를 조회합니다.
  2. 요청된 스토리 ID와 태그 목록으로 스토리와 태그를 조회합니다.
  3. 에세이 ID로 에세이를 조회하고, 에세이가 현재 검토 중인지 확인합니다.
  4. 모니터링된 사용자이고 에세이 상태가 PRIVATE이 아닌 경우, 검토 요청을 생성합니다.
  5. 에세이 데이터를 업데이트하고, 태그 경험치를 추가합니다.
  6. 업데이트된 에세이를 반환합니다.

  **주의 사항:**
  - 요청자는 에세이의 작성자여야 합니다.
  - 작성시 등록한 좌표는 변경할 수 없습니다.
  - 에세이가 검토 중인 경우, PRIVATE 상태가 아니면 업데이트가 거부됩니다.
  - 모니터링된 사용자는 PRIVATE 상태 외의 변경에 제약이 있을 수 있습니다.
  - 썸네일 변경의 경우 \`썸네일 업로드\` api를 사용해주세요.
  `,
  })
  @ApiBody({
    type: UpdateEssayReqDto,
    examples: {
      default: {
        summary: '요청 예시',
        value: {
          title: '올해도 솔로',
          content:
            '<p>2024년도 이제 한달정도 남았다.. 올해에는 특별한 사건없이 무난하게 흘러갔다.</p><p>밖에는 크리스마스가 곧 다가오다보니.. 크리스마스 트리가 한창이다.</p><p>놀러가고 싶은데.. 집에서 코딩이랑 게임만 하다보니 트렌드에 뒤쳐졌다..</p><p>놀러갈곳 추천해주는 ai가 있으면 참 좋을것 같다.</p><p>함만들어 볼까낫!!</p>',
          linkedOutGauge: 3,
          thumbnail: 'https://cdn.linkedoutapp.com/images/f389e79e-0973-43cc-9ad3-530730634cde',
          status: 'private',
          location: '우리집',
          tags: ['기쁨', '행복', '생각'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, type: EssayResDto })
  async updateEssay(
    @Req() req: ExpressRequest,
    @Param('essayId', ParseIntPipe) essayId: number,
    @Body() updateEssayDto: UpdateEssayReqDto,
  ) {
    return this.essayService.updateEssay(req.user, essayId, updateEssayDto);
  }

  @Post('images')
  @ApiOperation({
    summary: '썸네일 업로드',
    description: `
  에세이 작성 혹은 이미 작성 완료된 에세이 썸네일 수정에 사용됩니다.

  **쿼리 파라미터:**
  - \`essayId\` (선택): 썸네일을 업로드할 에세이의 ID. 이 값이 주어지지 않으면 새로운 이미지(경로)를 생성합니다.

  **동작 과정:**
  1. \`essayId\`가 제공되면 해당 에세이의 썸네일을 업데이트합니다.
  2. 새로운 이미지 파일을 S3에 업로드합니다.
  3. 업로드된 이미지의 URL을 반환합니다.

  **주의 사항:**
  - 에세이 ID가 제공되지 않으면 새로운 UUID를 생성하여 이미지를 저장합니다.
  `,
  })
  @ApiResponse({ status: 201, type: ThumbnailResDto })
  @UseInterceptors(FileInterceptor('image'))
  @ApiBody({ type: ThumbnailReqDto })
  async saveThumbnail(
    @UploadedFile() file: Express.Multer.File,
    @Body('essayId', OptionalParseIntPipe) essayId?: number,
  ) {
    return this.essayService.saveThumbnail(file, essayId);
  }

  @Delete('images/:essayId')
  @ApiOperation({
    summary: '썸네일 삭제',
    description: `
  지정된 에세이의 썸네일 이미지를 삭제합니다.

  **경로 파라미터:**
  - \`essayId\`: 썸네일을 삭제할 에세이의 ID.

  **동작 과정:**
  1. 에세이를 ID로 조회하여 썸네일이 있는지 확인합니다.
  2. 썸네일이 존재하면 S3에서 이미지를 삭제합니다.
  3. 에세이의 썸네일 필드를 null로 업데이트합니다.
  4. 썸네일 삭제 성공 메시지를 반환합니다.

  **주의 사항:**
  - 썸네일이 없는 에세이에 대해 삭제 요청을 하면, 404 Not Found 에러를 반환합니다.
  `,
  })
  @ApiResponse({ status: 204 })
  async deleteThumbnail(@Param('essayId', ParseIntPipe) essayId: number) {
    return this.essayService.deleteThumbnail(essayId);
  }

  @Delete(':essayId')
  @ApiOperation({
    summary: '에세이 삭제',
    description: `
  경로 파라미터로 제공받은 식별자(에세이)를 삭제합니다. 에세이는 논리적으로 삭제되며, 실제 데이터는 유지되지만 삭제된 것으로 표시됩니다.

  **경로 파라미터:**
  - \`essayId\`: 삭제할 에세이의 ID (필수)

  **동작 과정:**
  1. 에세이 ID와 사용자 ID를 기반으로 에세이를 조회합니다.
  2. 에세이가 존재하지 않거나 사용자가 에세이의 작성자가 아닌 경우 오류를 반환합니다.
  3. 에세이를 논리적으로 삭제합니다 (deletedDate 필드를 현재 날짜로 설정).

  **주의 사항:**
  - 사용자는 본인이 작성한 에세이만 삭제할 수 있습니다.
  - 논리 삭제를 통해 실제 데이터는 유지되며, 이후 복구가 가능합니다.
  `,
  })
  @ApiResponse({ status: 200 })
  async deleteEssay(@Req() req: ExpressRequest, @Param('essayId', ParseIntPipe) essayId: number) {
    await this.essayService.deleteEssay(req.user.id, essayId);
  }
}
