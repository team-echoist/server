import { ValueTransformer } from 'typeorm';
import * as moment from 'moment-timezone';

export const KSTTransformer: ValueTransformer = {
  to: (value: Date) => {
    return moment(value).utc().toDate();
  },
  from: (value: string) => {
    return moment(value).tz('Asia/Seoul').format();
  },
};
