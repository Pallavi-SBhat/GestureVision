import { useEffect, useRef, useState } from 'react';
import { Hand, Video, AlertCircle } from 'lucide-react';

export default function HandGestureRecognition() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [gesture, setGesture] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [handsDetected, setHandsDetected] = useState(0);
  const cameraRef = useRef(null);
  const handsRef = useRef(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const hands = new window.Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`;
      },
    });

    hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    hands.onResults(onResults);
    handsRef.current = hands;

    if (videoRef.current) {
const camera = new window.Camera(videoRef.current, {        onFrame: async () => {
          if (videoRef.current && handsRef.current) {
            await handsRef.current.send({ image: videoRef.current });
          }
        },
        width: 1280,
        height: 720,
      });

      camera
        .start()
        .then(() => {
          setIsLoading(false);
        })
        .catch((err) => {
          setError('Failed to access camera. Please allow camera permissions.');
          setIsLoading(false);
          console.error('Camera error:', err);
        });

      cameraRef.current = camera;
    }

    return () => {
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
      if (handsRef.current) {
        handsRef.current.close();
      }
    };
  }, []);

  function onResults(results) {
    if (!canvasRef.current) return;

    const canvasCtx = canvasRef.current.getContext('2d');
    if (!canvasCtx) return;

    canvasRef.current.width = results.image.width;
    canvasRef.current.height = results.image.height;

    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
      setHandsDetected(results.multiHandLandmarks.length);

      for (const landmarks of results.multiHandLandmarks) {
       window.drawConnectors(
  canvasCtx,
  landmarks,
mpHands.HAND_CONNECTIONS,
  {
          color: '#00FF00',
          lineWidth: 5,
        });
        window.drawLandmarks(canvasCtx, landmarks, {
  color: "#FF0000",
  lineWidth: 2,
});
      }

      const detectedGesture = recognizeGesture(
        results.multiHandLandmarks[0]
      );
      setGesture(detectedGesture);
    } else {
      setHandsDetected(0);
      setGesture(null);
    }

    canvasCtx.restore();
  }

  function recognizeGesture(landmarks) {
    const fingerTips = [8, 12, 16, 20];
    const fingerBases = [6, 10, 14, 18];
    const thumbTip = 4;
    const thumbBase = 2;

    const fingersExtended = fingerTips.map((tip, index) => {
      return landmarks[tip].y < landmarks[fingerBases[index]].y;
    });

    const thumbExtended =
      landmarks[thumbTip].x < landmarks[thumbBase].x;

    const extendedCount =
      fingersExtended.filter(Boolean).length;

    if (thumbExtended && extendedCount === 0) {
      return { name: 'Thumbs Up', confidence: 0.9 };
    }

    if (extendedCount === 0 && !thumbExtended) {
      return { name: 'Fist', confidence: 0.95 };
    }

    if (extendedCount === 4 && thumbExtended) {
      return { name: 'Open Hand', confidence: 0.9 };
    }

    if (
      fingersExtended[0] &&
      fingersExtended[1] &&
      extendedCount === 2
    ) {
      return { name: 'Peace Sign', confidence: 0.85 };
    }

    if (fingersExtended[0] && extendedCount === 1) {
      return { name: 'Pointing', confidence: 0.85 };
    }

    return { name: 'Unknown', confidence: 0.5 };
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex flex-col items-center justify-center p-4">
      <div className="max-w-6xl w-full">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Hand className="w-12 h-12 text-blue-400" />
            <h1 className="text-5xl font-bold text-white">
              Hand Gesture Recognition
            </h1>
          </div>
          <p className="text-blue-200 text-lg">
            Show your hand to the camera and watch it recognize your gestures in real-time
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="relative aspect-video bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video className="w-16 h-16 text-blue-400 animate-pulse mx-auto mb-4" />
                  <p className="text-white text-xl">
                    Initializing camera...
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center bg-red-500/20 p-8 rounded-xl border border-red-500">
                  <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                  <p className="text-white text-xl">{error}</p>
                </div>
              </div>
            )}

            <video
  ref={videoRef}
  className="absolute inset-0 w-full h-full"
  playsInline
  autoPlay
  muted
  style={{ transform: "scaleX(-1)" }}
/>
           <canvas
  ref={canvasRef}
  className="absolute inset-0 w-full h-full object-contain"
  style={{ transform: "scaleX(-1)" }}
/>

            {gesture && gesture.name !== 'Unknown' && (
              <div className="absolute top-4 left-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
                <p className="text-2xl font-bold">
                  {gesture.name}
                </p>
              </div>
            )}

            {handsDetected > 0 && (
              <div className="absolute top-4 right-4 bg-blue-500/90 text-white px-4 py-2 rounded-full shadow-lg">
                <p className="text-sm font-semibold">
                  {handsDetected}{' '}
                  {handsDetected === 1 ? 'Hand' : 'Hands'} Detected
                </p>
              </div>
            )}
          </div>

          <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-6">
            <h2 className="text-white text-xl font-semibold mb-4">
              Supported Gestures:
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { name: 'Thumbs Up', emoji: '👍' },
                { name: 'Fist', emoji: '✊' },
                { name: 'Open Hand', emoji: '✋' },
                { name: 'Peace Sign', emoji: '✌️' },
                { name: 'Pointing', emoji: '☝️' },
              ].map((g) => (
                <div
                  key={g.name}
                  className={`bg-white/10 p-4 rounded-xl text-center transition-all ${
                    gesture?.name === g.name
                      ? 'ring-4 ring-green-400 scale-105'
                      : 'hover:bg-white/20'
                  }`}
                >
                  <div className="text-4xl mb-2">
                    {g.emoji}
                  </div>
                  <p className="text-white text-sm font-medium">
                    {g.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}