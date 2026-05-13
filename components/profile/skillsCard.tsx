"use client";
import React, { useState } from "react";
import Image from "next/image";
import axios from "axios";
import { X, Pen } from "lucide-react";
import fileIcon from "@/public/images/profile/fileIcon.png";
import api from "@/lib/api";

export interface SimpleItem {
  name: string;
}

interface FormData {
  skills: SimpleItem[];
}

const SkillsSection = ({ formData, setFormData, user }: any) => {
  const [editMode, setEditMode] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  /* -------------------------------------------
        ADD SKILL
  ------------------------------------------- */
  const handleAdd = () => {
    const skillName = newSkill.trim();
    if (!skillName) return alert("Please enter a skill!");

    if (
      formData.skills.some(
        (s: any) => s.name.toLowerCase() === skillName.toLowerCase()
      )
    )
      return alert("Skill already exists!");

    setFormData({
      ...formData,
      skills: [...formData.skills, { name: skillName }],
    });

    setNewSkill("");
  };

  /* -------------------------------------------
        DELETE
  ------------------------------------------- */
  const handleDelete = async (idx: number) => {
    const updated = formData.skills.filter((_: any, i: number) => i !== idx);
    setFormData({ ...formData, skills: updated });

    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", { skills: updated });

      user.skills = updated;
    } catch (err) {
      console.error("Error deleting skill:", err);
    }
  };

  /* -------------------------------------------
        SAVE BUTTON → HIT API
  ------------------------------------------- */
  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", {
        skills: formData.skills,
      });

      // update user object (for UI consistency)
      user.skills = formData.skills;
    } catch (err) {
      console.error("Error updating skills:", err);
    }

    setEditMode(false);
  };

  /* -------------------------------------------
        SUGGESTED SKILLS
  ------------------------------------------- */
  const handleSelectSuggested = (item: string) => {
    if (
      formData.skills.some(
        (s: any) => s.name.toLowerCase() === item.toLowerCase()
      )
    )
      return;

    setFormData({
      ...formData,
      skills: [...formData.skills, { name: item }],
    });
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[#1E1E1E] font-bold text-lg">Skills</h1>

        {user?.skills?.length > 0 && !editMode && (
          <button
            onClick={() => setEditMode(true)}
            className="flex items-center gap-1 cursor-pointer text-[#17383d] hover:text-[#f2825c] font-medium"
          >
            <Pen size={16} /> Edit
          </button>
        )}
      </div>

      {/* EMPTY STATE */}
      {user?.skills?.length === 0 && !editMode && (
        <div className="w-full mb-10 rounded-lg bg-white p-5">
          <div className="flex gap-12 items-center">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={fileIcon} alt="skills" className="w-1/2" />
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="text-[#f2825c] font-medium cursor-pointer"
            >
              + Add Skills
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {editMode && (
        <div className="w-full rounded-lg bg-white p-5 flex flex-col gap-3 mb-8">
          <div className="flex flex-col gap-1">
            <label>
              Skill<span className="text-[#FF2828]">*</span>
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Enter skill"
                className="border rounded-md py-2 px-3 w-full"
              />

              <button
                onClick={handleAdd}
                className="px-5 py-2 bg-[#f2825c] text-white rounded-md font-medium"
              >
                Add
              </button>
            </div>
          </div>

          {/* Existing Editable Skills */}
          {formData.skills.length > 0 && (
            <div className="flex flex-wrap gap-3 bg-[#fff0ea] p-4 rounded-lg">
              {formData?.skills?.map((skill: any, idx: number) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-white border-2 border-[#f2825c] px-4 py-2 rounded-full text-[#f2825c]"
                >
                  <span>{skill.name}</span>
                  <button onClick={() => handleDelete(idx)}>
                    <X size={14} className="text-[#FF2828]" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Suggested */}
          <div className="w-full bg-[#fff0ea] rounded-xl p-5">
            <h1 className="text-lg font-medium">Suggested by your profile</h1>
            <p className="text-sm text-[#17383d]/40">Add Your Best 6 Skills</p>

            <div className="flex flex-wrap gap-2 mt-2">
              {[
                "JavaScript",
                "React",
                "Node.js",
                "Python",
                "SQL",
                "Data Analytics",
              ].map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectSuggested(item)}
                  className="cursor-pointer bg-white border-2 border-[#f2825c] px-4 py-2 rounded-full text-[#f2825c]"
                >
                  + {item}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end border-t border-[#cfe3e0]/20 pt-3">
            <button onClick={() => setEditMode(false)} className="px-8 py-2">
              Cancel
            </button>

            <button
              onClick={handleSave}
              className="px-8 py-2 bg-[#f2825c] text-white border-2 border-[#f2825c] rounded-md ml-2"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* VIEW MODE */}
      {!editMode && user?.skills?.length > 0 && (
        <div className="flex flex-wrap gap-3 bg-white p-5 rounded-xl">
          {user?.skills?.map((skill: any, idx: number) => (
            <div
              key={idx}
              className="bg-[#fff0ea] text-[#f2825c] font-medium text-sm px-4 py-2 rounded-full"
            >
              {skill.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
