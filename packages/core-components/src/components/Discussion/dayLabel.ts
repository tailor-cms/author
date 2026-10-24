import { formatDate } from 'date-fns/format';
import { isThisYear } from 'date-fns/isThisYear';
import { isToday } from 'date-fns/isToday';
import { isYesterday } from 'date-fns/isYesterday';

// "Today", "Yesterday", or the date, with the year once it is not this one
export const dayLabel = (date: Date) => {
  if (isToday(date)) return 'Today';
  if (isYesterday(date)) return 'Yesterday';
  return formatDate(date, isThisYear(date) ? 'd MMMM' : 'd MMMM yyyy');
};
