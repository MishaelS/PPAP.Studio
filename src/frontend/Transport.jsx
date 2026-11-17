import { useEffect, useRef, useState } from 'react';
import { MAX_BPM, MIN_BPM, STEP_OPTIONS } from './project.js';

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
        onChange(value + (e.deltaY < 0 ? 1 : -1));
      }}
      title="BPM (колесо мыши меняет на 1)"
    />
  );
}

export default function Transport(props) {
  const { project, playing, busy } = props;
  const fileRef = useRef(null);

  return (
    <header className="toolbar">
      <div className="logo">PPAP<span>.Studio</span></div>

      <div className="group">
        <button className={`play ${playing ? 'active' : ''}`} onClick={props.onPlay} title="Play / Stop (пробел)">
          {playing ? '■' : '▶'}
        </button>
        <label className="field">
          <span>BPM</span>
          <BpmInput value={project.bpm} onChange={props.onBpm} />
        </label>
        <label className="field">
          <span>Шаги</span>
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
          maxLength={60}
          title="Название проекта"
        />
      </div>

      <div className="group">
        <button onClick={props.onNew}>Новый</button>
        <button onClick={() => fileRef.current.click()}>Импорт</button>
        <button onClick={props.onExport}>Экспорт JSON</button>
        <button className="accent" onClick={props.onExportWav} disabled={busy}>
          {busy ? 'Рендер…' : 'Экспорт WAV'}
        </button>
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
