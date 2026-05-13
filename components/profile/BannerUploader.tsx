"use client";

import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { Camera } from "lucide-react";
import axios from "axios";
import api from "@/lib/api";

// Convert Base64 → File
const base64ToFile = (base64: string, fileName: string) => {
  const arr = base64.split(",");
  const mime = arr[0].match(/:(.*?);/)![1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) u8arr[n] = bstr.charCodeAt(n);
  return new File([u8arr], fileName, { type: mime });
};

// Crop Utility
export const getCroppedImg = (
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  aspectRatio: number = 16 / 9
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.crossOrigin = "anonymous";

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      const outputWidth = 1200;
      const outputHeight = outputWidth / aspectRatio;

      canvas.width = outputWidth;
      canvas.height = outputHeight;

      ctx.drawImage(
        image,
        crop.x,
        crop.y,
        crop.width,
        crop.height,
        0,
        0,
        outputWidth,
        outputHeight
      );

      const base64Image = canvas.toDataURL("image/jpeg", 0.9);
      resolve(base64Image);
    };

    image.onerror = reject;
  });
};

const BannerImageUploader = ({ user }: { user: any }) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showCropModal, setShowCropModal] = useState(false);
  const [finalImage, setFinalImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Load initial banner
  useEffect(() => {
    const banner = user?.profileInfo?.bannerImageUrl;
    if (banner) setFinalImage(banner);
  }, [user]);

  const handleCamClick = () => {
    document.getElementById("bannerInput")?.click();
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

  // Crop + Upload
  const handleCropComplete = useCallback(async () => {
    try {
      setLoading(true);

      const croppedImage = await getCroppedImg(imageSrc!, croppedAreaPixels);

      setShowCropModal(false);

      const file = base64ToFile(croppedImage, "banner.jpg");

      const formData = new FormData();
      formData.append("bannerImage", file);

      const token = localStorage.getItem("token");

      const res = await api.post("/users/upload-banner-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // backend returns updated user
      const updatedBannerUrl = res.data.user.profileInfo.bannerImageUrl;
      setFinalImage(updatedBannerUrl);

      localStorage.setItem("user", JSON.stringify(res.data.user));
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setLoading(false);
    }
  }, [croppedAreaPixels, imageSrc]);

  const handleRemoveBanner = async () => {
    try {
      setLoading(true);

      const res = await api.delete("/users/delete-banner-image");

      // backend returns updated user
      const updatedUser = res.data.user;

      setFinalImage(null);
      localStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (err) {
      console.error("Remove banner failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full h-36 bg-gray-200 rounded-lg overflow-hidden">
      {finalImage ? (
        <img
          src={finalImage}
          alt="Banner"
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          No banner uploaded
        </div>
      )}

      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={handleCamClick}
          className="bg-[#17383d]/45 flex gap-1 items-center text-white p-2 rounded-md"
        >
          <Camera size={18} />
          <span>{loading ? "Uploading..." : "Upload"}</span>
        </button>

        {finalImage && (
          <button
            onClick={handleRemoveBanner}
            className="bg-[#A32108] text-white px-3 py-2 rounded-md"
            disabled={loading}
          >
            Remove
          </button>
        )}
      </div>

      <input
        id="bannerInput"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {showCropModal && (
        <div className="fixed inset-0 z-50 bg-[#17383d]/70 flex items-center justify-center">
          <div className="bg-white rounded-lg p-4 w-[90%] max-w-3xl flex flex-col gap-4">
            <div className="relative w-full h-[400px] bg-gray-200 rounded-md overflow-hidden">
              <Cropper
                image={imageSrc!}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={(_: any, area: any) =>
                  setCroppedAreaPixels(area)
                }
              />
            </div>

            <div className="flex justify-between">
              <button
                className="px-4 py-2 bg-gray-300 rounded"
                onClick={() => setShowCropModal(false)}
              >
                Cancel
              </button>

              <button
                className="px-4 py-2 bg-[#f2825c] text-white rounded"
                onClick={handleCropComplete}
              >
                Save & Upload
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BannerImageUploader;
