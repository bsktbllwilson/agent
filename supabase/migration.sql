-- BridgeEast Database Schema
-- Run this in the Supabase SQL Editor to set up all tables

-- ===========================================
-- 1. Partners
-- ===========================================
CREATE TABLE IF NOT EXISTS partners (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  firm TEXT NOT NULL,
  category TEXT NOT NULL,
  specialty TEXT NOT NULL,
  languages TEXT[] NOT NULL DEFAULT '{}',
  email TEXT NOT NULL,
  website TEXT DEFAULT '',
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 2. Guides
-- ===========================================
CREATE TABLE IF NOT EXISTS guides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  phase INTEGER NOT NULL DEFAULT 1,
  content TEXT NOT NULL DEFAULT '',
  published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 3. Waitlist
-- ===========================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  brand_name TEXT NOT NULL DEFAULT '',
  origin_country TEXT NOT NULL DEFAULT '',
  target_open_date TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- 4. Neighborhoods
-- ===========================================
CREATE TABLE IF NOT EXISTS neighborhoods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  avg_rent_sqft NUMERIC NOT NULL DEFAULT 0,
  foot_traffic_score INTEGER NOT NULL DEFAULT 0,
  asian_dining_score INTEGER NOT NULL DEFAULT 0,
  competitor_count INTEGER NOT NULL DEFAULT 0
);

-- ===========================================
-- Row Level Security
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- Public read access for partners, guides, and neighborhoods
CREATE POLICY "Public read partners" ON partners
  FOR SELECT USING (true);

CREATE POLICY "Public read guides" ON guides
  FOR SELECT USING (published = true);

CREATE POLICY "Public read neighborhoods" ON neighborhoods
  FOR SELECT USING (true);

-- Waitlist: anyone can insert
CREATE POLICY "Public insert waitlist" ON waitlist
  FOR INSERT WITH CHECK (true);

-- Authenticated users can manage all data (admin)
CREATE POLICY "Auth manage partners" ON partners
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage guides" ON guides
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Auth read waitlist" ON waitlist
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Auth manage neighborhoods" ON neighborhoods
  FOR ALL USING (auth.role() = 'authenticated');

-- ===========================================
-- Seed Data: Neighborhoods
-- ===========================================
-- Foot traffic: normalized from MTA subway station ridership (2022-2025)
-- Asian dining: from DOHMH restaurant inspection DB + Census Asian population data
-- Competitors: active Asian cuisine restaurant permits by area (DOHMH)
INSERT INTO neighborhoods (name, avg_rent_sqft, foot_traffic_score, asian_dining_score, competitor_count) VALUES
  ('Times Square', 980, 99, 35, 8),
  ('SoHo', 425, 80, 45, 14),
  ('Koreatown', 390, 88, 90, 42),
  ('Midtown East', 350, 90, 68, 22),
  ('Williamsburg', 322, 68, 48, 10),
  ('East Village', 190, 82, 72, 28),
  ('Hell''s Kitchen', 175, 70, 62, 18),
  ('Lower East Side', 150, 65, 78, 20),
  ('Chinatown', 110, 78, 97, 85),
  ('Flushing', 63, 72, 96, 120),
  ('Sunset Park', 38, 52, 85, 55);

-- ===========================================
-- Seed Data: Partners
-- ===========================================
INSERT INTO partners (name, firm, category, specialty, languages, email, website, verified) VALUES
  ('David Chen', 'Chen & Associates Realty', 'Real Estate Brokers', 'Commercial leasing for F&B operators in Manhattan & Brooklyn', ARRAY['English', 'Mandarin', 'Cantonese'], 'david@chenrealty.com', 'https://chenrealty.com', true),
  ('Sarah Kim', 'Pacific Bridge Law', 'Immigration Attorneys', 'E-2 investor visas and L-1 intracompany transfers for F&B brands', ARRAY['English', 'Korean'], 'skim@pacificbridgelaw.com', 'https://pacificbridgelaw.com', true),
  ('Yuki Tanaka', 'Tanaka Immigration Group', 'Immigration Attorneys', 'EB-5 investor visas and business formation for Japanese companies', ARRAY['English', 'Japanese'], 'yuki@tanaka-law.com', 'https://tanaka-law.com', true),
  ('Michael Wong', 'East Meets West Distributors', 'Ingredient Distributors', 'Specialty Asian ingredients, JIT delivery across NYC metro', ARRAY['English', 'Mandarin'], 'mwong@emwdist.com', 'https://emwdist.com', true),
  ('Lisa Nakamura', 'Umami Supply Co.', 'Ingredient Distributors', 'Japanese pantry staples, dashi, miso, specialty soy sauces', ARRAY['English', 'Japanese'], 'lisa@umamisupply.com', 'https://umamisupply.com', true),
  ('Jennifer Park', 'Eastward PR', 'PR & Localization', 'US market entry PR campaigns for Asian restaurant brands', ARRAY['English', 'Korean', 'Mandarin'], 'jen@eastwardpr.com', 'https://eastwardpr.com', true),
  ('Kevin Zhao', 'Zhao & Partners CPA', 'Accountants & Tax', 'Tax compliance and entity structuring for foreign-owned F&B businesses', ARRAY['English', 'Mandarin'], 'kevin@zhaocpa.com', 'https://zhaocpa.com', true),
  ('Amy Huang', 'Brightside Commercial', 'Real Estate Brokers', 'Restaurant-ready spaces in Chinatown, LES, and Flushing', ARRAY['English', 'Mandarin', 'Cantonese'], 'amy@brightsidecommercial.com', 'https://brightsidecommercial.com', true);

-- ===========================================
-- Seed Data: Guides
-- ===========================================
INSERT INTO guides (title, slug, category, phase, published, content) VALUES
  ('Choosing the Right Visa for Your NYC Restaurant', 'visa-options-nyc-restaurant', 'Visa & Legal', 1, true, '# Choosing the Right Visa for Your NYC Restaurant

## Overview
Opening a restaurant in New York City as a foreign national requires securing the right visa. The most common pathways for F&B entrepreneurs are the E-2 Treaty Investor Visa and the L-1 Intracompany Transferee Visa.

## E-2 Treaty Investor Visa
The E-2 visa is available to nationals of countries that maintain a treaty of commerce with the United States.

## L-1 Intracompany Transfer
If your brand already has an established presence abroad, the L-1 visa allows you to transfer a manager or executive to open a US office.'),

  ('NYC Health Permits & DOH Licensing Guide', 'nyc-health-permits-doh-licensing', 'Permits & Licensing', 2, true, '# NYC Health Permits & DOH Licensing Guide

## Overview
New York City has some of the most rigorous health and safety regulations for food establishments in the country.

## Required Permits
Food Service Establishment Permit, Food Protection Certificate, DCA Licenses, and State Liquor Authority license.'),

  ('Negotiating Your First NYC Lease as a Foreign Operator', 'negotiating-nyc-lease-foreign-operator', 'Real Estate', 2, true, '# Negotiating Your First NYC Lease as a Foreign Operator

## Overview
Commercial leases in NYC are complex, long-term commitments. As a foreign operator without US credit history, you will face additional scrutiny.

## Key Lease Terms
Base Rent, Escalations, Lease Duration, and Personal Guarantees.'),

  ('Hiring Staff & NYC Labor Law Compliance', 'hiring-staff-nyc-labor-law', 'Operations', 3, true, '# Hiring Staff & NYC Labor Law Compliance

## Overview
NYC has some of the strongest labor protections in the country. Understanding these laws before you hire is critical.

## Minimum Wage & Overtime
NYC minimum wage is $16.00/hour. Overtime is 1.5x regular rate for hours over 40/week.'),

  ('Supply Chain & Specialty Ingredient Sourcing in NYC', 'supply-chain-specialty-ingredients-nyc', 'Operations', 3, true, '# Supply Chain & Specialty Ingredient Sourcing in NYC

## Overview
One of the biggest challenges for Asian F&B brands entering NYC is replicating the flavors and quality your customers expect.

## Major Distribution Channels
Asian Specialty Distributors, Broadline Distributors, and Direct Import options.'),

  ('Brand Localization: Naming & Positioning for US Audiences', 'brand-localization-us-audiences', 'Marketing', 4, true, '# Brand Localization: Naming & Positioning for US Audiences

## Overview
Your brand identity is your first impression in a new market. Localization is about making your story resonate with a new audience.

## Name Localization Strategies
Keep the Original Name, Create an English Companion Name, or Full Rebrand.');
