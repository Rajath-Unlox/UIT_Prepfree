"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pen, Delete, Trash2 } from "lucide-react";
import projIcon from "@/public/images/profile/projectsIcon.png";
import axios from "axios";
import api from "@/lib/api";

export interface Media {
  name: string;
  url: string;
}

interface Projects {
  id?: number;
  title: string;
  description?: string;
  media: Media[];
  startDate?: string;
  endDate?: string;
}

interface FormData {
  projects: Projects[];
}

const ProjectsSection = ({ formData, setFormData, user }: any) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [newProj, setNewProj] = useState<Projects>({
    id: Date.now(),
    title: "",
    description: "",
    media: [],
    startDate: "",
    endDate: "",
  });
  const [showDelete, setShowDelete] = useState(false);

  /* -------------------------------------------
           INPUT CHANGE
  ------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setNewProj((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* -------------------------------------------
           SAVE PROJECT
  ------------------------------------------- */
  const handleSave = async () => {
    if (
      !newProj.title ||
      !newProj.description ||
      !newProj.startDate ||
      !newProj.endDate
    )
      return alert("Please fill required fields!");

    let updated: Projects[] = [...formData.projects];

    if (editIndex !== null && editIndex !== -1) {
      updated[editIndex] = newProj;
    } else {
      updated.push({ ...newProj, id: Date.now() });
    }

    setFormData({ ...formData, projects: updated });

    // Reset UI
    setEditIndex(null);
    resetForm();

    /* ------------ API HIT ------------ */
    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { projects: updated });

      user.projects = updated;
    } catch (err) {
      console.error("Error updating profile:", err);
    }
  };

  /* -------------------------------------------
            EDIT PROJECT
  ------------------------------------------- */
  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    const proj = user.experience[idx];

    setNewProj({
      id: proj.id || Date.now(),
      title: proj.title || "",
      description: proj.description || "",
      media: proj.media || [],
      startDate: proj.startDate || "",
      endDate: proj.endDate || "",
    });

    setShowDelete(true);
  };

  /* -------------------------------------------
            DELETE PROJECT
  ------------------------------------------- */
  const handleDelete = async (idx: number) => {
    const updated = formData.projects.filter((_: any, i: any) => i !== idx);
    setFormData({ ...formData, projects: updated });

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { projects: updated });

      user.projects = updated;
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
    setNewProj({
      id: Date.now(),
      title: "",
      description: "",
      media: [],
      startDate: "",
      endDate: "",
    });
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Trigger the hidden input
  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  // Upload file to backend
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const token = localStorage.getItem("token");

    const formData2 = new FormData();
    formData2.append("projectMedia", file);

    try {
      const res = await api.post("/users/project-media-staging", formData2, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      console.log("Uploaded", res.data);

      // Backend returns:
      // { name: "...", url: "..." }

      const uploadedMedia = {
        name: res.data.fileName,
        url: res.data.imageUrl,
        s3Key: res.data.imageKey,
      };

      // PUSH to newExp.media
      setNewProj((prev) => ({
        ...prev,
        media: [...prev.media, uploadedMedia],
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMedia = (index: number) => {
    setNewProj((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[#1E1E1E] font-bold text-lg">Projects</h1>
        {formData.projects.length > 0 && editIndex === null && (
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
        <div className="w-full h-auto rounded-lg bg-white p-5 flex flex-col gap-2">
          <div className="w-full flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1">
              <label>
                Project Name<span className="text-[#FF2828]">*</span>
              </label>
              <input
                name="title"
                value={newProj.title}
                onChange={handleChange}
                placeholder="Project Name"
                className="border rounded-md p-2"
              />
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1 mt-1">
              <label>
                Description<span className="text-[#FF2828]">*</span>
              </label>
              <textarea
                name="description"
                value={newProj.description}
                onChange={handleChange}
                placeholder="Project Description"
                className="border rounded-md p-2"
                rows={8}
              />
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <label className="font-medium text-lg">Media</label>
              <p className="text-md mt-1">
                Add Media like documents, images, files or presentation
              </p>

              <button
                onClick={handleAddClick}
                className="text-[#f2825c] border-[#f2825c] border-2 px-8 py-2 w-fit rounded-full font-medium"
              >
                +ADD
              </button>

              {/* Hidden input */}
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />

              {newProj.media.length > 0 && (
                <div className="flex flex-wrap gap-3 mt-3">
                  {newProj.media.map((m, index) => (
                    <div
                      key={index}
                      className="relative w-[160px] h-[90px] bg-[#F8F8F8] rounded-md overflow-hidden"
                    >
                      <img
                        src={m.url}
                        alt={m.name}
                        className="w-full h-full object-cover"
                      />

                      {/* Delete button */}
                      <button
                        onClick={() => handleDeleteMedia(index)}
                        className="absolute top-1 right-1 bg-[#17383d]/60 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start Date */}
            <div className="flex flex-col gap-1 w-[70%]">
              <label>
                Start Date<span className="text-[#FF2828]">*</span>
              </label>
              <input
                type="date"
                name="startDate"
                value={newProj.startDate}
                onChange={handleChange}
                placeholder="MM/YYYY"
                className="border rounded-md p-2"
              />
            </div>

            {/* End Date */}
            <div className="flex flex-col gap-1 w-[70%]">
              <label>
                End Date<span className="text-[#FF2828]">*</span>
              </label>
              <input
                type="date"
                name="endDate"
                value={newProj.endDate}
                onChange={handleChange}
                placeholder="MM/YYYY"
                className="border rounded-md p-2"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="w-full flex items-center justify-end border-t border-[#cfe3e0]/20 py-2 mt-2">
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
                className="px-8 py-2 border-2 rounded-md cursor-pointer flex gap-2 items-center bg-[#f2825c] border-[#f2825c] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {formData.projects.length > 0 && editIndex === null && (
        <div className="flex flex-col gap-3">
          {formData.projects.map((proj: Projects, idx: number) => (
            <div
              key={idx}
              className="w-full bg-white rounded-lg p-4 flex justify-between items-start shadow-sm border border-gray-100"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
                  <Image src={projIcon} alt="project" />
                </div>

                <div className="flex flex-col gap-1 w-[75%]">
                  <h2 className="text-md font-semibold text-[#1E1E1E]">
                    {proj.title}
                  </h2>

                  <p className="text-sm text-[#17383d]/50 font-medium">
                    {proj.description}
                  </p>

                  <p className="text-sm text-[#17383d] font-medium">
                    {formatDate(proj.startDate)} - {formatDate(proj.endDate)}
                  </p>

                  {proj.media?.length > 0 && (
                    <div className="bg-[#F8F8F8] rounded-md mt-1 w-[160px] h-[90px] flex items-center justify-center">
                      <img
                        src={proj.media[0].url}
                        alt="media"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleEdit(idx)}>
                  <Pen size={18} className="text-[#17383d] hover:text-[#f2825c]" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {formData.projects.length === 0 && editIndex === null && (
        <div className="w-full rounded-lg bg-white p-5">
          <div className="flex gap-12 items-center">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={projIcon} alt="project" />
            </div>

            <button
              onClick={() => setEditIndex(-1)}
              className="text-[#f2825c] font-medium cursor-pointer"
            >
              + Add Featured Projects
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectsSection;
