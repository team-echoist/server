import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

import { PageType } from '../types/enum.types';

@Injectable()
export class PageTypeEnumPipe implements PipeTransform {
  transform(value: any): PageType {
    if (value === 'published') {
      return PageType.PUBLIC;
    }

    if (!Object.values(PageType).includes(value)) {
      throw new BadRequestException(`${value}: 유효한 페이지 유형이 아닙니다.`);
    }

    return value;
  }
}
