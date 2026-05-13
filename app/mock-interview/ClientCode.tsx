"use client";
import {
  CircleCheckBig,
  Clock,
  Mic,
  Loader2,
  StopCircle,
  Monitor,
  WifiOff,
  AlertTriangle,
  Video,
  CheckCircle,
  XCircle,
  ShieldCheck,
  FileText,
  MessageCircle,
} from "lucide-react";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { Toaster, toast } from "sonner";
import { FaceDetector, FilesetResolver } from "@mediapipe/tasks-vision";
import Image from "next/image";
import Success from "@/public/images/success.png";
import MalasiaFemale from "@/public/images/Malasia_Female.png";
import MalasiaMale from "@/public/images/Malasia_Male.png";
import ChinaFemale from "@/public/images/China_Female.png";
import ChinaMale from "@/public/images/China_Male.png";
import IndianFemale from "@/public/images/Indian_Female.png";
import IndianMale from "@/public/images/Indian_Male.png";
import { motion } from "framer-motion";

// Interview Duration
const INTERVIEW_DURATION = 20 * 60; // 1200 seconds
const PENDING_INTERVIEW_PAYLOAD_KEY = "pending_mock_interview_payload";

// Maps ethnicity + gender to voice names for display
const VOICE_NAME_MAP: Record<string, Record<string, string>> = {
  indian: { female: "Amy", male: "Matthew" },
  chinese: { female: "Joanna", male: "Gregory" },
  malaysian: { female: "Danielle", male: "Stephen" },
};

const getVoiceName = (ethnicity: string, gender: string): string => {
  const eth = (ethnicity || "indian").toLowerCase();
  const gen = (gender || "female").toLowerCase();
  return VOICE_NAME_MAP[eth]?.[gen] || VOICE_NAME_MAP.indian.female;
};

const enterFullscreen = async () => {
  const elem = document.documentElement;
  if (!document.fullscreenElement) {
    try {
      await elem.requestFullscreen();
    } catch (err) {
      toast.error("Fullscreen permission required to start interview");
    }
  }
};

// Interview phases
type InterviewPhase = "intro" | "main" | "outro" | "completed" | "thankyou";

interface CurrentQuestion {
  id: string;
  question_text: string;
  phase?: "intro" | "main" | "outro";
  feedbackSpoken?: boolean;
}

const ClientCode = () => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mockId, setMockId] = useState<string | null>(null);

  useEffect(() => {
    const id = searchParams.get("id");
    setMockId(id);
  }, [searchParams]);

  // INTERVIEW STATE
  const [phase, setPhase] = useState<InterviewPhase>("intro");
  const [currentQuestion, setCurrentQuestion] =
    useState<CurrentQuestion | null>(null);
  const [displayedQuestionText, setDisplayedQuestionText] =
    useState<string>(""); // Only updates when TTS starts
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<any[]>([]);

  // PROCTORING & SYSTEM STATE
  const [testStarted, setTestStarted] = useState(false);
  const [testFinished, setTestFinished] = useState(false);
  const isFinishingTestRef = useRef(false);
  const [finishReason, setFinishReason] = useState<
    "completed" | "timeout" | "violation" | "network_failure"
  >("completed");
  const [popupOpen, setPopupOpen] = useState(false);

  // Streams
  const cameraStreamRef = useRef<MediaStream | null>(null);

  // Proctoring Warning System
  const MAX_PROCTORING_WARNINGS = 3;
  const WARNING_COOLDOWN_MS = 5000;
  const NOISE_THRESHOLD = 0.35;
  const NOISE_DURATION_MS = 3000;

  const faceWarningCountRef = useRef(0);
  const lastFaceWarningTimeRef = useRef(0);

  const micWarningCountRef = useRef(0);
  const lastMicWarningTimeRef = useRef(0);
  const noisyStartTimeRef = useRef<number | null>(null);

  const immediateViolationCountRef = useRef(0);

  const [showViolationPopup, setShowViolationPopup] = useState(false);
  const [violationReason, setViolationReason] = useState("");
  const [violationCountdown, setViolationCountdown] = useState(15);
  const violationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Idle popup state
  const [showIdlePopup, setShowIdlePopup] = useState(false);
  const idlePopupTimerRef = useRef<NodeJS.Timeout | null>(null);
  const IDLE_POPUP_DELAY = 10000;
  const IDLE_POPUP_COUNTDOWN = 15;

  const [cameraReady, setCameraReady] = useState(false);
  const [micReady, setMicReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(true);

  const [micVolume, setMicVolume] = useState(0);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [faceDetector, setFaceDetector] = useState<FaceDetector | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);

  const violationCountRef = useRef(0);

  const [isOffline, setIsOffline] = useState(false);
  const [reconnectTimeLeft, setReconnectTimeLeft] = useState(120);

  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  const [timer, setTimer] = useState(INTERVIEW_DURATION);
  const [sessionDetails, setSessionDetails] = useState<any>(null);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCamExpanded, setIsCamExpanded] = useState(false);

  const systemVideoRef = useRef<HTMLVideoElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const thinkingStartTimeRef = useRef<number | null>(null);
  const finalThinkingTimeRef = useRef<number>(0);
  const finishAfterSubmitRef = useRef(false);

  const [showThankYou, setShowThankYou] = useState(false);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const screenShareViolationRef = useRef(0);
  const [screenReady, setScreenReady] = useState(false);

  const IDLE_REMINDER_DELAY = 10000;
  const idleReminderTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [idleReminderSpoken, setIdleReminderSpoken] = useState(false);
  const [userName, setUserName] = useState<string>("there");

  // INITIALIZATION

  useEffect(() => {
    let mounted = true;
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
        if (!mounted) return;
        setFaceDetector(detector);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Failed to load Face Detector:", error);
        toast.error("Failed to load AI Face Detector. Please refresh.");
      }
    };

    initializeFaceDetector();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const initSession = async () => {
      if (!mockId) {
        setLoading(false);
        return;
      }

      try {
        const res = await api.get(`/interview/session/${mockId}`);
        if (res.data.success) {
          setSessionDetails(res.data.session);
          if (res.data.userName) {
            setUserName(res.data.userName);
          }
          if (res.data.session.startTime && res.data.session.endTime) {
            const now = new Date();
            const endTime = new Date(res.data.session.endTime);
            const remaining = Math.max(
              0,
              Math.floor((endTime.getTime() - now.getTime()) / 1000)
            );
            setTimer(remaining);
          }
          if (res.data.session.phase) {
            setPhase(res.data.session.phase);
          }
        }
      } catch (error) {
        console.error("Failed to fetch session:", error);
        toast.error("Failed to load interview session");
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, [mockId]);

  useEffect(() => {
    if (!mockId || !testStarted || testFinished) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue =
        "Interview in progress. Are you sure you want to leave?";
      return event.returnValue;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [mockId, testStarted, testFinished]);

  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        const newValue = prev > 0 ? prev - 1 : 0;
        if (
          newValue === 0 &&
          phase !== "completed" &&
          phase !== "thankyou"
        ) {
          handleAutoComplete();
        }
        return newValue;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, phase, submitting, isRecording, isSpeaking]);

  // INTERVIEW FLOW

  const ensureInterviewSession = async (): Promise<string | null> => {
    if (mockId) return mockId;

    const rawPayload = sessionStorage.getItem(PENDING_INTERVIEW_PAYLOAD_KEY);
    if (!rawPayload) {
      toast.error("Interview setup expired. Please start again.");
      router.push("/dashboard/mock-interview");
      return null;
    }

    try {
      const payload = JSON.parse(rawPayload);
      const res = await api.post("/interview/create", payload);

      if (!res.data?.success || !res.data?.mock_id) {
        toast.error("Failed to start interview. Please try again.");
        return null;
      }

      const newMockId = String(res.data.mock_id);
      setMockId(newMockId);
      sessionStorage.removeItem(PENDING_INTERVIEW_PAYLOAD_KEY);
      router.replace(`/mock-interview?id=${newMockId}`);
      return newMockId;
    } catch (error) {
      console.error("Failed to create interview session:", error);
      toast.error("Failed to start interview. Please try again.");
      return null;
    }
  };

  const startInteractiveInterview = async (
    sessionId?: string
  ): Promise<boolean> => {
    const activeMockId = sessionId || mockId;
    if (!activeMockId) return false;

    try {
      const res = await api.get(`/interview/session/${activeMockId}`);
      if (
        res.data.success &&
        res.data.session.questionIds?.length > 0
      ) {
        const firstQuestion = res.data.session.questionIds[0];
        setCurrentQuestion({
          id: firstQuestion._id,
          question_text: firstQuestion.question_text,
          phase: "intro",
        });
        setPhase("intro");
        return true;
      }
    } catch (error) {
      console.error("Failed to start interview:", error);
      toast.error("Failed to start interview");
    }
    return false;
  };

  const handleAutoComplete = async () => {
    if (!mockId || phase === "completed" || phase === "thankyou") return;

    isFinishingTestRef.current = true;

    if (isRecording && mediaRecorderRef.current) {
      finishAfterSubmitRef.current = true;
      stopRecordingAndSubmit();
      return;
    }

    const finalMessage =
      "Thank you for your time! Your interview is complete.";
    setDisplayedQuestionText(finalMessage);
    await speakQuestion(finalMessage);

    setShowThankYou(true);
    setPhase("thankyou");

    setTimeout(async () => {
      await completeInterview();
    }, 2000);
  };

  const completeInterview = async () => {
    if (!mockId) return;

    try {
      setIsFinishing(true);

      if (idlePopupTimerRef.current) {
        clearTimeout(idlePopupTimerRef.current);
        idlePopupTimerRef.current = null;
      }
      if (idleReminderTimerRef.current) {
        clearTimeout(idleReminderTimerRef.current);
        idleReminderTimerRef.current = null;
      }
      setShowIdlePopup(false);

      await api.post("/interview/auto-submit", { mock_id: mockId });
      setPhase("completed");
      setTestFinished(true);
      setFinishReason("completed");
      setPopupOpen(true);
    } catch (error) {
      console.error("Failed to complete interview:", error);
      toast.error("Failed to complete interview");
    } finally {
      setIsFinishing(false);
    }
  };

  // AUDIO

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakQuestion = async (text: string): Promise<void> => {
    if (!text) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);
    setDisplayedQuestionText(text);
    thinkingStartTimeRef.current = null;
    finalThinkingTimeRef.current = 0;

    try {
      const ethnicity =
        sessionDetails?.interviewer_ethnicity || "indian";
      const gender = sessionDetails?.interviewer_gender || "female";

      const response = await api.post("/interview/synthesize-speech", {
        text,
        ethnicity,
        gender,
      });

      if (response.data.success && response.data.audio) {
        const audioData = `data:audio/mp3;base64,${response.data.audio}`;
        const audio = new Audio(audioData);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            setIsSpeaking(false);
            thinkingStartTimeRef.current = Date.now();
            audioRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            console.error("Audio playback error");
            setIsSpeaking(false);
            thinkingStartTimeRef.current = Date.now();
            audioRef.current = null;
            reject(new Error("Audio playback error"));
          };

          audio.play().catch(reject);
        });
      } else {
        throw new Error("No audio received from TTS API");
      }
    } catch (error: any) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
      thinkingStartTimeRef.current = Date.now();
    }
  };

  const speakFeedbackThenQuestion = async (
    feedback: string,
    questionText: string
  ) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    setIsSpeaking(true);
    thinkingStartTimeRef.current = null;
    finalThinkingTimeRef.current = 0;

    const ethnicity = sessionDetails?.interviewer_ethnicity || "indian";
    const gender = sessionDetails?.interviewer_gender || "female";

    const feedbackClean = feedback?.trim() || "";
    const questionClean = questionText?.trim() || "";

    let combinedText = "";
    if (feedbackClean && questionClean) {
      combinedText = `${feedbackClean} ${questionClean}`;
    } else if (questionClean) {
      combinedText = questionClean;
    } else if (feedbackClean) {
      combinedText = feedbackClean;
    }

    setDisplayedQuestionText(combinedText);

    if (!combinedText) {
      setIsSpeaking(false);
      thinkingStartTimeRef.current = Date.now();
      return;
    }

    try {
      const response = await api.post("/interview/synthesize-speech", {
        text: combinedText,
        ethnicity,
        gender,
      });

      if (response.data.success && response.data.audio) {
        const audioData = `data:audio/mp3;base64,${response.data.audio}`;
        const audio = new Audio(audioData);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            audioRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            audioRef.current = null;
            reject(new Error("Audio playback error"));
          };

          audio.play().catch(reject);
        });
      } else {
        throw new Error("No audio received from TTS API");
      }

      setIsSpeaking(false);
      thinkingStartTimeRef.current = Date.now();
    } catch (error: any) {
      console.error("TTS Error:", error);
      setIsSpeaking(false);
      thinkingStartTimeRef.current = Date.now();
    }
  };

  useEffect(() => {
    if (
      testStarted &&
      currentQuestion?.question_text &&
      !currentQuestion?.feedbackSpoken
    ) {
      speakQuestion(currentQuestion.question_text);
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [currentQuestion?.id, testStarted]);

  // Idle Reminder

  const speakIdleReminder = async () => {
    if (
      isRecording ||
      isSpeaking ||
      submitting ||
      testFinished ||
      showViolationPopup ||
      showExitConfirm ||
      phase === "completed" ||
      phase === "thankyou"
    ) {
      return;
    }

    const reminderText = `Hey ${userName}, it seems you have been idle for a while. Please click the speak button to answer the question.`;

    try {
      const ethnicity =
        sessionDetails?.interviewer_ethnicity || "indian";
      const gender = sessionDetails?.interviewer_gender || "female";

      setIsSpeaking(true);

      const response = await api.post("/interview/synthesize-speech", {
        text: reminderText,
        ethnicity,
        gender,
      });

      if (response.data.success && response.data.audio) {
        const audioData = `data:audio/mp3;base64,${response.data.audio}`;
        const audio = new Audio(audioData);
        audioRef.current = audio;

        await new Promise<void>((resolve, reject) => {
          audio.onended = () => {
            setIsSpeaking(false);
            audioRef.current = null;
            resolve();
          };

          audio.onerror = () => {
            setIsSpeaking(false);
            audioRef.current = null;
            reject(new Error("Audio playback error"));
          };

          audio.play().catch(reject);
        });

        idlePopupTimerRef.current = setTimeout(() => {
          if (!showViolationPopup && !showExitConfirm) {
            setShowIdlePopup(true);
          }
        }, IDLE_POPUP_DELAY);
      }
    } catch (error) {
      console.error("Idle reminder TTS error:", error);
      setIsSpeaking(false);

      idlePopupTimerRef.current = setTimeout(() => {
        if (!showViolationPopup && !showExitConfirm) {
          setShowIdlePopup(true);
        }
      }, IDLE_POPUP_DELAY);
    }
  };

  useEffect(() => {
    if (idleReminderTimerRef.current) {
      clearTimeout(idleReminderTimerRef.current);
      idleReminderTimerRef.current = null;
    }

    if (
      testStarted &&
      !isSpeaking &&
      !isRecording &&
      !submitting &&
      currentQuestion &&
      !idleReminderSpoken &&
      !testFinished &&
      !showIdlePopup &&
      !showViolationPopup &&
      !showExitConfirm &&
      phase !== "completed" &&
      phase !== "thankyou"
    ) {
      idleReminderTimerRef.current = setTimeout(() => {
        speakIdleReminder();
        setIdleReminderSpoken(true);
      }, IDLE_REMINDER_DELAY);
    }

    return () => {
      if (idleReminderTimerRef.current) {
        clearTimeout(idleReminderTimerRef.current);
        idleReminderTimerRef.current = null;
      }
    };
  }, [
    testStarted,
    isSpeaking,
    isRecording,
    submitting,
    currentQuestion?.id,
    testFinished,
    phase,
    idleReminderSpoken,
    showIdlePopup,
    showViolationPopup,
    showExitConfirm,
  ]);

  useEffect(() => {
    setIdleReminderSpoken(false);
    setShowIdlePopup(false);
    if (idlePopupTimerRef.current) {
      clearTimeout(idlePopupTimerRef.current);
      idlePopupTimerRef.current = null;
    }
  }, [currentQuestion?.id]);

  const handleIdleContinue = () => {
    setShowIdlePopup(false);
    setIdleReminderSpoken(false);
    if (idlePopupTimerRef.current) {
      clearTimeout(idlePopupTimerRef.current);
      idlePopupTimerRef.current = null;
    }
  };

  const handleIdleAutoSubmit = async () => {
    if (testFinished || isFinishing) return;

    isFinishingTestRef.current = true;

    setShowIdlePopup(false);
    if (idlePopupTimerRef.current) {
      clearTimeout(idlePopupTimerRef.current);
      idlePopupTimerRef.current = null;
    }
    if (idleReminderTimerRef.current) {
      clearTimeout(idleReminderTimerRef.current);
      idleReminderTimerRef.current = null;
    }
    await completeInterview();
  };

  // Recording

  const startRecording = async () => {
    try {
      if (idleReminderTimerRef.current) {
        clearTimeout(idleReminderTimerRef.current);
        idleReminderTimerRef.current = null;
      }
      if (idlePopupTimerRef.current) {
        clearTimeout(idlePopupTimerRef.current);
        idlePopupTimerRef.current = null;
      }
      setShowIdlePopup(false);

      if (thinkingStartTimeRef.current) {
        const durationMs = Date.now() - thinkingStartTimeRef.current;
        finalThinkingTimeRef.current = Math.floor(durationMs / 1000);
      } else {
        finalThinkingTimeRef.current = 0;
      }

      window.speechSynthesis.cancel();
      setIsSpeaking(false);

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error accessing microphone:", error);
      toast.error("Could not access microphone.");
    }
  };

  const stopRecordingAndSubmit = async () => {
    if (!mediaRecorderRef.current || !currentQuestion || !mockId) return;

    setSubmitting(true);
    mediaRecorderRef.current.stop();

    mediaRecorderRef.current.onstop = async () => {
      const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
      });
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");
      formData.append("qid", currentQuestion.id);
      formData.append("mock_id", mockId);
      formData.append(
        "thinking_time",
        finalThinkingTimeRef.current.toString()
      );

      if (
        currentQuestion.phase === "outro" ||
        phase === "outro"
      ) {
        formData.append("phase", "outro");
      }

      try {
        const res = await api.post("/interview/submit", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        if (res.data.success) {
          const { ai_response, question, isComplete } = res.data;

          setIsRecording(false);
          setSubmitting(false);
          mediaRecorderRef.current?.stream
            .getTracks()
            .forEach((track) => track.stop());

          if (isComplete) {
            setDisplayedQuestionText(ai_response);
            await speakQuestion(ai_response);
            setShowThankYou(true);
            setPhase("thankyou");
            setTimeout(() => {
              finishTest("completed");
            }, 2000);
            return;
          }

          if (question.question_id === currentQuestion?.id) {
            await speakQuestion(ai_response);
            setCurrentQuestion({
              id: question.question_id,
              question_text: question.question_text || ai_response,
              phase:
                question.question_phase || currentQuestion.phase,
              feedbackSpoken: true,
            });
            return;
          }

          const newQuestionCount = questionsAnswered + 1;
          setQuestionsAnswered(newQuestionCount);

          setConversationHistory((prev) => [
            ...prev,
            {
              question: currentQuestion.question_text,
              answered: true,
            },
          ]);

          await speakQuestion(ai_response);

          setCurrentQuestion({
            id: question.question_id,
            question_text: question.question_text,
            phase: question.question_phase,
            feedbackSpoken: true,
          });

          if (question.question_phase === "outro") {
            setPhase("outro");
          } else if (phase === "intro") {
            setPhase("main");
          }
        }
      } catch (error) {
        console.error("Error submitting answer:", error);
        toast.error("Failed to submit answer. Please try again.");
      } finally {
        setIsRecording(false);
        setSubmitting(false);
        mediaRecorderRef.current?.stream
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  };

  // PROCTORING

  const finishTest = async (
    reason:
      | "completed"
      | "timeout"
      | "violation"
      | "network_failure" = "completed"
  ) => {
    if (!mockId || testFinished || isFinishingTestRef.current) return;

    isFinishingTestRef.current = true;

    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }

    try {
      setIsFinishing(true);
      await api.post("/interview/auto-submit", {
        mock_id: mockId,
        reason: reason,
      });
      setTestFinished(true);
      setFinishReason(reason);
      setShowThankYou(false);
      setPopupOpen(true);
    } catch (error) {
      console.error("Error finishing interview:", error);
    } finally {
      setIsFinishing(false);
    }
  };

  const triggerViolationPopup = (reason: string, isImmediate = false) => {
    if (
      showViolationPopup ||
      testFinished ||
      isFinishingTestRef.current ||
      phase === "thankyou" ||
      phase === "completed"
    )
      return;

    if (isImmediate) {
      immediateViolationCountRef.current++;
      if (immediateViolationCountRef.current >= 3) {
        finishTest("violation");
        return;
      }
      reason = `${reason} (Warning ${immediateViolationCountRef.current}/2)`;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    window.speechSynthesis.cancel();

    setViolationReason(reason);
    setViolationCountdown(15);
    setShowViolationPopup(true);

    let countdown = 15;
    violationTimerRef.current = setInterval(() => {
      countdown--;
      setViolationCountdown(countdown);

      if (countdown <= 0) {
        if (violationTimerRef.current)
          clearInterval(violationTimerRef.current);
        setShowViolationPopup(false);
        finishTest("violation");
      }
    }, 1000);
  };

  const handleViolationContinue = async () => {
    if (violationTimerRef.current) clearInterval(violationTimerRef.current);
    setShowViolationPopup(false);
    setViolationCountdown(15);

    if (audioRef.current && audioRef.current.paused) {
      audioRef.current.play().catch(() => { });
    }

    await enterFullscreen();
  };

  const handleViolationSubmit = () => {
    if (violationTimerRef.current) clearInterval(violationTimerRef.current);
    setShowViolationPopup(false);
    finishTest("violation");
  };

  // HEARTBEAT
  useEffect(() => {
    if (!testStarted || testFinished || !mockId) return;

    const interval = setInterval(async () => {
      try {
        await api.post("/interview/heartbeat", { mock_id: mockId });
      } catch (err) {
        console.error("Heartbeat failed:", err);
      }
    }, 25000);

    return () => clearInterval(interval);
  }, [testStarted, testFinished, mockId]);

  // Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isNowFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isNowFullscreen);

      if (
        !isNowFullscreen &&
        testStarted &&
        !testFinished &&
        !showViolationPopup
      ) {
        triggerViolationPopup("Exited fullscreen mode", true);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener(
        "fullscreenchange",
        handleFullscreenChange
      );
  }, [testStarted, testFinished, showViolationPopup]);

  // Tab/Window visibility
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !showViolationPopup) {
        triggerViolationPopup("Tab switch detected", true);
      }
    };

    const handleWindowBlur = () => {
      if (!showViolationPopup) {
        triggerViolationPopup("Window focus lost", true);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [testStarted, testFinished, showViolationPopup]);

  // Dev Tools & Keyboard Prevention
  useEffect(() => {
    if (!testStarted || testFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        if (!showViolationPopup) {
          triggerViolationPopup("Developer tools attempted (F12)", true);
        }
        return;
      }

      if (
        e.ctrlKey &&
        e.shiftKey &&
        ["I", "i", "J", "j", "C", "c"].includes(e.key)
      ) {
        e.preventDefault();
        if (!showViolationPopup) {
          triggerViolationPopup("Developer tools shortcut detected", true);
        }
        return;
      }

      if (e.ctrlKey && (e.key === "U" || e.key === "u")) {
        e.preventDefault();
        if (!showViolationPopup) {
          triggerViolationPopup("View source attempted", true);
        }
        return;
      }

      if (
        e.key === "ContextMenu" ||
        (e.shiftKey && e.key === "F10")
      ) {
        e.preventDefault();
        return;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      toast.warning("Right-click is disabled during the interview.");
    };

    const checkDevTools = () => {
      const widthThreshold = window.outerWidth - window.innerWidth > 160;
      const heightThreshold =
        window.outerHeight - window.innerHeight > 160;

      if ((widthThreshold || heightThreshold) && !showViolationPopup) {
        triggerViolationPopup("Developer tools detected", true);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("contextmenu", handleContextMenu);

    const devToolsCheckInterval = setInterval(checkDevTools, 2000);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("contextmenu", handleContextMenu);
      clearInterval(devToolsCheckInterval);
    };
  }, [testStarted, testFinished, showViolationPopup]);

  // Face Detection
  useEffect(() => {
    if (
      !testStarted ||
      testFinished ||
      !faceDetector ||
      !videoRef.current ||
      showViolationPopup
    )
      return;

    const detectionInterval = setInterval(() => {
      if (!videoRef.current || !faceDetector || showViolationPopup) return;

      const detections = faceDetector.detectForVideo(
        videoRef.current,
        Date.now()
      ).detections;
      const now = Date.now();

      if (detections.length === 0 || detections.length > 1) {
        if (now - lastFaceWarningTimeRef.current < WARNING_COOLDOWN_MS)
          return;

        faceWarningCountRef.current++;
        lastFaceWarningTimeRef.current = now;

        const warningType =
          detections.length === 0
            ? "Face not detected"
            : "Multiple faces detected";

        if (faceWarningCountRef.current >= 4) {
          finishTest("violation");
        } else if (
          faceWarningCountRef.current >= MAX_PROCTORING_WARNINGS
        ) {
          triggerViolationPopup(
            `${warningType} (${MAX_PROCTORING_WARNINGS}/${MAX_PROCTORING_WARNINGS})`
          );
        } else {
          toast.warning(
            `${warningType} (${faceWarningCountRef.current}/${MAX_PROCTORING_WARNINGS})`
          );
        }
      }
    }, 1000);

    return () => clearInterval(detectionInterval);
  }, [testStarted, testFinished, faceDetector, showViolationPopup]);

  // Mic Noise Monitoring
  useEffect(() => {
    if (!testStarted || testFinished || showViolationPopup) return;

    const noiseCheckInterval = setInterval(() => {
      if (isRecording || isSpeaking || showViolationPopup) {
        noisyStartTimeRef.current = null;
        return;
      }

      if (!analyserRef.current) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const normalizedVol = Math.min(
        1,
        sum / dataArray.length / 30
      );

      if (normalizedVol > NOISE_THRESHOLD) {
        if (noisyStartTimeRef.current === null) {
          noisyStartTimeRef.current = Date.now();
        } else if (
          Date.now() - noisyStartTimeRef.current >=
          NOISE_DURATION_MS
        ) {
          const now = Date.now();
          if (
            now - lastMicWarningTimeRef.current <
            WARNING_COOLDOWN_MS
          )
            return;

          micWarningCountRef.current++;
          lastMicWarningTimeRef.current = now;
          noisyStartTimeRef.current = null;

          if (micWarningCountRef.current >= 4) {
            finishTest("violation");
          } else if (
            micWarningCountRef.current >= MAX_PROCTORING_WARNINGS
          ) {
            triggerViolationPopup(
              `Noisy environment (${MAX_PROCTORING_WARNINGS}/${MAX_PROCTORING_WARNINGS})`
            );
          } else {
            toast.warning(
              `Noisy environment detected (${micWarningCountRef.current}/${MAX_PROCTORING_WARNINGS}). Please find a quieter place.`
            );
          }
        }
      } else {
        noisyStartTimeRef.current = null;
      }
    }, 500);

    return () => clearInterval(noiseCheckInterval);
  }, [
    testStarted,
    testFinished,
    isRecording,
    isSpeaking,
    showViolationPopup,
  ]);

  // Network Stability
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const handleOnline = () => {
      setIsOffline(false);
      setReconnectTimeLeft(120);
      toast.success("Connection restored.");
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

  // Screen Share
  const startScreenShare = async () => {
    try {
      const displayStream =
        await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });

      const videoTrack = displayStream.getVideoTracks()[0];
      const settings = videoTrack.getSettings();

      if (settings.displaySurface !== "monitor") {
        videoTrack.stop();
        toast.error("You must share your entire screen.");
        return;
      }

      screenStreamRef.current = displayStream;
      setScreenReady(true);

      videoTrack.onended = () => {
        finishTest("violation");
      };
    } catch (err) {
      toast.error("Screen sharing is mandatory to continue.");
      setScreenReady(false);
    }
  };

  useEffect(() => {
    if (!testStarted || testFinished) return;

    const interval = setInterval(() => {
      const stream = screenStreamRef.current;
      if (!stream) return;

      const track = stream.getVideoTracks()[0];
      if (!track || track.readyState === "ended") {
        finishTest("violation");
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [testStarted, testFinished]);

  // MEDIA SETUP
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

    const updateVolume = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const normalizedVol = Math.min(1, sum / dataArray.length / 30);
      setMicVolume(normalizedVol);
      rafIdRef.current = requestAnimationFrame(updateVolume);
    };
    updateVolume();
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

        await startScreenShare();

        if (systemVideoRef.current) {
          systemVideoRef.current.srcObject = stream;
          systemVideoRef.current.play().catch(() => { });
        }
      } catch (err) {
        console.error("Media error:", err);
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

  useEffect(() => {
    if (testStarted && videoRef.current && cameraStreamRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
      videoRef.current.play().catch(() => { });
    }
  }, [testStarted]);

  // UTILS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStartTest = async () => {
    if (
      !cameraReady ||
      !micReady ||
      !screenReady ||
      isOffline ||
      isModelLoading
    ) {
      toast.error("Please complete all system checks.");
      return;
    }

    await enterFullscreen();
    const activeMockId = await ensureInterviewSession();
    if (!activeMockId) return;

    setTestStarted(true);
    const started = await startInteractiveInterview(activeMockId);
    if (!started) {
      setTestStarted(false);
    }
  };

  const handleExit = () => {
    setShowExitConfirm(true);
  };

  const confirmExit = async () => {
    setShowExitConfirm(false);

    isFinishingTestRef.current = true;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setIsSpeaking(false);
    window.speechSynthesis.cancel();

    if (isRecording) {
      finishAfterSubmitRef.current = true;
      await stopRecordingAndSubmit();
    } else {
      await completeInterview();
    }
  };

  const getPhaseLabel = () => {
    switch (phase) {
      case "intro":
        return "Introduction";
      case "main":
        return "Interview";
      case "outro":
        return "Final Question";
      case "thankyou":
        return "Thank You";
      case "completed":
        return "Completed";
      default:
        return "Interview";
    }
  };

  // ─── RENDER: LOADING ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <main className="w-full h-screen bg-[#151515] flex items-center justify-center">
        {/* Navy spinner instead of plain white */}
        <Loader2 className="animate-spin text-[#ed3336] w-10 h-10" />
      </main>
    );
  }

  // ─── RENDER: SYSTEM CHECK ──────────────────────────────────────────────────

  if (!testStarted) {
    return (
      <main className="w-full h-screen p-3 sm:p-5 md:p-8 lg:p-10 bg-[#F2F2F2] flex flex-col items-center justify-center">
        <Toaster position="top-right" richColors />

        <div className="bg-white p-4 sm:p-8 md:p-10 lg:p-12 rounded-2xl shadow-xl border border-gray-200 max-w-4xl w-full flex flex-col gap-4 sm:gap-8 lg:gap-12">
          <div className="flex flex-col items-center gap-2 text-center">
            {/* Navy heading */}
            <h1 className="text-xl sm:text-3xl font-bold text-[#ed3336]">
              Interactive Interview System Check
            </h1>
            <p className="text-sm sm:text-base text-gray-500">
              This is a 10-minute interactive interview. Questions will be
              generated based on your responses.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-4 sm:gap-8 lg:gap-12">
            {/* Video Preview */}
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
                  {/* Camera badge — cream bg + navy text when ready */}
                  <div
                    className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 backdrop-blur-md ${cameraReady
                      ? "bg-[#f7fbfa] text-[#ed3336] border border-[#ed3336]/30"
                      : "bg-red-500/20 text-red-300 border border-red-500/30"
                      }`}
                  >
                    <Video size={12} />{" "}
                    {cameraReady ? "Camera On" : "Camera Off"}
                  </div>
                  {/* Mic badge */}
                  <div
                    className={`px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium flex items-center gap-1 backdrop-blur-md ${micReady
                      ? "bg-[#f7fbfa] text-[#ed3336] border border-[#ed3336]/30"
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

            {/* Checklist */}
            <div className="flex-1 flex flex-col justify-center gap-3 sm:gap-4 lg:gap-6">
              <h3 className="font-semibold text-base sm:text-lg text-[#ed3336]">
                Required Permissions
              </h3>

              <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                <CheckItem
                  label="Webcam Access"
                  status={cameraReady}
                  icon={<Video size={18} className="sm:w-5 sm:h-5" />}
                />
                <CheckItem
                  label="Microphone Access"
                  status={micReady}
                  icon={<Mic size={18} className="sm:w-5 sm:h-5" />}
                />
                <CheckItem
                  label="Screen Sharing"
                  status={screenReady}
                  icon={<Monitor size={18} className="sm:w-5 sm:h-5" />}
                />
                <CheckItem
                  label="Internet Connection"
                  status={!isOffline}
                  icon={<WifiOff size={18} className="sm:w-5 sm:h-5" />}
                />
                <CheckItem
                  label="Session Proctoring"
                  status={!isModelLoading}
                  icon={
                    <ShieldCheck size={18} className="sm:w-5 sm:h-5" />
                  }
                />
              </div>

              <div className="mt-4 sm:mt-6 lg:mt-8">
                {/* Start button — crimson when enabled, gray when not */}
                <button
                  onClick={handleStartTest}
                  disabled={
                    !cameraReady ||
                    !micReady ||
                    !screenReady ||
                    isOffline ||
                    isModelLoading
                  }
                  className={`w-full py-3 sm:py-3.5 rounded-xl font-bold text-base sm:text-lg transition-all shadow-md flex items-center justify-center gap-2 ${cameraReady &&
                    micReady &&
                    screenReady &&
                    !isOffline &&
                    !isModelLoading
                    ? "bg-[#184852] hover:bg-[#12383f] text-white cursor-pointer hover:shadow-lg hover:-translate-y-0.5"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                >
                  {isModelLoading
                    ? "Waiting for Interviewer..."
                    : !screenReady
                      ? "Waiting for Screen Share..."
                      : "Start Mock Interview"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ─── RENDER: INTERVIEW ─────────────────────────────────────────────────────

  return (
    <main className="w-full h-screen bg-[#151515] overflow-hidden relative font-sans text-white">
      <Toaster position="top-right" richColors />

      {/* FINISHING OVERLAY */}
      {isFinishing && (
        <div className="fixed inset-0 z-[100] bg-[#17383d]/90 backdrop-blur-md flex flex-col items-center justify-center pointer-events-auto">
          {/* Navy spinner */}
          <Loader2 className="w-16 h-16 text-[#ed3336] animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">
            Wrapping Up Interview...
          </h2>
          <p className="text-gray-400">
            Please wait while we secure your session data.
          </p>
        </div>
      )}

      {/* RECONNECTING OVERLAY */}
      {isOffline && !testFinished && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/90 flex flex-col items-center justify-center text-white text-center p-6">
          <WifiOff size={64} className="mb-4 text-[#184852] animate-pulse" />
          <h1 className="text-3xl font-bold mb-2">Connection Lost</h1>
          <p className="text-lg text-gray-300 max-w-md">
            We are attempting to reconnect. Auto-termination in:
          </p>
          <p className="text-4xl font-mono font-bold text-[#184852] mt-4">
            {Math.floor(reconnectTimeLeft / 60)}:
            {String(reconnectTimeLeft % 60).padStart(2, "0")}
          </p>
        </div>
      )}

      {/* THANK YOU OVERLAY */}
      {showThankYou && (
        <div className="fixed inset-0 z-50 bg-[#151515] flex flex-col items-center justify-center text-white text-center p-6">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col items-center"
          >
            {/* Navy check circle instead of green */}
            <CheckCircle size={80} className="mb-6 text-[#ed3336]" />
            <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
            <p className="text-xl text-gray-300">
              Your interview has been completed successfully.
            </p>
            <p className="text-gray-400 mt-2">Generating your results...</p>
            {/* Navy spinner */}
            <Loader2 className="animate-spin mt-6 w-8 h-8 text-[#ed3336]" />
          </motion.div>
        </div>
      )}

      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full flex items-center justify-between p-3 sm:p-6 md:p-8 z-10 pointer-events-none">
        <div className="flex items-center gap-2 sm:gap-4 pointer-events-auto bg-[#17383d]/40 backdrop-blur-md rounded-full px-3 py-1.5 sm:px-4 sm:py-2 border border-white/10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Phase dot — navy for intro/outro, crimson for main */}
            <span
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${phase === "intro"
                ? "bg-[#f7fbfa]"
                : phase === "outro"
                  ? "bg-[#f7fbfa]"
                  : "bg-[#ed3336]"
                }`}
            />
            <span className="text-xs sm:text-sm font-medium text-white/90">
              {getPhaseLabel()}
            </span>
          </div>
          <div className="w-px h-3 sm:h-4 bg-white/20" />
          {/* Timer — crimson when under 2 min */}
          <div
            className={`flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-mono ${timer <= 120 ? "text-[#184852]" : "text-gray-300"
              }`}
          >
            <Clock size={12} className="sm:w-[14px] sm:h-[14px]" />
            {formatTime(INTERVIEW_DURATION - timer)}
          </div>
        </div>

        {/* Interview Title - Center */}
        <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto max-w-[40%] sm:max-w-[400px] md:max-w-[500px] lg:max-w-[700px]">
          <div className="relative group">
            <div className="bg-[#17383d]/40 backdrop-blur-md rounded-full px-3 py-1.5 sm:px-5 sm:py-2 border border-white/10 truncate max-w-full">
              <span className="text-xs sm:text-sm font-medium text-white/90 truncate block">
                {sessionDetails?.type === "jobtitle"
                  ? sessionDetails?.job_title || "Interview"
                  : "Skill Based"}
              </span>
            </div>
            {/* Tooltip for skills */}
            {sessionDetails?.type === "skills" &&
              sessionDetails?.skills?.length > 0 && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                  <div className="bg-[#17383d]/90 backdrop-blur-md rounded-lg px-4 py-3 border border-white/20 shadow-xl min-w-max">
                    <p className="text-xs text-white/60 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {sessionDetails.skills.map(
                        (skill: string, idx: number) => (
                          <span
                            key={idx}
                            /* Cream bg + navy text for skill pills */
                            className="text-xs bg-[#f7fbfa]/20 text-[#f7fbfa] px-2 py-1 rounded-full border border-[#f7fbfa]/30"
                          >
                            {skill}
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Finish button — crimson */}
        <button
          onClick={handleExit}
          disabled={isFinishing || submitting}
          className={`pointer-events-auto bg-[#184852]/90 hover:bg-[#184852] text-white px-3 py-1.5 sm:px-6 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2 backdrop-blur-md ${isFinishing || submitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
        >
          {isFinishing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            "Finish"
          )}
        </button>
      </div>

      {/* QUESTION DISPLAY */}
      {displayedQuestionText && (
        <div className="absolute top-20 sm:top-24 left-1/2 -translate-x-1/2 z-20 w-full max-w-3xl px-4 sm:px-6">
          <div
            /* Navy glow border when speaking */
            className={`relative bg-[#17383d]/60 backdrop-blur-xl rounded-2xl p-4 sm:p-6 border transition-all duration-300 ${isSpeaking
              ? "border-[#ed3336] shadow-[0_0_30px_rgba(24,72,82,0.32)]"
              : "border-white/10"
              }`}
          >
            <p className="text-white text-base sm:text-lg leading-relaxed">
              {displayedQuestionText}
            </p>
          </div>
        </div>
      )}

      {/* MAIN CONTENT - Interviewer */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pt-28 sm:pt-40">
        {/* Pulsing Aura — navy when speaking */}
        {isSpeaking && (
          <div className="absolute w-[300px] h-[300px] sm:w-[500px] sm:h-[500px] md:w-[600px] md:h-[600px] lg:w-[700px] lg:h-[700px] bg-[#ed3336]/20 rounded-full blur-[60px] sm:blur-[100px] animate-pulse" />
        )}

        {/* Avatar */}
        <div className="relative z-10 flex flex-col items-center gap-4 sm:gap-6">
          <div
            className={`w-28 h-28 sm:w-40 sm:h-40 md:w-48 md:h-48 lg:w-56 lg:h-56 rounded-full flex items-center justify-center border-4 shadow-2xl transition-all duration-300 overflow-hidden ${isSpeaking
              ? /* Navy border glow when interviewer speaks */
              "border-[#ed3336] scale-105 shadow-[0_0_40px_rgba(24,72,82,0.32)]"
              : isRecording && !submitting
                ? /* Crimson glow when candidate records */
                "border-[#184852]/50 shadow-[0_0_30px_rgba(242,130,92,0.3)] scale-105"
                : "border-white/10 bg-white/5"
              }`}
          >
            <Image
              src={(() => {
                const eth = (
                  sessionDetails?.interviewer_ethnicity || "indian"
                ).toLowerCase();
                const gen = (
                  sessionDetails?.interviewer_gender || "female"
                ).toLowerCase();

                if (eth.includes("china") || eth.includes("chinese"))
                  return gen === "male" ? ChinaMale : ChinaFemale;
                if (eth.includes("malay") || eth.includes("malasia"))
                  return gen === "male" ? MalasiaMale : MalasiaFemale;
                return gen === "male" ? IndianMale : IndianFemale;
              })()}
              alt="Interviewer"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="text-center">
            <p className="text-xs sm:text-sm text-white/40 mt-1 uppercase tracking-widest font-medium">
              {getVoiceName(
                sessionDetails?.interviewer_ethnicity,
                sessionDetails?.interviewer_gender
              )}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM CONTROLS */}
      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-4 sm:gap-6 w-full max-w-md pointer-events-auto px-4">
        {!isRecording ? (
          /* Start Speaking — navy */
          <button
            onClick={startRecording}
            disabled={submitting || isSpeaking || testFinished}
            className={`group relative flex items-center justify-center gap-2 sm:gap-3 px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium text-base sm:text-lg transition-all w-full sm:w-auto ${isSpeaking || submitting || testFinished
              ? "bg-[#ed3336]/40 text-white/40 cursor-not-allowed border border-white/5 shadow-none"
              : "bg-[#ed3336] text-white hover:bg-[#9E0A23] shadow-lg shadow-[#ed3336]/20 hover:shadow-[#ed3336]/40 hover:-translate-y-1"
              }`}
          >
            <Mic className="group-hover:scale-110 transition-transform w-5 h-5 sm:w-6 sm:h-6" />
            <span>Start Speaking</span>
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
            {!submitting && (
              /* Recording indicator — crimson */
              <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#184852]/10 rounded-full border border-[#184852]/20 text-[#184852] text-xs sm:text-sm animate-pulse">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#184852] rounded-full" />
                Listening...
              </div>
            )}

            {/* Finish Speaking — crimson */}
            <button
              onClick={stopRecordingAndSubmit}
              disabled={submitting}
              className="bg-[#184852] hover:bg-[#12383f] text-white px-6 py-3 sm:px-8 sm:py-4 rounded-full font-medium text-base sm:text-lg shadow-lg hover:shadow-[#184852]/40 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto"
            >
              {submitting ? (
                <Loader2 className="animate-spin w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <StopCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
              <span>{submitting ? "Processing..." : "Finish Speaking"}</span>
            </button>
          </div>
        )}
      </div>

      {/* CANDIDATE CAMERA */}
      <div
        className={`absolute bottom-20 right-4 sm:bottom-6 sm:right-6 z-30 flex flex-col items-end gap-2 group transition-all duration-300 ${isCamExpanded
          ? "w-[60%] sm:w-[40%] aspect-video"
          : "w-28 sm:w-48 md:w-56 aspect-video"
          }`}
      >
        <div
          onClick={() => setIsCamExpanded(!isCamExpanded)}
          className="relative overflow-hidden rounded-xl bg-[#17383d] border border-white/10 shadow-2xl transition-all duration-300 hover:border-white/20 hover:scale-105 w-full h-full cursor-pointer"
        >
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover scale-x-[-1]"
          />
          {/* Status Indicators */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isRecording && !submitting ? (
              <div className="flex items-end gap-0.5 h-2 sm:h-3">
                <div className="w-1 bg-[#184852] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-1.5 sm:h-2 shadow-[0_0_10px_#184852]"></div>
                <div className="w-1 bg-[#ed3336] rounded-full animate-[pulse_0.8s_ease-in-out_infinite] h-2 sm:h-3 shadow-[0_0_10px_#ed3336]"></div>
                <div className="w-1 bg-[#f7fbfa] rounded-full animate-[pulse_0.5s_ease-in-out_infinite] h-1.5 sm:h-2 shadow-[0_0_10px_#f7fbfa]"></div>
              </div>
            ) : (
              <div
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${micReady ? "bg-[#ed3336]" : "bg-[#184852]"
                  }`}
              />
            )}
          </div>

          <div className="absolute inset-0 bg-[#17383d]/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
            <span className="text-white text-[10px] sm:text-xs font-medium backdrop-blur-md px-2 py-1 rounded-full bg-white/10">
              {isCamExpanded ? "Minimize" : "Expand"}
            </span>
          </div>
        </div>
        <p className="text-[10px] text-white/30 uppercase tracking-wider font-semibold mr-1">
          You
        </p>
      </div>

      {/* COMPLETION POPUP */}
      {popupOpen && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="w-[450px] bg-white flex flex-col items-center justify-center gap-6 rounded-2xl p-8 shadow-2xl border border-gray-200">
            <div className="w-full flex flex-col items-center text-center gap-2">
              <h1
                className={`text-2xl font-bold ${finishReason === "completed"
                  ? "text-[#ed3336]"
                  : "text-[#184852]"
                  }`}
              >
                {finishReason === "completed"
                  ? "Interview Completed"
                  : finishReason === "timeout"
                    ? "Time Limit Reached"
                    : finishReason === "violation"
                      ? "Interview Terminated"
                      : "Connection Failed"}
              </h1>

              <p className="text-gray-500 px-4">
                {finishReason === "completed" &&
                  "You have successfully finished the interview."}
                {finishReason === "timeout" && "Time ran out."}
                {finishReason === "violation" &&
                  "Proctoring violations detected."}
                {finishReason === "network_failure" &&
                  "Internet connection was lost for too long."}
              </p>
            </div>

            {finishReason === "completed" ? (
              <Image
                src={Success}
                alt="Success"
                className="w-[60%] h-auto"
              />
            ) : (
              <div className="w-32 h-32 bg-[#184852]/10 rounded-full flex items-center justify-center mb-2 animate-pulse">
                <AlertTriangle size={64} className="text-[#184852]" />
              </div>
            )}

            {/* View Result — navy for success, crimson for failure */}
            <button
              onClick={async () => {
                if (document.fullscreenElement) {
                  await document.exitFullscreen();
                }
                router.push(`/dashboard/my-interviews/${mockId}`);
              }}
              className={`w-full py-3 rounded-xl text-white font-semibold transition-all shadow-md ${finishReason === "completed"
                ? "bg-[#ed3336] hover:bg-[#9E0A23]"
                : "bg-[#184852] hover:bg-[#12383f]"
                }`}
            >
              View Result
            </button>
          </div>
        </div>
      )}

      {/* EXIT CONFIRMATION MODAL */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-[9999] bg-[#17383d]/80 flex items-center justify-center p-4">
          <div className="bg-[#17383d] border border-[#ed3336]/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-2">
              Finish Interview?
            </h2>
            <p className="text-gray-400 mb-6 text-sm">
              Are you sure you want to finish the interview early? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="px-4 py-2 rounded-lg bg-transparent text-gray-300 hover:text-white border border-gray-600 hover:border-gray-400 transition-colors text-sm font-medium"
              >
                Cancel
              </button>
              {/* Confirm — navy */}
              <button
                onClick={confirmExit}
                className="px-4 py-2 rounded-lg bg-[#ed3336] hover:bg-[#9E0A23] text-white shadow-lg shadow-[#ed3336]/20 transition-all text-sm font-medium"
              >
                Finish Early
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IDLE POPUP */}
      {showIdlePopup && !testFinished && (
        <div className="fixed inset-0 z-[9999] bg-[#17383d]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#17383d] border border-[#f7fbfa]/30 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#f7fbfa]/10 rounded-full flex items-center justify-center">
                <Clock size={28} className="text-[#f7fbfa]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Are You Still There?
                </h2>
                <p className="text-[#f7fbfa] text-sm">No response detected</p>
              </div>
            </div>

            <p className="text-gray-400 mb-6 text-sm">
              Hey {userName}, it seems you have been idle for a while. Click
              &quot;Continue Interview&quot; to resume, or your interview will
              be submitted automatically.
            </p>

            <div className="flex flex-col gap-3">
              {/* Continue — navy */}
              <button
                onClick={handleIdleContinue}
                className="w-full px-4 py-3 rounded-lg bg-[#ed3336] hover:bg-[#9E0A23] text-white font-medium transition-all"
              >
                Continue Interview
              </button>

              {/* Auto-submit — crimson fill */}
              <button
                onClick={handleIdleAutoSubmit}
                className="relative w-full px-4 py-3 rounded-lg bg-[#184852]/60 text-white font-medium overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-[#184852] animate-[fillProgress_15s_linear_forwards]"
                  style={{ transformOrigin: "left" }}
                  onAnimationEnd={handleIdleAutoSubmit}
                />
                <span className="relative z-10">Auto Submit</span>
              </button>
            </div>
            <style jsx>{`
              @keyframes fillProgress {
                from {
                  transform: scaleX(0);
                }
                to {
                  transform: scaleX(1);
                }
              }
            `}</style>
          </div>
        </div>
      )}

      {/* VIOLATION POPUP */}
      {showViolationPopup && !testFinished && (
        <div className="fixed inset-0 z-[9999] bg-[#17383d]/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-[#17383d] border border-[#184852]/50 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[#184852]/20 rounded-full flex items-center justify-center">
                <AlertTriangle size={28} className="text-[#184852]" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Violation Detected
                </h2>
                <p className="text-[#184852] text-sm">{violationReason}</p>
              </div>
            </div>

            <p className="text-gray-400 mb-6 text-sm">
              Final Warning: This action is against interview rules. You can
              continue the interview or submit now. Next violation will lead to
              termination of the interview.
            </p>

            <div className="flex flex-col gap-3">
              {/* Continue — navy */}
              <button
                onClick={handleViolationContinue}
                className="w-full px-4 py-3 rounded-lg bg-[#ed3336] hover:bg-[#9E0A23] text-white font-medium transition-all"
              >
                Continue Interview
              </button>

              {/* Auto-submit — crimson fill */}
              <button
                onClick={handleViolationSubmit}
                className="relative w-full px-4 py-3 rounded-lg bg-[#184852]/60 text-white font-medium overflow-hidden"
              >
                <div
                  className="absolute inset-0 bg-[#184852] animate-[fillProgress_15s_linear_forwards]"
                  style={{ transformOrigin: "left" }}
                />
                <span className="relative z-10">Auto Submit</span>
              </button>
            </div>
            <style jsx>{`
              @keyframes fillProgress {
                from {
                  transform: scaleX(0);
                }
                to {
                  transform: scaleX(1);
                }
              }
            `}</style>
          </div>
        </div>
      )}
    </main>
  );
};

export default ClientCode;

// ─── Helper Component ──────────────────────────────────────────────────────────

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
  <div className="flex items-center justify-between p-4 rounded-lg bg-[#F2F2F2] border border-gray-200">
    <div className="flex items-center gap-3">
      {/* Icon bg — cream + navy text when ready, light red when not */}
      <div
        className={`p-2 rounded-full ${status
          ? "bg-[#f7fbfa] text-[#ed3336]"
          : "bg-red-100 text-[#184852]"
          }`}
      >
        {icon}
      </div>
      <span className="font-medium text-gray-700">{label}</span>
    </div>
    <div className="flex items-center gap-2">
      {status ? (
        /* Navy check */
        <CheckCircle className="text-[#ed3336]" size={24} />
      ) : (
        /* Crimson X */
        <XCircle className="text-[#184852]" size={24} />
      )}
      {action}
    </div>
  </div>
);
