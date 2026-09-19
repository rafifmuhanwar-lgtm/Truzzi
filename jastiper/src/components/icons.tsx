// Kumpulan ikon — mayoritas dari lucide-react; GoogleIcon custom (G multicolor).
// Nama ikon disesuaikan meniru Material Icons yang dipakai Flutter asli.

export {
  ArrowLeft,
  ArrowRight,
  ChevronLeft,
  Check,
  ChevronRight,
  ChevronDown,
  MapPin,
  LocateFixed as MyLocation,
  Search,
  Store,
  ShoppingBag,
  ShoppingBasket,
  ReceiptText,
  Bike,
  MessageCircle,
  User,
  Settings,
  History,
  Heart,
  TicketPercent as Ticket,
  HelpCircle,
  Phone,
  X,
  Plus,
  PlusCircle,
  Minus,
  Briefcase,
  Camera,
  Image as ImageIcon,
  Video,
  Send,
  Copy,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Mail,
  Eye,
  EyeOff,
  Star,
  Trash2,
  Edit,
  LogOut,
  Bell,
  Info,
  Wallet,
  CreditCard,
  QrCode,
  ShieldCheck,
  TrendingUp,
  Clock,
  Ruler,
  Navigation,
  Home,
  CircleDot,
  UserPlus,
  Users,
  Link,
  BookOpen,
  Sparkles,
  Pill,
  Coffee,
  KeyRound,
  Gift,
  Flag,
  Inbox,
  Crosshair as Target,
  Pencil as Edit3,
  Map as MapIcon,
  StickyNote as Description,
  UtensilsCrossed as Fastfood,
  Network as Storefront,
  Zap,
  Globe,
  CheckCheck,
  AlertTriangle,
  Upload,
  TrendingDown,
  Percent,
  Truck,
  Monitor,
  Wrench,
  Flame,
  Calendar,
  Power,
  Filter,
  ExternalLink,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import bagService from '../assets/images/bag_service.png';
import jastiperService from '../assets/images/jastiper_service.png';

/** Ilustrasi layanan — gambar asset asli Truzzi. */
export function BagService({ className }: { className?: string }) {
  return <img src={bagService} alt="" className={className} />;
}
export function JastiperService({ className }: { className?: string }) {
  return <img src={jastiperService} alt="" className={className} />;
}

/** Ikon "G" Google resmi (mirip Icons.g_mobiledata / logo). */
export function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
      />
      <path
        fill="#FF3D00"
        d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
      />
    </svg>
  );
}

export type { LucideIcon };
