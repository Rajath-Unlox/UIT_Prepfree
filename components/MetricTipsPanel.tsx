import React from "react";
import { X, CheckSquare, CheckCircle } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

interface TipData {
    went_well: string;
    needs_improvement: string;
    key_improvements: string[];
    practice_tips: { title: string; detail: string }[];
}

interface MetricTipsPanelProps {
    open: boolean;
    metric: string | null;
    tipsData: TipData | null;
    onClose: () => void;
}

const METRIC_TITLES: Record<string, string> = {
    content_relevance: "Content Relevance Score",
    verbal_fluency: "Verbal Fluency Index",
    confidence_clarity: "Confidence & Clarity Index",
    thinking_time: "Thinking Duration per Question",
    speaking_duration: "Speaking Duration per Answer",
};

const METRIC_DESCRIPTIONS: Record<string, string> = {
    content_relevance: "Based on how well your answers addressed the core topics in this interview",
    verbal_fluency: "Based on your spoken responses in this interview",
    confidence_clarity: "Based on your delivery style and sentence structure",
    thinking_time: "Based on pauses before your answers",
    speaking_duration: "Based on the length of your responses",
};

const MetricTipsPanel: React.FC<MetricTipsPanelProps> = ({ open, metric, tipsData, onClose }) => {
    if (!open || !metric) return null;

    const validTips = tipsData || {
        went_well: "Take a new mock interview to generate personalized tips for your performance.",
        needs_improvement: "Take a new mock interview to see actionable improvement areas.",
        key_improvements: [],
        practice_tips: []
    };

    return (
        <>
            <div
                className="fixed inset-0 z-40 bg-[#17383d]/20 transition-opacity"
                onClick={onClose}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-white shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-in-out border-l flex flex-col">
                {/* Header */}
                <div className="p-5 border-b sticky top-0 bg-white z-10 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-medium text-[#111827]">{METRIC_TITLES[metric] || "Tips"}</h2>
                        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} className="text-gray-500" />
                        </button>
                    </div>
                    <p className="text-sm text-gray-500">{METRIC_DESCRIPTIONS[metric] || "Actionable tips based on your performance."}</p>
                </div>

                <div className="p-5 flex flex-col gap-6 flex-1">

                    {/* What went well */}
                    <div className="bg-[#F2FCF5] border border-[#C1EDD3] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[#047857] font-medium text-[15px]">
                            <CheckSquare size={18} strokeWidth={2} />
                            <h3>What Went Well</h3>
                        </div>
                        <p className="text-[14px] text-[#059669] leading-relaxed">
                            {validTips.went_well}
                        </p>
                    </div>

                    {/* What needs improvement */}
                    <div className="bg-[#FFFDF0] border border-[#FDE68B] rounded-xl p-4 flex flex-col gap-3">
                        <div className="flex items-center gap-2 text-[#92400E] font-medium text-[15px]">
                            <CheckCircle size={18} strokeWidth={2} />
                            <h3>What needs improvement</h3>
                        </div>
                        <p className="text-[14px] text-[#92400E] leading-relaxed">
                            {validTips.needs_improvement}
                        </p>
                    </div>

                    {/* Keys to improvement */}
                    {validTips.key_improvements && validTips.key_improvements.length > 0 && (
                        <div className="flex flex-col gap-4 mt-2">
                            <h3 className="text-[16px] font-medium text-[#111827]">Keys Improvement</h3>
                            <ul className="flex flex-col gap-3.5">
                                {validTips.key_improvements.map((improvement, index) => (
                                    <li key={index} className="flex gap-2.5 items-start">
                                        <CheckCircle size={18} strokeWidth={1.5} className="text-[#059669] shrink-0 mt-[1px]" />
                                        <span className="text-[14px] text-[#111827] leading-snug">{improvement}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Practice Tips */}
                    {validTips.practice_tips && validTips.practice_tips.length > 0 && (
                        <div className="flex flex-col border border-gray-200 rounded-xl bg-white overflow-hidden mt-2 shadow-sm">
                            <div className="p-4 border-b bg-white">
                                <h3 className="text-[16px] font-medium text-[#111827]">Practice Tips</h3>
                            </div>
                            <Accordion type="single" collapsible className="w-full">
                                {validTips.practice_tips.map((tip, idx) => (
                                    <AccordionItem key={idx} value={`item-${idx}`} className={idx === validTips.practice_tips.length - 1 ? "border-b-0" : ""}>
                                        <AccordionTrigger className="px-5 py-3.5 hover:no-underline font-medium text-[14px] text-[#111827]">
                                            {tip.title}
                                        </AccordionTrigger>
                                        <AccordionContent className="px-5 pb-4 pt-0 text-[14px] text-gray-700 leading-relaxed bg-gray-50/30">
                                            {tip.detail}
                                        </AccordionContent>
                                    </AccordionItem>
                                ))}
                            </Accordion>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default MetricTipsPanel;
