"use client";
import {
  Check,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RenderResume from "@/components/ResumeTemplates/renderResume";
import { useTemplates } from "@/hooks/useTemplates";

// Dummy resume data used to preview templates in the selector grid
const previewResumeData = {
  profileInfo: {
    firstname: "Alex",
    lastname: "Johnson",
    description:
      "Full Stack Software Developer with 4+ years of experience building scalable web applications and APIs. Skilled in modern JavaScript frameworks, cloud deployment, and performance optimization.",
    profileImageUrl: "",
  },

  contactInfo: {
    email: "alex.johnson@example.com",
    phone_number: "9876543210",
    country_code: "+1",
    linkedin: "linkedin.com/in/alexjohnson",
    portfolio: "https://alexjohnson.dev",
  },

  education: [
    {
      institution: "Stanford University",
      degree: "Bachelor of Science",
      fieldOfStudy: "Computer Science",
      startDate: "2015",
      endDate: "2019",
      location: "Stanford, California",
      description:
        "Graduated with Honors. Specialized in Distributed Systems and Web Engineering.",
    },
    {
      institution: "Coursera",
      degree: "Professional Certification",
      fieldOfStudy: "Full Stack Development",
      startDate: "2020",
      endDate: "2021",
      location: "Online",
      description:
        "Completed advanced training in MERN stack and scalable backend systems.",
    },
  ],

  languages: [
    { name: "English" },
    { name: "Spanish" },
    { name: "French" },
  ],

  technicalSkills: [
    { name: "JavaScript" },
    { name: "TypeScript" },
    { name: "React" },
    { name: "Next.js" },
    { name: "Node.js" },
    { name: "Express.js" },
    { name: "MongoDB" },
    { name: "PostgreSQL" },
    { name: "Docker" },
    { name: "AWS" },
    { name: "Git" },
  ],

  softSkills: [
    { name: "Leadership" },
    { name: "Problem Solving" },
    { name: "Communication" },
    { name: "Team Collaboration" },
    { name: "Time Management" },
  ],

  experience: [
    {
      title: "Senior Software Engineer",
      company: "Tech Solutions Inc.",
      startDate: "Jan 2022",
      endDate: "Present",
      currentlyWorkHere: true,
      jobType: "Full-Time",
      location: "San Francisco, CA",
      description:
        "Led development of scalable web platforms using React and Node.js. Improved application performance by 35% and mentored junior developers.",
    },
    {
      title: "Software Engineer",
      company: "Innovate Labs",
      startDate: "June 2019",
      endDate: "Dec 2021",
      currentlyWorkHere: false,
      jobType: "Full-Time",
      location: "San Jose, CA",
      description:
        "Built REST APIs and microservices using Node.js and Express. Integrated third-party services and improved system reliability.",
    },
  ],

  projects: [
    {
      title: "Real-Time Chat Application",
      role: "Full Stack Developer",
      projectType: "Personal Project",
      technologies: "React, Node.js, Socket.io, MongoDB",
      link: "https://github.com/alex/chat-app",
      description:
        "Developed a real-time chat platform supporting group messaging, authentication, and live notifications.",
    },
    {
      title: "E-Commerce Platform",
      role: "Frontend Developer",
      projectType: "Freelance Project",
      technologies: "React, Redux, Stripe API",
      link: "https://shopdemo.example.com",
      description:
        "Designed and built a responsive e-commerce frontend with secure payment integration.",
    },
  ],

  certifications: [
    {
      title: "AWS Certified Solutions Architect",
      issuer: "Amazon Web Services",
      issueDate: "Aug 2022",
      expiryDate: "Aug 2025",
      description:
        "Validated expertise in designing and deploying scalable systems on AWS.",
      credentialUrl: "https://aws.amazon.com/certification/",
    },
    {
      title: "Meta Front-End Developer Professional Certificate",
      issuer: "Meta",
      issueDate: "May 2021",
      expiryDate: "",
      description:
        "Advanced training in modern frontend development and React applications.",
      credentialUrl: "",
    },
  ],

  additionalFields: [
    {
      title: "Interests",
      items: ["Open Source", "AI Research", "Tech Blogging"],
    },
  ],

  hasNoEducation: false,
  hasNoExperience: false,
  hasNoProject: false,
};

const Page = () => {
  const { templates, loading, error } = useTemplates();
  const [progress, setProgress] = useState(0);
  const [popupOpen, setPopupOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(
    null
  );

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (popupOpen) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            handlePopupClose();
            return 100;
          }
          return prev + 5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [popupOpen]);

  const resumeRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(254);

  useEffect(() => {
    const updateSize = () => {
      if (resumeRef.current) {
        setContainerWidth(resumeRef.current.offsetWidth);
      }
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  const handleSelect = (href: string) => {
    setPendingNavigation(href);
    setPopupOpen(true);
  };

  const handlePopupClose = () => {
    setPopupOpen(false);
    if (pendingNavigation) {
      window.location.href = pendingNavigation;
    }
  };

  if (loading) {
    return (
      <main className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-500 text-sm">Loading templates...</p>
      </main>
    );
  }

  if (error) {
    return (
      <main className="w-full h-screen flex items-center justify-center">
        <p className="text-red-500 text-sm">{error}</p>
      </main>
    );
  }

  return (
    <main className="w-full flex h-full overflow-hidden relative">
      {popupOpen && (
        <div className="w-screen h-screen fixed inset-0 bg-[#17383d]/45 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex flex-col items-center justify-center w-auto h-1/2">
            <div className="w-12 h-12 rounded-full bg-[#f2825c] flex items-center justify-center">
              <Check size={24} className="text-white" />
            </div>
            <h1 className="font-medium mt-2">Applying Template...</h1>
            <div className="h-2 w-[300px] bg-[#fff0ea] rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#f2825c] to-[#184852] transition-all duration-100"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      <div className="w-full h-screen flex flex-col">
        <section className="w-full flex items-end justify-between relative">
          <h1 className="text-xl font-bold">Builder Your Resume</h1>
        </section>

        {/* Template Cards Grid */}
        <section className="w-full grid grid-cols-4 gap-4 h-auto pb-48 overflow-auto mt-4 px-1">
          {templates.map((tmpl, idx) => (
            <div
              ref={idx === 0 ? resumeRef : null}
              key={tmpl.templateId}
              className="row-span-1 col-span-1 group relative h-[340px] border border-gray-100 overflow-hidden bg-white"
            >
              <div className="bg-gradient-to-t from-white/90 to-transparent h-full w-full absolute group-hover:block z-30 opacity-75 hidden pointer-events-none" />
              <div className="w-full h-full pointer-events-none overflow-hidden">
                <RenderResume
                  templateId={tmpl.templateId}
                  resumeData={previewResumeData}
                  colorIndex={0}
                  containerWidth={containerWidth}
                  templateData={tmpl}
                />
              </div>
              <button
                onClick={() =>
                  handleSelect(
                    `/dashboard/ai-resume-builder/template-selector/${tmpl.templateId}`
                  )
                }
                className="w-fit text-white flex items-center px-4 py-2 bg-[#184852] rounded-md gap-1 cursor-pointer absolute bottom-8 left-1/2 -translate-x-1/2 group-hover:block z-30 hidden shadow-xl"
              >
                <h1 className="text-sm font-medium">Use this Template</h1>
              </button>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
};

export default Page;
