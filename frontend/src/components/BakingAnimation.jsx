import React from 'react';

const BakingAnimation = () => {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #FFF8F3 0%, #F5EBE1 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <style>
        {`
          @keyframes pulse-glow {
            0%, 100% { opacity: 0.4; filter: drop-shadow(0 0 2px #FF5E36); }
            50% { opacity: 0.95; filter: drop-shadow(0 0 10px #FF9F36); }
          }
          @keyframes rise-cake {
            0% { transform: scaleY(0.35); fill: #F1D4B3; }
            45% { transform: scaleY(0.7); fill: #E6B080; }
            80%, 100% { transform: scaleY(1.05); fill: #8B5A2B; }
          }
          @keyframes rise-steam {
            0% { transform: translateY(5px) scaleX(0.8); opacity: 0; }
            30% { opacity: 0.7; }
            100% { transform: translateY(-25px) scaleX(1.2); opacity: 0; }
          }
          @keyframes rotate-dial {
            0%, 100% { transform: rotate(-20deg); }
            50% { transform: rotate(50deg); }
          }
          @keyframes oven-vibrate {
            0%, 100% { transform: translate(0, 0) rotate(0deg); }
            20% { transform: translate(-0.5px, 0.5px) rotate(-0.1deg); }
            40% { transform: translate(-0.5px, -0.5px) rotate(0.1deg); }
            60% { transform: translate(0.5px, 0.5px) rotate(-0.1deg); }
            80% { transform: translate(0.5px, -0.5px) rotate(0.1deg); }
          }
          @keyframes twinkle-star {
            0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
            50% { opacity: 1; transform: scale(1.2) rotate(180deg); }
          }
          @keyframes bowl-whisk {
            0%, 100% { transform: rotate(-8deg); transform-origin: 35px 210px; }
            50% { transform: rotate(12deg); transform-origin: 35px 210px; }
          }
          @keyframes hat-bob {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            50% { transform: translateY(-4px) rotate(3deg); }
          }
        `}
      </style>

      <svg
        viewBox="0 0 400 280"
        style={{
          width: '100%',
          height: '100%',
          maxHeight: '280px'
        }}
      >
        <g style={{ animation: 'twinkle-star 3s infinite ease-in-out', transformOrigin: '40px 60px' }}>
          <path d="M40 50 L42 56 L48 58 L42 60 L40 66 L38 60 L32 58 L38 56 Z" fill="#FFC947" />
        </g>
        <g style={{ animation: 'twinkle-star 4s infinite ease-in-out', animationDelay: '1s', transformOrigin: '360px 80px' }}>
          <path d="M360 70 L362 76 L368 78 L362 80 L360 86 L358 80 L352 78 L358 76 Z" fill="#FFC947" />
        </g>
        <g style={{ animation: 'twinkle-star 2.5s infinite ease-in-out', animationDelay: '1.5s', transformOrigin: '340px 40px' }}>
          <path d="M340 30 L341 34 L345 35 L341 36 L340 40 L339 36 L335 35 L339 34 Z" fill="#FFC947" />
        </g>
        <g style={{ animation: 'twinkle-star 3.5s infinite ease-in-out', animationDelay: '0.5s', transformOrigin: '50px 170px' }}>
          <path d="M50 160 L51 164 L55 165 L51 166 L50 170 L49 166 L45 165 L49 164 Z" fill="#FFC947" />
        </g>

        <path d="M190 40 Q185 30 190 20 T190 0" fill="none" stroke="#EEDAC5" strokeWidth="3" strokeLinecap="round" style={{ animation: 'rise-steam 3s infinite linear' }} />
        <path d="M200 42 Q195 32 200 22 T200 2" fill="none" stroke="#EEDAC5" strokeWidth="3" strokeLinecap="round" style={{ animation: 'rise-steam 3s infinite linear', animationDelay: '1s' }} />
        <path d="M210 40 Q205 30 210 20 T210 0" fill="none" stroke="#EEDAC5" strokeWidth="3" strokeLinecap="round" style={{ animation: 'rise-steam 3s infinite linear', animationDelay: '0.5s' }} />

        <g style={{ animation: 'bowl-whisk 2.2s infinite ease-in-out' }}>
          <path d="M20 210 L50 210 A15 15 0 0 1 20 210 Z" fill="#9A0F29" opacity="0.8" />
          <path d="M32 210 L28 185 Q26 182 29 180 Q32 178 34 181 L38 210" fill="#2F1A1C" />
          <path d="M29 180 Q33 172 38 180" fill="none" stroke="#2F1A1C" strokeWidth="1.5" />
          <path d="M27 182 Q33 175 39 182" fill="none" stroke="#2F1A1C" strokeWidth="1" />
          <circle cx="35" cy="210" r="1.5" fill="#FAF6EE" />
        </g>

        <g style={{ animation: 'hat-bob 3s infinite ease-in-out' }}>
          <path d="M350 200 C345 190 355 180 360 185 C365 175 378 175 380 185 C385 180 395 190 390 200 Z" fill="#ffffff" stroke="#EEDAC5" strokeWidth="2" />
          <rect x="352" y="200" width="36" height="8" rx="2" fill="#E23D52" />
        </g>

        <g style={{ animation: 'oven-vibrate 4s infinite linear' }}>
          <rect x="78" y="235" width="24" height="12" rx="4" fill="#2F1A1C" />
          <rect x="298" y="235" width="24" height="12" rx="4" fill="#2F1A1C" />

          <rect x="70" y="50" width="260" height="185" rx="16" fill="#9A0F29" stroke="#800A1E" strokeWidth="3" />
          <rect x="76" y="56" width="248" height="173" rx="12" fill="none" stroke="#E23D52" strokeWidth="2" />

          <rect x="70" y="50" width="260" height="38" rx="16" fill="#800A1E" />
          <rect x="70" y="72" width="260" height="16" fill="#800A1E" />

          <rect x="85" y="58" width="55" height="20" rx="4" fill="#1C0D0E" />
          <text x="112" y="73" fill="#FF5E36" fontSize="11" fontFamily="monospace" fontWeight="bold" textAnchor="middle">180°C</text>
          <circle cx="93" cy="68" r="2.5" fill="#FF5E36" style={{ animation: 'pulse-glow 1s infinite' }} />

          <circle cx="272" cy="68" r="10" fill="#4E0513" stroke="#9A0F29" strokeWidth="1.5" />
          <line x1="272" y1="68" x2="272" y2="60" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" style={{ animation: 'rotate-dial 5s infinite ease-in-out', transformOrigin: '272px 68px' }} />

          <circle cx="302" cy="68" r="10" fill="#4E0513" stroke="#9A0F29" strokeWidth="1.5" />
          <line x1="302" y1="68" x2="306" y2="60" stroke="#FAF6EE" strokeWidth="2" strokeLinecap="round" style={{ animation: 'rotate-dial 6s infinite ease-in-out', transformOrigin: '302px 68px' }} />

          <rect x="85" y="98" width="230" height="122" rx="8" fill="#1E0E10" stroke="#800A1E" strokeWidth="4" />

          <path d="M95 108 L305 108" stroke="#FF5E36" strokeWidth="4" strokeLinecap="round" style={{ animation: 'pulse-glow 3s infinite ease-in-out' }} />
          <path d="M95 210 L305 210" stroke="#FF5E36" strokeWidth="4" strokeLinecap="round" style={{ animation: 'pulse-glow 3s infinite ease-in-out', animationDelay: '1.5s' }} />

          <line x1="95" y1="185" x2="305" y2="185" stroke="#4E282D" strokeWidth="2" />
          <line x1="115" y1="185" x2="115" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="145" y1="185" x2="145" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="175" y1="185" x2="175" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="205" y1="185" x2="205" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="235" y1="185" x2="235" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="265" y1="185" x2="265" y2="210" stroke="#4E282D" strokeWidth="1.5" />
          <line x1="285" y1="185" x2="285" y2="210" stroke="#4E282D" strokeWidth="1.5" />

          <g style={{ animation: 'rise-cake 8s infinite ease-in-out', transformOrigin: '200px 185px' }}>
            <path d="M135 185 C135 145 265 145 265 185 Z" />
            <ellipse cx="200" cy="155" rx="55" ry="8" fill="#D7C0AE" opacity="0.6" />
          </g>

          <rect x="125" y="180" width="150" height="10" rx="3" fill="#7A7A7A" stroke="#5E5E5E" strokeWidth="1" />
          <rect x="130" y="185" width="140" height="6" rx="2" fill="#5E5E5E" />

          <rect x="90" y="93" width="220" height="132" rx="10" fill="none" stroke="#FAF6EE" strokeWidth="6" opacity="0.15" />
          <path d="M95 105 L165 215" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.05" />
          <path d="M125 105 L195 215" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" opacity="0.05" />
        </g>
      </svg>
    </div>
  );
};

export default BakingAnimation;
