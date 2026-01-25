'use client'

// Brand logos as simple SVG components
const AppleLogo = () => (
  <svg viewBox="0 0 384 512" fill="currentColor" className="h-6 md:h-8 w-auto">
    <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
  </svg>
)

const SamsungLogo = () => (
  <svg viewBox="0 0 500 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="60" fontWeight="bold" fontFamily="Arial, sans-serif">SAMSUNG</text>
  </svg>
)

const SonyLogo = () => (
  <svg viewBox="0 0 300 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="65" fontWeight="bold" fontFamily="Arial, sans-serif">SONY</text>
  </svg>
)

const PlayStationLogo = () => (
  <svg viewBox="0 0 50 50" fill="currentColor" className="h-6 md:h-8 w-auto">
    <path d="M7.68 35.81c-2.08 1.13-1.53 3.07 1.96 3.95 3.65 1.02 7.59 1.26 11.47.62 0.33-0.05.67-0.14 1-0.24v-4.21l-3.5 1.15c-1.29.43-2.63.56-3.96.4-1-.15-1.16-.69-0.35-1.18l7.81-2.76v-4.77l-10.83 3.75c-1.22.41-2.38.98-3.46 1.69-0.05.03-0.1.07-0.14.1zM31.02 24.3v11.58c4.08 2.01 7.32 0.28 7.32-4.45 0-4.82-2.39-9.53-7.32-11.79v-11.14c5.46 1.39 9.88 4.32 12.81 7.88 3.96 4.8 5.99 10.91 5.99 17.33 0 6.55-2.78 10.4-7.65 10.4-3.8 0-7.21-2.06-11.15-5.38v7.27l-4.66 1.54v-28.94l4.66-1.54v7.24zM20.31 7.5v29.35l-4.66 1.53v-24.44c0-2.46-0.31-3.47-1.74-4.14-1.25-0.54-3.46-0.04-3.46-0.04v-3.78s5.13-1.19 7.75 0c1.45.66 2.11 1.85 2.11 4.52z"/>
  </svg>
)

const NintendoLogo = () => (
  <svg viewBox="0 0 400 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">NINTENDO</text>
  </svg>
)

const XboxLogo = () => (
  <svg viewBox="0 0 50 50" fill="currentColor" className="h-6 md:h-8 w-auto">
    <path d="M25 2C12.3 2 2 12.3 2 25s10.3 23 23 23 23-10.3 23-23S37.7 2 25 2zm0 4c2.4 0 4.7.5 6.8 1.3-1.4.8-2.9 2-4.6 3.5-1.2 1.1-2.4 2.4-3.6 3.9-.9-1.2-1.8-2.3-2.8-3.3-1.5-1.4-2.9-2.5-4.2-3.3C18.7 6.5 21.7 6 25 6zM8.4 12.2c2 .6 4.3 2 7 4.4 1.7 1.5 3.4 3.3 5.1 5.3-3.3 4.5-6.1 9.5-7.8 14.2-1.1 2.7-1.8 5.2-2.2 7.3C7 39.5 5 32.5 5 25c0-4.8 1.3-9.3 3.4-13.1zm33.2.1c2.2 3.8 3.4 8.2 3.4 12.7 0 7.6-2.9 14.5-7.6 19.7-.4-2.1-1.1-4.5-2.2-7.2-1.7-4.7-4.5-9.7-7.8-14.2 1.7-2 3.4-3.8 5.1-5.3 2.7-2.4 5-3.8 7-4.4l2.1.7zM25 24.8c2.6 3.4 4.9 7 6.7 10.5 1.7 3.2 2.9 6.3 3.7 8.9-3.2 1.8-6.8 2.8-10.7 2.8-3.8 0-7.3-1-10.4-2.7.8-2.6 2-5.7 3.7-8.9 1.8-3.6 4.1-7.2 6.7-10.6h.3z"/>
  </svg>
)

const DysonLogo = () => (
  <svg viewBox="0 0 280 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="60" fontWeight="300" fontFamily="Arial, sans-serif">dyson</text>
  </svg>
)

const BoseLogo = () => (
  <svg viewBox="0 0 200 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">BOSE</text>
  </svg>
)

const JBLLogo = () => (
  <svg viewBox="0 0 150 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="65" fontWeight="bold" fontFamily="Arial, sans-serif">JBL</text>
  </svg>
)

const GoProLogo = () => (
  <svg viewBox="0 0 280 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">GoPro</text>
  </svg>
)

const DJILogo = () => (
  <svg viewBox="0 0 120 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="60" fontSize="65" fontWeight="bold" fontFamily="Arial, sans-serif">DJI</text>
  </svg>
)

const CanonLogo = () => (
  <svg viewBox="0 0 260 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">Canon</text>
  </svg>
)

const GarminLogo = () => (
  <svg viewBox="0 0 280 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">GARMIN</text>
  </svg>
)

const MarshallLogo = () => (
  <svg viewBox="0 0 350 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="50" fontWeight="bold" fontFamily="Times, serif" fontStyle="italic">Marshall</text>
  </svg>
)

const SonosLogo = () => (
  <svg viewBox="0 0 250 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">SONOS</text>
  </svg>
)

const MetaLogo = () => (
  <svg viewBox="0 0 512 512" fill="currentColor" className="h-6 md:h-8 w-auto">
    <path d="M449.9 96c-28.4 0-55.2 18.4-83.6 57.6-17.6 24.4-34 53.8-48.8 83.2l-3.2 6.4c-16.8-46-38.8-89-66-119.8C220.1 90.8 193.3 80 168.9 80c-53.2 0-101.2 50.4-131.2 138C14.5 282.4 4.1 362.4 4.1 416c0 53.2 17.2 96 100.8 96 51.2 0 95.2-31.6 132-63.2 2.4-2 4.8-4.4 7.2-6.4 2.4 2 4.8 4.4 7.2 6.4 36.8 31.6 80.8 63.2 132 63.2 83.6 0 100.8-42.8 100.8-96 0-53.6-10.4-133.6-33.6-198C422.9 130.4 481.3 96 449.9 96zM108.9 464c-41.6 0-56.8-17.6-56.8-48 0-47.6 9.2-121.2 30-180.8C103.3 175.6 136.1 128 168.9 128c18 0 38 10 57.2 29.2 22.8 22.8 43.6 56 59.6 92-29.2 59.2-59.6 123.2-92.8 163.2C160.9 449.6 133.3 464 108.9 464zm296 0c-24.4 0-52-14.4-84-51.6-14-16.4-28.4-35.2-42-55.2 14-28.4 27.6-56 40-80 15.2-29.6 29.6-54 42.8-71.6 21.2-28.4 40.4-41.6 57.2-41.6 14.4 0 20.4 8.4 24.8 21.2 22 63.2 33.2 141.2 33.2 186.8 0 30.4-15.2 48-56.8 48l-15.2-56.8z"/>
  </svg>
)

const RazerLogo = () => (
  <svg viewBox="0 0 250 80" fill="currentColor" className="h-5 md:h-6 w-auto">
    <text x="0" y="58" fontSize="55" fontWeight="bold" fontFamily="Arial, sans-serif">RAZER</text>
  </svg>
)

const BRAND_LOGOS = [
  { name: 'Apple', Logo: AppleLogo },
  { name: 'Samsung', Logo: SamsungLogo },
  { name: 'Sony', Logo: SonyLogo },
  { name: 'PlayStation', Logo: PlayStationLogo },
  { name: 'Nintendo', Logo: NintendoLogo },
  { name: 'Xbox', Logo: XboxLogo },
  { name: 'Dyson', Logo: DysonLogo },
  { name: 'Bose', Logo: BoseLogo },
  { name: 'JBL', Logo: JBLLogo },
  { name: 'GoPro', Logo: GoProLogo },
  { name: 'DJI', Logo: DJILogo },
  { name: 'Canon', Logo: CanonLogo },
  { name: 'Garmin', Logo: GarminLogo },
  { name: 'Marshall', Logo: MarshallLogo },
  { name: 'Sonos', Logo: SonosLogo },
  { name: 'Meta', Logo: MetaLogo },
  { name: 'Razer', Logo: RazerLogo },
]

export function BrandMarquee() {
  return (
    <section className="py-8 overflow-hidden bg-white/[0.02] border-y border-white/5">
      <div
        className="flex overflow-hidden"
        style={{ maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)' }}
      >
        <div className="flex animate-marquee">
          {[...BRAND_LOGOS, ...BRAND_LOGOS].map((brand, index) => (
            <div
              key={`brand-${index}`}
              className="flex-shrink-0 px-8 md:px-12 text-white/30 hover:text-white/50 transition-colors"
            >
              <brand.Logo />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
