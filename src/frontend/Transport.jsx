import { useEffect, useRef, useState } from 'react';
import { BPM_WHEEL_STEP, MAX_BPM, MIN_BPM, PROJECT_NAME_MAX, STEP_OPTIONS, cx } from '../backend/constants.js';
import { LANGUAGES, LOCALES, t } from './i18n.js';
import Icon, { ICONS } from './Icon.jsx';

function BpmInput({ value, onChange }) {
  const [text, setText] = useState(String(value));
  useEffect(() => setText(String(value)), [value]);
  const commit = () => {
    onChange(text);
    setText(String(value));
  };
  return (
    <input
      className="bpm"
      type="number"
      min={MIN_BPM}
      max={MAX_BPM}
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => e.key === 'Enter' && e.target.blur()}
      onWheel={(e) => {
        e.target.blur();
        onChange(value + (e.deltaY < 0 ? BPM_WHEEL_STEP : -BPM_WHEEL_STEP));
      }}
      title={t('toolbar.bpmHint', { step: BPM_WHEEL_STEP })}
    />
  );
}

export default function Transport(props) {
  const { project, playing, busy } = props;
  const fileRef = useRef(null);

  return (
    <header className="toolbar">
      <div className="logo"><img src={ICONS.logo} alt="" />PPAP<span>.Studio</span></div>

      <div className="group">
        <button className={cx('play', playing && 'active')} onClick={props.onPlay} title={t('toolbar.playStop')}>
          <Icon name={playing ? 'stop' : 'play'} />
        </button>
        <label className="field">
          <span>{t('toolbar.bpm')}</span>
          <BpmInput value={project.bpm} onChange={props.onBpm} />
        </label>
        <label className="field">
          <span>{t('toolbar.steps')}</span>
          <select value={project.steps} onChange={(e) => props.onSteps(Number(e.target.value))}>
            {STEP_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
      </div>

      <div className="group grow">
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => props.onName(e.target.value)}
          maxLength={PROJECT_NAME_MAX}
          title={t('toolbar.projectName')}
        />
      </div>

      <div className="group">
        <button onClick={props.onNew}><Icon name="file-new" />{t('toolbar.new')}</button>
        <button onClick={() => fileRef.current.click()}><Icon name="upload" />{t('toolbar.import')}</button>
        <button onClick={props.onExport}><Icon name="download" />{t('toolbar.exportJson')}</button>
        <button className="accent" onClick={props.onExportWav} disabled={busy}>
          <Icon name="wave" />{busy ? t('toolbar.rendering') : t('toolbar.exportWav')}
        </button>
        <select value={props.lang} onChange={(e) => props.onLanguage(e.target.value)} title={t('language.title')}>
          {LANGUAGES.map((l) => <option key={l} value={l}>{LOCALES[l]['language.name']}</option>)}
        </select>
        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => {
            const file = e.target.files[0];
            e.target.value = '';
            if (file) props.onImport(file);
          }}
        />
      </div>
    </header>
  );
}
