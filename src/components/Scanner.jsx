import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Flashlight, FlashlightOff } from 'lucide-react';

const REGION_ID = 'isbn-scanner-region';
const FORMATS = [
  Html5QrcodeSupportedFormats.EAN_13,
  Html5QrcodeSupportedFormats.EAN_8,
  Html5QrcodeSupportedFormats.UPC_A,
  Html5QrcodeSupportedFormats.UPC_E,
  Html5QrcodeSupportedFormats.CODE_128
];

export default function Scanner({ onDetected, paused }) {
  const ref = useRef(null);
  const startedRef = useRef(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [tapPoint, setTapPoint] = useState(null);

  useEffect(() => {
    let scanner;
    let cancelled = false;

    async function start() {
      try {
        const useDetector =
          typeof window !== 'undefined' && 'BarcodeDetector' in window;
        scanner = new Html5Qrcode(REGION_ID, {
          formatsToSupport: FORMATS,
          verbose: false,
          useBarCodeDetectorIfSupported: useDetector
        });
        ref.current = scanner;

        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 15,
            qrbox: (vw, vh) => {
              const w = Math.min(vw, vh) * 0.85;
              return { width: w, height: w * 0.5 };
            },
            aspectRatio: 1.3
          },
          (text) => {
            if (cancelled) return;
            const cleaned = String(text).replace(/[^0-9X]/gi, '');
            if (cleaned.length === 10 || cleaned.length === 13) {
              onDetected(cleaned);
            }
          },
          () => {}
        );
        startedRef.current = true;
        upgradeStream();
        detectTorchSupport(setTorchSupported);
      } catch (err) {
        console.error('Scanner start failed:', err);
        if (!cancelled) {
          const msg = err?.message || err?.name || 'Could not start camera';
          setError(msg);
        }
      }
    }

    start();
    return () => {
      cancelled = true;
      const s = ref.current;
      if (s && startedRef.current) {
        s.stop().then(() => s.clear()).catch(() => {});
        startedRef.current = false;
      }
      setTorchOn(false);
      setTorchSupported(false);
    };
  }, [attempt]);

  useEffect(() => {
    const s = ref.current;
    if (!s || !startedRef.current) return;
    if (paused) {
      s.pause(true);
    } else {
      try { s.resume(); } catch {}
      upgradeStream();
    }
  }, [paused]);

  const retry = () => {
    setError('');
    setAttempt((n) => n + 1);
  };

  const toggleTorch = async (e) => {
    e.stopPropagation();
    const track = getTrack();
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ torch: !torchOn }] });
      setTorchOn(!torchOn);
    } catch (err) {
      console.error('Torch toggle failed:', err);
    }
  };

  const handleTapFocus = (e) => {
    const video = getVideo();
    if (!video) return;
    const rect = video.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setTapPoint({ x, y, key: Date.now() });
    setTimeout(() => setTapPoint((p) => (p?.key === tapPoint?.key ? null : p)), 800);

    const track = getTrack();
    if (!track) return;
    const nx = Math.min(1, Math.max(0, x / rect.width));
    const ny = Math.min(1, Math.max(0, y / rect.height));
    track
      .applyConstraints({
        advanced: [{ pointsOfInterest: [{ x: nx, y: ny }], focusMode: 'single-shot' }]
      })
      .catch(() => {})
      .finally(() => {
        setTimeout(() => {
          track
            .applyConstraints({ advanced: [{ focusMode: 'continuous' }] })
            .catch(() => {});
        }, 800);
      });
  };

  return (
    <div className="relative w-full">
      <div
        id={REGION_ID}
        onClick={handleTapFocus}
        className="w-full overflow-hidden rounded-2xl bg-black aspect-[3/4] cursor-pointer"
      />

      {!error && torchSupported && (
        <button
          type="button"
          onClick={toggleTorch}
          aria-label={torchOn ? 'Turn off flashlight' : 'Turn on flashlight'}
          aria-pressed={torchOn}
          className={`absolute top-3 right-3 w-11 h-11 rounded-full flex items-center justify-center shadow-card transition-colors ${
            torchOn ? 'bg-white text-rose-deep' : 'bg-black/50 text-white'
          }`}
        >
          {torchOn ? <Flashlight size={20} /> : <FlashlightOff size={20} />}
        </button>
      )}

      {tapPoint && (
        <div
          className="absolute pointer-events-none rounded-full border-2 border-white animate-[focusRing_0.7s_ease-out_forwards]"
          style={{
            left: tapPoint.x - 30,
            top: tapPoint.y - 30,
            width: 60,
            height: 60
          }}
        />
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 text-white bg-black/80 rounded-2xl gap-3">
          <div>
            <div className="font-semibold mb-1">Camera unavailable</div>
            <div className="text-[13px] opacity-80 break-words">{error}</div>
            <div className="text-[12px] opacity-60 mt-2">
              Check that camera permission is granted for this site.
            </div>
          </div>
          <button
            type="button"
            onClick={retry}
            className="rounded-full bg-white text-ink font-semibold py-2 px-5 active:opacity-70"
          >
            Try again
          </button>
        </div>
      )}

      <style>{`
        @keyframes focusRing {
          0%   { transform: scale(1.4); opacity: 0; }
          30%  { transform: scale(1); opacity: 1; }
          100% { transform: scale(0.85); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function getVideo() {
  return document.querySelector(`#${REGION_ID} video`);
}

function getTrack() {
  const video = getVideo();
  return video?.srcObject?.getVideoTracks?.()?.[0] || null;
}

function detectTorchSupport(setSupported) {
  const track = getTrack();
  if (!track) return;
  const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
  setSupported(!!caps.torch);
}

function upgradeStream() {
  const track = getTrack();
  if (!track) return;
  const caps = typeof track.getCapabilities === 'function' ? track.getCapabilities() : {};
  const advanced = [];
  if (caps.focusMode && Array.isArray(caps.focusMode) && caps.focusMode.includes('continuous')) {
    advanced.push({ focusMode: 'continuous' });
  }
  const constraints = {};
  if (caps.width?.max && caps.width.max >= 1280) {
    constraints.width = { ideal: Math.min(caps.width.max, 1920) };
  }
  if (caps.height?.max && caps.height.max >= 720) {
    constraints.height = { ideal: Math.min(caps.height.max, 1080) };
  }
  if (advanced.length > 0) constraints.advanced = advanced;
  if (Object.keys(constraints).length === 0) return;
  track.applyConstraints(constraints).catch(() => {});
}
