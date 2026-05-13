"use client";

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  forwardRef,
} from "react";
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

interface ResumeTemplateThreeProps {
  resumeData: {
    profileInfo: {
      firstname: string;
      lastname: string;
      description?: string;
      profileImageUrl?: any;
      title?: string;
    };
    contactInfo: {
      email: string;
      phone_number?: string;
      linkedin?: string;
      portfolio?: string;
      country_code?: string;
      location?: string;
    };
    hasNoEducation?: boolean;
    hasNoExperience?: boolean;
    hasNoProject?: boolean;
    education?: Education[];
    experience: Experience[];
    projects?: Project[];
    certifications?: Certification[];
    technicalSkills?: {
      name: string;
    }[];
    softSkills?: {
      name: string;
    }[];
    languages?: {
      name: string;
    }[];
    additionalFields?: AdditionalField[];
  };
  colorIndex?: number;
  containerWidth: number;
  ref: any;
}

/* -------------------- COMPONENT (forwardRef) -------------------- */
const ResumeTemplateThree: React.FC<ResumeTemplateThreeProps> = ({
  resumeData,
  colorIndex = 0,
  containerWidth,
  ref,
}) => {
  const primaryColor = colorPalatte[colorIndex];
  const containerRef = useRef<HTMLDivElement>(null);
  const [baseWidth, setBaseWidth] = useState(800);
  const [scale, setScale] = useState(1);

  // Keep the same scaling logic
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

  // PDF generation (kept as before, including color fixes)
  const generateResumePdf = async (): Promise<File | null> => {
    if (!containerRef.current) return null;

    try {
      const root = containerRef.current;

      // temporarily replace unsupported colors
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
          originalStyles.push({ el, bg, color, border });
          if (/(lab|oklab|oklch|color\()/i.test(bg))
            el.style.backgroundColor = "#ffffff";
          if (/(lab|oklab|oklch|color\()/i.test(color))
            el.style.color = "#000000";
          if (/(lab|oklab|oklch|color\()/i.test(border))
            el.style.borderColor = "#cccccc";
        }
      });

      const canvas = await html2canvas(root, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
        onclone: (clonedDoc) => {
          (clonedDoc.body.style as any).backgroundColor = "#ffffff";
        },
      });

      // restore styles
      originalStyles.forEach(({ el, bg, color, border }) => {
        if (bg) el.style.backgroundColor = bg;
        if (color) el.style.color = color;
        if (border) el.style.borderColor = border;
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

      const pageWidth = 210;
      const pageHeight = 297;
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let position = 0;
      if (imgHeight > pageHeight) {
        let heightLeft = imgHeight;
        // first page
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          pdf.addPage();
          pdf.addImage(
            imgData,
            "PNG",
            0,
            position - imgHeight + pageHeight,
            imgWidth,
            imgHeight
          );
          heightLeft -= pageHeight;
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Present";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
  };

  // Expose generateResumePdf to parent
  useImperativeHandle(ref, () => ({
    generateResumePdf,
  }));

  /* -------------------- RENDER: single-column ATS style -------------------- */
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
      <div
        className="w-full bg-white text-[#17383d] px-10 py-8 min-h-[1100px]"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header: Name */}
        <div className="text-center">
          <h1
            className={`text-3xl font-bold tracking-wide text-[${primaryColor}]`}
          >
            {profileInfo?.firstname + profileInfo?.lastname || "Name"}
          </h1>
          <p className="text-sm mt-1">{profileInfo?.title}</p>

          {/* Contact line */}
          <p className="text-xs mt-2 text-gray-700">
            {contactInfo?.location ? `${contactInfo.location} | ` : ""}
            {contactInfo?.email}
            {contactInfo?.phone_number
              ? ` | +${contactInfo.country_code || ""} ${
                  contactInfo.phone_number
                }`
              : ""}
            {contactInfo?.linkedin ? ` | ${contactInfo.linkedin}` : ""}
          </p>
        </div>

        <hr className="my-4 border-[#cfe3e0]" />

        {/* PROFESSIONAL SUMMARY */}
        <SectionTitle
          title="PROFESSIONAL SUMMARY"
          primaryColor={primaryColor}
        />
        {profileInfo?.description ? (
          <p className="text-sm text-justify leading-relaxed mt-1">
            {profileInfo.description}
          </p>
        ) : (
          <Empty label="No summary added yet." />
        )}

        {/* WORK EXPERIENCE */}
        {!resumeData.hasNoExperience && (
          <>
            <SectionTitle title="WORK EXPERIENCE" primaryColor={primaryColor} />
            {resumeData.experience?.length ? (
              resumeData.experience.map((exp, idx) => (
                <div key={idx} className="mt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">
                        {exp.title}{" "}
                        <span className="font-normal">{exp.jobType && `- ${exp.jobType}`}</span>
                      </p>
                      <p className="text-xs">
                        {exp.company}
                        {exp.location ? `, ${exp.location}` : ""}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p>
                        {formatDate(exp.startDate)} –{" "}
                        {exp.currentlyWorkHere
                          ? "Present"
                          : formatDate(exp.endDate)}
                      </p>
                    </div>
                  </div>

                  {/* Description as bullet points: split by newline if provided */}
                  {/* Description as paragraphs instead of bullets */}
                  {exp.description ? (
                    <div className="mt-1 text-sm">
                      {exp.description
                        .split("\n")
                        .map((line: string, i: number) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;
                          return (
                            <p key={i} className="mb-1">
                              {trimmed}
                            </p>
                          );
                        })}
                    </div>
                  ) : null}
                </div>
              ))
            ) : (
              <Empty label="No work experience added yet." />
            )}
          </>
        )}

        {/* EDUCATION */}
        {!resumeData.hasNoEducation && (
          <>
            <SectionTitle title="EDUCATION" primaryColor={primaryColor} />
            {resumeData.education?.length ? (
              resumeData.education.map((edu, idx) => (
                <div key={idx} className="mt-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-sm">{edu.degree}</p>
                      <p className="text-xs italic">
                        {edu.institution}
                        {edu.location ? `, ${edu.location}` : ""}
                      </p>
                    </div>
                    <div className="text-xs">
                      <p>
                        {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                      </p>
                    </div>
                  </div>
                  {edu.description && (
                    <p className="text-sm mt-1">{edu.description}</p>
                  )}
                </div>
              ))
            ) : (
              <Empty label="No education added yet." />
            )}
          </>
        )}

        {/* SKILLS */}
        <SectionTitle title="SKILLS" primaryColor={primaryColor} />
        {/* TECHNICAL SKILLS */}
        {resumeData.technicalSkills?.length ? (
          <div className="mt-1 text-sm flex gap-1">
            <p className="font-semibold">Technical Skills:</p>
            <p>{resumeData.technicalSkills.map((s) => s.name).join(", ")}</p>
          </div>
        ) : (
          <Empty label="No technical skills added yet." />
        )}

        {/* SOFT SKILLS */}
        {resumeData.softSkills?.length ? (
          <div className="mt-1 text-sm flex gap-1">
            <p className="font-semibold">Soft Skills:</p>
            <p>{resumeData.softSkills.map((s) => s.name).join(", ")}</p>
          </div>
        ) : (
          <Empty label="No soft skills added yet." />
        )}

        {/* PROJECTS */}
        <SectionTitle title="PROJECTS" primaryColor={primaryColor} />
        {resumeData.projects?.length ? (
          <div className="mt-1 text-sm space-y-2">
            {resumeData.projects.map((p, i) => (
              <div key={i} className="mb-2">
                <p className="font-semibold text-base">
                  {p.title}{" "}
                  <span className="font-normal">{p.role && `— ${p.role}`}</span>
                </p>

                {p.projectType && <p> {p.projectType}</p>}

                {p.technologies && <p className="italic">{p.technologies}</p>}

                {p.description && (
                  <p className="text-xs mt-1">{p.description}</p>
                )}

                {p.link && (
                  <p>
                    <span className="font-semibold">Link:</span>{" "}
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {p.link}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty label="No projects added yet." />
        )}

        {/* CERTIFICATIONS */}
        <SectionTitle title="CERTIFICATIONS" primaryColor={primaryColor} />
        {resumeData.certifications?.length ? (
          <div className="mt-1 text-sm space-y-2">
            {resumeData.certifications.map((c, i) => (
              <div key={i} className="mb-2">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-base">
                    {c.title}- <span className="font-normal">{c.issuer}</span>
                  </p>

                  {(c.issueDate || c.expiryDate) && (
                    <p>
                      {c.issueDate ? formatDate(c.issueDate) : "N/A"}{" "}
                      {c.expiryDate ? `– ${formatDate(c.expiryDate)}` : ""}
                    </p>
                  )}
                </div>

                {c.credentialId && <p>{c.credentialId}</p>}

                {c.description && (
                  <p className="text-xs mt-1">{c.description}</p>
                )}

                {c.credentialUrl && (
                  <p>
                    <a
                      href={c.credentialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {c.credentialUrl}
                    </a>
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <Empty label="No certifications added yet." />
        )}

        {/* ADDITIONAL FIELDS */}
        {resumeData.additionalFields?.length
          ? resumeData.additionalFields.map((f, i) => (
              <div key={i}>
                <SectionTitle title={f.title} primaryColor={primaryColor} />
                <p className="text-sm mt-1">{f.description}</p>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};

/* -------------------- SMALL HELPERS -------------------- */

const SectionTitle = ({
  title,
  primaryColor,
}: {
  title: string;
  primaryColor: any;
}) => (
  <div className="mt-6">
    <h2
      className={`text-sm font-semibold uppercase border-b pb-1 text-[${primaryColor}]`}
    >
      {title}
    </h2>
  </div>
);

const Empty = ({ label }: { label: string }) => (
  <p className="text-xs italic text-gray-500 mt-2">{label}</p>
);

export default ResumeTemplateThree;
