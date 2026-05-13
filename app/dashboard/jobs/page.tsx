"use client";
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  ListFilter,
  X,
  Loader2,
} from "lucide-react";
import React, { useState, useEffect } from "react";
import compLogo from "@/public/images/compLogo.png";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";

interface Job {
  id: string;
  comName: string;
  domain: string;
  compLogo: any;
  location: string;
  salary: string;
  range: string;
  jobType: string;
  isApplied: boolean;
  isSaved: boolean;
  href: string;
  jobTitle: string;
}

const tabs = [
  { id: "all", label: "All Jobs" },
  { id: "applied", label: "Applied Jobs" },
  { id: "saved", label: "Saved Jobs" },
];

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const resolveJobId = (job: any): string =>
  job?.uuid || job?.UUID || job?.id || "";
const ITEMS_PER_PAGE = 12;

const Page = () => {
  const [activeTab, setActiveTab] = useState("all");
  const [tabName, setTabName] = useState("All Jobs");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1, limit: 12, totalItems: 0, totalPages: 0, hasNext: false, hasPrev: false
  });

  // Fetch Jobs Integration
  useEffect(() => {
    const fetchJobs = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(
          `${API_BASE_URL}/jobs?tab=${activeTab}&page=${currentPage}&limit=12`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await response.json();

        if (data.success) {
          const mappedJobs = (data.jobs || [])
            .map((job: any) => {
              const resolvedId = resolveJobId(job);
              return {
                id: resolvedId,
                comName: job.org?.org_name || "N/A",
                domain: job.post_type || "N/A",
                compLogo: job.org?.org_logo || compLogo,
                location: job.org?.org_city || "N/A",
                salary: `${job.min_fixed_ctc || "N/A"} - ${job.max_fixed_ctc || "N/A"}`,
                range: job.min_exp || "N/A",
                jobType: job.job_type || "FULL-TIME",
                isApplied: job.isApplied,
                isSaved: job.isSaved,
                jobTitle: job.job_title,
                href: `/dashboard/jobs/${resolvedId}`,
              };
            })
            .filter((job: Job) => Boolean(job.id));
          setJobs(mappedJobs);
          if (data.pagination) {
            setPagination(data.pagination);
          } else {
            // Fallback: old API returns all jobs — compute pagination client-side
            const LIMIT = 12;
            const total = mappedJobs.length;
            const totalPagesCalc = Math.max(1, Math.ceil(total / LIMIT));
            setPagination({
              page: currentPage,
              limit: LIMIT,
              totalItems: total,
              totalPages: totalPagesCalc,
              hasNext: currentPage < totalPagesCalc,
              hasPrev: currentPage > 1,
            });
          }

        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, [activeTab, currentPage]);

  // Handle Save Toggle
  const toggleSave = async (
    e: React.MouseEvent,
    jobId: string,
    currentStatus: boolean
  ) => {
    e.preventDefault(); // Prevent navigation
    if (!jobId) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/jobs/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_uuid: jobId }),
      });

      const data = await response.json();
      if (data.success) {
        setJobs((prevJobs) =>
          prevJobs.map((job) =>
            job.id === jobId ? { ...job, isSaved: !currentStatus } : job
          )
        );
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const filteredCompanies = jobs; // Already filtered by API
  const totalPages = pagination.totalPages;

  const [filterOpen, setFilterOpen] = useState(false);

  const jobTypeCounts = jobs.reduce((acc: any, company: any) => {
    acc[company.jobType] = (acc[company.jobType] || 0) + 1;
    return acc;
  }, {});

  const jobRoleCounts = jobs.reduce((acc: any, company: any) => {
    acc[company.domain] = (acc[company.domain] || 0) + 1;
    return acc;
  }, {});

  const handleClick = () => {
    setFilterOpen((prev: boolean) => !prev);
  };


  const getVisiblePages = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
    return Array.from({ length: 5 }, (_, i) => start + i);
  };

  return (
    <main className="w-full flex">
      {/* Header Buttons */}
      <div className="w-full flex flex-col">
        <section className="w-full flex items-end justify-between relative">
          <div className="flex rounded-md overflow-hidden border-2 border-[#cfe3e0]/20">
            {tabs.map((tab, idx) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setTabName(tab.label);
                  setCurrentPage(1);
                }}
                className={`
        w-fit px-6 py-3 cursor-pointer transition-colors duration-200
        ${activeTab === tab.id
                    ? "bg-[#f7fbfa] font-semibold"
                    : "bg-white text-gray-700"
                  }
        ${idx !== tabs.length - 1 ? "border-r-2 border-[#cfe3e0]/20" : ""}
        hover:bg-[#FFDC85]/50
      `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleClick}
            className={`flex items-center gap-2 text-[#0066ff] pr-2 cursor-pointer ${filterOpen ? "hidden" : ""
              }`}
          >
            <ListFilter size={14} />
            <h1 className="underline">Filter</h1>
          </button>
        </section>

        <h1 className="text-lg font-bold py-4">{tabName}</h1>

        {/* Loading State */}
        {loading ? (
          <div className="w-full h-64 flex items-center justify-center">
            <Loader2 className="animate-spin text-gray-400" size={40} />
          </div>
        ) : (
          <div className="flex flex-col">
            {/* Job Cards Grid */}
            <div>
              <section
                className={`w-full grid gap-4 transition-transform duration-500 ease-in-out ${filterOpen ? "grid-cols-3 pr-4" : "grid-cols-4"}`}
              >
                {jobs.map((company) => (
                  <Link
                    key={company.id}
                    href={company.href}
                    className="row-span-1 col-span-1 px-4 py-2 bg-white rounded-lg"
                  >
                    <div className="flex items-center justify-between border-b border-[#cfe3e0]/8 py-2">
                      <div className="flex gap-2">
                        <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                          <Image
                            src={company.compLogo || compLogo}
                            alt="company logo"
                            className="w-full h-full object-contain"
                            width={50}
                            height={50}
                          />
                        </div>
                        <div className="flex flex-col">
                          <h1 className="text-gray-900 text-md font-medium">
                            {company.comName}
                          </h1>
                          <p className="text-gray-500 text-sm">{company.domain}</p>
                        </div>
                      </div>
                      <button onClick={(e) => toggleSave(e, company.id, company.isSaved)}>
                        <Bookmark
                          className={`${company.isSaved ? "text-[#0066ff] fill-[#0066ff]" : "text-gray-300"} cursor-pointer transition-colors`}
                          size={24}
                        />
                      </button>
                    </div>
                    <h1 className="font-medium pl-2 text-sm">{company.jobTitle}</h1>
                    <div className="grid grid-cols-2 py-4 gap-6 px-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-sm">Location</p>
                        <p className="text-[#17383d] text-md truncate">{company.location}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-sm">Salary</p>
                        <p className="text-[#17383d] text-md truncate">{company.salary}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-sm">Experience</p>
                        <p className="text-[#17383d] text-md truncate">{company.range}</p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-sm">Job Type</p>
                        <div className="bg-[#184852]/25 px-2 py-1 rounded-full w-fit">
                          <p className="font-semibold text-xs text-[#184852]">
                            {company.jobType?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </section>

              {/* No jobs message */}
              {jobs.length === 0 && (
                <div className="text-center text-gray-500 mt-10">
                  No {activeTab} jobs found.
                </div>
              )}
            </div>

            {/* Pagination */}
            {jobs.length > 0 && (
              <div className="w-full flex flex-wrap items-center justify-center gap-2 py-6 mt-4 border-t border-[#cfe3e0]/10">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-md border border-[#cfe3e0]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>
                {getVisiblePages().map((pageNo) => (
                  <button
                    key={pageNo}
                    onClick={() => setCurrentPage(pageNo)}
                    className={`px-3 py-1 rounded-md border cursor-pointer ${currentPage === pageNo
                      ? "bg-[#f7fbfa] border-[#cfe3e0]/20 font-semibold"
                      : "border-[#cfe3e0]/20"
                      }`}
                  >
                    {pageNo}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage((p) => Math.min(Math.max(totalPages, 1), p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 rounded-md border border-[#cfe3e0]/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
                <span className="text-xs text-gray-400 ml-2">
                  Page {currentPage} of {totalPages || 1} · {pagination.totalItems || jobs.length} jobs
                </span>
              </div>
            )}
          </div>
        )}
      </div>
      <AnimatePresence>
        {filterOpen && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          >
            <FilterPopup
              setFilterOpen={setFilterOpen}
              companies={jobs}
              jobTypeCounts={jobTypeCounts}
              jobRoleCounts={jobRoleCounts}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </main >
  );
};

export default Page;

const FilterPopup = ({
  setFilterOpen,
  companies,
  jobTypeCounts,
  jobRoleCounts,
}: any) => {
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    salaryMin: "",
    salaryMax: "",
  });

  const handleClick = () => {
    setFilterOpen((prev: boolean) => !prev);
  };

  const handleToggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  const handleClear = () => {
    setFilters({ salaryMin: "", salaryMax: "" });
    setOpenSection(null);
  };

  const Dropdown = ({ title }: { title: string }) => {
    switch (title) {
      case "Salary Range":
        return (
          <div className="flex gap-3 mt-2 pb-3">
            <input
              type="text"
              placeholder="Min"
              value={filters.salaryMin}
              onChange={(e) =>
                setFilters({ ...filters, salaryMin: e.target.value })
              }
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
            />
            <input
              type="text"
              placeholder="Max"
              value={filters.salaryMax}
              onChange={(e) =>
                setFilters({ ...filters, salaryMax: e.target.value })
              }
              className="w-1/2 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        );

      case "Job Type":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> All ({companies.length})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Full-Time (
              {jobTypeCounts["Full-Time"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Part-Time (
              {jobTypeCounts["Part-Time"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Internship (
              {jobTypeCounts["Internship"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Contract (
              {jobTypeCounts["Contract"] || 0})
            </label>
          </div>
        );

      case "Job Status":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> On Hold
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Active
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Closed
            </label>
          </div>
        );

      case "Onsite/Remote":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Onsite
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Remote
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Hybrid
            </label>
          </div>
        );
      case "Years of Experience":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 0-1 Years
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 2-5 Years
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 5+ Years
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 10+ Years
            </label>
          </div>
        );
      case "Job Role":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Technical(
              {jobRoleCounts["Technical"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Marketing(
              {jobRoleCounts["Marketing"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Management(
              {jobRoleCounts["Management"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Design(
              {jobRoleCounts["Design"] || 0})
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Sales(
              {jobRoleCounts["Sales"] || 0})
            </label>
          </div>
        );
      case "Job Posted In":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Last 7 Days
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Last 30 Days
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Last 60 Days
            </label>
          </div>
        );
      case "Employers":
        return (
          <div className="flex flex-col gap-2 mt-2 pb-3">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Less that 50
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 50+
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> 150+
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" /> Above 250
            </label>
          </div>
        );
      case "Location":
        return (
          <div className="flex gap-3 mt-2 pb-3">
            <input
              type="text"
              placeholder={title}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none"
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="relative w-[360px] h-[600px] z-50 bg-white shadow-xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex w-full items-center justify-between bg-white shadow-xl p-4">
        <h1 className="text-md font-medium">Filter</h1>
        <button onClick={handleClick} className="cursor-pointer">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Filter Content */}
      <div className="flex-1 overflow-y-auto space-y-4 px-4">
        <button
          onClick={handleClear}
          className="text-[#f2825c] underline text-sm font-medium cursor-pointer mt-4"
        >
          Clear Filters
        </button>
        {[
          "Salary Range",
          "Job Type",
          "Job Status",
          "Onsite/Remote",
          "Years of Experience",
          "Job Posted In",
          "Job Role",
          "Location",
          "Employers",
        ].map((title, index) => (
          <div key={index} className="border-b border-gray-200">
            <button
              onClick={() => handleToggleSection(title)}
              className="w-full flex items-center justify-between py-3 text-sm text-gray-800 cursor-pointer"
            >
              {title}
              {openSection === title ? (
                <ChevronUp className="w-4 h-4 text-gray-700" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-700" />
              )}
            </button>

            {openSection === title && <Dropdown title={title} />}
          </div>
        ))}
      </div>
    </div>
  );
};
