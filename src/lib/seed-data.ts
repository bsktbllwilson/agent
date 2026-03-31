import type { Neighborhood, Partner, Guide } from "./types";

export const neighborhoods: Omit<Neighborhood, "id">[] = [
  {
    name: "SoHo",
    avg_rent_sqft: 145,
    foot_traffic_score: 92,
    asian_dining_score: 65,
    competitor_count: 18,
  },
  {
    name: "Midtown East",
    avg_rent_sqft: 120,
    foot_traffic_score: 88,
    asian_dining_score: 72,
    competitor_count: 24,
  },
  {
    name: "Lower East Side",
    avg_rent_sqft: 85,
    foot_traffic_score: 76,
    asian_dining_score: 80,
    competitor_count: 15,
  },
  {
    name: "Flushing",
    avg_rent_sqft: 55,
    foot_traffic_score: 70,
    asian_dining_score: 95,
    competitor_count: 42,
  },
  {
    name: "Sunset Park",
    avg_rent_sqft: 42,
    foot_traffic_score: 58,
    asian_dining_score: 88,
    competitor_count: 28,
  },
];

export const partners: Omit<Partner, "id" | "created_at">[] = [
  {
    name: "David Chen",
    firm: "Chen & Associates Realty",
    category: "Real Estate Brokers",
    specialty: "Commercial leasing for F&B operators in Manhattan & Brooklyn",
    languages: ["English", "Mandarin", "Cantonese"],
    email: "david@chenrealty.com",
    website: "https://chenrealty.com",
    verified: true,
  },
  {
    name: "Sarah Kim",
    firm: "Pacific Bridge Law",
    category: "Immigration Attorneys",
    specialty: "E-2 investor visas and L-1 intracompany transfers for F&B brands",
    languages: ["English", "Korean"],
    email: "skim@pacificbridgelaw.com",
    website: "https://pacificbridgelaw.com",
    verified: true,
  },
  {
    name: "Yuki Tanaka",
    firm: "Tanaka Immigration Group",
    category: "Immigration Attorneys",
    specialty: "EB-5 investor visas and business formation for Japanese companies",
    languages: ["English", "Japanese"],
    email: "yuki@tanaka-law.com",
    website: "https://tanaka-law.com",
    verified: true,
  },
  {
    name: "Michael Wong",
    firm: "East Meets West Distributors",
    category: "Ingredient Distributors",
    specialty: "Specialty Asian ingredients, JIT delivery across NYC metro",
    languages: ["English", "Mandarin"],
    email: "mwong@emwdist.com",
    website: "https://emwdist.com",
    verified: true,
  },
  {
    name: "Lisa Nakamura",
    firm: "Umami Supply Co.",
    category: "Ingredient Distributors",
    specialty: "Japanese pantry staples, dashi, miso, specialty soy sauces",
    languages: ["English", "Japanese"],
    email: "lisa@umamisupply.com",
    website: "https://umamisupply.com",
    verified: true,
  },
  {
    name: "Jennifer Park",
    firm: "Eastward PR",
    category: "PR & Localization",
    specialty: "US market entry PR campaigns for Asian restaurant brands",
    languages: ["English", "Korean", "Mandarin"],
    email: "jen@eastwardpr.com",
    website: "https://eastwardpr.com",
    verified: true,
  },
  {
    name: "Kevin Zhao",
    firm: "Zhao & Partners CPA",
    category: "Accountants & Tax",
    specialty: "Tax compliance and entity structuring for foreign-owned F&B businesses",
    languages: ["English", "Mandarin"],
    email: "kevin@zhaocpa.com",
    website: "https://zhaocpa.com",
    verified: true,
  },
  {
    name: "Amy Huang",
    firm: "Brightside Commercial",
    category: "Real Estate Brokers",
    specialty: "Restaurant-ready spaces in Chinatown, LES, and Flushing",
    languages: ["English", "Mandarin", "Cantonese"],
    email: "amy@brightsidecommercial.com",
    website: "https://brightsidecommercial.com",
    verified: true,
  },
];

export const guides: Omit<Guide, "id" | "created_at">[] = [
  {
    title: "Choosing the Right Visa for Your NYC Restaurant",
    slug: "visa-options-nyc-restaurant",
    category: "Visa & Legal",
    phase: 1,
    published: true,
    content: `# Choosing the Right Visa for Your NYC Restaurant

## Overview
Opening a restaurant in New York City as a foreign national requires securing the right visa. The most common pathways for F&B entrepreneurs are the E-2 Treaty Investor Visa and the L-1 Intracompany Transferee Visa.

## E-2 Treaty Investor Visa
The E-2 visa is available to nationals of countries that maintain a treaty of commerce with the United States. Key requirements include:

- **Substantial investment** — Typically $150,000–$500,000+ for an NYC restaurant
- **Active business** — You must be coming to the US to develop and direct the enterprise
- **Treaty country** — Japan, South Korea, Taiwan, Thailand, and the Philippines all qualify

### Timeline
Processing typically takes 2–4 months at a US consulate. Premium processing is not available for E-2.

## L-1 Intracompany Transfer
If your brand already has an established presence abroad, the L-1 visa allows you to transfer a manager or executive to open a US office.

- **L-1A** for managers/executives (up to 7 years)
- **L-1B** for specialized knowledge workers (up to 5 years)
- Requires at least 1 year of employment with the foreign entity in the past 3 years

## Entity Formation
Before applying for either visa, you'll need to form a US legal entity — typically a Delaware LLC or New York LLC. Work with an immigration attorney who understands F&B operations to ensure your business plan meets USCIS standards.

## Next Steps
1. Consult with an immigration attorney specializing in investor visas
2. Prepare a detailed business plan with financial projections
3. Secure proof of investment funds
4. Begin the entity formation process`,
  },
  {
    title: "NYC Health Permits & DOH Licensing Guide",
    slug: "nyc-health-permits-doh-licensing",
    category: "Permits & Licensing",
    phase: 2,
    published: true,
    content: `# NYC Health Permits & DOH Licensing Guide

## Overview
New York City has some of the most rigorous health and safety regulations for food establishments in the country. Understanding the permitting process early will save you months of delays.

## Required Permits

### 1. Food Service Establishment Permit
Issued by the NYC Department of Health and Mental Hygiene (DOHMH). Required before you can serve any food to the public.

- Apply through NYC Business Express
- Requires a passing health inspection (score of A or B)
- Annual renewal required

### 2. Food Protection Certificate
At least one person on-site during all hours of operation must hold a valid Food Protection Certificate.

- Complete a 16-hour course from an approved provider
- Pass the DOHMH exam
- Certificate is valid for 5 years

### 3. DCA Licenses
The Department of Consumer Affairs (now DCWP) requires additional permits depending on your operations:

- **Sidewalk Cafe License** — if you plan outdoor seating
- **Signage Permit** — for storefront signs
- **Music/Entertainment License** — if you plan live music or DJs

### 4. State Liquor Authority (SLA)
If you plan to serve alcohol, you need a license from the NY State Liquor Authority.

- **On-Premises Liquor License** — full bar service
- **Beer & Wine License** — limited to beer and wine
- Processing takes 4–6 months; apply as early as possible

## Inspection Process
The DOHMH will conduct an unannounced inspection. They score on a point system — fewer points = better grade.

## Common Pitfalls for Asian F&B Operators
- Temperature control for rice and noodle dishes (frequent violation)
- Proper labeling of sauces and marinades in non-English languages
- Ensuring imported specialty equipment meets US electrical codes`,
  },
  {
    title: "Negotiating Your First NYC Lease as a Foreign Operator",
    slug: "negotiating-nyc-lease-foreign-operator",
    category: "Real Estate",
    phase: 2,
    published: true,
    content: `# Negotiating Your First NYC Lease as a Foreign Operator

## Overview
Commercial leases in NYC are complex, long-term commitments. As a foreign operator without US credit history, you'll face additional scrutiny — but there are strategies to strengthen your position.

## Key Lease Terms to Understand

### Base Rent & Escalations
- NYC commercial rents are quoted per square foot per year
- Expect annual escalations of 2–3%
- Some landlords offer "graduated rent" — lower rent in year 1, increasing over time

### Lease Duration
- Most landlords prefer 10-year leases for restaurants
- Negotiate for a 5-year initial term with a 5-year renewal option
- Shorter leases may require larger security deposits

### Personal Guarantees
As a foreign operator, landlords will likely require:
- 6–12 months of rent as security deposit
- A personal guarantee (often "good guy" guarantee in NYC)
- Proof of funds or a US-based guarantor

## Tips for Foreign Operators
1. **Build a relationship** with a local real estate broker who specializes in restaurant spaces
2. **Prepare audited financials** from your home country, translated and certified
3. **Offer larger deposits** in exchange for better lease terms
4. **Negotiate a build-out period** — 2–3 months rent-free for construction
5. **Include an assignment clause** allowing you to transfer the lease

## Red Flags to Watch For
- Landlords who won't disclose CAM (Common Area Maintenance) costs
- Restrictions on cooking methods (important for wok cooking, grilling)
- Exclusivity clauses that may prevent nearby competition (can work in your favor)`,
  },
  {
    title: "Hiring Staff & NYC Labor Law Compliance",
    slug: "hiring-staff-nyc-labor-law",
    category: "Operations",
    phase: 3,
    published: true,
    content: `# Hiring Staff & NYC Labor Law Compliance

## Overview
NYC has some of the strongest labor protections in the country. Understanding these laws before you hire is critical to avoiding costly violations.

## Minimum Wage & Overtime
- NYC minimum wage: $16.00/hour (2024)
- Overtime: 1.5x regular rate for hours over 40/week
- Tip credit: Employers may pay tipped workers a lower cash wage if tips make up the difference
- **Spread of hours**: Additional hour of pay required when a shift spans more than 10 hours

## Required Postings & Documentation
- Federal and NY labor law posters (must be displayed in the workplace)
- I-9 Employment Eligibility Verification for all employees
- Workers' compensation insurance
- Disability benefits insurance

## NYC-Specific Requirements

### Fair Workweek Law
Applies to fast food and retail employers:
- Must provide schedules 14 days in advance
- Premium pay for schedule changes
- Right to refuse shifts with less than 11 hours between them

### Paid Safe and Sick Leave
- All NYC employees earn 1 hour of safe/sick leave per 30 hours worked
- Up to 56 hours per year for employers with 100+ employees
- Up to 40 hours per year for employers with fewer than 100 employees

## Hiring Best Practices for Asian F&B Operators
1. Work with a local HR consultant or PEO (Professional Employer Organization)
2. Ensure all job postings comply with NYC's salary transparency law
3. Set up proper payroll systems before your first hire
4. Document all policies in an employee handbook (in English and workers' primary languages)`,
  },
  {
    title: "Supply Chain & Specialty Ingredient Sourcing in NYC",
    slug: "supply-chain-specialty-ingredients-nyc",
    category: "Operations",
    phase: 3,
    published: true,
    content: `# Supply Chain & Specialty Ingredient Sourcing in NYC

## Overview
One of the biggest challenges for Asian F&B brands entering NYC is replicating the flavors and quality your customers expect. NYC has excellent sourcing infrastructure, but it requires knowing where to look.

## Major Distribution Channels

### Asian Specialty Distributors
- **JFC International** — Japanese ingredients (largest US distributor)
- **Wismettac (Nishimoto)** — Japanese, Korean, and Southeast Asian products
- **Dual Specialty** — Chinese and Southeast Asian ingredients

### Broadline Distributors
- **Sysco Metro NY** — General restaurant supplies with limited Asian selection
- **US Foods** — Broad catalog; growing Asian ingredient portfolio
- **Restaurant Depot** — Cash-and-carry warehouse (membership required)

### Direct Import
For ingredients unavailable through local distributors:
- Work with a licensed customs broker
- FDA registration required for food importers
- Lead time: 4–8 weeks for ocean freight from Asia

## Key Considerations

### Cold Chain for Fresh Ingredients
- Establish relationships with local produce markets (Hunts Point is NYC's main hub)
- Some specialty items (fresh yuzu, specific mushroom varieties) may need air freight

### Labeling Requirements
- All packaged ingredients must have English labeling
- Nutrition facts and allergen declarations required by FDA
- Work with your supplier to ensure compliance before importing

## Building Your Supply Chain
1. Start with 2–3 reliable distributors before launch
2. Test ingredient quality from multiple sources during R&D
3. Build backup sourcing for critical ingredients
4. Consider commissary kitchen production for sauces and bases`,
  },
  {
    title: "Brand Localization: Naming & Positioning for US Audiences",
    slug: "brand-localization-us-audiences",
    category: "Marketing",
    phase: 4,
    published: true,
    content: `# Brand Localization: Naming & Positioning for US Audiences

## Overview
Your brand identity — name, story, visual language — is your first impression in a new market. Localization isn't about changing who you are; it's about making your story resonate with a new audience.

## Name Localization Strategies

### Keep the Original Name
Works well when the name is:
- Easy to pronounce in English
- Distinctive and memorable
- Already has some international recognition
- Example: Ippudo, Din Tai Fung, CoCo

### Create an English Companion Name
Pair your original name with an English descriptor:
- "Tsuta — Japanese Soba Noodles"
- "Hai Di Lao — Hot Pot"
- Helps with search, discovery, and word-of-mouth

### Full Rebrand
Sometimes a new market requires a fresh identity:
- Consider this if your name is difficult to pronounce or has unintended meanings
- Work with a localization agency that understands both cultures
- Test with focus groups in your target market

## Positioning Your Brand

### Tell Your Origin Story
NYC diners are sophisticated and curious. They want to know:
- Where your recipes come from
- What makes your approach authentic
- Why you chose NYC for your expansion

### Visual Identity
- Adapt your design for US digital and print formats
- Ensure your brand works on US delivery platforms (DoorDash, Uber Eats)
- Invest in professional food photography that appeals to the local market

### Digital Presence
1. Secure your domain and social media handles early
2. Build an English-language website before launch
3. Claim your Google Business Profile
4. Develop a launch PR strategy with a local agency

## Common Mistakes
- Translating your menu too literally (work with a native English speaker)
- Using imagery that doesn't resonate with the local market
- Ignoring US accessibility and dietary labeling expectations (GF, vegan, allergens)`,
  },
];
