"use client";
import {
  AlertCircle,
  ArrowUpRight,
  Calendar,
  Clock,
  FileText,
  ListFilter,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Toaster, toast } from "sonner";

const Page = () => {
  const [filterOpen, setFilterOpen] = useState(false);
  const [tests, setTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get("/assessments");
      const formatted = res.data.assessments.map((a: any) => ({
        id: a._id,
        name: a.test_name,
        questions: `${a.total_questions} Ques`,
        time: `${a.total_test_time} Mins`,
        attempts: a.attempts_taken || 0,
        attempts_left: a.attempts_left,
        max_attempts: a.max_attempts || 5,
        can_take_test: a.can_take_test,
        last_report_id: a.last_report_id,
        categories: a.test_categories,
        subtopics: a.test_subtopics,
        totalTime: a.total_test_time,
        totalQuestions: a.total_questions
      }));
      setTests(formatted);
      setError("");
    } catch (err: any) {
      console.log(err);
      setError("Failed to load assessments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssessments();
  }, []);

  const handleClick = () => {
    setFilterOpen((prev: boolean) => !prev);
  };

  return (
    <main className="w-full flex h-full overflow-hidden">
      <Toaster position="top-right" richColors />
      <div className="w-full h-screen flex flex-col">
        <section className="w-full flex items-end justify-between relative">
          <div className="flex flex-col gap-2">
            <h1 className="text-lg font-medium">Choose Your Challenge</h1>
            <h1 className="text-sm">
              Take a quick assessment aligned with your dream role and see where
              you stand!
            </h1>
          </div>
          <button
            onClick={handleClick}
            className={`flex items-center gap-2 text-[#f2825c] pr-2 cursor-pointer ${
              filterOpen ? "hidden" : ""
            }`}
          >
            <ListFilter size={14} />
            <h1 className="underline">Filter</h1>
          </button>
        </section>

        <h1 className="text-lg font-medium pb-2 mt-4">Recent Assessments</h1>

        {loading && (
          <div className="w-full flex justify-center mt-10 text-gray-500">
            Loading assessments...
          </div>
        )}

        {error && (
          <div className="w-full flex justify-center mt-10 text-red-500">
            {error}
          </div>
        )}

        {!loading && !error && (
          <section
            className={`w-full grid gap-4 h-auto pb-48 overflow-auto transition-transform duration-500 delay-400 ease-in-out ${
              filterOpen ? "grid-cols-3 pr-4" : "grid-cols-4"
            }`}
          >
            {tests.map((test: any) => (
              <div
                key={test.id}
                className="row-span-1 col-span-1 px-4 py-4 bg-white rounded-lg group"
              >
                <div className="flex flex-col items-start justify-between border-b border-[#cfe3e0]/8 pb-2">
                  <div className="flex gap-2">
                    <div className="flex flex-col">
                      <h1 className="text-gray-900 text-md font-medium">
                        {test.name}
                      </h1>
                      <p className="text-gray-500 text-xs">
                        Test your knowledge and assess your skill level with
                        this curated challenge.
                      </p>
                    </div>
                  </div>
                  <TopicsList
                    categories={[...test.categories, ...test.subtopics]}
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-1 text-[#748784] text-xs">
                    <Clock size={14} />
                    <p>{test.time}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#748784] text-xs">
                    <FileText size={14} />
                    <p>{test.questions}</p>
                  </div>
                  <div className="flex items-center gap-1 text-[#748784] text-xs">
                    <Calendar size={14} />
                    <p>{test.attempts_left}/{test.max_attempts} attempts left</p>
                  </div>
                </div>

                <TakeTest
                  canTake={test.can_take_test}
                  assessmentId={test.id}
                  assessmentName={test.name}
                  queNo={test.totalQuestions}
                  time={test.totalTime}
                  attemptsLeft={test.attempts_left}
                  attemptsTaken={test.attempts}
                  lastReportId={test.last_report_id}
                />
              </div>
            ))}

            {tests.length === 0 && (
              <div className="col-span-4 text-center text-gray-500 mt-10">
                No assessments found.
              </div>
            )}
          </section>
        )}
      </div>

      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <FilterPopup setFilterOpen={setFilterOpen} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default Page;

function TopicsList({ categories }: { categories: string[] }) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="flex gap-2 w-full flex-wrap mt-4">
      {(showAll ? categories : categories?.slice(0, 2)).map(
        (category: string, index: number) => (
          <div
            key={index}
            className="bg-[#fff0ea] text-[#f2825c]/80 px-2 py-1 rounded-full text-[10px] flex items-center justify-center"
          >
            {category}
          </div>
        )
      )}

      {!showAll && categories?.length > 2 && (
        <button
          onClick={() => setShowAll(true)}
          className="bg-[#184852] text-white px-2 py-1 rounded-full text-xs flex items-center justify-center cursor-pointer hover:bg-[#f2825c]"
        >
          +{categories.length - 1}
        </button>
      )}
    </div>
  );
}

const FilterPopup = ({ setFilterOpen }: any) => {
  return (
    <div className="relative w-[360px] h-[600px] z-50 bg-white shadow-xl flex flex-col overflow-hidden">
       <div className="p-4"><h1 className="font-bold">Filters</h1></div>
    </div>
  )
};

const TakeTest = ({ canTake, assessmentId, assessmentName, queNo, time, attemptsLeft, attemptsTaken, lastReportId }: any) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const router = useRouter();
  const [isChecked, setIsChecked] = useState(false);

  const handlePopup = () => setPopupOpen((prev) => !prev);
  const handleClose = () => setPopupOpen(false);

  const handleStart = () => {
    router.push(`/assessment?id=${assessmentId}`);
  };

  const handleButtonClick = () => {
    if (!canTake) {
        if (lastReportId) {
            router.push(`/dashboard/my-performance/result-&-analysis?id=${lastReportId}`);
        } else {
            toast.error("Result report not found.");
        }
    } else {
        setPopupOpen(true);
    }
  };

  const getButtonLabel = () => {
      if (!canTake) return "View Result";
      if (attemptsTaken > 0) return "Re-attempt Test";
      return "Take Test";
  };

  return (
    <>
      <button
        onClick={handleButtonClick}
        className={`w-full flex gap-3 items-center mt-4 h-auto py-2 justify-center rounded-xl border-2 border-[#f2825c] cursor-pointer font-medium transition-colors ${
          canTake
            ? "text-[#f2825c] hover:bg-[#f2825c] hover:text-white"
            : "bg-[#f2825c] text-white hover:bg-[#184852] hover:border-[#184852]"
        }`}
      >
        {getButtonLabel()}
        <ArrowUpRight size={20} />
      </button>
      {popupOpen && (
        <div className="w-screen h-screen bg-[#17383d]/45 fixed inset-0 z-30 flex items-center justify-center">
          <div className="w-[45%] bg-white py-8 px-10 h-auto rounded-[15px] max-h-[90vh] overflow-y-auto">
            <div className="w-full flex items-cenetr justify-end">
              <button onClick={handleClose}>
                <X />
              </button>
            </div>
            
            <h1 className="text-2xl font-medium">Start Assessment: {assessmentName}</h1>
            <div className="w-full flex gap-2 border-b py-4">
                {[
                { label: `${time} mins`, icon: Clock },
                { label: `${queNo} questions`, icon: FileText },
                { label: `${attemptsLeft} attempts left`, icon: AlertCircle },
                ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-[#fff0ea] px-4 py-2 rounded-md">
                    {item.icon && <item.icon className="w-5 h-5 text-gray-600" />}
                    <span>{item.label}</span>
                </div>
                ))}
            </div>
            
            <div className="w-full flex flex-col gap-2 mt-4">
                <h1 className="text-[#17383d] font-bold text-xl">Key Instructions</h1>
                <ul className="list-disc pl-5 text-[#17383d]/65 text-[16px] space-y-2">
                    <li>Use a stable internet connection and Google Chrome.</li>
                    <li><strong>Share your Entire Screen</strong> when prompted on the next page.</li>
                    <li>Do not switch tabs or minimize the window.</li>
                    <li>Test will auto-submit if time runs out or on tab switch.</li>
                </ul>
            </div>
            
            <div className="flex gap-1 items-center mt-6">
                <div className="flex items-center gap-2">
                <input type="checkbox" checked={isChecked} onChange={(e) => setIsChecked(e.target.checked)} className="w-5 h-5 accent-[#f2825c]" />
                <label className="text-[#17383d]/65 text-sm cursor-pointer">I have read all the instructions</label>
                </div>
            </div>

            <div className="w-full flex items-center justify-end mt-6 pt-4 border-t">
              <button
                disabled={!isChecked}
                onClick={handleStart}
                className={`px-8 py-2 text-white rounded-md transition font-medium ${
                  !isChecked ? "bg-gray-300 cursor-not-allowed" : "bg-[#184852] hover:bg-[#184852]/85"
                }`}
              >
                Proceed to System Check
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
