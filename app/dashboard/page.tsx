"use client";
import { Calendar } from "@/components/ui/calendar";
import {
  Airplay,
  ArrowUpRight,
  Book,
  Bookmark,
  Briefcase,
  Building2,
  Check,
  FileText,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import compLogo from "@/public/images/compLogo.png";
import { motion, Variants, TargetAndTransition } from "framer-motion";
import ads from "@/public/images/abs.png";
import api from "@/lib/api";

const icons = {
  "Complete Your Profile": User,
  "Take Mock Interview": Airplay,
  "Take Assessment": Book,
  "Make Your Resume": FileText,
  "Apply Jobs": Briefcase,
};

const API_BASE_URL = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1`;
const resolveJobId = (job: any): string =>
  job?.uuid || job?.UUID || job?.id || "";

export default function Page() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [jobs, setJobs] = useState<any>();
  const [filterOpen, setFilterOpen] = useState(false);

  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // FETCH USER DASHBOARD DETAILS
  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");

        const res = await api.get(`/dashboard/user`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setUserData(res.data.data); // <= Corrected
      } catch (err) {
        console.error("Failed to fetch user:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center text-xl">
        Loading...
      </div>
    );
  }

  const profile = userData?.profile;
  const stats = userData?.stats;
  const onboarding = userData?.onboardingTasks;

  const strikeVariants: Variants = {
    initial: { width: 0 },
    animate: {
      width: "100%",
      transition: {
        duration: 0.7,
        ease: [0.42, 0, 0.58, 1], // <-- replaces "easeInOut"
      },
    },
  };

  return (
    <div className="w-full h-full bg-[#f7fbfa] text-[#17383d] flex gap-3 overflow-hidden pb-2">
      <section className="w-[65%] h-full flex flex-col gap-3">
        <div className="w-full h-1/2 flex flex-col gap-3">
          <div className="w-full bg-white h-[60%] rounded-xl p-2 flex items-center justify-between gap-8">
            <div className="h-full flex items-center gap-8">
              <div className="h-full w-[150px] bg-gray-100 rounded-xl overflow-hidden">
                {profile?.profileImageUrl ? (
                  <img
                    src={profile.profileImageUrl}
                    alt="profile"
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>
              <div className="h-full flex flex-col gap-1 justify-center">
                <h1 className="text-sm font-medium">{profile?.name}</h1>
                <p className="text-xs font-medium text-[#686D6B]">
                  {profile?.role}
                </p>
                <div className="flex gap-2 items-center mt-2">
                  <Mail size={18} className="text-[#f2825c] font-light" />
                  <p className="text-xs">{profile?.email}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <Phone size={18} className="text-[#f2825c] font-light" />
                  <p className="text-xs">{profile?.phone}</p>
                </div>
                <div className="flex gap-2 items-center">
                  <MapPin size={18} className="text-[#f2825c] font-light" />
                  <p className="text-xs">{profile?.location}</p>
                </div>
              </div>
            </div>
            <div className="h-auto w-auto bg-[#fff0ea] rounded-xl flex flex-col items-center justify-center p-2 gap-2 mr-5">
              <SemicircularProgress
                percentage={profile.completionPercentage}
                tooltipLabel="Completion"
              />
              <div className="bg-white rounded-xl p-2">
                <p className="text-xs font-medium text-center text-[#58757a]">
                  Complete your profile to
                  <br /> unlock all the features
                </p>
              </div>
            </div>
          </div>
          <div className="w-full h-[40%] flex gap-3">
            <Link
              href="/dashboard/my-interviews"
              className="w-1/3 bg-white rounded-xl py-2 px-5 flex flex-col gap-2 border border-[#cfe3e0] hover:bg-gradient-to-t from-[#184852] to-[#f2825c] group hover:text-[#fffafa] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-sm">Total Mock Interviews</h1>
                <div className="rounded-full border p-1 border-[#184852] flex items-center justify-center group-hover:bg-white transition-colors">
                  <ArrowUpRight size={12} className="text-[#184852]" />
                </div>
              </div>
              <h1 className="text-2xl font-medium">
                {stats?.totalMockInterviews.count}
              </h1>
              <p className="text-[#184852] text-sm group-hover:text-white transition-colors">
                {stats?.totalMockInterviews.trend}
              </p>
            </Link>
            <Link
              href="/dashboard/my-performance"
              className="w-1/3 bg-white rounded-xl py-2 px-5 flex flex-col gap-2 border border-[#cfe3e0] hover:bg-gradient-to-t from-[#184852] to-[#f2825c] group hover:text-[#fffafa] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-sm">Total Assessments</h1>
                <div className="rounded-full border p-1 border-[#184852] flex items-center justify-center group-hover:bg-white">
                  <ArrowUpRight size={12} className="text-[#184852]" />
                </div>
              </div>
              <h1 className="text-2xl font-medium">
                {stats?.totalAssessments.count}
              </h1>
              <p className="text-[#184852] text-sm group-hover:text-white transition-colors">
                {stats?.totalAssessments.trend}
              </p>
            </Link>
            <Link
              href="dashboard/jobs"
              className="w-1/3 bg-white rounded-xl py-2 px-5 flex flex-col gap-2 border border-[#cfe3e0] hover:bg-gradient-to-t from-[#184852] to-[#f2825c] group hover:text-[#fffafa] cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between">
                <h1 className="text-sm">Total Job Invites</h1>
                <div className="rounded-full border p-1 border-[#184852] flex items-center justify-center group-hover:bg-white">
                  <ArrowUpRight size={12} className="text-[#184852]" />
                </div>
              </div>
              <h1 className="text-2xl font-medium">
                {stats?.totalJobInvites.count}
              </h1>
              <p className="text-[#184852] text-sm group-hover:text-white transition-colors">
                {stats?.totalJobInvites.trend}
              </p>
            </Link>
          </div>
        </div>
        <div className="w-full flex gap-3 h-1/2">
          <div className="w-[60%] h-full rounded-xl bg-gradient-to-tr from-[#184852] to-[#f2825c] p-8">
            <h1 className="text-sm font-bold text-[#fffafa]">
              Recent Job Posts
            </h1>
            {/* <div className="w-full h-[200px] relative z-0">
              <div className="w-[300px] h-full bg-white rounded-xl mt-4 absolute left-0 top-1/2 -translate-y-1/2 z-40 p-2">
                {companies.map((company) => (
                  <Link key={company.id} href={company.href} className="w-full">
                    <div className="flex items-center justify-between border-b border-[#cfe3e0]/8 py-2">
                      <div className="flex gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                          <Image
                            src={company.compLogo || compLogo}
                            alt="company logo"
                            className="w-full h-full object-contain"
                            width={50}
                            height={50}
                          />
                        </div>
                        <div className="flex flex-col">
                          <h1 className=" text-sm text-gray-900 text-md font-medium">
                            {company.comName}
                          </h1>
                          <p className="text-gray-500 text-xs">
                            {company.domain}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) =>
                          toggleSave(e, company.id, company.isSaved)
                        }
                      >
                        <Bookmark
                          className={`${
                            company.isSaved
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          } cursor-pointer transition-colors`}
                          size={24}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 py-2 gap-4 px-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Location</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.location}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Salary</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.salary}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Employee Range</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.range}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Job Type</p>
                        <div className="bg-green-100 px-2 py-1 rounded-full w-fit">
                          <p className="font-semibold text-[10px] text-green-500">
                            {company.jobType?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="w-[300px] h-[95%] bg-[#C9DCDC] rounded-xl mt-4 absolute left-5 top-1/2 -translate-y-1/2 z-30">
                {" "}
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={company.href}
                    className="w-full opacity-0"
                  >
                    <div className="flex items-center justify-between border-b border-[#cfe3e0]/8 py-2">
                      <div className="flex gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                          <Image
                            src={company.compLogo || compLogo}
                            alt="company logo"
                            className="w-full h-full object-contain"
                            width={50}
                            height={50}
                          />
                        </div>
                        <div className="flex flex-col">
                          <h1 className=" text-sm text-gray-900 text-md font-medium">
                            {company.comName}
                          </h1>
                          <p className="text-gray-500 text-xs">
                            {company.domain}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) =>
                          toggleSave(e, company.id, company.isSaved)
                        }
                      >
                        <Bookmark
                          className={`${
                            company.isSaved
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          } cursor-pointer transition-colors`}
                          size={24}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 py-2 gap-4 px-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Location</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.location}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Salary</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.salary}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Employee Range</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.range}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Job Type</p>
                        <div className="bg-green-100 px-2 py-1 rounded-full w-fit">
                          <p className="font-semibold text-[10px] text-green-500">
                            {company.jobType?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="w-[300px] h-[90%] bg-[#B5D0D0] rounded-xl mt-4 absolute left-9 top-1/2 -translate-y-1/2 z-20">
                {companies.map((company) => (
                  <Link
                    key={company.id}
                    href={company.href}
                    className="w-full opacity-0"
                  >
                    <div className="flex items-center justify-between border-b border-[#cfe3e0]/8 py-2">
                      <div className="flex gap-2">
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center p-2 relative overflow-hidden">
                          <Image
                            src={company.compLogo || compLogo}
                            alt="company logo"
                            className="w-full h-full object-contain"
                            width={50}
                            height={50}
                          />
                        </div>
                        <div className="flex flex-col">
                          <h1 className=" text-sm text-gray-900 text-md font-medium">
                            {company.comName}
                          </h1>
                          <p className="text-gray-500 text-xs">
                            {company.domain}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) =>
                          toggleSave(e, company.id, company.isSaved)
                        }
                      >
                        <Bookmark
                          className={`${
                            company.isSaved
                              ? "text-green-500 fill-green-500"
                              : "text-gray-300"
                          } cursor-pointer transition-colors`}
                          size={24}
                        />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 py-2 gap-4 px-2">
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Location</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.location}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Salary</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.salary}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Employee Range</p>
                        <p className="text-[#17383d] text-sm truncate">
                          {company.range}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        <p className="text-gray-500 text-xs">Job Type</p>
                        <div className="bg-green-100 px-2 py-1 rounded-full w-fit">
                          <p className="font-semibold text-[10px] text-green-500">
                            {company.jobType?.toUpperCase()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <div className="w-[300px] h-[85%] bg-[#458888] rounded-xl mt-4 absolute left-12 top-1/2 -translate-y-1/2 z-10"></div>
              <div className="w-[300px] h-[80%] bg-[#2C7676] rounded-xl mt-4 absolute left-14 top-1/2 -translate-y-1/2 z-0"></div>
            </div> */}
            <SwipeStack />
          </div>
          <Link
            href="/dashboard/ai-resume-builder"
            className="w-[40%] rounded-xl bg-gradient-to-b from-white to-[#FFFCED] flex flex-col items-center justify-center gap-4 p-2"
          >
            <h1 className="font-medium text-md text-center">
              Build a Job-Ready
              <br /> Resume in Minutes
            </h1>
            <Image src={ads} alt="ad" className="w-auto h-auto" />
            <h1 className="text-sm text-center">
              Let AI craft a professional resume
              <br /> tailored to your skills and target roles.
            </h1>
            <div className="py-2 px-5 rounded-md bg-[#FFCC99] flex items-center justify-center">
              <h1 className="text-xs font-medium">Try AI Resume Builder</h1>
            </div>
          </Link>
        </div>
      </section>

      <section className="h-full w-[35%] flex flex-col gap-4">
        <div className="w-full h-1/2 rounded-xl bg-white p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between font-medium text-sm">
            <h1>Onboarding Tasks</h1>
            <h1 className="text-md">
              {onboarding.completed}/{onboarding.total}
            </h1>
          </div>
          <div className="flex flex-col gap-4">
            {onboarding?.tasks
              ?.slice()
              .sort(
                (a: any, b: any) =>
                  (b.isCompleted ? 1 : 0) - (a.isCompleted ? 1 : 0),
              )
              .map((item: any, index: number) => {
                const Icon = icons[item.task as keyof typeof icons];

                return (
                  <motion.div
                    key={item.id}
                    className="flex items-center justify-between relative"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }} // staggered reveals
                  >
                    <Link
                      href={`/dashboard/${item?.actionUrl}`}
                      className="flex gap-4 items-center"
                    >
                      <div
                        className={`rounded-full p-2 flex items-center justify-center ${
                          item.isCompleted
                            ? "border-1 border-[#f2825c] bg-[#fff0ea] text-[#184852]"
                            : "bg-[#f2825c] text-[#fffafa]"
                        }`}
                      >
                        <Icon size={12} />
                      </div>

                      <div className="relative">
                        <h1
                          className={`font-medium text-sm ${
                            item.isCompleted ? "text-[#7A7A7A]" : ""
                          }`}
                        >
                          {item.task}
                        </h1>

                        {/* Strike-through animation */}
                        {/* {item.isCompleted && (
                          <motion.div
                            className="absolute top-1/2 left-0 h-[1.5px] bg-[#7A7A7A]"
                            variants={strikeVariants}
                            initial="initial"
                            animate="animate"
                          />
                        )} */}
                      </div>
                    </Link>

                    {/* Status circle */}
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center border-2 ${
                        item.isCompleted
                          ? "border-[#f2825c] bg-[#f2825c]"
                          : "border-[#E1E1E1]"
                      }`}
                    >
                      {item.isCompleted && (
                        <Check className="text-[#fffafa]" size={12} />
                      )}
                    </div>
                  </motion.div>
                );
              })}
          </div>
        </div>
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          calendarEvents={userData.calendarEvents}
          className="rounded-xl h-1/2 w-full flex flex-col items-center justify-center"
          captionLayout="dropdown"
        />
      </section>
    </div>
  );
}

export const useCountUp = (end: number, duration = 1000) => {
  const [value, setValue] = useState(0);

  useEffect(() => {
    let start = 0;
    const increment = end / (duration / 16); // ~60fps
    const handle = setInterval(() => {
      start += increment;
      if (start >= end) {
        setValue(end);
        clearInterval(handle);
      } else {
        setValue(Math.ceil(start));
      }
    }, 16);

    return () => clearInterval(handle);
  }, [end, duration]);

  return value;
};

export type SemicircularProgressProps = {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  showLabel?: boolean;
  tooltipLabel?: string;
};

function SemicircularProgress({
  percentage,
  size = 160,
  strokeWidth = 8,
  color = "#f2825c",
  bgColor = "#fff0ea",
  showLabel = true,
  tooltipLabel = "Clarity",
}: SemicircularProgressProps) {
  const pct = useCountUp(Math.max(0, Math.min(100, Math.round(percentage))));
  const dashArray = 100;
  const dashOffset = 100 - pct;
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="relative inline-flex flex-col items-center justify-center"
      style={{ width: size, height: size / 2 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Tooltip */}
      {hovered && (
        <div className="absolute -top-5 flex flex-col items-center">
          <div className="bg-white border border-[#cfe3e0] text-[#17383d] text-sm font-medium rounded-md shadow-md px-3 py-1.5 whitespace-nowrap">
            {tooltipLabel} : {pct}%
          </div>
          {/* Arrow */}
          <div className="w-3 h-3 bg-white border-b border-gray-200 rotate-45 mt-[-6px] shadow-b-md" />
        </div>
      )}

      {/* Gauge */}
      <svg
        viewBox="0 0 100 60"
        width={size}
        height={(size / 100) * 60}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Background arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground arc */}
        <path
          d="M 10 50 A 40 40 0 0 1 90 50"
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dashArray}
          strokeDashoffset={dashOffset}
          pathLength={100}
        />

        {/* Percentage Label */}
        {showLabel && (
          <text
            x="50"
            y="40"
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize="16"
            fontWeight={500}
            fill="#17383d"
          >
            {pct}%
          </text>
        )}
      </svg>
    </div>
  );
}

// ⛔ Your toggleSave function + data should be passed in
// companies MUST be at least 3 items (because top 3 show content)
function SwipeStack() {
  const [cards, setCards] = useState<any[]>([]);
  const [jobs, setJobs] = useState<any[]>([]);

  // ─────────────────────────────
  // FETCH JOBS + TRANSFORM FORMAT
  // ─────────────────────────────
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = localStorage.getItem("token");

        const res = await fetch(`${API_BASE_URL}/jobs`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();

        if (data.success) {
          const formatted = data.jobs
            .map((job: any) => {
              const resolvedId = resolveJobId(job);
              return {
                id: resolvedId,
                compLogo: job.org?.org_logo,
                comName: job.org?.org_name,
                domain: job.org?.industry,
                location: job.org?.org_city,
                salary: `${job.min_fixed_ctc} - ${job.max_fixed_ctc}`,
                range: job.min_exp,
                jobType: job.job_type,
                isSaved: job.isSaved,
                isApplied: job.isApplied,
                verified: job.org?.verified,
                href: `/dashboard/jobs/${resolvedId}`,
              };
            })
            .filter((job: any) => Boolean(job.id));

          setJobs(formatted);
          setCards(formatted);
        }
      } catch (err) {
        console.error("Error loading jobs:", err);
      }
    };

    fetchJobs();
  }, []);

  // ─────────────────────────────
  // SAVE / UNSAVE JOB
  // ─────────────────────────────
  const toggleSave = async (
    e: React.MouseEvent,
    jobId: string,
    currentStatus: boolean,
  ) => {
    e.preventDefault();
    if (!jobId) return;
    try {
      const token = localStorage.getItem("token");

      const res = await fetch(`${API_BASE_URL}/jobs/save`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ job_uuid: jobId }),
      });

      const data = await res.json();

      if (data.success) {
        setJobs((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, isSaved: !currentStatus } : job,
          ),
        );
        setCards((prev) =>
          prev.map((job) =>
            job.id === jobId ? { ...job, isSaved: !currentStatus } : job,
          ),
        );
      }
    } catch (err) {
      console.error("Error toggling save:", err);
    }
  };

  // ─────────────────────────────
  // AUTO SLIDE ANIMATION
  // ─────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setCards((prev) => {
        if (!prev.length) return prev;
        const arr = [...prev];
        const first = arr.shift();
        arr.push(first);
        return arr;
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Animation Variants
  const frontAnim: TargetAndTransition = {
    x: [0, -350],
    opacity: [1, 0],
    transition: { duration: 0.7, ease: ["easeInOut"] },
  };
  const midAnim: TargetAndTransition = {
    x: [5, 0],
    opacity: 1,
    transition: { duration: 0.7, ease: ["easeInOut"] },
  };
  const backAnim: TargetAndTransition = {
    x: [10, 5],
    opacity: 1,
    transition: { duration: 0.7, ease: ["easeInOut"] },
  };

  if (!cards?.length)
    return <p className="text-sm text-gray-500">Loading jobs...</p>;

  return (
    <div className="w-full h-[200px] relative z-0">
      {/* FIRST CARD */}
      <motion.div
        className="w-[300px] h-full bg-white rounded-xl mt-4 absolute left-0 top-1/2 -translate-y-1/2 z-50 p-2 shadow"
        animate={frontAnim}
        key={cards[0].id}
      >
        <CardContent card={cards[0]} toggleSave={toggleSave} />
      </motion.div>

      {/* SECOND */}
      <motion.div
        className="w-[300px] h-[95%] bg-[#fff0ea] rounded-xl mt-4 absolute left-5 top-1/2 -translate-y-1/2 z-40 p-2 shadow"
        animate={midAnim}
        key={cards[1].id}
      >
        <CardContent card={cards[1]} toggleSave={toggleSave} />
      </motion.div>

      {/* THIRD */}
      <motion.div
        className="w-[300px] h-[90%] bg-[#ffd6c8] rounded-xl mt-4 absolute left-9 top-1/2 -translate-y-1/2 z-30 p-2 shadow"
        animate={backAnim}
        key={cards[2].id}
      >
        <CardContent card={cards[2]} toggleSave={toggleSave} />
      </motion.div>

      {/* STATIC BG CARDS */}
      <div className="w-[300px] h-[85%] bg-[#ed3336] rounded-xl mt-4 absolute left-12 top-1/2 -translate-y-1/2 z-20 shadow"></div>
      <div className="w-[300px] h-[80%] bg-[#184852] rounded-xl mt-4 absolute left-14 top-1/2 -translate-y-1/2 z-10 shadow"></div>
    </div>
  );
}

//
// CARD CONTENT
//
const CardContent = ({ card, toggleSave }: any) => {
  return (
    <Link href={card.href} className="w-full block">
      <div className="flex items-center justify-between border-b border-[#cfe3e0] py-2">
        <div className="flex gap-2">
          <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center p-2 overflow-hidden">
            {card?.compLogo ? (
              <Image
                src={card.compLogo}
                alt="company logo"
                width={40}
                height={40}
                className="object-contain"
                unoptimized
              />
            ) : (
              <Building2 />
            )}
          </div>

          <div className="flex flex-col">
            <h1 className="text-sm font-medium text-gray-900">
              {card.comName}
            </h1>
            <p className="text-gray-500 text-xs">{card.domain}</p>

            {/* {card.verified && (
              <span className="text-[10px] text-green-500">Verified</span>
            )} */}
          </div>
        </div>

        {/* SAVE BUTTON */}
        <button onClick={(e) => toggleSave(e, card.id, card.isSaved)}>
          <Bookmark
            className={`${
              card.isSaved ? "text-green-500 fill-green-500" : "text-gray-300"
            } transition-colors`}
            size={22}
          />
        </button>
      </div>

      {/* INFO */}
      <div className="grid grid-cols-2 py-2 gap-4 px-2">
        <Info label="Location" value={card.location} />
        <Info label="Salary" value={card.salary} />
        <Info label="Experience" value={card.range} />
        <div className="flex flex-col gap-1">
          <p className="text-gray-500 text-xs">Job Type</p>
          <div className="bg-[#fff0ea] px-2 py-1 rounded-full w-fit">
            <p className="font-semibold text-[10px] text-[#184852]">
              {card.jobType?.toUpperCase()}
            </p>
          </div>
        </div>
      </div>

      {/* {card.isApplied && (
        <p className="text-[10px] text-blue-500 px-2">✔ Already Applied</p>
      )} */}
    </Link>
  );
};

const Info = ({ label, value }: any) => (
  <div className="flex flex-col gap-1">
    <p className="text-gray-500 text-xs">{label}</p>
    <p className="text-[#17383d] text-sm truncate">{value}</p>
  </div>
);
