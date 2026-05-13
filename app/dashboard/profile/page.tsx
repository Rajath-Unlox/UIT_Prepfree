"use client";
import {
  Camera,
  CloudUpload,
  MapPin,
  Pen,
  Pencil,
  Phone,
  Plus,
  UserRound,
} from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useState } from "react";
import adImg from "@/public/images/adImg.png";
import expIcon from "@/public/images/profile/expIcon.png";
import eduIcon from "@/public/images/profile/eduIcon.png";
import certIcon from "@/public/images/profile/certIcon.png";
import projectsIcon from "@/public/images/profile/projectsIcon.png";
import fileIcon from "@/public/images/profile/fileIcon.png";

import Cropper from "react-easy-crop";
import ExperienceSection from "@/components/profile/experienceCard";
import EducationSection from "@/components/profile/educationCard";
import ProjectsSection from "@/components/profile/projectsCard";
import CertificationSection from "@/components/profile/certificationCard";
import SkillsSection from "@/components/profile/skillsCard";
import BannerImageUploader from "@/components/profile/BannerUploader";
import axios from "axios";
import JobPreferenceSection from "@/components/profile/JobPreferenceCard";
import AboutSection from "@/components/profile/AboutCard";
import Link from "next/link";
import api from "@/lib/api";

export interface Media {
  name: string;
  url: string;
  s3Key: string;
  mimeType?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SimpleItem {
  name: string;
}

export interface ProfileInfo {
  profileImageUrl?: string;
  profileImageS3Key?: string;
  bannerImageUrl?: string;
  bannerImageS3Key?: string;
  profileHeadline?: string;
  summary?: string;
  currentLocation?: string;
}

export interface SocialInfo {
  github?: string;
  behance?: string;
  dribble?: string;
  portfolio?: string;
  linkedin?: string;
  otherLinks: string[];
}

export interface ProjectData {
  id?: number; // frontend use only
  title: string;
  description?: string;
  media: Media[];
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ExperienceData {
  id?: number;
  company?: string;
  title: string;
  jobType?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorkHere: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface EducationData {
  id?: number;
  institution?: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  currentlyPursuing: boolean;
  activitiesAndSocieties?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface JobPreference {
  openFor?: string[];
  expectedCTC?: string;
  industry?: string[];
  preferedLocation?: string[];
  willingToRelocate?: boolean;
  jobRole: string[];
}

export interface CertificationData {
  id?: number;
  title: string;
  issuer?: string;
  credentialId?: string;
  credentialUrl?: string;
  startDate?: string;
  endDate?: string;
  media: Media[];
  createdAt?: string;
  updatedAt?: string;
}

export interface FormData {
  firstname: string;
  lastname: string;
  phone_number: string;
  country_code: string;
  email: string;

  profileInfo: ProfileInfo;
  socialInfo: SocialInfo;
  jobPreference: JobPreference;

  skills: SimpleItem[];
  languages: SimpleItem[];

  projects: ProjectData[];
  experience: ExperienceData[];
  education: EducationData[];
  certifications: CertificationData[];

  // Flags
  hasNoProject?: boolean;
  hasNoExperience?: boolean;
  hasNoEducation?: boolean;
}

const page = () => {
  const [selected, setSelected] = useState(false);
  const [edit, setEdit] = useState("");
  const [formData, setFormData] = useState<FormData>({
    firstname: "",
    lastname: "",

    phone_number: "",
    country_code: "",
    email: "",

    profileInfo: {
      profileImageUrl: "",
      profileImageS3Key: "",
      bannerImageUrl: "",
      bannerImageS3Key: "",
      profileHeadline: "",
      summary: "",
      currentLocation: "",
    },

    socialInfo: {
      github: "",
      behance: "",
      dribble: "",
      portfolio: "",
      linkedin: "",
      otherLinks: [],
    },

    jobPreference: {
      openFor: [],
      expectedCTC: "",
      industry: [],
      preferedLocation: [],
      jobRole: [],
      willingToRelocate: false,
    },

    skills: [], // SimpleItem[] = { name: string }
    languages: [], // SimpleItem[]

    projects: [], // ProjectData[]
    experience: [], // ExperienceData[]
    education: [], // EducationData[]
    certifications: [], // CertificationData[]

    hasNoProject: false,
    hasNoExperience: false,
    hasNoEducation: false,
  });

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await api.get("/users/me");

        const me = res.data.user;

        // Save user if needed
        setUser(me);

        // Populate formData based on schema structure
        setFormData({
          firstname: me.firstname || "",
          lastname: me.lastname || "",
          phone_number: me.phone_number || "",
          country_code: me.country_code || "",
          email: me.email || "",

          profileInfo: {
            profileImageUrl: me.profileInfo?.profileImageUrl || "",
            profileImageS3Key: me.profileInfo?.profileImageS3Key || "",
            bannerImageUrl: me.profileInfo?.bannerImageUrl || "",
            bannerImageS3Key: me.profileInfo?.bannerImageS3Key || "",
            profileHeadline: me.profileInfo?.profileHeadline || "",
            summary: me.profileInfo?.summary || "",
            currentLocation: me.profileInfo?.currentLocation || "",
          },

          socialInfo: {
            github: me.socialInfo?.github || "",
            behance: me.socialInfo?.behance || "",
            dribble: me.socialInfo?.dribble || "",
            portfolio: me.socialInfo?.portfolio || "",
            linkedin: me.socialInfo?.linkedin || "",
            otherLinks: me.socialInfo?.otherLinks || [],
          },

          jobPreference: {
            openFor: me.jobPreference?.openFor || [],
            expectedCTC: me.jobPreference?.expectedCTC || "",
            industry: me.jobPreference?.industry || [],
            preferedLocation: me.jobPreference?.preferedLocation || [],
            willingToRelocate: me.jobPreference?.willingToRelocate || false,
            jobRole: me.jobPreference?.jobRole || [],
          },

          skills: me.skills || [],
          languages: me.languages || [],
          projects: me.projects || [],
          experience: me.experience || [],
          education: me.education || [],
          certifications: me.certifications || [],

          hasNoProject: me.hasNoProject || false,
          hasNoExperience: me.hasNoExperience || false,
          hasNoEducation: me.hasNoEducation || false,
        });
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };

    fetchMe();
  }, []);

  const [visibleInputs, setVisibleInputs] = useState<{
    [key: string]: boolean;
  }>({});

  type SocialKeys = "github" | "behance" | "dribble" | "portfolio" | "linkedin";

  // const socials: { key: SocialKeys; name: string; icon: any }[] = [
  //   { key: "github", name: "GitHub", icon: gitIcon },
  //   { key: "linkedin", name: "LinkedIn", icon: inIcon },
  //   { key: "behance", name: "Behance", icon: beIcon },
  //   { key: "dribble", name: "Dribbble", icon: dribbleIcon },
  //   { key: "portfolio", name: "Portfolio", icon: linkIcon },
  // ];

  const toggleInput = (key: string) => {
    setVisibleInputs((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // 🔹 Update link inside formData.links
  const handleLinkChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialInfo: {
        ...prev.socialInfo,
        [key]: value,
      },
    }));
  };

  // 🔹 Handle top-level fields (simple text/number inputs)
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 🔹 Handle array fields (like links, skills, etc.)
  const handleArrayChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    field: keyof FormData,
    key?: string
  ) => {
    const value = e.target.value;
    setFormData((prev) => {
      const updatedArray = [...(prev[field] as any[])];
      if (key) {
        updatedArray[index][key] = value;
      } else {
        updatedArray[index] = value;
      }
      return { ...prev, [field]: updatedArray };
    });
  };

  // 🔹 Add a new item to an array field
  const addItem = (field: keyof FormData, newItem: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: [...(prev[field] as any[]), newItem],
    }));
  };

  // 🔹 Remove an item from an array field
  const removeItem = (field: keyof FormData, index: number) => {
    setFormData((prev) => {
      const updatedArray = [...(prev[field] as any[])];
      updatedArray.splice(index, 1);
      return { ...prev, [field]: updatedArray };
    });
  };

  // 🔹 Example submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
  };

  const [inputValue, setInputValue] = useState("");

  const availableLanguages = [
    "English",
    "Spanish",
    "French",
    "Hindi",
    "Japanese",
    "German",
    "Mandarin",
  ];

  const handleAddLanguage = (lang: string) => {
    if (!lang.trim()) return;

    if (!formData.languages.some((l) => l.name === lang)) {
      setFormData((prev) => ({
        ...prev,
        languages: [...prev.languages, { name: lang }],
      }));
    }

    setInputValue("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      handleAddLanguage(inputValue.trim());
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLang = e.target.value;
    handleAddLanguage(selectedLang);
    e.target.value = "";
  };

  const handleRemove = (lang: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: prev.languages.filter((l) => l.name !== lang),
    }));
  };

  const handleClick = (item: any) => {
    setEdit(item);
    setSelected(true);
  };

  const handleSave = () => {
    setEdit("");
    setSelected(false);
  };

  const handleCancel = () => {
    setEdit("");
    setSelected(false);
  };

  const handleCamClick = () => {};

  return (
    <main className="w-full h-auto flex gap-4">
      <div className="w-[60%] flex flex-col gap-4 mb-10">
        <h1 className="text-[#1E1E1E] font-bold text-lg">
          Here You can Edit Your Profile
        </h1>
        <AboutSection user={user} />

        <ExperienceSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />

        <EducationSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />

        <ProjectsSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />

        <JobPreferenceSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />

        <CertificationSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />

        <SkillsSection
          formData={formData}
          setFormData={setFormData}
          user={user}
        />
      </div>

      <div className="w-[40%] flex flex-col gap-4">
        <Link
          href="/dashboard/ai-resume-builder"
          className="w-full bg-white rounded-xl p-5"
        >
          <div className="w-full bg-gray-200 h-[250px] rounded-xl">
            <Image
              src={adImg}
              alt="Ad"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="w-full flex flex-col mt-2">
            <h1 className="text-lg font-medium">
              Craft the Perfect Resume in Minutes.
            </h1>
            <p className="text-sm text-[#17383d]/62">
              Optimize Your Resume to Secure More Interviews
            </p>
          </div>
          <div className="w-full flex justify-end items-center mt-2">
            <button className="text-[#f2825c] font-medium">Learn More</button>
          </div>
        </Link>
      </div>
    </main>
  );
};

export default page;
