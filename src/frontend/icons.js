const files = import.meta.glob('../../resources/icons/*.svg', { eager: true, query: '?url', import: 'default' });

export const ICONS = Object.fromEntries(
  Object.entries(files).map(([path, url]) => [path.split('/').pop().replace('.svg', ''), url]),
);
