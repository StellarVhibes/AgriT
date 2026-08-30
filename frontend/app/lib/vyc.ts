export type VycLifecycleStatus = "Active" | "Redeemed" | "Expired" | "Cancelled";

export const VYC_LIFECYCLE_STATUSES: VycLifecycleStatus[] = [
  "Active",
  "Redeemed",
  "Expired",
  "Cancelled",
];

export interface VycActivityEvent {
  id: string;
  type: "season_start" | "planting" | "inspection" | "harvest" | "sale";
  title: string;
  description: string;
  date: string;
  timestamp: number;
  amount?: number; // In USDC equivalent or kg/tonnes
  amountLabel?: string;
  status: "verified" | "completed" | "pending" | "settled";
  evidenceHash: string;
  location?: string;
  verifiedBy: string;
}

export interface VycDetailRecord {
  id: number;
  farmer: string;
  score: number;
  expectedYield: number; // micro-USDC
  crop: string;
  region: string;
  activityHash: string;
  status: VycLifecycleStatus;
  createdAt: number;
  updatedAt: number;
  events?: VycActivityEvent[];
  isOnChainLive?: boolean;
}

/**
 * Maps numeric on-chain enum index or string value from Soroban contract to VycLifecycleStatus.
 * Contract VycStatus enum:
 * 0 => Active (Certificate minted, awaiting harvest)
 * 1 => Redeemed (Farmer claimed payout / loan settled)
 * 2 => Expired (Harvest window passed without redemption)
 * 3 => Cancelled (Admin-cancelled / verified fraud)
 */
export function mapVycStatus(rawStatus: number | string | undefined | null): VycLifecycleStatus {
  if (rawStatus === null || rawStatus === undefined) {
    return "Active";
  }

  if (typeof rawStatus === "number" || !isNaN(Number(rawStatus))) {
    const num = Number(rawStatus);
    switch (num) {
      case 0:
        return "Active";
      case 1:
        return "Redeemed";
      case 2:
        return "Expired";
      case 3:
        return "Cancelled";
      default:
        return "Active";
    }
  }

  const normalized = String(rawStatus).trim().toLowerCase();
  switch (normalized) {
    case "active":
      return "Active";
    case "redeemed":
      return "Redeemed";
    case "expired":
      return "Expired";
    case "cancelled":
    case "canceled":
      return "Cancelled";
    default:
      return "Active";
  }
}

/**
 * Validates whether an ID is a valid positive integer string/number.
 */
export function isValidVycId(id: string | number): boolean {
  if (typeof id === "number") {
    return Number.isInteger(id) && id > 0;
  }
  const parsed = parseInt(id, 10);
  return !isNaN(parsed) && Number.isInteger(parsed) && parsed > 0 && String(parsed) === id.trim();
}

/**
 * Returns stage metadata and allowed transition rules for a given status.
 */
export function getLifecycleStageInfo(status: VycLifecycleStatus) {
  switch (status) {
    case "Active":
      return {
        stage: 1,
        title: "Active — In Season",
        badgeVariant: "emerald",
        isTerminal: false,
        summary:
          "Certificate is live on-chain. Field activity is ongoing, and investor liquidity is fully matched and allocated.",
        investorMeaning:
          "Capital is actively deployed against expected harvest value. Parametric insurance shield is active.",
        cooperativeMeaning:
          "Farmer is in good standing. Awaiting harvest weigh-in and cooperative depot delivery.",
        allowedTransitions: ["Redeemed", "Expired", "Cancelled"] as VycLifecycleStatus[],
      };
    case "Redeemed":
      return {
        stage: 2,
        title: "Redeemed — Settled",
        badgeVariant: "sky",
        isTerminal: true,
        summary:
          "Harvest completed, verified, and sold. Crop sales proceeded to automatic USDC settlement and investor yield distribution.",
        investorMeaning:
          "Principal + yield successfully returned. Loan fully closed with zero default.",
        cooperativeMeaning:
          "Depot sale finalized and ledger closed. Farmer's trust score received a consistency boost.",
        allowedTransitions: [] as VycLifecycleStatus[],
      };
    case "Expired":
      return {
        stage: 2,
        title: "Expired — Window Closed",
        badgeVariant: "amber",
        isTerminal: true,
        summary:
          "The expected harvest window elapsed without redemption settlement. Parametric weather oracles evaluate for insurance payout.",
        investorMeaning:
          "Financing period concluded. Parametric risk pool absorbs losses if weather triggers occurred.",
        cooperativeMeaning:
          "Harvest window lapsed. Cooperative agronomist review triggered for season assessment.",
        allowedTransitions: [] as VycLifecycleStatus[],
      };
    case "Cancelled":
      return {
        stage: 2,
        title: "Cancelled — Revoked",
        badgeVariant: "rose",
        isTerminal: true,
        summary:
          "Certificate was revoked by the protocol administrator due to evidence mismatch, invalid activity data, or dispute.",
        investorMeaning:
          "Funds safeguarded and unallocated capital returned to liquidity pool.",
        cooperativeMeaning:
          "Dispute protocol logged on-chain. Activity evidence invalidated.",
        allowedTransitions: [] as VycLifecycleStatus[],
      };
  }
}

/**
 * Formats 6-decimal micro-USDC (e.g. 45_000_000 => "$45.00").
 */
export function formatMicroUsdc(microUsdc: number | bigint | string): string {
  const value = typeof microUsdc === "bigint" ? Number(microUsdc) : Number(microUsdc);
  if (isNaN(value) || value < 0) return "$0.00";
  const usdc = value / 1_000_000;
  return `$${usdc.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * Formats a Unix timestamp (in seconds) to a human-readable date and time.
 */
export function formatVycDate(unixSeconds: number | bigint): string {
  const seconds = typeof unixSeconds === "bigint" ? Number(unixSeconds) : unixSeconds;
  if (!seconds || seconds <= 0) return "—";
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Formats a Unix timestamp (in seconds) to full date and time string.
 */
export function formatVycDateTime(unixSeconds: number | bigint): string {
  const seconds = typeof unixSeconds === "bigint" ? Number(unixSeconds) : unixSeconds;
  if (!seconds || seconds <= 0) return "—";
  return new Date(seconds * 1000).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Validates a 64-character lowercase SHA-256 hexadecimal string.
 */
export function isValidActivityHash(hash: string): boolean {
  if (!hash || typeof hash !== "string") return false;
  return /^[0-9a-f]{64}$/i.test(hash);
}

/**
 * Generates deterministic, chronological activity events underlying a VYC
 * (Season start, Planting, Crop inspection, Harvest, Sale/Settlement).
 */
export function generateActivityEventsForVyc(vyc: {
  id: number;
  crop: string;
  region: string;
  expectedYield: number;
  createdAt: number;
  updatedAt: number;
  status: VycLifecycleStatus;
  activityHash: string;
}): VycActivityEvent[] {
  const baseTime = vyc.createdAt || Math.floor(Date.now() / 1000) - 86400 * 60;
  const hashPrefix = vyc.activityHash ? vyc.activityHash.slice(0, 12) : "9f2c41d1e8b7";
  const usdcYield = vyc.expectedYield / 1_000_000;

  const events: VycActivityEvent[] = [
    {
      id: `evt-${vyc.id}-1`,
      type: "season_start",
      title: "Season Registration & Input Purchase",
      description: `Certified ${vyc.crop.toLowerCase()} seed purchase and fertilizer inputs logged via verified agricultural anchor.`,
      timestamp: baseTime - 86400 * 14,
      date: formatVycDate(baseTime - 86400 * 14),
      amount: Math.round(usdcYield * 0.25),
      amountLabel: `$${Math.round(usdcYield * 0.25)} USDC (Input Cost)`,
      status: "verified",
      evidenceHash: `${hashPrefix}a1b2c3d4`,
      location: vyc.region,
      verifiedBy: "AgriAnchor Hub · South Africa / West Africa",
    },
    {
      id: `evt-${vyc.id}-2`,
      type: "planting",
      title: "Planting Log & Geo-Tag Verification",
      description: `Field sowing logged with GPS boundaries in ${vyc.region}. Soil moisture conditions calibrated for ${vyc.crop}.`,
      timestamp: baseTime - 86400 * 7,
      date: formatVycDate(baseTime - 86400 * 7),
      amount: 4.5,
      amountLabel: "4.5 Hectares Cultivated",
      status: "verified",
      evidenceHash: `${hashPrefix}e5f6g7h8`,
      location: vyc.region,
      verifiedBy: "USSD Gateway & Mobile Validator",
    },
    {
      id: `evt-${vyc.id}-3`,
      type: "inspection",
      title: "Mid-Season Agronomy Inspection",
      description: "Satellite NDVI crop vigor scan and local extension officer field report passed standard threshold.",
      timestamp: baseTime,
      date: formatVycDate(baseTime),
      status: "verified",
      evidenceHash: vyc.activityHash || `${hashPrefix}99887766`,
      location: vyc.region,
      verifiedBy: "Sentinel-2 Earth Observation & FluxID Oracle",
    },
  ];

  if (vyc.status === "Redeemed") {
    events.push(
      {
        id: `evt-${vyc.id}-4`,
        type: "harvest",
        title: "Harvest Completion & Quality QA",
        description: `Full seasonal harvest collected and certified grade-A quality at cooperative collection point.`,
        timestamp: vyc.updatedAt > baseTime ? vyc.updatedAt - 86400 * 2 : baseTime + 86400 * 30,
        date: formatVycDate(vyc.updatedAt > baseTime ? vyc.updatedAt - 86400 * 2 : baseTime + 86400 * 30),
        amount: Math.round(usdcYield * 1.05),
        amountLabel: `${(usdcYield * 45).toLocaleString()} kg Harvested`,
        status: "completed",
        evidenceHash: `${hashPrefix}33445566`,
        location: vyc.region,
        verifiedBy: "Cooperative Warehouse QA Team",
      },
      {
        id: `evt-${vyc.id}-5`,
        type: "sale",
        title: "Off-Taker Sale & USDC Liquidity Settlement",
        description: `Grain delivered to institutional off-taker. Net sale proceeds automatically distributed to farmer and liquidity pool.`,
        timestamp: vyc.updatedAt,
        date: formatVycDate(vyc.updatedAt),
        amount: usdcYield,
        amountLabel: `${formatMicroUsdc(vyc.expectedYield)} Settled`,
        status: "settled",
        evidenceHash: `${hashPrefix}77889900`,
        location: vyc.region,
        verifiedBy: "Stellar Horizon & Soroban Smart Settlement",
      }
    );
  } else if (vyc.status === "Expired") {
    events.push({
      id: `evt-${vyc.id}-4`,
      type: "inspection",
      title: "Harvest Window Closure Notice",
      description: "Designated 90-day seasonal harvest window elapsed without final redemption delivery log.",
      timestamp: vyc.updatedAt,
      date: formatVycDate(vyc.updatedAt),
      status: "completed",
      evidenceHash: `${hashPrefix}deadbeef`,
      location: vyc.region,
      verifiedBy: "AgriTrust Protocol Automated Keeper",
    });
  } else if (vyc.status === "Cancelled") {
    events.push({
      id: `evt-${vyc.id}-4`,
      type: "inspection",
      title: "Protocol Cancellation & Evidence Audit",
      description: "Certificate invalidated following verification discrepancy. Risk pool funds safeguarded.",
      timestamp: vyc.updatedAt,
      date: formatVycDate(vyc.updatedAt),
      status: "completed",
      evidenceHash: `${hashPrefix}0000ffff`,
      location: vyc.region,
      verifiedBy: "Protocol Admin Multi-Sig Review",
    });
  } else {
    // Active
    events.push(
      {
        id: `evt-${vyc.id}-4`,
        type: "harvest",
        title: "Estimated Harvest Window",
        description: `Scheduled harvest window for ${vyc.crop.toLowerCase()} in ${vyc.region}. Awaiting delivery notification.`,
        timestamp: baseTime + 86400 * 45,
        date: formatVycDate(baseTime + 86400 * 45),
        amount: usdcYield,
        amountLabel: `Target: ${formatMicroUsdc(vyc.expectedYield)}`,
        status: "pending",
        evidenceHash: "Pending on-chain harvest log",
        location: vyc.region,
        verifiedBy: "Awaiting Farmer / Cooperative Submission",
      },
      {
        id: `evt-${vyc.id}-5`,
        type: "sale",
        title: "Market Sale & Loan Settlement",
        description: "Scheduled settlement upon cooperative depot weigh-in and off-taker payment.",
        timestamp: baseTime + 86400 * 60,
        date: formatVycDate(baseTime + 86400 * 60),
        status: "pending",
        evidenceHash: "Pending settlement transaction",
        location: vyc.region,
        verifiedBy: "Awaiting Soroban Contract Execution",
      }
    );
  }

  return events;
}
