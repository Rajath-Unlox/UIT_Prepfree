"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  GalleryVerticalEnd,
  Linkedin,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
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
const ResumeTemplateOne: React.FC<ResumeTemplateOneProps> = ({
  resumeData,
  colorIndex = 0,
  containerWidth,
  ref,
}) => {
  const primaryColor = colorPalatte[colorIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseWidth, setBaseWidth] = useState(800);
  const [scale, setScale] = useState(1);

  // 🔹 Auto scaling logic
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

    resizeHandler(); // initial call
    return () => observer.disconnect();
  }, [containerWidth, baseWidth]);

  const { profileInfo, contactInfo } = resumeData;

  const generateResumePdf = async (): Promise<File | null> => {
    if (!containerRef.current) return null;

    try {
      const root = containerRef.current;

      // 🔹 Step 1: Replace unsupported colors temporarily
      const elements = Array.from(root.querySelectorAll<HTMLElement>("*"));
      const originalStyles: {
        el: HTMLElement;
        bg?: string;
        color?: string;
        border?: string;
      }[] = [];

      elements.forEach((el) => {
        const style = window.getComputedStyle(el);
        const bg = style.backgroundColor;
        const color = style.color;
        const border = style.borderColor;

        const hasUnsupported =
          /(lab|oklab|oklch|color\()/i.test(bg) ||
          /(lab|oklab|oklch|color\()/i.test(color) ||
          /(lab|oklab|oklch|color\()/i.test(border);

        if (hasUnsupported) {
          // Save original styles
          originalStyles.push({ el, bg, color, border });

          // Replace unsupported color values
          if (/(lab|oklab|oklch|color\()/i.test(bg)) {
            el.style.backgroundColor = "#ffffff";
          }
          if (/(lab|oklab|oklch|color\()/i.test(color)) {
            el.style.color = "#000000";
          }
          if (/(lab|oklab|oklch|color\()/i.test(border)) {
            el.style.borderColor = "#cccccc";
          }
        }
      });

      // 🔹 Step 2: Capture the element
      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff", // ensure white background for PDF
        logging: false,
        onclone: (clonedDoc) => {
          // Make sure cloned document has same background for consistent rendering
          (clonedDoc.body.style as any).backgroundColor = "#ffffff";
        },
      });

      // 🔹 Step 3: Restore original styles
      originalStyles.forEach(({ el, bg, color, border }) => {
        if (bg) el.style.backgroundColor = bg;
        if (color) el.style.color = color;
        if (border) el.style.borderColor = border;
      });

      // 🔹 Step 4: Convert canvas to PDF
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      if (imgHeight > pageHeight) {
        // If content is taller than one page → split into multiple pages
        let heightLeft = imgHeight;

        while (heightLeft > 0) {
          pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
          if (heightLeft > 0) {
            pdf.addPage();
            position = -pageHeight;
          }
        }
      } else {
        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
      }

      const pdfBlob = pdf.output("blob");
      return new File([pdfBlob], "resume.pdf", { type: "application/pdf" });
    } catch (err) {
      console.error("PDF generation failed:", err);
      return null;
    }
  };

  // Expose this function to parent (RenderResume → PublishPopup)
  useImperativeHandle(ref, () => ({
    generateResumePdf,
  }));

  return (
    <div
      ref={containerRef}
      style={{
        transform: containerWidth > 0 ? `scale(${scale})` : "none",
        transformOrigin: "top left",
        width: containerWidth > 0 ? `${baseWidth}px` : "auto",
        height: "auto",
      }}
    >
      <div className="grid grid-cols-12 min-h-[1100px] bg-white shadow-lg text-[#17383d]">
        {/* LEFT COLUMN */}
        <div
          className="col-span-4 h-full flex flex-col p-4 text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {/* IMAGE */}
          <div className="w-32 h-32 rounded-full overflow-hidden mx-auto bg-gray-300">
            {profileInfo?.profileImageUrl ? (
              <img
                src={profileInfo.profileImageUrl}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-white text-sm">
                No Image
              </div>
            )}
          </div>

          {/* CONTACT – ATS FRIENDLY */}
          <h2 className="text-sm font-semibold mt-5 border-b pb-1">CONTACT</h2>
          <div className="mt-2 text-xs leading-relaxed space-y-1">
            <p>
              <strong>Email:</strong> {contactInfo?.email}
            </p>
            <p>
              <strong>Phone:</strong> {contactInfo?.country_code}
              {contactInfo?.phone_number}
            </p>
            {contactInfo?.linkedin && (
              <p>
                <strong>LinkedIn:</strong> {contactInfo?.linkedin}
              </p>
            )}
            {contactInfo?.portfolio && (
              <p>
                <strong>Portfolio:</strong> {contactInfo?.portfolio}
              </p>
            )}
          </div>

          {/* EDUCATION */}
          <h2 className="text-sm font-semibold mt-5 border-b pb-1">
            EDUCATION
          </h2>
          {resumeData.education?.length ? (
            resumeData.education.map((edu, i) => (
              <div key={i} className="mt-2 text-xs leading-tight">
                <p className="font-semibold">{edu.institution}</p>
                <p>
                  {edu.degree} – {edu.fieldOfStudy}
                </p>
                <p>
                  {edu.startDate} – {edu.endDate}
                </p>
                <p className="italic">{edu.location}</p>
                {edu.description && <p className="mt-1">{edu.description}</p>}
              </div>
            ))
          ) : (
            <Empty label="No education added yet." />
          )}

          {/* LANGUAGES */}
          <h2 className="text-sm font-semibold mt-5 border-b pb-1">
            LANGUAGES
          </h2>
          {resumeData.languages?.length ? (
            <ul className="text-xs list-disc list-inside mt-1">
              {resumeData.languages.map((l, i) => (
                <li key={i}>{l.name}</li>
              ))}
            </ul>
          ) : (
            <Empty label="No languages added yet." />
          )}

          {/* SKILLS */}
          <h2 className="text-sm font-semibold mt-5 border-b pb-1">SKILLS</h2>
          {resumeData.technicalSkills?.length || resumeData.softSkills?.length ? (
            <ul className="text-xs list-disc list-inside mt-1">
              {resumeData.technicalSkills.map((s, i) => (
                <li key={i}>{s.name}</li>
              ))}
              {resumeData.softSkills.map((s, i) => (
                <li key={i}>{s.name}</li>
              ))}
            </ul>
          ) : (
            <Empty label="No skills added yet." />
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="col-span-8 h-full p-6">
          {/* NAME SECTION */}
          <h1 className="text-3xl font-bold">
            {profileInfo?.firstname} {profileInfo?.lastname}
          </h1>
          <div
            className="h-1 w-20 mt-1"
            style={{ backgroundColor: primaryColor }}
          />

          {/* PROFILE SUMMARY */}
          <h2
            className="text-sm font-semibold mt-6 border-b pb-1"
            style={{ color: primaryColor }}
          >
            PROFILE SUMMARY
          </h2>
          {profileInfo?.description ? (
            <p className="text-xs mt-2 text-justify leading-relaxed">
              {profileInfo?.description}
            </p>
          ) : (
            <Empty label="No profile added yet." />
          )}

          {/* EXPERIENCE */}
          <h2
            className="text-sm font-semibold mt-6 border-b pb-1"
            style={{ color: primaryColor }}
          >
            EXPERIENCE
          </h2>
          {resumeData.experience?.length ? (
            resumeData.experience.map((exp, i) => (
              <div key={i} className="mt-3 text-xs leading-relaxed">
                <p className="font-semibold">
                  {exp.title} – {exp.company}
                </p>
                <p className="text-[11px]">
                  {exp.startDate} –{" "}
                  {exp.currentlyWorkHere ? "Present" : exp.endDate}
                </p>
                <p className="italic text-[11px]">
                  {exp.jobType} • {exp.location}
                </p>
                <p className="mt-1">{exp.description}</p>
              </div>
            ))
          ) : (
            <Empty label="No experience added yet." />
          )}

          {/* PROJECTS */}
          <h2
            className="text-sm font-semibold mt-6 border-b pb-1"
            style={{ color: primaryColor }}
          >
            PROJECTS
          </h2>
          {resumeData.projects?.length ? (
            resumeData.projects.map((proj, i) => (
              <div key={i} className="mt-3 text-xs leading-relaxed">
                <p className="font-semibold">{proj.title}</p>
                <p className="italic text-[11px]">
                  {proj.role} • {proj.projectType}
                </p>
                <p className="text-[11px]">{proj.technologies}</p>
                <p className="mt-1">{proj.description}</p>
                {proj.link && (
                  <a
                    href={proj.link}
                    className="underline text-blue-700 text-[11px]"
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

          {/* CERTIFICATIONS */}
          <h2
            className="text-sm font-semibold mt-6 border-b pb-1"
            style={{ color: primaryColor }}
          >
            CERTIFICATIONS
          </h2>
          {resumeData.certifications?.length ? (
            resumeData.certifications.map((cert, i) => (
              <div key={i} className="mt-3 text-xs leading-relaxed">
                <p className="font-semibold">{cert.title}</p>
                <p className="italic text-[11px]">{cert.issuer}</p>
                <p className="text-[11px]">
                  {cert.issueDate} – {cert.expiryDate}
                </p>
                <p className="mt-1">{cert.description}</p>
                {cert.credentialUrl && (
                  <a
                    href={cert.credentialUrl}
                    className="underline text-blue-700 text-[11px]"
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
        </div>
      </div>
    </div>
  );
};

/* -------------------- HELPERS -------------------- */
const ContactItem = ({
  icon,
  value,
}: {
  icon: React.ReactNode;
  value: string;
}) => (
  <div className="flex items-center gap-2 mt-1">
    <div className="w-5 h-5 flex items-center justify-center">{icon}</div>
    <p className="text-xs break-all">{value}</p>
  </div>
);

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="w-full mt-4">
    <h1 className="text-sm font-semibold border-b border-white">{title}</h1>
    <div className="mt-1">{children}</div>
  </div>
);

const SectionMain = ({
  title,
  children,
  color,
}: {
  title: string;
  children: React.ReactNode;
  color: string;
}) => (
  <div className="mt-4">
    <h1
      className="text-sm font-semibold border-b mb-1"
      style={{ borderColor: color, color }}
    >
      {title}
    </h1>
    {children}
  </div>
);

const Empty = ({ label }: { label: string }) => (
  <p className="text-xs italic text-gray-500">{label}</p>
);

export default ResumeTemplateOne;
