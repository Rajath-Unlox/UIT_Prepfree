"use client";
import React, { useRef, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash, Camera, Pen, Trash2 } from "lucide-react";
import certIcon from "@/public/images/profile/certIcon.png";
import axios from "axios";
import api from "@/lib/api";

export interface Media {
  name: string;
  url: string;
}

interface Certification {
  id?: number;
  title: string;
  issuer?: string;
  credentialId?: string;
  credentialUrl?: string;
  startDate?: string;
  endDate?: string;
  media: Media[];
}

interface FormData {
  certifications: Certification[];
}

const CertificationSection = ({ formData, setFormData, user }: any) => {
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [showDelete, setShowDelete] = useState(false);

  const [newExp, setNewExp] = useState<Certification>({
    id: Date.now(),
    title: "",
    issuer: "",
    credentialId: "",
    credentialUrl: "",
    startDate: "",
    endDate: "",
    media: [],
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setNewExp((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetForm = () => {
    setNewExp({
      id: Date.now(),
      title: "",
      issuer: "",
      credentialId: "",
      credentialUrl: "",
      startDate: "",
      endDate: "",
      media: [],
    });
  };

  const handleSave = async () => {
    if (!newExp.title || !newExp.startDate || !newExp.endDate)
      return alert("Please fill required fields!");

    let updated: Certification[] = [...formData.certifications];

    if (editIndex !== null && editIndex !== -1) {
      updated[editIndex] = newExp;
    } else {
      updated.push({ ...newExp, id: Date.now() });
    }

    // FIX 1
    setFormData({ ...formData, certifications: updated });

    // reset UI
    setEditIndex(null);
    resetForm();

    try {
      const token = localStorage.getItem("token");

      // FIX 2
      await api.post("/users/update-profile", { certifications: updated });

      // Keep UI consistent
      user.certifications = updated;
    } catch (error) {
      console.error("Error updating certification:", error);
    }
  };

  const handleEdit = (idx: number) => {
    setEditIndex(idx);
    const cert = user.certifications[idx];

    setNewExp({
      id: cert.id || Date.now(),
      title: cert.title || "",
      issuer: cert.issuer || "",
      credentialId: cert.credentialId || "",
      credentialUrl: cert.credentialUrl || "",
      startDate: cert.startDate || "",
      endDate: cert.endDate || "",
      media: cert.media || [],
    });

    setShowDelete(true);
  };

  const handleDelete = async (idx: number) => {
    const updated = formData.certifications.filter(
      (_: any, i: any) => i !== idx
    );

    // FIX 1 again
    setFormData({ ...formData, certifications: updated });

    try {
      const token = localStorage.getItem("token");

      // FIX 2
      await api.post("/users/update-profile", { certifications: updated });

      // FIX 3
      user.certifications = updated;
    } catch (error) {
      console.error("Error deleting certification:", error);
    }

    setEditIndex(null);
    resetForm();
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
    formData2.append("certificationMedia", file);

    try {
      const res = await api.post(
        "/users/certification-media-staging",
        formData2,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );

      console.log("Uploaded", res.data);

      // Backend returns:
      // { name: "...", url: "..." }

      const uploadedMedia = {
        name: res.data.fileName,
        url: res.data.imageUrl,
        s3Key: res.data.imageKey,
      };

      // PUSH to newExp.media
      setNewExp((prev) => ({
        ...prev,
        media: [...prev.media, uploadedMedia],
      }));
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteMedia = (index: number) => {
    setNewExp((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="w-full flex flex-col gap-2">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-[#1E1E1E] font-bold text-lg">Certification</h1>

        {user?.certifications?.length > 0 && editIndex === null && (
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
          <div className="w-full flex gap-4">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={certIcon} alt="" className="w-1/2" />
            </div>

            <div className="w-[80%] flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label>
                  Name<span className="text-[#FF2828]">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={newExp.title}
                  onChange={handleChange}
                  placeholder="xyz"
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Issuing organization</label>
                <input
                  type="text"
                  name="issuer"
                  value={newExp.issuer}
                  onChange={handleChange}
                  placeholder="xyz"
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Credential ID</label>
                <input
                  type="text"
                  name="credentialId"
                  value={newExp.credentialId}
                  onChange={handleChange}
                  placeholder="xyz"
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label>Credential URL</label>
                <input
                  type="text"
                  name="credentialUrl"
                  value={newExp.credentialUrl}
                  onChange={handleChange}
                  placeholder="xyz"
                  className="border rounded-md p-2"
                />
              </div>

              <div className="flex flex-col gap-1 w-[70%]">
                <label>
                  Start Date<span className="text-[#FF2828]">*</span>
                </label>
                <div className="flex gap-4 w-1/2">
                  <input
                    type="date"
                    name="startDate"
                    value={newExp.startDate}
                    onChange={handleChange}
                    className="border rounded-md p-2"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1 w-[70%]">
                <label>
                  End Date<span className="text-[#FF2828]">*</span>
                </label>
                <div className="flex gap-4 w-1/2">
                  <input
                    type="date"
                    name="endDate"
                    value={newExp.endDate}
                    onChange={handleChange}
                    className="border rounded-md p-2"
                  />
                </div>
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

                {newExp.media.length > 0 && (
                  <div className="flex flex-wrap gap-3 mt-3">
                    {newExp.media.map((m, index) => (
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
            </div>
          </div>

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
      {user?.certifications?.length > 0 && editIndex === null && (
        <div className="flex flex-col gap-3">
          {user?.certifications?.map((cert: any, idx: any) => (
            <div
              key={idx}
              className="w-full bg-white rounded-lg p-4 flex justify-between items-start shadow-sm border border-gray-100"
            >
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
                  <Image src={certIcon} alt="experience" />
                </div>

                <div className="flex flex-col">
                  <h2 className="text-sm font-semibold text-[#1E1E1E]">
                    {cert.title}
                  </h2>
                  <p className="text-sm font-medium text-[#777]">
                    {cert.issuer}
                  </p>
                  <p className="text-sm text-[#555]">{cert.credentialId}</p>
                  <p className="text-sm text-[#777] font-medium">
                    <span className="font-semibold text-[#17383d]">
                      Certificate Duration:{" "}
                    </span>
                    {formatDate(cert.startDate)} - {formatDate(cert.endDate)}
                  </p>

                  <p className="text-sm text-[#f2825c] font-medium">
                    {cert.credentialUrl}
                  </p>

                  {cert.media?.length > 0 && (
                    <div className="flex gap-3 flex-wrap mt-2">
                      {cert.media.map((m: any, index: any) => (
                        <div
                          key={index}
                          className="bg-[#F8F8F8] rounded-md w-[160px] h-[90px] flex items-center justify-center"
                        >
                          <img
                            src={m.url}
                            alt={m.name}
                            className="w-full h-full object-cover rounded-md"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => handleEdit(idx)}>
                  <Pen
                    size={18}
                    className="text-[#17383d] cursor-pointer hover:text-[#f2825c]"
                  />
                </button>

                {/* DELETE BUTTON READY */}
                {/* <button onClick={() => handleDelete(idx)}>
                  <Trash size={18} className="text-[#FF2828]" />
                </button> */}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {user?.certifications?.length === 0 && editIndex === null && (
        <div className="w-full h-auto rounded-lg overflow-hidden bg-white p-5">
          <div className="flex gap-12 items-center">
            <div className="w-24 h-24 bg-[#EDEDED] rounded-sm flex items-center justify-center">
              <Image src={certIcon} alt="experience" />
            </div>

            <button
              onClick={() => setEditIndex(-1)}
              className="text-[#f2825c] font-medium cursor-pointer"
            >
              + Add Certification
            </button>
          </div>

          <div className="flex gap-1 mt-1 items-center">
            <input type="checkbox" />
            <h1 className="text-[#666666]">I don’t have Certification</h1>
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificationSection;
