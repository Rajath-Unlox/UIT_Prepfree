"use client";
import {
  Card,
  CardAction,
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
import api from "@/lib/api";
import { ArrowUpRight, Badge, Download, Loader2, TrendingUp } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import HeaderAction from "@/components/HeaderAction";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Dot,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

const tabs = [
  { id: "speech", label: "Speech" },
  { id: "response", label: "Response" },
  { id: "competency", label: "Competency" },
];

const TrendValue = ({ value }: { value: number | undefined }) => {
  if (value === undefined || value === null) return <span className="text-gray-400">No data</span>;
  if (value === 0) return <span className="text-gray-500">No change from last sessions</span>;

  const isPositive = value > 0;

  return (
    <span className={`${isPositive ? 'text-[#f2825c]' : 'text-red-500'}`}>
      {isPositive ? "Increased" : "Decreased"} from last sessions
    </span>
  );
};

const TrendDirect = ({ value, suffix = "%", inverse = false }: { value: number | undefined, suffix?: string, inverse?: boolean }) => {
  if (value === undefined || value === null) return <span className="text-gray-400">-</span>;
  const isPositive = value >= 0;
  // Standard: Positive = Green (Good), Negative = Red (Bad)
  // Inverse: Positive = Red (Bad), Negative = Green (Good) --> e.g. Filler Words
  const isGood = inverse ? !isPositive : isPositive;

  return (
    <span className={`${isGood ? 'text-[#f2825c]' : 'text-red-600'} pl-1 font-semibold flex gap-1 items-center`}>
      <TrendingUp size={18} className={isPositive ? "" : "rotate-180"} />
      {Math.abs(value)}{suffix}
    </span>
  )
}

export const useCountUp = (end: number, duration = 1000) => {
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

const page = () => {
  const [activeTab, setActiveTab] = useState("speech");
  const [tabName, setTabName] = useState("Speech");
  const [downloading, setDownloading] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const tabContentRef = useRef<HTMLDivElement>(null);
  const scoreRef = useRef<HTMLDivElement>(null);

  const [overallPercent, setOverAllPercent] = useState<any>(null)

  const totalScorePercent = useCountUp(overallPercent ? overallPercent.avgTotalScorePercentage : 0);
  const totalSpeechPercent = useCountUp(overallPercent ? overallPercent.avgSpeechPercentage : 0);
  const totalResponsePercent = useCountUp(overallPercent ? overallPercent.avgResponsePercentage : 0);
  const totalCompetencyPercent = useCountUp(overallPercent ? overallPercent.avgCompetencyPercentage : 0);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await api.get(`/interview/performance`);
        console.log(res.data);
        if (res.data && res.data.result) {
          setOverAllPercent(res.data.result);
        }
      } catch {
        console.log("Err:- while fetching the mock interviews");
      }
    };

    fetchMe();
  }, []);

  const handleDownloadReport = async () => {
    if (downloading) return;
    setDownloading(true);

    const tabOrder = ['speech', 'response', 'competency'];
    const previousTab = activeTab;

    try {
      const pdf = new jsPDF('l', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();

      // Capture the top score cards once
      let firstPage = true;

      for (const tab of tabOrder) {
        // Switch to this tab and wait for render
        setActiveTab(tab);
        await new Promise(resolve => setTimeout(resolve, 400));

        if (!pageRef.current) continue;

        const canvas = await html2canvas(pageRef.current, {
          scale: 2,
          backgroundColor: '#f7fbfa',
          useCORS: true,
          logging: false
        });

        const imgData = canvas.toDataURL('image/png');
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        if (!firstPage) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        firstPage = false;
      }

      pdf.save('overall-interview-report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      // Restore the original tab
      setActiveTab(previousTab);
      setDownloading(false);
    }
  };

  return (
    <main className="w-full h-full">
      <HeaderAction>
        <button
          onClick={handleDownloadReport}
          disabled={downloading}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#f2825c] text-white rounded-md hover:bg-[#f2825c]/85 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          {downloading ? 'Generating...' : 'Download Report'}
        </button>
      </HeaderAction>
      <div ref={pageRef}>
        <div className="w-full flex gap-4 h-auto ">
          <Card className="w-1/4 shadow-none bg-gradient-to-b from-[#f2825c] to-[#184852]">
            <CardHeader>
              <CardDescription className="text-white font-medium">
                Overall Interview Score
              </CardDescription>
              <CardTitle className="text-4xl text-white font-Medium tabular-nums @[250px]/card:text-3xl">
                {overallPercent ? totalScorePercent : '-'}%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <TrendValue value={overallPercent?.trends?.total} />
            </CardFooter>
          </Card>
          <Card className="w-1/4 shadow-none">
            <CardHeader>
              <CardDescription className="text-[#17383d] font-medium">
                Overall Speech Score
              </CardDescription>
              <CardTitle className="text-4xl font-Medium tabular-nums @[250px]/card:text-3xl">
                {overallPercent ? totalSpeechPercent : '-'}%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <TrendValue value={overallPercent?.trends?.speech} />
            </CardFooter>
          </Card>
          <Card className="w-1/4 shadow-none">
            <CardHeader>
              <CardDescription className="text-[#17383d] font-medium">
                Overall Response Score
              </CardDescription>
              <CardTitle className="text-4xl font-Medium tabular-nums @[250px]/card:text-3xl">
                {overallPercent ? totalResponsePercent : '-'}%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <TrendValue value={overallPercent?.trends?.response} />
            </CardFooter>
          </Card>
          <Card className="w-1/4 shadow-none">
            <CardHeader>
              <CardDescription className="text-[#17383d] font-medium">
                Overall Competency Score
              </CardDescription>
              <CardTitle className="text-4xl font-Medium tabular-nums @[250px]/card:text-3xl">
                {overallPercent ? totalCompetencyPercent : '-'}%
              </CardTitle>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <TrendValue value={overallPercent?.trends?.competency} />
            </CardFooter>
          </Card>
        </div>

        <div className="flex flex-col">
          <div className="w-full flex items-center justify-between mt-8 mb-4">
            {/* Tabs */}
            <div className="flex rounded-md overflow-hidden border border-[#cfe3e0]/10 w-fit">
              {tabs.map((tab, idx) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-fit px-6 py-2 cursor-pointer transition-colors duration-200 text-sm font-medium
                    ${activeTab === tab.id
                      ? "bg-[#f7fbfa] border-b-2 border-[#f2825c]"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                    }
                    ${idx !== tabs.length - 1 ? "border-r border-[#cfe3e0]/10" : ""}
                    `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <h1 className="text-lg text-[#1E1E1E] font-semibold mt-2 capitalize">
            {activeTab} Progress
            <span className="text-sm text-[#1E1E1E]/50 pl-1">(3 Parameters)</span>
          </h1>
          <h1 className="text-sm text-[#1E1E1E]/64 pl-1 flex items-center">
            Your Overall Score {overallPercent?.trends?.total === 0 ? "showed no change" : (overallPercent?.trends?.total > 0 ? "Increased by " : "Decreased by ")}
            {overallPercent?.trends?.total !== 0 && <TrendDirect value={overallPercent?.trends?.total} />}
          </h1>
        </div>

        <div className="flex gap-4 w-full mt-2">
          {/* Render Charts Based on Tab */}
          {activeTab === 'speech' && (
            <>
              <AnalysisBarChart
                title="Filler Words"
                data={overallPercent?.speech?.filler_words}
                dataKey="count"
                color="#184852"
                unit="Count"
                trend={overallPercent?.trends?.metrics?.filler_words}
                description="Your Filler Tone"
              />
              <AnalysisLineChart
                title="Confidence Level"
                data={overallPercent?.speech?.confidence_level}
                dataKey="percent"
                trend={overallPercent?.trends?.metrics?.confidence}
                description="Your Confidence"
              />
              <AnalysisAreaChart
                title="Pace"
                data={overallPercent?.speech?.pace}
                dataKey="percent"
                trend={overallPercent?.trends?.metrics?.pace}
                description="Your Pace"
              />
            </>
          )}

          {activeTab === 'response' && (
            <>
              <AnalysisBarChart
                title="Relevance to Question"
                data={overallPercent?.response?.relevance}
                dataKey="percent"
                color="#184852"
                unit="%"
                description="Your answer relevance"
                trend={overallPercent?.trends?.metrics?.relevance}
              />
              <AnalysisLineChart
                title="Domain Knowledge"
                data={overallPercent?.response?.domain_knowledge}
                dataKey="percent"
                description="Understanding of concepts"
                trend={overallPercent?.trends?.metrics?.domain_knowledge}
              />
              <AnalysisAreaChart
                title="Articulation"
                data={overallPercent?.response?.articulation}
                dataKey="percent"
                description="Clarity and structure"
                trend={overallPercent?.trends?.metrics?.articulation}
              />
            </>
          )}

          {activeTab === 'competency' && (
            <>
              <AnalysisBarChart
                title="Problem Solving"
                data={overallPercent?.competency?.problem_solving}
                dataKey="percent"
                color="#f2825c"
                unit="%"
                description="Your problem solving"
                trend={overallPercent?.trends?.metrics?.problem_solving}
              />
              <AnalysisLineChart
                title="Learning Agility"
                data={overallPercent?.competency?.learning_agility}
                dataKey="percent"
                description="Adaptability and openness to feedback"
                trend={overallPercent?.trends?.metrics?.learning_agility}
              />
              <AnalysisAreaChart
                title="Articulation"
                data={overallPercent?.competency?.articulation}
                dataKey="percent"
                description="Analytical thinking"
                trend={overallPercent?.trends?.metrics?.comp_articulation}
              />
            </>
          )}
        </div>
      </div>
    </main>
  );
};

export default page;

const chartConfig = {
  count: {
    label: "Count",
    color: "var(--chart-1)",
  },
  percent: {
    label: "Percent",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

// Generic Bar Chart Component
export function AnalysisBarChart({
  title,
  data,
  dataKey = "count",
  color = "#69BE81",
  unit,
  description = "Your Score",
  trend,
  inverseTrend
}: {
  title: string;
  data: any[];
  dataKey?: string;
  color?: string;
  unit?: string;
  description?: string;
  trend?: number;
  inverseTrend?: boolean;
}) {
  const trendLabel = (trend || 0) >= 0 ? "Increased" : "Decreased";
  return (
    <Card className="w-1/3 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <h1 className="text-sm text-[#1E1E1E]/64 pl-1 flex items-center">
            {description} {!trend ? "showed no change" : (
              <>
                {trendLabel} by{" "}
                <TrendDirect value={trend} inverse={inverseTrend} />
              </>
            )}
          </h1>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart accessibilityLayer data={data || []}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="interview"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => value ? value.slice(0, 3) : ''}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dashed" />}
            />
            <Bar dataKey={dataKey} fill={color} radius={10} barSize={40} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Generic Line Chart Component
export function AnalysisLineChart({
  title,
  data,
  dataKey = "percent",
  description = "Your Confidence",
  trend
}: {
  title: string;
  data: any[];
  dataKey?: string;
  description?: string;
  trend?: number;
}) {
  const trendLabel = (trend || 0) >= 0 ? "Increased" : "Decreased";
  return (
    <Card className="w-1/3 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <h1 className="text-sm text-[#1E1E1E]/64 pl-1 flex items-center">
            {description} {!trend ? "showed no change" : (
              <>
                {trendLabel} by{" "}
                <TrendDirect value={trend} />
              </>
            )}
          </h1>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <LineChart
            accessibilityLayer
            data={data || []}
            margin={{ left: 12, right: 12 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="interview"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value ? value.slice(0, 3) : ''}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Line
              dataKey={dataKey}
              type="linear"
              stroke="#f2825c"
              strokeWidth={2}
              dot={<Dot r={4} fill="#f2825c" />}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

// Generic Area Chart Component
export function AnalysisAreaChart({
  title,
  data,
  dataKey = "percent",
  description = "Your Confidence",
  trend
}: {
  title: string;
  data: any[];
  dataKey?: string;
  description?: string;
  trend?: number;
}) {
  const trendLabel = (trend || 0) >= 0 ? "Increased" : "Decreased";
  return (
    <Card className="w-1/3 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>
          <h1 className="text-sm text-[#1E1E1E]/64 pl-1 flex items-center">
            {description} {!trend ? "showed no change" : (
              <>
                {trendLabel} by{" "}
                <TrendDirect value={trend} />
              </>
            )}
          </h1>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <AreaChart
            accessibilityLayer
            data={data || []}
            margin={{ left: 12, right: 12 }}
          >
            <defs>
              <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f2825c" />
                <stop offset="100%" stopColor="#ffffff" />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="interview"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => value ? value.slice(0, 3) : ''}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="dot" hideLabel />}
            />
            <Area
              dataKey="percent"
              type="linear"
              fill="url(#gradient)"
              fillOpacity={1}
              stroke="#f2825c"
              strokeWidth={2}
              dot={
                <Dot r={5} fill="#ffffff" stroke="#f2825c" strokeWidth={2} />
              }
            />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}