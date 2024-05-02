import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

@Injectable()
export class OptionalBoolPipe implements PipeTransform<string, boolean | undefined> {
  transform(value: string | undefined, metadata: ArgumentMetadata): boolean | undefined {
    if (value === '' || value === 'false') {
      return false;
    }
    if (value === 'true') {
      return true;
    } else {
      throw new BadRequestException(`Invalid boolean value for ${metadata.data}`);
    }
  }
}
