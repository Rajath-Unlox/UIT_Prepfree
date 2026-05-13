"use client";
import {
  Camera,
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Download,
  Plus,
  UserRound,
  X,
} from "lucide-react";
import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import RenderResume from "@/components/ResumeTemplates/renderResume";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import api from "@/lib/api";
import { useTemplates } from "@/hooks/useTemplates";

interface FormData {
  // Profile Info
  firstname: string;
  lastname: string;
  currentLocation: string;
  description: string; // summary/description in schema
  profileImageUrl?: string;
  profileImageS3Key?: string;

  // Contact Info
  email: string;
  country_code: string;
  phone_number: string;
  linkedin: string;
  github: string;
  twitter: string;
  portfolio: string;

  // Education
  education: {
    id: number;
    institution: string;
    location: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];

  // Experience
  experience: {
    id: number;
    title: string;
    company: string;
    location: string;
    jobType: string;
    startDate: string;
    endDate: string;
    description: string;
    currentlyWorkHere: boolean;
  }[];

  // Projects
  projects: {
    id: number;
    title: string;
    role: string;
    projectType: string;
    technologies: string;
    link: string;
    description: string;
  }[];

  // Certifications
  certifications: {
    id: number;
    title: string;
    issuer: string;
    issueDate: string;
    expiryDate: string;
    credentialId: string;
    credentialUrl: string;
    description: string;
  }[];

  // Skills
  technicalSkills: {
    name: string;
  }[];

  softSkills: {
    name: string;
  }[];

  // Languages
  languages: {
    name: string;
  }[];

  //additional
  additionalFields: {
    title: string;
    description: string;
  }[];

  // Optional input fields for UI
  skillInput: string;
  languageInput: string;
  softSkillInput: string;
}

const tabs = [
  { id: "about", label: "About" },
  { id: "edu", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "certification", label: "Certification" },
  { id: "project", label: "Projects" },
];

const Page = () => {
  const [activeTab, setActiveTab] = useState("about");
  const [tabName, setTabName] = useState("About");
  const { templateId } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { templates } = useTemplates();

  const [previewPopup, setPreviewPopup] = useState(false);
  const [publishPopup, setPublishPopup] = useState(false);
  const [changeTemplatepopup, setChangeTemplatePopup] = useState(false);
  const [step, setStep] = useState(1);
  const resumeRef = useRef<any>(null);
  const [baseWidth, setBaseWidth] = useState<any>(800);

  // 1. URL State Persistence (Template & Color)
  const [templateIdCurrent, setTemplateIdCurrent] = useState(templateId);
  const initialColor = Number(searchParams.get("colorIndex") || 0);
  const [colorIndex, setColorIndex] = useState(initialColor);

  // Sync state to URL when template or color changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set("colorIndex", colorIndex.toString());
    const newPath = `/dashboard/ai-resume-builder/template-selector/${templateIdCurrent}?${params.toString()}`;
    router.replace(newPath, { scroll: false } as any);
  }, [templateIdCurrent, colorIndex, router]);

  // Find the currently selected template object from the API
  const activeTemplateData = templates.find(
    (t) => t.templateId === templateIdCurrent
  );

  const source = searchParams.get("source"); // "current" or "draft"
  const draftId = searchParams.get("draftId"); // if editing a draft

  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",
    currentLocation: "",
    description: "",
    profileImageUrl: "",
    profileImageS3Key: "",
    email: "",
    country_code: "+91",
    phone_number: "",
    linkedin: "",
    github: "",
    twitter: "",
    portfolio: "",

    education: [
      {
        id: 1,
        institution: "",
        location: "",
        degree: "",
        fieldOfStudy: "",
        startDate: "",
        endDate: "",
        description: "",
      },
    ],

    experience: [
      {
        id: 1,
        title: "",
        company: "",
        location: "",
        jobType: "",
        startDate: "",
        endDate: "",
        description: "",
        currentlyWorkHere: false,
      },
    ],

    projects: [
      {
        id: 1,
        title: "",
        role: "",
        projectType: "",
        technologies: "",
        link: "",
        description: "",
      },
    ],

    certifications: [
      {
        id: 1,
        title: "",
        issuer: "",
        issueDate: "",
        expiryDate: "",
        credentialId: "",
        credentialUrl: "",
        description: "",
      },
    ],

    additionalFields: [
      {
        title: "",
        description: "",
      },
    ],

    technicalSkills: [],
    softSkills: [],
    languages: [],
    skillInput: "",
    languageInput: "",
    softSkillInput: "",
  });
  const [existingDraft, setExistingDraft] = useState(false);

  useEffect(() => {
    const fetchResumeForEditing = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        let data: any;
        let user;

        // ---- Fetch User Basic Info (/me) ----
        const userRes = await api.get("/users/me");
        user = userRes.data?.user;

        // If editing a draft
        if (draftId) {
          const res = await api.get(`/resume/drafts/${draftId}`);
          data = res.data.draft.resumeData;
          setExistingDraft(true);
        }

        // If opening published resume
        else if (source === "resume") {
          const res = await api.get("/resume/");
          data = res.data.resumeData;
        }

        if (!data && !user) return;

        // ---- MAP BACKEND DATA + user data → formData ----
        // Helper to ensure at least one item
        const ensureOne = (arr: any[], mapper: (item: any, id: number) => any, defaultObj: any) => {
          if (arr && arr.length > 0) {
            return arr.map((item, i) => mapper(item, i + 1));
          }
          return [{ id: 1, ...defaultObj }];
        };

        // ---- MAP BACKEND DATA + user data → formData ----
        setFormData((prev) => ({
          ...prev,

          // PRIORITY: If resume has data → use it, else fallback to /me info
          firstname: data?.firstname || user?.firstname || "",
          lastname: data?.lastname || user?.lastname || "",
          currentLocation:
            data?.profileInfo?.currentLocation ||
            user?.profileInfo?.currentLocation ||
            "",

          description:
            data?.profileInfo?.description || user?.profileInfo?.summary || "",

          profileImageUrl:
            data?.profileImageUrl ||
            data?.profileInfo?.profileImageUrl ||
            user?.profileInfo?.profileImageUrl ||
            "",

          profileImageS3Key:
            data?.profileInfo?.profileImageS3Key ||
            user?.profileInfo?.profileImageS3Key ||
            "",

          email: data?.email || user?.email || "",
          country_code: data?.country_code || user?.country_code || "+91",
          phone_number: data?.phone_number || user?.phone_number || "",

          linkedin: data?.linkedin || user?.socialInfo?.linkedin || "",
          github: data?.github || user?.socialInfo?.github || "",
          twitter: data?.twitter || user?.socialInfo?.twitter || "",

          portfolio: data?.portfolio || user?.socialInfo?.portfolio || "",

          // --- Arrays remain fallback ---
          education: ensureOne(
            data?.education || user?.education || [],
            (e, id) => ({
              id,
              institution: e.institution || "",
              location: e.location || e.currentLocation || "",
              degree: e.degree || "",
              fieldOfStudy: e.fieldOfStudy || "",
              startDate: e.startDate || "",
              endDate: e.endDate || "",
              description: e.description || "",
            }),
            { institution: "", location: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" }
          ),

          experience: ensureOne(
            data?.experience || user?.experience || [],
            (ex, id) => ({
              id,
              title: ex.title || "",
              company: ex.company || "",
              location: ex.location || ex.currentLocation || "",
              jobType: ex.jobType || "",
              startDate: ex.startDate || "",
              endDate: ex.endDate || "",
              description: ex.description || "",
              currentlyWorkHere: ex.currentlyWorkHere || false,
            }),
            { title: "", company: "", location: "", jobType: "", startDate: "", endDate: "", description: "", currentlyWorkHere: false }
          ),

          projects: ensureOne(
            data?.projects || user?.projects || [],
            (p, id) => ({
              id,
              title: p.title || "",
              role: p.role || "",
              projectType: p.projectType || "",
              technologies: Array.isArray(p.technologies)
                ? p.technologies.join(", ")
                : p.technologies || "",
              link: p.link || "",
              description: p.description || "",
            }),
            { title: "", role: "", projectType: "", technologies: "", link: "", description: "" }
          ),

          certifications: ensureOne(
            data?.certifications || user?.certifications || [],
            (c, id) => ({
              id,
              title: c.title || c.name || "",
              issuer: c.issuer || c.organization || "",
              issueDate: c.startDate || c.issueDate || "",
              expiryDate: c.endDate || c.expiryDate || "",
              credentialId: c.credentialId || "",
              credentialUrl: c.credentialUrl || "",
              description: c.description || "",
            }),
            { title: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "", description: "" }
          ),

          additionalFields:
            data?.additionalFields?.map((a: any) => ({
              title: a.title || "",
              description: a.description || "",
            })) || [],

          technicalSkills: (data?.technicalSkills || user?.skills || []).map(
            (t: any) => ({
              name: t.name || "",
            })
          ),

          softSkills:
            data?.softSkills?.map((s: any) => ({ name: s.name || "" })) || [],

          languages: (data?.languages || user?.languages || []).map(
            (l: any) => ({
              name: l.name || "",
            })
          ),

          skillInput: "",
          languageInput: "",
          softSkillInput: "",
        }));

        // ---- Sync Image State for Preview ----
        const finalImageUrl = data?.profileImageUrl || data?.profileInfo?.profileImageUrl || user?.profileInfo?.profileImageUrl || "";
        setImage(finalImageUrl);

      } catch (error) {
        console.error("Error loading resume or user info:", error);
      }
    };

    fetchResumeForEditing();
  }, [draftId, source]);

  // 2. LocalStorage Persistence for formData (unsaved edits)
  useEffect(() => {
    const saved = localStorage.getItem("resume_local_draft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Only merge if the data seems valid for this user/draft context
        // (Simplified for now: always restore if present)
        setFormData((prev) => ({ ...prev, ...parsed }));
      } catch (e) {
        console.error("Failed to restore local draft", e);
      }
    }
  }, []);

  useEffect(() => {
    // Save to local storage on every change (debounced implicitly by React cycle)
    const timeout = setTimeout(() => {
      localStorage.setItem("resume_local_draft", JSON.stringify(formData));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData]);

  const isoToDate = (iso: any) => {
    if (!iso) return "";
    return iso.split("T")[0]; // "2025-12-10"
  };

  const dateToIso = (dateStr: any) => {
    if (!dateStr) return "";
    return new Date(dateStr).toISOString(); // convert back to ISO
  };

  const [image, setImage] = useState<string | null>(null);

  // Safety enforcer: Ensure key sections always have at least one entry
  useEffect(() => {
    setFormData((prev) => {
      let changed = false;
      const newState = { ...prev };

      const sections = [
        { key: "education", default: { institution: "", location: "", degree: "", fieldOfStudy: "", startDate: "", endDate: "", description: "" } },
        { key: "experience", default: { title: "", company: "", location: "", jobType: "", startDate: "", endDate: "", description: "", currentlyWorkHere: false } },
        { key: "projects", default: { title: "", role: "", projectType: "", technologies: "", link: "", description: "" } },
        { key: "certifications", default: { title: "", issuer: "", issueDate: "", expiryDate: "", credentialId: "", credentialUrl: "", description: "" } },
      ];

      sections.forEach((s) => {
        if (!prev[s.key as keyof FormData] || (prev[s.key as keyof FormData] as any[]).length === 0) {
          (newState as any)[s.key] = [{ id: Date.now(), ...s.default }];
          changed = true;
        }
      });

      return changed ? newState : prev;
    });
  }, [formData.education?.length, formData.experience?.length, formData.projects?.length, formData.certifications?.length]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const uploadToast = toast.loading("Uploading image...");
      try {
        const formDataUpload = new FormData();
        formDataUpload.append("resumeImage", file);

        const res = await api.post("/resume/image-upload", formDataUpload, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        const newUrl = res.data.imageUrl;
        const newKey = res.data.imageKey;
        if (newUrl) {
          setFormData((prev) => ({
            ...prev,
            profileImageUrl: newUrl,
            profileImageS3Key: newKey,
          }));
          setImage(newUrl);
          toast.success("Image uploaded successfully", { id: uploadToast });
        } else {
          throw new Error("Invalid response from server");
        }
      } catch (error) {
        console.error("Image upload failed:", error);
        toast.error("Failed to upload image", { id: uploadToast });
      }
    }
  };

  const handlePublish = () => {
    setPublishPopup(true);
  };

  const handlePreview = () => {
    setPreviewPopup(true);
  };

  const handleChangeTemplate = () => {
    setChangeTemplatePopup(true);
  };

  // Handle next and back
  const goToNextStep = () => {
    if (step < tabs.length) {
      const nextStep = step + 1;
      setStep(nextStep);
      setActiveTab(tabs[nextStep - 1].id);
      setTabName(tabs[nextStep - 1].label);
    }
  };

  const goToPreviousStep = () => {
    if (step > 1) {
      const prevStep = step - 1;
      setStep(prevStep);
      setActiveTab(tabs[prevStep - 1].id);
      setTabName(tabs[prevStep - 1].label);
    }
  };

  const upadteBaseWidth = () => {
    if (resumeRef.current) {
      setBaseWidth(resumeRef?.current?.offsetWidth);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // ✅ Add Skill or Language
  const addSkill = (
    type: "technical" | "language" | "soft",
    value?: string
  ) => {
    setFormData((prev) => {
      if (type === "technical") {
        const skillName = value || prev.skillInput.trim();
        if (!skillName) return prev;
        if (prev.technicalSkills.some((s) => s.name === skillName)) return prev;
        return {
          ...prev,
          technicalSkills: [
            ...prev.technicalSkills,
            { id: prev.technicalSkills.length + 1, name: skillName },
          ],
          skillInput: "",
        };
      }

      if (type === "soft") {
        const skillName = value || prev.softSkillInput.trim();
        if (!skillName) return prev;
        if (prev.softSkills.some((s) => s.name === skillName)) return prev;
        return {
          ...prev,
          softSkills: [
            ...prev.softSkills,
            { id: prev.softSkills.length + 1, name: skillName },
          ],
          softSkillInput: "",
        };
      }

      if (type === "language") {
        const langName = value || prev.languageInput.trim();
        if (!langName) return prev;
        if (prev.languages.some((l) => l.name === langName)) return prev;
        return {
          ...prev,
          languages: [
            ...prev.languages,
            { id: prev.languages.length + 1, name: langName },
          ],
          languageInput: "",
        };
      }

      return prev;
    });
  };

  const removeSkill = (
    type: "technical" | "language" | "soft",
    name: string
  ) => {
    setFormData((prev) => {
      if (type === "technical") {
        return {
          ...prev,
          technicalSkills: prev.technicalSkills.filter((s) => s.name !== name),
        };
      }
      if (type === "soft") {
        return {
          ...prev,
          softSkills: prev.softSkills.filter((s) => s.name !== name),
        };
      }
      if (type === "language") {
        return {
          ...prev,
          languages: prev.languages.filter((l) => l.name !== name),
        };
      }
      return prev;
    });
  };

  const handleArrayChange = (
    section: keyof FormData,
    id: number,
    field: string,
    value: string | number
  ) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: prev[section].map((item: any) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const addItem = (section: keyof FormData, newItem: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: [...prev[section], { id: Date.now(), ...newItem }],
    }));
  };

  const removeItem = (section: keyof FormData, id: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: prev[section].filter((item: any) => item.id !== id),
    }));
  };

  // Handles updates for specific experience item
  const handleExperienceChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev: any) => {
      const updated = [...prev.experience];
      const current = { ...updated[index] };

      // Special case for checkbox
      if (
        e.target instanceof HTMLInputElement &&
        e.target.type === "checkbox"
      ) {
        current[name] = e.target.checked;

        // If checked, clear endDate
        if (e.target.checked) {
          current.endDate = "";
        }
      } else {
        current[name] = value;
      }

      updated[index] = current;
      return { ...prev, experience: updated };
    });
  };

  // Add new experience block
  const addExperience = () => {
    setFormData((prev) => ({
      ...prev,
      experience: [
        ...prev.experience,
        {
          id: prev.experience.length + 1,
          title: "",
          company: "",
          location: "",
          jobType: "",
          startDate: "",
          endDate: "",
          description: "",
          currentlyWorkHere: false,
        },
      ],
    }));
  };

  const removeExperience = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      experience: prev.experience.filter((exp) => exp.id !== id),
    }));
  };

  const handleCertificationChange = (
    index: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => {
      const updated = [...prev.certifications];
      updated[index] = { ...updated[index], [name]: value };
      return { ...prev, certifications: updated };
    });
  };

  const addCertification = () => {
    setFormData((prev: any) => ({
      ...prev,
      certifications: [
        ...prev.certifications,
        {
          id: Date.now(),
          title: "",
          issuer: "",
          issueDate: "",
          expiryDate: "",
          credentialId: "",
          credentialUrl: "",
          description: "",
        },
      ],
    }));
  };

  const removeCertification = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      certifications: prev.certifications.filter((cert) => cert.id !== id),
    }));
  };

  const handleProjectChange = (
    id: number,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.map((proj) =>
        proj.id === id
          ? {
            ...proj,
            [name]: value,
          }
          : proj
      ),
    }));
  };

  const handleAddProject = () => {
    setFormData((prev) => ({
      ...prev,
      projects: [
        ...prev.projects,
        {
          id: Date.now(),
          title: "",
          role: "",
          projectType: "",
          technologies: "",
          link: "",
          description: "",
        },
      ],
    }));
  };

  const handleRemoveProject = (id: number) => {
    setFormData((prev) => ({
      ...prev,
      projects: prev.projects.filter((proj) => proj.id !== id),
    }));
  };

  useEffect(() => {
    upadteBaseWidth();
    window.addEventListener("resize", upadteBaseWidth);

    return window.removeEventListener("resize", upadteBaseWidth);
  }, []);

  const resumeData = {
    firstname: formData.firstname || "",
    lastname: formData.lastname || "",
    profileImageUrl: formData.profileImageUrl || image || "", // ROOT level

    profileInfo: {
      firstname: formData.firstname || "",
      lastname: formData.lastname || "",
      description: formData.description || "",
      profileImageUrl: formData.profileImageUrl || image || "", // profileInfo level
      profileImageS3Key: formData.profileImageS3Key || "",
      currentLocation: formData.currentLocation || "",
    },

    contactInfo: {
      email: formData.email || "",
      country_code: formData.country_code || "+91",
      phone_number: formData.phone_number || "",
      linkedin: formData.linkedin || "",
      github: formData.github || "",
      twitter: formData.twitter || "",
      portfolio: formData.portfolio || "",
    },

    // Flags
    hasNoEducation: formData.education.length === 0,
    hasNoExperience: formData.experience.length === 0,
    hasNoProject: formData.projects.length === 0,

    // Data Arrays
    education: formData.education || [],
    experience: formData.experience || [],
    projects: formData.projects || [],
    certifications: formData.certifications || [],
    technicalSkills: formData.technicalSkills || [],
    softSkills: formData.softSkills || [],
    languages: formData.languages || [],
    additionalFields: formData.additionalFields || [],
  };

  return (
    <main className="w-full flex h-[100%] overflow-hidden">
      {publishPopup && (
        <PublishPopup
          setPublishPopup={setPublishPopup}
          resumeData={resumeData}
          templateId={templateIdCurrent}
          templateData={activeTemplateData}
          colorIndex={colorIndex}
          existingDraft={existingDraft}
          draftId={draftId}
        />
      )}
      {previewPopup && (
        <PreviewPopup
          setPreviewPopup={setPreviewPopup}
          resumeData={resumeData}
          templateId={templateIdCurrent}
          templateData={activeTemplateData}
          colorIndex={colorIndex}
        />
      )}
      {changeTemplatepopup && (
        <ChangeTemlatePopuop
          setChangeTemplatePopup={setChangeTemplatePopup}
          resumeData={resumeData}
          templateId={templateIdCurrent}
          templateData={activeTemplateData}
          setTemplateIdCurrent={setTemplateIdCurrent}
          colorIndex={colorIndex}
          setColorIndex={setColorIndex}
          templates={templates}
        />
      )}
      {/* Header Buttons */}
      <div className="w-full flex flex-col justify-between overflow-y-auto">
        <section className="w-full flex items-center gap-4 relative">
          <div className="flex rounded-md overflow-hidden border-2 border-[#cfe3e0]/20">
            {tabs.map((tab, idx) => {
              const stepIndex = idx + 1;

              // disable only if this step is beyond the highest unlocked step
              const isDisabled = stepIndex > step;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (!isDisabled) {
                      setActiveTab(tab.id);
                      setTabName(tab.label);
                      setStep((prevStep) => Math.max(prevStep, stepIndex));
                    }
                  }}
                  disabled={isDisabled}
                  className={`
            w-fit px-6 py-3 cursor-pointer transition-colors duration-200
            ${activeTab === tab.id
                      ? "bg-[#FFDC85] font-semibold"
                      : "bg-white text-gray-700"
                    }
            ${idx !== tabs.length - 1 ? "border-r-2 border-[#cfe3e0]/20" : ""}
            hover:bg-[#FFDC85]/50
            ${isDisabled ? "opacity-50 cursor-not-allowed hover:bg-white" : ""}
          `}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
          <Plus
            size={28}
            onClick={() => {
              setTabName("+");
            }}
          />
        </section>

        {/* Forms */}
        {/* About form */}
        {tabName === "About" && (
          <div className="w-full h-full mt-4 px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e]">
              What’s the best way for employers to contact you?
            </h1>
            <p className="text-sm text-[#1e1e1e]/80">
              We suggest including an email and phone number.
            </p>
            <div className="w-full flex items-center gap-2 mt-6">
              <label htmlFor="profile" className="relative cursor-pointer">
                <div className="w-24 h-24 rounded-full bg-[#EAEEEB] flex items-center justify-center overflow-hidden">
                  {(formData.profileImageUrl || image) ? (
                    <img
                      src={formData.profileImageUrl || image || ""}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <UserRound
                      className="w-2/3 h-auto text-white"
                      fill="white"
                      strokeWidth={0}
                    />
                  )}
                </div>

                {/* Camera Badge */}
                <div className="absolute bottom-0 right-0 w-7 h-7 p-1 bg-white text-[#f2825c] rounded-full flex items-center justify-center border border-gray-200">
                  <Camera className="w-4 h-4" />
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="profile"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </label>
              <h1 className="text-[#f2825c] font-medium text-sm">
                Upload Profile Photo
              </h1>
            </div>

            <div className="flex items-center gap-4 mt-2">
              {/* Firstname */}
              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="firstname">First Name*</label>
                <input
                  type="text"
                  id="firstname"
                  name="firstname"
                  value={formData.firstname}
                  onChange={handleChange}
                  placeholder="First Name"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>

              {/* Lastname */}
              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="lastname">Last Name*</label>
                <input
                  type="text"
                  id="lastname"
                  name="lastname"
                  value={formData.lastname}
                  onChange={handleChange}
                  placeholder="Last Name"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="phone">Phone*</label>
                <input
                  type="text"
                  id="phone"
                  name="phone_number"
                  value={formData.phone_number}
                  onChange={handleChange}
                  placeholder="Phone Number"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>

              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="email">Email*</label>
                <input
                  type="text"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Email"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>
            </div>

            {/* GitHub & Twitter */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="github">GitHub</label>
                <input
                  type="text"
                  id="github"
                  name="github"
                  value={formData.github}
                  onChange={handleChange}
                  placeholder="GitHub Profile URL"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>

              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="twitter">Twitter</label>
                <input
                  type="text"
                  id="twitter"
                  name="twitter"
                  value={formData.twitter}
                  onChange={handleChange}
                  placeholder="Twitter / X Profile URL"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>
            </div>

            {/* LinkedIn & Website */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="linkedin">LinkedIn</label>
                <input
                  type="text"
                  id="linkedin"
                  name="linkedin"
                  value={formData.linkedin}
                  onChange={handleChange}
                  placeholder="LinkedIn Profile URL"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>

              <div className="flex flex-col gap-1 items-start w-1/2">
                <label htmlFor="website">Portfolio</label>
                <input
                  type="text"
                  id="website"
                  name="portfolio"
                  value={formData.portfolio}
                  onChange={handleChange}
                  placeholder="Portfolio / Website URL"
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
              </div>
            </div>

            {/* Summary */}
            <div className="flex flex-col gap-1 items-start w-full mt-2">
              <label htmlFor="summary">Description</label>
              <textarea
                id="summary"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Briefly describe yourself"
                className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
              />
            </div>
          </div>
        )}

        {/* education form */}
        {tabName === "Education" && (
          <div className="w-full h-full mt-4 overflow-y-auto px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e] mb-4">
              Add Education
            </h1>

            {formData.education.map((edu) => (
              <div key={edu.id} className="mb-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-md font-semibold text-[#1e1e1e]">
                    {edu.degree || "Add Primary Education"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => removeItem("education", edu.id)}
                    className="text-red-600 text-sm hover:underline"
                  >
                    Remove
                  </button>
                </div>

                {/* Institution & Location */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label>Institution*</label>
                    <input
                      type="text"
                      value={edu.institution}
                      onChange={(e) =>
                        handleArrayChange(
                          "education",
                          edu.id,
                          "institution",
                          e.target.value
                        )
                      }
                      placeholder="School / College Name"
                      className="w-full px-3 py-3 rounded-md border border-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label>Location*</label>
                    <input
                      type="text"
                      value={edu.location}
                      onChange={(e) =>
                        handleArrayChange(
                          "education",
                          edu.id,
                          "location",
                          e.target.value
                        )
                      }
                      placeholder="City, Country"
                      className="w-full px-3 py-3 rounded-md border border-gray-300"
                    />
                  </div>
                </div>

                {/* Degree & Description */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label>Degree*</label>
                    <input
                      type="text"
                      value={edu.degree}
                      onChange={(e) =>
                        handleArrayChange(
                          "education",
                          edu.id,
                          "degree",
                          e.target.value
                        )
                      }
                      placeholder="e.g., B.Sc, XII, Diploma"
                      className="w-full px-3 py-3 rounded-md border border-gray-300"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label>Field of Study</label>
                    <input
                      type="text"
                      value={edu.fieldOfStudy}
                      onChange={(e) =>
                        handleArrayChange(
                          "education",
                          edu.id,
                          "fieldOfStudy",
                          e.target.value
                        )
                      }
                      placeholder="Field of Study"
                      className="w-full px-3 py-3 rounded-md border border-gray-300"
                    />
                  </div>
                </div>

                {/* Start and End Dates */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-full">
                    <label>Start & End Date</label>
                    <div className="flex gap-2 w-full">
                      <input
                        type="date"
                        value={isoToDate(edu.startDate)}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            edu.id,
                            "startDate",
                            dateToIso(e.target.value) // convert back to ISO
                          )
                        }
                        className="w-full px-3 py-3 rounded-md border border-gray-300"
                      />
                      <input
                        type="date"
                        value={isoToDate(edu.endDate)}
                        onChange={(e) =>
                          handleArrayChange(
                            "education",
                            edu.id,
                            "endDate",
                            dateToIso(e.target.value)
                          )
                        }
                        className="w-full px-3 py-3 rounded-md border border-gray-300"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Add Education Buttons */}
            <div className="flex flex-col gap-2 mt-6">
              {!formData.education.some(
                (edu) => edu.degree === "Secondary (X)"
              ) && (
                  <button
                    type="button"
                    onClick={() =>
                      addItem("education", {
                        degree: "Secondary (X)",
                        institution: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      })
                    }
                    className="text-[#f2825c] font-medium text-sm text-left"
                  >
                    + Add Secondary (X)
                  </button>
                )}

              {!formData.education.some(
                (edu) => edu.degree === "Senior Secondary (XII)"
              ) && (
                  <button
                    type="button"
                    onClick={() =>
                      addItem("education", {
                        degree: "Senior Secondary (XII)",
                        institution: "",
                        location: "",
                        startDate: "",
                        endDate: "",
                        description: "",
                      })
                    }
                    className="text-[#f2825c] font-medium text-sm text-left"
                  >
                    + Add Senior Secondary (XII)
                  </button>
                )}



              <button
                type="button"
                onClick={() =>
                  addItem("education", {
                    degree: "",
                    institution: "",
                    location: "",
                    fieldOfStudy: "",
                    startDate: "",
                    endDate: "",
                    description: "",
                  })
                }
                className="text-[#006666] font-medium text-sm text-left"
              >
                + Add Degree
              </button>
            </div>
          </div>
        )}

        {/*skills form */}
        {tabName === "Skills" && (
          <div className="px-5 h-auto">
            <h1 className="text-lg font-medium text-[#1e1e1e] mt-4">
              Add Skills
            </h1>

            {/* Technical Skills */}
            <div className="flex flex-col gap-1 items-start w-full mt-4">
              <label>Technical Skills*</label>
              <div className="flex gap-4 w-full items-center">
                <input
                  type="text"
                  name="skillInput"
                  value={formData.skillInput}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Python..."
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
                <button
                  type="button"
                  onClick={() => addSkill("technical")}
                  className="w-fit rounded-md py-2 px-10 text-white bg-[#f2825c]"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 flex-wrap py-2">
                {formData.technicalSkills
                  .filter((s) => s.name)
                  .map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/80"
                    >
                      {skill.name}
                      <button
                        onClick={() => removeSkill("technical", skill.name)}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>

              <h1 className="text-[#17383d]/60 text-sm mt-2">Suggested Skills</h1>
              <div className="flex gap-2 flex-wrap py-2">
                {["JavaScript", "React", "Python", "Node.js", "SQL"].map(
                  (skill) => (
                    <div
                      key={skill}
                      onClick={() => addSkill("technical", skill)}
                      className="px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/71 cursor-pointer hover:bg-[#fff0ea]/80"
                    >
                      {skill}
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="flex flex-col gap-1 items-start w-full mt-4">
              <label>Soft Skills*</label>
              <div className="flex gap-4 w-full items-center">
                <input
                  type="text"
                  name="softSkillInput"
                  value={formData.softSkillInput}
                  onChange={handleChange}
                  placeholder="e.g. JavaScript, React, Python..."
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
                <button
                  type="button"
                  onClick={() => addSkill("soft")}
                  className="w-fit rounded-md py-2 px-10 text-white bg-[#f2825c]"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 flex-wrap py-2">
                {formData.softSkills
                  .filter((s) => s.name)
                  .map((skill, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/80"
                    >
                      {skill.name}
                      <button
                        onClick={() => removeSkill("soft", skill.name)}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>

              <h1 className="text-[#17383d]/60 text-sm mt-2">Suggested Skills</h1>
              <div className="flex gap-2 flex-wrap py-2">
                {["Communication", "Teamwork", "Leadership"].map((skill) => (
                  <div
                    key={skill}
                    onClick={() => addSkill("soft", skill)}
                    className="px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/71 cursor-pointer hover:bg-[#f7fbfa]"
                  >
                    {skill}
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div className="flex flex-col gap-1 items-start w-full mt-6">
              <label>Languages*</label>
              <div className="flex gap-4 w-full items-center">
                <input
                  type="text"
                  name="languageInput"
                  value={formData.languageInput}
                  onChange={handleChange}
                  placeholder="e.g. English, Hindi, Spanish..."
                  className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                />
                <button
                  type="button"
                  onClick={() => addSkill("language")}
                  className="w-fit rounded-md py-2 px-10 text-white bg-[#f2825c]"
                >
                  Add
                </button>
              </div>

              <div className="flex gap-2 flex-wrap py-2">
                {formData.languages
                  .filter((l) => l.name)
                  .map((lang, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/80"
                    >
                      {lang.name}
                      <button
                        onClick={() => removeSkill("language", lang.name)}
                        className="text-red-500 font-bold"
                      >
                        ×
                      </button>
                    </div>
                  ))}
              </div>

              <h1 className="text-[#17383d]/60 text-sm mt-2">
                Suggested Languages
              </h1>
              <div className="flex gap-2 flex-wrap py-2">
                {["English", "Hindi", "French", "Spanish", "German"].map(
                  (lang) => (
                    <div
                      key={lang}
                      onClick={() => addSkill("language", lang)}
                      className="px-4 py-2 bg-[#fff0ea] rounded-full text-[#17383d]/71 cursor-pointer hover:bg-[#fff0ea]/80"
                    >
                      {lang}
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* experinece form */}
        {tabName === "Experience" && (
          <div className="w-full h-auto mt-4 px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e]">Experience</h1>

            {formData.experience.map((exp, index) => (
              <div
                key={exp.id}
                className="border-b border-gray-200 pb-4 mb-4 relative"
              >
                {formData.experience.length > 1 && (
                  <button
                    onClick={() => removeExperience(exp.id)}
                    className="absolute top-0 right-0 text-red-500 font-semibold"
                  >
                    ✕
                  </button>
                )}

                {/* Job Title + Company */}
                <div className="flex items-center gap-4 mt-4">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`title-${index}`}>Job Title *</label>
                    <input
                      type="text"
                      id={`title-${index}`}
                      name="title"
                      value={exp.title}
                      onChange={(e) => handleExperienceChange(index, e)}
                      placeholder="e.g. Frontend Developer"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`company-${index}`}>Company Name</label>
                    <input
                      type="text"
                      id={`company-${index}`}
                      name="company"
                      value={exp.company}
                      onChange={(e) => handleExperienceChange(index, e)}
                      placeholder="Company Name"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                {/* Job Type + Location */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`jobType-${index}`}>Job Type</label>
                    <input
                      type="text"
                      id={`jobType-${index}`}
                      name="jobType"
                      value={exp.jobType}
                      onChange={(e) => handleExperienceChange(index, e)}
                      placeholder="e.g. Full-time, Internship, Remote"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`location-${index}`}>Location</label>
                    <input
                      type="text"
                      id={`location-${index}`}
                      name="location"
                      value={exp.location}
                      onChange={(e) => handleExperienceChange(index, e)}
                      placeholder="Location"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1 items-start w-full mt-2">
                  <label htmlFor={`description-${index}`}>Description</label>
                  <textarea
                    id={`description-${index}`}
                    name="description"
                    value={exp.description}
                    onChange={(e) => handleExperienceChange(index, e)}
                    placeholder="Brief description or responsibilities..."
                    className="w-full px-2 py-2 rounded-md border border-[#cfe3e0]/20 h-[80px]"
                  />
                </div>

                {/* Dates */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`startDate-${index}`}>Start Date</label>
                    <input
                      type="date"
                      id={`startDate-${index}`}
                      name="startDate"
                      value={isoToDate(exp.startDate)}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`endDate-${index}`}>End Date</label>
                    <input
                      type="date"
                      id={`endDate-${index}`}
                      name="endDate"
                      value={isoToDate(exp.endDate)}
                      disabled={exp.currentlyWorkHere}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20 disabled:bg-gray-100"
                    />
                  </div>
                </div>

                {/* Checkbox */}
                <div className="w-full flex items-center justify-end mt-2">
                  <div className="w-fit flex items-center">
                    <input
                      type="checkbox"
                      id={`currentlyWorkHere-${index}`}
                      name="currentlyWorkHere"
                      checked={exp.currentlyWorkHere}
                      onChange={(e) => handleExperienceChange(index, e)}
                      className="mr-1 w-5 h-5 cursor-pointer"
                    />
                    <label htmlFor={`currentlyWorkHere-${index}`}>
                      I currently work here
                    </label>
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addExperience}
              className="text-[#f2825c] hover:underline cursor-pointer"
            >
              + Add Additional Experience
            </button>
          </div>
        )}

        {/* certification form */}
        {tabName === "Certification" && (
          <div className="w-full h-auto mt-4 px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e]">
              Add Certification
            </h1>

            {formData.certifications.map((cert, index) => (
              <div
                key={cert.id || index}
                className="border-b border-[#cfe3e0]/10 pb-4 mb-4 relative"
              >
                {formData.certifications.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeCertification(cert.id)}
                    className="absolute top-0 right-0 text-red-500 font-semibold"
                  >
                    ✕
                  </button>
                )}

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`cert-name-${index}`}>
                      Certification Name*
                    </label>
                    <input
                      type="text"
                      id={`cert-name-${index}`}
                      name="title"
                      value={cert.title}
                      onChange={(e) => handleCertificationChange(index, e)}
                      placeholder="e.g., Google UX Design Certificate"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`cert-org-${index}`}>
                      Issuing Organization*
                    </label>
                    <input
                      type="text"
                      id={`cert-org-${index}`}
                      name="issuer"
                      value={cert.issuer}
                      onChange={(e) => handleCertificationChange(index, e)}
                      placeholder="e.g., Coursera, Microsoft, IIT Bombay"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`issueDate-${index}`}>Issue Date*</label>
                    <input
                      type="date"
                      id={`issueDate-${index}`}
                      name="issueDate"
                      value={isoToDate(cert.issueDate)}
                      onChange={(e) => handleCertificationChange(index, e)}
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`expiryDate-${index}`}>
                      Expiry Date (optional)
                    </label>
                    <input
                      type="date"
                      id={`expiryDate-${index}`}
                      name="expiryDate"
                      value={isoToDate(cert.expiryDate)}
                      onChange={(e) => handleCertificationChange(index, e)}
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`credentialId-${index}`}>
                      Certification ID (Optional)
                    </label>
                    <input
                      type="text"
                      id={`credentialId-${index}`}
                      name="credentialId"
                      value={cert.credentialId}
                      onChange={(e) => handleCertificationChange(index, e)}
                      placeholder="Certification ID"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`credentialUrl-${index}`}>
                      Certification URL / Certificate Link
                    </label>
                    <input
                      type="text"
                      id={`credentialUrl-${index}`}
                      name="credentialUrl"
                      value={cert.credentialUrl}
                      onChange={(e) => handleCertificationChange(index, e)}
                      placeholder="Certification URL"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1 items-start w-full mt-2">
                  <label htmlFor={`cert-desc-${index}`}>
                    Description / Skills Covered
                  </label>
                  <textarea
                    id={`cert-desc-${index}`}
                    name="description"
                    value={cert.description}
                    onChange={(e) => handleCertificationChange(index, e)}
                    placeholder="Briefly describe the certification or skills covered"
                    className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20 h-[80px]"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={addCertification}
              className="text-[#f2825c] font-medium mt-2 hover:underline cursor-pointer"
            >
              + Add Additional Certificate
            </button>
          </div>
        )}

        {/* certification form */}
        {tabName === "Projects" && (
          <div className="w-full h-auto mt-4 px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e]">Add Projects</h1>

            {formData.projects.map((project, index) => (
              <div
                key={project.id || index}
                className="relative border-b border-gray-200 pb-4 mb-4 mt-3"
              >
                {/* Remove button */}
                {formData.projects.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProject(project.id)}
                    className="absolute top-0 right-0 text-red-500 font-semibold"
                  >
                    ✕
                  </button>
                )}

                {/* Project Title and Role */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`projtitle-${index}`}>Project Title*</label>
                    <input
                      type="text"
                      id={`projtitle-${index}`}
                      name="title"
                      value={project.title}
                      onChange={(e) => handleProjectChange(project.id, e)}
                      placeholder="e.g., Chat App"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`projrole-${index}`}>Role / Position</label>
                    <input
                      type="text"
                      id={`projrole-${index}`}
                      name="role"
                      value={project.role}
                      onChange={(e) => handleProjectChange(project.id, e)}
                      placeholder="e.g., Full Stack Developer"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                {/* Type and Tools */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`projtype-${index}`}>Project Type</label>
                    <input
                      type="text"
                      id={`projtype-${index}`}
                      name="projectType"
                      value={project.projectType}
                      onChange={(e) => handleProjectChange(project.id, e)}
                      placeholder="e.g., Web App, Personal Project, Internship Project"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>

                  <div className="flex flex-col gap-1 items-start w-1/2">
                    <label htmlFor={`projtools-${index}`}>
                      Tools / Technologies Used
                    </label>
                    <input
                      type="text"
                      id={`projtools-${index}`}
                      name="technologies"
                      value={project.technologies}
                      onChange={(e) => handleProjectChange(project.id, e)}
                      placeholder="e.g., React, Node.js, MongoDB"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                {/* Project Link */}
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex flex-col gap-1 items-start w-full">
                    <label htmlFor={`projlink-${index}`}>
                      Project Link / Portfolio URL / GitHub Link
                    </label>
                    <input
                      type="text"
                      id={`projlink-${index}`}
                      name="link"
                      value={project.link}
                      onChange={(e) => handleProjectChange(project.id, e)}
                      placeholder="https://github.com/username/project"
                      className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="flex flex-col gap-1 items-start w-full mt-2">
                  <label htmlFor={`projdesc-${index}`}>
                    Description / Skills Covered
                  </label>
                  <textarea
                    id={`projdesc-${index}`}
                    name="description"
                    value={project.description}
                    onChange={(e) => handleProjectChange(project.id, e)}
                    placeholder="Briefly describe the project or your contribution..."
                    className="w-full px-2 py-4 rounded-md border border-[#cfe3e0]/20 h-[80px]"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={handleAddProject}
              className="text-[#f2825c] font-medium mt-3 hover:underline cursor-pointer"
            >
              + Add Additional Project
            </button>
          </div>
        )}

        {tabName === "+" && (
          <div className="w-full h-full mt-4 px-4">
            <h1 className="text-lg font-medium text-[#1e1e1e]">
              Additional Section
            </h1>

            {formData.additionalFields.map((field, index) => (
              <div
                key={index}
                className="border border-[#cfe3e0]/20 rounded-md p-3 mt-3 w-full"
              >
                <div className="flex flex-col gap-1 items-start w-full">
                  <label htmlFor={`addtitle-${index}`}>Title</label>
                  <input
                    type="text"
                    id={`addtitle-${index}`}
                    placeholder="Title"
                    value={field.title}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updated = [...prev.additionalFields];
                        updated[index].title = e.target.value;
                        return { ...prev, additionalFields: updated };
                      })
                    }
                    className="w-full px-2 py-3 rounded-md border border-[#cfe3e0]/20"
                  />
                </div>

                <div className="flex flex-col gap-1 items-start w-full mt-2">
                  <label htmlFor={`adddescription-${index}`}>Description</label>
                  <textarea
                    id={`adddescription-${index}`}
                    placeholder="Description"
                    value={field.description}
                    onChange={(e) =>
                      setFormData((prev) => {
                        const updated = [...prev.additionalFields];
                        updated[index].description = e.target.value;
                        return { ...prev, additionalFields: updated };
                      })
                    }
                    className="w-full px-2 py-3 rounded-md border border-[#cfe3e0]/20"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  additionalFields: [
                    ...prev.additionalFields,
                    { title: "", description: "" },
                  ],
                }))
              }
              className="text-[#f2825c] font-medium mt-3 hover:underline cursor-pointer"
            >
              + Add More
            </button>
          </div>
        )}

        <div className="w-full flex items-center justify-between px-4 py-4 mt-6">
          <button
            onClick={goToPreviousStep}
            disabled={step === 1}
            className={`px-8 py-2 rounded-md ${step === 1
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-[#E2E5E4] hover:bg-[#D6D9D8]"
              }`}
          >
            Back
          </button>
          <div className="flex gap-2">
            <button
              onClick={handlePreview}
              className="px-8 py-2 border-2 border-[#f2825c] rounded-md text-[#f2825c]"
            >
              Preview
            </button>
            <button
              onClick={step !== tabs.length ? goToNextStep : handlePublish}
              disabled={step === tabs.length + 1}
              className={`px-8 py-2 border-2 rounded-md ${step === tabs.length + 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed border-gray-300"
                : "bg-[#f2825c] border-[#f2825c] text-white"
                }`}
            >
              {step === tabs.length ? "Finish" : "Next"}
            </button>
          </div>
        </div>
      </div>
      <div
        ref={resumeRef}
        className="w-[363px] bg-[#c9c9c9]/25 rounded-t-xl relative overflow-hidden flex flex-col items-center"
      >
        <div className="w-full flex flex-col items-center px-4 gap-4 h-full">
          <h1 className="text-sm font-medium mt-8 w-full">Live Preview</h1>

          {/* Centered resume wrapper */}
          <div className="w-full h-[360px] overflow-hidden">
            <RenderResume
              templateId={templateIdCurrent}
              resumeData={resumeData}
              colorIndex={colorIndex}
              containerWidth={250}
              templateData={activeTemplateData}
            />
          </div>

          <div className="w-[90%] flex flex-col gap-1 items-center text-center">
            <h1
              onClick={handleChangeTemplate}
              className="text-sm text-[#f2825c] underline cursor-pointer"
            >
              Change Template
            </h1>
            <p className="text-xs">
              You can change and update your resume according to your
              preferences
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Page;

const ChangeTemlatePopuop = ({
  setChangeTemplatePopup,
  resumeData,
  templateId,
  templateData,
  setTemplateIdCurrent,
  colorIndex,
  setColorIndex,
  templates,
}: any) => {
  const [baseWidth, setBaseWidth] = useState(700);
  const ref = useRef<any>(null);

  const upadteBaseWidth = () => {
    if (ref.current) {
      setBaseWidth(ref?.current?.offsetWidth);
    }
  };

  useEffect(() => {
    upadteBaseWidth();
    window.addEventListener("resize", upadteBaseWidth);
    return () => window.removeEventListener("resize", upadteBaseWidth);
  }, []);

  // Colors come from the active template's colorOptions (fallback to a safe default)
  const colors: string[] =
    templateData?.colorOptions ?? [
      "#1B8D7A",
      "#7d47b2",
      "#2b98de",
      "#102a73",
      "#7d7d7d",
    ];

  return (
    <div className="w-screen h-screen fixed inset-0 bg-[#17383d]/45 z-50">
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[90%] overflow-hidden bg-white rounded-xl flex flex-col">
        {/* Header */}
        <div className="w-full flex items-center justify-between shadow-xl px-6 py-5 bg-white z-10">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium">Change Template</h1>
          </div>
          <X
            size={40}
            className="ml-2 cursor-pointer"
            onClick={() => setChangeTemplatePopup(false)}
          />
        </div>

        {/* Body */}
        <div className="w-full flex flex-1 h-0 bg-gray-100">
          {/* Left Side (Main Preview) */}
          <div className="w-1/2 overflow-y-auto">
            <div ref={ref} className="w-full flex mt-4 mb-24 p-5">
              <RenderResume
                templateId={templateId}
                resumeData={resumeData}
                colorIndex={colorIndex}
                containerWidth={baseWidth}
                templateData={templateData}
              />
            </div>
          </div>

          {/* Right Side (Color + Template Options) */}
          <div className="w-1/2 border-l flex flex-col">
            {/* Color picker — from the active template's colorOptions */}
            <div className="w-full py-6 px-5 flex items-center gap-4">
              <h1 className="text-xl font-medium">Choose Color:</h1>
              <div className="flex gap-2 items-center">
                <div className="flex items-center gap-3">
                  {colors.map((color: string, index: number) => (
                    <div
                      key={index}
                      onClick={() => setColorIndex(index)}
                      className={`rounded-full cursor-pointer transition-all duration-200 p-[0.8px] ${colorIndex === index
                        ? "border-3 border-gray-600 scale-105"
                        : "border-3 border-transparent hover:scale-105"
                        }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Template grid — from API */}
            <div className="flex-1 overflow-y-auto">
              <div className="w-full bg-[#00323C] grid grid-cols-2 gap-12 p-10">
                {templates.map((tmpl: any) => (
                  <div
                    onClick={() => {
                      setTemplateIdCurrent(tmpl.templateId);
                      // Reset colorIndex if new template has fewer color options
                      if (colorIndex >= (tmpl.colorOptions?.length ?? 0)) {
                        setColorIndex(0);
                      }
                    }}
                    key={tmpl.templateId}
                    className={`col-span-1 h-[260px] overflow-hidden cursor-pointer ${templateId === tmpl.templateId
                      ? "border-4 border-[#f2825c]"
                      : ""
                      }`}
                  >
                    <div className="pointer-events-none w-full h-full">
                      <RenderResume
                        templateId={tmpl.templateId}
                        resumeData={resumeData}
                        colorIndex={colorIndex}
                        containerWidth={230}
                        templateData={tmpl}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PreviewPopup = ({
  setPreviewPopup,
  resumeData,
  templateId,
  templateData,
  colorIndex,
}: any) => {
  return (
    <div className="w-screen h-screen fixed inset-0 bg-[#17383d]/45 z-50">
      <div className="absolute left-1/2 top-1/2 -translate-1/2 w-[70%] h-[90%] bg-white rounded-xl flex flex-col items-center gap-12 overflow-y-auto">
        <div className="w-full flex items-center justify-between shadow-xl px-6 py-5 sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-medium">Preview Resume</h1>
          </div>
          <X
            size={40}
            className="ml-2 cursor-pointer"
            onClick={() => setPreviewPopup(false)}
          />
        </div>
        <div className="w-[70%] mb-10 z-[-1]">
          <RenderResume
            templateId={templateId}
            resumeData={resumeData}
            colorIndex={colorIndex}
            containerWidth={800}
            templateData={templateData}
          />
        </div>
      </div>
    </div>
  );
};

const PublishPopup = ({
  setPublishPopup,
  resumeData,
  templateId,
  templateData,
  colorIndex,
  existingDraft,
  draftId,
}: any) => {
  const [loading, setLoading] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  // 👇 Ref to access child’s generateResumePdf() method
  const resumeRef = useRef<any>(null);

  /** ✅ Save Draft (JSON only) */
  const handleSaveDraft = async () => {
    try {
      setLoading(true);

      const payload = {
        resumeData, // Resume JSON
        template: String(templateId), // 🟢 FIX: Send same key as Publish
        colorCode: String(colorIndex), // 🟢 FIX: Keep consistent
      };

      let res;

      if (existingDraft) {
        if (!draftId) throw new Error("Draft ID missing for update.");
        res = await api.put(`/resume/drafts/${draftId}`, payload);
      } else {
        res = await api.post("/resume/draft", payload);
      }

      toast.success(res?.data?.message || "Draft saved successfully!");
    } catch (error: any) {
      console.error("❌ Save Draft Error:", error);
      toast.error(
        error.response?.data?.message ||
        "Failed to save draft. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  /** ✅ Publish Resume (Generate PDF + Upload) */
  const handlePublish = async () => {
    try {
      setIsPublishing(true);

      // 👇 Ask the active resume template to generate PDF
      const pdfFile = await resumeRef.current?.generateResumePdf();
      if (!pdfFile) {
        toast.error("Failed to generate resume PDF");
        return;
      }

      const token = localStorage.getItem("token");

      console.log("📤 Uploading resume to API...");
      const formData = new FormData();
      formData.append("resumePdf", pdfFile);
      formData.append("template", templateId);
      formData.append("colorCode", colorIndex);
      formData.append("resumeData", JSON.stringify(resumeData));
      if (resumeData.profileImageUrl) {
        formData.append("profileImageUrl", resumeData.profileImageUrl);
      }

      const res = await api.post("/resume/save", formData);

      const fileUrl = res.data?.resume?.resume_file_url;
      if (fileUrl) {
        setDownloadUrl(fileUrl);
        toast.success("Resume published successfully!");
      } else {
        toast.success("Resume published successfully (no file URL found).");
      }
    } catch (err: any) {
      console.error("❌ Publish Error:", err);
      toast.error(
        err.response?.data?.message || err.message || "Failed to publish resume"
      );
    } finally {
      setIsPublishing(false);
    }
  };

  /** ✅ Download published PDF from server */
  const handleDownload = () => {
    if (downloadUrl) window.open(downloadUrl, "_blank");
    else toast.error("No download link found!");
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#17383d]/45 z-50 flex items-center justify-center">
      <div className="w-[70%] h-[90%] bg-white rounded-xl flex flex-col items-center overflow-y-auto relative shadow-xl">
        {/* Header */}
        <div className="w-full flex items-center justify-between px-6 py-5 sticky top-0 bg-white shadow-md z-10">
          <h1 className="text-xl font-semibold">Publish Resume</h1>

          <div className="flex items-center gap-3">
            {/* Save Draft */}
            <button
              onClick={handleSaveDraft}
              disabled={loading}
              className="px-6 py-2 border-2 border-[#f2825c] text-[#f2825c] rounded-md font-medium disabled:opacity-60 hover:bg-[#f2825c]/10 transition-colors"
            >
              {loading ? "Saving..." : "Save Draft"}
            </button>

            {/* Publish / Download */}
            <button
              onClick={downloadUrl ? handleDownload : handlePublish}
              disabled={isPublishing}
              className={`px-6 py-2 flex items-center gap-2 rounded-md font-medium border-2 transition-colors ${downloadUrl
                ? "border-[#f2825c] text-[#f2825c] bg-white hover:bg-[#f2825c]/10"
                : "bg-[#f2825c] text-white border-[#f2825c] hover:bg-[#f2825c]/85"
                } disabled:opacity-60`}
            >
              {isPublishing ? (
                "Publishing..."
              ) : downloadUrl ? (
                <>
                  <Download size={18} /> Download
                </>
              ) : (
                <>
                  <CloudUpload size={18} /> Publish
                </>
              )}
            </button>

            {/* Close */}
            <X
              size={32}
              className="cursor-pointer text-gray-700 hover:text-[#17383d]"
              onClick={() => setPublishPopup(false)}
            />
          </div>
        </div>

        {/* Resume Preview */}
        <div className="w-auto bg-white my-10">
          <RenderResume
            ref={resumeRef}
            templateId={templateId}
            resumeData={resumeData}
            colorIndex={colorIndex}
            containerWidth={800}
            templateData={templateData}
          />
        </div>
      </div>
    </div>
  );
};
