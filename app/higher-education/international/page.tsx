"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldWrapper, Input, RadioGroup, Select, TypeaheadInput } from "@/components/ui/form";

const genders = ["Male", "Female", "Other"];
const qualifications = ["High School", "Diploma", "Undergraduate", "Postgraduate", "Professional Certificate", "Other"];
const intakeOptions = [
  { value: "fall", label: "Fall" },
  { value: "spring", label: "Spring" },
  { value: "summer", label: "Summer" }
];
const budgets = [
  { value: "below-10-lakhs", label: "Below ₹10 Lakhs" },
  { value: "10-20-lakhs", label: "₹10-20 Lakhs" },
  { value: "20-40-lakhs", label: "₹20-40 Lakhs" },
  { value: "40-60-lakhs", label: "₹40-60 Lakhs" },
  { value: "above-60-lakhs", label: "Above ₹60 Lakhs" }
];

const internationalCountries = [
  "USA", "UK", "Canada", "Australia", "New Zealand", "Germany", "France", 
  "Singapore", "Ireland", "Netherlands", "Sweden", "Switzerland", "Italy",
  "Spain", "Japan", "South Korea", "China", "Russia", "UAE", "Malaysia",
  "Austria", "Belgium", "Denmark", "Finland", "Norway", "Poland", "Portugal",
  "Brazil", "Argentina", "Mexico", "South Africa", "Egypt", "Turkey", "Saudi Arabia",
  "Qatar", "Oman", "Kuwait", "Bahrain", "Israel", "Philippines", "Thailand", "Vietnam",
  "Indonesia", "Taiwan", "Hong Kong", "Any"
];

const defaultValues = {
  fullName: "",
  age: "",
  gender: "",
  country: "",
  state: "",
  city: "",
  currentQualification: "",
  boardUniversity: "",
  percentage: "",
  cgpa: "",
  passingYear: "",
  preferredCountry: "",
  preferredUniversity: "",
  preferredCourse: "",
  preferredIntake: "",
  ielts: "",
  toefl: "",
  pte: "",
  sat: "",
  gre: "",
  gmat: "",
  budget: ""
};

const getNearestMatch = (input: string, options: string[]) => {
  const normalizedInput = input.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!normalizedInput) return "";
  
  for (const option of options) {
    const normalizedOption = option.trim().toLowerCase().replace(/\s+/g, ' ');
    if (normalizedOption.includes(normalizedInput)) return option;
  }
  
  let bestMatch = "";
  let highestScore = 0;
  for (const option of options) {
    const normalizedOption = option.trim().toLowerCase().replace(/\s+/g, ' ');
    let matchCount = 0;
    let i = 0, j = 0;
    while (i < normalizedInput.length && j < normalizedOption.length) {
      if (normalizedInput[i] === normalizedOption[j]) { matchCount++; i++; j++; }
      else { j++; }
    }
    const score = matchCount / normalizedInput.length;
    if (score > highestScore && score >= 0.6) {
      highestScore = score;
      bestMatch = option;
    }
  }
  return bestMatch;
};

export default function InternationalEducation() {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitMessage("");
    
    if (field === "preferredCountry" && value) {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = internationalCountries.find(country => country.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      if (!exactMatch && value.length > 2) {
        const nearest = getNearestMatch(value, internationalCountries);
        if (!nearest) {
          setErrors((current) => ({ ...current, preferredCountry: "You are currently on the International page; please only search for global locations." }));
        }
      }
    }
  };

  const handleLocationBlur = () => {
    if (!values.preferredCountry) return;
    const normalized = values.preferredCountry.trim().toLowerCase().replace(/\s+/g, ' ');
    const exactMatch = internationalCountries.find(country => country.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
    
    if (!exactMatch) {
      const nearest = getNearestMatch(values.preferredCountry, internationalCountries);
      if (nearest) {
        setValues(prev => ({ ...prev, preferredCountry: nearest }));
        setErrors(prev => ({ ...prev, preferredCountry: "" }));
      } else {
        setErrors(prev => ({ ...prev, preferredCountry: "You are currently on the International page; please only search for global locations." }));
      }
    }
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.age.trim()) nextErrors.age = "Age is required.";
    else if (!/^[0-9]{1,3}$/.test(values.age)) nextErrors.age = "Enter a valid age.";
    if (!values.gender.trim()) nextErrors.gender = "Gender is required.";
    if (!values.country.trim()) nextErrors.country = "Country is required.";
    if (!values.state.trim()) nextErrors.state = "State is required.";
    if (!values.city.trim()) nextErrors.city = "City is required.";

    if (!values.currentQualification) nextErrors.currentQualification = "Current qualification is required.";
    if (!values.boardUniversity.trim()) nextErrors.boardUniversity = "Board or university is required.";
    if (!values.percentage.trim()) nextErrors.percentage = "Percentage is required.";
    else if (!/^(100|[1-9]?[0-9])(?:\.[0-9]{1,2})?$/.test(values.percentage)) nextErrors.percentage = "Enter a valid percentage.";
    if (!values.cgpa.trim()) nextErrors.cgpa = "CGPA is required.";
    else if (!/^(10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?)$/.test(values.cgpa)) nextErrors.cgpa = "Enter a valid CGPA.";
    if (!values.passingYear.trim()) nextErrors.passingYear = "Passing year is required.";
    else if (!/^[0-9]{4}$/.test(values.passingYear)) nextErrors.passingYear = "Enter a valid year.";

    if (!values.preferredCountry.trim()) {
      nextErrors.preferredCountry = "Preferred country is required.";
    } else {
      const normalized = values.preferredCountry.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = internationalCountries.find(country => country.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      if (!exactMatch) {
        nextErrors.preferredCountry = "You are currently on the International page; please only search for global locations.";
      }
    }
    if (!values.preferredCourse.trim()) nextErrors.preferredCourse = "Preferred course is required.";
    if (!values.preferredIntake) nextErrors.preferredIntake = "Preferred intake is required.";

    if (values.ielts.trim() && !/^[0-9]+(?:\.[05])?$/.test(values.ielts)) nextErrors.ielts = "Enter a valid IELTS score.";
    if (values.toefl.trim() && !/^[0-9]{1,3}$/.test(values.toefl)) nextErrors.toefl = "Enter a valid TOEFL score.";
    if (values.pte.trim() && !/^[0-9]{1,3}$/.test(values.pte)) nextErrors.pte = "Enter a valid PTE score.";
    if (values.sat.trim() && !/^[0-9]{3,4}$/.test(values.sat)) nextErrors.sat = "Enter a valid SAT score.";
    if (values.gre.trim() && !/^[0-9]{3}$/.test(values.gre)) nextErrors.gre = "Enter a valid GRE score.";
    if (values.gmat.trim() && !/^[0-9]{3}$/.test(values.gmat)) nextErrors.gmat = "Enter a valid GMAT score.";

    if (!values.budget) nextErrors.budget = "Budget selection is required.";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitMessage("International education form is valid. Ready for future AI recommendation workflows.");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Link href="/" className="text-sky-400 hover:text-sky-300">Home</Link>
            <span>/</span>
            <Link href="/higher-education" className="text-sky-400 hover:text-sky-300">Higher Education</Link>
            <span>/</span>
            <span>International Education</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">International Education Path</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Share your academic background and study abroad preferences for future university matching and admission analysis.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.75fr_1fr] gap-8">
          <section className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">International Education Form</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Complete your study abroad profile</h2>
              </div>
            </div>

            {submitMessage ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200 mb-8">
                {submitMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 1: Personal Information</h3>
                <div className="grid gap-6 lg:grid-cols-3">
                  <FieldWrapper label="Full Name" htmlFor="fullName" error={errors.fullName}>
                    <Input
                      id="fullName"
                      value={values.fullName}
                      onChange={(event) => handleChange("fullName", event.target.value)}
                      placeholder="Enter full name"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Age" htmlFor="age" error={errors.age}>
                    <Input
                      id="age"
                      type="number"
                      value={values.age}
                      onChange={(event) => handleChange("age", event.target.value)}
                      placeholder="18"
                      min={1}
                      max={120}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Gender" htmlFor="gender" error={errors.gender}>
                    <Select
                      id="gender"
                      value={values.gender}
                      onChange={(event) => handleChange("gender", event.target.value)}
                    >
                      <option value="">Select gender</option>
                      {genders.map((gender) => (
                        <option key={gender} value={gender}>{gender}</option>
                      ))}
                    </Select>
                  </FieldWrapper>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <FieldWrapper label="Country" htmlFor="country" error={errors.country}>
                    <Input
                      id="country"
                      value={values.country}
                      onChange={(event) => handleChange("country", event.target.value)}
                      placeholder="Enter country"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="State" htmlFor="state" error={errors.state}>
                    <Input
                      id="state"
                      value={values.state}
                      onChange={(event) => handleChange("state", event.target.value)}
                      placeholder="Enter state"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="City" htmlFor="city" error={errors.city}>
                    <Input
                      id="city"
                      value={values.city}
                      onChange={(event) => handleChange("city", event.target.value)}
                      placeholder="Enter city"
                    />
                  </FieldWrapper>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 2: Academic Information</h3>
                <div className="grid gap-6 lg:grid-cols-2">
                  <FieldWrapper label="Current Qualification" htmlFor="currentQualification" error={errors.currentQualification}>
                    <Select
                      id="currentQualification"
                      value={values.currentQualification}
                      onChange={(event) => handleChange("currentQualification", event.target.value)}
                    >
                      <option value="">Select qualification</option>
                      {qualifications.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </Select>
                  </FieldWrapper>
                  <FieldWrapper label="Board / University" htmlFor="boardUniversity" error={errors.boardUniversity}>
                    <Input
                      id="boardUniversity"
                      value={values.boardUniversity}
                      onChange={(event) => handleChange("boardUniversity", event.target.value)}
                      placeholder="Enter board or university"
                    />
                  </FieldWrapper>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                  <FieldWrapper label="Percentage" htmlFor="percentage" error={errors.percentage}>
                    <Input
                      id="percentage"
                      type="number"
                      value={values.percentage}
                      onChange={(event) => handleChange("percentage", event.target.value)}
                      placeholder="85"
                      min={0}
                      max={100}
                      step="0.01"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="CGPA" htmlFor="cgpa" error={errors.cgpa}>
                    <Input
                      id="cgpa"
                      type="number"
                      value={values.cgpa}
                      onChange={(event) => handleChange("cgpa", event.target.value)}
                      placeholder="9.2"
                      min={0}
                      max={10}
                      step="0.01"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Passing Year" htmlFor="passingYear" error={errors.passingYear}>
                    <Input
                      id="passingYear"
                      type="number"
                      value={values.passingYear}
                      onChange={(event) => handleChange("passingYear", event.target.value)}
                      placeholder="2025"
                      min={1900}
                      max={2100}
                    />
                  </FieldWrapper>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 3: Study Abroad Preferences</h3>
                <div className="grid gap-6 lg:grid-cols-2">
                  <FieldWrapper label="Preferred Country" htmlFor="preferredCountry" error={errors.preferredCountry}>
                  <TypeaheadInput
                    id="preferredCountry"
                    value={values.preferredCountry}
                    onChange={(val) => handleChange("preferredCountry", val)}
                    onBlur={handleLocationBlur}
                    options={internationalCountries}
                    placeholder="Enter country preference"
                    error={errors.preferredCountry}
                  />
                  </FieldWrapper>
                  <FieldWrapper label="Preferred University (Optional)" htmlFor="preferredUniversity" error={errors.preferredUniversity}>
                    <Input
                      id="preferredUniversity"
                      value={values.preferredUniversity}
                      onChange={(event) => handleChange("preferredUniversity", event.target.value)}
                      placeholder="Enter preferred university"
                    />
                  </FieldWrapper>
                </div>
                <div className="grid gap-6 lg:grid-cols-2">
                  <FieldWrapper label="Preferred Course" htmlFor="preferredCourse" error={errors.preferredCourse}>
                    <Input
                      id="preferredCourse"
                      value={values.preferredCourse}
                      onChange={(event) => handleChange("preferredCourse", event.target.value)}
                      placeholder="Enter preferred course"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="Preferred Intake" htmlFor="preferredIntake" error={errors.preferredIntake}>
                    <RadioGroup
                      name="preferredIntake"
                      options={intakeOptions}
                      value={values.preferredIntake}
                      onChange={(event) => handleChange("preferredIntake", event.target.value)}
                    />
                  </FieldWrapper>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 4: Language Test Scores</h3>
                <div className="grid gap-6 lg:grid-cols-3">
                  <FieldWrapper label="IELTS" htmlFor="ielts" error={errors.ielts}>
                    <Input
                      id="ielts"
                      type="number"
                      value={values.ielts}
                      onChange={(event) => handleChange("ielts", event.target.value)}
                      placeholder="6.5"
                      min={0}
                      max={9}
                      step="0.5"
                    />
                  </FieldWrapper>
                  <FieldWrapper label="TOEFL" htmlFor="toefl" error={errors.toefl}>
                    <Input
                      id="toefl"
                      type="number"
                      value={values.toefl}
                      onChange={(event) => handleChange("toefl", event.target.value)}
                      placeholder="100"
                      min={0}
                      max={120}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="PTE" htmlFor="pte" error={errors.pte}>
                    <Input
                      id="pte"
                      type="number"
                      value={values.pte}
                      onChange={(event) => handleChange("pte", event.target.value)}
                      placeholder="65"
                      min={0}
                      max={90}
                    />
                  </FieldWrapper>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 5: Standardized Test Scores</h3>
                <div className="grid gap-6 lg:grid-cols-3">
                  <FieldWrapper label="SAT" htmlFor="sat" error={errors.sat}>
                    <Input
                      id="sat"
                      type="number"
                      value={values.sat}
                      onChange={(event) => handleChange("sat", event.target.value)}
                      placeholder="1200"
                      min={400}
                      max={1600}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="GRE" htmlFor="gre" error={errors.gre}>
                    <Input
                      id="gre"
                      type="number"
                      value={values.gre}
                      onChange={(event) => handleChange("gre", event.target.value)}
                      placeholder="320"
                      min={260}
                      max={340}
                    />
                  </FieldWrapper>
                  <FieldWrapper label="GMAT" htmlFor="gmat" error={errors.gmat}>
                    <Input
                      id="gmat"
                      type="number"
                      value={values.gmat}
                      onChange={(event) => handleChange("gmat", event.target.value)}
                      placeholder="700"
                      min={200}
                      max={800}
                    />
                  </FieldWrapper>
                </div>
              </div>

              <div className="rounded-3xl border border-slate-700 bg-slate-950/60 p-6 space-y-6">
                <h3 className="text-xl font-semibold text-white">Section 6: Budget</h3>
                <FieldWrapper label="Budget Range" htmlFor="budget" error={errors.budget}>
                  <RadioGroup
                    name="budget"
                    options={budgets}
                    value={values.budget}
                    onChange={(event) => handleChange("budget", event.target.value)}
                  />
                </FieldWrapper>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400 max-w-2xl">
                  This form captures the data needed to support later recommendations for country matching, university selection, admission probability, scholarship guidance, visa planning, and education roadmaps.
                </p>
                <Button type="submit">Validate & Continue</Button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Future AI Support</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Designed for recommendation engines</h2>
              </div>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>• Country recommendation based on location and budget</li>
                <li>• University and course matching</li>
                <li>• Admission probability analysis</li>
                <li>• Scholarship suggestion readiness</li>
                <li>• Estimated study cost and visa guidance</li>
              </ul>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5 text-slate-300">
                <p className="text-sm font-medium text-slate-100">Why this matters</p>
                <p className="mt-3 text-sm leading-6">
                  A complete profile lets future AI engines evaluate your academic fit, budget constraints, country preferences, and test readiness for study abroad planning.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
