// Map common city/country/airport names → IANA timezones
// Used to detect when an event location is in a different time zone

const CITY_TZ: Record<string, string> = {
  // North America
  'new york': 'America/New_York', 'nyc': 'America/New_York', 'manhattan': 'America/New_York',
  'boston': 'America/New_York', 'philadelphia': 'America/New_York', 'washington': 'America/New_York', 'dc': 'America/New_York',
  'miami': 'America/New_York', 'atlanta': 'America/New_York', 'detroit': 'America/Detroit',
  'chicago': 'America/Chicago', 'dallas': 'America/Chicago', 'houston': 'America/Chicago', 'austin': 'America/Chicago',
  'denver': 'America/Denver', 'phoenix': 'America/Phoenix',
  'los angeles': 'America/Los_Angeles', 'la': 'America/Los_Angeles', 'san francisco': 'America/Los_Angeles', 'seattle': 'America/Los_Angeles',
  'toronto': 'America/Toronto', 'montreal': 'America/Montreal', 'vancouver': 'America/Vancouver',
  // Europe
  'london': 'Europe/London', 'dublin': 'Europe/Dublin', 'paris': 'Europe/Paris', 'rome': 'Europe/Rome',
  'berlin': 'Europe/Berlin', 'madrid': 'Europe/Madrid', 'amsterdam': 'Europe/Amsterdam', 'athens': 'Europe/Athens',
  // Middle East / Africa
  'cairo': 'Africa/Cairo', 'alexandria': 'Africa/Cairo', 'jerusalem': 'Asia/Jerusalem',
  'beirut': 'Asia/Beirut', 'damascus': 'Asia/Damascus', 'amman': 'Asia/Amman',
  'dubai': 'Asia/Dubai', 'istanbul': 'Europe/Istanbul', 'addis ababa': 'Africa/Addis_Ababa',
  // Asia
  'tokyo': 'Asia/Tokyo', 'seoul': 'Asia/Seoul', 'shanghai': 'Asia/Shanghai', 'hong kong': 'Asia/Hong_Kong',
  'singapore': 'Asia/Singapore', 'bangkok': 'Asia/Bangkok', 'mumbai': 'Asia/Kolkata', 'delhi': 'Asia/Kolkata',
  // Oceania
  'sydney': 'Australia/Sydney', 'melbourne': 'Australia/Melbourne', 'auckland': 'Pacific/Auckland',
}

export function detectTimezone(location: string | null | undefined): string | null {
  if (!location) return null
  const lc = location.toLowerCase()
  for (const [city, tz] of Object.entries(CITY_TZ)) {
    if (lc.includes(city)) return tz
  }
  return null
}
