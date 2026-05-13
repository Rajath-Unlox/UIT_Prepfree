"use client";
import React, { useEffect, useState } from "react";
import resumeBuild from "@/public/images/resume-builder/resumeBuild.png";
import Image from "next/image";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import RenderResume from "@/components/ResumeTemplates/renderResume";
import api from "@/lib/api";
import { useTemplates } from "@/hooks/useTemplates";

const Page = () => {
  const [selected, setSelected] = useState<string>("start");
  const [resumeData, setResumeData] = useState<any>(null);
  const [draftData, setDraftData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { templates } = useTemplates();

  useEffect(() => {
    const fetchResume = async () => {
      try {
        setLoading(true);
        const res = await api.get("/resume/");
        setResumeData(res.data);
      } catch (error) {
        console.error("Error fetching resume:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, []);

  useEffect(() => {
    const fetchDrafts = async () => {
      try {
        const res = await api.get("/resume/drafts");
        console.log(res.data?.drafts);
        setDraftData(res.data?.drafts || []);
      } catch (error) {
        console.error("Error fetching drafts:", error);
      }
    };

    fetchDrafts();
  }, []);

  const handleClick = (id: string) => setSelected(id);

  const handleBuildNew = () => {
    router.push("/dashboard/ai-resume-builder/template-selector");
  };

  const handleViewResume = (template: string, resumeSource: string) => {
    router.push(
      `/dashboard/ai-resume-builder/template-selector/${template}?source=${resumeSource}`
    );
  };

  const handleEditDraft = (draftId: string, template: string) => {
    router.push(
      `/dashboard/ai-resume-builder/template-selector/${template}?draftId=${draftId}`
    );
  };

  if (loading) {
    return (
      <main className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <main className="w-full h-auto">
      <h1 className="text-lg font-bold">Let’s Perfect Your Resume</h1>

      <div className="grid grid-cols-2 gap-8 mt-16">
        {/* ✅ Show current resume if available */}
        {resumeData?.source === "resume" && (
          <div
            id="resume"
            onClick={() => handleClick("resume")}
            className={`border-2 rounded-[30px] relative flex items-start justify-center p-10 cursor-pointer transition-all ${selected === "resume"
              ? "border-[#f2825c] bg-[#f2825c]/20"
              : "border-[#cfe3e0]/38 bg-white/40"
              }`}
          >
            <div className="w-1/2 px-4 py-2 bg-[#FFDC85] flex items-center justify-center rounded-md absolute -top-5">
              <h1>Your Current Resume</h1>
            </div>
            <div className="w-1/2 h-[360px] overflow-hidden">
              <RenderResume
                templateId={resumeData.template}
                resumeData={resumeData.resumeData}
                colorIndex={Number(resumeData.colorCode || 0)}
                containerWidth={254}
                templateData={templates.find((t) => t.templateId === resumeData.template)}
              />
            </div>
            {/* <Pencil size={20} className="absolute top-5 right-5" /> */}

            {selected === "resume" && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                onClick={() =>
                  handleViewResume(resumeData.template, resumeData.source)
                }
                className="w-fit text-white flex items-center px-4 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer absolute bottom-8"
              >
                <h1>View Full Resume</h1>
              </motion.button>
            )}
          </div>
        )}

        {/* ✅ Show all saved drafts */}
        {draftData.length > 0 &&
          draftData.map((draft, index) => (
            <div
              key={draft._id || index}
              id={`draft-${draft._id}`}
              onClick={() => handleClick(`draft-${draft._id}`)}
              className={`border-2 rounded-[30px] relative flex flex-col items-center justify-center p-10 cursor-pointer transition-all ${selected === `draft-${draft._id}`
                ? "border-[#f2825c] bg-[#f2825c]/20"
                : "border-[#cfe3e0]/38 bg-white/40"
                }`}
            >
              <div className="w-1/2 px-4 py-2 bg-[#B4E9FF] flex items-center justify-center rounded-md absolute -top-5">
                <h1>Draft {index + 1}</h1>
              </div>
              <div className="w-1/2 h-[360px] overflow-hidden">
                <RenderResume
                  templateId={draft.template}
                  resumeData={draft.resumeData}
                  colorIndex={Number(draft.colorCode || 0)}
                  containerWidth={254}
                  templateData={templates.find((t) => t.templateId === draft.template)}
                />
              </div>
              {/* <Pencil size={20} className="absolute top-5 right-5" /> */}

              {selected === `draft-${draft._id}` && (
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleEditDraft(draft._id, draft.template)}
                  className="w-fit text-white flex items-center px-4 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer absolute bottom-8"
                >
                  <h1>Continue Editing</h1>
                </motion.button>
              )}
            </div>
          ))}

        {/* ✅ Always show start from scratch option */}
        <div
          id="start"
          onClick={() => handleClick("start")}
          className={`border-2 rounded-[30px] relative flex flex-col items-center justify-center p-10 cursor-pointer transition-all ${selected === "start"
            ? "border-[#f2825c] bg-[#f2825c]/20"
            : "border-[#cfe3e0]/38 bg-white/40"
            }`}
        >
          <Image src={resumeBuild} alt="resumeBuild" className="h-auto w-1/2" />
          <h1 className="text-[#1E1E1E] text-lg font-bold mt-2">
            Start from Scratch
          </h1>
          <p className="text-[#1E1E1E] text-sm text-center">
            We’ll guide you through the process so your skills can shine
          </p>

          {selected === "start" && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              onClick={handleBuildNew}
              className="w-fit text-white flex items-center px-4 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer mt-6"
            >
              <h1>Build Your Resume</h1>
            </motion.button>
          )}
        </div>
      </div>
    </main>
  );
};

export default Page;
