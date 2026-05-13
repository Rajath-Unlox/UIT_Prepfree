"use client";

import React, { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import { Pen, Plus, X, Phone, Camera } from "lucide-react";
import BannerImageUploader from "./BannerUploader";
import Cropper from "react-easy-crop";
import gitIcon from "@/public/images/profile/gitIcon.png";
import beIcon from "@/public/images/profile/beIcon.png";
import dribbleIcon from "@/public/images/profile/dribbleIcon.png";
import linkIcon from "@/public/images/profile/linkIcon.png";
import inIcon from "@/public/images/profile/inIcon.png";
import api from "@/lib/api";

// ---------------------------
// Types
// ---------------------------

type SocialKey = "linkedin" | "github" | "dribble" | "behance" | "website";

type Social = {
  key: SocialKey;
  name: string;
  icon: any; // url or static import
};

type Language = {
  name: string;
};

export type JobPreference = {
  openFor?: string[];
  expectedCTC?: string;
  industry?: string[];
  preferedLocation?: string[];
  willingToRelocate?: boolean;
  jobRoles?: string[];
};

export type ProfileInfo = {
  profileHeadline?: string;
  summary?: string;
  profileImageUrl?: string;
  bannerImageUrl?: string;
  currentLocation?: string;
};

export type SocialInfo = Partial<Record<SocialKey, string>>;

export type User = {
  firstname?: string;
  lastname?: string;
  phone_number?: string;
  country_code?: string;
  email?: string;
  profileInfo?: ProfileInfo;
  socialInfo?: SocialInfo;
  languages?: Language[];
  jobPreference?: JobPreference;
};

// ---------------------------
// Props
// ---------------------------

type Props = {
  user?: User;
  onUpdated?: (user: User) => void; // optional callback after save
};

// ---------------------------
// Helper components (placeholders)
// ---------------------------

export const getCroppedImg = (imageSrc: string, crop: any): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      // Force square crop
      const size = Math.min(crop.width, crop.height);

      canvas.width = size;
      canvas.height = size;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        size, // force square selection
        size,
        0,
        0,
        size,
        size
      );

      const base64Image = canvas.toDataURL("image/jpeg");
      resolve(base64Image);
    };

    image.onerror = reject;
  });
};

function ProfileImageUploader({ user }: any) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [showCropModal, setShowCropModal] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    const profile = user?.profileInfo?.profileImageUrl;
    if (profile) setFinalImage(profile);
  }, [user]);

  const dataURLtoFile = (dataurl: string, filename: string) => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) u8arr[n] = bstr.charCodeAt(n);
    return new File([u8arr], filename, { type: mime });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setImageSrc(reader.result as string);
      setShowCropModal(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = useCallback(async () => {
    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels);
      setFinalImage(croppedImage);
      setShowCropModal(false);

      const file = dataURLtoFile(croppedImage, "profile.jpg");
      const formData = new FormData();
      formData.append("profileImage", file);

      const res = await api.post("/users/upload-profile-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newUrl = res.data.user.profileInfo.profileImageUrl;
      setFinalImage(newUrl);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (error) {
      console.error("Profile image upload failed:", error);
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageSrc]);

  // ⭐ REMOVE IMAGE using same upload API
  const handleRemoveImage = async () => {
    try {
      setRemoving(true);

      const res = await api.delete("/users/delete-profile-image");

      // UI update
      setFinalImage(null);
      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (error) {
      console.error("Failed to remove profile image:", error);
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {finalImage ? (
        <img
          src={finalImage}
          alt="Profile"
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="w-full h-full bg-gray-300" />
      )}

      <div
        className="bg-[#17383d]/45 absolute inset-0 z-10 
        group-hover:opacity-100 opacity-0 transition-all duration-300
        flex flex-col items-center justify-center gap-2 text-white"
      >
        <label
          htmlFor="fileInput"
          className="cursor-pointer flex flex-col items-center gap-1"
        >
          <Camera size={40} />
          <span className="text-sm">{loading ? "Uploading..." : "Upload"}</span>
        </label>

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        {/* ⭐ NEW REMOVE BUTTON */}
        {finalImage && (
          <button
            onClick={handleRemoveImage}
            disabled={removing}
            className="text-sm text-red-400 hover:text-red-500 mt-2"
          >
            {removing ? "Removing..." : "Remove"}
          </button>
        )}
      </div>

      {showCropModal && (
        <div className="fixed inset-0 bg-[#17383d]/70 z-50 flex items-center justify-center">
          <div className="bg-white p-4 rounded-lg w-[90%] max-w-lg flex flex-col gap-4">
            <div className="relative w-full h-80 bg-gray-200 rounded-lg overflow-hidden">
              <Cropper
                image={imageSrc!}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowCropModal(false)}
              >
                Cancel
              </button>
              <button
                disabled={loading}
                className="px-4 py-2 bg-[#f2825c] text-white rounded"
                onClick={handleCropComplete}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const UserRound: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect width="24" height="24" rx="6" fill="#D6DBD8" />
  </svg>
);

// ---------------------------
// Main Component
// ---------------------------

const AboutSection: React.FC<Props> = ({ user: initialUser, onUpdated }) => {
  // editing state
  const [selected, setSelected] = useState(false);
  const [edit, setEdit] = useState<string | null>(null);

  // local form data initialized from incoming user
  const [formData, setFormData] = useState<User>(() => ({
    firstname: initialUser?.firstname || "",
    lastname: initialUser?.lastname || "",
    phone_number: initialUser?.phone_number || "",
    country_code: initialUser?.country_code || "+91",
    email: initialUser?.email || "",
    profileInfo: {
      profileHeadline: initialUser?.profileInfo?.profileHeadline || "",
      summary: initialUser?.profileInfo?.summary || "",
      profileImageUrl: initialUser?.profileInfo?.profileImageUrl || "",
      bannerImageUrl: initialUser?.profileInfo?.bannerImageUrl || "",
      currentLocation: initialUser?.profileInfo?.currentLocation || "",
    },
    socialInfo: initialUser?.socialInfo || {},
    languages:
      (initialUser?.languages &&
        initialUser.languages.map((l) => ({ name: l.name }))) ||
      [],
    jobPreference: initialUser?.jobPreference || { openFor: [] },
  }));

  // keep a snapshot to cancel edits
  const [snapshot, setSnapshot] = useState<User | null>(null);

  // socials metadata
  const socials: Social[] = [
    { key: "linkedin", name: "LinkedIn", icon: inIcon },
    { key: "github", name: "GitHub", icon: gitIcon },
    { key: "dribble", name: "Dribble", icon: dribbleIcon },
    { key: "behance", name: "Behance", icon: beIcon },
    { key: "website", name: "Website", icon: linkIcon },
  ];

  // visible inputs for socials
  const [visibleInputs, setVisibleInputs] = useState<Record<string, boolean>>(
    {}
  );

  // language input helpers
  const [inputValue, setInputValue] = useState("");
  const availableLanguages = [
    "English",
    "Hindi",
    "Spanish",
    "French",
    "German",
    "Tamil",
    "Telugu",
    "Kannada",
  ];

  useEffect(() => {
    if (!initialUser) return;

    setFormData((prev) => ({
      ...prev,
      firstname: initialUser.firstname || "",
      lastname: initialUser.lastname || "",
      phone_number: initialUser.phone_number || "",
      country_code: initialUser.country_code || "+91",
      email: initialUser.email || "",
      profileInfo: {
        ...prev.profileInfo,
        profileHeadline: initialUser.profileInfo?.profileHeadline || "",
        summary: initialUser.profileInfo?.summary || "",
        currentLocation: initialUser.profileInfo?.currentLocation || "",
        profileImageUrl:
          initialUser.profileInfo?.profileImageUrl ||
          prev.profileInfo?.profileImageUrl,
        bannerImageUrl:
          initialUser.profileInfo?.bannerImageUrl ||
          prev.profileInfo?.bannerImageUrl,
      },
      socialInfo: initialUser.socialInfo || {},
      languages: initialUser.languages || [],
    }));
  }, [initialUser]);

  // ---------------------------
  // Handlers
  // ---------------------------

  const handleClick = (key: string) => {
    setSnapshot(JSON.parse(JSON.stringify(formData)));
    setSelected(true);
    setEdit(key);
  };

  const handleCancel = () => {
    if (snapshot) setFormData(snapshot);
    setSelected(false);
    setEdit(null);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // nested fields mapping
    if (name === "headline") {
      setFormData((prev) => ({
        ...prev,
        profileInfo: { ...prev.profileInfo, profileHeadline: value },
      }));
      return;
    }

    if (name === "summary") {
      setFormData((prev) => ({
        ...prev,
        profileInfo: { ...prev.profileInfo, summary: value },
      }));
      return;
    }

    if (name === "currentLocation") {
      setFormData((prev) => ({
        ...prev,
        profileInfo: { ...prev.profileInfo, currentLocation: value },
      }));
      return;
    }

    if (name === "firstName") {
      setFormData((prev) => ({ ...prev, firstname: value }));
      return;
    }

    if (name === "lastName") {
      setFormData((prev) => ({ ...prev, lastname: value }));
      return;
    }

    if (name === "phone") {
      setFormData((prev) => ({ ...prev, phone_number: value }));
      return;
    }

    if (name === "email") {
      setFormData((prev) => ({ ...prev, email: value }));
      return;
    }

    // fallback
    setFormData((prev) => ({ ...prev }));
  };

  const toggleInput = (key: string) => {
    setVisibleInputs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleLinkChange = (key: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialInfo: { ...(prev.socialInfo || {}), [key]: value },
    }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      addLanguage(inputValue.trim());
    }
  };

  const addLanguage = (lang: string) => {
    if (!lang) return;
    setFormData((prev) => {
      const existing = prev.languages || [];
      if (existing.some((l) => l.name.toLowerCase() === lang.toLowerCase()))
        return prev;
      return { ...prev, languages: [...existing, { name: lang }] };
    });
    setInputValue("");
  };

  const handleRemove = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      languages: (prev.languages || []).filter((l) => l.name !== name),
    }));
  };

  const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val) addLanguage(val);
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");
      // example API endpoint - adapt to your backend
      const payload = { ...formData };

      await api.post("/users/update-profile", payload);

      //   alert("Profile updated");
      setSelected(false);
      setEdit(null);
      if (onUpdated) onUpdated(formData);
    } catch (err) {
      console.error(err);
      //   alert("Failed to update profile");
    }
  };

  // ---------------------------
  // Render
  // ---------------------------
  return (
    <div className="w-full">
      {selected && edit === "About" ? (
        <div className="w-full h-auto rounded-lg bg-white p-5 flex flex-col gap-1">
          <div className="flex gap-4 w-[70%]">
            <div className="flex flex-col gap-1 w-1/2">
              <label>
                First Name <span className="text-[#FF2828]">*</span>
              </label>
              <input
                type="text"
                onChange={handleChange}
                name="firstName"
                value={formData.firstname}
                placeholder="xyz"
                className="border rounded-md p-2"
              />
            </div>
            <div className="flex flex-col gap-1 w-1/2">
              <label>
                Last Name <span className="text-[#FF2828]">*</span>
              </label>
              <input
                type="text"
                onChange={handleChange}
                name="lastName"
                value={formData.lastname}
                placeholder="xyz"
                className="border rounded-md p-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label>
              Profile Headline <span className="text-[#FF2828]">*</span>
            </label>
            <input
              type="text"
              onChange={handleChange}
              name="headline"
              value={formData.profileInfo?.profileHeadline}
              placeholder="e.g. UI/UX Designer"
              className="border rounded-md p-2"
            />
          </div>

          <div className="flex gap-4 w-full">
            <div className="flex flex-col gap-1 w-1/2">
              <label>Phone Number</label>
              <input
                type="text"
                onChange={handleChange}
                name="phone"
                value={formData.phone_number}
                placeholder="Phone Number"
                className="border rounded-md p-2"
              />
            </div>
            <div className="flex flex-col gap-1 w-1/2">
              <label>Email</label>
              <input
                type="text"
                onChange={handleChange}
                name="email"
                value={formData.email}
                placeholder="xyz@gmail.com"
                className="border rounded-md p-2"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <label>
              Current Location <span className="text-[#FF2828]">*</span>
            </label>
            <input
              type="text"
              onChange={handleChange}
              name="currentLocation"
              value={formData.profileInfo?.currentLocation}
              placeholder="City, Country"
              className="border rounded-md p-2"
            />
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <label>
              You can write about your years of experience, industry, or skills.
              People also talk about their achievements or previous job
              experiences.
            </label>
            <textarea
              className="border rounded-md p-2"
              onChange={handleChange}
              name="summary"
              value={formData.profileInfo?.summary}
              placeholder="xyz"
              rows={10}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="font-medium text-lg">Social Links</label>

            {socials.map((social) => {
              const currentValue =
                (formData.socialInfo && formData.socialInfo[social.key]) || "";

              return (
                <div key={social.key} className="flex flex-col gap-1 w-[40%]">
                  <button
                    type="button"
                    onClick={() => toggleInput(social.key)}
                    className="flex items-center justify-between border border-[#cfe3e0]/20 px-4 py-2 rounded-lg"
                  >
                    <div className="flex gap-2 items-center">
                      <Image
                        src={social.icon}
                        alt={social.name}
                        className="w-4 h-auto"
                      />
                      <h1>{social.name}</h1>
                    </div>
                    <div className="text-sm flex items-center justify-center bg-[#f2825c] text-white font-bold rounded-full w-5 h-5 p-1">
                      <Plus size={10} />
                    </div>
                  </button>

                  {visibleInputs[social.key] && (
                    <input
                      type="url"
                      placeholder={`Enter your ${social.name} link`}
                      value={currentValue}
                      onChange={(e) =>
                        handleLinkChange(social.key, e.target.value)
                      }
                      className="border border-[#cfe3e0]/20 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#f2825c]"
                    />
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-1 mt-1">
            <label className="font-medium text-lg">Languages</label>
            <p className="text-md mt-1">Add Languages you speak</p>

            <div className="border border-[#cfe3e0]/20 rounded-md px-3 py-2 flex flex-wrap gap-2 min-h-[45px]">
              {(formData.languages || []).map((lang, i) => (
                <div
                  key={i}
                  className="bg-[#f2825c]/10 text-[#f2825c] px-2 py-1 rounded-md flex items-center gap-1 text-sm"
                >
                  {lang.name}
                  <button
                    onClick={() => handleRemove(lang.name)}
                    className="text-[#f2825c] font-bold hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              ))}

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type or select..."
                className="flex-grow focus:outline-none text-sm min-w-[100px]"
              />
            </div>

            <select
              onChange={handleSelect}
              className="border border-[#cfe3e0]/20 rounded-md px-2 py-2 mt-2"
              defaultValue=""
            >
              <option value="" disabled>
                Select a language
              </option>
              {availableLanguages.map((lang) => (
                <option key={lang} value={lang}>
                  {lang}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full flex items-center justify-end border-t border-[#cfe3e0]/20 py-2 mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                className="px-8 py-2 cursor-pointer rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-8 py-2 border-2 rounded-md cursor-pointer flex gap-2 items-center bg-[#f2825c] border-[#f2825c] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full min-h-[300px] rounded-lg bg-white">
          <BannerImageUploader user={initialUser} />

          <div className="flex items-end justify-between h-auto px-5 pb-5 w-full relative pt-8">
            <div className="flex flex-col gap-0 z-10 w-full">
              <div className="bg-white h-40 w-40 border border-[#cfe3e0]/20 rounded-lg flex items-center justify-center absolute left-5 -top-24 group overflow-hidden">
                <div className="absolute inset-0 w-full h-full">
                  <ProfileImageUploader user={initialUser} />
                </div>
                <UserRound className="w-3/4 h-auto text-white" />
              </div>

              <div className="w-full flex justify-end">
                <Pen
                  onClick={() => handleClick("About")}
                  size={20}
                  className="cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between w-[95%]">
                <h1 className="text-lg text-[#18191C] font-bold mt-8">
                  {formData.firstname || formData.lastname
                    ? `${formData.firstname} ${formData.lastname}`.trim()
                    : "Your Name"}
                </h1>

                <div className="flex gap-1 items-center mt-4">
                  <Phone size={15} />
                  <p className="text-md text-[#18191C] font-medium">
                    {formData.country_code}
                    {formData.phone_number || ""}
                  </p>
                </div>
              </div>

              <p className="text-md text-[#7F7F7F] font-medium">
                {formData.profileInfo?.profileHeadline || "Headline"}
              </p>

              <p className="text-md text-[#f2825c] font-medium underline">
                {formData.email || "Email"}
              </p>

              <p className="text-md text-[#17383d]/60">
                {formData.profileInfo?.summary || "Intro"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AboutSection;
