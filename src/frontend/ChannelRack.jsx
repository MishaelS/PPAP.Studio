import { useState } from 'react';
import { SAMPLES, findSample } from './samples.js';
import { DRAG_TYPE } from './SampleBrowser.jsx';

function droppedSample(e) {
  const id = e.dataTransfer.getData(DRAG_TYPE);
  return findSample(id);
}

function allowDrop(e) {
  if (e.dataTransfer.types.includes(DRAG_TYPE)) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
}

function ChannelName({ channel, onRename, onPreview }) {
  const [editing, setEditing] = useState(false);
  if (editing) {
    return (
      <input
        className="channel-name editing"
        defaultValue={channel.name}
        autoFocus
        maxLength={24}
        onBlur={(e) => {
          onRename(e.target.value);
          setEditing(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.target.blur();
          if (e.key === 'Escape') setEditing(false);
        }}
      />
    );
  }
  return (
    <button
      className="channel-name"
      onClick={onPreview}
      onDoubleClick={() => setEditing(true)}
      title="Клик — прослушать, двойной клик — переименовать"
    >
      {channel.name}
    </button>
  );
}

function ChannelRow({ channel, steps, step, anySolo, handlers }) {
  const [over, setOver] = useState(false);
  const { onToggle, onChange, onRemove, onClear, onPreview } = handlers;
  const silent = anySolo ? !channel.solo : channel.mute;

  return (
    <div
      className={`channel ${over ? 'drop' : ''} ${silent ? 'silent' : ''}`}
      onDragOver={(e) => { allowDrop(e); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        setOver(false);
        const s = droppedSample(e);
        if (!s) return;
        e.preventDefault();
        e.stopPropagation();
        onChange(channel.id, { sampleId: s.id, name: s.name });
      }}
    >
      <button
        className={`led ${channel.mute ? '' : 'on'}`}
        onClick={() => onChange(channel.id, { mute: !channel.mute })}
        title="Вкл / выкл канал"
      />
      <button
        className={`solo ${channel.solo ? 'on' : ''}`}
        onClick={() => onChange(channel.id, { solo: !channel.solo })}
        title="Solo"
      >
        S
      </button>
      <input
        className="knob pan"
        type="range"
        min={-1}
        max={1}
        step={0.01}
        value={channel.pan}
        onChange={(e) => onChange(channel.id, { pan: e.target.value })}
        onDoubleClick={() => onChange(channel.id, { pan: 0 })}
        title={`Панорама: ${Math.round(channel.pan * 100)} (двойной клик — центр)`}
      />
      <input
        className="knob vol"
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={channel.volume}
        onChange={(e) => onChange(channel.id, { volume: e.target.value })}
        onDoubleClick={() => onChange(channel.id, { volume: 0.8 })}
        title={`Громкость: ${Math.round(channel.volume * 100)}% (двойной клик — 80%)`}
      />
      <ChannelName
        channel={channel}
        onRename={(name) => onChange(channel.id, { name })}
        onPreview={() => onPreview(channel.sampleId)}
      />
      <select
        className="sample-select"
        value={channel.sampleId}
        onChange={(e) => onChange(channel.id, { sampleId: e.target.value })}
        title="Сэмпл канала"
      >
        {!findSample(channel.sampleId) && <option value={channel.sampleId}>? {channel.sampleId}</option>}
        {SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <div className="steps" style={{ '--steps': steps }}>
        {channel.pattern.map((on, i) => (
          <button
            key={i}
            className={[
              'step',
              Math.floor(i / 4) % 2 ? 'alt' : '',
              on ? 'on' : '',
              i === step ? 'play' : '',
            ].join(' ')}
            onClick={() => onToggle(channel.id, i)}
            aria-label={`Шаг ${i + 1}`}
          />
        ))}
      </div>

      <button className="icon" onClick={() => onClear(channel.id)} title="Очистить паттерн">⌫</button>
      <button className="icon" onClick={() => onRemove(channel.id)} title="Удалить канал">✕</button>
    </div>
  );
}

export default function ChannelRack({ project, step, onAdd, ...handlers }) {
  const [over, setOver] = useState(false);
  const anySolo = project.channels.some((c) => c.solo);

  return (
    <section className="rack">
      <div className="panel-title">Channel Rack</div>
      <div className="rack-body">
        {project.channels.map((c) => (
          <ChannelRow key={c.id} channel={c} steps={project.steps} step={step} anySolo={anySolo} handlers={handlers} />
        ))}
        <div
          className={`add-channel ${over ? 'drop' : ''}`}
          onDragOver={(e) => { allowDrop(e); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            setOver(false);
            const s = droppedSample(e);
            if (s) { e.preventDefault(); onAdd(s.id, s.name); }
          }}
        >
          <button onClick={() => onAdd('kick', 'Kick')}>+ Канал</button>
          <span>или перетащите сэмпл сюда</span>
        </div>
      </div>
    </section>
  );
}
