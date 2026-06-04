/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type ScanStatus = 'SAFE' | 'SUSPICIOUS' | 'DANGEROUS' | 'PENDING' | 'ERROR';

export interface ScanResult {
  id: string;
  url: string;
  inputType: 'QR_IMAGE' | 'DIRECT_URL';
  qrContent?: string;
  status: ScanStatus;
  riskScore: number; // 0-100
  reasons: string[];
  isHttps: boolean;
  domain: string;
  domainAge: number | null; // in days
  redirectCount: number;
  redirectChain: string[];
  finalDomain: string;
  suspiciousKeywords: string[];
  aiSummary: string;
  aiRecommendation: string;
  createdAt: string;
  virusTotalResult: {
    flagged: boolean;
    positives: number;
    total: number;
    permalink: string | null;
  } | null;
  safeBrowsingResult: {
    flagged: boolean;
    threats: string[];
  } | null;
  urlHausResult: {
    flagged: boolean;
    status: string | null;
    threat: string | null;
    urlhausReference: string | null;
    urlStatus: string | null;
  } | null;
  dnsRecords?: {
    ipAddress: string | null;
    nameServers: string[] | null;
    mailServers: string[] | null;
  } | null;
}

export interface UserStats {
  totalScans: number;
  safeScans: number;
  suspiciousScans: number;
  dangerousScans: number;
  remainingScansToday: number;
  scansTodayCount: number;
  maxScansPerDay: number;
}

export type UserPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface PricingPlan {
  id: UserPlan;
  name: string;
  nameAr: string;
  price: string;
  pricePeriod: string;
  dailyScans: number;
  features: string[];
  featuresAr: string[];
  popular?: boolean;
}

