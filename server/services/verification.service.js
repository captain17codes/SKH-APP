import { Jimp } from 'jimp';

// Store hashes and history in memory since we're not fully using Postgres here for demo
const complaintHistory = []; 
const imageHashes = new Map(); // id -> hash

// Kopargaon rough bounding box
const KOPARGAON_BOUNDS = {
  minLat: 19.8600,
  maxLat: 19.9200,
  minLng: 74.4500,
  maxLng: 74.5200
};

export const verificationService = {
  /**
   * Generates a basic perceptual hash (pHash) using Jimp
   * Resizes to 8x8, grayscales, and computes average pixel value to build a 64-bit string
   */
  async generatePHash(base64Image) {
    if (!base64Image) return null;
    try {
      // Remove data URL prefix if present
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');
      
      const image = await Jimp.read(buffer);
      image.resize({ w: 8, h: 8 });
      image.greyscale();

      let total = 0;
      const pixels = [];
      
      // Calculate average pixel value
      image.scan((x, y, idx) => {
        const val = image.bitmap.data[idx];
        pixels.push(val);
        total += val;
      });

      const avg = total / 64;
      let hash = '';
      
      // Compute hash based on average
      for (const p of pixels) {
        hash += p >= avg ? '1' : '0';
      }
      
      return hash;
    } catch (e) {
      console.error('[Verification Service] Failed to generate pHash:', e);
      return null;
    }
  },

  /**
   * Compares two 64-bit hashes using Hamming distance
   * @returns true if distance < 10% (highly likely identical)
   */
  checkDuplicateImage(newHash) {
    if (!newHash) return false;
    
    for (const [id, existingHash] of imageHashes.entries()) {
      let distance = 0;
      for (let i = 0; i < 64; i++) {
        if (newHash[i] !== existingHash[i]) distance++;
      }
      // If distance is <= 6 (approx 10% of 64 bits), consider it a duplicate
      if (distance <= 6) {
        console.log(`[Verification Service] Duplicate image detected with ${id} (Distance: ${distance})`);
        return true;
      }
    }
    return false;
  },

  /**
   * Stores a hash for future comparison
   */
  storeHash(id, hash) {
    if (hash) {
      imageHashes.set(id, hash);
    }
  },

  /**
   * Validates if coordinates fall within Kopargaon city limits
   */
  checkGisSanity(lat, lng) {
    if (!lat || !lng) return false; // Missing GPS is insane
    if (lat >= KOPARGAON_BOUNDS.minLat && lat <= KOPARGAON_BOUNDS.maxLat && 
        lng >= KOPARGAON_BOUNDS.minLng && lng <= KOPARGAON_BOUNDS.maxLng) {
      return true;
    }
    console.log(`[Verification Service] GIS Sanity Failed for ${lat}, ${lng}`);
    return false;
  },

  /**
   * Checks for suspicious burst behavior (e.g., > 3 complaints in 1 hour from same contact)
   */
  checkBurstClustering(contact, ip) {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    // Clean old history
    while (complaintHistory.length > 0 && complaintHistory[0].timestamp < oneHourAgo) {
      complaintHistory.shift();
    }

    let matchCount = 0;
    for (const record of complaintHistory) {
      if ((contact && record.contact === contact) || (ip && record.ip === ip)) {
        matchCount++;
      }
    }

    return matchCount >= 3;
  },

  /**
   * Checks if multiple complaints exist in the same 100m radius within the last 24h
   */
  checkCorroboration(lat, lng) {
    const twentyFourHoursAgo = Date.now() - (24 * 60 * 60 * 1000);
    let nearbyCount = 0;

    for (const record of complaintHistory) {
      if (record.timestamp >= twentyFourHoursAgo && record.lat && record.lng) {
        // Simple distance calculation (very approximate for small area)
        // 1 degree lat ~ 111km
        const latDiff = Math.abs(record.lat - lat) * 111000;
        const lngDiff = Math.abs(record.lng - lng) * 111000 * Math.cos(lat * (Math.PI / 180));
        const distanceMeters = Math.sqrt(latDiff*latDiff + lngDiff*lngDiff);
        
        if (distanceMeters <= 100) {
          nearbyCount++;
        }
      }
    }

    return nearbyCount >= 2;
  },

  /**
   * Logs a complaint for future burst/corroboration checks
   */
  logComplaint(contact, ip, lat, lng) {
    complaintHistory.push({
      contact,
      ip,
      lat,
      lng,
      timestamp: Date.now()
    });
  }
};
