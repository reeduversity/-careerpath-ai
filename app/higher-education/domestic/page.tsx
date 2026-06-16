"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FieldWrapper, Input, RadioGroup, Select, TypeaheadInput } from "@/components/ui/form";

const educationLevels = ["Class 10", "Class 12", "Diploma", "Undergraduate", "Postgraduate"];
const boards = ["CBSE", "ICSE", "State Board", "IB", "Other"];
const streams = ["Science", "Commerce", "Arts", "Vocational", "Other"];
const careerGoals = [
  "Engineering",
  "Medical",
  "Law",
  "Management",
  "Commerce",
  "Arts",
  "Science",
  "Architecture",
  "Pharmacy",
  "Nursing",
  "Agriculture",
  "Design",
  "Hotel Management",
  "Mass Communication",
  "Government Jobs",
  "Civil Services",
  "Defense",
  "Teaching",
  "Research",
  "Data Science",
  "AI / ML",
  "Cyber Security",
  "Software Development",
  "Other"
];
const budgets = [
  { value: "below-2-lakhs", label: "Below 2 Lakhs" },
  { value: "2-5-lakhs", label: "2-5 Lakhs" },
  { value: "5-10-lakhs", label: "5-10 Lakhs" },
  { value: "10-20-lakhs", label: "10-20 Lakhs" },
  { value: "above-20-lakhs", label: "Above 20 Lakhs" }
];

const indianStates = [
  "Andaman and Nicobar Islands", "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", 
  "Chandigarh", "Chhattisgarh", "Dadra and Nagar Haveli", "Daman and Diu", "Delhi NCR", 
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jammu and Kashmir", "Jharkhand", 
  "Karnataka", "Kerala", "Ladakh", "Lakshadweep", "Madhya Pradesh", "Maharashtra", 
  "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Puducherry", "Punjab", 
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", 
  "Uttarakhand", "West Bengal", "Anywhere in India"
];

const examFieldMap: Record<string, Array<{ key: string; label: string; placeholder: string }>> = {
  Engineering: [
    { key: "jeeMainRank", label: "JEE Main Rank", placeholder: "Enter JEE Main rank" },
    { key: "jeeAdvancedRank", label: "JEE Advanced Rank", placeholder: "Enter JEE Advanced rank" },
    { key: "stateEngRank", label: "State Engineering Entrance Rank", placeholder: "Enter state entrance rank" }
  ],
  Medical: [
    { key: "neetScore", label: "NEET Score", placeholder: "Enter NEET score" },
    { key: "neetRank", label: "NEET Rank", placeholder: "Enter NEET rank" }
  ],
  Management: [
    { key: "catPercentile", label: "CAT Percentile", placeholder: "Enter CAT percentile" },
    { key: "xatPercentile", label: "XAT Percentile", placeholder: "Enter XAT percentile" },
    { key: "matScore", label: "MAT Score", placeholder: "Enter MAT score" },
    { key: "cmatScore", label: "CMAT Score", placeholder: "Enter CMAT score" }
  ],
  Law: [
    { key: "clatScore", label: "CLAT Score", placeholder: "Enter CLAT score" }
  ],
  Architecture: [
    { key: "nataScore", label: "NATA Score", placeholder: "Enter NATA score" },
    { key: "jeePaper2Score", label: "JEE Paper 2 Score", placeholder: "Enter JEE Paper 2 score" }
  ],
  "Government Jobs": [
    { key: "govExamScore", label: "Relevant Exam Score", placeholder: "Enter government exam score" }
  ],
  Other: [
    { key: "otherExamDetail", label: "Other Exam / Custom Detail", placeholder: "Enter custom exam or qualification" }
  ]
};

const defaultValues = {
  fullName: "",
  fatherName: "",
  motherName: "",
  age: "",
  gender: "",
  state: "",
  city: "",
  preferredStudyLocation: "",
  currentEducation: "",
  board: "",
  schoolCollege: "",
  percentage: "",
  cgpa: "",
  passingYear: "",
  stream: "",
  careerGoal: "",
  targetProfession: "",
  budget: "",
  examScores: {} as Record<string, string>
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

export default function DomesticEducation() {
  const [values, setValues] = useState(defaultValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitMessage, setSubmitMessage] = useState("");

  const handleChange = (field: string, value: string) => {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
    setSubmitMessage("");
    
    if (field === "preferredStudyLocation" && value) {
      const normalized = value.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = indianStates.find(state => state.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      if (!exactMatch && value.length > 3) {
        const nearest = getNearestMatch(value, indianStates);
        if (!nearest) {
          setErrors((current) => ({ ...current, preferredStudyLocation: "You are currently on the Domestic page; please only search for Indian locations." }));
        }
      }
    }
  };

  const handleLocationBlur = () => {
    if (!values.preferredStudyLocation) return;
    const normalized = values.preferredStudyLocation.trim().toLowerCase().replace(/\s+/g, ' ');
    const exactMatch = indianStates.find(state => state.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
    
    if (!exactMatch) {
      const nearest = getNearestMatch(values.preferredStudyLocation, indianStates);
      if (nearest) {
        setValues(prev => ({ ...prev, preferredStudyLocation: nearest }));
        setErrors(prev => ({ ...prev, preferredStudyLocation: "" }));
      } else {
        setErrors(prev => ({ ...prev, preferredStudyLocation: "You are currently on the Domestic page; please only search for Indian locations." }));
      }
    }
  };

  const handleExamScoreChange = (key: string, value: string) => {
    setValues((current) => ({
      ...current,
      examScores: {
        ...current.examScores,
        [key]: value
      }
    }));
    setErrors((current) => ({ ...current, [key]: "" }));
    setSubmitMessage("");
  };

  const currentExamFields = values.careerGoal ? examFieldMap[values.careerGoal] || [] : [];

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!values.fullName.trim()) nextErrors.fullName = "Full name is required.";
    if (!values.fatherName.trim()) nextErrors.fatherName = "Father name is required.";
    if (!values.motherName.trim()) nextErrors.motherName = "Mother name is required.";
    if (!values.age.trim()) nextErrors.age = "Age is required.";
    else if (!/^[0-9]{1,3}$/.test(values.age)) nextErrors.age = "Enter a valid age.";
    if (!values.gender.trim()) nextErrors.gender = "Gender is required.";
    if (!values.state.trim()) nextErrors.state = "State is required.";
    if (!values.city.trim()) nextErrors.city = "City is required.";
    if (!values.preferredStudyLocation.trim()) {
      nextErrors.preferredStudyLocation = "Preferred study location is required.";
    } else {
      const normalized = values.preferredStudyLocation.trim().toLowerCase().replace(/\s+/g, ' ');
      const exactMatch = indianStates.find(state => state.trim().toLowerCase().replace(/\s+/g, ' ') === normalized);
      if (!exactMatch) {
        nextErrors.preferredStudyLocation = "You are currently on the Domestic page; please only search for Indian locations.";
      }
    }

    if (!values.currentEducation) nextErrors.currentEducation = "Current education is required.";
    if (!values.board) nextErrors.board = "Board is required.";
    if (!values.schoolCollege.trim()) nextErrors.schoolCollege = "School or college is required.";
    if (!values.percentage.trim()) nextErrors.percentage = "Percentage is required.";
    else if (!/^(100|[1-9]?[0-9])(?:\.[0-9]{1,2})?$/.test(values.percentage)) nextErrors.percentage = "Enter a valid percentage.";
    if (!values.cgpa.trim()) nextErrors.cgpa = "CGPA is required.";
    else if (!/^(10(?:\.0{1,2})?|[0-9](?:\.[0-9]{1,2})?)$/.test(values.cgpa)) nextErrors.cgpa = "Enter a valid CGPA.";
    if (!values.passingYear.trim()) nextErrors.passingYear = "Passing year is required.";
    else if (!/^[0-9]{4}$/.test(values.passingYear)) nextErrors.passingYear = "Enter a valid year.";
    if (!values.stream) nextErrors.stream = "Stream is required.";

    if (!values.careerGoal.trim()) nextErrors.careerGoal = "Career goal is required.";
    if (!values.targetProfession.trim()) nextErrors.targetProfession = "Target profession is required.";
    if (!values.budget) nextErrors.budget = "Budget selection is required.";

    currentExamFields.forEach((exam) => {
      if (!values.examScores[exam.key]?.trim()) {
        nextErrors[exam.key] = `${exam.label} is required.`;
      }
    });

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    setSubmitMessage("Domestic education form is valid. Ready for backend integration.");
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
            <span>Domestic Education</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold">Domestic Education Path</h1>
          <p className="max-w-3xl text-lg text-slate-300">
            Complete your academic profile and career goals so CareerPath AI can generate the right education roadmap.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1.8fr_1fr] gap-8">
          <section className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            <div className="flex items-center justify-between gap-4 mb-8">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">Domestic Education Form</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Tell us about your profile</h2>
              </div>
            </div>

            {submitMessage ? (
              <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-200 mb-8">
                {submitMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Full Name" htmlFor="fullName" error={errors.fullName}>
                  <Input
                    id="fullName"
                    value={values.fullName}
                    onChange={(event) => handleChange("fullName", event.target.value)}
                    placeholder="Enter full name"
                  />
                </FieldWrapper>
                <FieldWrapper label="Father Name" htmlFor="fatherName" error={errors.fatherName}>
                  <Input
                    id="fatherName"
                    value={values.fatherName}
                    onChange={(event) => handleChange("fatherName", event.target.value)}
                    placeholder="Enter father name"
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Mother Name" htmlFor="motherName" error={errors.motherName}>
                  <Input
                    id="motherName"
                    value={values.motherName}
                    onChange={(event) => handleChange("motherName", event.target.value)}
                    placeholder="Enter mother name"
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
                    max={100}
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Gender" htmlFor="gender" error={errors.gender}>
                  <Select
                    id="gender"
                    value={values.gender}
                    onChange={(event) => handleChange("gender", event.target.value)}
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="State" htmlFor="state" error={errors.state}>
                  <Input
                    id="state"
                    value={values.state}
                    onChange={(event) => handleChange("state", event.target.value)}
                    placeholder="Enter state"
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="City" htmlFor="city" error={errors.city}>
                  <Input
                    id="city"
                    value={values.city}
                    onChange={(event) => handleChange("city", event.target.value)}
                    placeholder="Enter city"
                  />
                </FieldWrapper>
                <FieldWrapper label="Preferred Study Location" htmlFor="preferredStudyLocation" error={errors.preferredStudyLocation}>
                  <TypeaheadInput
                    id="preferredStudyLocation"
                    value={values.preferredStudyLocation}
                    onChange={(val) => handleChange("preferredStudyLocation", val)}
                    onBlur={handleLocationBlur}
                    options={indianStates}
                    placeholder="Enter preferred city, region or state"
                    error={errors.preferredStudyLocation}
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Current Education" htmlFor="currentEducation" error={errors.currentEducation}>
                  <Select
                    id="currentEducation"
                    value={values.currentEducation}
                    onChange={(event) => handleChange("currentEducation", event.target.value)}
                  >
                    <option value="">Select level</option>
                    {educationLevels.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Board" htmlFor="board" error={errors.board}>
                  <Select
                    id="board"
                    value={values.board}
                    onChange={(event) => handleChange("board", event.target.value)}
                  >
                    <option value="">Select board</option>
                    {boards.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="School / College" htmlFor="schoolCollege" error={errors.schoolCollege}>
                  <Input
                    id="schoolCollege"
                    value={values.schoolCollege}
                    onChange={(event) => handleChange("schoolCollege", event.target.value)}
                    placeholder="Enter school or college name"
                  />
                </FieldWrapper>
                <FieldWrapper label="Stream" htmlFor="stream" error={errors.stream}>
                  <Select
                    id="stream"
                    value={values.stream}
                    onChange={(event) => handleChange("stream", event.target.value)}
                  >
                    <option value="">Select stream</option>
                    {streams.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
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
                    type="text"
                    maxLength={4}
                    pattern="\d*"
                    value={values.passingYear}
                    onChange={(event) => handleChange("passingYear", event.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="2025"
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Career Goal" htmlFor="careerGoal" error={errors.careerGoal}>
                  <Select
                    id="careerGoal"
                    value={values.careerGoal}
                    onChange={(event) => handleChange("careerGoal", event.target.value)}
                  >
                    <option value="">Select career goal</option>
                    {careerGoals.map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </Select>
                </FieldWrapper>
                <FieldWrapper label="Target Profession" htmlFor="targetProfession" error={errors.targetProfession}>
                  <Input
                    id="targetProfession"
                    value={values.targetProfession}
                    onChange={(event) => handleChange("targetProfession", event.target.value)}
                    placeholder="Enter target profession"
                  />
                </FieldWrapper>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <FieldWrapper label="Budget Range" htmlFor="budget" error={errors.budget}>
                  <RadioGroup
                    name="budget"
                    options={budgets}
                    value={values.budget}
                    onChange={(event) => handleChange("budget", event.target.value)}
                  />
                </FieldWrapper>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-100">Entrance Exam Details</span>
                  <span className="text-xs text-slate-400">Select career goal to display relevant fields</span>
                </div>
                {values.careerGoal ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {currentExamFields.map((field) => (
                      <FieldWrapper key={field.key} label={field.label} htmlFor={field.key} error={errors[field.key]}>
                        <Input
                          id={field.key}
                          value={values.examScores[field.key] || ""}
                          onChange={(event) => handleExamScoreChange(field.key, event.target.value)}
                          placeholder={field.placeholder}
                        />
                      </FieldWrapper>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">A career goal must be selected to show exam score fields.</p>
                )}
              </div>

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-slate-400">
                  This form validates all required fields and prepares the profile for the next AI recommendation phase.
                </p>
                <Button type="submit">Validate & Continue</Button>
              </div>
            </form>
          </section>

          <aside className="rounded-3xl border border-slate-700 bg-slate-900/90 p-8 shadow-xl shadow-slate-950/20">
            <div className="space-y-5">
              <div>
                <p className="text-sm uppercase tracking-[0.35em] text-sky-400">What you will provide</p>
                <h2 className="mt-4 text-3xl font-semibold text-white">Essential information</h2>
              </div>
              <ul className="space-y-4 text-sm text-slate-400">
                <li>• Personal details and academic history</li>
                <li>• Board, marks, CGPA, and education stream</li>
                <li>• Career goal and target profession</li>
                <li>• Budget preference and entrance exam plan</li>
              </ul>
              <div className="rounded-3xl border border-slate-700 bg-slate-950/70 p-5 text-slate-300">
                <p className="text-sm font-medium text-slate-100">Outcome</p>
                <p className="mt-3 text-sm leading-6">
                  Once validated, this data can feed location-based college matching, admission probability models, and academic recommendation engines.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
