"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Plus, Pen, DeleteIcon, Trash2 } from "lucide-react";
import eduIcon from "@/public/images/profile/eduIcon.png";
import axios from "axios";
import api from "@/lib/api";

interface Education {
  id?: number;
  institution?: string;
  degree: string;
  fieldOfStudy?: string;
  startDate?: string;
  endDate?: string;
  currentlyPursuing: boolean;
  activitiesAndSocieties?: string;
  description?: string;
}

interface FormData {
  education: Education[];
}

const EducationSection = ({
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

  const [newEdu, setNewEdu] = useState<Education>({
    id: Date.now(),
    institution: "",
    degree: "",
    fieldOfStudy: "",
    startDate: "",
    endDate: "",
    currentlyPursuing: false,
    activitiesAndSocieties: "",
    description: "",
  });

  /* -------------------------------------------
      HANDLE INPUT FIELD CHANGES
  ------------------------------------------- */
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const target = e.target;
    const { name, value, type } = target;

    setNewEdu((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (target as HTMLInputElement).checked : value,
    }));
  };

  /* -------------------------------------------
      SAVE EDUCATION
  ------------------------------------------- */
  const handleSaveEducation = async () => {
    if (!newEdu.institution || !newEdu.degree)
      return alert("Please fill required fields!");

    let updated: Education[] = [...formData.education];

    if (editIndex !== null && editIndex !== -1) {
      updated[editIndex] = newEdu;
    } else {
      updated.push({ ...newEdu, id: Date.now() });
    }

    const updatedForm = { ...formData, education: updated };
    setFormData(updatedForm);

    // Reset UI
    setEditIndex(null);
    resetEducationForm();

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { education: updated });

      user.education = updated;
    } catch (err) {
      console.error("Error updating education:", err);
    }
  };

  /* -------------------------------------------
      EDIT EDUCATION
  ------------------------------------------- */
  const handleEditEducation = (idx: number) => {
    setEditIndex(idx);
    const edu = user.education[idx];

    setNewEdu({
      id: edu.id || Date.now(),
      institution: edu.institution || "",
      degree: edu.degree || "",
      fieldOfStudy: edu.fieldOfStudy || "",
      startDate: edu.startDate || "",
      endDate: edu.endDate || "",
      currentlyPursuing: edu.currentlyPursuing || false,
      activitiesAndSocieties: edu.activitiesAndSocieties || "",
      description: edu.description || "",
    });

    setShowDelete(true);
  };

  /* -------------------------------------------
      DELETE EDUCATION
  ------------------------------------------- */
  const handleDeleteEducation = async (idx: number) => {
    if (idx === -1) return;

    const updated = formData.education.filter((_, i) => i !== idx);
    setFormData({ ...formData, education: updated });

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { education: updated });

      user.education = updated;
    } catch (err) {
      console.error("Delete failed:", err);
    }

    setEditIndex(null);
    resetEducationForm();
  };

  /* -------------------------------------------
      RESET FORM
  ------------------------------------------- */
  const resetEducationForm = () => {
    setNewEdu({
      id: Date.now(),
      institution: "",
      degree: "",
      fieldOfStudy: "",
      startDate: "",
      endDate: "",
      currentlyPursuing: false,
      activitiesAndSocieties: "",
      description: "",
    });
  };

  /* -------------------------------------------
      FORMAT DATE
  ------------------------------------------- */
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
        <h1 className="text-[#1E1E1E] font-bold text-lg">Education</h1>
        {formData.education.length > 0 && editIndex === null && (
          <button
            onClick={() => {
              resetEducationForm();
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
          <div className="w-full flex gap-4">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={eduIcon} alt="" className="w-1/2" />
            </div>

            <div className="w-[80%] flex flex-col gap-4">
              {/* Institution */}
              <div className="flex flex-col gap-1">
                <label>
                  School <span className="text-[#FF2828]">*</span>
                </label>
                <input
                  type="text"
                  name="institution"
                  value={newEdu.institution}
                  onChange={handleChange}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Degree */}
              <div className="flex flex-col gap-1">
                <label>
                  Degree <span className="text-[#FF2828]">*</span>
                </label>
                <input
                  type="text"
                  name="degree"
                  value={newEdu.degree}
                  onChange={handleChange}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Field of Study */}
              <div className="flex flex-col gap-1">
                <label>Field of Study</label>
                <input
                  type="text"
                  name="fieldOfStudy"
                  value={newEdu.fieldOfStudy}
                  onChange={handleChange}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Start Date */}
              <div className="flex gap-4">
                <div className="flex flex-col gap-1 w-[70%]">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={newEdu.startDate}
                    onChange={handleChange}
                    className="border rounded-md p-2"
                  />
                </div>

                {/* End Date */}
                <div className="flex flex-col gap-1 w-[70%]">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={newEdu.endDate}
                    onChange={handleChange}
                    className="border rounded-md p-2"
                  />
                </div>
              </div>

              {/* Activities */}
              <div className="flex flex-col gap-1">
                <label>Activities & Societies</label>
                <input
                  type="text"
                  name="activitiesAndSocieties"
                  value={newEdu.activitiesAndSocieties}
                  onChange={handleChange}
                  className="border rounded-md p-2"
                />
              </div>

              {/* Description */}
              <div className="flex flex-col gap-1 mt-1">
                <label>Description</label>
                <textarea
                  className="border rounded-md p-2"
                  name="description"
                  value={newEdu.description}
                  onChange={handleChange}
                  rows={6}
                />
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div
            className={`w-full flex items-center border-t border-[#cfe3e0]/20 py-2 mt-2 ${
              showDelete ? "justify-between" : "justify-end"
            }`}
          >
            {showDelete && editIndex !== -1 && (
              <div
                onClick={() => handleDeleteEducation(editIndex as number)}
                className="flex item-center gap-1 text-red-500 cursor-pointer"
              >
                <Trash2 /> <span>Delete the existing information</span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditIndex(null);
                  resetEducationForm();
                }}
                className="px-8 py-2 rounded-md cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleSaveEducation}
                className="px-8 py-2 border-2 rounded-md cursor-pointer flex gap-2 items-center bg-[#f2825c] border-[#f2825c] text-white"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cards */}
      {formData.education.length > 0 && editIndex === null && (
        <div className="flex flex-col gap-3">
          {formData.education.map((edu, idx) => (
            <div
              key={idx}
              className="w-full bg-white rounded-lg p-4 flex justify-between items-start shadow-sm border border-gray-100"
            >
              <div className="flex gap-4 w-[90%]">
                <div className="w-[15%] h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
                  <Image src={eduIcon} alt="education" />
                </div>

                <div className="flex flex-col gap-1 w-[75%]">
                  <h2 className="text-md font-semibold text-[#1E1E1E]">
                    {edu.institution}
                  </h2>

                  <p className="text-sm font-semibold text-[#333]">
                    {edu.degree} — {edu.fieldOfStudy}
                  </p>

                  <p className="text-sm font-medium text-[#17383d]/50">
                    {formatDate(edu.startDate)} – {formatDate(edu.endDate)}
                  </p>

                  {edu.activitiesAndSocieties && (
                    <>
                      <p className="text-xs font-semibold mt-1">
                        Activities and Societies
                      </p>
                      <p className="text-[11px] leading-[14px] text-[#777]">
                        {edu.activitiesAndSocieties}
                      </p>
                    </>
                  )}

                  {edu.description && (
                    <>
                      <p className="text-xs font-semibold mt-1">Description</p>
                      <p className="text-[11px] leading-[14px] text-[#777]">
                        {edu.description}
                      </p>
                    </>
                  )}
                </div>
              </div>

              <button onClick={() => handleEditEducation(idx)}>
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
      {formData.education.length === 0 && editIndex === null && (
        <div className="w-full rounded-lg bg-white p-5 flex items-center gap-12">
          <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
            <Image src={eduIcon} alt="education" />
          </div>

          <button
            onClick={() => setEditIndex(-1)}
            className="text-[#f2825c] font-medium cursor-pointer"
          >
            + Add Education
          </button>
        </div>
      )}
    </div>
  );
};

export default EducationSection;
