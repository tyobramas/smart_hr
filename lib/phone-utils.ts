/**
 * Phone and WhatsApp Number Utility for SmartHR
 * Validates, normalizes, and formats Indonesian and international phone numbers
 * for WhatsApp recruitment notifications and profile records.
 */

export interface PhoneValidationResult {
  isValid: boolean;
  /** Normalized E.164 format with plus, e.g. "+6281234567890" */
  normalized: string;
  /** Numeric digits only without plus, e.g. "6281234567890" (ready for WhatsApp API / wa.me) */
  rawDigits: string;
  /** Pretty formatted local Indonesian display, e.g. "0812-3456-7890" */
  localDisplay: string;
  /** Pretty formatted international display, e.g. "+62 812-3456-7890" */
  internationalDisplay: string;
  /** Direct WhatsApp URL link */
  waLink: string;
  /** Human-readable error message in Indonesian if invalid */
  error?: string;
}

/**
 * Validates and normalizes candidate WhatsApp phone number.
 * Supports Indonesian formats:
 * - 0812-3456-7890
 * - 081234567890
 * - 6281234567890
 * - +6281234567890
 * - 81234567890
 * Also supports international numbers starting with '+' (E.164, 10-15 digits).
 */
export function validateWhatsAppPhone(rawInput?: string | null): PhoneValidationResult {
  if (!rawInput || typeof rawInput !== "string" || !rawInput.trim()) {
    return {
      isValid: false,
      normalized: "",
      rawDigits: "",
      localDisplay: "",
      internationalDisplay: "",
      waLink: "",
      error: "Nomor WhatsApp wajib diisi untuk pengiriman notifikasi tahapan seleksi.",
    };
  }

  const trimmed = rawInput.trim();

  // Check for forbidden characters (only digits, spaces, hyphens, parentheses, plus allowed)
  if (!/^[\d\s\-()+]+$/.test(trimmed)) {
    return {
      isValid: false,
      normalized: "",
      rawDigits: "",
      localDisplay: "",
      internationalDisplay: "",
      waLink: "",
      error: "Nomor WhatsApp hanya boleh memuat angka, tanda tambah (+), dan tanda strip (-).",
    };
  }

  // Remove whitespace, dashes, dots, parentheses
  let sanitized = trimmed.replace(/[\s\-.()]/g, "");

  // Detect and normalize Indonesian mobile numbers
  let isIndonesia = false;
  let nationalNumber = ""; // Digits after country code or leading 0

  if (sanitized.startsWith("+62")) {
    isIndonesia = true;
    nationalNumber = sanitized.slice(3);
  } else if (sanitized.startsWith("62")) {
    isIndonesia = true;
    nationalNumber = sanitized.slice(2);
  } else if (sanitized.startsWith("08")) {
    isIndonesia = true;
    nationalNumber = sanitized.slice(1); // includes '8'
  } else if (sanitized.startsWith("8") && sanitized.length >= 9 && sanitized.length <= 13) {
    isIndonesia = true;
    nationalNumber = sanitized;
  }

  if (isIndonesia) {
    // If nationalNumber starts with 0 (e.g. from 6208...), strip that extra 0
    if (nationalNumber.startsWith("0")) {
      nationalNumber = nationalNumber.slice(1);
    }

    // Indonesian mobile numbers must start with 8 (e.g. 811, 812, 852, 878, 895, etc.)
    if (!nationalNumber.startsWith("8")) {
      return {
        isValid: false,
        normalized: "",
        rawDigits: "",
        localDisplay: "",
        internationalDisplay: "",
        waLink: "",
        error: "Nomor seluler Indonesia harus diawali dengan angka 8 setelah kode negara (contoh: 0812... atau +62812...).",
      };
    }

    // Indonesian mobile length check: national number is 8xxxxxxxxx (total 9 to 12 digits, meaning full number 08xx is 10 to 13 digits)
    if (nationalNumber.length < 9) {
      return {
        isValid: false,
        normalized: "",
        rawDigits: "",
        localDisplay: "",
        internationalDisplay: "",
        waLink: "",
        error: "Nomor WhatsApp terlalu pendek. Nomor ponsel Indonesia minimal terdiri dari 10 digit (contoh: 08123456789).",
      };
    }

    if (nationalNumber.length > 13) {
      return {
        isValid: false,
        normalized: "",
        rawDigits: "",
        localDisplay: "",
        internationalDisplay: "",
        waLink: "",
        error: "Nomor WhatsApp terlalu panjang (maksimal 13 digit untuk nomor ponsel Indonesia).",
      };
    }

    // Check for obvious dummy repetitive numbers (e.g. 8000000000, 8111111111)
    if (/^8(\d)\1{7,}$/.test(nationalNumber)) {
      return {
        isValid: false,
        normalized: "",
        rawDigits: "",
        localDisplay: "",
        internationalDisplay: "",
        waLink: "",
        error: "Nomor WhatsApp tidak valid (terindikasi nomor percobaan / berulang). Masukkan nomor asli Anda.",
      };
    }

    const rawDigits = `62${nationalNumber}`;
    const normalized = `+62${nationalNumber}`;
    const localNumber = `0${nationalNumber}`;

    // Format local display: 0812-3456-7890
    const localDisplay = formatIndonesianChunks(localNumber);
    // Format international display: +62 812-3456-7890
    const internationalDisplay = `+62 ${formatIndonesianChunks(`0${nationalNumber}`).slice(1)}`;
    const waLink = `https://wa.me/${rawDigits}`;

    return {
      isValid: true,
      normalized,
      rawDigits,
      localDisplay,
      internationalDisplay,
      waLink,
    };
  }

  // Handling standard International E.164 numbers (starting with +)
  if (sanitized.startsWith("+")) {
    const digitsOnly = sanitized.slice(1);
    if (!/^\d{10,15}$/.test(digitsOnly)) {
      return {
        isValid: false,
        normalized: "",
        rawDigits: "",
        localDisplay: "",
        internationalDisplay: "",
        waLink: "",
        error: "Format nomor internasional tidak valid (harus 10 - 15 digit termasuk kode negara).",
      };
    }

    return {
      isValid: true,
      normalized: sanitized,
      rawDigits: digitsOnly,
      localDisplay: sanitized,
      internationalDisplay: sanitized,
      waLink: `https://wa.me/${digitsOnly}`,
    };
  }

  // If user entered numbers not starting with 08 or +, but is a valid sequence
  return {
    isValid: false,
    normalized: "",
    rawDigits: "",
    localDisplay: "",
    internationalDisplay: "",
    waLink: "",
    error: "Gunakan format nomor WhatsApp Indonesia (contoh: 0812-3456-7890) atau format internasional (+62...).",
  };
}

/**
 * Pretty-formats an Indonesian 10-13 digit local phone number into readable dashes:
 * e.g. "08123456789" -> "0812-3456-789"
 * e.g. "081234567890" -> "0812-3456-7890"
 * e.g. "0812345678901" -> "0812-3456-78901"
 */
function formatIndonesianChunks(digits: string): string {
  if (digits.length <= 4) return digits;
  if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8)}`;
  }
  return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 12)}-${digits.slice(12)}`;
}

/**
 * Formats a phone string into a masked version for privacy (e.g. "+62 812-••••-7890").
 */
export function maskPhoneNumber(phone?: string | null): string {
  if (!phone) return "-";
  const res = validateWhatsAppPhone(phone);
  if (!res.isValid) return phone;

  const raw = res.rawDigits;
  if (raw.length < 8) return res.localDisplay || phone;

  const start = raw.slice(0, 5);
  const end = raw.slice(-4);
  return `+${start.slice(0, 2)} ${start.slice(2)}-••••-${end}`;
}
