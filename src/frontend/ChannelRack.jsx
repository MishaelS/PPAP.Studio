import { useState } from 'react';
import { SAMPLES, findSample } from './samples.js';
import {
  CHANNEL_NAME_MAX, DEFAULT_PAN, DEFAULT_SAMPLE, DEFAULT_VOLUME, DRAG_SAMPLE_TYPE, KNOB_STEP, PAN_RANGE,
  STEPS_PER_GROUP, VOLUME_RANGE, cx, percent,
} from '../backend/constants.js';
import { t } from './i18n.js';
import Icon from './Icon.jsx';

function droppedSample(e) {
  const id = e.dataTransfer.getData(DRAG_SAMPLE_TYPE);
  return findSample(id);
}

function allowDrop(e) {
  if (e.dataTransfer.types.includes(DRAG_SAMPLE_TYPE)) {
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
        maxLength={CHANNEL_NAME_MAX}
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
      title={t('rack.nameHint')}
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
      className={cx('channel', over && 'drop', silent && 'silent')}
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
        className={cx('led', !channel.mute && 'on')}
        onClick={() => onChange(channel.id, { mute: !channel.mute })}
        title={t('rack.enable')}
      />
      <button
        className={cx('solo', channel.solo && 'on')}
        onClick={() => onChange(channel.id, { solo: !channel.solo })}
        title={t('rack.solo')}
      >
        S
      </button>
      <input
        className="knob pan"
        type="range"
        min={PAN_RANGE[0]}
        max={PAN_RANGE[1]}
        step={KNOB_STEP}
        value={channel.pan}
        onChange={(e) => onChange(channel.id, { pan: e.target.value })}
        onDoubleClick={() => onChange(channel.id, { pan: DEFAULT_PAN })}
        title={t('rack.pan', { value: percent(channel.pan) })}
      />
      <input
        className="knob vol"
        type="range"
        min={VOLUME_RANGE[0]}
        max={VOLUME_RANGE[1]}
        step={KNOB_STEP}
        value={channel.volume}
        onChange={(e) => onChange(channel.id, { volume: e.target.value })}
        onDoubleClick={() => onChange(channel.id, { volume: DEFAULT_VOLUME })}
        title={t('rack.volume', { value: percent(channel.volume), default: percent(DEFAULT_VOLUME) })}
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
        title={t('rack.sample')}
      >
        {!findSample(channel.sampleId) && <option value={channel.sampleId}>? {channel.sampleId}</option>}
        {SAMPLES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>

      <div className="steps" style={{ '--steps': steps }}>
        {channel.pattern.map((on, i) => (
          <button
            key={i}
            className={cx(
              'step',
              Math.floor(i / STEPS_PER_GROUP) % 2 && 'alt',
              on && 'on',
              i === step && 'play',
            )}
            onClick={() => onToggle(channel.id, i)}
            aria-label={t('rack.step', { n: i + 1 })}
          />
        ))}
      </div>

      <button className="icon" onClick={() => onClear(channel.id)} title={t('rack.clear')}><Icon name="clear" /></button>
      <button className="icon" onClick={() => onRemove(channel.id)} title={t('rack.remove')}><Icon name="close" /></button>
    </div>
  );
}

export default function ChannelRack({ project, step, onAdd, ...handlers }) {
  const [over, setOver] = useState(false);
  const anySolo = project.channels.some((c) => c.solo);

  return (
    <section className="rack">
      <div className="panel-title">{t('rack.title')}</div>
      <div className="rack-body">
        {project.channels.map((c) => (
          <ChannelRow key={c.id} channel={c} steps={project.steps} step={step} anySolo={anySolo} handlers={handlers} />
        ))}
        <div
          className={cx('add-channel', over && 'drop')}
          onDragOver={(e) => { allowDrop(e); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => {
            setOver(false);
            const s = droppedSample(e);
            if (s) { e.preventDefault(); onAdd(s.id, s.name); }
          }}
        >
          <button onClick={() => onAdd(DEFAULT_SAMPLE.id, DEFAULT_SAMPLE.name)}><Icon name="plus" />{t('rack.addChannel')}</button>
          <span>{t('rack.dropHint')}</span>
        </div>
      </div>
    </section>
  );
}
