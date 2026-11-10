import React, { useState, useEffect, useRef, useMemo } from 'react';
import { formatINR, SupportedLanguage } from '@seettu/shared';
import {
  Trophy,
  Sparkles,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Share2,
  CheckCircle2,
  AlertCircle,
  Users,
  Search,
  RotateCw,
  Coins,
  ArrowRight,
  ExternalLink,
  Receipt,
  FileCheck2,
  X,
  Phone,
  Flame,
} from 'lucide-react';
import { api } from '../services/api';
import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

interface LuckyDrawProps {
  user: any;
  lang: SupportedLanguage;
  showToast: (msg: string, type?: 'success' | 'error') => void;
  onNavigateToPayouts?: () => void;
  onClose?: () => void;
  initialSchemeId?: string;
}

// 12 festive jewel tones for sectors
const SECTOR_COLORS = [
  '#2563EB', // Royal Blue
  '#059669', // Emerald
  '#D97706', // Amber
  '#DC2626', // Ruby Red
  '#7C3AED', // Vivid Violet
  '#DB2777', // Deep Rose
  '#0891B2', // Cyan
  '#0D9488', // Teal
  '#EA580C', // Orange
  '#4F46E5', // Indigo
  '#65A30D', // Lime Green
  '#0284C7', // Sky Blue
];

// Confetti Particle interface
interface ConfettiParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'ribbon';
  life: number;
  maxLife: number;
}

export const LuckyDrawWheelModal: React.FC<LuckyDrawProps> = ({
  user,
  lang,
  showToast,
  onNavigateToPayouts,
  onClose,
  initialSchemeId,
}) => {
  const isTa = lang === 'ta';

  // Audio Context reference for zero-lag synthesized sound
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Schemes & Selection State
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string>(initialSchemeId || '');
  const [schemeDetails, setSchemeDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('spm_lucky_sound') !== 'false';
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Wheel State
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotationAngle, setRotationAngle] = useState(0); // in radians
  const [winner, setWinner] = useState<any | null>(null);
  const [winningRound, setWinningRound] = useState<number>(1);
  const [showWinnerModal, setShowWinnerModal] = useState(false);

  // Disbursement State
  const [isPreparingVoucher, setIsPreparingVoucher] = useState(false);
  const [voucherPrepared, setVoucherPrepared] = useState(false);
  const [preparedPayoutId, setPreparedPayoutId] = useState<string | null>(null);

  // DOM Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const confettiFrameRef = useRef<number | null>(null);
  const pointerDeflectionRef = useRef<number>(0);
  const lastTickSectorRef = useRef<number>(-1);

  // Confetti particles
  const confettiParticlesRef = useRef<ConfettiParticle[]>([]);

  // Sound generator using Web Audio API (Offline & Zero-Lag)
  const initAudio = () => {
    if (!audioCtxRef.current) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
      }
    }
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playTickSound = (velocityFactor: number = 1) => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      const now = ctx.currentTime;
      // High pitch click ramping down quickly
      const baseFreq = Math.min(1000, Math.max(300, 500 + velocityFactor * 300));
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.025);

      const vol = Math.min(0.3, Math.max(0.05, 0.15 * velocityFactor));
      gain.gain.setValueAtTime(vol, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.025);
    } catch {
      // Audio errors ignored gracefully
    }
  };

  const playFanfareSound = () => {
    if (!soundEnabled) return;
    try {
      initAudio();
      const ctx = audioCtxRef.current;
      if (!ctx) return;

      const now = ctx.currentTime;
      // Triumphant fanfare notes: C5, E5, G5, C6 + celebratory chord
      const notes = [
        { freq: 523.25, time: 0, dur: 0.15 }, // C5
        { freq: 659.25, time: 0.12, dur: 0.15 }, // E5
        { freq: 783.99, time: 0.24, dur: 0.2 }, // G5
        { freq: 1046.5, time: 0.42, dur: 0.6 }, // C6
        // Sustained harmony
        { freq: 523.25, time: 0.42, dur: 1.2 },
        { freq: 659.25, time: 0.42, dur: 1.2 },
        { freq: 783.99, time: 0.42, dur: 1.2 },
        { freq: 1046.5, time: 0.42, dur: 1.2 },
      ];

      notes.forEach(({ freq, time, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + time);

        gain.gain.setValueAtTime(0.001, now + time);
        gain.gain.exponentialRampToValueAtTime(0.2, now + time + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + time);
        osc.stop(now + time + dur);
      });
    } catch {
      // Audio errors ignored
    }
  };

  // Toggle sound setting
  const toggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    localStorage.setItem('spm_lucky_sound', String(nextVal));
    if (nextVal) initAudio();
  };

  // Fullscreen projector toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Load Schemes
  useEffect(() => {
    setLoadingSchemes(true);
    api
      .getSchemes({ status: 'ACTIVE' })
      .then((res) => {
        if (res.success && res.data && res.data.length > 0) {
          setSchemes(res.data);
          // If no initial scheme was passed or current not found, default to first active
          const exists = res.data.find((s: any) => s.id === initialSchemeId);
          setSelectedSchemeId(exists ? exists.id : res.data[0].id);
        }
        setLoadingSchemes(false);
      })
      .catch((err) => {
        showToast(err.message || 'Failed to load schemes', 'error');
        setLoadingSchemes(false);
      });
  }, [initialSchemeId]);

  // Load Detailed Scheme when selectedSchemeId changes
  const loadSchemeDetails = (schemeId: string) => {
    if (!schemeId) return;
    setLoadingDetails(true);
    api
      .getScheme(schemeId)
      .then((res) => {
        if (res.success && res.data) {
          setSchemeDetails(res.data);
          // Auto-select the first pending/collecting round
          const rounds = res.data.collectionRounds || [];
          const currentRound =
            rounds.find((r: any) => r.status === 'COLLECTING') ||
            rounds.find((r: any) => r.status === 'PENDING') ||
            rounds[0];
          if (currentRound) {
            setSelectedRoundNumber(currentRound.roundNumber);
          }
        }
        setLoadingDetails(false);
      })
      .catch((err) => {
        showToast(err.message || 'Failed to load scheme details', 'error');
        setLoadingDetails(false);
      });
  };

  useEffect(() => {
    if (selectedSchemeId) {
      loadSchemeDetails(selectedSchemeId);
    }
  }, [selectedSchemeId]);

  // Calculate Eligible Members (strictly those who haven't received payout yet)
  const allMemberships = useMemo(() => {
    if (!schemeDetails || !schemeDetails.memberships) return [];
    return schemeDetails.memberships;
  }, [schemeDetails]);

  const eligibleMembers = useMemo(() => {
    return allMemberships.filter((m: any) => !m.hasReceivedPayout);
  }, [allMemberships]);

  const alreadyWonMembers = useMemo(() => {
    return allMemberships.filter((m: any) => m.hasReceivedPayout);
  }, [allMemberships]);

  // Filtered eligible for side search
  const filteredEligible = useMemo(() => {
    if (!searchFilter.trim()) return eligibleMembers;
    const q = searchFilter.toLowerCase();
    return eligibleMembers.filter(
      (m: any) =>
        m.member.fullName.toLowerCase().includes(q) ||
        m.member.memberNumber.toLowerCase().includes(q) ||
        m.member.phone.includes(q) ||
        String(m.slotNumber).includes(q)
    );
  }, [eligibleMembers, searchFilter]);

  // Financial calculations for the selected round
  const payoutCalculation = useMemo(() => {
    if (!schemeDetails) {
      return { grossPayoutPaise: 0, deductionsPaise: 0, netPayoutPaise: 0 };
    }
    const pool = schemeDetails.totalPoolAmountPaise || 78000000;
    const commission = schemeDetails.organizerCommissionPaise || 2500000;
    const net = Math.max(0, pool - commission);
    return {
      grossPayoutPaise: pool,
      deductionsPaise: commission,
      netPayoutPaise: net,
    };
  }, [schemeDetails]);

  // Draw the Wheel Canvas
  const drawWheel = (currentAngle: number, flapperAngle: number = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const count = eligibleMembers.length;
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 24;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.scale(dpr, dpr);

    if (count === 0) {
      // Empty state
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 16px "Noto Sans Tamil", sans-serif';
      ctx.fillStyle = '#64748B';
      ctx.fillText(
        isTa ? 'அனைத்து உறுப்பினர்களும் பட்டுவாடா பெற்றுவிட்டனர்!' : 'All members have won payouts!',
        centerX,
        centerY
      );
      ctx.restore();
      return;
    }

    const arc = (2 * Math.PI) / count;

    // Draw Outer Shadow / Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 12, 0, 2 * Math.PI);
    ctx.fillStyle = '#0F172A';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 20;
    ctx.shadowOffsetY = 8;
    ctx.fill();
    ctx.restore();

    // Outer Rim with Golden Metallic Gradient
    const rimGrad = ctx.createLinearGradient(centerX - radius, centerY - radius, centerX + radius, centerY + radius);
    rimGrad.addColorStop(0, '#F59E0B');
    rimGrad.addColorStop(0.3, '#FCD34D');
    rimGrad.addColorStop(0.5, '#B45309');
    rimGrad.addColorStop(0.7, '#FDE68A');
    rimGrad.addColorStop(1, '#92400E');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 10, 0, 2 * Math.PI);
    ctx.lineWidth = 14;
    ctx.strokeStyle = rimGrad;
    ctx.stroke();

    // Draw LED Peg Lights along outer rim
    const ledCount = Math.min(36, Math.max(16, count));
    for (let i = 0; i < ledCount; i++) {
      const ledAngle = (i * 2 * Math.PI) / ledCount;
      const lx = centerX + (radius + 10) * Math.cos(ledAngle);
      const ly = centerY + (radius + 10) * Math.sin(ledAngle);

      ctx.beginPath();
      ctx.arc(lx, ly, 3.5, 0, 2 * Math.PI);
      const isLit = isSpinning ? (i + Math.floor(currentAngle * 5)) % 2 === 0 : i % 2 === 0;
      ctx.fillStyle = isLit ? '#FFFFFF' : '#FEF08A';
      ctx.shadowColor = isLit ? '#FDE047' : 'transparent';
      ctx.shadowBlur = isLit ? 8 : 0;
      ctx.fill();
    }
    ctx.shadowBlur = 0; // reset

    // Draw Sectors
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    for (let i = 0; i < count; i++) {
      const startAngle = i * arc;
      const endAngle = startAngle + arc;
      const color = SECTOR_COLORS[i % SECTOR_COLORS.length];

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();

      // Sector Fill
      ctx.fillStyle = color;
      ctx.fill();

      // Sector Stroke
      ctx.lineWidth = 1;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.stroke();

      // Peg at sector junction
      const pegX = radius * Math.cos(startAngle);
      const pegY = radius * Math.sin(startAngle);
      ctx.beginPath();
      ctx.arc(pegX, pegY, 2.5, 0, 2 * Math.PI);
      ctx.fillStyle = '#FFFFFF';
      ctx.fill();

      // Sector Text (Slot Number & Member Name)
      ctx.save();
      ctx.rotate(startAngle + arc / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#FFFFFF';

      const member = eligibleMembers[i];
      const slotText = `#${member.slotNumber || i + 1}`;
      const rawName = member.member?.fullName || '';
      // Truncate name cleanly
      const displayName = rawName.length > 9 ? rawName.slice(0, 8) + '..' : rawName;

      // Font sizing based on number of slices
      if (count <= 25) {
        ctx.font = 'bold 12px "Noto Sans Tamil", sans-serif';
        ctx.fillText(`${slotText} ${displayName}`, radius - 18, 0);
      } else if (count <= 50) {
        ctx.font = 'bold 10px "Noto Sans Tamil", sans-serif';
        ctx.fillText(`${slotText} ${displayName}`, radius - 16, 0);
      } else {
        // 50-80 slices: display slot number prominently and small initial
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(slotText, radius - 14, 0);
      }
      ctx.restore();
    }

    ctx.restore(); // restore wheel translation/rotation

    // Draw Center Medallion (Golden Temple Hub)
    const hubRadius = Math.max(34, radius * 0.18);

    // Drop shadow under hub
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 3, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();

    // Golden metallic gradient for center
    const hubGrad = ctx.createRadialGradient(
      centerX - 10,
      centerY - 10,
      4,
      centerX,
      centerY,
      hubRadius
    );
    hubGrad.addColorStop(0, '#FEF3C7');
    hubGrad.addColorStop(0.3, '#F59E0B');
    hubGrad.addColorStop(0.7, '#D97706');
    hubGrad.addColorStop(1, '#78350F');

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = hubGrad;
    ctx.fill();

    ctx.lineWidth = 3;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Center Emblem Text / Icon
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 13px "Noto Sans Tamil", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 4;
    ctx.fillText('SPM', centerX, centerY - 6);
    ctx.font = 'bold 9px "Noto Sans Tamil", sans-serif';
    ctx.fillText(isTa ? 'குலுக்கல்' : 'DRAW', centerX, centerY + 8);
    ctx.restore();

    // Draw Top Pointer / Flapper at 12 o'clock
    // Pointer points downward into the wheel
    ctx.save();
    ctx.translate(centerX, centerY - radius - 2);
    ctx.rotate(flapperAngle); // deflect slightly on peg tick

    // Golden indicator needle
    ctx.beginPath();
    ctx.moveTo(0, 24); // tip pointing down
    ctx.lineTo(-12, -8);
    ctx.lineTo(12, -8);
    ctx.closePath();

    const needleGrad = ctx.createLinearGradient(-12, -8, 12, 24);
    needleGrad.addColorStop(0, '#EF4444');
    needleGrad.addColorStop(0.5, '#F87171');
    needleGrad.addColorStop(1, '#B91C1C');

    ctx.fillStyle = needleGrad;
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetY = 2;
    ctx.fill();

    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    // Needle pivot circle
    ctx.beginPath();
    ctx.arc(0, -6, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FEF08A';
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  };

  // Resize Canvas to device pixel ratio
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const updateCanvasSize = () => {
      const containerWidth = canvas.parentElement?.clientWidth || 360;
      const size = Math.min(containerWidth, isFullscreen ? 560 : 460);
      const dpr = window.devicePixelRatio || 1;

      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      drawWheel(rotationAngle, pointerDeflectionRef.current);
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [eligibleMembers, isFullscreen, rotationAngle]);

  // Confetti Animation Engine
  const spawnConfetti = () => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;

    const count = 220;
    const colors = ['#F59E0B', '#10B981', '#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#FCD34D'];
    const particles: ConfettiParticle[] = [];

    const w = canvas.width;
    const h = canvas.height;

    for (let i = 0; i < count; i++) {
      // Spawn from bottom corners & top center
      const source = Math.random();
      let startX = w / 2;
      let startY = h / 2;
      let vx = (Math.random() - 0.5) * 16;
      let vy = (Math.random() - 0.5) * 16;

      if (source < 0.4) {
        // Bottom-left blast
        startX = w * 0.1;
        startY = h * 0.9;
        vx = Math.random() * 14 + 2;
        vy = -(Math.random() * 18 + 8);
      } else if (source < 0.8) {
        // Bottom-right blast
        startX = w * 0.9;
        startY = h * 0.9;
        vx = -(Math.random() * 14 + 2);
        vy = -(Math.random() * 18 + 8);
      } else {
        // Top fountain
        startX = w * 0.5;
        startY = h * 0.2;
        vx = (Math.random() - 0.5) * 18;
        vy = -(Math.random() * 10 + 4);
      }

      particles.push({
        x: startX,
        y: startY,
        vx,
        vy,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        vRot: (Math.random() - 0.5) * 12,
        shape: Math.random() > 0.4 ? 'rect' : 'circle',
        life: 0,
        maxLife: Math.random() * 180 + 120,
      });
    }

    confettiParticlesRef.current = particles;

    const runConfetti = () => {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let aliveCount = 0;
      particles.forEach((p) => {
        p.life++;
        if (p.life >= p.maxLife) return;
        aliveCount++;

        // Physics
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.35; // gravity
        p.vx *= 0.985; // drag
        p.rotation += p.vRot;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);

        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.globalAlpha = alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'rect') {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, 2 * Math.PI);
          ctx.fill();
        }
        ctx.restore();
      });

      if (aliveCount > 0) {
        confettiFrameRef.current = requestAnimationFrame(runConfetti);
      } else {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    };

    if (confettiFrameRef.current) cancelAnimationFrame(confettiFrameRef.current);
    confettiFrameRef.current = requestAnimationFrame(runConfetti);
  };

  // Resize Confetti Canvas
  useEffect(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const resizeConfetti = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeConfetti();
    window.addEventListener('resize', resizeConfetti);
    return () => window.removeEventListener('resize', resizeConfetti);
  }, []);

  // Spin the Wheel with physics & suspense easing
  const startSpin = () => {
    if (isSpinning) return;
    if (eligibleMembers.length === 0) {
      showToast(isTa ? 'குலுக்கலுக்கு தகுதியான உறுப்பினர்கள் இல்லை' : 'No eligible members remaining for draw', 'error');
      return;
    }

    initAudio();
    setIsSpinning(true);
    setWinner(null);
    setShowWinnerModal(false);
    setVoucherPrepared(false);
    setPreparedPayoutId(null);

    const count = eligibleMembers.length;
    const arc = (2 * Math.PI) / count;

    // Pick uniform random winner index
    const winnerIndex = Math.floor(Math.random() * count);
    const chosenWinner = eligibleMembers[winnerIndex];

    // Pointer is located at angle -PI/2 (top 12 o'clock).
    // Sector i covers [i * arc, (i + 1) * arc].
    // Sector center is (winnerIndex + 0.5) * arc.
    // When wheel rotates by totalAngle, angle under pointer is:
    // (-PI/2 - totalAngle) % 2PI = (winnerIndex + 0.5) * arc % 2PI.
    // Therefore:
    // targetAngle = 2PI - ((winnerIndex + 0.5) * arc) - PI/2.
    // Normalized to [0, 2PI]:
    let targetOffset = (3 * Math.PI) / 2 - (winnerIndex + 0.5) * arc;
    while (targetOffset < 0) targetOffset += 2 * Math.PI;

    // Add 6 to 9 full spins for dramatic suspense
    const extraTurns = Math.floor(Math.random() * 3) + 7;
    const currentNorm = rotationAngle % (2 * Math.PI);
    const delta = extraTurns * 2 * Math.PI + (targetOffset - currentNorm);
    const startAngle = rotationAngle;
    const finalAngle = startAngle + delta;

    const duration = 8500; // 8.5 seconds of realistic deceleration
    const startTime = performance.now();

    lastTickSectorRef.current = -1;

    // Easing: cubic bezier ease-out (high velocity start, long cinematic crawl at the end)
    const easeOutCubic = (t: number) => {
      const f = 1 - t;
      return 1 - f * f * f * f;
    };

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const easedProgress = easeOutCubic(progress);

      const currentRotation = startAngle + delta * easedProgress;
      setRotationAngle(currentRotation);

      // Current angular velocity for sound pitch and needle deflection
      const remainingProgress = 1 - progress;
      const velocity = remainingProgress * 3;

      // Pointer deflection and peg tick sound calculation
      // Normalized angle of the wheel relative to pointer
      const pointerAngle = (3 * Math.PI) / 2;
      const angleUnderPointer = (pointerAngle - currentRotation) % (2 * Math.PI);
      const positiveAngle = angleUnderPointer < 0 ? angleUnderPointer + 2 * Math.PI : angleUnderPointer;
      const currentSector = Math.floor(positiveAngle / arc);

      let flapperDeflect = 0;
      if (currentSector !== lastTickSectorRef.current) {
        lastTickSectorRef.current = currentSector;
        // Trigger tick sound
        playTickSound(velocity);
        // Deflect needle back
        flapperDeflect = -0.25 * Math.min(1, velocity + 0.2);
        pointerDeflectionRef.current = flapperDeflect;
      } else {
        // Spring return to 0
        pointerDeflectionRef.current *= 0.85;
      }

      drawWheel(currentRotation, pointerDeflectionRef.current);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        setIsSpinning(false);
        pointerDeflectionRef.current = 0;
        drawWheel(finalAngle, 0);

        // Record winner
        setWinner(chosenWinner);
        setWinningRound(selectedRoundNumber);

        // Sound & Confetti Celebration
        playFanfareSound();
        spawnConfetti();

        // Reveal Winner Card after a brief suspense pause
        setTimeout(() => {
          setShowWinnerModal(true);
        }, 600);
      }
    };

    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    animationFrameRef.current = requestAnimationFrame(animate);
  };

  // Prepare Payout Voucher via API
  const handlePrepareVoucher = async () => {
    if (!winner || !schemeDetails) return;
    if (user.role !== 'ADMIN' && user.role !== 'STAFF') {
      showToast(isTa ? 'நிர்வாகிகளுக்கு மட்டுமே பட்டுவாடா பதிவு அனுமதி உண்டு' : 'Only Admin/Staff can generate payout vouchers', 'error');
      return;
    }

    setIsPreparingVoucher(true);
    try {
      const notes = `${isTa ? 'டிஜிட்டல் குலுக்கல் முறை (Digital Lucky Draw) மூலம் தேர்ந்தெடுக்கப்பட்ட வெற்றியாளர்' : 'Selected via Digital Lucky Draw Wheel'} • ${new Date().toLocaleDateString('ta-IN')}`;

      const payload = {
        schemeId: schemeDetails.id,
        roundNumber: winningRound,
        recipientMemberId: winner.memberId,
        grossPayoutPaise: payoutCalculation.grossPayoutPaise,
        deductionsPaise: payoutCalculation.deductionsPaise,
        notes,
      };

      const res = await api.preparePayout(payload);
      if (res.success) {
        setVoucherPrepared(true);
        setPreparedPayoutId(res.data?.id || null);
        showToast(
          isTa
            ? `தவணை #${winningRound} பட்டுவாடா வவுச்சர் வெற்றிகரமாக உருவாக்கப்பட்டது!`
            : `Round #${winningRound} payout voucher prepared successfully!`
        );
        // Refresh scheme details to reflect that member has received payout
        loadSchemeDetails(schemeDetails.id);
      } else {
        showToast(res.message || 'Failed to prepare payout voucher', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'An error occurred while creating payout voucher', 'error');
    } finally {
      setIsPreparingVoucher(false);
    }
  };

  // WhatsApp Share Winner Announcement
  const handleShareWinner = async () => {
    if (!winner || !schemeDetails) return;

    const winnerName = winner.member?.fullName || '-';
    const memberNo = winner.member?.memberNumber || '-';
    const slotNo = winner.slotNumber || '-';
    const netFormatted = formatINR(payoutCalculation.netPayoutPaise);
    const dateFormatted = new Date().toLocaleDateString('ta-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const shareText = `🏛️ *ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு*
🎉 *மாதாந்திர டிஜிட்டல் குலுக்கல் வெற்றி அறிவிப்பு!*
----------------------------------------
🏆 *வெற்றியாளர்:* ${winnerName}
🔢 *சீட்டு டோக்கன் எண்:* #${slotNo}
🆔 *உறுப்பினர் எண்:* ${memberNo}
📅 *மாதாந்திர தவணை:* #${winningRound} (${dateFormatted})
💰 *பட்டுவாடா சீட்டுத் தொகை:* ${netFormatted}
----------------------------------------
வாழ்த்துகள்! ஆனங்கூர் கிராம சீட்டு நிதி மேலாண்மை அமைப்பு.`;

    if (Capacitor.isNativePlatform()) {
      try {
        await Share.share({
          title: `குலுக்கல் வெற்றி: ${winnerName}`,
          text: shareText,
          dialogTitle: 'வெற்றியாளர் அறிவிப்பை பகிரவும்',
        });
      } catch {
        // Share cancelled or unavailable
      }
    } else {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
      window.open(waUrl, '_blank');
    }
  };

  return (
    <div
      ref={containerRef}
      className={`relative min-h-[85vh] flex flex-col space-y-5 ${
        isFullscreen ? 'bg-slate-900 text-white p-6 overflow-y-auto' : ''
      }`}
    >
      {/* Confetti Overlay Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50 w-full h-full"
      />

      {/* Top Banner & Controls Header */}
      <div className="bg-gradient-to-r from-amber-600 via-orange-600 to-red-600 rounded-2xl p-5 sm:p-6 text-white shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-yellow-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-yellow-400 text-amber-950 flex items-center gap-1 shadow-sm">
              <Sparkles className="w-3.5 h-3.5" />
              {isTa ? 'நேரலை குலுக்கல் முறை' : 'Live Digital Lucky Draw'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 backdrop-blur-sm">
              {isTa ? '100% நேர்மை & வெளிப்படைத்தன்மை' : 'Transparent & Verifiable'}
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-yellow-300" />
            {isTa ? 'டிஜிட்டல் குலுக்கல் சக்கரம்' : 'Digital Lucky Draw Wheel'}
          </h2>
          <p className="text-xs sm:text-sm text-amber-100 max-w-xl">
            {isTa
              ? 'மாதாந்திர கோவில் சீட்டு கூட்டத்தில் காகித சீட்டுக்கு பதிலாக டிஜிட்டல் குலுக்கல் முறை. பட்டுவாடா பெறாத தகுதியான உறுப்பினர்கள் மட்டுமே சக்கரத்தில் சேர்க்கப்படுவர்.'
              : 'Digital lottery wheel for monthly temple chit meetings. Only active eligible members who have not yet received payouts are included.'}
          </p>
        </div>

        {/* Action Controls: Sound, Fullscreen, Close */}
        <div className="relative z-10 flex items-center gap-2 self-start md:self-center">
          <button
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition-all text-xs font-bold flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-white/20 hover:bg-white/30 border-white/30 text-white'
                : 'bg-black/30 hover:bg-black/40 border-black/30 text-amber-200'
            }`}
            title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-yellow-300" /> : <VolumeX className="w-4 h-4 text-red-300" />}
            <span className="hidden sm:inline">{soundEnabled ? (isTa ? 'ஒலி உண்டு' : 'Sound On') : (isTa ? 'ஒலி அணை' : 'Muted')}</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl border border-white/30 bg-white/20 hover:bg-white/30 text-white transition-all text-xs font-bold flex items-center gap-1.5"
            title={isFullscreen ? 'Exit Fullscreen' : 'Projector Mode'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden sm:inline">{isFullscreen ? (isTa ? 'வெளியேறு' : 'Exit') : (isTa ? 'ப்ரொஜெக்டர் பார்வை' : 'Projector')}</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl border border-white/30 bg-white/20 hover:bg-white/30 text-white transition-all text-xs font-bold"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Scheme & Round Configuration Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        {/* Scheme Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {isTa ? 'சீட்டுத் திட்டம்' : 'Chit Scheme'}
          </label>
          <select
            value={selectedSchemeId}
            onChange={(e) => setSelectedSchemeId(e.target.value)}
            disabled={isSpinning || loadingSchemes}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
          >
            {schemes.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
        </div>

        {/* Round Selector */}
        <div>
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            {isTa ? 'குலுக்கல் தவணை (Round)' : 'Collection Round'}
          </label>
          <select
            value={selectedRoundNumber}
            onChange={(e) => setSelectedRoundNumber(Number(e.target.value))}
            disabled={isSpinning || !schemeDetails}
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none disabled:opacity-50"
          >
            {(schemeDetails?.collectionRounds || []).map((r: any) => (
              <option key={r.id} value={r.roundNumber}>
                {isTa ? `தவணை #${r.roundNumber}` : `Round #${r.roundNumber}`} ({r.status})
                {r.payoutRecipientName ? ` - வென்றவர்: ${r.payoutRecipientName}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Pool / Net Payout Display */}
        <div className="bg-amber-50/80 rounded-xl p-3 border border-amber-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-800 uppercase block">
              {isTa ? 'பட்டுவாடா சீட்டுத் தொகை' : 'Net Prize Pool'}
            </span>
            <span className="text-base font-black text-amber-900">
              {formatINR(payoutCalculation.netPayoutPaise)}
            </span>
          </div>
          <Coins className="w-6 h-6 text-amber-600 opacity-80" />
        </div>

        {/* Eligible Members Count Badge */}
        <div className="bg-emerald-50/80 rounded-xl p-3 border border-emerald-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 uppercase block">
              {isTa ? 'சக்கரத்தில் உள்ளவர்கள்' : 'Eligible in Wheel'}
            </span>
            <span className="text-base font-black text-emerald-900">
              {eligibleMembers.length} / {allMemberships.length}
            </span>
          </div>
          <Users className="w-6 h-6 text-emerald-600 opacity-80" />
        </div>
      </div>

      {/* Main Wheel Area + Candidate Roster Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: The Animated Wheel Center Stage (7 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm flex flex-col items-center justify-center relative min-h-[500px]">
          {/* Spin Wheel Container */}
          <div className="relative flex items-center justify-center my-3">
            <canvas ref={canvasRef} className="block drop-shadow-2xl transition-transform" />
          </div>

          {/* Action Trigger Button */}
          <div className="mt-4 w-full max-w-md flex flex-col items-center gap-3">
            <button
              onClick={startSpin}
              disabled={isSpinning || eligibleMembers.length === 0}
              className={`w-full py-4 px-6 rounded-2xl font-black text-base transition-all transform active:scale-95 flex items-center justify-center gap-3 shadow-xl ${
                isSpinning
                  ? 'bg-slate-400 text-white cursor-not-allowed opacity-90'
                  : eligibleMembers.length === 0
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 hover:from-amber-600 hover:to-red-600 text-white shadow-orange-500/30 hover:shadow-2xl hover:-translate-y-0.5'
              }`}
            >
              {isSpinning ? (
                <>
                  <RotateCw className="w-6 h-6 animate-spin text-white" />
                  <span>{isTa ? 'குலுக்கல் சுழல்கிறது...!' : 'Spinning Wheel...!'}</span>
                </>
              ) : (
                <>
                  <Flame className="w-6 h-6 text-yellow-300 animate-pulse" />
                  <span>
                    {isTa ? 'குலுக்கல் சக்கரத்தை சுழற்றுக! (SPIN)' : 'Spin Lucky Draw Wheel (SPIN)'}
                  </span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 font-medium text-center">
              {isTa
                ? 'குறிப்பு: ஏற்கனவே வென்றவர்கள் தானாகவே நீக்கப்பட்டுள்ளனர். சுழன்றதும் வெற்றியாளருக்கு உடனடி பட்டுவாடா வவுச்சர் உருவாகும்.'
                : 'Note: Members who previously won are automatically excluded. Winning grants prompt voucher creation.'}
            </span>
          </div>
        </div>

        {/* Right: Candidate Roster & Verification List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-[580px]">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
            <div>
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                <Users className="w-4 h-4 text-[#2F7BFF]" />
                {isTa ? 'சக்கர உறுப்பினர் பட்டியல்' : 'Wheel Roster'}
              </h3>
              <span className="text-[11px] text-slate-400">
                {isTa
                  ? `${eligibleMembers.length} பேர் குலுக்கலில் உள்ளனர்`
                  : `${eligibleMembers.length} members eligible`}
              </span>
            </div>
            <span className="px-2 py-0.5 bg-blue-50 text-[#2F7BFF] font-bold text-xs rounded-full">
              {eligibleMembers.length}
            </span>
          </div>

          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isTa ? 'பெயர் / டோக்கன் # தேடுக...' : 'Search name / token #...'}
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Member List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {filteredEligible.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isTa ? 'பொருந்தும் உறுப்பினர்கள் இல்லை' : 'No matching members found'}
              </div>
            ) : (
              filteredEligible.map((m: any, idx: number) => (
                <div
                  key={m.id || idx}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100 transition-colors text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-700 font-black flex items-center justify-center text-xs shrink-0 border border-amber-200">
                      #{m.slotNumber || idx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block leading-tight">
                        {m.member?.fullName}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {m.member?.memberNumber}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-medium">
                    {m.member?.phone}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Already Won Footer Tab */}
          {alreadyWonMembers.length > 0 && (
            <div className="pt-3 border-t border-slate-100 mt-2 text-xs flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-medium">
                {isTa ? 'ஏற்கனவே வென்றவர்கள்:' : 'Already Won:'}
              </span>
              <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full text-[10px]">
                {alreadyWonMembers.length} {isTa ? 'உறுப்பினர்கள்' : 'members'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* GRAND WINNER CELEBRATION MODAL */}
      {showWinnerModal && winner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border-4 border-yellow-400 overflow-hidden relative">
            {/* Modal Header with Golden Festive Gradient */}
            <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-600 p-6 text-center text-white relative">
              <button
                onClick={() => setShowWinnerModal(false)}
                className="absolute right-4 top-4 w-8 h-8 rounded-full bg-black/20 hover:bg-black/30 text-white flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-20 h-20 rounded-full bg-white/20 border-4 border-white/60 mx-auto flex items-center justify-center shadow-inner mb-3">
                <Trophy className="w-10 h-10 text-yellow-200 animate-bounce" />
              </div>

              <span className="px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-black/25 text-yellow-100 inline-block mb-1">
                {isTa ? `தவணை #${winningRound} வெற்றியாளர்!` : `Round #${winningRound} Winner!`}
              </span>
              <h3 className="text-2xl font-black tracking-tight text-white drop-shadow">
                {isTa ? 'வாழ்த்துகள்!' : 'Congratulations!'}
              </h3>
              <p className="text-xs text-amber-100">
                {isTa
                  ? 'ஸ்ரீ பட்டணத்து மாரியம்மன் ஆனங்கூர் சீட்டு குழு'
                  : 'Sri Pattanathu Mariamman Anangur Chit Fund'}
              </p>
            </div>

            {/* Winner Details Card */}
            <div className="p-6 space-y-4">
              {/* Winner Name & ID */}
              <div className="text-center bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  {isTa ? 'தேர்ந்தெடுக்கப்பட்ட உறுப்பினர்' : 'Winning Member'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                  {winner.member?.fullName}
                </h4>
                <div className="flex items-center justify-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-amber-900">
                    ID: {winner.member?.memberNumber}
                  </span>
                  <span className="font-mono bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-amber-900">
                    {isTa ? 'டோக்கன் #' : 'Slot #'}{winner.slotNumber}
                  </span>
                  {winner.member?.phone && (
                    <a
                      href={`tel:${winner.member.phone}`}
                      className="flex items-center gap-1 font-mono bg-white px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-blue-600 hover:bg-blue-50"
                    >
                      <Phone className="w-3 h-3" />
                      {winner.member.phone}
                    </a>
                  )}
                </div>
              </div>

              {/* Payout Breakdown */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTa ? 'மொத்த நிதி' : 'Gross Pool'}
                  </span>
                  <span className="font-bold text-slate-700">
                    {formatINR(payoutCalculation.grossPayoutPaise)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold uppercase">
                    {isTa ? 'கமிஷன்' : 'Commission'}
                  </span>
                  <span className="font-bold text-slate-700">
                    - {formatINR(payoutCalculation.deductionsPaise)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 block font-black uppercase">
                    {isTa ? 'பட்டுவாடா தொகை' : 'Net Payout'}
                  </span>
                  <span className="font-black text-emerald-700 text-sm">
                    {formatINR(payoutCalculation.netPayoutPaise)}
                  </span>
                </div>
              </div>

              {/* Voucher Action Feedback */}
              {voucherPrepared ? (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div className="text-xs">
                    <span className="font-bold text-emerald-900 block">
                      {isTa ? 'பட்டுவாடா வவுச்சர் பதிவு செய்யப்பட்டது!' : 'Payout Voucher Prepared!'}
                    </span>
                    <span className="text-emerald-700">
                      {isTa
                        ? 'அங்கீகாரத்திற்காக பட்டுவாடா பதிவேட்டுக்கு அனுப்பப்பட்டுள்ளது (Pending Approval).'
                        : 'Sent to Payouts ledger awaiting disbursement.'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {isTa
                    ? 'நிர்வாகி நடவடிக்கை: இந்த வெற்றியாளருக்கு உடனடியாக பட்டுவாடா வவுச்சரை உருவாக்கி கணக்கில் பதிவு செய்யவும்.'
                    : 'Admin Action: Immediately prepare disbursement voucher to record this award in the ledger.'}
                </div>
              )}

              {/* Action Buttons: Prepare Voucher + WhatsApp Share */}
              <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                {!voucherPrepared && (user.role === 'ADMIN' || user.role === 'STAFF') && (
                  <button
                    onClick={handlePrepareVoucher}
                    disabled={isPreparingVoucher}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isPreparingVoucher ? (
                      <RotateCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileCheck2 className="w-4 h-4" />
                    )}
                    <span>
                      {isTa ? 'பட்டுவாடா வவுச்சர் பதிவு செய்க' : 'Prepare Payout Voucher'}
                    </span>
                  </button>
                )}

                <button
                  onClick={handleShareWinner}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  <span>
                    {isTa ? 'வாட்ஸ்அப் பகிர்வு' : 'Share on WhatsApp'}
                  </span>
                </button>
              </div>

              {voucherPrepared && onNavigateToPayouts && (
                <button
                  onClick={() => {
                    setShowWinnerModal(false);
                    onNavigateToPayouts();
                  }}
                  className="w-full py-2.5 text-xs font-bold text-[#2F7BFF] hover:bg-blue-50 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-4 h-4" />
                  <span>{isTa ? 'பட்டுவாடா பதிவேட்டில் பார்க்க' : 'View in Payouts Ledger'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
