// icon set used across the app (plain lucide)
import * as L from "lucide-react";
import type { LucideIcon, LucideProps } from "lucide-react";

export type IconProps = LucideProps;
export type Icon = LucideIcon;

function ink(Base: LucideIcon, name: string): LucideIcon {
  void name;
  return Base;
}

export const Droplet = L.Droplet;
export const Droplets = L.Droplets;

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

export function InkDefs() {
  return (
    <svg aria-hidden="true" width="0" height="0" className="pointer-events-none absolute">
      {/* firefox draws the same noise much weaker, so it gets its own tuned filters (the -ff ones) */}
      <style>
        {".ink{filter:url(#ink-rough)}.ink-bar{filter:url(#ink-rough-lg)}" +
          "@supports (-moz-appearance:none){.ink{filter:url(#ink-rough-ff)}.ink-bar{filter:url(#ink-rough-lg-ff)}.ollie-rough{filter:url(#ollie-rough-ff)}}"}
      </style>
      <filter id="ink-rough" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.22" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="1.6" />
      </filter>
      <filter id="ink-rough-lg" x="-5%" y="-30%" width="110%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.07 0.12" numOctaves="1" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="3" />
      </filter>
      <filter id="ink-rough-ff" x="-15%" y="-15%" width="130%" height="130%">
        <feTurbulence type="fractalNoise" baseFrequency="0.11" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="6" />
      </filter>
      <filter id="ink-rough-lg-ff" x="-5%" y="-30%" width="110%" height="160%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035 0.06" numOctaves="1" seed="7" />
        <feDisplacementMap in="SourceGraphic" scale="12" />
      </filter>
      <filter id="ollie-rough-ff" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.45" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="6" />
      </filter>
    </svg>
  );
}
