// src/components/roadmap/avatars.tsx
export const AvatarGirl = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="#FDBCB4" />
    <circle cx="35" cy="40" r="8" fill="#333" />
    <circle cx="65" cy="40" r="8" fill="#333" />
    <path d="M30 60 Q50 75 70 60" stroke="#333" strokeWidth="3" fill="none" />
    <path d="M20 30 Q50 10 80 30" fill="#8B4513" />
  </svg>
);

export const AvatarBoy = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12">
    <circle cx="50" cy="50" r="45" fill="#A7C7E7" />
    <circle cx="35" cy="40" r="8" fill="#333" />
    <circle cx="65" cy="40" r="8" fill="#333" />
    <path d="M30 60 Q50 70 70 60" stroke="#333" strokeWidth="3" fill="none" />
    <rect x="25" y="20" width="50" height="20" rx="8" fill="#333" />
  </svg>
);

export const Pin = ({active}: {active?: boolean}) => (
  <svg viewBox="0 0 24 24" className={active ? "w-9 h-9 text-yellow-400 drop-shadow-lg animate-pulse" : "w-7 h-7 text-gray-600"}>
    <path
      fill="currentColor"
      d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"
    />
  </svg>
);