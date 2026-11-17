import { useEffect, useRef, useState } from 'react';
import { BPM_WHEEL_STEP, MAX_BPM, MIN_BPM, PROJECT_NAME_MAX, STEP_OPTIONS, cx } from '../backend/constants.js';
import { LANGUAGES, LOCALES, t } from './i18n.js';
import Icon from './Icon.jsx';
import { ICONS } from './icons.js';
import MenuBar from './MenuBar.jsx';

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

  const menus = [
    {
      id: 'file',
      label: t('menu.file'),
      items: [
        { id: 'new', label: t('toolbar.new'), icon: 'file-new', onSelect: props.onNew },
        { separator: true },
        { id: 'import', label: t('toolbar.import'), icon: 'upload', onSelect: () => fileRef.current.click() },
        { id: 'export-json', label: t('toolbar.exportJson'), icon: 'download', onSelect: props.onExport },
        { separator: true },
        {
          id: 'export-wav',
          label: busy ? t('toolbar.rendering') : t('toolbar.exportWav'),
          icon: 'wave',
          disabled: busy,
          onSelect: props.onExportWav,
        },
      ],
    },
    {
      id: 'settings',
      label: t('menu.settings'),
      items: [
        { heading: t('language.title'), icon: 'globe' },
        ...LANGUAGES.map((l) => ({
          id: `lang-${l}`,
          label: LOCALES[l]['language.name'],
          checked: props.lang === l,
          onSelect: () => props.onLanguage(l),
        })),
      ],
    },
  ];

  return (
    <header className="toolbar">
      <div className="logo"><img src={ICONS.logo} alt="" />PPAP<span>.Studio</span></div>

      <div className="toolbar-center">
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
        <input
          className="project-name"
          value={project.name}
          onChange={(e) => props.onName(e.target.value)}
          maxLength={PROJECT_NAME_MAX}
          title={t('toolbar.projectName')}
        />
      </div>

      <MenuBar menus={menus} />
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
    </header>
  );
}
