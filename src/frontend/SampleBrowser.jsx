import { sampleGroups } from './samples.js';

export const DRAG_TYPE = 'application/x-ppap-sample';

export default function SampleBrowser({ onPreview }) {
  return (
    <aside className="browser">
      <div className="panel-title">Браузер</div>
      {sampleGroups().map(([group, samples]) => (
        <div key={group} className="browser-group">
          <div className="browser-folder">▾ {group}</div>
          {samples.map((s) => (
            <div
              key={s.id}
              className="browser-item"
              draggable
              onClick={() => onPreview(s.id)}
              onDragStart={(e) => {
                e.dataTransfer.setData(DRAG_TYPE, s.id);
                e.dataTransfer.effectAllowed = 'copy';
              }}
              title="Клик — прослушать, перетащите в Channel Rack"
            >
              ♪ {s.name}
            </div>
          ))}
        </div>
      ))}
    </aside>
  );
}
