import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class OptionalBoolPipe implements PipeTransform<string, boolean | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): boolean | undefined {
    if (value === '' || value === undefined) {
      return undefined;
    }
    if (value === 'false') {
      return false;
    }
    if (value === 'true') {
      return true;
    } else {
      throw new BadRequestException(`${metadata.data}에 대한 부울 값이 잘못되었습니다.`);
    }
  }
}
