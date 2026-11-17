import { useEffect, useRef, useState } from 'react';
import { AudioEngine } from './audio.js';
import * as P from './project.js';
import { downloadBlob, exportProject, importProject, loadProject, saveProject } from './storage.js';
import {
  AUTOSAVE_DELAY_MS, KEY_PLAY, NO_STEP, WAV_FILE_EXT, isTypingTarget, safeFileName,
} from '../backend/constants.js';
import { getLanguage, setLanguage, t } from './i18n.js';
import Icon from './Icon.jsx';
import Transport from './Transport.jsx';
import ChannelRack from './ChannelRack.jsx';
import SampleBrowser from './SampleBrowser.jsx';

const initial = loadProject();

export default function App() {
  const engine = useRef(null);
  if (!engine.current) engine.current = new AudioEngine();

  const [project, setProject] = useState(initial.project);
  const [playing, setPlaying] = useState(false);
  const [step, setStep] = useState(NO_STEP);
  const [message, setMessage] = useState(initial.error);
  const [busy, setBusy] = useState(false);
  const [lang, setLang] = useState(getLanguage());

  const update = (fn) => setProject((p) => fn(p));
  const fail = (e) => setMessage(e?.message || String(e));

  useEffect(() => {
    engine.current.setProject(project);
    const timer = setTimeout(() => {
      const error = saveProject(project);
      if (error) setMessage(error);
    }, AUTOSAVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [project]);

  useEffect(() => {
    if (!playing) return undefined;
    let frame;
    const loop = () => {
      setStep(engine.current.currentStep());
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const togglePlay = async () => {
    if (playing) {
      engine.current.stop();
      setPlaying(false);
      setStep(NO_STEP);
      return;
    }
    try {
      await engine.current.start();
      setPlaying(true);
    } catch (e) {
      fail(e);
    }
  };

  const playRef = useRef(togglePlay);
  playRef.current = togglePlay;

  useEffect(() => {
    const onKey = (e) => {
      if (e.code !== KEY_PLAY || isTypingTarget(e.target)) return;
      e.preventDefault();
      playRef.current();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => () => engine.current.stop(), []);

  const preview = (id) => engine.current.preview(id).catch(fail);

  const onImport = async (file) => {
    try {
      const p = await importProject(file);
      setProject(p);
      setMessage(null);
    } catch (e) {
      fail(new Error(t('error.importFailed', { reason: e.message })));
    }
  };

  const onExportWav = async () => {
    setBusy(true);
    try {
      const blob = await engine.current.exportWav(project);
      downloadBlob(blob, `${safeFileName(project.name)}${WAV_FILE_EXT}`);
    } catch (e) {
      fail(new Error(t('error.wavFailed', { reason: e.message })));
    } finally {
      setBusy(false);
    }
  };

  const onNew = () => {
    if (confirm(t('confirm.newProject'))) setProject(P.createProject());
  };

  const onLanguage = (next) => {
    if (setLanguage(next)) setLang(next);
  };

  return (
    <div className="app">
      <Transport
        project={project}
        playing={playing}
        busy={busy}
        lang={lang}
        onLanguage={onLanguage}
        onPlay={togglePlay}
        onBpm={(bpm) => update((p) => P.setBpm(p, bpm))}
        onSteps={(steps) => update((p) => P.setSteps(p, steps))}
        onName={(name) => update((p) => ({ ...p, name }))}
        onNew={onNew}
        onExport={() => exportProject(project)}
        onImport={onImport}
        onExportWav={onExportWav}
      />
      {message && (
        <div className="message" role="alert">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} title={t('common.close')}><Icon name="close" /></button>
        </div>
      )}
      <div className="workspace">
        <SampleBrowser onPreview={preview} />
        <ChannelRack
          project={project}
          step={step}
          onToggle={(id, s) => update((p) => P.toggleStep(p, id, s))}
          onChange={(id, fields) => update((p) => P.setChannel(p, id, fields))}
          onAdd={(sampleId, name) => update((p) => P.addChannel(p, sampleId, name))}
          onRemove={(id) => update((p) => P.removeChannel(p, id))}
          onClear={(id) => update((p) => P.clearChannel(p, id))}
          onPreview={preview}
        />
      </div>
    </div>
  );
}
