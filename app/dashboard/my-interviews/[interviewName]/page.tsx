"use client";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import React, { useEffect, useState, useRef } from "react";
import resultImg from "@/public/images/resultImg.png";
import resultImg2 from "@/public/images/resultImg2.png";
import resultImg3 from "@/public/images/resultImg3.png";
import resultImg4 from "@/public/images/resultImg4.png";
import resultImg5 from "@/public/images/resultImg5.png";
import Image from "next/image";
import { Check, CircleQuestionMark, Download, Loader2, X, FileText, UserCog, AudioWaveform, MessageSquareText, Sparkles } from "lucide-react";
import MetricTipsPanel from "@/components/MetricTipsPanel";


import { TrendingUp } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import axios from "axios";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import HeaderAction from "@/components/HeaderAction";

function getScoreBadge(score: number) {
  if (score >= 81) {
    return { title: "Champion of excellence", img: resultImg2 };
  } else if (score >= 60) {
    return { title: "Star Performer", img: resultImg3 };
  } else if (score >= 41) {
    return { title: "Steady achiever", img: resultImg4 };
  } else if (score >= 21) {
    return { title: "Aspiring learner", img: resultImg5 };
  } else {
    return { title: "Foundation builder", img: resultImg };
  }
}

const getColor = (value: number) => {
  if (value >= 4) return "#007A55";
  if (value >= 3) return "#FE9A00";
  return "#FD7678";
};

const page = () => {
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<any>(null);
  const { title, img } = getScoreBadge(score);
  const animatedscore = useCountUp(score, 200);
  const [open, setOpen] = useState(false);
  const [questionsList, setQuestionsList] = useState<any[]>([]);
  const [downloading, setDownloading] = useState(false);
  const chartsRef = useRef<HTMLDivElement>(null);

  // Tips Panel State
  const [tipsPanelMetric, setTipsPanelMetric] = useState<string | null>(null);

  const params = useParams();
  const id = params.interviewName;

  const handleQueClick = () => {
    setOpen(!open);
  };

  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!id) return;

    const fetchMe = async () => {
      try {
        const res = await api.get(`/interview/performance/${id}`);
        console.log(res.data);
        if (res.data.success && res.data.data) {
          setScore(res.data.data.totalScore);
          setResults(res.data.data);
          setQuestionsList(res.data.data.questions_breakdown || []);
        }
      } catch (error) {
        console.log("Err:- while fetching the mock interviews", error);
      }
    };

    fetchMe();
  }, [id]);

  const current = questionsList.length > 0 ? questionsList[activeIndex] : null;

  const handleDownloadReport = async () => {
    if (!results || downloading) return;

    setDownloading(true);
    try {
      // Capture Charts
      let chartImgData = null;
      if (chartsRef.current) {
        const canvas = await html2canvas(chartsRef.current, {
          scale: 2,
          backgroundColor: '#f7fbfa',
          useCORS: true,
          logging: false
        });
        chartImgData = canvas.toDataURL('image/png');
      }

      // Generate PDF
      const { pdf } = await import('@react-pdf/renderer');
      const { InterviewReportPDF } = await import('@/components/InterviewReportPDF');

      const blob = await pdf(
        <InterviewReportPDF
          results={results}
          score={score}
          title={title}
          badgeImg={null}
          chartImage={chartImgData}
        />
      ).toBlob();

      const fileName = `mock-interview-report-${id}.pdf`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadTranscript = () => {
    if (!results || !questionsList.length) return;

    let content = "";

    questionsList.forEach((q: any, i: number) => {
      const currentQuestion = q.question || `Question ${i + 1}`;
      const answer = q.userAnswer || q.answer || "...";
      let aiSpeaking = "";

      if (i === 0) {
        aiSpeaking = `AI: ${currentQuestion}`;
      } else {
        const prevFeedback = questionsList[i - 1].feedback;
        aiSpeaking = `AI: ${prevFeedback} ${currentQuestion}`;
      }

      content += `${aiSpeaking}\n\nUser: ${answer}\n\n`;

      // If this is the last question, append its feedback at the end
      if (i === questionsList.length - 1) {
        const lastFeedback = q.feedback;
        content += `AI: ${lastFeedback}\n`;
      }
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `interview-transcript-${id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <main className="w-full h-auto min-h-full bg-[#f7fbfa] pb-10">
      {open && (
        <div className="w-screen h-screen fixed inset-0 z-20 bg-[#17383d]/45 flex items-center justify-center p-4">
          <div className="w-[95%] sm:w-[80%] md:w-[70%] max-h-[90vh] overflow-y-auto flex flex-col bg-white p-5 rounded-xl shadow-2xl relative">
            <div className="w-full flex justify-between items-start sm:items-center gap-4 mb-4">
              <h1 className="font-medium text-base sm:text-lg pr-8">
                Keep improving your interview score to become the Champion of excellence!
              </h1>
              <X onClick={() => setOpen(false)} className="cursor-pointer shrink-0 absolute top-5 right-5 sm:static" />
            </div>
            {/* Score Badges - Stack on mobile */}
            <div className="flex flex-col sm:flex-row gap-5 items-center justify-center py-5 mt-2">
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-[20%] border-b sm:border-b-0 pb-3 sm:pb-0 border-gray-100 last:border-0">
                <Image src={resultImg2} alt="" className="h-[80px] sm:h-[150px] w-auto" />
                <div className="text-left sm:text-center">
                  <p className="font-medium text-sm">Champion of excellence</p>
                  <p className="text-xs text-gray-500">Interview score : 100-81</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-[20%] border-b sm:border-b-0 pb-3 sm:pb-0 border-gray-100 last:border-0">
                <Image src={resultImg3} alt="" className="h-[80px] sm:h-[150px] w-auto" />
                <div className="text-left sm:text-center">
                  <p className="font-medium text-sm">Star Performer</p>
                  <p className="text-xs text-gray-500">Interview score : 81-60</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-[20%] border-b sm:border-b-0 pb-3 sm:pb-0 border-gray-100 last:border-0">
                <Image src={resultImg4} alt="" className="h-[80px] sm:h-[150px] w-auto" />
                <div className="text-left sm:text-center">
                  <p className="font-medium text-sm">Steady achiever</p>
                  <p className="text-xs text-gray-500">Interview score : 60-41</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-[20%] border-b sm:border-b-0 pb-3 sm:pb-0 border-gray-100 last:border-0">
                <Image src={resultImg5} alt="" className="h-[80px] sm:h-[150px] w-auto" />
                <div className="text-left sm:text-center">
                  <p className="font-medium text-sm">Aspiring learner</p>
                  <p className="text-xs text-gray-500">Interview score : 40-21</p>
                </div>
              </div>
              <div className="flex sm:flex-col items-center gap-3 w-full sm:w-[20%]">
                <Image src={resultImg} alt="" className="h-[80px] sm:h-[150px] w-auto" />
                <div className="text-left sm:text-center">
                  <p className="font-medium text-sm">Foundation builder</p>
                  <p className="text-xs text-gray-500">Interview score : 20-1</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Download Buttons via HeaderAction Portal */}
      <HeaderAction>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={handleDownloadReport}
            disabled={downloading}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f2825c] text-white rounded-md hover:bg-[#f2825c]/85 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
          >
            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {downloading ? 'Generating...' : 'Download Report'}
          </button>
          <button
            onClick={handleDownloadTranscript}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium w-full sm:w-auto"
          >
            <FileText size={16} />
            Download Transcript
          </button>
        </div>
      </HeaderAction>

      {/* Main Container Padding */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 w-full max-w-[100%] xl:max-w-[100%] mx-auto">

        {/* Header Section */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex flex-col items-start">
            <h1 className="text-[#f2825c] text-xl font-medium">
              Performance Breakdown
            </h1>
          </div>
        </div>

        {/* Top Result Card Section */}
        <div className="flex flex-col lg:flex-row w-full gap-4 mt-2">
          {/* Score Badge Card */}
          <div className="w-full lg:w-1/4 bg-gradient-to-b from-[#f2825c] to-[#184852] px-6 py-10 sm:px-8 sm:py-14 flex flex-col items-center justify-center rounded-xl shadow-lg">
            <Image
              src={img}
              alt="Result Badge"
              className="w-auto h-[140px] sm:h-[180px] object-contain mb-4"
            />
            <h2 className="text-white text-3xl sm:text-4xl font-bold">{animatedscore}/100</h2>

            <div className="flex gap-2 items-center text-white mt-2 cursor-pointer hover:underline" onClick={handleQueClick}>
              <p className="font-medium text-center">{title}</p>
              <CircleQuestionMark size={18} />
            </div>
          </div>

          {/* Overview & Insights Column */}
          <div className="flex flex-col gap-4 w-full lg:w-3/4">
            {/* Overview Section */}
            <div className="flex flex-col gap-3">
              <h1 className="text-lg font-medium">Overview</h1>
              <div className="w-full rounded-xl p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2 bg-[#fff0ea] rounded-lg"><UserCog size={20} className="text-[#f2825c]" /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f2825c] text-sm">Behavioural Competency</span>
                    <span className="font-bold text-[#17383d] text-lg">{results?.scores?.behavioral_competency || "0/30"}</span>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-gray-200"></div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2 bg-[#fff0ea] rounded-lg"><AudioWaveform size={20} className="text-[#f2825c]" /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f2825c] text-sm">Speech quality</span>
                    <span className="font-bold text-[#17383d] text-lg">{results?.scores?.speech_quality || "0/20"}</span>
                  </div>
                </div>
                <div className="hidden sm:block w-px h-10 bg-gray-200"></div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <div className="p-2 bg-[#fff0ea] rounded-lg"><MessageSquareText size={20} className="text-[#f2825c]" /></div>
                  <div className="flex flex-col">
                    <span className="font-medium text-[#f2825c] text-sm">Response quality</span>
                    <span className="font-bold text-[#17383d] text-lg">{results?.scores?.response_quality || "0/50"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recruiter's Perspective */}
            <div className="w-full rounded-xl p-5 bg-white shadow-sm">
              <h1 className="text-lg font-medium mb-3">Recruiter's Perspective</h1>
              <p className="font-medium text-[#17383d]/70 text-sm leading-relaxed">
                {results && results?.recruitersView}
              </p>
            </div>

            {/* Knowledge & Areas for Improvement */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="w-full md:w-1/2 p-5 rounded-xl bg-white shadow-sm">
                <h1 className="text-lg font-medium mb-3 text-[#1E1E1E]">
                  Knowledge & Domain Understanding
                </h1>
                <p className="font-medium text-[#17383d]/70 text-sm leading-relaxed">
                  {results && results?.knowledgeUnderstanding}
                </p>
              </div>
              <div className="w-full md:w-1/2 p-5 rounded-xl bg-white shadow-sm">
                <h1 className="text-lg font-medium mb-3 text-[#1E1E1E]">Areas of Improvement</h1>
                <p className="font-medium text-[#17383d]/70 text-sm leading-relaxed">
                  {results && results?.improvementAreas}
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Charts Grid - Responsive */}
        <h1 className="text-[#f2825c] mt-8 text-xl font-medium mb-4">
          An in-depth look at your mock interview performance metrics:
        </h1>
        <div ref={chartsRef} className="w-full grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="col-span-1 md:col-span-2 min-h-[300px]">
            <ContentRelecenceScoreCard data={results} onTipsClick={() => setTipsPanelMetric("content_relevance")} />
          </div>
          <div className="col-span-1 md:col-span-2 min-h-[300px]">
            <VerbalFluencyCard data={results} onTipsClick={() => setTipsPanelMetric("verbal_fluency")} />
          </div>
          <div className="col-span-1 md:col-span-2 min-h-[300px]">
            <Card className="h-full flex flex-col relative overflow-hidden">
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div>
                  <CardTitle>Confidence & Clarity Index</CardTitle>
                  <CardDescription>
                    Overall communication effectiveness score
                  </CardDescription>
                </div>
                <button
                  onClick={() => setTipsPanelMetric("confidence_clarity")}
                  className="px-2.5 py-1 bg-[#fff0ea] hover:bg-[#fff0ea]/80 text-[#f2825c] font-medium text-xs rounded-full border border-[#f2825c]/30 transition-colors flex items-center gap-1 shrink-0 z-10"
                >
                  <Sparkles size={12} /> Tips
                </button>
              </CardHeader>
              <CardContent className="flex-1 flex items-center justify-center pt-0 overflow-hidden">
                <div className="w-full flex justify-center">
                  <SemicircularProgress
                    percentage={results ? results.confidence_clarity : 0}
                    tooltipLabel="Clarity"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="col-span-1 md:col-span-3 min-h-[300px]">
            <ChartLineLinear data={results ? results.thinking_time : []} onTipsClick={() => setTipsPanelMetric("thinking_time")} />
          </div>
          <div className="col-span-1 md:col-span-3 min-h-[300px]">
            <ChartAreaDefault
              answering_time={results ? results.answering_time : []}
              onTipsClick={() => setTipsPanelMetric("speaking_duration")}
            />
          </div>
        </div>

        {/* Tips Side Panel */}
        <MetricTipsPanel
          open={!!tipsPanelMetric}
          metric={tipsPanelMetric}
          tipsData={results?.tips ? results.tips[tipsPanelMetric as string] : null}
          onClose={() => setTipsPanelMetric(null)}
        />
      </div>
      <div className="w-full h-auto pb-10">
        <div className="flex flex-col items-start mt-4">
          <h1 className="text-[#f2825c] text-xl font-medium">
            Question wise feedback
          </h1>
          <p className="text-[#f2825c] text-md">
            Detailed AI analysis of your responses with actionable insights for
            improvement
          </p>
        </div>

        {current ? (
          <div className="w-full mx-auto space-y-6 mt-2">
            {/* Question Selector */}
            <div className="flex gap-4 items-center justify-start p-2 border rounded-xl bg-white overflow-x-auto">
              {questionsList.map((q: any, index: number) => {
                let label = `${index + 1}`;
                let isSpecial = false;

                // Check for Intro
                if (q.phase === 'intro') {
                  label = "Intro";
                  isSpecial = true;
                }

                // Check for Outro
                if (q.phase === 'outro') {
                  label = "Outro";
                  isSpecial = true;
                }

                return (
                  <button
                    key={q._id || index}
                    onClick={() => setActiveIndex(index)}
                    className={`
                h-8 px-3 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer shrink-0 transition-all
                ${activeIndex === index
                        ? "bg-[#f2825c] text-white"
                        : "bg-[#EDEDED] text-[#A5A5A5]"
                      }
                ${isSpecial ? "w-auto px-4" : "w-8"}
              `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            <div className="bg-white p-4 flex flex-col gap-4 rounded-xl">
              {/* Question */}
              <h1 className="text-xl font-semibold">{current.question}</h1>

              <h1 className="text-[#f2825c]/71 font-medium">Skill Assessed</h1>
              {/* Skill Tags */}
              <div className="flex gap-2 flex-wrap">
                {current.skills && current.skills.length > 0 ? (
                  current.skills.map((skill: string, i: number) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-sm rounded-full bg-[#fff0ea] text-[#f2825c]"
                    >
                      {skill}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">N/A</span>
                )}
              </div>

              {/* Answers */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <h3 className="text-[#f2825c]/71 font-medium">{current.phase === 'outro' ? 'Your Response' : 'Your Answer'}</h3>
                  <p className="text-lg border text-[#17383d] bg-[#F9FAFB] rounded-lg p-4">
                    {current.userAnswer}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <h3 className="text-[#17383d]/71 font-medium">{current.phase === 'outro' ? 'AI Response' : 'Ideal Answer'}</h3>
                  <div className="p-4 border rounded-lg bg-[#fff0ea] flex flex-col gap-4">
                    <p className="text-lg">{current.phase === 'outro' ? (current.feedback || current.idealAnswer) : current.idealAnswer}</p>

                    <div className="flex gap-2 flex-wrap pt-4 border-t">
                      {current.skills && current.skills.map((skill: string, i: number) => (
                        <span
                          key={i}
                          className="flex gap-1 items-center px-3 py-1 text-sm rounded-full bg-[#f7fbfa] text-[#f2825c]"
                        >
                          <Check size={16} />
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fluency Metrics */}
              <h1 className="text-[#f2825c]/71 font-medium">Verbal Fluency</h1>
              <div className="flex flex-wrap items-center justify-evenly gap-4">
                {current.fluency && Object.entries(current.fluency).map(([key, value]) => (
                  <div
                    key={key}
                    className="bg-[#F9FAFB] py-4 px-6 rounded-xl w-[300px]"
                  >
                    <div className="flex justify-between">
                      <p className="capitalize">{key}</p>
                      <p>{Number(value)}</p>
                    </div>
                    <Progress value={Number(value)} color={getColor(Number(value))} />
                  </div>
                ))}
              </div>

              {/* Reasoning */}
              <div className="flex flex-col gap-3">
                <h1 className="text-[#f2825c]/71 font-medium">
                  How can You Improve?
                </h1>
                {current.improvements && current.improvements.length > 0 ? (
                  current.improvements.map((imp: string, i: number) => (
                    <div key={i} className="flex gap-2 items-center text-sm">
                      <div className="rounded-full border border-[#f2825c] p-1 shrink-0">
                        <Check size={12} color="#f2825c" />
                      </div>
                      <p className="text-[#17383d]">{imp}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No specific improvements suggested.</p>
                )}
              </div>
            </div>
          </div >
        ) : (
          <div className="mt-8 text-center text-gray-500">Loading question feedback...</div>
        )}
      </div >
    </main >
  );
};

export default page;

function Progress({
  value,
  color = "#22C55E",
}: {
  value: number;
  color?: string;
}) {
  return (
    <div className="grid grid-cols-5 gap-1 w-full mt-2">
      {[1, 2, 3, 4, 5].map((level) => (
        <div
          key={level}
          className={`h-[7px] rounded-full ${level <= value ? "" : "bg-[#D9D9D9]"
            }`}
          style={{
            backgroundColor: level <= value ? color : "#D9D9D9",
          }}
        />
      ))}
    </div>
  );
}

const chartData = [
  { month: "Q1", desktop: 186 },
  { month: "Q2", desktop: 305 },
  { month: "Q3", desktop: 237 },
  { month: "Q4", desktop: 73 },
  { month: "Q5", desktop: 209 },
  { month: "Q6", desktop: 214 },
];

const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

function ContentRelecenceScoreCard({ data, onTipsClick }: { data: any, onTipsClick?: () => void }) {
  return (
    <Card className="w-full h-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Content Relevance Score per Question</CardTitle>
          <CardDescription>
            Answer quality and topic alignment rating{" "}
          </CardDescription>
        </div>
        {onTipsClick && (
          <button
            onClick={onTipsClick}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 transition-colors flex items-center gap-1 shrink-0 z-10"
          >
            <Sparkles size={12} /> Tips
          </button>
        )}
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={data ? data?.content_relevance_score : []}
            layout="vertical"
            margin={{
              left: -25,
            }}
            barCategoryGap={10} // space between bars (vertical)
            barGap={8} // extra gap if needed
            className="p-2"
          >
            <XAxis
              type="number"
              dataKey="score"
              domain={[0, 10]}
              ticks={[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
              interval={0}
              tickLine={false}
              tickMargin={5}
              axisLine={false}
            />

            <YAxis
              dataKey="q"
              type="category"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              interval={0}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar
              dataKey="score"
              fill="#f2825c"
              radius={5}
              barSize={6}
              className="bg-gray-100 w-full"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const chartData2 = [
  { month: "January", desktop: 186 },
  { month: "February", desktop: 305 },
  { month: "March", desktop: 237 },
  { month: "April", desktop: 273 },
  { month: "May", desktop: 209 },
];

const chartConfig2 = {
  desktop: {
    label: "Desktop",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function VerbalFluencyCard({ data, onTipsClick }: { data: any, onTipsClick?: () => void }) {
  return (
    <Card className="w-full h-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Verbal Fluency Index</CardTitle>
          <CardDescription>
            Multi-dimensional speech quality analysis
          </CardDescription>
        </div>
        {onTipsClick && (
          <button
            onClick={onTipsClick}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 transition-colors flex items-center gap-1 shrink-0 z-10"
          >
            <Sparkles size={12} /> Tips
          </button>
        )}
      </CardHeader>
      <CardContent className="pb-0">
        <ChartContainer
          config={chartConfig2}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <RadarChart data={data ? data?.verbal_fluency : []}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="title" />
            <PolarGrid />
            <Radar
              dataKey="score"
              fill="#C8E3EC"
              strokeWidth={2}
              stroke="#f2825c"
              fillOpacity={0.5}
              dot={{
                fill: "#65ABFC",
                strokeWidth: 2,
                stroke: "#ffffff",
                r: 4,
                fillOpacity: 1,
              }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ChartLineLinear({ data, onTipsClick }: { data: any, onTipsClick?: () => void }) {
  const chartData4 = data.map((item: any) => ({
    question: item.q,
    time: item.score,
  }));

  return (
    <Card className="w-full h-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Thinking Duration per Question</CardTitle>
          <CardDescription>
            Analyzes pause duration before responses
          </CardDescription>
        </div>
        {onTipsClick && (
          <button
            onClick={onTipsClick}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 transition-colors flex items-center gap-1 shrink-0 z-10"
          >
            <Sparkles size={12} /> Tips
          </button>
        )}
      </CardHeader>

      <CardContent>
        <ChartContainer config={{}}>
          <LineChart data={chartData4} margin={{ left: 12, right: 12 }}>
            <CartesianGrid vertical={false} />

            <XAxis
              dataKey="question"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <YAxis dataKey="time" tickLine={false} axisLine={false} />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  formatter={(value) => {
                    const val = Number(Number(value).toFixed(2));
                    const unit = (val >= 0 && val <= 1) ? "second" : "seconds";
                    return [`${val} ${unit}`];
                  }}
                />
              }
            />

            <Line
              dataKey="time"
              type="linear"
              stroke="#f2825c"
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export function ChartAreaDefault({ answering_time = [], onTipsClick }: { answering_time: any[], onTipsClick?: () => void }) {
  // Dynamic chart data
  const chartData5 = answering_time.map((value, index) => ({
    question: `Q${index + 1}`,
    desktop: value,
  }));

  const chartConfig5 = {
    desktop: {
      label: "Answer Time",
      color: "var(--chart-1)",
    },
  };

  return (
    <Card className="w-full h-full relative overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between pb-2">
        <div>
          <CardTitle>Speaking Duration Per Answer</CardTitle>
          <CardDescription>
            Response length analysis across questions
          </CardDescription>
        </div>
        {onTipsClick && (
          <button
            onClick={onTipsClick}
            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium text-xs rounded-full border border-emerald-200 transition-colors flex items-center gap-1 shrink-0 z-10"
          >
            <Sparkles size={12} /> Tips
          </button>
        )}
      </CardHeader>

      <CardContent>
        <ChartContainer config={chartConfig5}>
          <AreaChart
            accessibilityLayer
            data={chartData5}
            margin={{ left: 24, right: 12 }} // more space for Y-axis
          >
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="30%" stopColor="#f2825c" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} />

            {/* Y AXIS */}
            <YAxis tickLine={false} axisLine={false} tickMargin={6} />

            {/* X AXIS */}
            <XAxis
              dataKey="question"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" formatter={(value) => {
                const val = Number(Number(value).toFixed(2));
                const unit = (val >= 0 && val <= 1) ? "second" : "seconds";
                return [`${val} ${unit}`, ""];
              }} />}
            />

            <Area
              dataKey="desktop"
              type="natural"
              fill="url(#gradient)"
              fillOpacity={0.9}
              stroke="#f2825c"
              strokeWidth={2}
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

export const useCountUp = (end: number, duration = 1500) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // ~60fps
    const handle = setInterval(() => {
      start += increment;
      if (start >= end) {
        setValue(end);
        clearInterval(handle);
      } else {
        setValue(Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(handle);
  }, [end, duration]);

  return value;
};

export type SemicircularProgressProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  tooltipLabel?: string;
};

function SemicircularProgress({
  percentage,
  size = 350,
  strokeWidth = 8,
  color = "#f2825c",
  bgColor = "#E7F0ED",
  showLabel = true,
  tooltipLabel = "Clarity",
}: SemicircularProgressProps) {
  const pct = useCountUp(Math.max(0, Math.min(100, Math.round(percentage))));
  const dashArray = 100;
  const dashOffset = 100 - pct;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size / 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div className="absolute -top-5 flex flex-col items-center">
          <div className="bg-white border border-gray-200 text-[#17383d] text-sm font-medium rounded-md shadow-md px-3 py-1.5 whitespace-nowrap">
            {tooltipLabel} : {pct}%
          </div>
          {/* Arrow */}
          <div className="w-3 h-3 bg-white border-b border-gray-200 rotate-45 mt-[-6px] shadow-b-md" />
        </div>
      )}

      {/* Gauge */}
      <svg
        viewBox="0 0 100 60"
        width={size}
        height={(size / 100) * 60}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          pathLength={100}
          style={{
            transition: "stroke-dashoffset 700ms ease, stroke 300ms",
          }}
        />

        {/* Percentage Label */}
        {showLabel && (
          <text
            x="50"
            y="46"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="16"
            fontWeight={700}
            fill="#000"
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  );
}

function SelectDemo() {
  return (
    <Select>
      <SelectTrigger className="w-[180px] border-2 border-[#f2825c] rounded-md px-3 py-2 text-[#f2825c] font-medium">
        <SelectValue placeholder="Attempt" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {/* <SelectLabel>Attempts</SelectLabel> */}
          <SelectItem value="1">Attempt: 1</SelectItem>
          <SelectItem value="2">Attempt: 2</SelectItem>
          <SelectItem value="3">Attempt: 3</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}