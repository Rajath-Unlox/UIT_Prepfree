"use client";
import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Plus, Delete, Pen, Camera, Trash2 } from "lucide-react";
import expIcon from "@/public/images/profile/expIcon.png";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import api from "@/lib/api";

interface Experience {
  id?: number;
  company?: string;
  title: string;
  jobType?: string;
  location?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  currentlyWorkHere: boolean;
  jobImageUrl?: string;
  jobImageS3Key?: any;
}

interface FormData {
  experience: Experience[];
}

const ExperienceSection = ({
  formData,
  setFormData,
  user,
}: {
  formData: FormData;
  setFormData: any;
  user: any;
}) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [newExp, setNewExp] = useState<Experience>({
    id: Date.now(),
    company: "",
    title: "",
    jobType: "",
    location: "",
    description: "",
    startDate: "",
    endDate: "",
    currentlyWorkHere: false,
    jobImageUrl: "",
    jobImageS3Key: "",
  });

  /* -------------------------------------------
       HANDLE INPUT CHANGES
  ------------------------------------------- */
  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;

    setNewExp((prev) => {
      const updated = {
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      };

      if (name === "currentlyWorkHere" && checked) {
        updated.endDate = "";
      }

      return updated;
    });
  };

  /* -------------------------------------------
       SAVE EXPERIENCE
  ------------------------------------------- */
  const handleSave = async () => {
    if (!newExp.company || !newExp.title)
      return alert("Please fill required fields!");

    let updated: Experience[] = [...formData.experience];

    if (editIndex !== null && editIndex !== -1) {
      updated[editIndex] = newExp;
    } else {
      updated.push({ ...newExp, id: Date.now() });
    }

    const updatedForm = { ...formData, experience: updated };
    setFormData(updatedForm);

    // Reset UI
    setEditIndex(null);
    resetForm();

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { experience: updated });

      user.experience = updated;
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  /* -------------------------------------------
       EDIT EXPERIENCE
  ------------------------------------------- */
  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    const exp = user.experience[idx];

    setNewExp({
      id: exp.id || Date.now(),
      company: exp.company || "",
      title: exp.title || "",
      jobType: exp.jobType || "",
      location: exp.location || "",
      description: exp.description || "",
      startDate: exp.startDate || "",
      endDate: exp.endDate || "",
      currentlyWorkHere: exp.currentlyWorkHere || false,
      jobImageUrl: exp.jobImageUrl || "",
      jobImageS3Key: exp.jobImageS3Key || "",
    });

    setShowDelete(true);
  };

  /* -------------------------------------------
       DELETE EXPERIENCE
  ------------------------------------------- */
  const handleDelete = async (idx: number) => {
    if (idx === -1) return; // prevent deletion during new entry

    const updated = formData.experience.filter((_, i) => i !== idx);
    setFormData({ ...formData, experience: updated });

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { experience: updated });

      user.experience = updated;
    } catch (err) {
      console.error("Delete failed:", err);
    }

    setEditIndex(null);
    resetForm();
  };

  /* -------------------------------------------
       RESET FORM
  ------------------------------------------- */
  const resetForm = () => {
    setNewExp({
      id: Date.now(),
      company: "",
      title: "",
      jobType: "",
      location: "",
      description: "",
      startDate: "",
      endDate: "",
      currentlyWorkHere: false,
      jobImageUrl: "",
      jobImageS3Key: "",
    });

    setShowDelete(false);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[#1E1E1E] font-bold text-lg">Experience</h1>

        {user?.experience?.length > 0 && editIndex === null && (
          <button
            onClick={() => {
              resetForm();
              setEditIndex(-1);
            }}
            className="flex items-center gap-1 text-[#17383d] cursor-pointer hover:text-[#f2825c] font-medium"
          >
            <Plus size={16} /> Add
          </button>
        )}
      </div>

      {/* Form */}
      {editIndex !== null && (
        <div className="w-full rounded-lg bg-white p-5 flex flex-col gap-10">
          <div className="w-full flex gap-4">
            <UploadImageBox expIcon={expIcon} exp={newExp} setExp={setNewExp} />

            <div className="flex flex-col gap-2 w-full">
              <label>
                Company Name<span className="text-[#FF2828]">*</span>
              </label>
              <input
                name="company"
                value={newExp.company}
                onChange={handleChange}
                placeholder="e.g. Google"
                className="border rounded-md p-2"
              />

              <label>
                Job Title<span className="text-[#FF2828]">*</span>
              </label>
              <input
                name="title"
                value={newExp.title}
                onChange={handleChange}
                placeholder="e.g. Software Engineer"
                className="border rounded-md p-2"
              />

              <label>Employment Type</label>
              <input
                name="jobType"
                value={newExp.jobType}
                onChange={handleChange}
                placeholder="e.g. Full-Time"
                className="border rounded-md p-2"
              />

              <label>Location</label>
              <input
                name="location"
                value={newExp.location}
                onChange={handleChange}
                placeholder="e.g. Bangalore, India"
                className="border rounded-md p-2"
              />

              <label>Description</label>
              <textarea
                name="description"
                value={newExp.description}
                onChange={handleChange}
                placeholder="Describe your work..."
                rows={5}
                className="border rounded-md p-2"
              />

              <div className="flex gap-4">
                <div className="flex flex-col gap-1 w-1/2">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newExp.startDate || ""}
                    onChange={handleChange}
                    className="border rounded-md p-2"
                  />
                </div>

                <div className="flex flex-col gap-1 w-1/2">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newExp.currentlyWorkHere ? "" : newExp.endDate || ""}
                    onChange={handleChange}
                    disabled={newExp.currentlyWorkHere}
                    className="border rounded-md p-2 disabled:bg-gray-200"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  name="currentlyWorkHere"
                  checked={newExp.currentlyWorkHere}
                  onChange={handleChange}
                  className="w-5 h-5"
                />
                <span>Currently Working</span>
              </div>
            </div>
          </div>

          <div className="w-full flex justify-between items-center border-t border-[#cfe3e0]/20 py-2">
            {showDelete && editIndex !== -1 && (
              <div
                onClick={() => handleDelete(editIndex as number)}
                className="flex item-center gap-1 text-red-500 cursor-pointer"
              >
                <Trash2 /> <span>Delete the existing information</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditIndex(null);
                  resetForm();
                }}
                className="px-8 py-2 rounded-md cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSave}
                className="px-8 py-2 rounded-md cursor-pointer flex gap-2 items-center bg-[#184852] border-[#184852] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {user?.experience?.length > 0 && editIndex === null && (
        <div className="flex flex-col gap-3">
          {user.experience.map((exp: Experience, idx: number) => (
            <div
              key={idx}
              className="w-full bg-white rounded-lg p-4 flex justify-between items-start shadow-sm border"
            >
              <div className="flex gap-4 w-[90%]">
                <div className="w-[15%] h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
                  {exp.jobImageUrl ? (
                    <img src={exp.jobImageUrl} alt="experience" />
                  ) : (
                    <Image src={expIcon} alt="experience" />
                  )}
                </div>

                <div className="flex flex-col gap-1 w-[75%]">
                  <h2 className="text-md font-semibold text-[#1E1E1E]">
                    {exp.title}
                  </h2>

                  <p className="text-sm text-[#f2825c] font-semibold">
                    {exp.company}
                    <span className="text-xs text-[#616161] ml-2">
                      {exp.jobType}
                    </span>
                  </p>

                  <p className="text-sm font-medium text-[#000000]/50">
                    {formatDate(exp.startDate)} -{" "}
                    {exp.currentlyWorkHere
                      ? "Present"
                      : formatDate(exp.endDate)}
                  </p>

                  <p className="text-xs font-medium text-[#000000]/50">
                    {exp.location}
                  </p>

                  <div className="text-xs mt-1 font-medium text-[#000000]/50 w-full">
                    <ReactMarkdown>{exp.description || ""}</ReactMarkdown>
                  </div>
                </div>
              </div>

              <button onClick={() => handleEdit(idx)}>
                <Pen
                  size={18}
                  className="text-[#17383d] cursor-pointer hover:text-[#f2825c]"
                />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {user?.experience?.length === 0 && editIndex === null && (
        <div className="w-full rounded-lg bg-white p-5">
          <div className="flex gap-12 items-center">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={expIcon} alt="experience" />
            </div>

            <button
              onClick={() => setEditIndex(-1)}
              className="text-[#f2825c] font-medium cursor-pointer"
            >
              + Add Experience
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExperienceSection;

/* -------------------------------------------
      UPLOAD IMAGE COMPONENT
------------------------------------------- */
function UploadImageBox({ expIcon, setExp, exp }: any) {
  const [image, setImage] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (exp?.jobImageUrl) setImage(exp.jobImageUrl);
  }, [exp.jobImageUrl]);

  const handleFileUploadToServer = async (file: File) => {
    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("experienceImage", file); // backend field name

      const token = localStorage.getItem("token");

      const res = await api.post("/users/experience-image-staging", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const url = res.data?.imageUrl;
      const s3key = res.data?.imageKey;
      setExp((prev: any) => ({
        ...prev,
        jobImageUrl: url,
        jobImageS3Key: s3key,
      }));

      setImage(url);
    } catch (err) {
      console.log("Upload failed", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    await handleFileUploadToServer(file);
  };

  const handleCameraClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center group relative overflow-hidden">
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileChange}
      />

      <div
        onClick={handleCameraClick}
        className="w-0 z-10 bg-[#17383d]/45 h-full flex items-center justify-center absolute inset-0 group-hover:w-full transition-all duration-300 text-white cursor-pointer"
      >
        {loading ? <span>Uploading...</span> : <Camera size={32} />}
      </div>

      {image ? (
        <img src={image} alt="Uploaded" className="object-cover" />
      ) : (
        <Image src={expIcon} alt="experience" className="w-auto h-auto" />
      )}
    </div>
  );
}
