/**
 * Utility functions for citizen complaints, photos, and phone anonymization.
 */

/**
 * Consistently anonymizes/masks a citizen phone number for display in the UI.
 * Examples:
 *   "+91 94231 12345" -> "+91 9423*****45"
 *   "9423112345"      -> "+91 9423*****45"
 *   "+91 98220 *****" -> "+91 98220 *****" (preserves existing masks)
 *   "[REDACTED]"      -> "[REDACTED]"
 */
export const maskPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const trimmed = phone.trim();
  if (!trimmed) return '';
  if (trimmed === '[REDACTED]') return '[REDACTED]';
  if (trimmed.includes('***') || trimmed.includes('****')) return trimmed;

  // Extract all digits
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 4) return '+91 *****';

  // If 12 digits starting with country code 91 (e.g. 919423112345)
  if (digits.length === 12 && digits.startsWith('91')) {
    const local = digits.slice(2);
    return `+91 ${local.slice(0, 4)}*****${local.slice(-2)}`;
  }

  // If 10-digit Indian mobile number (e.g. 9423112345)
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 4)}*****${digits.slice(-2)}`;
  }

  // General fallback for other lengths
  const prefix = digits.slice(0, Math.min(4, Math.floor(digits.length / 2)));
  const suffix = digits.slice(-2);
  return `+91 ${prefix}*****${suffix}`;
};

/**
 * Safely extracts photo URLs from any complaint record schema.
 * Supports: photos (array or JSON string), photoUrl, photoUrls, imageBase64, imageUrl, imageUrls, images.
 */
export const getComplaintPhotos = (complaint) => {
  if (!complaint) return [];

  // 1. Array of photos
  if (Array.isArray(complaint.photos) && complaint.photos.length > 0) {
    return complaint.photos.filter(p => typeof p === 'string' && p.trim().length > 0);
  }

  // 2. JSON string of photos
  if (typeof complaint.photos === 'string' && complaint.photos.trim().length > 0) {
    try {
      const parsed = JSON.parse(complaint.photos);
      if (Array.isArray(parsed)) {
        return parsed.filter(p => typeof p === 'string' && p.trim().length > 0);
      }
    } catch {
      return [complaint.photos.trim()];
    }
  }

  // 3. photoUrls array
  if (Array.isArray(complaint.photoUrls) && complaint.photoUrls.length > 0) {
    return complaint.photoUrls.filter(p => typeof p === 'string' && p.trim().length > 0);
  }

  // 4. Single photoUrl
  if (typeof complaint.photoUrl === 'string' && complaint.photoUrl.trim().length > 0) {
    return [complaint.photoUrl.trim()];
  }

  // 5. images array
  if (Array.isArray(complaint.images) && complaint.images.length > 0) {
    return complaint.images.filter(p => typeof p === 'string' && p.trim().length > 0);
  }

  // 6. imageUrl or imageUrls
  if (typeof complaint.imageUrl === 'string' && complaint.imageUrl.trim().length > 0) {
    return [complaint.imageUrl.trim()];
  }
  if (Array.isArray(complaint.imageUrls) && complaint.imageUrls.length > 0) {
    return complaint.imageUrls.filter(p => typeof p === 'string' && p.trim().length > 0);
  }

  // 7. imageBase64
  if (typeof complaint.imageBase64 === 'string' && complaint.imageBase64.trim().length > 0) {
    return [complaint.imageBase64.trim()];
  }

  return [];
};
