import { forwardRef, useId } from "react";
import * as L from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";
import { cx } from "@/frontend/format";

/**
 * Icon set drawn in Ollie's hand-inked style: chunky round strokes with the same rough edge as the mascot
 * (the shared `#ink-rough` filter from InkDefs). Line icons are lucide shapes run through that ink;
 * droplets are mini Ollies. Import icons from here, not from lucide-react.
 */
export type IconProps = LucideProps;
export type Icon = LucideIcon;

function ink(Base: LucideIcon, name: string): LucideIcon {
  const Inked = forwardRef<SVGSVGElement, LucideProps>(function Inked({ className, strokeWidth = 2.4, ...rest }, ref) {
    return <Base ref={ref} strokeWidth={strokeWidth} className={cx("ink", className)} {...rest} />;
  });
  Inked.displayName = name;
  return Inked as LucideIcon;
}

const DROP = "M12 1.6C10.4 4.6 6.4 8.8 5 12.3 3.4 16.6 6.4 21.6 12 21.6S20.6 16.6 19 12.3C17.6 8.8 13.6 4.6 12 1.6Z";

/** A mini Ollie: filled drop, eyes cut out so it reads on any background. */
const OllieDrop = forwardRef<SVGSVGElement, LucideProps>(function OllieDrop({ className, size = 24, color = "currentColor", strokeWidth: _sw, absoluteStrokeWidth: _a, ...rest }, ref) {
  void _sw;
  void _a;
  const id = useId().replace(/:/g, "");
  return (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} className={cx("ink", className)} {...rest}>
      <mask id={`d-${id}`}>
        <path d={DROP} fill="#fff" />
        <circle cx="9.6" cy="13.6" r="1.55" fill="#000" />
        <circle cx="14.4" cy="14.5" r="1.55" fill="#000" />
      </mask>
      <path d={DROP} fill={color} mask={`url(#d-${id})`} />
    </svg>
  );
}) as LucideIcon;
OllieDrop.displayName = "Droplet";

const OllieDrops = forwardRef<SVGSVGElement, LucideProps>(function OllieDrops({ className, size = 24, color = "currentColor", strokeWidth: _sw, absoluteStrokeWidth: _a, ...rest }, ref) {
  void _sw;
  void _a;
  const id = useId().replace(/:/g, "");
  return (
    <svg ref={ref} viewBox="0 0 24 24" width={size} height={size} className={cx("ink", className)} {...rest}>
      <mask id={`ds-${id}`}>
        <path d={DROP} fill="#fff" />
        <circle cx="9.6" cy="13.6" r="1.6" fill="#000" />
        <circle cx="14.4" cy="14.5" r="1.6" fill="#000" />
      </mask>
      <path d="M5 2.2C4.3 3.6 2.6 5.4 2.2 6.8 1.7 8.6 2.9 10 4.6 10S7.6 8.6 7.1 6.8C6.7 5.4 5.7 3.6 5 2.2Z" fill={color} opacity="0.55" />
      <g transform="translate(3.4 2.6) scale(0.86)">
        <path d={DROP} fill={color} mask={`url(#ds-${id})`} />
      </g>
    </svg>
  );
}) as LucideIcon;
OllieDrops.displayName = "Droplets";

export const Droplet = OllieDrop;
export const Droplets = OllieDrops;

export const ArrowLeft = ink(L.ArrowLeft, "ArrowLeft");
export const ArrowRight = ink(L.ArrowRight, "ArrowRight");
export const ArrowUpRight = ink(L.ArrowUpRight, "ArrowUpRight");
export const Ban = ink(L.Ban, "Ban");
export const BellRing = ink(L.BellRing, "BellRing");
export const Calculator = ink(L.Calculator, "Calculator");
export const Camera = ink(L.Camera, "Camera");
export const Check = ink(L.Check, "Check");
export const ChevronDown = ink(L.ChevronDown, "ChevronDown");
export const ChevronRight = ink(L.ChevronRight, "ChevronRight");
export const CircleCheck = ink(L.CircleCheck, "CircleCheck");
export const CircleHelp = ink(L.CircleHelp, "CircleHelp");
export const ClipboardCheck = ink(L.ClipboardCheck, "ClipboardCheck");
export const ClipboardList = ink(L.ClipboardList, "ClipboardList");
export const Clock = ink(L.Clock, "Clock");
export const Clock3 = ink(L.Clock3, "Clock3");
export const Cloud = ink(L.Cloud, "Cloud");
export const CloudOff = ink(L.CloudOff, "CloudOff");
export const Compass = ink(L.Compass, "Compass");
export const Database = ink(L.Database, "Database");
export const Eye = ink(L.Eye, "Eye");
export const EyeOff = ink(L.EyeOff, "EyeOff");
export const FileText = ink(L.FileText, "FileText");
export const FlaskConical = ink(L.FlaskConical, "FlaskConical");
export const GitBranch = ink(L.GitBranch, "GitBranch");
export const HeartPulse = ink(L.HeartPulse, "HeartPulse");
export const History = ink(L.History, "History");
export const Info = ink(L.Info, "Info");
export const LayoutDashboard = ink(L.LayoutDashboard, "LayoutDashboard");
export const Loader2 = ink(L.Loader2, "Loader2");
export const Lock = ink(L.Lock, "Lock");
export const LogIn = ink(L.LogIn, "LogIn");
export const LogOut = ink(L.LogOut, "LogOut");
export const Mail = ink(L.Mail, "Mail");
export const Menu = ink(L.Menu, "Menu");
export const Moon = ink(L.Moon, "Moon");
export const MoreHorizontal = ink(L.MoreHorizontal, "MoreHorizontal");
export const OctagonAlert = ink(L.OctagonAlert, "OctagonAlert");
export const PanelLeftClose = ink(L.PanelLeftClose, "PanelLeftClose");
export const PanelLeftOpen = ink(L.PanelLeftOpen, "PanelLeftOpen");
export const Plus = ink(L.Plus, "Plus");
export const RefreshCw = ink(L.RefreshCw, "RefreshCw");
export const Repeat = ink(L.Repeat, "Repeat");
export const RotateCw = ink(L.RotateCw, "RotateCw");
export const Save = ink(L.Save, "Save");
export const Scale = ink(L.Scale, "Scale");
export const ScanLine = ink(L.ScanLine, "ScanLine");
export const Search = ink(L.Search, "Search");
export const Settings = ink(L.Settings, "Settings");
export const ShieldAlert = ink(L.ShieldAlert, "ShieldAlert");
export const ShieldCheck = ink(L.ShieldCheck, "ShieldCheck");
export const Store = ink(L.Store, "Store");
export const Sun = ink(L.Sun, "Sun");
export const Thermometer = ink(L.Thermometer, "Thermometer");
export const Timer = ink(L.Timer, "Timer");
export const Trash2 = ink(L.Trash2, "Trash2");
export const TriangleAlert = ink(L.TriangleAlert, "TriangleAlert");
export const Upload = ink(L.Upload, "Upload");
export const User = ink(L.User, "User");
export const Users = ink(L.Users, "Users");
export const Utensils = ink(L.Utensils, "Utensils");
export const Wallet = ink(L.Wallet, "Wallet");
export const WifiOff = ink(L.WifiOff, "WifiOff");
export const X = ink(L.X, "X");

/** The shared ink filter. Rendered once in the root layout. */
export function InkDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
      <filter id="ink-rough" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
      <filter id="ink-rough-lg" x="-5%" y="-30%" width="110%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07 0.12" numOctaves="1" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="3" />
      </filter>
    </svg>
  );
}
