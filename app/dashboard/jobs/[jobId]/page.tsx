"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import compLogo from "@/public/images/compLogo.png";
import {
  Bookmark,
  Mail,
  MapPin,
  Loader2,
  CheckCircle,
  Phone,
  Building,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { toast, Toaster } from "react-hot-toast";

interface JobDetails {
  id: string;
  title: string;
  comName: string;
  domain: string;
  compLogo: any;
  location: string;
  salary: string;
  range: string;
  jobType: string;
  description: string;
  responsibilities: string[];
  skills: string[];
  aboutCompany: string;
  email: string;
  isApplied: boolean;
  isSaved: boolean;
  applicationStatus: string | null;
  phone: string;
  industry: string;
  post_type: string;
}

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const resolveJobId = (job: any): string =>
  job?.uuid || job?.UUID || job?.id || "";

const Page = () => {
  const params = useParams();

  const [job, setJob] = useState<JobDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [recommendedJobs, setRecommendedJobs] = useState<any[]>([]);
  const [applying, setApplying] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const extractedJobId = Array.isArray(params?.jobId)
      ? params.jobId[0]
      : params?.jobId;

    if (!extractedJobId) return;

    const fetchJobDetails = async () => {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;

        const response = await fetch(`${API_BASE_URL}/jobs/${extractedJobId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await response.json();

        if (data.success && data.job) {
          const apiJob = data.job;
          const jobMeta = data.job;

          setJob({
            id: resolveJobId(apiJob),
            title: apiJob.job_title || "Job Title",
            comName: apiJob.org?.org_name || "Company Name",
            industry: apiJob.org?.industry || "N/A",
            domain: apiJob.post_type || "N/A",
            compLogo: apiJob.org?.org_logo || compLogo,
            location: apiJob.org?.org_city || "N/A",
            salary: `₹${apiJob.min_fixed_ctc} - ₹${apiJob.max_fixed_ctc}`,
            range: apiJob.job_mode || "N/A",
            jobType: apiJob.job_type || "N/A",
            description: apiJob.description || "No description available.",
            responsibilities: apiJob.perks || ["Not provided"],
            skills: apiJob.skills || [],
            aboutCompany:
              apiJob.org?.org_description ||
              "No company description available.",
            email: apiJob.email || "N/A",
            isApplied: jobMeta.isApplied,
            isSaved: jobMeta.isSaved,
            applicationStatus: jobMeta.applicationStatus,
            phone: jobMeta.contact_number,
            post_type: apiJob.post_type,
          });
        }

        const recResponse = await fetch(`${API_BASE_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const recData = await recResponse.json();

        if (recData.success) {
          setRecommendedJobs(
            recData.jobs
              .slice(0, 5)
              .map((j: any) => {
                const resolvedId = resolveJobId(j);
                return {
                  id: resolvedId,
                  comName: j.org?.org_name,
                  domain: j.job_role,
                  compLogo: j.org?.org_logo || compLogo,
                  salary: j.salary_range || "$TBD",
                  min_salary: j.min_fixed_ctc || "",
                  max_salary: j.max_fixed_ctc || "",
                  jobType: j.job_type || "Full-Time",
                  href: `/dashboard/jobs/${resolvedId}`,
                  isSaved: j.isSaved,
                  jobTitle: j.job_title,
                };
              })
              .filter((j: any) => Boolean(j.id))
          );
        }
      } catch (error) {
        console.error("Error fetching job details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [params]);

  const contactItems = [
    {
      icon: <Building className="text-[#184852]" size={20} />,
      value: job?.industry,
      label: "Industry",
    },
    {
      icon: <Briefcase className="text-[#184852]" size={20} />,
      value: job?.jobType,
      label: "Job Type",
    },
    {
      icon: <MapPin className="text-[#184852]" size={20} />,
      value: job?.location,
      label: "Location",
    },
  ];

  const handleApply = async () => {
    if (!job || job.isApplied || !job.id) return;

    setApplying(true);
    const toastId = toast.loading("Applying for job...");

    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API_BASE_URL}/jobs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_uuid: job.id }),
      });

      const data = await response.json();

      if (data.success) {
        setJob({ ...job, isApplied: true, applicationStatus: "applied" });
        toast.success("Job applied successfully 🎉", { id: toastId });
      } else {
        toast.error(data.message || "Failed to apply for the job", {
          id: toastId,
        });
      }
    } catch (error) {
      console.error("Apply error:", error);
      toast.error("Something went wrong. Please try again.", { id: toastId });
    } finally {
      setApplying(false);
    }
  };

  const handleSave = async () => {
    if (!job || !job.id) return;
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/jobs/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_uuid: job.id }),
      });
      const data = await response.json();
      if (data.success) {
        setJob({ ...job, isSaved: !job.isSaved });
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F2F2F2]">
        <Loader2 className="animate-spin text-[#f2825c]" size={40} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-[#F2F2F2]">
        <h1 className="text-xl font-bold text-[#f2825c]">Job not found</h1>
      </div>
    );
  }

  return (
    <main className="w-full py-2 flex flex-col gap-4 bg-[#F2F2F2]">
      <Toaster position="top-right" />

      {/* ── Hero Card ── */}
      <section className="w-full h-[230px] border border-[#cfe3e0]/20 rounded-lg overflow-hidden bg-white">
        {/* Banner — navy instead of the old green gradient */}
        <div className="w-full h-[40%] bg-gradient-to-r from-[#f2825c] via-[#f2825c]/30 to-[#f2825c]/7" />

        <div className="flex items-end justify-between h-[60%] px-10 pb-4">
          <div className="flex flex-col gap-0 z-10">
            {/* Company logo box */}
            <div className="bg-white h-24 w-24 border border-[#cfe3e0]/20 rounded-lg flex items-center justify-center">
              <div className="w-12 h-12 bg-[#F2F2F2] rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                <Image
                  src={job.compLogo}
                  alt="company logo"
                  className="w-full h-full object-contain"
                  width={50}
                  height={50}
                />
              </div>
            </div>

            <h1 className="text-lg text-[#18191C] font-bold mt-2">
              {job.title}
            </h1>
            <p className="text-md text-[#f2825c] font-medium">{job.comName}</p>
            <div className="flex gap-1 items-center">
              <MapPin size={15} className="text-[#184852]" />
              <p className="text-sm text-[#767F8C]">{job.location}</p>
            </div>
          </div>

          <div className="flex gap-2">
            {/* Save button — cream background */}
            <button
              onClick={handleSave}
              disabled={saving}
              className={`border rounded-full px-8 py-2 text-sm cursor-pointer font-medium transition-colors ${job.isSaved
                ? "bg-[#f2825c] border-[#f2825c] text-white"
                : "bg-[#f7fbfa] border-[#f7fbfa] text-[#f2825c] hover:bg-[#f7fbfa]/70"
                }`}
            >
              {saving ? "..." : job.isSaved ? "Saved" : "Save"}
            </button>

            {/* Apply button — crimson */}
            <button
              onClick={handleApply}
              disabled={job.isApplied || applying}
              className={`rounded-full px-8 py-2 text-sm cursor-pointer font-medium flex items-center gap-2 transition-colors ${job.isApplied
                ? "bg-[#f2825c] text-white opacity-80 cursor-not-allowed"
                : "bg-[#184852] text-white hover:bg-[#184852]/85"
                }`}
            >
              {applying ? (
                <Loader2 className="animate-spin w-4 h-4" />
              ) : job.isApplied ? (
                <>
                  <CheckCircle className="w-4 h-4" /> Applied
                </>
              ) : (
                "Apply Now"
              )}
            </button>
          </div>
        </div>
      </section>

      {/* ── Body ── */}
      <section className="w-full flex gap-4">
        {/* Left column */}
        <div className="w-[70%] flex flex-col gap-4">

          {/* About / Benefits / Skills */}
          <div className="w-full rounded-lg border border-[#cfe3e0]/20 p-8 h-full bg-white">
            <h1 className="text-lg text-[#f2825c] font-bold">
              About the Job Role
            </h1>
            <p className="text-md text-[#18191C] mt-3 whitespace-pre-wrap">
              {job.description}
            </p>

            <h1 className="text-lg text-[#f2825c] font-bold mt-6">Benefits</h1>
            <ul className="list-disc pl-6 mt-3">
              {job.responsibilities.map((res, idx) => (
                <li key={idx} className="text-[#18191C] mb-1">
                  {res}
                </li>
              ))}
            </ul>

            <h1 className="text-lg text-[#f2825c] font-bold mt-6">Skills</h1>
            <div className="flex flex-wrap w-full gap-4 mt-2">
              {job.skills.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#fff0ea] rounded-full px-4 py-2"
                >
                  <h1 className="text-sm text-[#f2825c] font-medium">{item}</h1>
                </div>
              ))}
            </div>
          </div>

          {/* About Company */}
          <div className="w-full h-full flex items-center justify-between rounded-lg border border-[#cfe3e0]/20 p-8 bg-white">
            <div className="w-[80%]">
              <h1 className="text-lg text-[#f2825c] font-bold">
                About the Company
              </h1>
              <p className="text-md text-[#18191C] mt-3">{job.aboutCompany}</p>
            </div>

            <div className="flex flex-col items-center">
              <div className="bg-white h-24 w-24 border border-[#cfe3e0]/20 rounded-lg flex items-center justify-center">
                <div className="w-12 h-12 bg-[#F2F2F2] rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                  <Image
                    src={job.compLogo}
                    alt="company logo"
                    className="w-full h-full object-contain"
                    width={50}
                    height={50}
                  />
                </div>
              </div>
              <h1 className="text-sm text-[#f2825c] font-bold mt-4">
                {job.comName}
              </h1>
              <p className="text-xs text-[#767F8C]">{job.domain}</p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="w-[30%] flex flex-col gap-4">

          {/* Salary + Contact Info */}
          <div className="w-full rounded-lg border border-[#cfe3e0]/20 p-8 h-auto bg-white">
            <h1 className="text-lg text-[#f2825c] font-bold">
              {job.salary}{" "}
              <span className="text-[#767F8C] text-md font-normal">
                {job.post_type === "internship" ? "Per Month" : "Per Year"}
              </span>
            </h1>
            <p className="text-[#767F8C] text-md">Avg Salary</p>

            <div className="flex flex-col gap-4 mt-4">
              {contactItems.map((item, i) => (
                <div key={i} className="flex gap-2">
                  {/* Icon background — cream */}
                  <div className="bg-[#f7fbfa] p-2 rounded-md flex items-center justify-center">
                    {item.icon}
                  </div>
                  <div className="flex flex-col justify-center">
                    <h1 className="text-[#f2825c] text-sm font-medium capitalize">
                      {item.value}
                    </h1>
                    <p className="text-[#767F8C] text-xs">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommended Jobs */}
          <div className="w-full rounded-lg border border-[#cfe3e0]/20 p-8 h-auto bg-white">
            <h1 className="text-lg text-[#f2825c] font-bold">
              Recommended Jobs
            </h1>

            <div className="w-full h-auto flex flex-col gap-2 mt-2">
              {recommendedJobs.map((company, idx) => (
                <Link
                  key={idx}
                  href={company.href}
                  className="w-full px-2 shadow-xs py-2 bg-white rounded-lg flex flex-col gap-1 border border-[#cfe3e0]/8 hover:border-[#f2825c]/40 transition-colors"
                >
                  <h1 className="text-xs font-medium text-[#18191C]">
                    {company.domain}
                  </h1>

                  <div className="flex gap-2 items-center">
                    {/* Job type badge — navy */}
                    <div className="bg-[#fff0ea] px-2 py-1 rounded-full w-fit">
                      <p className="font-semibold text-[10px] leading-[12px] text-[#f2825c]">
                        {company.jobType?.toUpperCase()}
                      </p>
                    </div>
                    <p className="text-[#767F8C] text-[10px] leading-[12px]">
                      Salary: ₹{company.min_salary} - ₹{company.max_salary}
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-8 h-8 bg-[#F2F2F2] rounded-md flex items-center justify-center p-1 relative overflow-hidden">
                        <Image
                          src={company.compLogo}
                          alt="company logo"
                          className="w-full h-full object-contain"
                          width={32}
                          height={32}
                        />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h1 className="text-[#f2825c] text-[10px] leading-[12px] font-medium">
                          {company.comName}
                        </h1>
                        <p className="text-[#767F8C] text-[10px] leading-[12px]">
                          {company.jobTitle}
                        </p>
                      </div>
                    </div>

                    {/* Bookmark — crimson when saved */}
                    <Bookmark
                      className={`${company.isSaved
                        ? "text-[#184852] fill-[#184852]"
                        : "text-gray-300"
                        } cursor-pointer`}
                      size={15}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Page;