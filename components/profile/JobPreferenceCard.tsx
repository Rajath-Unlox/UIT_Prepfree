"use client";
import React, { useState } from "react";
import axios from "axios";
import { Pen, X } from "lucide-react";
import api from "@/lib/api";

// ===================================================
// MAIN COMPONENT
// ===================================================
const JobPreferenceSection = ({ user, formData, setFormData }: any) => {
  const [edit, setEdit] = useState<string | null>(null);

  const handleClick = (key: string) => {
    setEdit(key);
  };

  const handleCancel = () => {
    setEdit(null);
  };

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      jobPreference: {
        ...prev.jobPreference,
        [name]: value,
      },
    }));
  };

  const handleSave = async () => {
    try {
      const token = localStorage.getItem("token");

      await api.post("/users/update-profile", {
        jobPreference: formData.jobPreference,
      });

      //   alert("Job Preference Updated!");
      user.jobPreference = formData.jobPreference;
      setEdit(null);
    } catch (err) {
      console.log(err);
      //   alert("Error updating job preference");
    }
  };

  const openForOptions = [
    "Internship",
    "Full Time",
    "Part Time",
    "Volunteering",
    "Contract",
    "Internship + PPO",
  ];

  return (
    <div className="w-full">
      {/* ================= HEADER ================= */}
      <div className="w-full flex items-center justify-between">
        <h1 className="text-[#1E1E1E] font-bold text-lg">Job Preferences</h1>

        <div
          onClick={() => handleClick("pref")}
          className="flex gap-1 items-center font-bold cursor-pointer"
        >
          <Pen size={16} />
          <h1>Edit</h1>
        </div>
      </div>

      {/* =======================================================
          ====================== EDIT MODE ======================
          ======================================================= */}
      {edit === "pref" ? (
        <div className="w-full h-auto rounded-lg bg-white p-5 flex flex-col gap-2">
          <div className="w-full flex flex-col gap-4">
            {/* OPEN FOR TAGS */}
            <div className="flex flex-col gap-1">
              <label>Open for</label>
              <div className="flex flex-wrap w-full gap-2">
                {openForOptions.map((item, idx) => {
                  const active = formData.jobPreference.openFor.includes(item);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        const isSelected =
                          formData.jobPreference.openFor.includes(item);

                        setFormData((prev: any) => ({
                          ...prev,
                          jobPreference: {
                            ...prev.jobPreference,
                            openFor: isSelected
                              ? prev.jobPreference.openFor.filter(
                                  (v: string) => v !== item
                                ) // remove
                              : [...prev.jobPreference.openFor, item], // add
                          },
                        }));
                      }}
                      className={`px-8 py-2 border-2 rounded-full cursor-pointer transition
            ${
              active
                ? "bg-[#f2825c] text-white border-[#f2825c]"
                : "border-[#f2825c]"
            }
          `}
                    >
                      {item}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bubble Inputs */}
            <BubbleInput
              label="Preferred Location"
              field="preferedLocation"
              formData={formData}
              setFormData={setFormData}
            />

            <BubbleInput
              label="Job Roles"
              field="jobRole"
              formData={formData}
              setFormData={setFormData}
            />

            <BubbleInput
              label="Industry"
              field="industry"
              formData={formData}
              setFormData={setFormData}
            />

            {/* Expected CTC */}
            <div className="flex flex-col gap-1 w-[70%]">
              <label>Expected CTC</label>
              <div className="flex gap-4 w-full">
                <Currency />
                <div className="border rounded-md py-2 px-2 flex w-full justify-between">
                  <input
                    type="text"
                    name="expectedCTC"
                    value={formData.jobPreference.expectedCTC}
                    onChange={handleChange}
                    className="border-none outline-none w-auto"
                  />
                  <p>Per Year</p>
                </div>
              </div>
            </div>

            {/* Willing to Relocate */}
            <div className="flex flex-col gap-1 w-[70%]">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="willingToRelocate"
                  checked={formData.jobPreference.willingToRelocate}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      jobPreference: {
                        ...prev.jobPreference,
                        willingToRelocate: e.target.checked,
                      },
                    }))
                  }
                  className="h-4 w-4 cursor-pointer"
                />
                <span>Willing to Relocate</span>
              </div>
            </div>
          </div>

          {/* SAVE / CANCEL */}
          <div className="w-full flex items-center justify-end border-t border-[#cfe3e0]/20 py-2 mt-2">
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
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
      ) : (
        /* =======================================================
           ====================== VIEW MODE ======================
           ======================================================= */
        <div className="w-full h-auto rounded-lg overflow-hidden bg-white p-5 flex flex-col gap-2">
          <Row
            label="Job Roles"
            value={user?.jobPreference?.jobRole?.join(", ") || "-"}
          />
          <Row
            label="Open For"
            value={
              user?.jobPreference?.openFor?.length > 0
                ? user.jobPreference.openFor.join(", ")
                : "-"
            }
          />

          <Row
            label="Expected CTC"
            value={user?.jobPreference?.expectedCTC || "-"}
          />

          <Row
            label="Industry"
            value={user?.jobPreference?.industry?.join(", ") || "-"}
          />

          <Row
            label="Preferred Location"
            value={user?.jobPreference?.preferedLocation?.join(", ") || "-"}
          />

          <Row
            label="Willing to Relocate"
            value={user?.jobPreference?.willingToRelocate ? "Yes" : "No"}
          />
        </div>
      )}
    </div>
  );
};

export default JobPreferenceSection;

// ===================================================
// VIEW MODE ROW COMPONENT
// ===================================================
const Row = ({ label, value }: any) => (
  <div className="w-full flex items-center">
    <p className="w-[30%]">{label}:</p>
    <p className="w-[30%] text-center font-medium">{value}</p>
  </div>
);

// ===================================================
// BUBBLE INPUT COMPONENT
// ===================================================
const BubbleInput = ({ label, field, formData, setFormData }: any) => {
  const [inputValue, setInputValue] = useState("");

  const handleAdd = (e: any) => {
    if (e.key === "Enter" && inputValue.trim() !== "") {
      e.preventDefault();
      setFormData((prev: any) => ({
        ...prev,
        jobPreference: {
          ...prev.jobPreference,
          [field]: [...prev.jobPreference[field], inputValue.trim()],
        },
      }));
      setInputValue("");
    }
  };

  const handleRemove = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      jobPreference: {
        ...prev.jobPreference,
        [field]: prev.jobPreference[field].filter(
          (_: any, i: number) => i !== index
        ),
      },
    }));
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <label>{label}</label>

      <div className="flex flex-wrap gap-2 mb-1">
        {formData.jobPreference[field].map((item: string, index: number) => (
          <div
            key={index}
            className="flex items-center gap-1 bg-gray-200 px-2 py-1 rounded-full"
          >
            <span>{item}</span>
            <X
              className="w-4 h-4 cursor-pointer"
              onClick={() => handleRemove(index)}
            />
          </div>
        ))}
      </div>

      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleAdd}
        placeholder="Type and press Enter"
        className="border rounded-md py-2 px-2"
      />
    </div>
  );
};

// ===================================================
// CURRENCY DROPDOWN
// ===================================================
const Currency = () => {
  return (
    <select className="border rounded-md py-2 px-1">
      <option value="AFN">AFN</option>
      <option value="ALL">ALL</option>
      <option value="DZD">DZD</option>
      <option value="AOA">AOA</option>
      <option value="ARS">ARS</option>
      <option value="AMD">AMD</option>
      <option value="AWG">AWG</option>
      <option value="AUD">AUD</option>
      <option value="AZN">AZN</option>
      <option value="BHD">BHD</option>
      <option value="BSD">BSD</option>
      <option value="BDT">BDT</option>
      <option value="BBD">BBD</option>
      <option value="BYN">BYN</option>
      <option value="BZD">BZD</option>
      <option value="BMD">BMD</option>
      <option value="BTN">BTN</option>
      <option value="BOB">BOB</option>
      <option value="BAM">BAM</option>
      <option value="BWP">BWP</option>
      <option value="BRL">BRL</option>
      <option value="GBP">GBP</option>
      <option value="BND">BND</option>
      <option value="MMK">MMK</option>
      <option value="BIF">BIF</option>
      <option value="KHR">KHR</option>
      <option value="CAD">CAD</option>
      <option value="CVE">CVE</option>
      <option value="KYD">KYD</option>
      <option value="XAF">XAF</option>
      <option value="XPF">XPF</option>
      <option value="CLP">CLP</option>
      <option value="CNY">CNY</option>
      <option value="COP">COP</option>
      <option value="KMF">KMF</option>
      <option value="CDF">CDF</option>
      <option value="CRC">CRC</option>
      <option value="HRK">HRK</option>
      <option value="CUC">CUC</option>
      <option value="CUP">CUP</option>
      <option value="CZK">CZK</option>
      <option value="DKK">DKK</option>
      <option value="DOP">DOP</option>
      <option value="DJF">DJF</option>
      <option value="XCD">XCD</option>
      <option value="EGP">EGP</option>
      <option value="ERN">ERN</option>
      <option value="ETB">ETB</option>
      <option value="EUR">EUR</option>
      <option value="FKP">FKP</option>
      <option value="FJD">FJD</option>
      <option value="GMD">GMD</option>
      <option value="GEL">GEL</option>
      <option value="GHS">GHS</option>
      <option value="GIP">GIP</option>
      <option value="GTQ">GTQ</option>
      <option value="GGP">GGP</option>
      <option value="GNF">GNF</option>
      <option value="GYD">GYD</option>
      <option value="HTG">HTG</option>
      <option value="HNL">HNL</option>
      <option value="HKD">HKD</option>
      <option value="HUF">HUF</option>
      <option value="ISK">ISK</option>
      <option value="INR">INR</option>
      <option value="IDR">IDR</option>
      <option value="IRR">IRR</option>
      <option value="IQD">IQD</option>
      <option value="ILS">ILS</option>
      <option value="JMD">JMD</option>
      <option value="JPY">JPY</option>
      <option value="JEP">JEP</option>
      <option value="JOD">JOD</option>
      <option value="KZT">KZT</option>
      <option value="KES">KES</option>
      <option value="KID">KID</option>
      <option value="KGS">KGS</option>
      <option value="KWD">KWD</option>
      <option value="LAK">LAK</option>
      <option value="LBP">LBP</option>
      <option value="LSL">LSL</option>
      <option value="LRD">LRD</option>
      <option value="LYD">LYD</option>
      <option value="MOP">MOP</option>
      <option value="MKD">MKD</option>
      <option value="MGA">MGA</option>
      <option value="MWK">MWK</option>
      <option value="MYR">MYR</option>
      <option value="MVR">MVR</option>
      <option value="IMP">IMP</option>
      <option value="MRU">MRU</option>
      <option value="MUR">MUR</option>
      <option value="MXN">MXN</option>
      <option value="MDL">MDL</option>
      <option value="MNT">MNT</option>
      <option value="MAD">MAD</option>
      <option value="MZN">MZN</option>
      <option value="NAD">NAD</option>
      <option value="NPR">NPR</option>
      <option value="ANG">ANG</option>
      <option value="TWD">TWD</option>
      <option value="NZD">NZD</option>
      <option value="NIO">NIO</option>
      <option value="NGN">NGN</option>
      <option value="KPW">KPW</option>
      <option value="NOK">NOK</option>
      <option value="OMR">OMR</option>
      <option value="PKR">PKR</option>
      <option value="PAB">PAB</option>
      <option value="PGK">PGK</option>
      <option value="PYG">PYG</option>
      <option value="PEN">PEN</option>
      <option value="PHP">PHP</option>
      <option value="PLN">PLN</option>
      <option value="QAR">QAR</option>
      <option value="RON">RON</option>
      <option value="RUB">RUB</option>
      <option value="RWF">RWF</option>
      <option value="SHP">SHP</option>
      <option value="WST">WST</option>
      <option value="STN">STN</option>
      <option value="SAR">SAR</option>
      <option value="RSD">RSD</option>
      <option value="SLL">SLL</option>
      <option value="SGD">SGD</option>
      <option value="SOS">SOS</option>
      <option value="SLS">SLS</option>
      <option value="ZAR">ZAR</option>
      <option value="KRW">KRW</option>
      <option value="SSP">SSP</option>
      <option value="SRD">SRD</option>
      <option value="SEK">SEK</option>
      <option value="CHF">CHF</option>
      <option value="LKR">LKR</option>
      <option value="SZL">SZL</option>
      <option value="SYP">SYP</option>
      <option value="TJS">TJS</option>
      <option value="TZS">TZS</option>
      <option value="THB">THB</option>
      <option value="TOP">TOP</option>
      <option value="PRB">PRB</option>
      <option value="TTD">TTD</option>
      <option value="TND">TND</option>
      <option value="TRY">TRY</option>
      <option value="TMT">TMT</option>
      <option value="TVD">TVD</option>
      <option value="UGX">UGX</option>
      <option value="UAH">UAH</option>
      <option value="AED">AED</option>
      <option value="USD">USD</option>
      <option value="UYU">UYU</option>
      <option value="UZS">UZS</option>
      <option value="VUV">VUV</option>
      <option value="VES">VES</option>
      <option value="VND">VND</option>
      <option value="XOF">XOF</option>
      <option value="ZMW">ZMW</option>
      <option value="ZWB">ZWB</option>
    </select>
  );
};
