import { sampleGroups } from './samples.js';
import { DRAG_SAMPLE_TYPE } from '../backend/constants.js';
import { t } from './i18n.js';
import Icon from './Icon.jsx';

export default function SampleBrowser({ onPreview }) {
  return (
    <aside className="browser">
      <div className="panel-title">{t('browser.title')}</div>
      {sampleGroups().map(([group, samples]) => (
        <div key={group} className="browser-group">
          <div className="browser-folder"><Icon name="folder" />{group}</div>
          {samples.map((s) => (
            <div
              key={s.id}
              className="browser-item"
              draggable
              onClick={() => onPreview(s.id)}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_SAMPLE_TYPE, s.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title={t('browser.itemHint')}
            >
              <Icon name="note" />{s.name}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
