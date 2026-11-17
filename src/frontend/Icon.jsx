import { cx } from '../backend/constants.js';

const files = import.meta.glob('../../resources/icons/*.svg', { eager: true, query: '?url', import: 'default' });

export const ICONS = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
);

// Monochrome icon tinted with the current text color via CSS mask.
export default function Icon({ name, className }) {
  const url = ICONS[name];
  if (!url) return null;
  return <span className={cx('ico', className)} style={{ '--icon': `url("${url}")` }} aria-hidden="true" />;
}
