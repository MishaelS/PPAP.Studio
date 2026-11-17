import { cx } from '../backend/constants.js';
import { ICONS } from './icons.js';

// Monochrome icon tinted with the current text color via CSS mask.
export default function Icon({ name, className }) {
  const url = ICONS[name];
  if (!url) return null;
  return <span className={cx('ico', className)} style={{ '--icon': `url("${url}")` }} aria-hidden="true" />;
}
