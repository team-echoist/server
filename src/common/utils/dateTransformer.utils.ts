import * as moment from 'moment-timezone';
import { ValueTransformer } from 'typeorm';

export const KSTTransformer: ValueTransformer = {
  to: (value: Date) => {
    if (value) {
      return moment(value).utc().toDate();
    }
    return value;
  },
  from: (value: string) => {
    if (value) {
      return moment(value).tz('Asia/Seoul').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }
    return value;
  },
};
