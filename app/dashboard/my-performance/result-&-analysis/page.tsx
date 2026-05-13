"use client";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import axios from "axios";
import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, XAxis, YAxis } from "recharts";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

const page = () => {
  const [queNo, setQueNo] = useState(1);
  const [resultData, setResultData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get("id");
    setId(queryId);
  }, []);

  useEffect(() => {
    if (!id) return; // ⛔ Prevent API call until id is set

    const fetchResults = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await api.get(`/assessments/result/${id}`);

        const raw = res.data.result;

        const formattedMcqs = raw.mcqs.map((q: any, index: number) => {
          const optionArray = Object.entries(q.options).map(([key, value]) => ({
            id: key,
            option: value,
          }));

          return {
            id: index + 1,
            question: q.question,
            options: optionArray,
            correct_option_id: q.correct_answer,
            user_selected_option_id: q.user_answer,
            correct: q.mcq_result === "Correct",
            time_taken: q.time_taken_per_q,
            question_score: q.question_score,
            answer_reasoning: q.answer_reasoning,
          };
        });

        setResultData({
          ...raw,
          mcqs: formattedMcqs,
        });
      } catch (error) {
        console.log("API ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [id]); // 👈 depends on id

  const questions = resultData?.mcqs || [];
  const currentQuestion = questions[queNo - 1];

  return (
    <main className="w-full h-full">
      <div className="w-full flex items-center justify-between">
        <h1 className="text-lg text-[#1E1E1E] font-semibold">
          Your Assessment Performance Report For Web Development
        </h1>

        <div className="w-fit text-white flex items-center px-2 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer">
          <Download size={15} />
          <h1>Export List</h1>
        </div>
      </div>

      <div className="w-full flex gap-4 h-1/2 mt-4">
        {/* Left Section */}
        <div className="border h-full rounded-xl bg-gradient-to-b from-[#f2825c] to-[#184852] flex flex-col items-center justify-between p-3 w-1/4">
          <h1 className="w-full text-white font-medium">Overall Score</h1>

          <div className="w-full flex items-center justify-center">
            <SemicircularProgress
              percentage={resultData?.obtained_percentage || 0}
              size={220}
            />
          </div>

          <div className="w-full rounded-xl bg-white mt-6">
            <p className="text-sm text-[#17383d]/70 p-4 text-center">
              {resultData?.short_return_message}
            </p>
          </div>
        </div>

        {/* Bar Chart */}
        <div className="w-3/4 border border-[#949494] bg-white rounded-xl h-full p-4 flex flex-col items-start">
          <h1 className="font-medium mb-2">Time Taken Per Question</h1>
          <ChartBarDefault queNo={queNo} questions={questions} />
        </div>
      </div>

      <div className="w-full py-3 px-6 bg-white border rounded-xl mt-2">
        <ReactMarkdown>{resultData?.result_analysis}</ReactMarkdown>
      </div>

      {/* Question Feedback */}
      <div className="w-full rounded-xl border mt-2 bg-white p-3">
        <h1 className="font-medium mb-2">Question Wise Feedback</h1>

        <div className="flex gap-4 items-center justify-start p-2 border rounded-xl w-[90%]">
          {questions.map((q: any, index: number) => {
            const qNumber = index + 1;
            return (
              <button
                key={q._id || index}
                onClick={() => setQueNo(qNumber)}
                className={`
                h-8 w-8 flex items-center justify-center rounded-full text-sm font-medium cursor-pointer
                ${
                  queNo === qNumber
                    ? q.correct
                      ? "bg-[#2E8D5D] text-white"
                      : "bg-[#AB0A00] text-white"
                    : q.correct
                    ? "bg-[#D7FFEB] text-[#048746]"
                    : "bg-[#FFE5E5] text-[#B20000]"
                }
              `}
              >
                {qNumber}
              </button>
            );
          })}
        </div>

        {currentQuestion && (
          <div className="w-[90%] flex flex-col items-start mt-3">
            <h1 className="text-xl font-medium">{currentQuestion.question}</h1>

            <div className="w-full flex flex-col mt-2 gap-3">
              {currentQuestion?.options?.map((option: any) => {
                const isCorrect =
                  currentQuestion.correct_option_id === option.id;
                const isYourAnswer =
                  currentQuestion.user_selected_option_id === option.id;
                const isWrong = isYourAnswer && !isCorrect;

                return (
                  <div
                    key={option.id}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg
                      ${isCorrect ? "bg-[#E8FFF3]" : ""}
                      ${isWrong ? "bg-[#FFE5E5]" : ""}
                    `}
                  >
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center
                      ${
                        isCorrect
                          ? "border-[#048746]"
                          : isWrong
                          ? "border-[#B20000]"
                          : "border-gray-400"
                      }
                    `}
                    >
                      {(isCorrect || isWrong) && (
                        <span
                          className={`w-2 h-2 rounded-full
                            ${isCorrect ? "bg-[#048746]" : "bg-[#B20000]"}
                          `}
                        />
                      )}
                    </span>

                    <span className="text-sm font-medium">{option.option}</span>
                  </div>
                );
              })}
            </div>

            <div className="w-full flex items-center gap-1 mt-1">
              <h1
                className={`text-sm font-medium ${
                  currentQuestion.correct ? "text-[#2E8D5D]" : "text-[#AB0A00]"
                }`}
              >
                Correct:
              </h1>

              <div
                className={`rounded-md px-1 ${
                  currentQuestion.correct ? "bg-[#E8FFF3]" : "bg-[#FFEBE6]"
                }`}
              >
                <h1 className="text-sm text-[#A4A5A4]">
                  Overall:{" "}
                  <span
                    className={`text-sm font-medium ${
                      currentQuestion.correct
                        ? "text-[#2E8D5D]"
                        : "text-[#AB0A00]"
                    }`}
                  >
                    {currentQuestion.correct
                      ? `${currentQuestion.question_score}`
                      : "0"}
                    /{currentQuestion.question_score}
                  </span>
                </h1>
              </div>
            </div>
            <div className="p-2 border rounded-xl mt-2 w-full">
              <h1 className="font-medium">Reasoning:</h1>
              <h1 className="">{currentQuestion.answer_reasoning}</h1>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default page;

const chartConfig = {
  desktop: {
    label: "timeTaken",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ChartBarDefault({ queNo, questions }: any) {
  const graphData = questions.map((q: any, index: number) => ({
    id: index + 1,
    timeTaken: parseInt(q.time_taken || 0),
    correct: q.correct,
  }));

  return (
    <Card className="bg-transparent shadow-none border-none w-full h-full">
      <CardContent className="p-0 w-full h-full">
        <ChartContainer config={chartConfig} className="w-full h-[90%]">
          <BarChart data={graphData} accessibilityLayer>
            <defs>
              <linearGradient
                id="correctGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#fff0ea" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <linearGradient
                id="wrongGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#FFECE7" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <linearGradient
                id="currCorrectGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#f2825c" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>

              <linearGradient
                id="currWrongGradient"
                x1="0%"
                y1="0%"
                x2="0%"
                y2="100%"
              >
                <stop offset="0%" stopColor="#AD0F05" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>

            <CartesianGrid vertical={false} strokeDasharray="3 3" />

            <XAxis dataKey="id" tickLine={false} axisLine={false} />
            <YAxis tickLine={false} axisLine={false} />

            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />

            <Bar dataKey="timeTaken" radius={8}>
              {graphData.map((entry: any, i: any) => (
                <Cell
                  key={i}
                  fill={
                    entry.id === queNo
                      ? entry.correct
                        ? "url(#currCorrectGradient)"
                        : "url(#currWrongGradient)"
                      : entry.correct
                      ? "url(#correctGradient)"
                      : "url(#wrongGradient)"
                  }
                />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

const useCountUp = (end: number, duration = 1500) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // 60fps
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

type SemicircularProgressProps = {
  /** Percentage 0-100 */
  percentage: number;
  /** Size of the SVG in pixels */
  size?: number;
  /** Stroke width of the arc */
  strokeWidth?: number;
  /** Active arc color */
  color?: string;
  /** Background arc color */
  bgColor?: string;
  /** Whether to show the numeric label in the center */
  showLabel?: boolean;
  /** Optional aria label for accessibility */
  ariaLabel?: string;
};

/**
 * SemicircularProgress
 * - Uses an SVG arc (pathLength=100) so percentage maps directly to stroke-dashoffset.
 * - Smoothly animates when `percentage` changes.
 */
function SemicircularProgress({
  percentage,
  size = 200,
  strokeWidth = 8,
  color = "#FFCD71",
  bgColor = "#FFF7E8",
  showLabel = true,
}: any) {
  const pct = useCountUp(percentage);
  const dashOffset = 100 - pct;

  return (
    <div style={{ width: size, height: size / 2 }}>
      <svg viewBox="0 0 100 60" width={size} height={(size / 100) * 60}>
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />

        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray="100"
          strokeDashoffset={dashOffset}
          pathLength={100}
        />

        {showLabel && (
          <text
            x="50"
            y="45"
            textAnchor="middle"
            fontSize="16"
            fontWeight="700"
            fill="#ffffff"
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  );
}
