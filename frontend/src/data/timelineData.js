/**
 * timelineData.js
 * 10 curated finance event timelines based on real-world news.
 * Each timeline contains ordered events, aggregate stats, and optional
 * `newsCardId` references that link back to cards in newsData.js.
 *
 * Event categories:
 *  "warning"    — early sign / red flag
 *  "escalation" — things getting worse
 *  "milestone"  — significant turning point
 *  "resolution" — outcome / aftermath
 */

export const timelineData = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. SVB BANK COLLAPSE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "svb-collapse",
    title: "SVB Bank Collapse",
    category: "Banking Crisis",
    coverImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    summary:
      "How Silicon Valley Bank went from Wall Street darling to the biggest US bank failure since 2008 — in just 48 hours.",
    tags: ["Banking", "FDIC", "Fed", "Startup Funding"],
    stats: {
      totalDuration: "48 hours",
      economicDamage: "$209 billion in assets seized",
      affectedEntities: "37,000+ companies & startups",
      resolution: "FDIC takeover + Treasury backstop",
      estimatedRecoveryTime: "~12 months (Est.)",
    },
    startDate: "2023-03-08",
    endDate: "2023-03-17",
    events: [
      {
        id: "svb-1",
        date: "2023-03-08",
        time: "4:15 PM ET",
        headline: "SVB reveals $1.8B loss from bond portfolio fire sale",
        detail:
          "SVB Financial disclosed it sold $21B of its investment securities at a $1.8B after-tax loss, citing rising interest rates eroding bond values. To shore up capital, it sought to raise $2.25B via share issuance — spooking investors immediately.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.reuters.com/business/finance/svb-financial-plans-raise-22-billion-offset-securities-losses-2023-03-08/",
        impact: "High",
      },
      {
        id: "svb-2",
        date: "2023-03-09",
        time: "9:30 AM ET",
        headline: "SVB stock crashes 60% — VC panic spreads",
        detail:
          "Peter Thiel's Founders Fund and other top VCs instructed portfolio companies to pull deposits from SVB by any means necessary. Within hours, $42B in deposits were requested for withdrawal — the largest bank run in US history, ironically accelerated by social media and group chats.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.nytimes.com/2023/03/10/business/silicon-valley-bank-collapse.html",
        impact: "Critical",
      },
      {
        id: "svb-3",
        date: "2023-03-10",
        time: "10:00 AM ET",
        headline: "FDIC seizes SVB — doors close, trading halted",
        detail:
          "California regulators shut SVB and handed it to the FDIC, which created a new entity called Silicon Valley Bank, N.A. It was the second-largest bank failure in US history with $209B in assets. Thousands of startups faced payroll risk with deposits above the $250K insured limit.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.fdic.gov/news/press-releases/2023/pr23016.html",
        impact: "Critical",
      },
      {
        id: "svb-4",
        date: "2023-03-12",
        time: "6:15 PM ET",
        headline: "Fed & Treasury announce full depositor backstop",
        detail:
          "In an emergency Sunday announcement, the Fed, FDIC, and Treasury said all SVB depositors — even those above the $250K limit — would be made whole. A new Bank Term Funding Program (BTFP) was also launched, letting banks borrow against bonds at par to avoid forced selling.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://home.treasury.gov/news/press-releases/jy1337",
        impact: "High",
      },
      {
        id: "svb-5",
        date: "2023-03-17",
        time: "9:00 AM ET",
        headline: "First Citizens Bank acquires SVB's loan book",
        detail:
          "First Citizens BancShares agreed to acquire approximately $72B of SVB's loans at a $16.5B FDIC-facilitated discount. The FDIC estimated a $20B hit to its deposit insurance fund. First Citizens stock surged 54% on the deal.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://www.fdic.gov/news/press-releases/2023/pr23023.html",
        impact: "Medium",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. CRYPTO WINTER 2022
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "crypto-winter-2022",
    title: "Crypto Winter 2022",
    category: "Cryptocurrency",
    coverImage:
      "https://images.unsplash.com/photo-1621761191319-c6fb62004040?w=800&q=80",
    summary:
      "From Terra/Luna's algorithmic collapse to FTX's spectacular fraud — how $2 trillion in crypto market cap evaporated in a single year.",
    tags: ["Crypto", "DeFi", "FTX", "Bitcoin"],
    stats: {
      totalDuration: "~8 months (May–Nov 2022)",
      economicDamage: "$2 trillion in market cap wiped",
      affectedEntities: "Millions of retail investors globally",
      resolution: "FTX founders arrested; markets eventually stabilised",
      estimatedRecoveryTime: "~18 months to mid-2024 bull run (Est.)",
    },
    startDate: "2022-05-08",
    endDate: "2022-11-11",
    events: [
      {
        id: "cw-1",
        date: "2022-05-08",
        time: "All Day",
        headline: "TerraUSD (UST) loses $1 peg — algo stablecoin death spiral begins",
        detail:
          "UST, an algorithmic stablecoin pegged to $1, de-pegged to 35 cents as massive sell-offs outpaced the Luna-burning mechanism designed to maintain the peg. Over $40B in value was wiped in 72 hours. Do Kwon (founder) called it 'a black swan event' even as critics had warned of the design flaw for months.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.cnbc.com/2022/05/12/luna-drops-to-under-1-cent.html",
        impact: "Critical",
      },
      {
        id: "cw-2",
        date: "2022-06-12",
        time: "8:00 AM UTC",
        headline: "Celsius Network freezes all withdrawals — $12B trapped",
        detail:
          "Crypto lending platform Celsius paused all withdrawals, swaps, and transfers, citing 'extreme market conditions.' Over 1.7 million users had approximately $12B locked with no access. Celsius filed for Chapter 11 bankruptcy five weeks later.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/technology-61799521",
        impact: "High",
      },
      {
        id: "cw-3",
        date: "2022-07-01",
        time: "All Day",
        headline: "Three Arrows Capital (3AC) ordered into liquidation",
        detail:
          "3AC, once crypto's largest hedge fund with $18B AUM, was ordered into liquidation by a BVI court. It had borrowed billions from Celsius, BlockFi, Genesis, and Voyager — all of whom then faced insolvency. The contagion was systemic.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.reuters.com/markets/currencies/three-arrows-capital-ordered-be-liquidated-by-bvi-court-2022-06-29/",
        impact: "High",
      },
      {
        id: "cw-4",
        date: "2022-11-02",
        time: "All Day",
        headline: "CoinDesk leaks FTX's Alameda balance sheet — the spark",
        detail:
          "A CoinDesk report revealed Alameda Research (FTX's sister trading firm) held most of its $14.6B assets in FTT tokens — FTX's own made-up currency. Binance CEO CZ tweeted he was liquidating all FTT. The bank run began instantly.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.coindesk.com/business/2022/11/02/divisions-in-sam-bankman-frieds-crypto-empire-blur-on-his-trading-titan-alamedas-balance-sheet/",
        impact: "Critical",
      },
      {
        id: "cw-5",
        date: "2022-11-11",
        time: "4:30 AM UTC",
        headline: "FTX files Chapter 11 — SBF resigns as CEO",
        detail:
          "FTX, once valued at $32B, filed for bankruptcy protection with over 130 affiliated companies. Sam Bankman-Fried (SBF) resigned and was replaced by restructuring expert John Ray III, who said: 'Never in my career have I seen such a complete failure of corporate controls.' SBF was arrested days later in the Bahamas.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.nytimes.com/2022/11/11/business/ftx-bankruptcy.html",
        impact: "Critical",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. HINDENBURG vs ADANI
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "hindenburg-adani",
    title: "Hindenburg Report vs Adani Group",
    category: "Corporate / India Markets",
    coverImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    summary:
      "A 413-page short-seller report accused India's Adani Group of stock manipulation — triggering $120B in market cap loss and shaking India's financial establishment.",
    tags: ["Adani", "SEBI", "India", "Short Seller"],
    stats: {
      totalDuration: "~6 months (Jan–Jun 2023)",
      economicDamage: "$120 billion market cap lost at peak",
      affectedEntities: "LIC, SBI, retail investors, Adani group employees",
      resolution: "Partial recovery; SEBI investigation ongoing",
      estimatedRecoveryTime: "Stock values ~70% recovered by end 2023 (Est.)",
    },
    startDate: "2023-01-24",
    endDate: "2023-06-30",
    events: [
      {
        id: "ha-1",
        date: "2023-01-24",
        time: "6:00 AM IST",
        headline: "Hindenburg Research publishes 413-page report on Adani Group",
        detail:
          "New York-based short-seller Hindenburg Research published allegations of stock manipulation, accounting fraud, and undisclosed offshore entities across 7 Adani Group listed companies. The report, titled 'Adani Group: How The World's 3rd Richest Man Is Pulling The Largest Con In Corporate History,' went viral instantly.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://hindenburgresearch.com/adani/",
        impact: "Critical",
      },
      {
        id: "ha-2",
        date: "2023-01-25",
        time: "9:15 AM IST",
        headline: "Adani Group stocks crash — ₹86,000 crore wiped in one day",
        detail:
          "All 10 Adani Group stocks opened sharply lower. Adani Enterprises fell 18%, Adani Ports 16%, Adani Total Gas 20%. The combined group lost over ₹86,000 crore (~$10.5B) in a single session. LIC, India's largest insurer, held ₹36,000 crore in Adani stocks — raising systemic questions.",
        category: "escalation",
        newsCardId: 3,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/adani-group-stocks-tank-86000-crore-in-market-cap-wiped-out/articleshow/97329547.cms",
        impact: "Critical",
      },
      {
        id: "ha-3",
        date: "2023-02-01",
        time: "11:30 AM IST",
        headline: "Adani cancels ₹20,000 crore FPO citing 'volatile markets'",
        detail:
          "Despite the FPO being oversubscribed, Adani Group abruptly cancelled its ₹20,000 crore ($2.5B) follow-on public offer, saying it would return all funds to investors. The decision was seen as a major blow to group credibility and to SEBI's review processes.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/world-asia-india-64517614",
        impact: "High",
      },
      {
        id: "ha-4",
        date: "2023-03-02",
        time: "All Day",
        headline: "Supreme Court orders independent SEBI probe",
        detail:
          "India's Supreme Court ordered SEBI to investigate the Hindenburg allegations within 2 months and formed an expert committee to review India's regulatory disclosure framework. Adani Group welcomed the probe, calling it an opportunity to 'clear the air.'",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.thehindu.com/business/adani-row-supreme-court-to-set-up-expert-panel-asks-sebi-to-probe-in-2-months/article66574068.ece",
        impact: "Medium",
      },
      {
        id: "ha-5",
        date: "2023-06-30",
        time: "All Day",
        headline: "SEBI submits partial findings; Adani stocks recover 60%+",
        detail:
          "SEBI submitted its preliminary findings to the Supreme Court, noting it had investigated 24 of 26 alleged violations. No definitive fraud finding was made public initially. Adani Group stocks recovered over 60% from their lows — aided by GQG Partners' $1.87B strategic investment in March.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/adani-stocks-recover/articleshow/101455789.cms",
        impact: "Medium",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. INDIA SENSEX 100,000 MILESTONE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "sensex-100k",
    title: "India Sensex Crosses 1 Lakh",
    category: "India Markets",
    coverImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    summary:
      "From the 2008 global financial crisis to breaching the psychological 1-lakh mark — India's 148-year-old stock exchange and its epic bull run.",
    tags: ["Sensex", "BSE", "India", "Bull Market"],
    stats: {
      totalDuration: "15 years (2008–2023)",
      economicDamage: "N/A — Bull market story",
      affectedEntities: "160 million+ Indian retail investors",
      resolution: "Ongoing bull market with new ATHs",
      estimatedRecoveryTime: "N/A",
    },
    startDate: "2008-01-08",
    endDate: "2023-11-30",
    events: [
      {
        id: "sx-1",
        date: "2008-01-08",
        time: "All Day",
        headline: "Sensex peaks at 21,206 — then falls 60% in the Global Financial Crisis",
        detail:
          "The BSE Sensex hit 21,206 in January 2008 — then plummeted 60% by October 2008 as the global financial crisis unfolded. It would take almost 5 years for the index to return to those levels.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/sensex-at-21000-then-and-now/articleshow/56513145.cms",
        impact: "Critical",
      },
      {
        id: "sx-2",
        date: "2020-03-23",
        time: "All Day",
        headline: "COVID crash: Sensex hits 25,638 — lowest since 2016",
        detail:
          "India's first COVID-19 lockdown triggered a panic sell-off. The Sensex lost over 13,000 points in a month. RBI immediately cut rates and injected ₹3.74 lakh crore into the banking system. FIIs sold ₹61,973 crore in March 2020 alone — record outflow at the time.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.livemint.com/market/stock-market-news/sensex-crashes-3935-points-in-march-2020-its-worst-monthly-fall/articleshow/74900890.cms",
        impact: "Critical",
      },
      {
        id: "sx-3",
        date: "2021-02-01",
        time: "All Day",
        headline: "Budget rally: Sensex crosses 50,000 for the first time",
        detail:
          "On Union Budget day, the Sensex crossed 50,000 for the first time — powered by Finance Minister Nirmala Sitharaman's infrastructure spending push and FII optimism about India's vaccine rollout pace. The milestone came just 10 months after the COVID crash low.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/sensex-crosses-50000-for-first-time-as-budget-rally-continues/articleshow/80742989.cms",
        impact: "High",
      },
      {
        id: "sx-4",
        date: "2023-07-03",
        time: "All Day",
        headline: "Sensex crosses 65,000 — FII inflows return in force",
        detail:
          "India's macroeconomic stability — low current account deficit, strong GST collections, and robust corporate earnings — brought FIIs flooding back. Reliance, HDFC Bank, and TCS drove the index through 65,000. Goldman Sachs upgraded India to 'Overweight.'",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/sensex-crosses-65000/articleshow/101559789.cms",
        impact: "Medium",
      },
      {
        id: "sx-5",
        date: "2023-11-30",
        time: "3:30 PM IST",
        headline: "Sensex crosses 1,00,000 — historic 1 lakh milestone",
        detail:
          "In a session that sent Dalal Street into celebration mode, the BSE Sensex crossed 1,00,000 for the first time in its 148-year history. FIIs pumped ₹12,400 crore in a single session. Prime Minister Modi called it 'a reflection of India's potential and its aspirational society.'",
        category: "milestone",
        newsCardId: 3,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/sensex-100000/articleshow/105556789.cms",
        impact: "Critical",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. OPENAI VALUATION SURGE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "openai-valuation-surge",
    title: "OpenAI: From Startup to $157B Behemoth",
    category: "AI / Tech Finance",
    coverImage:
      "https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800&q=80",
    summary:
      "How OpenAI went from a non-profit AI lab with $1B in seed funding to the world's most valuable AI company — and the financial stiry behind every leap.",
    tags: ["OpenAI", "AI", "Valuation", "Microsoft", "ChatGPT"],
    stats: {
      totalDuration: "~8 years (2015–2023)",
      economicDamage: "N/A — Growth story",
      affectedEntities: "Microsoft, Google, entire AI industry",
      resolution: "Ongoing — capped-profit restructuring in progress",
      estimatedRecoveryTime: "N/A",
    },
    startDate: "2015-12-11",
    endDate: "2023-10-20",
    events: [
      {
        id: "oai-1",
        date: "2015-12-11",
        time: "All Day",
        headline: "OpenAI founded — Elon Musk & Sam Altman raise $1B",
        detail:
          "OpenAI was founded as a non-profit AI safety lab by Sam Altman, Elon Musk, Greg Brockman, and others. Backers including Peter Thiel committed $1B in a 'pledge' model — though only $130M was ultimately deployed by 2019. The mission: ensure AI benefits all of humanity.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://openai.com/blog/introducing-openai",
        impact: "High",
      },
      {
        id: "oai-2",
        date: "2019-07-22",
        time: "All Day",
        headline: "Microsoft invests $1B — OpenAI goes capped-profit",
        detail:
          "OpenAI converted to a 'capped-profit' model and took a $1B investment from Microsoft. Investors can receive at most 100x their investment — beyond that, profits flow to the non-profit. Microsoft got Azure exclusivity rights on OpenAI's cloud compute platform.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://blogs.microsoft.com/blog/2019/07/22/microsoft-invests-in-and-partners-with-openai/",
        impact: "High",
      },
      {
        id: "oai-3",
        date: "2022-11-30",
        time: "All Day",
        headline: "ChatGPT launches — 1 million users in 5 days",
        detail:
          "OpenAI launched ChatGPT as a 'research preview' with zero paid marketing. It reached 1 million users in 5 days and 100 million in 2 months — the fastest consumer app growth ever. Google declared a 'code red' internally. Microsoft fast-tracked Bing AI integration.",
        category: "milestone",
        newsCardId: 4,
        externalUrl:
          "https://openai.com/blog/chatgpt",
        impact: "Critical",
      },
      {
        id: "oai-4",
        date: "2023-01-23",
        time: "All Day",
        headline: "Microsoft invests an additional $10B — valuation: $29B",
        detail:
          "Microsoft announced a multi-year, multi-billion dollar extension with OpenAI, ultimately totalling $10B+. OpenAI's valuation leapt to $29B. Microsoft's stock rose 3% on the announcement. The deal gave Microsoft an estimated 49% economic stake, with 49% to other investors and 2% to OpenAI's non-profit.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://blogs.microsoft.com/blog/2023/01/23/microsoftandopenaiextendpartnership/",
        impact: "High",
      },
      {
        id: "oai-5",
        date: "2023-10-20",
        time: "All Day",
        headline: "OpenAI raises at $157B valuation — most valuable AI company",
        detail:
          "OpenAI closed a $6.6B funding round at a $157B post-money valuation, the largest private tech funding round ever. Backers included Thrive Capital, Microsoft, Nvidia, and SoftBank. Sam Altman personally did not receive equity but reportedly pushed for future compensation in a restructuring.",
        category: "milestone",
        newsCardId: 4,
        externalUrl:
          "https://www.nytimes.com/2023/10/21/technology/openai-funding-valuation.html",
        impact: "Critical",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. FED RATE HIKE CYCLE 2022-2023
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "fed-rate-hike-cycle",
    title: "The Fed's Historic Rate Hike Cycle",
    category: "Monetary Policy",
    coverImage:
      "https://images.unsplash.com/photo-1612178991541-b48cc8e92a4d?w=800&q=80",
    summary:
      "From near-zero rates to 5.5% in 16 months — the Federal Reserve's fastest tightening cycle since the 1980s and its ripple effects on global markets.",
    tags: ["Fed", "Interest Rates", "Inflation", "FOMC"],
    stats: {
      totalDuration: "16 months (March 2022 – July 2023)",
      economicDamage: "$8 trillion wiped from US equity markets (peak to trough)",
      affectedEntities: "Every borrower, investor, and central bank globally",
      resolution: "Rate pause at 5.25–5.5%; cuts expected 2024",
      estimatedRecoveryTime: "Markets bottomed Q4 2022; recovered fully by 2023 (Est.)",
    },
    startDate: "2022-03-16",
    endDate: "2023-07-26",
    events: [
      {
        id: "fed-1",
        date: "2022-03-16",
        time: "2:00 PM ET",
        headline: "Fed raises rates for first time since 2018 — 25bps amid Ukraine war",
        detail:
          "The FOMC raised the federal funds rate by 25 basis points to 0.25–0.5%, the first hike since December 2018. Fed Chair Jerome Powell called inflation 'too high' and signalled a series of hikes ahead, but markets initially rallied on relief that the uncertainty was resolved.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.federalreserve.gov/newsevents/pressreleases/monetary20220316a.htm",
        impact: "High",
      },
      {
        id: "fed-2",
        date: "2022-06-15",
        time: "2:00 PM ET",
        headline: "Fed hikes 75bps — biggest increase since 1994",
        detail:
          "Shocked by a surprise CPI print of 8.6% (40-year high), the Fed raised rates by 75bps — the largest move since 1994. The S&P 500 had already fallen 22% year-to-date. Powell said the Fed was 'acutely focused' on restoring price stability.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.federalreserve.gov/newsevents/pressreleases/monetary20220615a.htm",
        impact: "Critical",
      },
      {
        id: "fed-3",
        date: "2022-11-02",
        time: "2:00 PM ET",
        headline: "4th consecutive 75bps hike — terminal rate discussion begins",
        detail:
          "The Fed delivered its fourth consecutive 75bps hike, taking rates to 3.75–4%. For the first time, Powell mentioned the possibility of slowing the pace of hikes — sparking a market debate on when the 'terminal rate' (peak) would be reached and when cuts might begin.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.federalreserve.gov/newsevents/pressreleases/monetary20221102a.htm",
        impact: "High",
      },
      {
        id: "fed-4",
        date: "2023-02-01",
        time: "2:00 PM ET",
        headline: "Fed slows to 25bps — pivot narrative gains steam",
        detail:
          "The FOMC raised rates by just 25bps, signalling the end of the aggressive hiking pace. Markets celebrated — the S&P 500 jumped 1.5%. Powell cautioned that 'ongoing increases' were still appropriate, but the word 'disinflation' was used for the first time, sending risk assets higher.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230201a.htm",
        impact: "Medium",
      },
      {
        id: "fed-5",
        date: "2023-07-26",
        time: "2:00 PM ET",
        headline: "Final hike to 5.25–5.5% — Fed signals pause",
        detail:
          "After 11 consecutive rate hikes totalling 525 basis points — the most aggressive tightening cycle since Paul Volcker's 1980s campaign — the FOMC raised rates to 5.25–5.5% and signalled a data-dependent pause. Core inflation had fallen from 6.6% to 4.8%. The next major move would be cuts in September 2024.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://www.federalreserve.gov/newsevents/pressreleases/monetary20230726a.htm",
        impact: "High",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. BYJU'S COLLAPSE
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "byjus-collapse",
    title: "Byju's Collapse — India's EdTech Giant Falls",
    category: "India / Startup",
    coverImage:
      "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    summary:
      "From India's most valued startup at $22B to NCLT insolvency proceedings — how Byju's went from global darling to corporate cautionary tale.",
    tags: ["Byju's", "EdTech", "India", "Startup", "Insolvency"],
    stats: {
      totalDuration: "~3 years (2021–2024)",
      economicDamage: "$22B valuation → near zero; $1.2B lender dispute",
      affectedEntities: "50,000+ employees, 150M+ students, investors including BlackRock, Sequoia",
      resolution: "NCLT insolvency (2024); Byju Raveendran arrested briefly",
      estimatedRecoveryTime: "Unknown — restructuring ongoing (Est.)",
    },
    startDate: "2021-07-01",
    endDate: "2024-03-01",
    events: [
      {
        id: "bj-1",
        date: "2021-07-01",
        time: "All Day",
        headline: "Byju's hits $16.5B valuation — India's most valued startup",
        detail:
          "Byju's raised $800M led by UBS and Blackrock-managed funds, valuing it at $16.5B — making it India's most valued private startup. The pandemic online learning boom pushed revenue to ₹2,428 crore. Founder Byju Raveendran was featured on Fortune, Bloomberg, and Forbes covers globally.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://techcrunch.com/2021/07/15/byjus-becomes-indias-most-valuable-startup-with-new-800-million-funding/",
        impact: "High",
      },
      {
        id: "bj-2",
        date: "2022-09-01",
        time: "All Day",
        headline: "Byju's auditor Deloitte resigns — FY2021 results delayed 18 months",
        detail:
          "Deloitte resigned as Byju's auditor after the company delayed filing its FY2021 financial results by 18 months — an extraordinary red flag for a company seeking more investor capital. Three independent board members also resigned in the same period.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.livemint.com/companies/news/deloitte-and-three-directors-quit-byjus-11673614089069.html",
        impact: "High",
      },
      {
        id: "bj-3",
        date: "2023-06-05",
        time: "All Day",
        headline: "BCCI sues Byju's for ₹158 crore sponsorship non-payment",
        detail:
          "The Board of Control for Cricket in India (BCCI) took Byju's to the National Company Law Tribunal (NCLT) for non-payment of ₹158 crore (~$19M) in jersey sponsorship fees. The lawsuit was the first major legal action and opened a flood of creditor claims publicly.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/industry/services/education/bcci-moves-nclt-against-byjus/articleshow/101067234.cms",
        impact: "High",
      },
      {
        id: "bj-4",
        date: "2023-11-01",
        time: "All Day",
        headline: "US lenders claim $1.2B loan was misappropriated",
        detail:
          "A group of US-based lenders filed suit claiming Byju's had moved $533M of their $1.2B term loan to an obscure Florida hedge fund without consent — a potential violation of loan covenants. Byju's disputed the claim but the reputational damage was devastating and the valuation was written to near zero by investors.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.bloomberg.com/news/articles/2023-11-01/byjus-us-lenders-say-533-million-was-secretly-transferred",
        impact: "Critical",
      },
      {
        id: "bj-5",
        date: "2024-03-01",
        time: "All Day",
        headline: "NCLT admits insolvency petition — Byju Raveendran arrested",
        detail:
          "India's NCLT admitted BCCI's insolvency petition against Byju's parent company Think & Learn Pvt. Ltd. Byju Raveendran was briefly arrested on money laundering allegations by the Enforcement Directorate, though released on bail. The company that once hosted Shahrukh Khan ads and sponsored the Indian cricket team was now fighting for survival.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/industry/services/education/byjus-insolvency-nclt/articleshow/108456789.cms",
        impact: "Critical",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. UK MINI-BUDGET CRISIS (TRUSS)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "uk-mini-budget-crisis",
    title: "UK Mini-Budget Crisis & Truss Resignation",
    category: "Macro / UK Economy",
    coverImage:
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80",
    summary:
      "Liz Truss's £45B unfunded tax cut plan crashed UK bond markets, tanked the pound, triggered an emergency BoE intervention — and cost her the Prime Ministership in just 45 days.",
    tags: ["UK", "GBP", "Gilts", "Truss", "BoE"],
    stats: {
      totalDuration: "45 days as PM (shortest in UK history)",
      economicDamage: "£300B wiped from UK pension funds at peak",
      affectedEntities: "UK pension funds, mortgage holders, GBP holders globally",
      resolution: "Truss resigned; Sunak reversed fiscal plan",
      estimatedRecoveryTime: "Gilt yields normalised in ~3 months (Est.)",
    },
    startDate: "2022-09-23",
    endDate: "2022-10-25",
    events: [
      {
        id: "uk-1",
        date: "2022-09-23",
        time: "9:30 AM BST",
        headline: "Kwarteng presents £45B unfunded 'mini-budget'",
        detail:
          "New Chancellor Kwasi Kwarteng (appointed by PM Liz Truss) announced £45B in tax cuts without accompanying OBR (Office for Budget Responsibility) forecasts — an unprecedented move. Cuts included reversing the 45p income tax rate and scrapping the planned corporation tax rise. Markets were immediately alarmed.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/uk-politics-63001364",
        impact: "Critical",
      },
      {
        id: "uk-2",
        date: "2022-09-26",
        time: "All Day",
        headline: "GBP crashes to all-time low of $1.035 vs USD",
        detail:
          "The pound fell to a record low of $1.0350 against the US dollar — approaching parity for the first time in history. UK 30-year gilt yields surged 100bps in two days, the biggest move since 1987. The IMF issued an extraordinary public rebuke of UK fiscal policy, urging the government to reverse course.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.theguardian.com/business/2022/sep/26/pound-sterling-hits-record-low-against-us-dollar",
        impact: "Critical",
      },
      {
        id: "uk-3",
        date: "2022-09-28",
        time: "7:00 AM BST",
        headline: "Bank of England launches emergency £65B gilt purchase program",
        detail:
          "The BoE announced an emergency bond-buying program of up to £65B to stabilise the gilt market after pension funds (which use leveraged LDI strategies) faced catastrophic margin calls. Without intervention, multiple pension funds would have been forced to sell assets in a doom loop. The program ran for 13 days.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.bankofengland.co.uk/news/2022/september/bank-of-england-announces-gilt-market-operation",
        impact: "Critical",
      },
      {
        id: "uk-4",
        date: "2022-10-14",
        time: "All Day",
        headline: "Kwarteng sacked; most mini-budget measures reversed within 10 days",
        detail:
          "Kwasi Kwarteng was sacked as Chancellor after just 38 days — one of the shortest tenures in UK history. Jeremy Hunt replaced him and within days reversed virtually all of the mini-budget's tax cuts. Truss said she had 'no option but to change course' in a brief press conference that lasted under 10 minutes.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/uk-politics-63257439",
        impact: "High",
      },
      {
        id: "uk-5",
        date: "2022-10-25",
        time: "All Day",
        headline: "Liz Truss resigns after 45 days — Rishi Sunak becomes PM",
        detail:
          "Liz Truss resigned, making her the shortest-serving UK Prime Minister in history. Rishi Sunak, who had warned during the leadership contest that the unfunded tax cuts were risky, took over. Sterling and gilts immediately stabilised. The episode became a global case study in fiscal credibility and bond market discipline.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/uk-politics-63385748",
        impact: "High",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. SEBI F&O CRACKDOWN 2024
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "sebi-fo-crackdown",
    title: "SEBI's F&O Crackdown — Protecting Retail Traders",
    category: "Regulation / India",
    coverImage:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&q=80",
    summary:
      "SEBI's data showed 93% of retail F&O traders lose money. What followed was India's most sweeping derivatives market reform in a decade.",
    tags: ["SEBI", "F&O", "Derivatives", "NSE", "Retail Investors"],
    stats: {
      totalDuration: "~12 months (Jan–Dec 2024)",
      economicDamage: "₹1.8 lakh crore in retail losses over 3 years (SEBI data)",
      affectedEntities: "90 lakh+ active F&O retail traders in India",
      resolution: "New rules effective November 2024",
      estimatedRecoveryTime: "Market volumes recovering as of Q1 2025 (Est.)",
    },
    startDate: "2024-01-15",
    endDate: "2024-11-01",
    events: [
      {
        id: "sebi-1",
        date: "2024-01-15",
        time: "All Day",
        headline: "SEBI releases study: 93% of F&O retail traders lose money in 3 years",
        detail:
          "SEBI published a landmark study covering FY22–FY24 showing: 93% of individual F&O traders incurred net losses; the average loss was ₹2 lakh per person; total retail losses exceeded ₹1.8 lakh crore. Despite this, F&O participation had grown 500% in the same period — raising systemic concern.",
        category: "warning",
        newsCardId: null,
        externalUrl:
          "https://www.sebi.gov.in/reports-and-statistics/research/jan-2024/study-on-profit-and-loss-of-individual-traders-dealing-in-equity-fo-segment_79729.html",
        impact: "High",
      },
      {
        id: "sebi-2",
        date: "2024-07-30",
        time: "All Day",
        headline: "SEBI releases consultation paper proposing 7 F&O restrictions",
        detail:
          "SEBI published a consultation paper proposing: (1) increasing minimum contract size from ₹5L to ₹15L, (2) limiting weekly expiries to one per exchange, (3) removing calendar spread margin benefits on expiry day, (4) mandatory upfront premium collection from option buyers, and more. Brokers and exchanges opposed several measures publicly.",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://www.sebi.gov.in/legal/circulars/jul-2024/consultation-paper-on-measures-for-strengthening-equity-index-derivatives-framework-for-increased-investor-protection-and-market-stability_84867.html",
        impact: "High",
      },
      {
        id: "sebi-3",
        date: "2024-09-30",
        time: "All Day",
        headline: "SEBI announces final F&O framework — markets correct sharply",
        detail:
          "SEBI issued a circular confirming most proposed measures. Key final rules: contract size hike to ₹15L minimum, single weekly expiry per exchange (Nifty on Thursdays, Sensex on Fridays), upfront premium collection, higher ELM on expiry day. NSE and BSE stocks fell 2–3% on the day as brokers like Zerodha warned of 30–50% revenue impact.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.sebi.gov.in/legal/circulars/oct-2024/measures-for-strengthening-equity-index-derivatives-framework_87177.html",
        impact: "High",
      },
      {
        id: "sebi-4",
        date: "2024-10-01",
        time: "All Day",
        headline: "NSE F&O volumes fall 40% within first month of new rules",
        detail:
          "NSE reported that total F&O turnover fell approximately 40% in the first month after the new rules took effect. Brokers like Angel One and Zerodha noted their active F&O client counts dropped significantly. SEBI Chairperson Madhabi Puri Buch defended the move as 'responsible regulation.'",
        category: "escalation",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/markets/stocks/news/nse-fo-volume/articleshow/114567890.cms",
        impact: "Medium",
      },
      {
        id: "sebi-5",
        date: "2024-11-01",
        time: "All Day",
        headline: "All new F&O rules fully in effect — market stabilising",
        detail:
          "All SEBI F&O framework changes went live. By November, markets began adapting — institutional participation rose as a percentage of total volume. Analysts noted retail traders were shifting to cash market investing. SEBI's move was praised globally as a model regulatory response to retail derivative speculation risk.",
        category: "resolution",
        newsCardId: null,
        externalUrl:
          "https://www.sebi.gov.in/",
        impact: "Medium",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. INDIA UPI GLOBAL EXPANSION
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: "india-upi-expansion",
    title: "India's UPI: From Demonetization to Global Payments",
    category: "Fintech / Payments",
    coverImage:
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&q=80",
    summary:
      "How India's Unified Payments Interface went from a post-demonetization emergency solution to processing 14 billion monthly transactions — and challenging the global payments order.",
    tags: ["UPI", "NPCI", "Fintech", "India", "Digital Payments"],
    stats: {
      totalDuration: "~8 years (2016–2024)",
      economicDamage: "N/A — Success story",
      affectedEntities: "350M+ UPI users; 50+ countries in expansion pipeline",
      resolution: "Ongoing — UPI live in 7+ countries; IMF backing secured",
      estimatedRecoveryTime: "N/A",
    },
    startDate: "2016-11-08",
    endDate: "2024-01-01",
    events: [
      {
        id: "upi-1",
        date: "2016-11-08",
        time: "8:00 PM IST",
        headline: "PM Modi announces demonetization — cash economy in shock",
        detail:
          "Prime Minister Narendra Modi announced the immediate demonetization of ₹500 and ₹1,000 notes — 86% of India's cash supply by value — with just 4 hours' notice. The move created an acute cash crisis but massively accelerated digital payments adoption. UPI, which had launched in April 2016 with barely 100,000 transactions/month, suddenly became critical infrastructure.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.bbc.com/news/world-asia-india-37924078",
        impact: "Critical",
      },
      {
        id: "upi-2",
        date: "2018-07-01",
        time: "All Day",
        headline: "UPI crosses 1 billion monthly transactions for the first time",
        detail:
          "Just two years after demonetization, UPI crossed 1 billion monthly transactions — a staggering milestone for a country where cash had historically dominated. PhonePe and Google Pay (Tez) emerged as the top two platforms. NPCI declared UPI 'the world's most inclusive payments infrastructure.'",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://npci.org.in/what-we-do/upi/product-statistics",
        impact: "High",
      },
      {
        id: "upi-3",
        date: "2021-03-01",
        time: "All Day",
        headline: "WhatsApp Pay gets NPCI approval — 500M potential UPI users unlocked",
        detail:
          "NPCI granted WhatsApp Pay full UPI rollout approval in India after a 3-year delay due to data localisation concerns. With 500M+ active WhatsApp users in India, the move was seen as potentially doubling addressable UPI the addressable market overnight. Meta's stock rose 1.2% on the news.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://economictimes.indiatimes.com/industry/banking/finance/whatsapp-pay-gets-nod-for-full-scale-payments-service-launch-in-india/articleshow/80679754.cms",
        impact: "Medium",
      },
      {
        id: "upi-4",
        date: "2023-02-26",
        time: "All Day",
        headline: "UPI goes live in Singapore — international rollout begins",
        detail:
          "PM Modi and Singapore PM Lawrence Wong jointly launched UPI-PayNow linkage — the first cross-border real-time payment corridor between India and Singapore. Over 4 million Indians in Singapore could now send money home at near-zero cost. France, UAE, Mauritius, Sri Lanka, Nepal, and Bhutan expanded access in the months following.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://www.livemint.com/news/world/pm-modi-launches-upi-paynow-linkage-in-singapore-11677402780278.html",
        impact: "High",
      },
      {
        id: "upi-5",
        date: "2024-01-01",
        time: "All Day",
        headline: "UPI crosses 14 billion monthly transactions — IMF endorses model",
        detail:
          "India's UPI processed over 14 billion transactions in December 2023 — more than Visa and Mastercard combined in India. The IMF published a working paper calling UPI 'a model for inclusive real-time payments infrastructure' and recommended it as a template for emerging markets. The G20 Financial Inclusion framework formally cited UPI as a global best practice.",
        category: "milestone",
        newsCardId: null,
        externalUrl:
          "https://npci.org.in/what-we-do/upi/product-statistics",
        impact: "Critical",
      },
    ],
  },
];
