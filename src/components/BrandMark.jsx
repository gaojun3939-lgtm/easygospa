// EasyGo Spa brand mark: a three-petal lotus over a gold bowl.
// Single source of truth for the logo — navbar, loading screen and the
// favicon (src/app/icon.svg) all use this same geometry.
export default function BrandMark({ size = 32, tone = 'brand', className = '' }) {
  const petal = tone === 'light' ? '#ffffff' : '#279a43';
  const bowl = tone === 'light' ? 'rgba(255,255,255,0.82)' : '#c9a24b';
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      viewBox="0 0 48 48"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M24 6.5 C28.6 13 28.6 20.8 24 27.5 C19.4 20.8 19.4 13 24 6.5 Z" fill={petal} />
      <path d="M11 14.5 C17.8 15.8 22.1 20.9 23.1 28.3 C15.9 27.9 11.2 22.4 11 14.5 Z" fill={petal} opacity="0.72" />
      <path d="M37 14.5 C30.2 15.8 25.9 20.9 24.9 28.3 C32.1 27.9 36.8 22.4 37 14.5 Z" fill={petal} opacity="0.72" />
      <path d="M11.5 32.5 C16.5 37.2 31.5 37.2 36.5 32.5 C34.6 39.6 13.4 39.6 11.5 32.5 Z" fill={bowl} />
    </svg>
  );
}
