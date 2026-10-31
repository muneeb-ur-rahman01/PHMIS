/* PHIMS prototype — synthetic demo data only.
   Nothing here is a real patient, facility, or figure for Pakistan. */
window.PHIMS_DATA = (function () {
  "use strict";

  // ---- Roles (mirrors the Phase-1 role-permission matrix) ----------------
  const ROLES = [
    { key: "super-admin", label: "Super Administrator", scope: "System-wide",
      email: "admin@phims.demo", mfa: true,
      nav: ["dashboard","facilities","patients","surveillance","inventory","equipment","imports","alerts","reports","users","audit","settings"] },
    { key: "national", label: "National Health Administrator", scope: "Pakistan (all provinces)",
      email: "national@phims.demo", mfa: true,
      nav: ["dashboard","facilities","surveillance","inventory","equipment","alerts","reports","users","settings"] },
    { key: "provincial", label: "Provincial Health Administrator", scope: "Punjab province",
      email: "punjab@phims.demo", mfa: true,
      nav: ["dashboard","facilities","surveillance","inventory","equipment","alerts","reports","users","settings"] },
    { key: "district", label: "District Health Officer", scope: "Narowal district, Punjab",
      email: "narowal@phims.demo", mfa: true,
      nav: ["dashboard","facilities","patients","surveillance","inventory","alerts","reports","settings"] },
    { key: "facility", label: "Facility Administrator", scope: "DHQ Hospital Narowal",
      email: "dhq.narowal@phims.demo", mfa: true,
      nav: ["dashboard","facilities","patients","inventory","equipment","reports","settings"] },
    { key: "entry", label: "Healthcare Data Entry Operator", scope: "THQ Hospital Shakargarh (own drafts)",
      email: "entry.shakargarh@phims.demo", mfa: false,
      nav: ["dashboard","patients","imports","settings"] },
    { key: "epi", label: "Epidemiologist / Public Health Analyst", scope: "Punjab province (pseudonymized)",
      email: "epi@phims.demo", mfa: true,
      nav: ["dashboard","surveillance","alerts","reports","settings"] },
    { key: "inventory", label: "Inventory and Resource Manager", scope: "Narowal district",
      email: "inventory@phims.demo", mfa: false,
      nav: ["dashboard","inventory","equipment","reports","settings"] },
    { key: "auditor", label: "Report Viewer / Auditor", scope: "Punjab province",
      email: "auditor@phims.demo", mfa: true,
      nav: ["dashboard","reports","audit","settings"] },
    { key: "partner", label: "Authorized Partner Organization User", scope: "Partner agreement — Narowal district",
      email: "partner@phims.demo", mfa: false,
      nav: ["dashboard","facilities","reports","settings"] },
  ];
  const DEMO_PASSWORD = "PhimsDemo#2026";

  // ---- Navigation catalog --------------------------------------------------
  const NAV_ITEMS = [
    { key: "dashboard",     label: "Dashboard",                    icon: "grid" },
    { key: "facilities",    label: "Healthcare facilities",        icon: "building" },
    { key: "patients",      label: "Patients and records",         icon: "folder" },
    { key: "surveillance",  label: "Disease surveillance",         icon: "virus" },
    { key: "inventory",     label: "Medicines and inventory",      icon: "pill" },
    { key: "equipment",     label: "Equipment and resources",      icon: "bed" },
    { key: "imports",       label: "Data imports",                 icon: "upload" },
    { key: "alerts",        label: "Alerts and outbreak signals",  icon: "bell" },
    { key: "reports",       label: "Reports and analytics",        icon: "chart" },
    { key: "users",         label: "User and access management",   icon: "users" },
    { key: "audit",         label: "Audit logs",                   icon: "shield" },
    { key: "settings",      label: "System settings",              icon: "gear" },
  ];

  // ---- Geography -------------------------------------------------------
  const PROVINCES = [
    { id: "pb", name: "Punjab",             x: 230, y: 150 },
    { id: "sd", name: "Sindh",              x: 190, y: 330 },
    { id: "kp", name: "Khyber Pakhtunkhwa", x: 110, y: 90  },
    { id: "bl", name: "Balochistan",        x: 90,  y: 260 },
    { id: "gb", name: "Gilgit-Baltistan",   x: 230, y: 40  },
    { id: "aj", name: "Azad Kashmir",       x: 250, y: 95  },
    { id: "ict", name: "Islamabad Capital Territory", x: 215, y: 100 },
  ];

  // ---- Facilities (names echo the architecture diagram's demo rows) -------
  const FACILITIES = [
    { id: "F-0001", code: "DHQ-NWL",  name: "DHQ Hospital Narowal",         type: "Hospital",  province: "pb", district: "Narowal",     status: "Operational",        beds: 180, bedsAvailable: 42,  reporting: "Daily" },
    { id: "F-0002", code: "THQ-SHK",  name: "THQ Hospital Shakargarh",      type: "Hospital",  province: "pb", district: "Narowal",     status: "Operational",        beds: 90,  bedsAvailable: 11,  reporting: "Daily" },
    { id: "F-0003", code: "RHC-ZFW",  name: "RHC Zafarwal",                 type: "RHC",        province: "pb", district: "Narowal",     status: "Partial",           beds: 20,  bedsAvailable: 3,   reporting: "Weekly" },
    { id: "F-0004", code: "BHU-RHM",  name: "BHU Raya Mandi",               type: "BHU",        province: "pb", district: "Narowal",     status: "Operational",        beds: 6,   bedsAvailable: 2,   reporting: "Weekly" },
    { id: "F-0005", code: "DHQ-SGD",  name: "DHQ Hospital Sialkot",         type: "Hospital",  province: "pb", district: "Sialkot",     status: "Operational",        beds: 310, bedsAvailable: 58,  reporting: "Daily" },
    { id: "F-0006", code: "LAB-SGD",  name: "Public Health Lab Sialkot",    type: "Laboratory", province: "pb", district: "Sialkot",     status: "Operational",        beds: 0,   bedsAvailable: 0,   reporting: "Daily" },
    { id: "F-0007", code: "DHQ-LHR",  name: "Services Hospital Lahore",     type: "Hospital",  province: "pb", district: "Lahore",      status: "Operational",        beds: 820, bedsAvailable: 140, reporting: "Daily" },
    { id: "F-0008", code: "PHC-LHR",  name: "Pharmacy Store Lahore Central",type: "Pharmacy",   province: "pb", district: "Lahore",      status: "Operational",        beds: 0,   bedsAvailable: 0,   reporting: "Monthly" },
    { id: "F-0009", code: "DHQ-MUL",  name: "Nishtar Hospital Multan",      type: "Hospital",  province: "pb", district: "Multan",      status: "Partial",           beds: 1250,bedsAvailable: 95,  reporting: "Daily" },
    { id: "F-0010", code: "WH-MUL",   name: "Medical Warehouse Multan",     type: "Warehouse",  province: "pb", district: "Multan",      status: "Operational",        beds: 0,   bedsAvailable: 0,   reporting: "Weekly" },
    { id: "F-0011", code: "DHQ-KHI",  name: "Jinnah Postgraduate Karachi",  type: "Hospital",  province: "sd", district: "Karachi East",status: "Operational",        beds: 1600,bedsAvailable: 210, reporting: "Daily" },
    { id: "F-0012", code: "RHC-THR",  name: "RHC Mithi",                    type: "RHC",        province: "sd", district: "Tharparkar", status: "Non-operational",   beds: 15,  bedsAvailable: 0,   reporting: "Stale" },
    { id: "F-0013", code: "BHU-UMR",  name: "BHU Umerkot Rural",            type: "BHU",        province: "sd", district: "Umerkot",     status: "Partial",           beds: 8,   bedsAvailable: 1,   reporting: "Weekly" },
    { id: "F-0014", code: "DHQ-HYD",  name: "Liaquat University Hospital",  type: "Hospital",  province: "sd", district: "Hyderabad",   status: "Operational",        beds: 950, bedsAvailable: 88,  reporting: "Daily" },
    { id: "F-0015", code: "DHQ-PSH",  name: "Lady Reading Hospital",        type: "Hospital",  province: "kp", district: "Peshawar",    status: "Operational",        beds: 1100,bedsAvailable: 160, reporting: "Daily" },
    { id: "F-0016", code: "RHC-SWT",  name: "RHC Mingora",                  type: "RHC",        province: "kp", district: "Swat",        status: "Operational",        beds: 25,  bedsAvailable: 4,   reporting: "Weekly" },
    { id: "F-0017", code: "DHQ-QTA",  name: "Sandeman Hospital Quetta",     type: "Hospital",  province: "bl", district: "Quetta",      status: "Partial",           beds: 400, bedsAvailable: 30,  reporting: "Daily" },
    { id: "F-0018", code: "BHU-GWD",  name: "BHU Gwadar Coastal",           type: "BHU",        province: "bl", district: "Gwadar",      status: "Operational",        beds: 10,  bedsAvailable: 3,   reporting: "Weekly" },
    { id: "F-0019", code: "DHQ-GLT",  name: "DHQ Hospital Gilgit",          type: "Hospital",  province: "gb", district: "Gilgit",      status: "Operational",        beds: 150, bedsAvailable: 22,  reporting: "Daily" },
    { id: "F-0020", code: "DHQ-MZF",  name: "Abbas Institute Muzaffarabad", type: "Hospital",  province: "aj", district: "Muzaffarabad",status: "Operational",        beds: 220, bedsAvailable: 31,  reporting: "Daily" },
    { id: "F-0021", code: "PIMS-ISB", name: "PIMS Islamabad",               type: "Hospital",  province: "ict", district: "Islamabad",  status: "Operational",        beds: 1050,bedsAvailable: 175, reporting: "Daily" },
  ];

  // ---- Diseases & cases (case-based surveillance per Phase-1 decision) ----
  const DISEASES = [
    { code: "DENV", name: "Dengue",            color: "rose" },
    { code: "MAL",  name: "Malaria",            color: "amber" },
    { code: "TYPH", name: "Typhoid",            color: "indigo" },
    { code: "COVID",name: "COVID-19",           color: "teal" },
    { code: "MSL",  name: "Measles",            color: "rose" },
    { code: "DIAR", name: "Diarrheal disease",  color: "amber" },
    { code: "TB",   name: "Tuberculosis",       color: "indigo" },
    { code: "HEPA", name: "Hepatitis A",        color: "teal" },
  ];

  function rngFrom(seed) {
    let s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  }
  const rnd = rngFrom(42);

  const CLASSIFICATIONS = ["Suspected", "Probable", "Confirmed"];
  const OUTCOMES = ["Active", "Recovered", "Deceased"];
  const CASES = [];
  (function buildCases() {
    let n = 1;
    const days = 30;
    for (let d = 0; d < days; d++) {
      const casesToday = 2 + Math.floor(rnd() * 6);
      for (let i = 0; i < casesToday; i++) {
        const disease = DISEASES[Math.floor(rnd() * DISEASES.length)];
        const facility = FACILITIES[Math.floor(rnd() * FACILITIES.length)];
        const classification = CLASSIFICATIONS[Math.floor(rnd() * (rnd() > 0.7 ? 3 : 2))];
        const outcome = classification === "Confirmed"
          ? OUTCOMES[rnd() > 0.9 ? 2 : rnd() > 0.55 ? 1 : 0]
          : "Active";
        const date = new Date(2026, 9, 24 - (days - d));
        CASES.push({
          id: "C-" + String(1000 + n).padStart(5, "0"),
          disease: disease.code,
          facilityId: facility.id,
          province: facility.province,
          classification, outcome,
          reportDate: date.toISOString().slice(0, 10),
          status: rnd() > 0.15 ? "Approved" : "Pending review",
        });
        n++;
      }
    }
  })();

  // ---- Medicines / inventory ----------------------------------------------
  const MEDICINES = [
    { id: "MED-001", name: "IV Fluids (Ringer's Lactate)", facility: "RHC Zafarwal",             stock: 18,  threshold: 60, unit: "bags",    expiry: "2026-11-02" },
    { id: "MED-002", name: "Oral Rehydration Salts",        facility: "BHU Raya Mandi",            stock: 240, threshold: 100,unit: "sachets", expiry: "2027-03-14" },
    { id: "MED-003", name: "Artemether-Lumefantrine",       facility: "DHQ Hospital Sialkot",      stock: 420, threshold: 150,unit: "packs",   expiry: "2027-06-01" },
    { id: "MED-004", name: "Doxycycline 100mg",             facility: "THQ Hospital Shakargarh",   stock: 55,  threshold: 80, unit: "strips",  expiry: "2026-10-30" },
    { id: "MED-005", name: "Paracetamol IV",                facility: "Nishtar Hospital Multan",   stock: 900, threshold: 300,unit: "vials",   expiry: "2027-01-20" },
    { id: "MED-006", name: "Measles Vaccine (MR)",           facility: "RHC Mingora",               stock: 32,  threshold: 100,unit: "vials",   expiry: "2026-11-10" },
    { id: "MED-007", name: "Ceftriaxone 1g",                 facility: "Lady Reading Hospital",     stock: 610, threshold: 200,unit: "vials",   expiry: "2027-08-05" },
    { id: "MED-008", name: "Hepatitis A Vaccine",             facility: "Liaquat University Hospital",stock: 70, threshold: 60, unit: "vials",   expiry: "2026-10-28" },
    { id: "MED-009", name: "Insulin (Regular)",               facility: "PIMS Islamabad",            stock: 150,threshold: 120,unit: "vials",   expiry: "2027-02-18" },
    { id: "MED-010", name: "TB DOTS Combination Pack",        facility: "Sandeman Hospital Quetta",  stock: 85, threshold: 80, unit: "packs",   expiry: "2027-05-22" },
  ];

  // ---- Equipment / resource snapshot --------------------------------------
  const EQUIPMENT = [
    { facility: "DHQ Hospital Narowal",      ventilators: 8,  ventilatorsUp: 6,  ambulances: 4, ambulancesUp: 3 },
    { facility: "THQ Hospital Shakargarh",   ventilators: 3,  ventilatorsUp: 2,  ambulances: 2, ambulancesUp: 2 },
    { facility: "Nishtar Hospital Multan",    ventilators: 40, ventilatorsUp: 29, ambulances: 12,ambulancesUp: 9 },
    { facility: "Jinnah Postgraduate Karachi",ventilators: 65, ventilatorsUp: 52, ambulances: 18,ambulancesUp: 15},
    { facility: "Lady Reading Hospital",      ventilators: 44, ventilatorsUp: 38, ambulances: 14,ambulancesUp: 11},
    { facility: "Sandeman Hospital Quetta",   ventilators: 14, ventilatorsUp: 8,  ambulances: 6, ambulancesUp: 4 },
  ];

  // ---- Alerts ---------------------------------------------------------------
  const ALERTS = [
    { id: "AL-241", type: "Case surge",       severity: "High",     scope: "Narowal district",  disease: "Dengue",  evidence: "34 confirmed cases in 7 days vs. a 9-case baseline", status: "Open",         reviewer: null,               created: "2026-10-23" },
    { id: "AL-240", type: "Low stock",         severity: "High",     scope: "RHC Zafarwal",      disease: null,      evidence: "IV fluids at 30% of threshold (18 of 60 bags)",        status: "Open",         reviewer: null,               created: "2026-10-23" },
    { id: "AL-239", type: "Near-expiry stock",  severity: "Medium",   scope: "THQ Shakargarh",    disease: null,      evidence: "Doxycycline expiring within 7 days",                   status: "Acknowledged", reviewer: "Dr. Imran Qureshi",created: "2026-10-22" },
    { id: "AL-238", type: "Possible cluster",   severity: "Medium",   scope: "Umerkot district",  disease: "Typhoid", evidence: "5 confirmed cases within 2km over 5 days",             status: "Under review", reviewer: "Dr. Saima Raza",   created: "2026-10-21" },
    { id: "AL-237", type: "Stale facility data",severity: "Low",      scope: "RHC Mithi",         disease: null,      evidence: "No report submitted in 11 days",                       status: "Open",         reviewer: null,               created: "2026-10-20" },
    { id: "AL-236", type: "Case surge",         severity: "Medium",   scope: "Swat district",     disease: "Measles", evidence: "Vaccination coverage gap plus 6 new cases",             status: "Resolved",     reviewer: "Dr. Imran Qureshi",created: "2026-10-18" },
    { id: "AL-235", type: "Failed integration", severity: "Low",      scope: "Sialkot Public Health Lab", disease: null, evidence: "Scheduled sync failed twice in 24 hours",             status: "Resolved",     reviewer: "System",           created: "2026-10-17" },
  ];

  // ---- Import batches --------------------------------------------------------
  const IMPORTS = [
    { id: "IMP-1042", source: "CSV upload", uploader: "Rukhsar Bibi", facility: "THQ Hospital Shakargarh", rows: 86,  errors: 2,  status: "Committed",  submitted: "2026-10-23 09:14" },
    { id: "IMP-1041", source: "API sync",    uploader: "Integration: DHIS2 bridge", facility: "Multiple",  rows: 310, errors: 0,  status: "Committed",  submitted: "2026-10-23 03:00" },
    { id: "IMP-1040", source: "Excel upload",uploader: "Bilal Hussain", facility: "RHC Zafarwal",            rows: 24,  errors: 5,  status: "Needs review",submitted: "2026-10-22 16:40" },
    { id: "IMP-1039", source: "CSV upload", uploader: "Rukhsar Bibi", facility: "THQ Hospital Shakargarh", rows: 91,  errors: 0,  status: "Committed",  submitted: "2026-10-22 08:55" },
    { id: "IMP-1038", source: "API sync",    uploader: "Integration: Lab results feed", facility: "Public Health Lab Sialkot", rows: 48, errors: 1, status: "Committed", submitted: "2026-10-21 22:10" },
    { id: "IMP-1037", source: "Excel upload",uploader: "Fatima Noor", facility: "BHU Raya Mandi",           rows: 12,  errors: 0,  status: "Committed",  submitted: "2026-10-21 14:02" },
  ];

  // ---- Saved reports -----------------------------------------------------
  const REPORTS = [
    { id: "RPT-301", name: "Weekly national surveillance summary",     scope: "Pakistan",            generated: "2026-10-23", by: "National Health Administrator" },
    { id: "RPT-300", name: "Punjab dengue trend report",               scope: "Punjab",               generated: "2026-10-22", by: "Dr. Saima Raza" },
    { id: "RPT-299", name: "Narowal district facility performance",    scope: "Narowal district",      generated: "2026-10-21", by: "Dr. Imran Qureshi" },
    { id: "RPT-298", name: "Medicine stock availability — Punjab",     scope: "Punjab",               generated: "2026-10-20", by: "Inventory and Resource Manager" },
    { id: "RPT-297", name: "Data submission compliance — October",      scope: "Pakistan",            generated: "2026-10-18", by: "Report Viewer / Auditor" },
    { id: "RPT-296", name: "Outbreak alert summary — Q3",               scope: "Pakistan",            generated: "2026-10-12", by: "National Health Administrator" },
  ];

  // ---- Users ---------------------------------------------------------------
  const USERS = [
    { name: "Dr. Aisha Farooq",   email: "admin@phims.demo",            role: "Super Administrator",              status: "Active",  mfa: true  },
    { name: "Dr. Hassan Raza",    email: "national@phims.demo",         role: "National Health Administrator",    status: "Active",  mfa: true  },
    { name: "Dr. Saima Raza",     email: "punjab@phims.demo",           role: "Provincial Health Administrator",  status: "Active",  mfa: true  },
    { name: "Dr. Imran Qureshi",  email: "narowal@phims.demo",          role: "District Health Officer",          status: "Active",  mfa: true  },
    { name: "Nasreen Akhtar",     email: "dhq.narowal@phims.demo",      role: "Facility Administrator",           status: "Active",  mfa: true  },
    { name: "Rukhsar Bibi",       email: "entry.shakargarh@phims.demo", role: "Healthcare Data Entry Operator",   status: "Active",  mfa: false },
    { name: "Dr. Fahad Mahmood",  email: "epi@phims.demo",              role: "Epidemiologist / Public Health Analyst", status: "Active", mfa: true },
    { name: "Tariq Jameel",       email: "inventory@phims.demo",        role: "Inventory and Resource Manager",   status: "Active",  mfa: false },
    { name: "Shazia Parveen",     email: "auditor@phims.demo",          role: "Report Viewer / Auditor",          status: "Active",  mfa: true  },
    { name: "Ahmed Siddiqui",     email: "partner@phims.demo",          role: "Authorized Partner Organization User", status: "Active", mfa: false },
    { name: "Bilal Hussain",      email: "bilal.hussain@phims.demo",    role: "Healthcare Data Entry Operator",   status: "Invited", mfa: false },
    { name: "Fatima Noor",        email: "fatima.noor@phims.demo",      role: "Healthcare Data Entry Operator",   status: "Suspended",mfa: false },
  ];

  // ---- Audit log -------------------------------------------------------
  const AUDIT = [
    { time: "2026-10-24 12:41", actor: "narowal@phims.demo",  action: "case.amend",        target: "C-01042", outcome: "Success" },
    { time: "2026-10-24 11:55", actor: "admin@phims.demo",    action: "role.assign",       target: "bilal.hussain@phims.demo", outcome: "Success" },
    { time: "2026-10-24 09:30", actor: "unknown",             action: "login.failed",      target: "auditor@phims.demo", outcome: "Denied" },
    { time: "2026-10-23 22:12", actor: "inventory@phims.demo",action: "inventory.transfer.approve", target: "TRF-0088", outcome: "Success" },
    { time: "2026-10-23 18:04", actor: "entry.shakargarh@phims.demo", action: "import.submit", target: "IMP-1042", outcome: "Success" },
    { time: "2026-10-23 16:47", actor: "narowal@phims.demo",  action: "case.district.read.denied", target: "C-00981 (Umerkot)", outcome: "Denied" },
    { time: "2026-10-23 10:15", actor: "punjab@phims.demo",   action: "alert.acknowledge", target: "AL-239", outcome: "Success" },
    { time: "2026-10-22 20:03", actor: "auditor@phims.demo",  action: "report.export",     target: "RPT-297", outcome: "Success" },
    { time: "2026-10-22 14:28", actor: "admin@phims.demo",    action: "user.invite",       target: "fatima.noor@phims.demo", outcome: "Success" },
    { time: "2026-10-21 08:50", actor: "epi@phims.demo",      action: "alert.review.open", target: "AL-238", outcome: "Success" },
  ];

  return {
    ROLES, DEMO_PASSWORD, NAV_ITEMS, PROVINCES, FACILITIES, DISEASES, CASES,
    MEDICINES, EQUIPMENT, ALERTS, IMPORTS, REPORTS, USERS, AUDIT,
  };
})();
