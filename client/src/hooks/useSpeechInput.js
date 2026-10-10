import { useEffect, useRef, useState } from 'react';

const Recognition =
  typeof window !== 'undefined' ? window.SpeechRecognition || window.webkitSpeechRecognition : null;

const ERROR_MESSAGES = {
  'not-allowed': 'Microphone access is blocked. Allow it in your browser settings and try again.',
  'service-not-allowed': 'Microphone access is blocked. Allow it in your browser settings and try again.',
  'audio-capture': 'No microphone was found.',
  network: 'Voice input needs an internet connection.',
};

/** Dictation via the browser's SpeechRecognition. `onText` receives the full transcript so far. */
export function useSpeechInput(onText) {
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const recRef = useRef(null);
  const onTextRef = useRef(onText);

  useEffect(() => {
    onTextRef.current = onText;
  });

  useEffect(() => () => recRef.current?.abort(), []);

  function start(baseText = '') {
    if (!Recognition || recRef.current) return;

    const rec = new Recognition();
    rec.lang = navigator.language || 'en-IN';
    rec.interimResults = true;
    rec.continuous = true;

    const prefix = baseText && !/\s$/.test(baseText) ? `${baseText} ` : baseText;

    rec.onresult = (event) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      onTextRef.current(prefix + transcript.trim());
    };
    rec.onerror = (event) => {
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setError(ERROR_MESSAGES[event.error] || 'Voice input failed. Try again.');
      }
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
    };

    setError(null);
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      recRef.current = null;
      setListening(false);
    }
  }

  function stop() {
    recRef.current?.abort();
  }

  return { supported: Boolean(Recognition), listening, error, start, stop };
}
