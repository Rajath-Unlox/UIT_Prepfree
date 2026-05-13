"use client";
import {
  Clock,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mic,
  Video,
  Monitor,
  Wifi,
  ShieldCheck,
  Loader2,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import Success from "@/public/images/success.png";
import Image from "next/image";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Toaster, toast } from "sonner";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";


const Page = () => {
  // STATE MANAGEMENT
  const [testStarted, setTestStarted] = useState(false);


  const [questionNo, setQuestionNo] = useState(1);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const systemVideoRef = useRef<HTMLVideoElement | null>(null);


  // Streams
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);


  const [cameraReady, setCameraReady] = useState(false);
  const [screenReady, setScreenReady] = useState(false);
  const [micReady, setMicReady] = useState(false);


  // Audio Analysis
  const [micVolume, setMicVolume] = useState(0);
  const volumeRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const rafIdRef = useRef<number | null>(null);


  // MediaPipe Face Detector
  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);


  // PROCTORING: Separate Violation Trackers
  const rightClickViolationsRef = useRef(0);
  const copyViolationsRef = useRef(0);


  const [selectedOptionId, setSelectedOptionId] = useState<any>(null);
  const [popupOpen, setPopupOpen] = useState(false);
  const [finishReason, setFinishReason] = useState<
    "completed" | "timeout" | "violation" | "network_failure"
  >("completed");


  const [questions, setQuestions] = useState<any[]>([]);
  const [assessment, setAssessment] = useState<any>(null);
  const [loading, setLoading] = useState(true);


  // ACTION LOADING STATES
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);


  // CONFIRMATION MODAL STATE
  const [showConfirmModal, setShowConfirmModal] = useState(false);


  const [timeLeft, setTimeLeft] = useState(0);
  const [testFinished, setTestFinished] = useState(false);


  // Network Grace Period
  const [isOffline, setIsOffline] = useState(false);
  const [reconnectTimeLeft, setReconnectTimeLeft] = useState(120);


  const [testId, setTestId] = useState<string | null>(null);
  const testIdRef = useRef<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());


  const router = useRouter();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);


  // FULLSCREEN PROCTORING
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFullscreenModal, setShowFullscreenModal] = useState(false);
  const fullscreenViolationsRef = useRef(0);


  const requestFullscreen = async () => {
    const el = document.documentElement;


    if (el.requestFullscreen) await el.requestFullscreen();
    // @ts-ignore
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
  };


  const exitFullscreen = async () => {
    if (document.exitFullscreen) await document.exitFullscreen();
  };


  // MEDIAPIPE INITIALIZATION
  useEffect(() => {
    const initializeFaceDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );
        const detector = await FaceDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite`,
            delegate: "GPU",
          },
          runningMode: "VIDEO",
        });
        setFaceDetector(detector);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Failed to load Face Detector:", error);
        toast.error("Failed to load AI Face Detector. Please refresh.");
      }
    };


    initializeFaceDetector();
  }, []);


  // FINISH TEST LOGIC
  const finishTest = async (
    reason:
      | "completed"
      | "timeout"
      | "violation"
      | "network_failure" = "completed"
  ) => {
    if (!assessmentId) return;
    if (testFinished) return;


    try {
      const currentTestId = testIdRef.current || testId;
      if (currentTestId) {
        await api.post("/assessments/finish", {
          assessment_id: assessmentId,
          test_id: currentTestId,
          finish_reason: reason,
        });
      }
    } catch (error) {
      console.error("Error finishing test:", error);
    }


    setTestFinished(true);
    setFinishReason(reason);
    setPopupOpen(true);
    setShowConfirmModal(false);
    localStorage.removeItem(`assessment_timer_${assessmentId}`);
  };


  // PROCTORING: SEPARATE HANDLERS
  useEffect(() => {
    if (!testStarted || testFinished) return;


    const handleSpecificViolation = (
      action: string,
      counterRef: React.MutableRefObject<number>
    ) => {
      if (counterRef.current >= 1) {
        toast.error(
          `Violation limit reached for ${action}. Submitting test...`
        );
        finishTest("violation");
      } else {
        counterRef.current += 1;
        toast.error(
          `Warning: ${action} is disabled! Next attempt will terminate the test.`,
          {
            duration: 5000,
            icon: <AlertTriangle className="text-red-500" />,
          }
        );
      }
    };


    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleSpecificViolation("Right-click", rightClickViolationsRef);
    };


    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleSpecificViolation("Copying content", copyViolationsRef);
    };


    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && (e.key === "I" || e.key === "J")) ||
        (e.ctrlKey && e.key === "u")
      ) {
        e.preventDefault();
        toast.warning("Inspection tools are disabled.");
      }
    };


    document.addEventListener("contextmenu", handleContextMenu);
    document.addEventListener("copy", handleCopy as any);
    document.addEventListener("keydown", handleKeyDown);


    return () => {
      document.removeEventListener("contextmenu", handleContextMenu);
      document.removeEventListener("copy", handleCopy as any);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [testStarted, testFinished]);


  // AUDIO VISUALIZER SETUP
  const setupAudioAnalysis = (stream: MediaStream) => {
    if (!stream.getAudioTracks().length) return;


    const AudioContextClass =
      window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;


    const audioContext = new AudioContextClass();
    const source = audioContext.createMediaStreamSource(stream);
    const analyser = audioContext.createAnalyser();


    analyser.fftSize = 256;
    source.connect(analyser);


    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);


    audioContextRef.current = audioContext;
    analyserRef.current = analyser;
    dataArrayRef.current = dataArray;


    const updateVolume = () => {
      if (!analyserRef.current || !dataArrayRef.current) return;


      analyserRef.current.getByteFrequencyData(dataArrayRef.current as any);


      let sum = 0;
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        sum += dataArrayRef.current[i];
      }
      const average = sum / dataArrayRef.current.length;


      const normalizedVol = Math.min(1, average / 30);


      setMicVolume(normalizedVol);
      volumeRef.current = normalizedVol;


      rafIdRef.current = requestAnimationFrame(updateVolume);
    };


    updateVolume();
  };


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setAssessmentId(params.get("id"));
  }, []);


  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [questionNo]);


  // HEARTBEAT
  useEffect(() => {
    if (!testStarted || testFinished || !testId) return;


    const interval = setInterval(async () => {
      try {
        const currentTestId = testIdRef.current || testId;
        if (currentTestId) {
          await api.post("/assessments/heartbeat", { test_id: currentTestId });
        }
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, 10000);


    return () => clearInterval(interval);
  }, [testStarted, testFinished, testId]);


  // NETWORK STABILITY
  useEffect(() => {
    let interval: NodeJS.Timeout;


    const handleOnline = () => {
      setIsOffline(false);
      setReconnectTimeLeft(120);
      toast.success("Connection restored. Resuming test...");
    };


    const handleOffline = () => {
      setIsOffline(true);
      toast.error("Internet connection lost!");
    };


    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);


    if (isOffline && !testFinished && testStarted) {
      interval = setInterval(() => {
        setReconnectTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            finishTest("network_failure");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }


    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      if (interval) clearInterval(interval);
    };
  }, [isOffline, testFinished, testStarted]);


  // MEDIA CHECKS
  const startScreenShare = async () => {
    try {
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });


      const videoTrack = displayStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();


      // @ts-ignore
      if (settings.displaySurface && settings.displaySurface !== "monitor") {
        videoTrack.stop();
        toast.error("Please share your ENTIRE SCREEN to proceed.", {
          duration: 5000,
          icon: <AlertTriangle className="text-red-500" />,
        });
        setScreenReady(false);
        return;
      }


      screenStreamRef.current = displayStream;
      setScreenReady(true);


      videoTrack.onended = () => {
        if (testStarted && !testFinished) {
          toast.error("Screen sharing stopped! Assessment Terminated.");
          finishTest("violation");
        }
        setScreenReady(false);
      };
    } catch (err) {
      console.error("Screen share denied:", err);
      toast.error("Screen sharing is mandatory.");
      setScreenReady(false);
    }
  };


  useEffect(() => {
    let mounted = true;


    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });


        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }


        cameraStreamRef.current = stream;
        setCameraReady(true);
        setMicReady(true);


        setupAudioAnalysis(stream);


        if (systemVideoRef.current) {
          systemVideoRef.current.srcObject = stream;
          systemVideoRef.current.play().catch(() => { });
        }


        await startScreenShare();
      } catch (err) {
        console.error("Media permission error:", err);
        toast.error("Camera/Microphone access is required.");
      }
    };


    initializeMedia();


    return () => {
      mounted = false;
      if (cameraStreamRef.current)
        cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      if (screenStreamRef.current)
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      if (audioContextRef.current) audioContextRef.current.close();
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);


  // Handle Video Stream Switching
  useEffect(() => {
    const stream = cameraStreamRef.current;
    if (!stream) return;


    if (!testStarted && systemVideoRef.current) {
      systemVideoRef.current.srcObject = stream;
      systemVideoRef.current.play().catch(() => { });
    } else if (testStarted && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => { });
    }
  }, [testStarted, cameraReady]);


  // FACE DETECTION
  useEffect(() => {
    if (!testStarted || testFinished || !faceDetector || !videoRef.current)
      return;


    let detectionInterval: NodeJS.Timeout;


    const detectFace = () => {
      if (videoRef.current && videoRef.current.readyState === 4) {
        const startTimeMs = Date.now();
        const detections = faceDetector.detectForVideo(
          videoRef.current,
          startTimeMs
        ).detections;


        const faceDetected = detections.length > 0;
        const currentVolume = volumeRef.current;
        const isTalking = currentVolume > 0.3;


        if (!faceDetected) {
          toast.warning("Face not detected! Please ensure you are visible.", {
            id: "face-missing",
            icon: <AlertTriangle className="text-yellow-500" />,
          });


          if (isTalking) {
            toast.warning("Suspicious: Sound detected but face is missing!", {
              id: "suspicious-activity",
              icon: <AlertTriangle className="text-red-500" />,
              duration: 4000,
              className: "bg-red-50 border-red-200",
            });
          }
        }
      }
    };


    detectionInterval = setInterval(detectFace, 500);
    return () => clearInterval(detectionInterval);
  }, [testStarted, testFinished, faceDetector]);


  useEffect(() => {
    if (!testStarted || testFinished) return;


    const handleFullscreenChange = () => {
      const fullscreenActive =
        !!document.fullscreenElement ||
        // @ts-ignore
        !!document.webkitFullscreenElement;


      setIsFullscreen(fullscreenActive);


      if (!fullscreenActive) {
        fullscreenViolationsRef.current += 1;


        if (fullscreenViolationsRef.current === 1) {
          // ⚠️ FIRST EXIT → WARNING
          setShowFullscreenModal(true);
          toast.error(
            "Fullscreen exited! Return immediately or test will end."
          );
        } else {
          // ❌ SECOND EXIT → TERMINATE
          toast.error("Fullscreen violation detected. Test terminated.");
          finishTest("violation");
        }
      }
    };


    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // @ts-ignore
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);


    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      // @ts-ignore
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
    };
  }, [testStarted, testFinished]);


  useEffect(() => {
    if (!showFullscreenModal) return;


    const timeout = setTimeout(() => {
      if (!isFullscreen) {
        toast.error("Did not return to fullscreen. Test terminated.");
        finishTest("violation");
      }
    }, 10000); // ⏱ 10 seconds grace


    return () => clearTimeout(timeout);
  }, [showFullscreenModal, isFullscreen]);


  // FETCH ASSESSMENT
  useEffect(() => {
    if (!assessmentId) return;


    localStorage.removeItem(`assessment_timer_${assessmentId}`);
    setTestId(null);
    testIdRef.current = null;
    setTestFinished(false);
    setPopupOpen(false);
    setSelectedOptionId(null);
    setQuestionNo(1);
    rightClickViolationsRef.current = 0;
    copyViolationsRef.current = 0;


    const fetchAssessment = async () => {
      try {
        const res = await api.get(`/assessments/${assessmentId}`);
        setAssessment(res.data.assessment);
        setQuestions(res.data.assessment.mcqs || []);
        setLoading(false);
      } catch (err) {
        toast.error("Failed to load assessment.");
        setLoading(false);
      }
    };


    fetchAssessment();
  }, [assessmentId]);


  // TAB SWITCH / BLUR DETECTION (VIOLATION)
  useEffect(() => {
    if (!testStarted || testFinished) return;


    const handleViolation = () => {
      if (!document.hidden) return;
      finishTest("violation");
    };


    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };


    document.addEventListener("visibilitychange", handleVisibilityChange);


    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [testStarted, testFinished, assessmentId, testId]);


  // BROWSER CLOSE (keepalive)
  useEffect(() => {
    const handleBeforeUnload = () => {
      const currentTestId = testIdRef.current || testId;
      if (!currentTestId || !assessmentId) return;
      const token = localStorage.getItem("token");
      const baseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:1995/api/v1";
      const payload = JSON.stringify({
        assessment_id: assessmentId,
        test_id: currentTestId,
      });


      fetch(`${baseUrl}/assessments/finish`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: payload,
        keepalive: true,
      });
    };


    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [testId, assessmentId]);


  // TIMER
  useEffect(() => {
    if (!assessment || !assessmentId || !testStarted) return;


    const TIMER_KEY = `assessment_timer_${assessmentId}`;
    const totalSeconds = (assessment.total_test_time || 0) * 60;


    let storedEndTime = localStorage.getItem(TIMER_KEY);
    let endTime: number;


    if (storedEndTime) {
      endTime = parseInt(storedEndTime, 10);
    } else {
      endTime = Date.now() + totalSeconds * 1000;
      localStorage.setItem(TIMER_KEY, endTime.toString());
    }


    const initialDiff = Math.floor((endTime - Date.now()) / 1000);
    setTimeLeft(initialDiff > 0 ? initialDiff : 0);


    const interval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((endTime - now) / 1000);


      if (diff <= 0) {
        clearInterval(interval);
        setTimeLeft(0);
        if (!testFinished) {
          finishTest("timeout");
        }
      } else {
        setTimeLeft(diff);
      }
    }, 1000);


    return () => clearInterval(interval);
  }, [assessment, assessmentId, testFinished, testStarted]);


  const totalQuestions = questions.length;
  const currentQuestion = questions[questionNo - 1];


  // HANDLERS
  const submitAnswer = async (goNext: boolean) => {
    if (!assessment || !currentQuestion) return;


    const timeTakenForThisQuestion = Math.floor(
      (Date.now() - questionStartTime) / 1000
    );


    try {
      const payload = {
        assessment_id: assessmentId,
        mcq_id: currentQuestion.mcq_id,
        user_answer: selectedOptionId,
        time_taken: timeTakenForThisQuestion,
        test_id: testIdRef.current || testId || undefined,
      };


      const res = await api.post("/assessments/submit", payload);


      let newTestId = res.data?.test_id;
      if (newTestId && typeof newTestId === "object") {
        newTestId = newTestId.$oid || newTestId._id || newTestId.id || newTestId.test_id || newTestId.toString();
      }


      if (!testIdRef.current && newTestId) {
        setTestId(newTestId);
        testIdRef.current = newTestId;
      }


      if (goNext) {
        setQuestionNo((prev) => prev + 1);
        setSelectedOptionId(null);
      }
    } catch (err) {
      console.error("Submit error:", err);
      if (!isOffline) toast.error("Failed to save answer. Retrying...");
    }
  };


  const handleNext = async () => {
    if (testFinished || isSubmitting || isFinishing) return;


    if (!selectedOptionId) {
      toast.warning("Question must be answered to proceed to next");
      return;
    }


    setIsSubmitting(true);


    try {
      if (questionNo === totalQuestions) {
        await submitAnswer(false);
        await finishTest("completed");
      } else {
        await submitAnswer(true);
      }
    } catch (error) {
      console.error("Error in next/submit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };


  // Trigger Confirmation Modal
  const handleFinishEarly = () => {
    if (!isFinishing && !isSubmitting && !testFinished) {
      setShowConfirmModal(true);
    }
  };


  // Actual Finish Action
  const confirmFinish = async () => {
    setIsFinishing(true);
    try {
      await finishTest("completed");
    } finally {
      setIsFinishing(false);
      setShowConfirmModal(false);
    }
  };


  const handleClick = () => {
    router.push(`/dashboard/my-performance`);
  };


  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m} mins ${s.toString().padStart(2, "0")} sec`;
  };


  const handleStartTest = async () => {
    if (
      cameraReady &&
      micReady &&
      screenReady &&
      !isOffline &&
      !isModelLoading
    ) {
      await requestFullscreen(); // 🔒 FORCE FULLSCREEN
      setTestStarted(true);
      setQuestionStartTime(Date.now());
    } else if (isModelLoading) {
      toast.info("AI Models are still loading. Please wait...");
    } else {
      toast.error("Please complete all system checks before starting.");
    }
  };


  if (loading)
    return (
      <div className="w-full h-screen flex items-center justify-center text-xl">
        Loading Assessment...
      </div>
    );


  // SYSTEM CHECK VIEW
  if (!testStarted) {
    return (
      <main className="w-full h-screen p-5 bg-gray-50 flex flex-col items-center justify-center">
        {showFullscreenModal && !testFinished && (
          <div className="fixed inset-0 z-[60] bg-[#17383d]/80 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white rounded-xl p-6 w-[420px] shadow-2xl border">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-red-100 rounded-full text-red-600">
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Fullscreen Required</h2>
                  <p className="text-sm text-gray-500">
                    You exited fullscreen mode. Please return immediately.
                  </p>
                </div>
              </div>


              <div className="flex justify-end gap-3">
                <button
                  onClick={async () => {
                    await requestFullscreen();
                    setShowFullscreenModal(false);
                  }}
                  className="px-4 py-2 bg-[#f2825c] text-white rounded-md font-medium hover:bg-[#f2825c]/85"
                >
                  Go Fullscreen
                </button>
              </div>
            </div>
          </div>
        )}


        <Toaster position="top-right" richColors />


        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-200 max-w-4xl w-full flex flex-col gap-8">
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-3xl font-bold text-[#f2825c]">System Check</h1>
            <p className="text-gray-500">
              Ensure your device is ready for the assessment. All checks must
              pass.
            </p>
          </div>


          <div className="flex flex-col md:flex-row gap-8">
            {/* Video Preview Section */}
            <div className="flex-1 flex flex-col gap-4">
              <div className="relative w-full aspect-video bg-[#17383d] rounded-xl overflow-hidden shadow-inner border border-gray-300">
                {!cameraReady && (
                  <div className="absolute inset-0 flex items-center justify-center text-white/50">
                    <p className="animate-pulse">Initializing Camera...</p>
                  </div>
                )}
                <video
                  ref={systemVideoRef}
                  className="w-full h-full object-cover transform scale-x-[-1]"
                  muted
                  playsInline
                  autoPlay
                />
                <div className="absolute bottom-4 left-4 flex gap-2">
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-md ${cameraReady
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <Video size={12} />{" "}
                    {cameraReady ? "Camera On" : "Camera Off"}
                  </div>


                  <div
                    className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 backdrop-blur-md ${micReady
                      ? "bg-green-500/20 text-green-300 border border-green-500/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <Mic
                      size={12}
                      style={{ transform: `scale(${1 + micVolume})` }}
                      className="transition-transform duration-75"
                    />
                    {micReady ? "Mic On" : "Mic Off"}
                  </div>
                </div>
              </div>
            </div>


            {/* Checklist Section */}
            <div className="flex-1 flex flex-col justify-center gap-4">
              <h3 className="font-semibold text-lg text-gray-800">
                Required Permissions
              </h3>


              <div className="space-y-3">
                <CheckItem
                  label="Webcam Access"
                  status={cameraReady}
                  icon={<Video size={20} />}
                />
                <CheckItem
                  label="Microphone Access"
                  status={micReady}
                  icon={<Mic size={20} />}
                />
                <CheckItem
                  label="Internet Connection"
                  status={!isOffline}
                  icon={<Wifi size={20} />}
                />
                <CheckItem
                  label="Screen Sharing"
                  status={screenReady}
                  icon={<Monitor size={20} />}
                  action={
                    !screenReady && (
                      <button
                        onClick={startScreenShare}
                        className="text-xs text-[#f2825c] underline hover:text-[#184852] ml-2"
                      >
                        Retry
                      </button>
                    )
                  }
                />
                <CheckItem
                  label="Session Proctoring"
                  status={!isModelLoading}
                  icon={<ShieldCheck size={20} />}
                />
              </div>


              <div className="mt-6">
                <button
                  onClick={handleStartTest}
                  disabled={
                    !cameraReady ||
                    !micReady ||
                    !screenReady ||
                    isOffline ||
                    isModelLoading
                  }
                  className={`w-full py-3.5 rounded-xl font-bold text-lg transition-all shadow-md flex items-center justify-center gap-2 ${cameraReady &&
                    micReady &&
                    screenReady &&
                    !isOffline &&
                    !isModelLoading
                    ? "bg-[#f2825c] hover:bg-[#184852] text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isModelLoading
                    ? "Loading AI Models..."
                    : "Start Assessment Test"}
                </button>
                <p className="text-xs text-center text-gray-400 mt-3">
                  By clicking start, you agree to be monitored during the
                  duration of the test.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }


  // ASSESSMENT VIEW
  return (
    <main className="w-full h-screen p-5">
      <Toaster position="top-right" richColors />


      {/* RECONNECTING OVERLAY */}
      {isOffline && !testFinished && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/90 flex flex-col items-center justify-center text-white text-center p-6">
          <WifiOff size={64} className="mb-4 text-red-500 animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">Connection Lost</h1>
          <p className="text-lg text-gray-300 max-w-md">
            Please do not close this tab. We are attempting to reconnect.
          </p>
          <div className="mt-6 p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-sm text-gray-400 mb-1">Auto-submission in:</p>
            <p className="text-4xl font-mono font-bold text-red-400">
              {Math.floor(reconnectTimeLeft / 60)}:
              {String(reconnectTimeLeft % 60).padStart(2, "0")}
            </p>
          </div>
          <p className="mt-8 text-sm text-gray-500">
            If your internet returns, the test will resume automatically.
          </p>
        </div>
      )}


      <div className="w-full flex flex-col items-center border-[2px] border-[#D9D9D9] rounded-xl h-full relative">
        {/* Header Controls: Finish Button only appears after Question 1 */}
        {questionNo > 1 && (
          <div className="absolute top-4 right-4 flex gap-3">
            <button
              onClick={handleFinishEarly}
              disabled={isFinishing || isSubmitting}
              className={`px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-md font-medium text-sm transition-all flex items-center gap-2 ${isFinishing || isSubmitting
                ? "opacity-70 cursor-not-allowed"
                : "hover:bg-red-100"
                }`}
            >
              Finish Test
            </button>
          </div>
        )}


        {/* HEADING */}
        <div className="flex flex-col items-center justify-center gap-1 mt-8">
          <h1 className="text-[#17383d] text-3xl font-bold">
            {assessment?.test_name || "Assessment Test"}
          </h1>
          <p className="text-xl text-[#17383d]/79 font-medium">
            {testFinished ? "Test Session Ended" : "Answer the questions below"}
          </p>
        </div>


        <div className="w-[70%] mt-6">
          <div className="w-full flex items-center justify-between">
            <div className="w-fit px-4 py-1 border rounded-full bg-gray-50">
              <p className="font-medium text-sm">
                Question {questionNo} of {totalQuestions}
              </p>
            </div>


            <div
              className={`flex gap-2 items-center px-4 py-1 rounded-full ${timeLeft < 300
                ? "bg-red-50 text-red-600"
                : "bg-green-50 text-green-700"
                }`}
            >
              <Clock size={18} />
              <p className="font-mono font-medium">
                {timeLeft > 0
                  ? `${formatTime(timeLeft)} left`
                  : testFinished
                    ? "Time up!"
                    : "Starting..."}
              </p>
            </div>
          </div>


          <ProgressBar
            questionNo={questionNo}
            totalQuestions={totalQuestions}
          />


          <div className="w-full flex justify-end items-center mt-6">
            <button
              onClick={handleNext}
              disabled={testFinished || isSubmitting || isFinishing}
              className={`w-fit px-8 py-2 border-[2px] rounded-md font-medium transition-all flex items-center justify-center gap-2 ${testFinished || isSubmitting || isFinishing
                ? "bg-gray-400 border-gray-400 cursor-not-allowed text-white"
                : "bg-[#f2825c] border-[#f2825c] text-white hover:bg-[#184852]"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : questionNo === totalQuestions ? (
                "Submit Test"
              ) : (
                "Next Question"
              )}
            </button>
          </div>


          {currentQuestion && (
            <div className="w-full flex flex-col items-start mt-6 mb-4">
              <h1 className="text-xl w-full font-medium leading-relaxed">
                <span className="font-bold mr-2">{questionNo}.</span>
                {currentQuestion.question}
              </h1>


              <div className="flex flex-col mt-4 gap-4 w-full">
                {Object.entries(currentQuestion.options).map(
                  ([key, value]: any) => (
                    <label
                      key={key}
                      className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${testFinished
                        ? "cursor-not-allowed opacity-60"
                        : "cursor-pointer hover:bg-gray-50"
                        } ${selectedOptionId === key
                          ? "border-[#f2825c] bg-[#f2825c]/5"
                          : "border-gray-200"
                        }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion._id}`}
                        value={key}
                        className="hidden"
                        checked={selectedOptionId === key}
                        disabled={testFinished}
                        onChange={() =>
                          !testFinished && setSelectedOptionId(key)
                        }
                      />


                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${selectedOptionId === key
                          ? "border-[#f2825c]"
                          : "border-gray-400"
                          }`}
                      >
                        {selectedOptionId === key && (
                          <span className="w-2.5 h-2.5 bg-[#f2825c] rounded-full"></span>
                        )}
                      </span>


                      <span className="font-medium text-gray-800">{value}</span>
                    </label>
                  )
                )}
              </div>
            </div>
          )}
        </div>


        {/* Camera Preview with Dynamic 3-Dot Audio Visualizer */}
        <div className="absolute right-4 bottom-4 rounded-xl bg-[#17383d] h-40 w-64 overflow-hidden shadow-2xl border-2 border-white ring-1 ring-gray-200 flex items-center justify-center group">
          {!cameraReady && (
            <p className="absolute text-white/50 text-xs z-0 animate-pulse">
              Initializing Camera...
            </p>
          )}
          <video
            ref={videoRef}
            className="w-full h-full object-cover transform scale-x-[-1] z-10 relative"
            muted
            playsInline
            autoPlay
          />


          <div className="absolute bottom-2 left-2 flex gap-2 z-20">
            <div
              className={`h-8 px-3 rounded-full flex items-center justify-center backdrop-blur-md transition-all duration-300 gap-1 ${micReady ? "bg-[#17383d]/30" : "bg-red-500/20"
                }`}
            >
              {!micReady ? (
                <Mic size={16} className="text-red-400" />
              ) : (
                <>
                  <div
                    className="w-2 h-2 rounded-full bg-sky-400 transition-transform duration-75"
                    style={{
                      transform: `scaleY(${1 + micVolume * 1.5}) scaleX(${1 + micVolume * 0.5
                        })`,
                    }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-emerald-400 transition-transform duration-75 delay-75"
                    style={{
                      transform: `scaleY(${1 + micVolume * 2}) scaleX(${1 + micVolume * 0.5
                        })`,
                    }}
                  />
                  <div
                    className="w-2 h-2 rounded-full bg-rose-400 transition-transform duration-75 delay-150"
                    style={{
                      transform: `scaleY(${1 + micVolume * 1.5}) scaleX(${1 + micVolume * 0.5
                        })`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        </div>
      </div>


      {/* CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/45 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[400px] flex flex-col gap-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-full text-red-600">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  End Assessment?
                </h2>
                <p className="text-sm text-gray-500">
                  You still have time remaining. Are you sure you want to
                  finish?
                </p>
              </div>
            </div>


            <div className="flex justify-end gap-3 mt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium transition-colors"
                disabled={isFinishing}
              >
                Cancel
              </button>
              <button
                onClick={confirmFinish}
                className="px-4 py-2 bg-red-600 text-white rounded-md font-medium hover:bg-red-700 transition-colors flex items-center gap-2"
                disabled={isFinishing}
              >
                {isFinishing && <Loader2 className="w-4 h-4 animate-spin" />}
                Yes, Finish
              </button>
            </div>
          </div>
        </div>
      )}


      {/* FINISH POPUP */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="w-[450px] bg-white flex flex-col items-center justify-center gap-6 rounded-2xl p-8 shadow-2xl border border-gray-200">
            <div className="w-full flex flex-col items-center text-center gap-2">
              <h1
                className={`text-2xl font-bold ${finishReason === "completed"
                  ? "text-gray-900"
                  : "text-red-600"
                  }`}
              >
                {finishReason === "completed"
                  ? "Test Completed!"
                  : finishReason === "timeout"
                    ? "Time Limit Reached"
                    : finishReason === "violation"
                      ? "Test Terminated"
                      : "Connection Failed"}
              </h1>


              <p className="text-gray-500 px-4">
                {finishReason === "completed" &&
                  "You have successfully submitted the assessment."}
                {finishReason === "timeout" &&
                  "Your test was automatically submitted because time ran out."}
                {finishReason === "violation" &&
                  "Multiple proctoring violations detected (Copy/Paste or Window Switch)."}
                {finishReason === "network_failure" &&
                  "Your internet connection was lost for more than 2 minutes. The test has been auto-submitted."}
              </p>
            </div>


            {finishReason === "completed" ? (
              <Image src={Success} alt="Success" className="w-[60%] h-auto" />
            ) : (
              <div className="w-32 h-32 bg-red-50 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <AlertTriangle size={64} className="text-red-500" />
              </div>
            )}


            <button
              onClick={handleClick}
              className={`w-full py-3 rounded-xl text-white font-semibold transition-all shadow-md ${finishReason === "completed"
                ? "bg-[#f2825c] hover:bg-[#184852]"
                : "bg-red-600 hover:bg-red-700"
                }`}
            >
              View Detailed Result
            </button>
          </div>
        </div>
      )}
    </main>
  );
};


export default Page;


const ProgressBar = ({
  questionNo,
  totalQuestions,
}: {
  questionNo: number;
  totalQuestions: number;
}) => {
  const percentage =
    totalQuestions > 0 ? (questionNo / totalQuestions) * 100 : 0;


  return (
    <div className="w-full bg-gray-200 h-2 mt-4 rounded-full overflow-hidden">
      <div
        className="h-full bg-[#f2825c] rounded-full transition-all duration-300 ease-out"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};


const CheckItem = ({
  label,
  status,
  icon,
  action,
}: {
  label: string;
  status: boolean;
  icon: React.ReactNode;
  action?: React.ReactNode;
}) => (
  <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-200">
    <div className="flex items-center gap-3">
      <div
        className={`p-2 rounded-full ${status ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
      >
        {icon}
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {status ? (
        <CheckCircle className="text-green-500" size={24} />
      ) : (
        <XCircle className="text-red-500" size={24} />
      )}
      {action}
    </div>
  </div>
);
