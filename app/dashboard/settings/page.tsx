"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { Lock, Eye, EyeOff, Loader2, Trash2, AlertTriangle, X } from "lucide-react";
import { toast } from "sonner";
import OtpInput from "react-otp-input";

const SettingsPage = () => {
    const router = useRouter();

    // Password Change State
    const [loading, setLoading] = useState(false);
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
    });

    // Delete Account State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteStep, setDeleteStep] = useState<"warning" | "otp">("warning");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteOtp, setDeleteOtp] = useState("");

    // Password Handlers
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords do not match");
            return;
        }
        if (formData.newPassword.length < 8) {
            toast.error("Password must be at least 8 characters");
            return;
        }

        setLoading(true);
        try {
            // Direct password change without OTP
            const res = await api.post("/users/change-password", formData);
            toast.success(res.data.message || "Password updated successfully");

            // Clear form
            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: "",
            });
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    // Delete Account Handlers
    const openDeleteModal = () => {
        setDeleteModalOpen(true);
        setDeleteStep("warning");
        setDeleteOtp("");
    };

    const closeDeleteModal = () => {
        setDeleteModalOpen(false);
        setDeleteStep("warning");
        setDeleteOtp("");
    };

    const handleSendDeleteOtp = async () => {
        setDeleteLoading(true);
        try {
            await api.get("/users/delete-account");
            toast.success("Verification code sent to your email");
            setDeleteStep("otp");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to initiate delete process");
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (deleteOtp.length !== 6) {
            toast.error("Please enter a valid 6-digit OTP");
            return;
        }
        setDeleteLoading(true);
        try {
            await api.post("/users/confirm-delete-account", { OTP: deleteOtp });

            toast.success("Account deleted successfully");

            // Cleanup and Redirect
            localStorage.removeItem("user");
            localStorage.removeItem("token");
            router.push("/login");
        } catch (error: any) {
            console.error(error);
            toast.error(error.response?.data?.message || "Failed to delete account");
        } finally {
            setDeleteLoading(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto py-8 space-y-8">
            <h1 className="text-2xl font-bold text-[#1E1E1E]">Settings</h1>

            {/* Change Password Section */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-[#fff0ea] rounded-lg">
                        <Lock className="w-5 h-5 text-[#f2825c]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#1E1E1E]">Change Password</h2>
                        <p className="text-sm text-gray-500">
                            Ensure your account is using a long, random password to stay secure.
                        </p>
                    </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 max-w-md">
                    {/* Current Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Current Password</label>
                        <div className="relative">
                            <input
                                type={showCurrentPassword ? "text" : "password"}
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#f2825c]/20 focus:border-[#f2825c] outline-none transition-all text-sm"
                                placeholder="Enter current password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* New Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">New Password</label>
                        <div className="relative">
                            <input
                                type={showNewPassword ? "text" : "password"}
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#f2825c]/20 focus:border-[#f2825c] outline-none transition-all text-sm"
                                placeholder="Enter new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Confirm New Password</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#f2825c]/20 focus:border-[#f2825c] outline-none transition-all text-sm"
                                placeholder="Confirm new password"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                            >
                                {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#f2825c] text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-[#f2825c]/85 transition-colors flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            Update Password
                        </button>
                    </div>
                </form>
            </div>

            {/* Delete Account Section */}
            <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-red-100 rounded-lg">
                        <Trash2 className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-red-700">Delete Account_</h2>
                        <p className="text-sm text-red-600/80">
                            Permanently delete your account and all associated data.
                        </p>
                    </div>
                </div>

                <p className="text-sm text-gray-600 mb-6 max-w-2xl leading-relaxed">
                    Once you delete your account, there is no going back. Please be certain.
                    All your personal data, interview history, and certificates will be permanently removed.
                </p>

                <button
                    onClick={openDeleteModal}
                    className="bg-white border border-red-200 text-red-600 px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-red-600 hover:text-white transition-colors"
                >
                    Delete Account
                </button>
            </div>

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 bg-[#17383d]/45 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                        {/* Close Button */}
                        <button
                            onClick={closeDeleteModal}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={20} />
                        </button>

                        <div className="p-6">
                            {deleteStep === "warning" ? (
                                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                        <AlertTriangle className="w-8 h-8 text-red-600" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900">Are you absolutely sure?</h3>

                                    <p className="text-sm text-gray-500">
                                        This action cannot be undone. This will permanently delete your
                                        account and remove your data from our servers.
                                    </p>

                                    <div className="flex w-full gap-3 pt-4">
                                        <button
                                            onClick={closeDeleteModal}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSendDeleteOtp}
                                            disabled={deleteLoading}
                                            className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center text-center space-y-4 pt-2">
                                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-2">
                                        <Lock className="w-8 h-8 text-red-600" />
                                    </div>

                                    <h3 className="text-xl font-bold text-gray-900">Verify Deletion</h3>

                                    <p className="text-sm text-gray-500">
                                        Please enter the 6-digit verification code sent to your email to confirm deletion.
                                    </p>

                                    <div className="py-4">
                                        <OtpInput
                                            value={deleteOtp}
                                            onChange={setDeleteOtp}
                                            numInputs={6}
                                            renderInput={(props) => (
                                                <input
                                                    {...props}
                                                    className="border border-gray-300 mx-1 text-xl font-bold rounded-md flex items-center justify-center w-8 h-10 sm:w-10 sm:h-12 text-center focus:border-red-500 focus:ring-1 focus:ring-red-500 outline-none transition-all"
                                                />
                                            )}
                                        />
                                    </div>

                                    <div className="flex w-full gap-3 pt-2">
                                        <button
                                            onClick={() => setDeleteStep("warning")}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={handleConfirmDelete}
                                            disabled={deleteLoading || deleteOtp.length !== 6}
                                            className="flex-1 px-4 py-2.5 bg-red-600 rounded-lg text-sm font-medium text-white hover:bg-red-700 disabled:opacity-70 flex items-center justify-center gap-2"
                                        >
                                            {deleteLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                            Verify & Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsPage;
