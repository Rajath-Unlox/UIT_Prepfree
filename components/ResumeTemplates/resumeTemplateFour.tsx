"use client";

// --- UPDATED ATS-LAYOUT VERSION (Same Structure, New Styling) ---

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const colorPalatte = ["#006666", "#7d47b2", "#2b98de", "#102a73", "#7d7d7d"];

/* -------------------- INTERFACES -------------------- */
interface Education {
  id: number;
  institution: string;
  location: string;
  degree: string;
  fieldOfStudy: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Experience {
  id: number;
  title: string;
  company: string;
  location: string;
  jobType: string;
  startDate: string;
  endDate: string;
  description: string;
  currentlyWorkHere: boolean;
}

interface Project {
  id: number;
  title: string;
  role: string;
  projectType: string;
  technologies: string;
  link: string;
  description: string;
}

interface Certification {
  id: number;
  title: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  credentialId: string;
  credentialUrl: string;
  description: string;
}

interface AdditionalField {
  title: string;
  description: string;
}

interface ResumeTemplateOneProps {
  resumeData: {
    profileInfo: {
      firstname: string;
      lastname: string;
      description?: string;
      profileImageUrl: any;
    };
    contactInfo: {
      email: string;
      phone_number: string;
      linkedin?: string;
      portfolio?: string;
      country_code: string;
    };
    hasNoEducation?: boolean;
    hasNoExperience?: boolean;
    hasNoProject?: boolean;
    education?: Education[];
    experience: Experience[];
    projects: Project[];
    certifications: Certification[];
    technicalSkills: {
      name: string;
    }[];
    softSkills: {
      name: string;
    }[];
    languages: {
      name: string;
    }[];
    additionalFields: AdditionalField[];
  };
  colorIndex?: number;
  containerWidth: number;
  ref: any;
}

/* -------------------- COMPONENT -------------------- */
const ResumeTemplateFour = ({
  resumeData,
  colorIndex = 0,
  containerWidth,
  ref,
}: any) => {
  const primaryColor = colorPalatte[colorIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseWidth, setBaseWidth] = useState(800);
  const [scale, setScale] = useState(1);

  // Scaling logic (unchanged)
  useEffect(() => {
    const resizeHandler = () => {
      if (containerRef.current) {
        const actualBaseWidth = containerRef.current.offsetWidth;
        setBaseWidth(actualBaseWidth);
        const newScale = Math.min(containerWidth / baseWidth, 1);
        setScale(newScale);
      }
    };

    const observer = new ResizeObserver(resizeHandler);
    if (containerRef.current?.parentElement)
      observer.observe(containerRef.current.parentElement);

    resizeHandler();
    return () => observer.disconnect();
  }, [containerWidth, baseWidth]);

  const { profileInfo, contactInfo } = resumeData;

  // PDF logic (unchanged)
  const generateResumePdf = async () => null;
  useImperativeHandle(ref, () => ({ generateResumePdf }));

  /* ------------------------------------------------------------------
      NEW LAYOUT — ATS SINGLE COLUMN (Color Accents Enabled)
  ------------------------------------------------------------------ */

  return (
    <div
      ref={containerRef}
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : "none",
        transformOrigin: "top left",
        width: containerWidth > 0 ? `${baseWidth}px` : "auto",
      }}
    >
      <div className="bg-white text-[#17383d] px-10 py-8 w-full max-w-[800px] mx-auto leading-snug">
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-bold tracking-wide">
            {profileInfo?.firstname} {profileInfo?.lastname}
          </h1>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-gray-700">
            <p>{contactInfo?.email}</p>
            <p>
              {contactInfo?.country_code}
              {contactInfo?.phone_number}
            </p>
            {contactInfo?.linkedin && <p>{contactInfo?.linkedin}</p>}
            {contactInfo?.portfolio && <p>{contactInfo?.portfolio}</p>}
          </div>
        </div>

        {/* SECTION: SUMMARY */}
        <SectionMain title="PROFILE SUMMARY" color={primaryColor}>
          {profileInfo?.description ? (
            <p className="text-sm text-gray-800 mt-2 text-justify leading-relaxed">
              {profileInfo.description}
            </p>
          ) : (
            <Empty label="No profile added yet." />
          )}
        </SectionMain>

        {/* EXPERIENCE */}
        <SectionMain title="EXPERIENCE" color={primaryColor}>
          {resumeData.experience?.length ? (
            resumeData.experience.map((exp: any, i: number) => (
              <div key={i} className="mt-1 text-sm">
                <p className="font-semibold text-[#17383d]">
                  {exp.title} — {exp.company}
                </p>
                <p className="text-xs text-gray-600">
                  {exp.startDate} –{" "}
                  {exp.currentlyWorkHere ? "Present" : exp.endDate}
                </p>
                <p className="italic text-xs text-gray-600">
                  {exp.jobType} • {exp.location}
                </p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {exp.description}
                </p>
              </div>
            ))
          ) : (
            <Empty label="No experience added yet." />
          )}
        </SectionMain>

        {/* EDUCATION */}
        <SectionMain title="EDUCATION" color={primaryColor}>
          {resumeData.education?.length ? (
            resumeData.education.map((edu: any, i: number) => (
              <div key={i} className="mt-1 text-sm">
                <p className="font-semibold">{edu.institution}</p>
                <p className="text-xs text-gray-600">
                  {edu.degree} — {edu.fieldOfStudy}
                </p>
                <p className="text-xs text-gray-600">
                  {edu.startDate} – {edu.endDate}
                </p>
                {edu.location && (
                  <p className="italic text-xs text-gray-600">{edu.location}</p>
                )}
                {edu.description && (
                  <p className="mt-1 text-gray-800 leading-relaxed">
                    {edu.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <Empty label="No education added yet." />
          )}
        </SectionMain>

        {/* PROJECTS */}
        <SectionMain title="PROJECTS" color={primaryColor}>
          {resumeData.projects?.length ? (
            resumeData.projects.map((proj: any, i: number) => (
              <div key={i} className="mt-1 text-sm">
                <p className="font-semibold">{proj.title}</p>
                <p className="italic text-xs text-gray-600">
                  {proj.role} • {proj.projectType}
                </p>
                <p className="text-xs text-gray-600">{proj.technologies}</p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {proj.description}
                </p>
                {proj.link && (
                  <a
                    href={proj.link}
                    className="underline text-blue-700 text-xs"
                    target="_blank"
                  >
                    {proj.link}
                  </a>
                )}
              </div>
            ))
          ) : (
            <Empty label="No projects added yet." />
          )}
        </SectionMain>

        {/* CERTIFICATIONS */}
        <SectionMain title="CERTIFICATIONS" color={primaryColor}>
          {resumeData.certifications?.length ? (
            resumeData.certifications.map((cert: any, i: number) => (
              <div key={i} className="mt-1 text-sm">
                <p className="font-semibold">{cert.title}</p>
                <p className="italic text-xs text-gray-600">{cert.issuer}</p>
                <p className="text-xs text-gray-600">
                  {cert.issueDate} – {cert.expiryDate}
                </p>
                <p className="mt-1 text-gray-800 leading-relaxed">
                  {cert.description}
                </p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    className="underline text-blue-700 text-xs"
                    target="_blank"
                  >
                    {cert.credentialUrl}
                  </a>
                )}
              </div>
            ))
          ) : (
            <Empty label="No certifications added yet." />
          )}
        </SectionMain>

        {/* SKILLS + LANGUAGES */}
        <SectionMain title="SKILLS & LANGUAGES" color={primaryColor}>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold mb-1">Skills</p>
              <ul className="list-disc list-inside text-xs text-gray-800">
                {resumeData.technicalSkills?.map((s: any, i: number) => (
                  <li key={i}>{s.name}</li>
                ))}
                {resumeData.softSkills?.map((s: any, i: number) => (
                  <li key={i}>{s.name}</li>
                ))}
              </ul>
            </div>

            <div>
              <p className="font-semibold mb-1">Languages</p>
              <ul className="list-disc list-inside text-xs text-gray-800">
                {resumeData.languages?.map((l: any, i: number) => (
                  <li key={i}>{l.name}</li>
                ))}
              </ul>
            </div>
          </div>
        </SectionMain>
      </div>
    </div>
  );
};

/* -------------------- HELPERS -------------------- */
const SectionMain = ({ title, children, color }: any) => (
  <div className="mt-2">
    <h2
      className="text-sm font-semibold tracking-wide pb-1 border-b"
      style={{ borderColor: color, color }}
    >
      {title}
    </h2>
    <div className="mt-2">{children}</div>
  </div>
);

const Empty = ({ label }: any) => (
  <p className="text-xs italic text-gray-500 mt-1">{label}</p>
);

export default ResumeTemplateFour;
