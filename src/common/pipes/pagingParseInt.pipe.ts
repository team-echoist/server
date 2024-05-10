import { ArgumentMetadata, BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

@Injectable()
export class PagingParseIntPipe implements PipeTransform<string, number | undefined> {
  constructor(private defaultValue: number) {}
  transform(value: string, metadata: ArgumentMetadata): number | undefined {
    if (value === '') return this.defaultValue;

    const val = parseInt(value, 10);
    if (isNaN(val)) {
      throw new BadRequestException('Validation failed');
    }
    return val;
  }
}
