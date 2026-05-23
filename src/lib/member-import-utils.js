/**
 * Utilities for normalizing member data from Excel/CSV bulk imports.
 */

const PLACEHOLDER_MEMBER_ID = /\(optional\)/i;

/** Allowed Sandha plan values (matches member registration billing cycles). */
export const SANDHA_PLAN_OPTIONS = [
  "Monthly",
  "Quarterly",
  "Semi-Annual",
  "Yearly",
];

const SANDHA_PLAN_ALIASES = {
  monthly: "Monthly",
  quarter: "Quarterly",
  quarterly: "Quarterly",
  "semi-annual": "Semi-Annual",
  semiannual: "Semi-Annual",
  "semi annual": "Semi-Annual",
  biannual: "Semi-Annual",
  "twice a year": "Semi-Annual",
  "twice per year": "Semi-Annual",
  "twice yearly": "Semi-Annual",
  "2 times a year": "Semi-Annual",
  "2x year": "Semi-Annual",
  yearly: "Yearly",
  annual: "Yearly",
  annually: "Yearly",
};

/** Normalize spreadsheet Sandha plan text to a canonical billing cycle value. */
export function normalizeSandhaPlan(value) {
  if (value == null || value === "") return "Monthly";
  const raw = String(value).trim();
  if (!raw) return "Monthly";

  const canonical = SANDHA_PLAN_OPTIONS.find(
    (opt) => opt.toLowerCase() === raw.toLowerCase(),
  );
  if (canonical) return canonical;

  const alias = SANDHA_PLAN_ALIASES[raw.toLowerCase()];
  return alias ?? raw;
}

/** Normalize header keys: trim whitespace and strip UTF-8 BOM. */
export function normalizeRowKeys(row) {
  const normalized = {};
  for (const [key, value] of Object.entries(row)) {
    const cleanKey = key.replace(/^\uFEFF/, "").trim();
    normalized[cleanKey] = value;
  }
  return normalized;
}

/** Treat template placeholder text as empty member ID. */
export function sanitizeMemberNo(value) {
  if (value == null || value === "") return null;
  const str = String(value).trim();
  if (!str || PLACEHOLDER_MEMBER_ID.test(str)) return null;
  return str;
}

/**
 * Extract member fields from a spreadsheet row (handles export/import column variants).
 */
export function parseImportRow(row) {
  const r = normalizeRowKeys(row);

  const name = r.Name ?? r.name;
  const contact = r.Contact ?? r.contact ?? r.Phone ?? r.phone;
  const address = r.Address ?? r.address;
  const email = r.Email ?? r.email;
  const memberNo = sanitizeMemberNo(
    r["Member ID"] ??
      r["Member No"] ??
      r.memberNo ??
      r.member_id ??
      r.member_no,
  );

  const rawAmount = r.Amount ?? r.amount;
  const amountPerCycle =
    rawAmount != null && rawAmount !== "" ? parseFloat(rawAmount) || 0 : 0;

  const sandhaPlanRaw =
    r["Sandha Plan"] ??
    r["Sandha plan"] ??
    r.sandhaPlan ??
    r.sandha_plan ??
    r.Frequency ??
    r.frequency ??
    r.paymentFrequency ??
    r.payment_frequency;

  const paymentFrequency = normalizeSandhaPlan(sandhaPlanRaw);

  return {
    name: name != null ? String(name).trim() : "",
    contact: contact != null ? String(contact).trim() : "",
    address: address != null ? String(address).trim() : undefined,
    email: email != null ? String(email).trim() : undefined,
    memberNo,
    amountPerCycle,
    paymentFrequency,
  };
}

/** Returns true if the row has enough data to be a member record. */
export function isValidImportRow(parsed) {
  return Boolean(parsed.name && parsed.contact);
}

/** Check that parsed spreadsheet data has a recognizable name column. */
export function hasNameColumn(rows) {
  if (!rows.length) return false;
  const first = normalizeRowKeys(rows[0]);
  return "Name" in first || "name" in first;
}
