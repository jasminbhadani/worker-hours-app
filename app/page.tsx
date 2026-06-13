"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [language, setLanguage] = useState("en");

  const [formData, setFormData] = useState({
    workerName: "",
    jobSite: "",
    workDate: "",
    hoursWorked: "",
    shift: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState("");

  const text = {
    en: {
      title: "Work Hours Tracker",
      subtitle: "Enter your work hours below",
      worker: "Worker Name",
      site: "Job Site",
      date: "Work Date",
      hours: "Hours Worked",
      shift: "Shift",
      selectShift: "Select Shift",
      day: "Day Shift",
      night: "Night Shift",
      submit: "Submit Hours",
      success: "Hours submitted successfully.",
      validation: {
        workerRequired: "Worker name is required.",
        workerInvalid: "Please enter a valid worker name.",
        siteRequired: "Job site is required.",
        dateRequired: "Work date is required.",
        futureDate: "Work date cannot be in the future.",
        hoursRequired: "Hours worked is required.",
        hoursRange: "Hours must be between 0.25 and 24.",
        shiftRequired: "Please select a shift.",
        },
        requiredFields: "* Required fields",
      },
    es: {
      title: "Registro de Horas",
      subtitle: "Ingrese sus horas de trabajo",
      worker: "Nombre del Trabajador",
      site: "Lugar de Trabajo",
      date: "Fecha de Trabajo",
      hours: "Horas Trabajadas",
      shift: "Turno",
      selectShift: "Seleccione Turno",
      day: "Turno de Día",
      night: "Turno de Noche",
      submit: "Enviar Horas",
      success: "Horas enviadas correctamente.",
      validation: {
        workerRequired: "El nombre del trabajador es obligatorio.",
        workerInvalid: "Ingrese un nombre válido.",
        siteRequired: "El lugar de trabajo es obligatorio.",
        dateRequired: "La fecha de trabajo es obligatoria.",
        futureDate: "La fecha de trabajo no puede ser futura.",
        hoursRequired: "Las horas trabajadas son obligatorias.",
        hoursRange: "Las horas deben estar entre 0.25 y 24.",
        shiftRequired: "Seleccione un turno.",
        },
      requiredFields: "* Campos obligatorios",
      },
    };

  const t = text[language as keyof typeof text];

  const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
) => {
  const { name, value } = e.target;

  setFormData({
    ...formData,
    [name]: value,
  });

  if (errors[name]) {
    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }
};

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const nameRegex = /^[A-Za-zÀ-ÿ\s'.-]+$/;

    if (!formData.workerName.trim()) {
      newErrors.workerName = t.validation.workerRequired;
    } else if (
      formData.workerName.trim().length < 2 ||
      !nameRegex.test(formData.workerName.trim())
    ) {
      newErrors.workerName = t.validation.workerInvalid;
    }

    if (!formData.jobSite.trim()) {
      newErrors.jobSite = t.validation.siteRequired;;
    }

    if (!formData.workDate) {
      newErrors.workDate = t.validation.dateRequired;
    } else {
      const selectedDate = new Date(formData.workDate);
      const today = new Date();

      today.setHours(0, 0, 0, 0);

      if (selectedDate > today) {
        newErrors.workDate = t.validation.futureDate;
      }
    }

    if (!formData.hoursWorked) {
      newErrors.hoursWorked = t.validation.hoursRequired;
    } else {
      const hours = Number(formData.hoursWorked);

      if (hours < 0.25 || hours > 24) {
        newErrors.hoursWorked =
          t.validation.hoursRange;;
      }
    }

    if (!formData.shift) {
      newErrors.shift = t.validation.shiftRequired;
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  setSuccess("");

  if (!validateForm()) return;

  const { error } = await supabase
    .from("work_entries")
    .insert([
      {
        worker_name: formData.workerName,
        job_site: formData.jobSite,
        work_date: formData.workDate,
        hours_worked: Number(formData.hoursWorked),
        shift: formData.shift,
      },
    ]);

  if (error) {
  console.error("Supabase Error:", error);
  alert(error.message);
  return;
}

  setSuccess(t.success);

  setFormData({
    workerName: "",
    jobSite: "",
    workDate: "",
    hoursWorked: "",
    shift: "",
  });

  setErrors({});
};

return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={() => {
              setLanguage(language === "en" ? "es" : "en");
              setErrors({});
              setSuccess("");
            }}
            className="text-sm text-blue-600 font-medium"
          >
            {language === "en" ? "🇪🇸 Español" : "🇺🇸 English"}
          </button>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          ⏱️ {t.title}
        </h1>

        <p className="text-center text-gray-500 mb-6">
          {t.subtitle}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Worker Name */}
          <div>
            <label className="block mb-1 font-medium">
              {t.worker} <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="workerName"
              value={formData.workerName}
              placeholder={
                language === "en"
                  ? "John Smith"
                  : "Juan García"
              }
              onChange={handleChange}
              className={`w-full rounded-lg p-3 border ${
                errors.workerName
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {errors.workerName && (
              <p className="text-red-500 text-sm mt-1">
                {errors.workerName}
              </p>
            )}
          </div>

          {/* Job Site */}
          <div>
            <label className="block mb-1 font-medium">
              {t.site} <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              name="jobSite"
              value={formData.jobSite}
              placeholder={
                language === "en"
                  ? "Dallas Apartment Project"
                  : "Proyecto de Apartamentos Dallas"
              }
              onChange={handleChange}
              className={`w-full rounded-lg p-3 border ${
                errors.jobSite
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {errors.jobSite && (
              <p className="text-red-500 text-sm mt-1">
                {errors.jobSite}
              </p>
            )}
          </div>

          {/* Work Date */}
          <div>
            <label className="block mb-1 font-medium">
              {t.date} (MM/DD/YYYY)
              <span className="text-red-500"> *</span>
            </label>

            <input
              type="date"
              name="workDate"
              value={formData.workDate}
              onChange={handleChange}
              className={`w-full rounded-lg p-3 border ${
                errors.workDate
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {errors.workDate && (
              <p className="text-red-500 text-sm mt-1">
                {errors.workDate}
              </p>
            )}
          </div>

          {/* Hours Worked */}
          <div>
            <label className="block mb-1 font-medium">
              {t.hours}
              <span className="text-red-500"> *</span>
            </label>

            <input
              type="number"
              step="0.25"
              min="0.25"
              max="24"
              name="hoursWorked"
              value={formData.hoursWorked}
              placeholder="8"
              onChange={handleChange}
              onKeyDown={(e) => {
                if (
                  e.key === "e" ||
                  e.key === "E" ||
                  e.key === "+" ||
                  e.key === "-"
                ) {
                  e.preventDefault();
                }
              }}
              className={`w-full rounded-lg p-3 border ${
                errors.hoursWorked
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            />

            {errors.hoursWorked && (
              <p className="text-red-500 text-sm mt-1">
                {errors.hoursWorked}
              </p>
            )}
              <p className="text-xs text-gray-500 mt-1">
                {language === "en"
                  ? "Allowed: 0.25 - 24 hours"
                  : "Permitido: 0.25 - 24 horas"}
              </p>
          </div>

          {/* Shift */}
          <div>
            <label className="block mb-1 font-medium">
              {t.shift}
              <span className="text-red-500"> *</span>
            </label>

            <select
              name="shift"
              value={formData.shift}
              onChange={handleChange}
              className={`w-full rounded-lg p-3 border ${
                errors.shift
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
            >
              <option value="">
                {t.selectShift}
              </option>
              <option value="Day">{t.day}</option>
              <option value="Night">{t.night}</option>
            </select>

            {errors.shift && (
              <p className="text-red-500 text-sm mt-1">
                {errors.shift}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium p-3 rounded-lg"
          >
            {t.submit}
          </button>

          {success && (
            <div className="bg-green-100 text-green-700 p-3 rounded-lg text-center">
              ✅ {success}
            </div>
          )}
        </form>
        <p className="text-center text-xs text-gray-500 mt-4">
          {t.requiredFields}
        </p>
        <p className="text-center text-gray-400 text-sm mt-6">
          Powered by Work Hours Tracker
        </p>
      </div>
    </main>
  );
}