import Link from "next/link";

export default function HigherEducation() {
  const options = [
    {
      id: "domestic",
      title: "Domestic Education",
      description: "Pursue education within your country",
      icon: "🏫",
      details: [
        "Stream & Board Selection",
        "College Recommendations",
        "Scholarship Guidance",
        "Entrance Exam Prep"
      ],
      href: "/higher-education/form"
    },
    {
      id: "international",
      title: "International Education",
      description: "Study abroad in top universities worldwide",
      icon: "🌍",
      details: [
        "University Matching",
        "Visa & Admission Guidance",
        "Scholarship Opportunities",
        "Career Pathways"
      ],
      href: "/higher-education/form"
    },
    {
      id: "exam-prep",
      title: "Government Exam Preparation",
      description: "Advanced roadmaps for National & International exams",
      icon: "🏛️",
      details: [
        "Roadmaps from 10th/12th/UG/PG",
        "Top Coaching Institutes & Courses",
        "Exam Future Plans & Backup Plans",
        "Syllabus & Strategy Breakdown"
      ],
      href: "/exam-prep"
    }
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-50 px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Back Button & Header */}
        <div className="space-y-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sky-400 hover:text-sky-300 transition-colors text-sm font-medium">
            ← Back to Home
          </Link>
          
          <div className="space-y-3">
            <h1 className="text-5xl md:text-6xl font-bold">Higher Education</h1>
            <p className="text-xl text-slate-300">Choose your education path and get personalized guidance</p>
          </div>
        </div>

        {/* Education Type Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {options.map((option) => (
            <Link key={option.id} href={option.href} className="group">
              <div className="h-full rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-800 to-slate-900 p-8 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20 transition-all duration-300 cursor-pointer">
                <div className="flex flex-col h-full justify-between space-y-6">
                  {/* Icon */}
                  <div className="flex items-center justify-center w-20 h-20 rounded-xl bg-sky-500/10 border border-sky-500/30 group-hover:bg-sky-500/20 transition-colors">
                    <span className="text-5xl">{option.icon}</span>
                  </div>

                  {/* Content */}
                  <div className="space-y-2 flex-1">
                    <h2 className="text-2xl font-bold text-slate-100 group-hover:text-sky-400 transition-colors">
                      {option.title}
                    </h2>
                    <p className="text-slate-400 text-sm">
                      {option.description}
                    </p>
                  </div>

                  {/* Features List */}
                  <ul className="space-y-2">
                    {option.details.map((detail, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-400 flex-shrink-0"></span>
                        {detail}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <div className="text-center w-full mt-4 px-6 py-3 rounded-lg bg-sky-500 text-white font-semibold hover:bg-sky-600 transition-colors group-hover:shadow-lg group-hover:shadow-sky-500/30">
                    Get Started →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info Section */}
        <div className="rounded-2xl border border-slate-700 bg-slate-800/50 p-8 space-y-4">
          <h3 className="text-lg font-semibold">How It Works</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white font-bold text-sm">
                1
              </div>
              <h4 className="font-semibold">Answer Questions</h4>
              <p className="text-sm text-slate-400">Tell us about your background, interests, and goals</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white font-bold text-sm">
                2
              </div>
              <h4 className="font-semibold">AI Analysis</h4>
              <p className="text-sm text-slate-400">Our AI analyzes your profile and preferences</p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-sky-500 text-white font-bold text-sm">
                3
              </div>
              <h4 className="font-semibold">Get Roadmap</h4>
              <p className="text-sm text-slate-400">Receive a personalized education and career roadmap</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
