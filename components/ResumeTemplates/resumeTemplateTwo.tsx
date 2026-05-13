"use client";

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

const colorPalatte = ["#006666", "#7d47b2", "#2b98de", "#102a73", "#7d7d7d"];

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

interface ResumeTemplateTwoProps {
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

const ResumeTemplateTwo: React.FC<ResumeTemplateTwoProps> = ({
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Present";

    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });
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
      <div className="min-h-[1000px] bg-white p-5 shadow-lg text-[#17383d]">
        {/* -------------------- HEADER -------------------- */}
        <h1 className="text-xl font-bold">
          {profileInfo?.firstname} {profileInfo?.lastname}
        </h1>

        <div className="mt-1 text-xs text-gray-700 leading-tight">
          {contactInfo?.email && <p>Email: {contactInfo?.email}</p>}
          {contactInfo?.phone_number && (
            <p>
              Phone: {contactInfo?.country_code} {contactInfo?.phone_number}
            </p>
          )}
          {contactInfo?.linkedin && <p>LinkedIn: {contactInfo?.linkedin}</p>}
          {contactInfo?.portfolio && <p>Portfolio: {contactInfo?.portfolio}</p>}
        </div>

        <hr className="my-3 border-gray-400" />

        {/* -------------------- SUMMARY -------------------- */}
        <Section title="PROFILE SUMMARY" color={primaryColor}>
          {profileInfo?.description ? (
            <p className="text-xs text-justify">{profileInfo?.description}</p>
          ) : (
            <Empty message="No summary added yet." />
          )}
        </Section>

        {/* -------------------- EDUCATION -------------------- */}
        {!resumeData.hasNoEducation && (
          <Section title="EDUCATION" color={primaryColor}>
            {resumeData.education?.length ? (
              resumeData.education.map((edu: any) => (
                <div key={edu.id} className="mb-3">
                  <h3 className="font-semibold text-xs">{edu.institution}</h3>
                  <p className="text-xs">
                    {edu.degree} – {edu.fieldOfStudy}
                  </p>
                  <p className="text-xs">{edu.location}</p>
                  <p className="text-xs">
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </p>

                  {edu.description && (
                    <p className="text-xs text-justify mt-1">
                      {edu.description}
                    </p>
                  )}
                </div>
              ))
            ) : (
              <Empty message="No education added yet." />
            )}
          </Section>
        )}

        {/* -------------------- EXPERIENCE -------------------- */}
        {!resumeData.hasNoExperience && (
          <Section title="WORK EXPERIENCE" color={primaryColor}>
            {resumeData.experience?.length ? (
              resumeData.experience.map((exp: any) => (
                <div key={exp.id} className="mb-3">
                  <h3 className="font-semibold text-sm">{exp.title}</h3>
                  <p className="text-xs">
                    {exp.company} • {exp.location}
                  </p>
                  <p className="text-xs">
                    {formatDate(exp.startDate)} –{" "}
                    {exp.currentlyWorkHere
                      ? "Present"
                      : formatDate(exp.startDate)}
                  </p>
                  {exp.jobType && (
                    <p className="text-xs italic">{exp.jobType}</p>
                  )}
                  <p className="text-xs text-justify mt-1">{exp.description}</p>
                </div>
              ))
            ) : (
              <Empty message="No experience added yet." />
            )}
          </Section>
        )}

        {/* -------------------- PROJECTS -------------------- */}
        {!resumeData.hasNoProject && (
          <Section title="PROJECTS" color={primaryColor}>
            {resumeData.projects?.length ? (
              resumeData.projects.map((proj: any) => (
                <div key={proj.id} className="mb-3">
                  <h3 className="font-semibold text-sm">{proj.title}</h3>
                  <p className="text-xs">
                    {proj.role} • {proj.projectType}
                  </p>
                  <p className="text-xs italic">{proj.technologies}</p>
                  <p className="text-xs text-justify">{proj.description}</p>
                  {proj.link && (
                    <p className="text-xs underline mt-1">{proj.link}</p>
                  )}
                </div>
              ))
            ) : (
              <Empty message="No projects added yet." />
            )}
          </Section>
        )}

        {/* -------------------- CERTIFICATIONS -------------------- */}
        <Section title="CERTIFICATIONS" color={primaryColor}>
          {resumeData.certifications?.length ? (
            resumeData.certifications.map((cert: any) => (
              <div key={cert.id} className="mb-3">
                <h3 className="font-semibold text-sm">{cert.title}</h3>
                <p className="text-xs">{cert.issuer}</p>
                <p className="text-xs">
                  {formatDate(cert.issueDate)} –{" "}
                  {formatDate(cert.expiryDate) || "No Expiry"}
                </p>
                {cert.credentialId && (
                  <p className="text-xs">Credential ID: {cert.credentialId}</p>
                )}
                {cert.credentialUrl && (
                  <p className="text-xs underline">{cert.credentialUrl}</p>
                )}
                {cert.description && (
                  <p className="text-xs text-justify mt-1">
                    {cert.description}
                  </p>
                )}
              </div>
            ))
          ) : (
            <Empty message="No certifications added yet." />
          )}
        </Section>

        {/* -------------------- SKILLS -------------------- */}
        <Section title="TECHNICAL SKILLS" color={primaryColor}>
          {resumeData.technicalSkills?.length ? (
            <p className="text-xs">
              {resumeData.technicalSkills.map((s: any) => s.name).join(", ")}
            </p>
          ) : (
            <Empty message="No technical skills added yet." />
          )}
        </Section>

        <Section title="SOFT SKILLS" color={primaryColor}>
          {resumeData.softSkills?.length ? (
            <p className="text-xs">
              {resumeData.softSkills.map((s) => s.name).join(", ")}
            </p>
          ) : (
            <Empty message="No soft skills added yet." />
          )}
        </Section>

        <Section title="LANGUAGES" color={primaryColor}>
          {resumeData.languages?.length ? (
            <p className="text-xs">
              {resumeData.languages.map((l: any) => l.name).join(", ")}
            </p>
          ) : (
            <Empty message="No languages added yet." />
          )}
        </Section>

        {/* -------------------- ADDITIONAL SECTIONS -------------------- */}
        {resumeData.additionalFields?.map((field: any, idx: any) => (
          <Section key={idx} title={field.title} color={primaryColor}>
            <p className="text-xs">{field.description}</p>
          </Section>
        ))}
      </div>
    </div>
  );
};

/* -------------------- COMPONENTS -------------------- */

const Section = ({
  title,
  color,
  children,
}: {
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="mt-4">
    <h2 className="text-sm font-semibold mb-1" style={{ color }}>
      {title}
    </h2>
    {children}
  </div>
);

const Empty = ({ message }: { message: string }) => (
  <p className="text-sm italic text-gray-500">{message}</p>
);

export default ResumeTemplateTwo;
