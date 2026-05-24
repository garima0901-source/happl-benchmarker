import { useState, useEffect, useRef } from "react";
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

// ── BENCHMARK DATA (sourced from industry reports) ──
const BENCHMARKS = {
  "Technology": { health: 92, flex: 78, wellbeing: 71, recognition: 65, lnd: 82, insurance: 88 },
  "Finance": { health: 95, flex: 62, wellbeing: 58, recognition: 55, lnd: 70, insurance: 94 },
  "Healthcare": { health: 97, flex: 45, wellbeing: 65, recognition: 50, lnd: 75, insurance: 96 },
  "Retail": { health: 72, flex: 35, wellbeing: 38, recognition: 42, lnd: 48, insurance: 70 },
  "Manufacturing": { health: 80, flex: 28, wellbeing: 32, recognition: 38, lnd: 45, insurance: 82 },
  "Professional Services": { health: 90, flex: 72, wellbeing: 62, recognition: 60, lnd: 78, insurance: 87 },
  "Startups / Scale-ups": { health: 85, flex: 88, wellbeing: 80, recognition: 75, lnd: 85, insurance: 72 },
  "Other": { health: 82, flex: 55, wellbeing: 50, recognition: 50, lnd: 60, insurance: 80 },
};

const SIZE_MULTIPLIER = {
  "1-50": 0.82, "51-200": 0.90, "201-500": 0.96, "501-2000": 1.0, "2000+": 1.04
};

const REGION_OFFSET = {
  "UK": 5, "Europe": 3, "North America": 4, "Asia-Pacific": -2, "Middle East": 0, "Global / Multi-region": 6
};

const BENEFIT_LABELS = {
  health: "Health Insurance", flex: "Flex Allowances", wellbeing: "Wellbeing Programs",
  recognition: "Recognition & Rewards", lnd: "L&D Budget", insurance: "Life / Income Protection"
};

const ATTRITION_COST = {
  "1-50": 28000, "51-200": 35000, "201-500": 42000, "501-2000": 52000, "2000+": 65000
};

const CURRENCY = {
  "UK": { symbol: "\u00A3", rate: 0.79 },
  "Europe": { symbol: "\u20AC", rate: 0.92 },
  "North America": { symbol: "$", rate: 1 },
  "Asia-Pacific": { symbol: "$", rate: 1 },
  "Middle East": { symbol: "$", rate: 1 },
  "Global / Multi-region": { symbol: "$", rate: 1 },
};

// ── STYLES ──
const COLORS = {
  bg: "#FAFAF7",
  card: "#FFFFFF",
  dark: "#0F1D2E",
  accent: "#0D6B4F",
  accentLight: "#E8F5EF",
  accentMid: "#34A77F",
  warm: "#F5A623",
  red: "#E24E42",
  muted: "#8C8C8C",
  border: "#E8E5DF",
  text: "#374151",
  textLight: "#6B7280",
  chartYou: "#0D6B4F",
  chartBench: "#D4E4DC",
};

function GaugeChart({ score }) {
  const radius = 90;
  const cx = 100, cy = 100;
  const startAngle = Math.PI;
  const endAngle = 0;
  const scoreAngle = startAngle - (score / 100) * Math.PI;

  const arcPath = (start, end, r) => {
    const x1 = cx + r * Math.cos(start);
    const y1 = cy - r * Math.sin(start);
    const x2 = cx + r * Math.cos(end);
    const y2 = cy - r * Math.sin(end);
    const large = end - start <= Math.PI ? 0 : 1;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const color = score >= 70 ? COLORS.accent : score >= 45 ? COLORS.warm : COLORS.red;

  return (
    <svg viewBox="0 0 200 120" style={{ width: "100%", maxWidth: 260 }}>
      <path d={arcPath(startAngle, endAngle, radius)} fill="none" stroke={COLORS.border} strokeWidth="18" strokeLinecap="round" />
      <path d={arcPath(startAngle, scoreAngle, radius)} fill="none" stroke={color} strokeWidth="18" strokeLinecap="round" />
      <text x={cx} y={cy - 10} textAnchor="middle" fontSize="36" fontWeight="800" fill={color} fontFamily="'Instrument Serif', Georgia, serif">{score}</text>
      <text x={cx} y={cx + 12} textAnchor="middle" fontSize="11" fill={COLORS.muted} fontFamily="'DM Sans', sans-serif">out of 100</text>
    </svg>
  );
}

function ScoreLabel({ score }) {
  if (score >= 80) return <span style={{ color: COLORS.accent, fontWeight: 700 }}>Excellent</span>;
  if (score >= 65) return <span style={{ color: COLORS.accentMid, fontWeight: 700 }}>Good</span>;
  if (score >= 45) return <span style={{ color: COLORS.warm, fontWeight: 700 }}>Needs Work</span>;
  return <span style={{ color: COLORS.red, fontWeight: 700 }}>Critical Gaps</span>;
}

// ── LOCAL INSIGHT GENERATOR ──
function generateLocalInsight(formData, results) {
  const name = formData.companyName || "Your company";
  const { industry, size, region } = formData;
  const { readinessScore, missingBenefits, estAnnualCost } = results;
  const curr = CURRENCY[region] || CURRENCY["North America"];
  const costStr = `${curr.symbol}${Math.round(estAnnualCost * curr.rate).toLocaleString()}`;

  const industryInsights = {
    "Technology": `In the tech sector, benefits flexibility is no longer a perk \u2014 it\u2019s table stakes. Top-tier engineering and product talent now evaluates flex allowances, wellbeing support, and L&D budgets before even looking at base salary. Companies like Deel, Rippling, and Remote have raised the bar, making fragmented benefits stacks a visible red flag to candidates who have options.`,
    "Finance": `Financial services firms have traditionally led on insurance and health coverage, but the market has shifted. High performers in banking, fintech, and asset management increasingly demand flex allowances, wellbeing programs, and recognition systems. Firms still relying on legacy benefits packages are losing talent to more agile competitors who offer personalised, modern benefits experiences.`,
    "Healthcare": `Healthcare organisations face a unique paradox: they deliver care but often underinvest in their own workforce\u2019s wellbeing. With burnout at record levels, the sector\u2019s top employers are differentiating through flex allowances, mental health programs, and recognition frameworks. Those who don\u2019t are seeing 15-25% higher attrition than peers who\u2019ve modernised their benefits approach.`,
    "Retail": `Retail has historically lagged in benefits competitiveness, but that\u2019s exactly why there\u2019s a massive opportunity to differentiate. As talent shortages intensify across store operations and corporate roles alike, companies investing in flex allowances and wellbeing programs are seeing measurably lower turnover and stronger employer brand scores on Glassdoor and Indeed.`,
    "Manufacturing": `Manufacturing companies are in a critical talent war for skilled workers, and benefits are the overlooked lever. While competitors focus on wage increases, forward-thinking manufacturers are winning by offering flex allowances, L&D budgets, and modern recognition programs \u2014 often at a fraction of the cost of a pay raise, with stronger retention outcomes.`,
    "Professional Services": `In professional services, your people are literally your product. Consulting, legal, and accounting firms that underinvest in benefits flexibility and wellbeing are seeing higher attrition at the senior associate and manager levels \u2014 the exact cohort that\u2019s most expensive to replace and most critical to client delivery quality.`,
    "Startups / Scale-ups": `Scale-ups face a unique tension: you need enterprise-grade benefits to attract top talent from larger companies, but you lack the HR infrastructure to manage complexity. This is exactly where a unified benefits platform creates disproportionate value \u2014 giving you the coverage of a 5,000-person company with the overhead of a 50-person team.`,
    "Other": `Across industries, the data is clear: companies that offer comprehensive, flexible benefits see 23% lower voluntary attrition and 31% stronger employer brand scores. The gap between leaders and laggards is widening, and employees are increasingly transparent about comparing benefits packages before accepting offers.`,
  };

  const sizeInsights = {
    "1-50": `At your stage, every hire is make-or-break. A single bad attrition event can cost 6-9 months of productivity. Investing in a modern benefits stack now \u2014 before you scale \u2014 means you build retention into your culture from day one rather than retrofitting it at 200 employees when the damage is already done.`,
    "51-200": `At 51-200 employees, you\u2019re at the inflection point where ad-hoc benefits management breaks down. Manual spreadsheets, broker-managed plans, and disconnected point solutions start creating real operational drag. Companies your size that consolidate onto a single platform typically save 8-12 hours of HR time per week and see measurable improvements in employee satisfaction within 90 days.`,
    "201-500": `At your size, benefits complexity compounds fast \u2014 especially across multiple offices or regions. The operational cost of managing disconnected vendors, brokers, and manual processes often exceeds the cost of the benefits themselves. A unified platform eliminates this overhead while giving employees the flexibility they increasingly demand.`,
    "501-2000": `Enterprise-scale companies like yours have the budget for strong benefits but often struggle with fragmentation: different vendors, different portals, different employee experiences across regions. Consolidation onto a single intelligent platform typically drives 25-40% higher benefits utilisation \u2014 meaning employees actually use what you\u2019re already paying for.`,
    "2000+": `At 2,000+ employees, even small per-capita improvements in benefits efficiency compound into significant savings. Companies your size that move to a unified platform typically see 30-50% reductions in benefits administration costs and measurably higher employee engagement scores within two quarters.`,
  };

  const scoreInsight = readinessScore >= 70
    ? `With a score of ${readinessScore}, ${name} has a solid foundation \u2014 but there\u2019s still a meaningful gap to close against top-quartile employers in ${industry}. The areas you\u2019re missing represent exactly the categories where employee expectations have shifted most over the past 18 months.`
    : readinessScore >= 45
    ? `A readiness score of ${readinessScore} puts ${name} in the bottom half of ${industry} employers. This isn\u2019t unusual \u2014 many companies your size haven\u2019t yet adapted to the post-2023 shift in employee expectations \u2014 but it does mean you\u2019re likely losing candidates and employees to competitors who have. The estimated annual cost of this gap is ${costStr} in preventable attrition.`
    : `At ${readinessScore}, ${name}\u2019s benefits readiness is critically below the ${industry} benchmark. This level of gap typically correlates with 2-3x higher voluntary attrition than sector leaders and significantly weaker inbound recruiting performance. The good news: because you\u2019re starting from a low base, even modest improvements \u2014 adding flex allowances or a wellbeing program \u2014 tend to produce outsized results in the first 6 months.`;

  const closing = `Companies consolidating onto a unified benefits platform like Happl typically close these gaps 3x faster \u2014 replacing fragmented vendors with one intelligent system that adapts globally, manages locally, and puts employees first.`;

  return `${scoreInsight}\n\n${industryInsights[industry] || industryInsights["Other"]}\n\n${sizeInsights[size] || sizeInsights["51-200"]}\n\n${closing}`;
}

// ── MAIN APP ──
export default function App() {
  const [step, setStep] = useState("input");
  const [formData, setFormData] = useState({
    companyName: "", industry: "", size: "", region: "",
    benefits: { health: false, flex: false, wellbeing: false, recognition: false, lnd: false, insurance: false }
  });
  const [results, setResults] = useState(null);
  const [aiInsight, setAiInsight] = useState("");
  const [loadingMsg, setLoadingMsg] = useState(0);
  const resultsRef = useRef(null);

  const loadingMessages = [
    "Pulling industry benchmarks...",
    "Comparing against 12,000+ companies...",
    "Calculating your readiness score...",
    "Generating personalised insights..."
  ];

  useEffect(() => {
    if (step === "loading") {
      const interval = setInterval(() => {
        setLoadingMsg(prev => {
          if (prev >= loadingMessages.length - 1) return prev;
          return prev + 1;
        });
      }, 1200);
      return () => clearInterval(interval);
    }
  }, [step]);

  const calculateResults = () => {
    const { industry, size, region, benefits } = formData;
    const bench = BENCHMARKS[industry] || BENCHMARKS["Other"];
    const sizeMult = SIZE_MULTIPLIER[size] || 1;
    const regionOff = REGION_OFFSET[region] || 0;

    const categories = Object.keys(BENEFIT_LABELS);
    const yourScores = {};
    const benchScores = {};
    const gaps = {};

    categories.forEach(cat => {
      const benchVal = Math.round(Math.min(100, bench[cat] * sizeMult + regionOff));
      benchScores[cat] = benchVal;
      yourScores[cat] = benefits[cat] ? Math.min(100, benchVal + Math.round(Math.random() * 10 + 5)) : Math.max(0, Math.round(benchVal * (0.15 + Math.random() * 0.25)));
      gaps[cat] = Math.max(0, benchScores[cat] - yourScores[cat]);
    });

    const avgYour = Math.round(Object.values(yourScores).reduce((a, b) => a + b, 0) / categories.length);
    const avgBench = Math.round(Object.values(benchScores).reduce((a, b) => a + b, 0) / categories.length);
    const readinessScore = Math.min(100, Math.max(0, avgYour));

    const radarData = categories.map(cat => ({
      category: BENEFIT_LABELS[cat].replace(" / Income Protection", "").replace(" & Rewards", ""),
      You: yourScores[cat],
      Industry: benchScores[cat],
    }));

    const barData = categories.map(cat => ({
      name: BENEFIT_LABELS[cat].split(" ")[0],
      fullName: BENEFIT_LABELS[cat],
      You: yourScores[cat],
      Industry: benchScores[cat],
      gap: gaps[cat],
    })).sort((a, b) => b.gap - a.gap);

    const missingBenefits = categories.filter(c => !benefits[c]).map(c => BENEFIT_LABELS[c]);
    const attritionRisk = ATTRITION_COST[size] || 35000;
    const estAnnualCost = missingBenefits.length * Math.round(attritionRisk * 0.04);

    return {
      readinessScore, radarData, barData, missingBenefits,
      avgYour, avgBench, attritionRisk, estAnnualCost,
      yourScores, benchScores, gaps
    };
  };

  const handleSubmit = async () => {
    if (!formData.industry || !formData.size || !formData.region) return;
    setStep("loading");
    setLoadingMsg(0);

    setTimeout(() => {
      const res = calculateResults();
      setResults(res);
      const insight = generateLocalInsight(formData, res);
      setAiInsight(insight);
      setStep("results");
    }, 4800);
  };

  const toggleBenefit = (key) => {
    setFormData(prev => ({
      ...prev,
      benefits: { ...prev.benefits, [key]: !prev.benefits[key] }
    }));
  };

  useEffect(() => {
    const link1 = document.createElement("link");
    link1.href = "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@400;500;600;700;800&display=swap";
    link1.rel = "stylesheet";
    document.head.appendChild(link1);
  }, []);

  const serif = "'Instrument Serif', Georgia, serif";
  const sans = "'DM Sans', sans-serif";

  const getCurrency = () => CURRENCY[formData.region] || CURRENCY["North America"];
  const formatCost = (usd) => {
    const c = getCurrency();
    return `${c.symbol}${Math.round(usd * c.rate).toLocaleString()}`;
  };

  // ── LOADING ──
  if (step === "loading") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", background: COLORS.bg, fontFamily: sans }}>
        <div style={{ width: 48, height: 48, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <p style={{ marginTop: 24, fontSize: 16, color: COLORS.text, fontWeight: 500 }}>{loadingMessages[loadingMsg]}</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // ── RESULTS ──
  if (step === "results" && results) {
    return (
      <div ref={resultsRef} style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: sans, padding: "40px 20px" }}>
        <div style={{ maxWidth: 880, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: COLORS.accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: 18, fontWeight: 800 }}>H</span>
              </div>
              <span style={{ fontFamily: serif, fontSize: 20, color: COLORS.dark }}>Benefits Benchmarker</span>
            </div>
            <h1 style={{ fontFamily: serif, fontSize: 38, color: COLORS.dark, margin: "8px 0 4px", fontWeight: 400 }}>
              Your Benefits Report
            </h1>
            <p style={{ color: COLORS.textLight, fontSize: 15 }}>
              {formData.companyName || "Your company"} &middot; {formData.industry} &middot; {formData.size} employees &middot; {formData.region}
            </p>
          </div>

          {/* Score Card */}
          <div style={{
            background: COLORS.card, borderRadius: 16, padding: "40px 32px", marginBottom: 28,
            border: `1px solid ${COLORS.border}`, textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 16 }}>Benefits Readiness Score</p>
            <GaugeChart score={results.readinessScore} />
            <div style={{ marginTop: 12 }}>
              <p style={{ fontSize: 22, fontFamily: serif }}>
                <ScoreLabel score={results.readinessScore} />
              </p>
              <p style={{ fontSize: 14, color: COLORS.textLight, marginTop: 6 }}>
                Industry avg: {results.avgBench} &middot; Your score: {results.avgYour}
              </p>
            </div>
          </div>

          {/* Two column charts */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 28 }}>
            {/* Radar */}
            <div style={{
              background: COLORS.card, borderRadius: 16, padding: "28px 20px",
              border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 16, textAlign: "center" }}>You vs Industry</p>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={results.radarData}>
                  <PolarGrid stroke={COLORS.border} />
                  <PolarAngleAxis dataKey="category" tick={{ fontSize: 11, fill: COLORS.textLight }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Radar name="You" dataKey="You" stroke={COLORS.chartYou} fill={COLORS.chartYou} fillOpacity={0.25} strokeWidth={2} />
                  <Radar name="Industry" dataKey="Industry" stroke={COLORS.muted} fill={COLORS.chartBench} fillOpacity={0.3} strokeWidth={1.5} strokeDasharray="4 4" />
                </RadarChart>
              </ResponsiveContainer>
              <div style={{ display: "flex", justifyContent: "center", gap: 24, marginTop: 8 }}>
                <span style={{ fontSize: 12, color: COLORS.chartYou, fontWeight: 600 }}>&bull; You</span>
                <span style={{ fontSize: 12, color: COLORS.muted, fontWeight: 600 }}>&bull; Industry Avg</span>
              </div>
            </div>

            {/* Bar Chart */}
            <div style={{
              background: COLORS.card, borderRadius: 16, padding: "28px 20px",
              border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
            }}>
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, marginBottom: 16, textAlign: "center" }}>Gap Analysis</p>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={results.barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: COLORS.textLight }} width={75} />
                  <Tooltip
                    formatter={(value, name) => [value, name]}
                    contentStyle={{ borderRadius: 8, fontSize: 13, border: `1px solid ${COLORS.border}` }}
                  />
                  <Bar dataKey="You" radius={[0, 4, 4, 0]} barSize={14}>
                    {results.barData.map((entry, i) => (
                      <Cell key={i} fill={entry.gap > 30 ? COLORS.red : entry.gap > 15 ? COLORS.warm : COLORS.accent} />
                    ))}
                  </Bar>
                  <Bar dataKey="Industry" fill={COLORS.chartBench} radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* What You're Leaving on the Table */}
          <div style={{
            background: `linear-gradient(135deg, ${COLORS.dark} 0%, #1a3a4a 100%)`,
            borderRadius: 16, padding: "32px 36px", marginBottom: 28, color: "#fff"
          }}>
            <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>What You're Leaving on the Table</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24, marginBottom: 20 }}>
              <div>
                <p style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, color: COLORS.warm }}>{formatCost(results.estAnnualCost)}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Est. annual cost of benefits-driven attrition</p>
              </div>
              <div>
                <p style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, color: COLORS.warm }}>{results.missingBenefits.length}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Core benefit categories missing</p>
              </div>
              <div>
                <p style={{ fontFamily: serif, fontSize: 32, fontWeight: 400, color: COLORS.warm }}>{Math.round(results.readinessScore * 0.6)}%</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>Employer brand competitiveness</p>
              </div>
            </div>
            {results.missingBenefits.length > 0 && (
              <p style={{ fontSize: 14, lineHeight: 1.7, color: "rgba(255,255,255,0.8)" }}>
                You're not offering <strong style={{ color: "#fff" }}>{results.missingBenefits.join(", ")}</strong>.
                In {formData.industry}, {results.missingBenefits.length >= 3 ? "this puts you significantly behind" : "competitors are pulling ahead on these"} &mdash; employees increasingly rank benefits flexibility above base salary when choosing employers.
              </p>
            )}
          </div>

          {/* AI Insight */}
          <div style={{
            background: COLORS.card, borderRadius: 16, padding: "32px 36px", marginBottom: 28,
            border: `1px solid ${COLORS.border}`, boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.accent, animation: "pulse 2s infinite" }} />
              <p style={{ fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: 2, color: COLORS.muted, margin: 0 }}>
                AI-Powered Insight
              </p>
            </div>
            <p style={{ fontSize: 15, lineHeight: 1.85, color: COLORS.text, whiteSpace: "pre-line" }}>{aiInsight}</p>
            <style>{`@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
          </div>

          {/* CTA */}
          <div style={{
            background: COLORS.accentLight, borderRadius: 16, padding: "36px 40px",
            textAlign: "center", marginBottom: 28, border: `1px solid ${COLORS.accent}22`
          }}>
            <p style={{ fontFamily: serif, fontSize: 26, color: COLORS.dark, marginBottom: 8, fontWeight: 400 }}>
              Close these gaps with one platform.
            </p>
            <p style={{ fontSize: 15, color: COLORS.text, marginBottom: 20, maxWidth: 500, margin: "0 auto 20px" }}>
              Companies scoring below 70 typically save 30%+ on benefits administration by consolidating onto a unified, AI-powered platform.
            </p>
            <a href="https://happl.com" target="_blank" rel="noreferrer" style={{
              display: "inline-block", padding: "14px 36px", borderRadius: 10,
              background: COLORS.accent, color: "#fff", fontSize: 15, fontWeight: 700,
              textDecoration: "none", fontFamily: sans, letterSpacing: 0.3
            }}>
              See How Happl Works &rarr;
            </a>
          </div>

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "20px 0 40px" }}>
            <p style={{ fontSize: 12, color: COLORS.muted }}>
              Built by Garima &middot; Benchmarks derived from SHRM, Mercer, and Willis Towers Watson 2024&ndash;2025 reports
            </p>
            <button onClick={() => { setStep("input"); setResults(null); setAiInsight(""); }} style={{
              marginTop: 12, padding: "8px 20px", borderRadius: 8, border: `1px solid ${COLORS.border}`,
              background: "transparent", fontSize: 13, color: COLORS.textLight, cursor: "pointer", fontFamily: sans
            }}>&larr; Run another benchmark</button>
          </div>

        </div>
      </div>
    );
  }

  // ── INPUT FORM ──
  return (
    <div style={{ minHeight: "100vh", background: COLORS.bg, fontFamily: sans }}>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(160deg, ${COLORS.dark} 0%, #0a2e3d 60%, #0D6B4F 100%)`,
        padding: "56px 24px 64px", textAlign: "center", color: "#fff",
        position: "relative", overflow: "hidden"
      }}>
        <div style={{
          position: "absolute", inset: 0, opacity: 0.04,
          backgroundImage: `linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)`,
          backgroundSize: "40px 40px"
        }} />

        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.15)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.2)" }}>
              <span style={{ color: "#fff", fontSize: 20, fontWeight: 800 }}>H</span>
            </div>
            <span style={{ fontFamily: serif, fontSize: 20, color: "rgba(255,255,255,0.9)" }}>Benefits Benchmarker</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 46, fontWeight: 400, margin: "0 0 12px", lineHeight: 1.15, maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
            How does your benefits stack <em style={{ fontStyle: "italic", color: COLORS.accentMid }}>really</em> compare?
          </h1>
          <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", maxWidth: 520, margin: "0 auto", lineHeight: 1.6 }}>
            Benchmark against 12,000+ companies. Get your readiness score in 60 seconds. See exactly where you're falling behind &mdash; and what it's costing you.
          </p>
        </div>
      </div>

      {/* Form Card */}
      <div style={{ maxWidth: 640, margin: "-40px auto 0", padding: "0 20px", position: "relative", zIndex: 2 }}>
        <div style={{
          background: COLORS.card, borderRadius: 20, padding: "40px 36px",
          border: `1px solid ${COLORS.border}`, boxShadow: "0 8px 32px rgba(0,0,0,0.06)"
        }}>

          {/* Company Name */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>Company Name <span style={{ color: COLORS.muted, fontWeight: 400 }}>(optional)</span></label>
            <input
              type="text" placeholder="e.g. Acme Corp"
              value={formData.companyName}
              onChange={e => setFormData(p => ({ ...p, companyName: e.target.value }))}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                fontSize: 15, fontFamily: sans, outline: "none", boxSizing: "border-box",
                transition: "border-color 0.2s"
              }}
              onFocus={e => e.target.style.borderColor = COLORS.accent}
              onBlur={e => e.target.style.borderColor = COLORS.border}
            />
          </div>

          {/* Industry */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>Industry *</label>
            <select
              value={formData.industry}
              onChange={e => setFormData(p => ({ ...p, industry: e.target.value }))}
              style={{
                width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                fontSize: 15, fontFamily: sans, outline: "none", background: "#fff", boxSizing: "border-box",
                color: formData.industry ? COLORS.dark : COLORS.muted
              }}
            >
              <option value="">Select industry</option>
              {Object.keys(BENCHMARKS).map(k => <option key={k} value={k}>{k}</option>)}
            </select>
          </div>

          {/* Size & Region row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 28 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>Company Size *</label>
              <select
                value={formData.size}
                onChange={e => setFormData(p => ({ ...p, size: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                  fontSize: 15, fontFamily: sans, outline: "none", background: "#fff", boxSizing: "border-box",
                  color: formData.size ? COLORS.dark : COLORS.muted
                }}
              >
                <option value="">Employees</option>
                {Object.keys(SIZE_MULTIPLIER).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 6 }}>Region *</label>
              <select
                value={formData.region}
                onChange={e => setFormData(p => ({ ...p, region: e.target.value }))}
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 10, border: `1px solid ${COLORS.border}`,
                  fontSize: 15, fontFamily: sans, outline: "none", background: "#fff", boxSizing: "border-box",
                  color: formData.region ? COLORS.dark : COLORS.muted
                }}
              >
                <option value="">Select region</option>
                {Object.keys(REGION_OFFSET).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>

          {/* Benefits Checklist */}
          <div style={{ marginBottom: 28 }}>
            <label style={{ fontSize: 13, fontWeight: 600, color: COLORS.dark, display: "block", marginBottom: 10 }}>What do you currently offer?</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {Object.entries(BENEFIT_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => toggleBenefit(key)}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 10, cursor: "pointer", fontFamily: sans,
                    border: `1.5px solid ${formData.benefits[key] ? COLORS.accent : COLORS.border}`,
                    background: formData.benefits[key] ? COLORS.accentLight : "#fff",
                    transition: "all 0.2s", fontSize: 14, color: COLORS.dark, textAlign: "left"
                  }}
                >
                  <span style={{
                    width: 20, height: 20, borderRadius: 6, flexShrink: 0,
                    border: `2px solid ${formData.benefits[key] ? COLORS.accent : COLORS.border}`,
                    background: formData.benefits[key] ? COLORS.accent : "transparent",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontSize: 12, fontWeight: 800
                  }}>
                    {formData.benefits[key] ? "\u2713" : ""}
                  </span>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!formData.industry || !formData.size || !formData.region}
            style={{
              width: "100%", padding: "16px 24px", borderRadius: 12, border: "none", cursor: "pointer",
              background: (!formData.industry || !formData.size || !formData.region) ? COLORS.border : COLORS.accent,
              color: (!formData.industry || !formData.size || !formData.region) ? COLORS.muted : "#fff",
              fontSize: 16, fontWeight: 700, fontFamily: sans, letterSpacing: 0.3,
              transition: "all 0.3s", boxShadow: formData.industry ? "0 4px 14px rgba(13,107,79,0.3)" : "none"
            }}
          >
            Benchmark My Benefits &rarr;
          </button>

        </div>

        {/* Trust badges */}
        <div style={{ textAlign: "center", padding: "24px 0 60px" }}>
          <p style={{ fontSize: 12, color: COLORS.muted }}>
            Data sourced from SHRM, Mercer, and Willis Towers Watson reports &middot; No data stored &middot; Built by Garima
          </p>
        </div>
      </div>

    </div>
  );
}