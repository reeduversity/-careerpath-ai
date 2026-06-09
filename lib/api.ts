const API_BASE = "/api";

export async function fetchCareers() {
  const res = await fetch(`${API_BASE}/careers`, { next: { revalidate: 600 } });
  if (!res.ok) throw new Error("Failed to fetch careers");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to fetch careers");
  return json.data;
}

export async function orchestrateCareer(
  resumeProfileId: string, 
  careerRoleId: string,
  jobInterest?: string,
  examName?: string,
  profileType?: string,
  jobSeekerProfileId?: string
) {
  const res = await fetch(`${API_BASE}/career/orchestrate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resumeProfileId, careerRoleId, jobInterest, examName, profileType, jobSeekerProfileId }),
  });
  
  if (!res.ok) throw new Error("Failed to orchestrate career");
  const json = await res.json();
  if (!json.success) throw new Error(json.error || "Failed to orchestrate career");
  return json.data;
}
