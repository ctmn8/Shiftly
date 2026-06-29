// Colorado Springs high school coordinates
// Used to calculate distance from school to job
export const COS_SCHOOLS: Record<string, { lat: number; lng: number }> = {
  'Palmer High School':         { lat: 38.8364, lng: -104.8284 },
  'Doherty High School':        { lat: 38.8689, lng: -104.7612 },
  'Mitchell High School':       { lat: 38.8242, lng: -104.8606 },
  'Coronado High School':       { lat: 38.8547, lng: -104.8021 },
  'Pine Creek High School':     { lat: 39.0012, lng: -104.7892 },
  'Vista Ridge High School':    { lat: 39.0234, lng: -104.8103 },
  'Liberty High School':        { lat: 38.9501, lng: -104.7234 },
  'Rampart High School':        { lat: 38.9234, lng: -104.8456 },
  'Cheyenne Mountain High':     { lat: 38.7891, lng: -104.8634 },
  'Air Academy High School':    { lat: 38.9876, lng: -104.8012 },
  'Other':                      { lat: 38.8339, lng: -104.8214 }, // COS city center
}

export function getSchoolCoords(school: string): { lat: number; lng: number } {
  return COS_SCHOOLS[school] ?? COS_SCHOOLS['Other']
}

// Haversine distance in miles
export function distanceMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.asin(Math.sqrt(a))
}
