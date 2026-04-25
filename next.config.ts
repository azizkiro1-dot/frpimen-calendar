import type { NextConfig } from "next";

const nextConfig: any = {
  experimental: {
    optimizePackageImports: ['lucide-react','luxon','@fullcalendar/react','@fullcalendar/daygrid','@fullcalendar/timegrid','@fullcalendar/interaction','@fullcalendar/list','@fullcalendar/rrule'],
  },
  
}
const _orig: NextConfig = {
  /* config options here */
};

export default nextConfig;
