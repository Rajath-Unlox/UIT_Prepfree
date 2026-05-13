"use client";
import {
  Clock,
  FileText,
  Loader2,
  X,
  ChevronDown,
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { toast, Toaster } from "sonner";
import api from "@/lib/api";

const tabs = [
  { id: "jobtitle", label: "Jobs" },
  { id: "skills", label: "Skills" },
];

// --- MULTI-SELECT COMPONENT ---
interface MultiSelectDropdownProps {
  selectedItems: string[];
  onItemsChange: (items: string[]) => void;
  options: string[];
  placeholder: string;
}

const MultiSelectDropdown = ({
  selectedItems,
  onItemsChange,
  options,
  placeholder
}: MultiSelectDropdownProps) => {
  const [inputValue, setInputValue] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter: exclude already selected items
  const filteredOptions = options.filter(opt =>
    !selectedItems.includes(opt) &&
    opt.toLowerCase().includes(inputValue.toLowerCase())
  );

  const showCustomOption = inputValue.trim().length > 0 &&
    !options.some(opt => opt.toLowerCase() === inputValue.trim().toLowerCase()) &&
    !selectedItems.includes(inputValue.trim());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        setInputValue("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (item: string) => {
    onItemsChange([...selectedItems, item]);
    setInputValue("");
    setShowDropdown(false);
  };

  const handleRemove = (itemToRemove: string) => {
    onItemsChange(selectedItems.filter(i => i !== itemToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim()) {
      e.preventDefault();
      // Add custom or first match
      if (filteredOptions.length > 0) {
        handleSelect(filteredOptions[0]);
      } else {
        handleSelect(inputValue.trim());
      }
    }
    if (e.key === "Backspace" && !inputValue && selectedItems.length > 0) {
      handleRemove(selectedItems[selectedItems.length - 1]);
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="w-full mt-4 p-2 border border-[#cfe3e0]/20 rounded-md min-h-[50px] flex flex-wrap gap-2 items-center focus-within:ring-1 focus-within:ring-[#f2825c] transition-all bg-white relative">
        {selectedItems.map((item, idx) => (
          <div key={idx} className="bg-[#fff0ea] px-2 py-1 rounded text-sm text-[#f2825c] flex items-center gap-1 font-medium border border-[#f2825c]/20">
            <span>{item}</span>
            <X
              size={14}
              className="cursor-pointer hover:text-red-500"
              onClick={() => handleRemove(item)}
            />
          </div>
        ))}
        <input
          type="text"
          className="flex-1 min-w-[120px] outline-none text-gray-700 p-1"
          placeholder={selectedItems.length === 0 ? placeholder : ""}
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
        />
        {/* Dropdown Icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-gray-50 border border-gray-200 rounded-md pointer-events-none">
          <ChevronDown className="text-gray-500" size={18} />
        </div>
      </div>

      {showDropdown && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">
          {filteredOptions.length === 0 && !showCustomOption && (
            <li className="px-4 py-3 text-gray-400 italic cursor-default">No matches</li>
          )}

          {filteredOptions.map((opt, idx) => (
            <li
              key={idx}
              className="px-4 py-3 hover:bg-[#fff0ea] cursor-pointer text-gray-700 font-medium"
              onMouseDown={() => handleSelect(opt)} // Use onMouseDown to prevent blur before click
            >
              {opt}
            </li>
          ))}

          {showCustomOption && (
            <li
              className="px-4 py-3 hover:bg-[#fff0ea] cursor-pointer text-[#17383d] font-semibold border-t border-gray-100"
              onMouseDown={() => handleSelect(inputValue.trim())}
            >
              Add "{inputValue}"
            </li>
          )}
        </ul>
      )}
    </div>
  );
};


// DROPDOWN COMPONENT (Single Select)
interface DropdownInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  options: string[];
  placeholder: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
  allowCustom?: boolean;
  isSelected?: boolean; // Controls bold state
}

const DropdownInput = ({
  value,
  onChange,
  onSelect,
  options,
  placeholder,
  onKeyDown,
  allowCustom = false,
  isSelected = false
}: DropdownInputProps) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Filter options based on input value
  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(value.toLowerCase())
  );

  // Check if we should show the "Custom" option
  const showCustomOption = allowCustom && value.trim().length > 0 && !filteredOptions.some(opt => opt.toLowerCase() === value.trim().toLowerCase());

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        if (!isSelected && value.trim() !== "") {
          onChange("");
        }
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isSelected, onChange, value]);

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={onKeyDown}
          className={`w-full mt-4 px-4 py-3 min-h-[50px] border border-[#cfe3e0]/20 rounded-md pr-14 outline-none focus:ring-1 focus:ring-[#f2825c] transition-all ${isSelected ? 'font-bold text-[#17383d]' : 'font-normal text-gray-700'}`}
        />
        {/* Square box around the dropdown arrow */}
        <div className="absolute right-3 top-1/2 mt-2 -translate-y-1/2 p-2 bg-gray-50 border border-gray-200 rounded-md pointer-events-none">
          <ChevronDown className="text-gray-500" size={18} />
        </div>
      </div>

      {/* Dropdown List */}
      {showDropdown && (
        <ul className="absolute z-20 w-full bg-white border border-gray-200 rounded-md mt-1 max-h-60 overflow-y-auto shadow-lg">

          {/* Case 1: No Data (API Empty) */}
          {options.length === 0 && !value && (
            <li className="px-4 py-3 text-gray-400 italic cursor-default">
              No data available
            </li>
          )}

          {/* Case 2: Filtered Results */}
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => (
              <li
                key={idx}
                className="px-4 py-3 hover:bg-[#fff0ea] cursor-pointer text-gray-700 font-medium"
                onClick={() => {
                  onSelect(opt);
                  setShowDropdown(false);
                }}
              >
                {opt}
              </li>
            ))
          ) : (
            /* Case 3: No matches found during search */
            (options.length > 0 && !showCustomOption) && (
              <li className="px-4 py-3 text-gray-400 italic cursor-default">
                No results found
              </li>
            )
          )}

          {/* Custom Option */}
          {showCustomOption && (
            <li
              className="px-4 py-3 hover:bg-[#fff0ea] cursor-pointer text-[#17383d] font-medium border-t border-gray-100"
              onClick={() => {
                onSelect(value);
                setShowDropdown(false);
              }}
            >
              {value} (Custom)
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

interface MarketplaceJob {
  title: string;
  company: string;
}

const Page = () => {
  const [activeTab, setActiveTab] = useState("jobtitle");
  const [option, setOption] = useState("prepjob");
  const [jobRole, setJobRole] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [queType, setQueType] = useState("");

  // Track selection state to control bolding
  const [isSelected, setIsSelected] = useState(false);

  // New State for Multi-Select Skills
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  // Job Description State
  const [jobDescription, setJobDescription] = useState("");

  // Data State
  const [marketplaceJobs, setMarketplaceJobs] = useState<MarketplaceJob[]>([]);
  const [standardJobs, setStandardJobs] = useState<string[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Formatted options for Marketplace (Deduped Titles Only)
  const marketplaceOptions = React.useMemo(() => {
    const titles = marketplaceJobs.map(job => job.title);
    return Array.from(new Set(titles)); // Remove duplicates
  }, [marketplaceJobs]);

  // Reset inputs when switching tabs
  useEffect(() => {
    setJobRole("");
    setIsSelected(false);
  }, [activeTab]);

  // Fetch Catalog Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoadingData(true);
      try {
        const res = await api.get('/interview/metadata');
        if (res.data.success) {
          setMarketplaceJobs(res.data.marketplaceJobs || []);
          setStandardJobs(res.data.standardJobs || []);
          setAvailableSkills(res.data.skills || []);
        }
      } catch (error) {
        console.error("Failed to fetch interview metadata", error);
        toast.error("Failed to load interview data");
      } finally {
        setLoadingData(false);
      }
    };
    fetchData();
  }, []);

  const handleClick = (type: string) => {
    setOption(type);
    setJobRole("");
    setIsSelected(false);
  };

  // Generic Selection Handler
  const handleSelect = (val: string) => {
    setJobRole(val);
    setIsSelected(true);
  }

  // Generic Change Handler
  const handleChange = (val: string) => {
    setJobRole(val);
    setIsSelected(false);
  }

  // Key Handler
  const handleKeyDown = (e: any) => {
    if (e.key === "Enter") {
      if (activeTab === 'jobtitle' && option === 'prepjob') {
        const match = marketplaceOptions.find(opt => opt.toLowerCase() === jobRole.toLowerCase());
        if (match) {
          handleSelect(match);
          e.preventDefault();
        }
      } else {
        e.preventDefault();
        handleSelect(jobRole);
      }
    }
  };

  return (
    <main className="w-full h-auto p-4">
      <Toaster position="top-right" richColors />

      {/* Tabs */}
      <div className="flex rounded-md overflow-hidden border-2 border-[#cfe3e0]/20 w-fit">
        {tabs.map((tab, idx) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-fit px-6 py-3 cursor-pointer transition-colors duration-200
              ${activeTab === tab.id
                ? "bg-[#f7fbfa] font-semibold"
                : "bg-white text-gray-700"
              }
              ${idx !== tabs.length - 1 ? "border-r-2 border-[#cfe3e0]/20" : ""}
              hover:bg-[#f7fbfa]/50
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Jobs Tab Content */}
      {activeTab === "jobtitle" && (
        <div className="w-full flex flex-col items-center gap-4 mt-4">
          <div className="w-[70%] rounded-xl bg-white p-5 shadow-lg">
            <h1 className="text-lg font-bold">Select Job from</h1>
            <div className="flex mt-2 gap-4">
              <div className="flex gap-1 items-center">
                <input
                  type="radio"
                  id="prepjob"
                  name="jobOption"
                  value="prepjob"
                  checked={option === "prepjob"}
                  onChange={() => handleClick("prepjob")}
                  className="text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="prepjob" className="cursor-pointer font-medium">
                  Prepfree Job Board
                </label>
              </div>

              <div className="flex gap-1 items-center">
                <input
                  type="radio"
                  id="stdjob"
                  name="jobOption"
                  value="stdjob"
                  checked={option === "stdjob"}
                  onChange={() => handleClick("stdjob")}
                  className="text-green-600 focus:ring-green-500 cursor-pointer"
                />
                <label htmlFor="stdjob" className="cursor-pointer font-medium">
                  Standard Job Titles
                </label>
              </div>
            </div>

            {/* Prepfree Job Board */}
            {option === "prepjob" && (
              <div className="mt-4">
                <h1 className="text-lg font-bold">Prepfree Job Board</h1>
                <p className="text-sm text-[#17383d]/53">
                  We recommend practicing mock interviews for the jobs you've
                  applied to.
                </p>

                {/* Dynamic Dropdown for Marketplace Jobs */}
                <DropdownInput
                  value={jobRole}
                  onChange={handleChange}
                  onSelect={handleSelect}
                  options={marketplaceOptions}
                  placeholder="Search from Prepfree Job Board"
                  onKeyDown={handleKeyDown}
                  allowCustom={false}
                  isSelected={isSelected}
                />
              </div>
            )}

            {/* Standard Job Titles */}
            {option === "stdjob" && (
              <div className="mt-4">
                <h1 className="text-lg font-bold">Standard Job Titles</h1>
                <p className="text-sm text-[#17383d]/53">
                  Specify a job title to get interview questions tailored to
                  your target role.
                </p>

                {/* Dynamic Dropdown for Standard Jobs */}
                <DropdownInput
                  value={jobRole}
                  onChange={handleChange}
                  onSelect={handleSelect}
                  options={standardJobs}
                  placeholder="e.g. Software Engineer, Product Manager"
                  onKeyDown={handleKeyDown}
                  allowCustom={true}
                  isSelected={isSelected}
                />
              </div>
            )}

            {(option === "stdjob" || option === "prepjob") && (
              <>
                {/* Job Description Field */}
                <h1 className="text-lg font-medium mt-4">
                  Job Description <span className="text-sm font-normal text-[#17383d]/40">(Optional)</span>
                </h1>
                <textarea
                  className="w-full mt-2 px-4 py-3 border border-[#cfe3e0]/20 rounded-md outline-none focus:ring-1 focus:ring-[#f2825c] transition-all resize-none text-gray-700 text-sm"
                  placeholder="Enter the job description here to get more tailored interview questions..."
                  rows={4}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                />

                <h1 className="text-lg font-medium mt-2">
                  Select Difficulty Level
                </h1>
                <div className="flex mt-2 gap-4">
                  <div className="flex gap-1 items-center">
                    <input
                      type="radio"
                      id="easy"
                      name="difficulty"
                      value="easy"
                      checked={difficulty === "easy"}
                      onChange={() => setDifficulty("easy")}
                      className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                    />
                    <label
                      htmlFor="easy"
                      className="cursor-pointer font-medium"
                    >
                      Easy
                    </label>
                  </div>
                  <div className="flex gap-1 items-center">
                    <input
                      type="radio"
                      id="medium"
                      name="difficulty"
                      value="medium"
                      checked={difficulty === "medium"}
                      onChange={() => setDifficulty("medium")}
                      className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                    />
                    <label
                      htmlFor="medium"
                      className="cursor-pointer font-medium"
                    >
                      Medium
                    </label>
                  </div>
                  <div className="flex gap-1 items-center">
                    <input
                      type="radio"
                      id="hard"
                      name="difficulty"
                      value="hard"
                      checked={difficulty === "hard"}
                      onChange={() => setDifficulty("hard")}
                      className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                    />
                    <label htmlFor="hard" className="cursor-pointer font-medium">
                      Hard
                    </label>
                  </div>
                </div>

                <h1 className="text-lg font-medium mt-2">Type of Questions</h1>
                <div className="flex mt-2 gap-4">
                  <div className="flex gap-1 items-center">
                    <input
                      type="radio"
                      id="tech&behavioral"
                      name="queType"
                      value="tech&behavioral"
                      checked={queType === "tech&behavioral"}
                      onChange={() => setQueType("tech&behavioral")}
                      className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                    />
                    <label
                      htmlFor="tech&behavioral"
                      className="cursor-pointer font-medium"
                    >
                      Behavioral + Technical
                    </label>
                  </div>
                  <div className="flex gap-1 items-center">
                    <input
                      type="radio"
                      id="behavioral"
                      name="queType"
                      value="behavioral"
                      checked={queType === "behavioral"}
                      onChange={() => setQueType("behavioral")}
                      className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                    />
                    <label
                      htmlFor="behavioral"
                      className="cursor-pointer font-medium"
                    >
                      Behavioral
                    </label>
                  </div>
                </div>
              </>
            )}

            {/* Button */}
            <div className="w-full flex items-center justify-center mt-6">
              <TakeInterview
                activeTab={activeTab}
                jobRole={jobRole}
                difficulty={difficulty}
                queType={queType}
                option={option}
                marketplaceJobs={marketplaceJobs}
                isRoleSelected={isSelected}
                selectedSkills={selectedSkills}
                jobDescription={jobDescription}
              />
            </div>
          </div>
        </div>
      )}

      {activeTab === "skills" && (
        <div className="w-full flex flex-col items-center gap-4 mt-4">
          <div className="w-[70%] rounded-xl bg-white p-5 shadow-lg">
            <div className="mt-4">
              <h1 className="text-lg font-bold">Skills</h1>
              <p className="text-sm text-[#17383d]/53">
                Specify Skills to get interview questions tailored to your
                target role.
              </p>

              {/* MultiSelect Dropdown for Skills */}
              <MultiSelectDropdown
                selectedItems={selectedSkills}
                onItemsChange={setSelectedSkills}
                options={availableSkills}
                placeholder="e.g. React.js, Python (Press Enter to add)"
              />
            </div>
            <>
              <h1 className="text-lg font-medium mt-2">
                Select Difficulty Level
              </h1>
              <div className="flex mt-2 gap-4">

                <div className="flex gap-1 items-center">
                  <input
                    type="radio"
                    id="easy"
                    name="difficulty"
                    value="easy"
                    checked={difficulty === "easy"}
                    onChange={() => setDifficulty("easy")}
                    className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                  />
                  <label htmlFor="easy" className="cursor-pointer font-medium">
                    Easy
                  </label>
                </div>
                <div className="flex gap-1 items-center">
                  <input
                    type="radio"
                    id="medium"
                    name="difficulty"
                    value="medium"
                    checked={difficulty === "medium"}
                    onChange={() => setDifficulty("medium")}
                    className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                  />
                  <label
                    htmlFor="medium"
                    className="cursor-pointer font-medium"
                  >
                    Medium
                  </label>
                </div>
                <div className="flex gap-1 items-center">
                  <input
                    type="radio"
                    id="hard"
                    name="difficulty"
                    value="hard"
                    checked={difficulty === "hard"}
                    onChange={() => setDifficulty("hard")}
                    className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                  />
                  <label htmlFor="hard" className="cursor-pointer font-medium">
                    Hard
                  </label>
                </div>
              </div>

              <h1 className="text-lg font-medium mt-2">Type of Questions</h1>
              <div className="flex mt-2 gap-4">
                <div className="flex gap-1 items-center">
                  <input
                    type="radio"
                    id="tech&behavioral"
                    name="queType"
                    value="tech&behavioral"
                    checked={queType === "tech&behavioral"}
                    onChange={() => setQueType("tech&behavioral")}
                    className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                  />
                  <label
                    htmlFor="tech&behavioral"
                    className="cursor-pointer font-medium"
                  >
                    Behavioral + Technical
                  </label>
                </div>
                <div className="flex gap-1 items-center">
                  <input
                    type="radio"
                    id="behavioral"
                    name="queType"
                    value="behavioral"
                    checked={queType === "behavioral"}
                    onChange={() => setQueType("behavioral")}
                    className="text-[#f2825c] focus:ring-[#f2825c] cursor-pointer"
                  />
                  <label
                    htmlFor="behavioral"
                    className="cursor-pointer font-medium"
                  >
                    Behavioral
                  </label>
                </div>
              </div>
            </>

            {/* Button */}
            <div className="w-full flex items-center justify-center mt-6">
              <TakeInterview
                activeTab={activeTab}
                jobRole={jobRole}
                difficulty={difficulty}
                queType={queType}
                option={option}
                marketplaceJobs={marketplaceJobs}
                isRoleSelected={isSelected}
                selectedSkills={selectedSkills}
                jobDescription={jobDescription}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
};

export default Page;

interface TakeInterviewProps {
  activeTab: string;
  jobRole: string | null;
  difficulty: string;
  queType: string;
  option: string;
  marketplaceJobs: MarketplaceJob[];
  isRoleSelected: boolean;
  selectedSkills: string[];
  jobDescription: string;
}

const TakeInterview = ({
  activeTab,
  jobRole,
  difficulty,
  queType,
  option,
  marketplaceJobs,
  isRoleSelected,
  selectedSkills,
  jobDescription
}: TakeInterviewProps) => {
  const [popupOpen, setPopupOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [hasReadInstructions, setHasReadInstructions] = useState(false);
  const router = useRouter();

  // Check if button should be enabled
  const isButtonDisabled = () => {
    if (!difficulty || !queType) return true;

    if (activeTab === "skills") {
      return selectedSkills.length === 0;
    }

    if (!jobRole) return true;
    // Enforce explicit selection (Bold state)
    if (!isRoleSelected) return true;

    // Validation for Strict Mode (Prepfree Job Board)
    if (activeTab === "jobtitle" && option === 'prepjob' && marketplaceJobs) {
      return false;
    }
    return false;
  };

  const handlePopup = () => {
    // Basic validation before opening popup
    if (activeTab === "jobtitle") {
      if (!jobRole) {
        toast.error("Please select or enter a Job Role.");
        return;
      }

      if (!isRoleSelected) {
        toast.error("Please select the role from the dropdown (or custom option) to proceed.");
        return;
      }

      if (option === 'prepjob') {
        const formattedOptions = marketplaceJobs.map(j => j.title);
        const isValid = formattedOptions.some(opt => opt.toLowerCase() === (jobRole || '').toLowerCase());
        if (!isValid) {
          toast.error("Please select a valid job role from the list.");
          return;
        }
      }
    } else if (activeTab === "skills") {
      if (selectedSkills.length === 0) {
        toast.error("Please select at least one skill.");
        return;
      }
    }

    if (!difficulty) {
      toast.error("Please select a difficulty level.");
      return;
    }
    if (!queType) {
      toast.error("Please select the type of questions.");
      return;
    }

    setPopupOpen(true);
  };

  const handleClose = () => {
    setPopupOpen(false);
    setHasReadInstructions(false);
  };

  const handleStartInterview = async () => {
    if (!hasReadInstructions) {
      toast.error("Please acknowledge the instructions to proceed.");
      return;
    }

    setLoading(true);
    try {
      let finalJobTitle = jobRole;

      const payload = {
        type: activeTab, // "jobtitle" or "skills"
        skills: activeTab === "skills" ? selectedSkills : null,
        job_title: activeTab === "jobtitle" ? finalJobTitle : null,
        difficulty: difficulty,
        qa_type:
          queType === "tech&behavioral"
            ? "behavioral and technical"
            : queType,
        job_description: jobDescription || "",
      };

      sessionStorage.setItem("pending_mock_interview_payload", JSON.stringify(payload));
      router.push("/mock-interview");
    } catch (error) {
      console.error("Error preparing interview:", error);
      toast.error("Unable to proceed. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const isDisabled = isButtonDisabled();

  return (
    <>
      <button
        onClick={handlePopup}
        disabled={isDisabled}
        className={`w-1/2 flex gap-3 items-center mt-4 h-auto py-3 px-6 flex items-center justify-center rounded-md text-white bg-[#184852] ${isDisabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
          }`}
      >
        Take Mock Interview
      </button>

      {popupOpen && (
        <div className="w-screen h-screen bg-[#17383d]/45 fixed inset-0 z-30 flex items-center justify-center">
          <div className="w-[45%] bg-white py-8 px-10 h-auto rounded-[15px] flex flex-col gap-4 max-h-[90vh] overflow-y-auto">

            {/* Header */}
            <div className="w-full flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-medium">
                  Start Assessment: <span className="font-bold">{activeTab === "jobtitle" ? jobRole : "Skills Assessment"}</span>
                </h1>
              </div>
              <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded-full">
                <X />
              </button>
            </div>

            {/* Metadata Info */}
            <div className="w-full flex gap-2 border-b pb-4">
              {[
                { label: "Upto 20 Minutes", icon: Clock },
                { label: "Upto 10 Questions", icon: FileText },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-[#fff0ea] px-4 py-2 rounded-md"
                >
                  {item.icon && (
                    <item.icon className="w-5 h-5 text-gray-600" />
                  )}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
              ))}
            </div>

            {/* Instructions Content (Merged) */}
            <div className="w-full flex flex-col gap-4 overflow-y-auto pr-2">
              {/* Section 1: Proctoring */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  ⚠️ Important Proctoring Guidelines
                </h2>
                <ul className="list-disc pl-5 text-[#17383d]/70 text-sm space-y-1">
                  <li>Switching off the camera or changing tabs/windows during assessment is <b>not allowed</b>.</li>
                  <li><b>Stay on Camera:</b> Keep your webcam and mic on throughout the interview.</li>
                  <li><b>No Distractions:</b> Ensure you are in a quiet environment.</li>
                  <li><b>Screen Recording:</b> Your screen will be monitored. Please close unnecessary tabs/apps.</li>
                  <li><b>Stay Present:</b> Always remain visible and focused on the screen.</li>
                </ul>
              </div>

              {/* Section 2: General Instructions */}
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">
                  Key Instructions
                </h2>
                <ul className="list-disc pl-5 text-[#17383d]/70 text-sm space-y-1">
                  <li><b>Setup:</b> Use a stable internet connection and Google Chrome browser.</li>
                  <li><b>Time:</b> Complete all questions within 20 minutes.</li>
                  <li><b>System Check:</b> Permissions for Camera, Mic, and Screen Share will be requested on the next screen.</li>
                  <li><b>Environment:</b> Choose a distraction-free space and speak clearly.</li>
                </ul>
              </div>
            </div>

            {/* Footer: Checkbox & Button */}
            <div className="flex flex-col gap-4 mt-2 border-t pt-4">
              <div className="flex gap-2 items-center">
                <input
                  type="checkbox"
                  id="ack-instructions"
                  className="w-5 h-5 cursor-pointer accent-[#f2825c]"
                  checked={hasReadInstructions}
                  onChange={(e) => setHasReadInstructions(e.target.checked)}
                />
                <label htmlFor="ack-instructions" className="text-[#17383d]/80 text-sm cursor-pointer select-none">
                  I have read and understood all the instructions and guidelines.
                </label>
              </div>

              <div className="w-full flex items-center justify-end">
                <button
                  onClick={handleStartInterview}
                  disabled={loading || !hasReadInstructions}
                  className={`px-8 py-2.5 bg-[#184852] text-white rounded-md flex items-center gap-2 font-medium transition-all ${(loading || !hasReadInstructions) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#184852]/85 shadow-md'
                    }`}
                >
                  {loading && <Loader2 className="animate-spin" size={16} />}
                  Proceed to Interview
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
