// Coptic Orthodox liturgical calendar — major fixed feasts + select saints
// Format: month-day (Gregorian, after the 13-day shift). Coptic year follows AM (Anno Martyrum).

export type FeastEntry = {
  date: string  // 'MM-DD' Gregorian
  name: string
  rank: 'major' | 'minor' | 'saint' | 'fast'
  color: string
  desc?: string
}

// Seven Major Feasts of the Lord (Gregorian dates for Eastern celebration)
// + Seven Minor Feasts + key saint commemorations from the Coptic Synaxarium
export const COPTIC_FEASTS: FeastEntry[] = [
  // Major Feasts
  { date: '01-07', name: 'Nativity (Christmas)',                  rank: 'major', color: '#ef4444', desc: 'Birth of Christ' },
  { date: '01-19', name: 'Theophany (Epiphany)',                  rank: 'major', color: '#3b82f6', desc: 'Baptism of Christ in the Jordan' },
  // Pascha (Easter) and related are movable — handled separately
  // Annunciation (Bashons) — March 21 in Julian = April 7 most years
  { date: '04-07', name: 'Annunciation',                          rank: 'major', color: '#8b5cf6', desc: 'Feast of the Annunciation' },

  // Minor Feasts
  { date: '01-14', name: 'Circumcision',                          rank: 'minor', color: '#f59e0b' },
  { date: '02-15', name: 'Presentation in the Temple',            rank: 'minor', color: '#f59e0b' },
  { date: '08-19', name: 'Transfiguration',                       rank: 'minor', color: '#f59e0b' },

  // Marian feasts
  { date: '08-22', name: 'Falling Asleep of the Theotokos',       rank: 'major', color: '#a855f7', desc: 'Dormition of the Virgin Mary' },
  { date: '12-04', name: 'Entry of the Theotokos into the Temple',rank: 'minor', color: '#c084fc' },
  { date: '12-09', name: 'Conception of the Theotokos',           rank: 'minor', color: '#c084fc' },
  { date: '09-21', name: 'Nativity of the Theotokos',             rank: 'minor', color: '#a855f7' },

  // Apostles & key saints
  { date: '07-12', name: 'Sts. Peter & Paul',                     rank: 'major', color: '#dc2626', desc: 'Chief of the Apostles' },
  { date: '11-29', name: 'St. Andrew the Apostle',                rank: 'saint', color: '#737373' },
  { date: '05-08', name: 'St. Mark the Evangelist',               rank: 'major', color: '#dc2626', desc: 'Founder of the Coptic Church' },
  { date: '01-15', name: 'St. Macarius the Great',                rank: 'saint', color: '#737373' },
  { date: '02-08', name: 'St. Antony the Great',                  rank: 'saint', color: '#737373', desc: 'Father of monasticism' },
  { date: '08-09', name: 'St. Pimen the Great',                   rank: 'saint', color: '#dc2626', desc: 'Patron saint' },
  { date: '08-12', name: 'St. Mary of Egypt',                     rank: 'saint', color: '#737373' },
  { date: '04-23', name: 'St. George the Megalomartyr',           rank: 'major', color: '#dc2626' },
  { date: '06-15', name: 'St. Demetrius',                         rank: 'saint', color: '#737373' },
  { date: '12-12', name: 'St. Spyridon',                          rank: 'saint', color: '#737373' },
  { date: '12-06', name: 'St. Nicholas of Myra',                  rank: 'saint', color: '#737373' },
  { date: '11-09', name: 'St. Matthew the Evangelist',            rank: 'saint', color: '#737373' },
  { date: '10-09', name: 'St. James the Apostle',                 rank: 'saint', color: '#737373' },

  // Fasts
  { date: '11-25', name: 'Nativity Fast begins',                  rank: 'fast', color: '#525252', desc: '43-day fast before Christmas' },
  { date: '08-07', name: 'Apostles\' Fast begins',                rank: 'fast', color: '#525252' },
  { date: '08-14', name: 'Dormition Fast begins',                 rank: 'fast', color: '#525252', desc: '15-day fast' },
  { date: '08-29', name: 'Beheading of John the Baptist',         rank: 'minor', color: '#737373' },
]

// Returns feasts on a given Gregorian date
export function feastsOn(date: Date): FeastEntry[] {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  const key = `${mm}-${dd}`
  return COPTIC_FEASTS.filter(f => f.date === key)
}

export function feastsInRange(start: Date, end: Date): { date: Date; entries: FeastEntry[] }[] {
  const out: { date: Date; entries: FeastEntry[] }[] = []
  const cur = new Date(start)
  while (cur <= end) {
    const fs = feastsOn(cur)
    if (fs.length) out.push({ date: new Date(cur), entries: fs })
    cur.setDate(cur.getDate() + 1)
  }
  return out
}
