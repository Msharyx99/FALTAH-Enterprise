import { equipment, videos, documents, categories, settings } from "../data";
import { addEquipment, deleteEquipment, getEquipment, updateEquipment, getCategories, addCategory, updateCategory, deleteCategory, getCmsItems, getCmsDocument, setCmsDocument, addCmsItem, updateCmsItem, deleteCmsItem } from "../firebase/firestoreService";
import { useState, useEffect, useRef, useCallback } from "react";
import {
  Search, Play, BookOpen, Cpu, Zap, Settings, MessageSquare,
  TreePine, Award, Clock, Bell, Send, Flame, Droplets, Wind,
  Gauge, Filter, Activity, CheckCircle, ChevronRight, ChevronDown,
  Video, FileText, Database, Home, Layers, Globe, Shield, X,
  Lock, BarChart3, Plus, Thermometer, ChevronLeft, Menu,
  LogIn, LogOut, Upload, FolderOpen, Wrench, AlertTriangle,
  BookMarked, Boxes, FileSearch, Star, TrendingUp, Eye,
  MoreHorizontal, Book, Cog, Users, Brain, Image, GripVertical, RefreshCw, MapPin
} from "lucide-react";

// ─── Types ─────────────────────────────────────────────────────────────────
type NavId = "home" | "tree" | "library" | "inspire" | "ai" | "more";
type TreeView = { level: "root" } | { level: "domain"; domainId: string } | { level: "sub"; domainId: string; subId: string } | { level: "item"; domainId: string; subId: string; itemId: string };
type AdminPage =
  | "dashboard" | "equipment" | "equipment-add"
  | "tree" | "tree-add-category" | "tree-add-item"
  | "categories" | "categories-add"
  | "videos" | "videos-upload"
  | "inspire" | "inspire-upload"
  | "documents" | "documents-upload"
  | "homepage" | "homepage-hero" | "homepage-stats" | "homepage-featured" | "homepage-recent" | "homepage-videos" | "hero-hotspots" | "hero-hotspot-add"
  | "ai" | "ai-upload" | "ai-responses"
  | "users" | "users-add" | "notifications" | "notifications-add" | "about" | "analytics" | "settings";
type ResourceType = "all" | "video" | "document" | "standard" | "drawing" | "3d" | "lesson" | "failure" | "inspire";

// ─── Engineering Data ───────────────────────────────────────────────────────
const DOMAINS = [
  {
    id: "rotating", label: "Rotating Equipment", color: "#3B82F6", icon: Cpu, phase: 1,
    subs: [
      {
        id: "pumps", label: "Pumps", icon: Droplets,
        items: [
          { id: "centrifugal", label: "Centrifugal Pumps" },
          { id: "reciprocating", label: "Reciprocating Pumps" },
          { id: "gear", label: "Gear Pumps" },
          { id: "screw", label: "Screw Pumps" },
        ]
      },
      {
        id: "compressors", label: "Compressors", icon: Wind,
        items: [
          { id: "centrifugal-comp", label: "Centrifugal Compressors" },
          { id: "reciprocating-comp", label: "Reciprocating Compressors" },
          { id: "screw-comp", label: "Screw Compressors" },
        ]
      },
      {
        id: "fans", label: "Fans", icon: Wind,
        items: [
          { id: "centrifugal-fan", label: "Centrifugal Fans" },
          { id: "axial-fan", label: "Axial Fans" },
          { id: "forced-draft", label: "Forced Draft Fans" },
        ]
      },
      {
        id: "blowers", label: "Blowers", icon: Wind,
        items: [
          { id: "roots-blower", label: "Roots Blowers" },
          { id: "screw-blower", label: "Screw Blowers" },
          { id: "centrifugal-blower", label: "Centrifugal Blowers" },
        ]
      },
    ]
  },
  {
    id: "static", label: "Static Equipment", color: "#10B981", icon: Database, phase: 1,
    subs: [
      {
        id: "vessels", label: "Pressure Vessels", icon: Shield,
        items: [
          { id: "separator", label: "Separators" },
          { id: "drum", label: "Drums" },
          { id: "scrubber", label: "Scrubbers" },
        ]
      },
      {
        id: "heatex", label: "Heat Exchangers", icon: Thermometer,
        items: [
          { id: "shell-tube", label: "Shell & Tube Heat Exchanger" },
        ]
      },
      {
        id: "tanks", label: "Storage Tanks", icon: Database,
        items: [
          { id: "atm-tank", label: "Atmospheric Tanks" },
          { id: "floating-roof", label: "Floating Roof Tanks" },
        ]
      },
    ]
  },
  {
    id: "valves", label: "Valves", color: "#D4AF37", icon: Gauge, phase: 1,
    subs: [
      {
        id: "isolation", label: "Isolation Valves", icon: Shield,
        items: [
          { id: "gate", label: "Gate Valves" },
          { id: "ball", label: "Ball Valves" },
          { id: "butterfly", label: "Butterfly Valves" },
        ]
      },
      {
        id: "control-valves", label: "Control Valves", icon: Activity,
        items: [
          { id: "globe-cv", label: "Globe Control Valves" },
          { id: "rotary-cv", label: "Rotary Control Valves" },
        ]
      },
      {
        id: "safety-valves", label: "Safety Valves", icon: AlertTriangle,
        items: [
          { id: "psv", label: "Pressure Safety Valves" },
          { id: "prv", label: "Pressure Relief Valves" },
          { id: "rupture", label: "Rupture Discs" },
        ]
      },
    ]
  },
  // Phase 2 — hidden/locked
  { id: "instrumentation", label: "Instrumentation & Control", color: "#8B5CF6", icon: Activity, phase: 2, subs: [] },
  { id: "electrical", label: "Electrical Systems", color: "#F59E0B", icon: Zap, phase: 2, subs: [] },
  { id: "piping", label: "Piping Systems", color: "#06B6D4", icon: Globe, phase: 2, subs: [] },
  { id: "utilities", label: "Utility Systems", color: "#EF4444", icon: Flame, phase: 2, subs: [] },
];

const ITEM_TABS = ["Videos"];

// Resource library content
const RESOURCES = [
  { id: 1, type: "video" as ResourceType, title: "Centrifugal Pump — Principles of Operation", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Beginner", duration: "18:24", thumb: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=225&fit=crop&auto=format", featured: true, new: true },
  { id: 2, type: "video" as ResourceType, title: "Pump Cavitation — Causes, Effects & Prevention", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Intermediate", duration: "22:10", thumb: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=225&fit=crop&auto=format", featured: false, new: false },
  { id: 3, type: "video" as ResourceType, title: "Compressor Surge — Detection & Control", equipment: "Compressors", category: "Rotating Equipment", difficulty: "Advanced", duration: "28:45", thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop&auto=format", featured: true, new: false },
  { id: 4, type: "video" as ResourceType, title: "PSV Sizing — API 520 Explained", equipment: "Safety Valves", category: "Valves", difficulty: "Intermediate", duration: "23:15", thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop&auto=format", featured: false, new: true },
  { id: 5, type: "video" as ResourceType, title: "Shell & Tube HEX — Fouling & Cleaning", equipment: "Heat Exchangers", category: "Static Equipment", difficulty: "Intermediate", duration: "24:33", thumb: "https://images.unsplash.com/photo-1565514158740-064f34bd6cfd?w=400&h=225&fit=crop&auto=format", featured: false, new: false },
  { id: 6, type: "video" as ResourceType, title: "Control Valve Diagnostics — Field Testing", equipment: "Control Valves", category: "Valves", difficulty: "Advanced", duration: "22:45", thumb: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=400&h=225&fit=crop&auto=format", featured: true, new: false },
  { id: 7, type: "3d" as ResourceType, title: "Centrifugal Pump — 3D Internal Animation", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Beginner", duration: "8:00", thumb: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=225&fit=crop&auto=format", featured: true, new: true },
  { id: 8, type: "document" as ResourceType, title: "API 610 — Centrifugal Pumps for Petroleum Industry", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Expert", duration: "124 pages", thumb: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=400&h=225&fit=crop&auto=format", featured: false, new: false },
  { id: 9, type: "standard" as ResourceType, title: "API 520 — Pressure Relieving Systems", equipment: "Safety Valves", category: "Valves", difficulty: "Advanced", duration: "86 pages", thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&h=225&fit=crop&auto=format", featured: false, new: true },
  { id: 10, type: "failure" as ResourceType, title: "Case Study — Pump Seal Failure in Crude Service", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Intermediate", duration: "12 min read", thumb: "https://images.unsplash.com/photo-1565514158740-064f34bd6cfd?w=400&h=225&fit=crop&auto=format", featured: false, new: false },
  { id: 11, type: "lesson" as ResourceType, title: "Lessons Learned — Compressor Anti-Surge Bypass", equipment: "Compressors", category: "Rotating Equipment", difficulty: "Advanced", duration: "8 min read", thumb: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=225&fit=crop&auto=format", featured: false, new: true },
  { id: 12, type: "drawing" as ResourceType, title: "P&ID — Centrifugal Pump Package", equipment: "Pumps", category: "Rotating Equipment", difficulty: "Intermediate", duration: "Drawing", thumb: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=400&h=225&fit=crop&auto=format", featured: false, new: false },
];

const FEATURED_EQUIPMENT = [
  { label: "Centrifugal Pump", cat: "Rotating Equipment", color: "#3B82F6", icon: Droplets },
  { label: "Control Valve", cat: "Valves", color: "#D4AF37", icon: Gauge },
  { label: "Shell & Tube HEX", cat: "Static Equipment", color: "#10B981", icon: Thermometer },
  { label: "Centrifugal Compressor", cat: "Rotating Equipment", color: "#8B5CF6", icon: Wind },
];

const DEFAULT_HERO_HOTSPOTS = [
  { label:"Storage Tank", x:12, y:62, target:"tree", color:"#D4AF37", live:true, order:1 },
  { label:"Separator", x:28, y:28, target:"tree", color:"#D4AF37", live:true, order:2 },
  { label:"Pump", x:43, y:74, target:"library", color:"#D4AF37", live:true, order:3 },
  { label:"Compressor", x:62, y:42, target:"library", color:"#D4AF37", live:true, order:4 },
  { label:"Heat Exchanger", x:74, y:69, target:"tree", color:"#D4AF37", live:true, order:5 },
  { label:"Control Valve", x:88, y:77, target:"tree", color:"#D4AF37", live:true, order:6 },
  { label:"Flare Stack", x:91, y:25, target:"tree", color:"#D4AF37", live:true, order:7 },
];

const SEARCH_SUGGESTIONS = ["Pump", "Compressor", "Valve", "Pressure Vessel", "Separator", "Heat Exchanger", "Turbine", "PSV", "Control Valve", "Mechanical Seal"];

const AI_PROMPTS = [
  "Explain centrifugal pumps",
  "Compare PSV vs PRV",
  "Find videos about Mechanical Seals",
  "Show OEM manuals for Control Valves",
  "What causes compressor surge?",
  "Heat exchanger fouling mechanisms",
];

const RESOURCE_TYPE_CONFIG: Record<ResourceType, { label: string; icon: any; color: string }> = {
  all: { label: "All", icon: Layers, color: "#64748B" },
  video: { label: "Videos", icon: Video, color: "#3B82F6" },
  inspire: { label: "Inspire", icon: Flame, color: "#F59E0B" },
  "3d": { label: "3D Models", icon: Boxes, color: "#8B5CF6" },
  document: { label: "Documents", icon: FileText, color: "#10B981" },
  standard: { label: "Standards", icon: BookMarked, color: "#F59E0B" },
  drawing: { label: "Drawings", icon: FileSearch, color: "#06B6D4" },
  lesson: { label: "Lessons Learned", icon: BookOpen, color: "#D4AF37" },
  failure: { label: "Failure Cases", icon: AlertTriangle, color: "#EF4444" },
};


function slugify(value: any) {
  return String(value || "item").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function isLegacyPlaceholderThumb(value: any) {
  const src = String(value || "").toLowerCase();
  return !src || src.includes("images.unsplash.com") || src.includes("default-video") || src.includes("placeholder");
}

function normalizeResourceItem(item: any, fallbackType: ResourceType = "video") {
  const rawType = String(item.type || item.resourceType || fallbackType || "video").toLowerCase();
  const type = (rawType === "pdf" || rawType === "manual") ? "document" : (rawType === "youtube" ? "video" : (["motivational","motivation","short","inspire"].includes(rawType) ? "inspire" : rawType)) as ResourceType;
  const title = item.title || item.name || "Untitled Resource";
  const equipmentName = item.equipment || item.equip || item.category || "General";
  const url = item.url || item.link || item.videoUrl || item.videoLink || item.documentUrl || item.documentLink || item.fileUrl || item.storagePath || "";
  const storedThumb = item.thumbnailUrl || item.thumbnailLink || item.generatedThumbnailUrl || item.autoThumbnailUrl || item.thumbnail || item.thumb || item.imageUrl || item.image || "";
  const thumb = isLegacyPlaceholderThumb(storedThumb)
    ? (type === "document" ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=225&fit=crop&auto=format" : "")
    : storedThumb;
  return {
    id: item.id || slugify(title),
    type,
    title,
    equipment: equipmentName,
    category: item.category || item.domain || equipmentName || "General",
    difficulty: item.difficulty || item.level || item.typeLabel || "Beginner",
    duration: item.duration || item.dur || item.size || item.pages || "Open",
    thumb,
    url,
    equipmentId: item.equipmentId || item.equipmentDocId || "",
    featured: item.featured === true,
    popular: item.popular === true,
    views: Number(item.views || item.viewCount || item.watchCount || 0),
    likes: Number(item.likes || item.likeCount || 0),
    createdAt: item.createdAt || item.publishedAt || item.uploadedAt || item.updatedAt || "",
    new: item.new !== false && item.recent !== false && item.recentlyAdded !== false,
    live: item.live !== false && item.status !== "Inactive",
    description: item.description || "",
  };
}

function buildResourceData(firebaseVideos: any[] = [], firebaseDocuments: any[] = []) {
  const dynamic = [
    ...firebaseVideos.filter(v => v.live !== false).map(v => normalizeResourceItem(v, "video")),
    ...firebaseDocuments.filter(d => d.live !== false).map(d => normalizeResourceItem(d, "document")),
  ];
  return dynamic.length > 0 ? dynamic : RESOURCES;
}

function iconForTreeItem(value: any, fallback: any = Layers) {
  const key = String(value || "").toLowerCase();
  if (key.includes("pump") || key.includes("droplet")) return Droplets;
  if (key.includes("compress") || key.includes("fan") || key.includes("blower") || key.includes("wind")) return Wind;
  if (key.includes("valve") || key.includes("gauge")) return Gauge;
  if (key.includes("static") || key.includes("tank") || key.includes("vessel") || key.includes("database")) return Database;
  if (key.includes("heat") || key.includes("therm")) return Thermometer;
  if (key.includes("safety") || key.includes("shield")) return Shield;
  return fallback;
}

function buildTreeDomains(firebaseCategories: any[] = [], firebaseEquipment: any[] = []) {
  const normalizedCategories = (firebaseCategories || []).map((c:any,index:number) => {
    const status = String(c.status || "").toLowerCase();
    const live = c.live !== false && !["inactive","coming-soon","soon"].includes(status);
    return {
      ...c,
      id:c.id || slugify(c.name || c.label || `category-${index}`),
      label:c.label || c.name || "Untitled Category",
      color:c.color || ["#3B82F6","#10B981","#D4AF37","#8B5CF6"][index%4],
      order:Number(c.order ?? index+1),
      level:c.level || c.type || "domain",
      parentId:c.parentId || c.parent || "",
      live,
    };
  }).sort((a:any,b:any)=>a.order-b.order);

  if (!normalizedCategories.length) return DOMAINS;

  const activeCategories = normalizedCategories.filter((c:any)=>c.live);
  const inactiveCategories = normalizedCategories.filter((c:any)=>!c.live);
  const activeEquipment = (firebaseEquipment || []).filter((eq:any)=>eq.live !== false && String(eq.status || "").toLowerCase() !== "inactive");
  const inactiveEquipment = (firebaseEquipment || []).filter((eq:any)=>eq.live === false || String(eq.status || "").toLowerCase() === "inactive");
  const equipmentToTreeItem = (eq:any, fallbackColor:string) => ({
    id:eq.id || slugify(eq.name || eq.label),
    label:eq.name || eq.label || "Untitled Equipment",
    name:eq.name || eq.label || "Untitled Equipment",
    tag:eq.tag || "",
    icon:eq.icon || eq.iconPath || "",
    description:eq.description || eq.overview || "",
    color:eq.color || fallbackColor,
  });

  const domains = activeCategories.filter((c:any)=>!c.parentId && (String(c.level || "domain") === "domain" || !c.level));
  const activeDomains = domains.map((domain:any,domainIndex:number)=>{
    const domainId = String(domain.id);
    const domainLabel = String(domain.label || "").trim().toLowerCase();

    const directItems = activeEquipment.filter((eq:any)=>{
      const eqDomainId = String(eq.domainId || "");
      const parentId = String(eq.parentCategoryId || eq.subcategoryId || "");
      const legacyCategory = String(eq.category || eq.cat || "").trim().toLowerCase();
      return (eqDomainId === domainId && !parentId) || (!eqDomainId && !parentId && legacyCategory === domainLabel);
    }).map((eq:any)=>equipmentToTreeItem(eq, domain.color));

    const subs = activeCategories
      .filter((c:any)=>String(c.parentId)===domainId && ["category","sub"].includes(String(c.level || "category")))
      .map((sub:any)=>{
        const childItems = activeCategories
          .filter((c:any)=>String(c.parentId)===String(sub.id) && ["item","equipment"].includes(String(c.level)))
          .map((item:any)=>({ id:item.id, label:item.label, name:item.label, description:item.description || item.overview || "", color:item.color || sub.color || domain.color, icon:item.icon || "", tag:item.tag || "" }));
        const subLabel = String(sub.label || "").trim().toLowerCase();
        const linkedEquipment = activeEquipment.filter((eq:any)=>{
          const eqDomainId = String(eq.domainId || "");
          const parentId = String(eq.parentCategoryId || eq.subcategoryId || "");
          const legacyCategory = String(eq.category || eq.cat || "").trim().toLowerCase();
          return parentId === String(sub.id) || (!eqDomainId && !parentId && legacyCategory === subLabel);
        }).map((eq:any)=>equipmentToTreeItem(eq, sub.color || domain.color));
        return { id:sub.id, label:sub.label, icon:iconForTreeItem(sub.icon || sub.label, Layers), items:[...childItems,...linkedEquipment] };
      });

    return {
      id:domain.id,
      label:domain.label,
      color:domain.color,
      icon:iconForTreeItem(domain.icon || domain.label, Layers),
      phase:1,
      order:domain.order || domainIndex+1,
      directItems,
      subs,
    };
  });

  const comingSoon = [
    ...inactiveCategories.filter((c:any)=>!c.parentId).map((c:any,index:number)=>({ id:`soon-cat-${c.id}`, label:c.label, color:c.color || "#64748B", icon:Lock, phase:2, order:Number(c.order || 9000)+index, subs:[], directItems:[] })),
    ...inactiveEquipment.map((eq:any,index:number)=>({ id:`soon-eq-${eq.id || slugify(eq.name || eq.label)}`, label:eq.name || eq.label || "Coming Soon Equipment", color:eq.color || "#64748B", icon:Lock, phase:2, order:9500+index, subs:[], directItems:[] })),
  ];
  return [...activeDomains,...comingSoon].sort((a:any,b:any)=>Number(a.order||9999)-Number(b.order||9999));
}

function getHomepageConfig(settingsItems: any[] = []) {
  const first = Array.isArray(settingsItems) && settingsItems.length ? settingsItems[0] : {};
  return {
    title: first.title || "Welcome to FALTAH",
    subtitle: first.subtitle || "Enterprise",
    badge: first.badge || "Digital Knowledge Platform",
    recentCount: Number(first.recentCount || 4),
    popularCount: Number(first.popularCount || 4),
    autoUpdatePopular: first.autoUpdatePopular !== false,
    popularMinViews: Number(first.popularMinViews || 0),
    popularLikeWeight: Number(first.popularLikeWeight || 5),
    popularFeaturedBoost: Number(first.popularFeaturedBoost || 250),
    popularRecentDays: Number(first.popularRecentDays || 30),
    popularRecentBoost: Number(first.popularRecentBoost || 100),
  };
}

function timestampToMillis(value:any) {
  if (!value) return 0;
  if (typeof value?.toMillis === "function") return value.toMillis();
  if (typeof value?.seconds === "number") return value.seconds * 1000;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function popularityScore(resource:any, homepage:any) {
  const views = Number(resource.views || 0);
  const likes = Number(resource.likes || 0);
  const featuredBoost = (resource.featured || resource.popular) ? Number(homepage.popularFeaturedBoost || 0) : 0;
  const created = timestampToMillis(resource.createdAt);
  const recentWindow = Math.max(0, Number(homepage.popularRecentDays || 0)) * 86400000;
  const recentBoost = created && recentWindow > 0 && Date.now() - created <= recentWindow ? Number(homepage.popularRecentBoost || 0) : 0;
  return views + (likes * Number(homepage.popularLikeWeight || 0)) + featuredBoost + recentBoost;
}

function getPopularTechnicalVideos(resources:any[], homepage:any) {
  const videos = resources.filter((r:any)=>r.type === "video" && r.live !== false);
  if (!homepage.autoUpdatePopular) {
    const manual = videos.filter((r:any)=>r.popular || r.featured);
    return manual.sort((a:any,b:any)=>popularityScore(b,homepage)-popularityScore(a,homepage));
  }
  const eligible = videos.filter((r:any)=>Number(r.views || 0) >= Number(homepage.popularMinViews || 0) || r.popular || r.featured);
  return (eligible.length ? eligible : videos).sort((a:any,b:any)=>popularityScore(b,homepage)-popularityScore(a,homepage));
}

function getResourceUrl(r: any) {
  return r?.url || r?.link || r?.videoUrl || r?.videoLink || r?.documentUrl || r?.documentLink || r?.fileUrl || r?.storagePath || "";
}

function getYouTubeEmbedUrl(url: string) {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    let id = "";
    if (parsed.hostname.includes("youtu.be")) {
      id = parsed.pathname.replace("/", "");
    } else if (parsed.hostname.includes("youtube.com")) {
      id = parsed.searchParams.get("v") || "";
      if (!id && parsed.pathname.includes("/embed/")) id = parsed.pathname.split("/embed/")[1] || "";
      if (!id && parsed.pathname.includes("/shorts/")) id = parsed.pathname.split("/shorts/")[1] || "";
    }
    id = id.split("?")[0].split("&")[0];
    return id ? `https://www.youtube.com/embed/${id}` : "";
  } catch {
    return "";
  }
}

function isProbablyPdf(url: string) {
  return /\.pdf(\?|#|$)/i.test(url);
}

function openExternalResource(r: any) {
  const url = getResourceUrl(r);
  if (!url) return;
  window.dispatchEvent(new CustomEvent("faltah:open-resource", { detail: { ...r, url } }));
}

function ResourceViewer({ resource, onClose }: { resource: any; onClose: () => void }) {
  if (!resource) return null;
  const url = getResourceUrl(resource);
  const embedUrl = getYouTubeEmbedUrl(url);
  const isVideo = (resource.type || "").toLowerCase() === "video" || !!embedUrl;
  const isPdf = isProbablyPdf(url) || (resource.type || "").toLowerCase() === "document";

  return (
    <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
      <div className="w-full h-[92dvh] sm:max-w-[430px] sm:h-[88dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: navy, border: `1px solid ${cardBorder}`, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-center gap-2 min-w-0">
            {isVideo ? <Video size={17} style={{ color: gold }}/> : <FileText size={17} style={{ color: gold }}/>}
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#E2E8F0" }}>{resource.title || resource.name || "Learning Resource"}</p>
              <p className="text-xs truncate" style={{ color: "#3D5270" }}>{resource.category || resource.equipment || "FALTAH Resource"}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}` }}>
            <X size={16} style={{ color: "#94A3B8" }}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <div className="rounded-2xl overflow-hidden mb-4" style={{ background: "#050A12", border: `1px solid ${cardBorder}` }}>
              {embedUrl ? (
                <iframe
                  title={resource.title || "FALTAH video"}
                  src={embedUrl}
                  className="w-full aspect-video block"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : isVideo && /\.(mp4|mov|webm)(\?|#|$)/i.test(url) ? (
                <video src={url} controls className="w-full aspect-video block" />
              ) : isPdf ? (
                <iframe title={resource.title || "FALTAH document"} src={url} className="w-full h-[60dvh] block" />
              ) : (
                <div className="p-6 text-center">
                  <FileText size={32} className="mx-auto mb-3" style={{ color: gold }}/>
                  <p className="text-sm mb-3" style={{ color: "#94A3B8" }}>This resource uses an external link.</p>
                  <a href={url} target="_blank" rel="noreferrer" className="inline-flex px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: gold, color: navy }}>Open Link</a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <GlassCard className="p-3">
                <p className="text-xs" style={{ color: "#3D5270" }}>Level</p>
                <p className="text-sm font-semibold">{resource.difficulty || resource.level || "General"}</p>
              </GlassCard>
              <GlassCard className="p-3">
                <p className="text-xs" style={{ color: "#3D5270" }}>Duration / Type</p>
                <p className="text-sm font-semibold">{resource.duration || resource.type || "Open"}</p>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Design Tokens / Shared Components ─────────────────────────────────────

const gold = "#D4AF37";
const navy = "#080F1C";
const navyMid = "#0D1829";
const card = "rgba(18,28,46,0.85)";
const cardBorder = "rgba(255,255,255,0.07)";


const APP_LOGO_SRC = "./logo192.png";
const WELCOME_CHARACTER_SRC = "./Faltah-v2.png";
const WELCOME_AUDIO_URL = "./faltah-welcome.mp3";
const INTRO_VIDEO_URL = "./faltah-introduction.mp4"; // Fixed in code only. CMS cannot edit this introduction video link.
const INTRO_VIDEO_TITLE = "Welcome to FALTAH Enterprise";

const INTRO_RESOURCE = {
  id: "faltah-introduction-video",
  type: "video",
  title: INTRO_VIDEO_TITLE,
  equipment: "FALTAH Orientation",
  category: "About FALTAH",
  difficulty: "Intro",
  duration: "2 min",
  url: INTRO_VIDEO_URL,
  thumb: APP_LOGO_SRC,
  description: "A short introduction to the FALTAH digital engineering knowledge platform.",
};

function FaltahCharacter({ size = 56, animated = true, subtle = false }: { size?: number; animated?: boolean; subtle?: boolean }) {
  return (
    <div
      className={`${animated ? "faltah-character-float" : ""} ${subtle ? "" : "faltah-character-glow"}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(14, size * 0.22),
        overflow: "hidden",
        border: `1px solid ${gold}35`,
        background: "rgba(8,15,28,0.8)",
        flexShrink: 0,
      }}
    >
      <img src={APP_LOGO_SRC} alt="FALTAH logo" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
}

function openIntroVideo() {
  if (!INTRO_VIDEO_URL) return;
  openExternalResource(INTRO_RESOURCE);
}

function IntroVideoCard({ compact = false }: { compact?: boolean }) {
  const hasIntro = Boolean(INTRO_VIDEO_URL);
  return (
    <GlassCard className={`p-3.5 ${compact ? "" : "mt-4"}`} accent={gold} onClick={hasIntro ? openIntroVideo : undefined}>
      <div className="flex items-center gap-3">
        <FaltahCharacter size={58} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold mb-1" style={{ fontFamily: "'Rajdhani',sans-serif", color: "#F1F5F9", letterSpacing: "0.04em" }}>
            Watch FALTAH Introduction
          </p>
          <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
            Meet the FALTAH character and learn how to use the platform.
          </p>
          {!hasIntro && <p className="text-xs mt-1" style={{ color: gold }}>Intro video link is fixed in code, not CMS.</p>}
        </div>
        <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: `${gold}18`, border: `1px solid ${gold}30` }}>
          <Play size={16} style={{ color: gold }} />
        </div>
      </div>
    </GlassCard>
  );
}

function AboutFaltahPage({ onBack }: { onBack: () => void }) {
  return (
    <div className="flex flex-col pb-8 px-4 pt-2">
      <button onClick={onBack} className="flex items-center gap-2 text-sm mb-4" style={{ color: "#3D5270" }}><ChevronLeft size={16}/> More</button>
      <GlassCard className="p-5 mb-4" accent={gold}>
        <div className="flex items-center gap-4 mb-4">
          <FaltahCharacter size={86} />
          <div className="flex-1">
            <p className="text-xs uppercase tracking-[0.18em] mb-1" style={{ color: gold }}>About FALTAH</p>
            <h2 className="text-2xl font-bold leading-none" style={{ fontFamily: "'Rajdhani',sans-serif" }}>Enterprise Knowledge Guide</h2>
          </div>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>
          FALTAH is a centralized digital engineering knowledge platform for equipment, videos, documents, and AI-assisted learning.
        </p>
      </GlassCard>
      <IntroVideoCard compact />
      <div className="grid grid-cols-3 gap-2 mt-4">
        {["Learn", "Share", "Excel"].map((x) => <GlassCard key={x} className="p-3 text-center"><p className="text-xs font-bold" style={{ color: gold }}>{x}</p></GlassCard>)}
      </div>
      <GlassCard className="p-4 mt-4">
        <p className="text-sm font-bold mb-2" style={{ color: gold }}>How to use FALTAH</p>
        <p className="text-xs leading-relaxed" style={{ color: "#64748B" }}>
          Start from the Knowledge Tree, open equipment hubs, watch embedded videos, review linked documents, and ask FALTAH AI for explanations.
        </p>
      </GlassCard>
    </div>
  );
}

function WelcomeTour({ onClose }: { onClose: (doNotShowAgain?: boolean) => void }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);
  const voiceStartedRef = useRef(false);

  const playVoice = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || voiceStartedRef.current) return;
    try {
      voiceStartedRef.current = true;
      audio.currentTime = 0;
      await audio.play();
    } catch {
      voiceStartedRef.current = false;
      // Chrome may block unmuted autoplay on refresh.
      // The listener below retries automatically on the first user interaction.
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => { void playVoice(); }, 350);

    const retryOnUserInteraction = () => { void playVoice(); };
    window.addEventListener("pointerdown", retryOnUserInteraction, { once: true });
    window.addEventListener("click", retryOnUserInteraction, { once: true });
    window.addEventListener("keydown", retryOnUserInteraction, { once: true });
    window.addEventListener("touchstart", retryOnUserInteraction, { once: true });

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("pointerdown", retryOnUserInteraction);
      window.removeEventListener("click", retryOnUserInteraction);
      window.removeEventListener("keydown", retryOnUserInteraction);
      window.removeEventListener("touchstart", retryOnUserInteraction);
    };
  }, [playVoice]);

  const handleClose = () => {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    videoRef.current?.pause();
    onClose(doNotShowAgain);
  };



  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center px-3 py-3"
      onPointerDown={() => { void playVoice(); }}
      style={{ background: "rgba(0,0,0,0.84)", backdropFilter: "blur(16px)" }}
    >
      <div
        className="relative w-full max-w-[560px] h-[94dvh] max-h-[900px] overflow-y-auto rounded-[36px] px-5 sm:px-7 pt-5 pb-5 flex flex-col"
        style={{
          background:
            "radial-gradient(circle at 18% 18%, rgba(50,118,188,0.88) 0%, rgba(9,26,49,0.99) 44%, rgba(3,9,18,1) 100%)",
          border: `1px solid ${gold}30`,
          boxShadow: "0 34px 95px rgba(0,0,0,0.88)",
        }}
      >
        <button
          onClick={handleClose}
          aria-label="Close welcome"
          className="absolute top-5 right-5 z-30 w-12 h-12 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.12)", color: "#F8FAFC", border: `1px solid ${cardBorder}` }}
        >
          <X size={27} />
        </button>

        <section className="relative h-[34dvh] min-h-[245px] max-h-[330px] shrink-0 overflow-hidden rounded-[30px] mb-4">
          <div
            className="absolute inset-0 opacity-95"
            style={{
              background:
                "radial-gradient(circle at 24% 70%, rgba(102,180,227,0.34), transparent 38%), radial-gradient(circle at 82% 36%, rgba(245,197,66,0.14), transparent 36%)",
            }}
          />
          <div
            className="absolute left-0 bottom-0 flex items-end justify-center"
            style={{ width: "46%", height: "100%" }}
          >
            <img
              src={WELCOME_CHARACTER_SRC}
              alt="FALTAH Technical Knowledge Ambassador"
              className="faltah-character-float"
              style={{
                height: "min(34dvh, 325px)",
                maxHeight: "100%",
                width: "auto",
                maxWidth: "118%",
                objectFit: "contain",
                objectPosition: "bottom center",
                transform: "translateX(-2px)",
                filter: "drop-shadow(0 26px 36px rgba(0,0,0,0.68))",
              }}
            />
          </div>
          <div className="absolute right-1 top-[52px] max-w-[57%] pr-2">
            <p className="text-[13px] sm:text-[14px] uppercase tracking-[0.28em] font-black" style={{ color: gold }}>Welcome</p>
            <h2
              className="text-[46px] sm:text-[54px] font-black leading-[0.90] mt-2"
              style={{ fontFamily: "'Rajdhani',sans-serif", color: "#F8FAFC", textShadow: "0 10px 28px rgba(0,0,0,0.50)" }}
            >
              Meet<br />FALTAH
            </h2>
            <p className="mt-3 text-[14px] sm:text-[16px] leading-snug font-semibold" style={{ color: "#E2E8F0" }}>
              Your Technical Knowledge Ambassador
            </p>
          </div>
        </section>

        <div className="rounded-[24px] p-4 sm:p-5 mb-4 shrink-0" style={{ background: "rgba(21,45,78,0.78)", border: `1px solid ${cardBorder}`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.10)" }}>
          <p className="text-[16px] sm:text-[18px] leading-relaxed font-bold" style={{ color: "#F8FAFC" }}>
            Welcome to FALTAH Enterprise.<br />
            I’m FALTAH, your Technical Knowledge Ambassador. Watch this short introduction to discover the platform.
          </p>
          <label
            className="mt-4 flex items-center gap-3 rounded-[16px] px-3.5 py-3 text-sm sm:text-base font-bold cursor-pointer select-none"
            style={{ background: "rgba(255,255,255,0.06)", color: "#E2E8F0", border: `1px solid ${cardBorder}` }}
            onClick={(event) => event.stopPropagation()}
          >
            <input
              type="checkbox"
              checked={doNotShowAgain}
              onChange={(event) => setDoNotShowAgain(event.target.checked)}
              className="h-5 w-5 accent-[#F5C542]"
            />
            <span>Do not show this welcome page again</span>
          </label>
        </div>

        <div className="rounded-[24px] overflow-hidden mb-4 shrink-0" style={{ background: "#050A12", border: `1px solid ${cardBorder}`, boxShadow: "0 20px 46px rgba(0,0,0,0.42)" }}>
          <video
            ref={videoRef}
            src={INTRO_VIDEO_URL}
            controls
            playsInline
            preload="metadata"
            className="w-full aspect-video block"
          />
        </div>

        <div className="mt-auto flex flex-col gap-3 shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-4 rounded-[22px] text-xl font-black flex items-center justify-center gap-3"
            style={{ background: `linear-gradient(135deg,${gold},#F8C923)`, color: navy, boxShadow: `0 12px 30px ${gold}2E` }}
          >
            Start Exploring <span aria-hidden="true">→</span>
          </button>
          <button
            onClick={handleClose}
            className="w-full py-3.5 rounded-[20px] text-lg font-bold"
            style={{ background: "rgba(255,255,255,0.035)", color: "#E2E8F0", border: `1px solid ${cardBorder}` }}
          >
            Skip
          </button>
        </div>

        <audio ref={audioRef} src={WELCOME_AUDIO_URL} preload="auto" />
      </div>
    </div>
  );
}

function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center faltah-splash-gradient">
      <div className="text-center px-6">
        <div className="relative inline-flex mb-5">
          <span className="absolute inset-0 rounded-3xl" style={{ border: `1px solid ${gold}40`, animation: "faltah-pulse-ring 1.8s ease-out infinite" }}/>
          <FaltahCharacter size={116} />
        </div>
        <h1 className="text-3xl font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.12em", color:"#F1F5F9" }}>FALTAH</h1>
        <p className="text-xs uppercase tracking-[0.24em] mt-1" style={{ color: gold }}>Loading Knowledge</p>
      </div>
    </div>
  );
}

// Stable admin form controls (defined outside MorePage so inputs do not lose focus on each keystroke)
function AdminField({ label, value, onChange, placeholder, type = "text" }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
      <input
        type={type}
        value={value ?? ""}
        onChange={e => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: "rgba(8,15,28,0.8)", border: `1px solid ${cardBorder}`, color: "#E2E8F0" }}
      />
    </div>
  );
}

function AdminArea({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
      <textarea
        rows={3}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
        style={{ background: "rgba(8,15,28,0.8)", border: `1px solid ${cardBorder}`, color: "#E2E8F0" }}
      />
    </div>
  );
}


async function captureVideoThumbnail(source: File | string): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = source instanceof File ? URL.createObjectURL(source) : "";
    const candidates: { data: string; score: number }[] = [];
    const points = [0.12, 0.28, 0.48, 0.68, 0.84];
    let index = 0;
    let finished = false;

    const cleanup = () => {
      video.pause(); video.removeAttribute("src"); video.load();
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
    const finish = () => {
      if (finished) return;
      finished = true;
      cleanup();
      const best = candidates.sort((a,b)=>b.score-a.score)[0];
      if (best) resolve(best.data); else reject(new Error("No usable video frame found"));
    };
    const fail = (error: unknown) => { if (!finished) { finished = true; cleanup(); reject(error); } };

    video.muted = true; video.playsInline = true; video.preload = "auto";
    if (!(source instanceof File)) video.crossOrigin = "anonymous";

    const seekNext = () => {
      if (index >= points.length) return finish();
      const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 1;
      video.currentTime = Math.min(Math.max(0.15, duration * points[index++]), Math.max(0.15, duration - 0.05));
    };

    video.addEventListener("loadedmetadata", seekNext, { once:true });
    video.addEventListener("seeked", () => {
      try {
        const canvas = document.createElement("canvas");
        const maxWidth = 1280;
        const scale = Math.min(1, maxWidth / Math.max(1, video.videoWidth || maxWidth));
        canvas.width = Math.max(320, Math.round((video.videoWidth || 1280) * scale));
        canvas.height = Math.max(180, Math.round((video.videoHeight || 720) * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently:true });
        if (!ctx) throw new Error("Canvas unavailable");
        ctx.drawImage(video,0,0,canvas.width,canvas.height);
        const sample = ctx.getImageData(0,0,Math.min(canvas.width,240),Math.min(canvas.height,135)).data;
        let luminance = 0, contrast = 0, count = 0;
        for (let i=0;i<sample.length;i+=16) {
          const l = 0.2126*sample[i] + 0.7152*sample[i+1] + 0.0722*sample[i+2];
          luminance += l; contrast += Math.abs(l-70); count++;
        }
        const avg = count ? luminance/count : 0;
        const score = avg + (count ? contrast/count : 0) - (avg < 18 ? 150 : 0);
        candidates.push({ data:canvas.toDataURL("image/jpeg",0.84), score });
        seekNext();
      } catch (error) { fail(error); }
    });
    video.addEventListener("error",()=>fail(new Error("Unable to load video for thumbnail generation")),{ once:true });
    video.src = objectUrl || String(source);
  });
}

function VideoFilePicker({
  videoForm,
  updateVideoForm,
}: {
  videoForm: any;
  updateVideoForm: (field: string, value: any) => void;
}) {
  const [status, setStatus] = useState<string>(videoForm.thumbnailLink || videoForm.thumbnailUrl ? "Thumbnail ready" : "No video file selected yet");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File | null) => {
    if (!file) return;
    setBusy(true);
    setStatus("Generating thumbnail from selected video...");
    updateVideoForm("videoFileName", file.name);

    try {
      const generatedThumbnail = await captureVideoThumbnail(file);
      updateVideoForm("thumbnailLink", generatedThumbnail);
      updateVideoForm("thumbnailUrl", generatedThumbnail);
      updateVideoForm("thumbnailSource", "auto-generated-from-video");
      updateVideoForm("thumbnailGeneratedAt", new Date().toISOString());
      setStatus("Thumbnail generated automatically");
    } catch {
      setStatus("Could not generate thumbnail from this file. Try another MP4/WebM file.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>Video File</label>
      <label className="flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl text-sm cursor-pointer" style={{ background: "rgba(8,15,28,0.8)", border: `1px dashed ${cardBorder}`, color: "#E2E8F0" }}>
        <Upload size={18} style={{ color: gold }} />
        <span className="font-semibold">Select MP4/WebM to auto-create thumbnail</span>
        <span className="text-xs text-center" style={{ color: "#64748B" }}>{videoForm.videoFileName || status}</span>
        <input type="file" accept="video/mp4,video/webm,video/quicktime,video/*" className="hidden" onChange={e => handleFile(e.target.files?.[0])} />
      </label>
      {busy && <p className="text-xs mt-2" style={{ color: gold }}>Processing thumbnail...</p>}
      {(videoForm.thumbnailLink || videoForm.thumbnailUrl) && (
        <div className="mt-3 rounded-xl overflow-hidden" style={{ border: `1px solid ${cardBorder}`, background: "rgba(8,15,28,0.8)" }}>
          <img src={videoForm.thumbnailLink || videoForm.thumbnailUrl} alt="Auto-generated video thumbnail" className="w-full h-32 object-cover" />
          <p className="px-3 py-2 text-xs" style={{ color: "#94A3B8" }}>Auto-generated thumbnail preview</p>
        </div>
      )}
    </div>
  );
}

function EquipmentDetailsModal({ equipmentItem, resources, onClose }: { equipmentItem: any; resources: any[]; onClose: () => void }) {
  if (!equipmentItem) return null;
  const normalizeKey = (value:any) => String(value || "").trim().toLowerCase();
  const equipmentId = normalizeKey(equipmentItem.id);
  const exactKeys = [equipmentItem.name, equipmentItem.label, equipmentItem.tag].map(normalizeKey).filter(Boolean);
  const related = resources.filter((r:any) => {
    if (String(r.type || "").toLowerCase() !== "video") return false;
    const linkedId = normalizeKey(r.equipmentId || r.equipmentDocId);
    if (linkedId) return linkedId === equipmentId;
    const resourceEquipment = normalizeKey(r.equipment || r.equip || r.equipmentName);
    return exactKeys.includes(resourceEquipment);
  });
  const videos = related;

  return (
    <div className="fixed inset-0 z-[998] flex items-end sm:items-center justify-center" style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)" }}>
      <div className="w-full h-[92dvh] sm:max-w-[430px] sm:h-[88dvh] rounded-t-3xl sm:rounded-3xl overflow-hidden flex flex-col"
        style={{ background: navy, border: `1px solid ${cardBorder}`, boxShadow: "0 24px 80px rgba(0,0,0,0.7)" }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${cardBorder}` }}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${equipmentItem.color || gold}12`, border: `1px solid ${equipmentItem.color || gold}25` }}>
              {equipmentIconNode(equipmentItem, 17)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: "#E2E8F0" }}>{equipmentItem.name || equipmentItem.label}</p>
              <p className="text-xs truncate" style={{ color: "#3D5270" }}>{equipmentItem.category || "Equipment"}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${cardBorder}` }}>
            <X size={16} style={{ color: "#94A3B8" }}/>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <GlassCard className="p-4 mb-4" accent={equipmentItem.color || gold}>
            <h2 className="text-base font-bold mb-2" style={{ fontFamily: "'Rajdhani',sans-serif", color: gold }}>Overview</h2>
            <p className="text-sm leading-relaxed" style={{ color: "#94A3B8" }}>{equipmentItem.description || "No equipment description available yet."}</p>
          </GlassCard>

          <div className="grid grid-cols-2 gap-3 mb-5">
            <GlassCard className="p-3"><p className="text-xs" style={{ color: "#3D5270" }}>Tag</p><p className="text-sm font-semibold">{equipmentItem.tag || "N/A"}</p></GlassCard>
            <GlassCard className="p-3"><p className="text-xs" style={{ color: "#3D5270" }}>Status</p><p className="text-sm font-semibold">{equipmentItem.live === false ? "Inactive" : "Active"}</p></GlassCard>
          </div>

          <SectionHead title="Related Videos" />
          <div className="flex flex-col gap-3 mb-5">
            {videos.length ? videos.map((r: any) => <ResourceCard key={r.id} r={r} />) : <GlassCard className="p-4 text-center"><p className="text-sm" style={{ color: "#64748B" }}>No related videos linked yet.</p></GlassCard>}
          </div>

        </div>
      </div>
    </div>
  );
}


function AdminSelect({ label, value, onChange, options, placeholder = "Select" }: { label: string; value: any; onChange: (v: any) => void; options: { value: string; label: string }[]; placeholder?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label>
      <select
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none"
        style={{ background: "rgba(8,15,28,0.8)", border: `1px solid ${cardBorder}`, color: "#E2E8F0" }}
      >
        <option value="">{placeholder}</option>
        {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  );
}

function GlassCard({ children, className = "", onClick, accent, style }: {
  children: React.ReactNode; className?: string; onClick?: () => void; accent?: string; style?: React.CSSProperties;
}) {
  return (
    <div onClick={onClick}
      className={`rounded-2xl transition-all duration-200 ${onClick ? "cursor-pointer active:scale-[0.97]" : ""} ${className}`}
      style={{
        background: card,
        backdropFilter: "blur(16px)",
        border: `1px solid ${accent ? accent + "30" : cardBorder}`,
        boxShadow: accent ? `0 0 20px ${accent}0A, 0 2px 16px rgba(0,0,0,0.35)` : "0 2px 16px rgba(0,0,0,0.3)",
        ...style,
      }}>
      {children}
    </div>
  );
}

function Pill({ text, color }: { text: string; color?: string }) {
  const map: Record<string, string> = { Beginner: "#10B981", Intermediate: "#F59E0B", Advanced: "#EF4444", Expert: "#8B5CF6" };
  const c = color || map[text] || "#64748B";
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ background: `${c}18`, color: c, border: `1px solid ${c}30` }}>
      {text}
    </span>
  );
}

function SectionHead({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <div className="flex items-center justify-between px-4 mb-4">
      <div className="flex items-center gap-2">
        <div className="w-1 h-5 rounded-full" style={{ background: gold }} />
        <h2 className="font-bold text-sm tracking-wider uppercase" style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.07em", color: "#E2E8F0" }}>{title}</h2>
      </div>
      {action && <button onClick={onAction} className="text-xs flex items-center gap-1 transition-colors" style={{ color: "#3D5270" }}>{action} <ChevronRight size={12} /></button>}
    </div>
  );
}

function AnimatedCount({ to, duration = 1200 }: { to: number; duration?: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let v = 0; const step = to / (duration / 16);
    const t = setInterval(() => { v += step; if (v >= to) { setN(to); clearInterval(t); } else setN(Math.floor(v)); }, 16);
    return () => clearInterval(t);
  }, [to, duration]);
  return <>{n.toLocaleString()}</>;
}

// ─── Cinematic Oil & Gas Process Plant ──────────────────────────────────────
/**
 * FALTAH Enterprise – Cinematic Hero Visualization
 * Night-scene industrial facility with interactive equipment hotspots.
 * Tap any glowing node to reveal a glassmorphism knowledge panel.
 * onEquipmentClick fires when "Explore Knowledge" is pressed inside a panel.
 */
function CinematicPlant({ onEquipmentClick }: { onEquipmentClick?: (id: string) => void } = {}) {
  const [active, setActive] = useState<string | null>(null);
  const toggle = (id: string) => setActive(p => (p === id ? null : id));

  const SPOTS = [
    { id: "column",     tag: "T-101", label: "Distillation Column",    color: "#D4AF37", x: 226, y: 128, delay: "0s",
      photo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=220&h=110&fit=crop&auto=format",
      desc: "Multi-stage fractionation column. Structured packing, 32 theoretical stages, 2 500 m³/day capacity." },
    { id: "vessel",     tag: "V-101", label: "Pressure Vessel",         color: "#8B5CF6", x: 291, y: 170, delay: "0.3s",
      photo: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=220&h=110&fit=crop&auto=format",
      desc: "ASME Sec. VIII Div. 1 vertical vessel. Design 150 psig / 250 °F. Material SA-516 Gr. 70." },
    { id: "separator",  tag: "S-101", label: "Three-Phase Separator",   color: "#10B981", x: 148, y: 174, delay: "0.5s",
      photo: "https://images.unsplash.com/photo-1565514158740-064f34bd6cfd?w=220&h=110&fit=crop&auto=format",
      desc: "Horizontal three-phase separator for gas-oil-water separation with mist eliminators and weir plates." },
    { id: "hex",        tag: "E-101", label: "Shell & Tube HEX",        color: "#F59E0B", x: 94,  y: 170, delay: "0.7s",
      photo: "https://images.unsplash.com/photo-1581092921461-eab62e97a780?w=220&h=110&fit=crop&auto=format",
      desc: "TEMA AES 2-pass heat exchanger. 450 m² surface area. Crude/hot-oil service." },
    { id: "compressor", tag: "K-101", label: "Gas Compressor",          color: "#EF4444", x: 62,  y: 191, delay: "0.9s",
      photo: "https://images.unsplash.com/photo-1537462715879-360eeb61a0ad?w=220&h=110&fit=crop&auto=format",
      desc: "API 617 centrifugal gas compressor driven by electric motor. 15 000 Nm³/h at 8 bar discharge." },
    { id: "pump",       tag: "P-101", label: "Centrifugal Pump",        color: "#3B82F6", x: 68,  y: 210, delay: "1.1s",
      photo: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=220&h=110&fit=crop&auto=format",
      desc: "API 610 OH2 centrifugal pump. 250 m³/h at 45 m head. Mechanical seal Plan 11." },
    { id: "flare",      tag: "F-101", label: "Flare Stack",             color: "#F59E0B", x: 351, y: 120, delay: "0.2s",
      photo: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=220&h=110&fit=crop&auto=format",
      desc: "60 m elevated flare with steam injection for smokeless combustion of emergency relief gases." },
  ] as const;

  // Helper: glow layers for industrial work-light fixture
  const WL = (cx: number, cy: number, warm = true) => {
    const c1 = warm ? "#FF8030" : "#4080FF";
    const c2 = warm ? "#FFB060" : "#60A0FF";
    return (
      <g>
        <circle cx={cx} cy={cy} r="20" fill={c1} opacity="0.07" filter="url(#cp-b18)"/>
        <circle cx={cx} cy={cy} r="11" fill={c2} opacity="0.2"  filter="url(#cp-b8)"/>
        <circle cx={cx} cy={cy} r="5"  fill={c2} opacity="0.45" filter="url(#cp-b3)"/>
        <circle cx={cx} cy={cy} r="1.8" fill="#FFFFFF" opacity="0.95"/>
      </g>
    );
  };

  return (
    <div className="relative w-full select-none" style={{ touchAction: "manipulation" }}>
      {/* ── THE SCENE ── */}
      <svg viewBox="0 0 380 270" className="w-full block" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Sky */}
          <linearGradient id="cp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#010406"/>
            <stop offset="28%"  stopColor="#030B16"/>
            <stop offset="58%"  stopColor="#06101E"/>
            <stop offset="82%"  stopColor="#091428"/>
            <stop offset="100%" stopColor="#0B162C"/>
          </linearGradient>
          {/* Flare warm ambient – large radial from top-right */}
          <radialGradient id="cp-flamb" cx="352" cy="58" r="310" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#F59E0B" stopOpacity="0.25"/>
            <stop offset="18%"  stopColor="#D4AF37" stopOpacity="0.10"/>
            <stop offset="45%"  stopColor="#D4AF37" stopOpacity="0.04"/>
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0"/>
          </radialGradient>
          {/* Blue ambient sky-left */}
          <radialGradient id="cp-bamb" cx="55" cy="35" r="260" gradientUnits="userSpaceOnUse">
            <stop offset="0%"   stopColor="#1E4A8A" stopOpacity="0.24"/>
            <stop offset="45%"  stopColor="#1A3A6A" stopOpacity="0.09"/>
            <stop offset="100%" stopColor="#1A3A6A" stopOpacity="0"/>
          </radialGradient>
          {/* Horizon glow band */}
          <linearGradient id="cp-horiz" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1A3A6A" stopOpacity="0"/>
            <stop offset="40%"  stopColor="#1E3E72" stopOpacity="0.3"/>
            <stop offset="65%"  stopColor="#122848" stopOpacity="0.15"/>
            <stop offset="100%" stopColor="#081428" stopOpacity="0"/>
          </linearGradient>
          {/* Column 3-D cylinder illusion: horizontal gradient */}
          <linearGradient id="cp-col1" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1C3448"/>
            <stop offset="14%"  stopColor="#2E4C62"/>
            <stop offset="38%"  stopColor="#1E3448"/>
            <stop offset="68%"  stopColor="#0E1E2E"/>
            <stop offset="88%"  stopColor="#0A1828"/>
            <stop offset="100%" stopColor="#1C2218"/>
          </linearGradient>
          <linearGradient id="cp-col2" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#162C3E"/>
            <stop offset="20%"  stopColor="#243E54"/>
            <stop offset="55%"  stopColor="#182E40"/>
            <stop offset="85%"  stopColor="#0C1C2C"/>
            <stop offset="100%" stopColor="#181E10"/>
          </linearGradient>
          <linearGradient id="cp-colbg" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#0E1C28"/>
            <stop offset="35%"  stopColor="#16273A"/>
            <stop offset="70%"  stopColor="#0E1E2C"/>
            <stop offset="100%" stopColor="#101418"/>
          </linearGradient>
          {/* Horizontal vessel gradient */}
          <linearGradient id="cp-hves" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#1A2E3E"/>
            <stop offset="24%"  stopColor="#2A4256"/>
            <stop offset="54%"  stopColor="#1C3040"/>
            <stop offset="80%"  stopColor="#0E1E2C"/>
            <stop offset="100%" stopColor="#1A201A"/>
          </linearGradient>
          {/* Vertical vessel gradient */}
          <linearGradient id="cp-vves" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#2A3E52"/>
            <stop offset="35%"  stopColor="#1E3040"/>
            <stop offset="72%"  stopColor="#162430"/>
            <stop offset="100%" stopColor="#0E1C28"/>
          </linearGradient>
          {/* Ground */}
          <linearGradient id="cp-gnd" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#08101A"/>
            <stop offset="50%"  stopColor="#060C14"/>
            <stop offset="100%" stopColor="#040810"/>
          </linearGradient>
          {/* Pipe rack */}
          <linearGradient id="cp-rack" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#182030"/>
            <stop offset="50%"  stopColor="#223040"/>
            <stop offset="100%" stopColor="#182030"/>
          </linearGradient>
          {/* Glowing process line */}
          <linearGradient id="cp-pglow" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#60A5FA" stopOpacity="0"/>
            <stop offset="20%"  stopColor="#60A5FA" stopOpacity="0.65"/>
            <stop offset="55%"  stopColor="#93C5FD" stopOpacity="0.85"/>
            <stop offset="80%"  stopColor="#60A5FA" stopOpacity="0.65"/>
            <stop offset="100%" stopColor="#60A5FA" stopOpacity="0"/>
          </linearGradient>
          {/* Ground fog */}
          <linearGradient id="cp-fog" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#1A2E4A" stopOpacity="0.28"/>
            <stop offset="55%"  stopColor="#1A2E4A" stopOpacity="0.09"/>
            <stop offset="100%" stopColor="#1A2E4A" stopOpacity="0"/>
          </linearGradient>
          {/* Depth vignette overlay */}
          <linearGradient id="cp-vig" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#020608" stopOpacity="0"/>
            <stop offset="58%"  stopColor="#020608" stopOpacity="0"/>
            <stop offset="78%"  stopColor="#020608" stopOpacity="0.1"/>
            <stop offset="100%" stopColor="#010406" stopOpacity="0.42"/>
          </linearGradient>
          {/* Filters */}
          <filter id="cp-b3"  x="-80%"  y="-80%"  width="260%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
          <filter id="cp-b5"  x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5"/></filter>
          <filter id="cp-b8"  x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="8"/></filter>
          <filter id="cp-b12" x="-120%" y="-120%" width="340%" height="340%"><feGaussianBlur stdDeviation="12"/></filter>
          <filter id="cp-b18" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="18"/></filter>
          <filter id="cp-b25" x="-200%" y="-200%" width="500%" height="500%"><feGaussianBlur stdDeviation="25"/></filter>
          <filter id="cp-gmed"><feGaussianBlur stdDeviation="3.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          <filter id="cp-gsm"><feGaussianBlur stdDeviation="1.8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>

        {/* ═══ SKY BASE ═══ */}
        <rect width="380" height="270" fill="url(#cp-sky)"/>

        {/* Stars */}
        {([
          [15,12,0.7],[42,8,0.55],[78,18,0.65],[112,6,0.5],[148,22,0.5],
          [185,10,0.72],[215,4,0.55],[248,15,0.68],[282,8,0.48],[318,20,0.52],
          [345,12,0.62],[30,30,0.42],[65,38,0.52],[140,35,0.62],[175,44,0.42],
          [210,32,0.52],[255,40,0.58],[330,35,0.52],[355,45,0.38],[22,55,0.42],
          [58,62,0.48],[310,58,0.42],[165,68,0.32],[288,62,0.52],[95,48,0.38],
        ] as [number,number,number][]).map(([x,y,o],i) =>
          <circle key={i} cx={x} cy={y} r="0.75" fill="white" opacity={o}/>
        )}

        {/* Horizon atmospheric glow band */}
        <rect x="0" y="72" width="380" height="52" fill="url(#cp-horiz)"/>

        {/* ═══ AMBIENT LIGHTING LAYERS ═══ */}
        <rect width="380" height="270" fill="url(#cp-bamb)"/>
        <rect width="380" height="270" fill="url(#cp-flamb)"/>

        {/* ═══ FAR BACKGROUND COLUMNS (atmospheric) ═══ */}
        <rect x="152" y="74" width="9"  height="122" fill="url(#cp-colbg)" opacity="0.65"/>
        <rect x="148" y="72" width="16" height="5"   fill="#101C28" opacity="0.65"/>
        <rect x="169" y="80" width="8"  height="114" fill="url(#cp-colbg)" opacity="0.55"/>
        <rect x="181" y="77" width="9"  height="117" fill="url(#cp-colbg)" opacity="0.6"/>
        {/* Atmosphere washes out far equipment */}
        <rect x="0" y="58" width="380" height="85" fill="#060E1A" opacity="0.38"/>

        {/* ═══ T-103 — left of main column ═══ */}
        <rect x="187" y="88" width="15" height="130" fill="url(#cp-col2)" opacity="0.85"/>
        <rect x="184" y="85" width="22" height="7"   rx="1" fill="#182C3E"/>
        {[104,120,136,152,168,184,200].map((y,i) =>
          <line key={i} x1="187" y1={y} x2="202" y2={y} stroke="#243848" strokeWidth="0.8" opacity="0.7"/>
        )}
        {WL(196, 105, false)}
        {WL(196, 160, false)}

        {/* ═══ T-101 — MAIN DISTILLATION COLUMN ═══ */}
        <ellipse cx="226" cy="220" rx="20" ry="5" fill="#1A3040" opacity="0.55" filter="url(#cp-b5)"/>
        {/* Body */}
        <rect x="215" y="46" width="22" height="174" fill="url(#cp-col1)"/>
        {/* Specular highlight strip */}
        <rect x="215" y="46" width="4"  height="174" fill="#4A7090" opacity="0.12"/>
        {/* Tray section rings */}
        {[58,72,86,100,114,128,142,156,170,184,198,212].map((y,i) =>
          <line key={i} x1="215" y1={y} x2="237" y2={y} stroke="#080E18" strokeWidth="1" opacity="0.9"/>
        )}
        {/* Condenser drum */}
        <rect x="210" y="44" width="32" height="9" rx="1.5" fill="#1E3248"/>
        <rect x="210" y="43" width="32" height="3"   rx="1"   fill="#2C4260"/>
        {/* Platform at 2/3 height */}
        <rect x="210" y="136" width="32" height="4"  rx="0" fill="#1A2E40" opacity="0.9"/>
        <rect x="210" y="136" width="32" height="1.5" rx="0" fill="#2C4058" opacity="0.7"/>
        {/* Ladder (right edge, rungs) */}
        <line x1="237" y1="50" x2="237" y2="218" stroke="#182838" strokeWidth="1.5" opacity="0.8"/>
        {[62,74,86,98,110,122,134,146,158,170,182,194,206,218].map((y,i) =>
          <line key={i} x1="237" y1={y} x2="242" y2={y} stroke="#182838" strokeWidth="1" opacity="0.6"/>
        )}
        {/* Pipe nozzle stubs */}
        {([[215,88,'l'],[215,112,'l'],[237,158,'r'],[237,182,'r']] as [number,number,string][]).map(([nx,ny,s],i) =>
          <line key={i} x1={s==="l"?215:237} y1={ny} x2={s==="l"?206:246} y2={ny} stroke="#1A2E3E" strokeWidth="3" strokeLinecap="round"/>
        )}
        {/* Industrial lights on column */}
        {WL(224, 68)}
        {WL(224, 120)}
        {WL(224, 166)}
        {WL(224, 210)}

        {/* ═══ T-102 — right of main column ═══ */}
        <ellipse cx="255" cy="220" rx="16" ry="4" fill="#1A3040" opacity="0.45" filter="url(#cp-b5)"/>
        <rect x="246" y="72" width="18" height="148" fill="url(#cp-col2)" opacity="0.9"/>
        {[88,105,122,139,156,173,190,206].map((y,i) =>
          <line key={i} x1="246" y1={y} x2="264" y2={y} stroke="#080E18" strokeWidth="0.9" opacity="0.85"/>
        )}
        <rect x="243" y="70" width="24" height="7" rx="1" fill="#182C3C"/>
        {WL(255, 92)}
        {WL(255, 143)}
        {WL(255, 190)}

        {/* ═══ V-101 — VERTICAL PRESSURE VESSEL ═══ */}
        <ellipse cx="291" cy="220" rx="14" ry="4" fill="#182C3E" opacity="0.55" filter="url(#cp-b5)"/>
        <rect x="281" y="150" width="20" height="70" fill="url(#cp-vves)"/>
        <ellipse cx="291" cy="150" rx="10" ry="5" fill="#2A3E52"/>
        {[165,180,195,210].map((y,i) =>
          <line key={i} x1="281" y1={y} x2="301" y2={y} stroke="#1A2E3E" strokeWidth="0.9" opacity="0.8"/>
        )}
        <line x1="301" y1="164" x2="309" y2="164" stroke="#1A2C38" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="301" y1="184" x2="309" y2="184" stroke="#1A2C38" strokeWidth="2.5" strokeLinecap="round"/>
        {WL(291, 168)}

        {/* ═══ PIPE RACK ═══ */}
        {/* Support columns */}
        {[94,132,170,208,246].map((x,i) =>
          <line key={i} x1={x} y1="158" x2={x} y2="224" stroke="#162430" strokeWidth="2" opacity="0.7"/>
        )}
        {/* Rack beams */}
        {[158,164,170].map((y,i) =>
          <rect key={i} x="86" y={y} width="218" height="3.5" rx="0" fill="url(#cp-rack)" opacity={0.62+i*0.08}/>
        )}
        {/* Process lines on rack */}
        <rect x="90" y="157" width="210" height="2.5" rx="1"   fill="#1A3040" opacity="0.88"/>
        <rect x="90" y="163" width="210" height="2"   rx="1"   fill="#2A2418" opacity="0.82"/>
        <rect x="90" y="168.5" width="145" height="1.5" rx="0.6" fill="#1A2030" opacity="0.78"/>

        {/* ═══ S-101 — HORIZONTAL SEPARATOR ═══ */}
        <ellipse cx="148" cy="186" rx="42" ry="6" fill="#162430" opacity="0.45" filter="url(#cp-b5)"/>
        <rect x="108" y="164" width="80" height="22" rx="2" fill="url(#cp-hves)"/>
        <ellipse cx="108" cy="175" rx="5" ry="11"  fill="#1E3040" opacity="0.9"/>
        <ellipse cx="188" cy="175" rx="5" ry="11"  fill="#1A2A38" opacity="0.7"/>
        {[128,148,168].map((x,i) =>
          <line key={i} x1={x} y1="164" x2={x} y2="186" stroke="#1A2C3E" strokeWidth="0.9" opacity="0.8"/>
        )}
        <rect x="118" y="186" width="8" height="12" rx="0" fill="#10202E" opacity="0.8"/>
        <rect x="160" y="186" width="8" height="12" rx="0" fill="#10202E" opacity="0.8"/>
        <rect x="140" y="158" width="8" height="8" rx="0" fill="#162430" opacity="0.9"/>
        {/* S-101 status light */}
        <circle cx="148" cy="174" r="9"  fill="#10B981" opacity="0.11" filter="url(#cp-b5)"/>
        <circle cx="148" cy="174" r="1.9" fill="#10B981" opacity="0.9" filter="url(#cp-gsm)">
          <animate attributeName="opacity" values="0.9;0.3;0.9" dur="2.5s" repeatCount="indefinite"/>
        </circle>

        {/* ═══ E-101 — HEAT EXCHANGER ═══ */}
        <ellipse cx="94" cy="182" rx="33" ry="5" fill="#162430" opacity="0.38" filter="url(#cp-b5)"/>
        <rect x="62" y="161" width="65" height="19" rx="2" fill="url(#cp-hves)"/>
        <rect x="122" y="161" width="8"  height="19" rx="1" fill="#1C3040" opacity="0.9"/>
        {[77,92,107].map((x,i) =>
          <line key={i} x1={x} y1="161" x2={x} y2="180" stroke="#1A2C3E" strokeWidth="0.8" opacity="0.7"/>
        )}
        <ellipse cx="62" cy="170.5" rx="4" ry="9.5" fill="#1A2E3E" opacity="0.8"/>
        <rect x="72" y="180" width="6" height="10" fill="#0E1C2C" opacity="0.8"/>
        <rect x="108" y="180" width="6" height="10" fill="#0E1C2C" opacity="0.8"/>
        {/* E-101 status light */}
        <circle cx="94" cy="170" r="1.9" fill="#F59E0B" opacity="0.88" filter="url(#cp-gsm)">
          <animate attributeName="opacity" values="0.88;0.38;0.88" dur="2.2s" repeatCount="indefinite" begin="0.5s"/>
        </circle>

        {/* ═══ K-101 — COMPRESSOR ═══ */}
        <ellipse cx="62" cy="204" rx="24" ry="5" fill="#162430" opacity="0.48" filter="url(#cp-b5)"/>
        <rect x="40" y="181" width="44" height="23" rx="1" fill="#1A2C3E" opacity="0.85"/>
        <rect x="37" y="184" width="6"  height="17" rx="1" fill="#1E3040" opacity="0.9"/>
        <rect x="41" y="181" width="6"  height="17" rx="1" fill="#243848" opacity="0.85"/>
        <rect x="44" y="172" width="32" height="10" rx="0" fill="#16283A"/>
        <rect x="51" y="168" width="3"  height="5"  fill="#1A2C38"/>
        <rect x="75" y="185" width="10" height="15" rx="1" fill="#202E3E"/>
        <rect x="69" y="188" width="10" height="8"  rx="0" fill="#1A2838"/>
        {/* K-101 status light */}
        <circle cx="62" cy="192" r="1.9" fill="#EF4444" opacity="0.85" filter="url(#cp-gsm)">
          <animate attributeName="opacity" values="0.85;0.3;0.85" dur="1.8s" repeatCount="indefinite" begin="0.8s"/>
        </circle>

        {/* ═══ P-101 — PUMP STATION ═══ */}
        <ellipse cx="70" cy="217" rx="19" ry="4" fill="#162430" opacity="0.38" filter="url(#cp-b5)"/>
        <rect x="50" y="215" width="38" height="5" rx="0" fill="#0E1C2A" opacity="0.8"/>
        <rect x="55" y="201" width="22" height="15" rx="1" fill="#1A2E40" opacity="0.9"/>
        <rect x="72" y="203" width="18" height="12" rx="1" fill="#162638"/>
        {[74,76,78,80,82,84,86,88].map((x,i) =>
          <line key={i} x1={x} y1="203" x2={x} y2="215" stroke="#1C3040" strokeWidth="0.8" opacity="0.7"/>
        )}
        <line x1="63" y1="201" x2="63" y2="190" stroke="#182C3C" strokeWidth="2"   strokeLinecap="round"/>
        <line x1="55" y1="209" x2="40" y2="209" stroke="#182C3C" strokeWidth="2.5" strokeLinecap="round"/>
        {/* P-101 status light */}
        <circle cx="65" cy="208" r="1.9" fill="#3B82F6" opacity="0.9" filter="url(#cp-gsm)">
          <animate attributeName="opacity" values="0.9;0.28;0.9" dur="2.7s" repeatCount="indefinite" begin="1.2s"/>
        </circle>

        {/* ═══ FOREGROUND PROCESS PIPING ═══ */}
        <rect x="44" y="216" width="242" height="4.5" rx="2"   fill="#16263A" opacity="0.82"/>
        <rect x="70" y="210" width="212" height="3"   rx="1.5" fill="#1A2C3A" opacity="0.75"/>
        <rect x="88" y="194" width="162" height="2.5" rx="1"   fill="#162838" opacity="0.7"/>
        {[110,150,190,230].map((x,i) =>
          <line key={i} x1={x} y1="183" x2={x} y2="216" stroke="#162838" strokeWidth="2" opacity="0.6"/>
        )}
        {/* Control valve FV-101 */}
        <rect x="188" y="199" width="12" height="10" rx="0" fill="#1A2E40" opacity="0.9"/>
        <rect x="188" y="190" width="12" height="10" rx="0" fill="#162838"/>
        <rect x="188" y="189" width="12" height="2.5" rx="0" fill="#D4AF37" opacity="0.55"/>

        {/* ═══ GROUND PLANE ═══ */}
        <rect x="0" y="224" width="380" height="46" fill="url(#cp-gnd)"/>
        <line x1="0" y1="224" x2="380" y2="224" stroke="#1A3040" strokeWidth="0.5" opacity="0.5"/>
        {/* Ground reflections */}
        <ellipse cx="226" cy="228" rx="30" ry="6"  fill="#FF8030" opacity="0.11" filter="url(#cp-b8)"/>
        <ellipse cx="255" cy="228" rx="22" ry="5"  fill="#FF8030" opacity="0.08" filter="url(#cp-b8)"/>
        <ellipse cx="148" cy="226" rx="16" ry="3"  fill="#10B981" opacity="0.07" filter="url(#cp-b5)"/>
        <ellipse cx="94"  cy="226" rx="12" ry="3"  fill="#F59E0B" opacity="0.07" filter="url(#cp-b5)"/>
        <ellipse cx="352" cy="232" rx="28" ry="7"  fill="#F59E0B" opacity="0.22" filter="url(#cp-b8)"/>
        <ellipse cx="70"  cy="226" rx="10" ry="3"  fill="#3B82F6" opacity="0.07" filter="url(#cp-b5)"/>
        {/* Ground fog */}
        <rect x="0" y="208" width="380" height="26" fill="url(#cp-fog)" opacity="0.72"/>

        {/* ═══ GLOWING PROCESS LINES (animated) ═══ */}
        {/* Main header glow */}
        <rect x="44" y="217" width="242" height="2" rx="1" fill="url(#cp-pglow)" opacity="0.55">
          <animate attributeName="opacity" values="0.55;0.92;0.55" dur="3.2s" repeatCount="indefinite"/>
        </rect>
        {/* Rack pipe glow */}
        <rect x="90" y="157.5" width="210" height="1.2" rx="0.6" fill="#60A5FA" opacity="0.22">
          <animate attributeName="opacity" values="0.22;0.52;0.22" dur="3.8s" repeatCount="indefinite" begin="1s"/>
        </rect>
        {/* Secondary pipe glow */}
        <rect x="70" y="210.5" width="212" height="1" rx="0.5" fill="#60A5FA" opacity="0.28">
          <animate attributeName="opacity" values="0.28;0.6;0.28" dur="2.6s" repeatCount="indefinite" begin="0.6s"/>
        </rect>
        {/* Flow pulse – main header */}
        <rect x="44" y="216.5" width="32" height="2.5" rx="1.2" fill="white" opacity="0.58">
          <animate attributeName="x" values="44;268;44" dur="3.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1"/>
        </rect>
        {/* Flow pulse – secondary */}
        <rect x="70" y="210" width="24" height="2" rx="1" fill="white" opacity="0.45">
          <animate attributeName="x" values="70;272;70" dur="4.8s" repeatCount="indefinite" calcMode="spline" keySplines="0.4 0 0.6 1" begin="1.2s"/>
        </rect>

        {/* ═══ FLARE STACK ═══ */}
        <rect x="348" y="92"  width="7"   height="132" rx="1" fill="#182838" opacity="0.88"/>
        <rect x="349.5" y="92" width="2.5" height="132"       fill="#243848" opacity="0.28"/>
        <rect x="344" y="148" width="15"  height="3"   rx="0" fill="#16283A"/>
        <line x1="352" y1="92"  x2="318" y2="224" stroke="#10202E" strokeWidth="0.85" opacity="0.52"/>
        <line x1="352" y1="92"  x2="377" y2="200" stroke="#10202E" strokeWidth="0.85" opacity="0.52"/>
        <rect x="349" y="84"  width="5"   height="12"  rx="1" fill="#1C3040"/>
        {/* Flame – volumetric glow layers */}
        <ellipse cx="352" cy="68" rx="62" ry="50" fill="#D4AF37" opacity="0.038" filter="url(#cp-b25)"/>
        <ellipse cx="352" cy="68" rx="42" ry="36" fill="#F59E0B" opacity="0.10"  filter="url(#cp-b18)"/>
        <ellipse cx="352" cy="68" rx="26" ry="30" fill="#F59E0B" opacity="0.22"  filter="url(#cp-b12)">
          <animate attributeName="rx" values="26;32;20;28;26" dur="1.2s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="30;36;24;32;30" dur="1.1s" repeatCount="indefinite"/>
        </ellipse>
        {/* Flame body */}
        <ellipse cx="352" cy="70" rx="13" ry="19" fill="#F59E0B" opacity="0.88" filter="url(#cp-gmed)">
          <animate attributeName="rx" values="13;17;10;15;13" dur="1.12s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="19;24;15;21;19" dur="0.98s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.88;1;0.7;0.95;0.88" dur="1.12s" repeatCount="indefinite"/>
        </ellipse>
        {/* Hot core */}
        <ellipse cx="352" cy="73" rx="7.5" ry="13" fill="#EF4444" opacity="0.9">
          <animate attributeName="rx" values="7.5;10;6;8.5;7.5" dur="0.88s" repeatCount="indefinite"/>
          <animate attributeName="ry" values="13;17;10;14;13" dur="0.92s" repeatCount="indefinite"/>
        </ellipse>
        {/* Bright inner */}
        <ellipse cx="352" cy="76" rx="4.5" ry="8" fill="#FFE080" opacity="0.92">
          <animate attributeName="ry" values="8;11;6;9;8" dur="0.78s" repeatCount="indefinite"/>
        </ellipse>
        {/* White-hot tip */}
        <ellipse cx="352" cy="79" rx="2.5" ry="5" fill="white" opacity="0.85">
          <animate attributeName="opacity" values="0.85;0.5;0.92;0.6;0.85" dur="0.68s" repeatCount="indefinite"/>
        </ellipse>
        {/* Smoke drift */}
        <ellipse cx="352" cy="48" rx="9" ry="14" fill="#28303E" opacity="0.28" filter="url(#cp-b5)">
          <animate attributeName="cy"      values="48;32;48"    dur="3.6s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.28;0.05;0.28" dur="3.6s" repeatCount="indefinite"/>
          <animate attributeName="rx"      values="9;16;9"     dur="3.6s" repeatCount="indefinite"/>
        </ellipse>
        {/* Volumetric light rays from flare */}
        <path d="M352,75 L278,240 L345,240 Z" fill="#D4AF37" opacity="0.028" filter="url(#cp-b12)"/>
        <path d="M352,75 L245,205 L290,198 Z" fill="#D4AF37" opacity="0.022" filter="url(#cp-b8)"/>

        {/* ═══ ATMOSPHERIC OVERLAY ═══ */}
        <rect width="380" height="270" fill="url(#cp-vig)"/>
        {/* Fine haze near equipment level */}
        <rect x="0" y="196" width="380" height="32" fill="#0C1828" opacity="0.18" filter="url(#cp-b12)"/>

        {/* ═══ INTERACTIVE HOTSPOT NODES ═══ */}
        {SPOTS.map((spot) => (
          <g key={spot.id} onClick={() => toggle(spot.id)} style={{ cursor: "pointer" }}>
            {/* Outer breathing ring */}
            <circle cx={spot.x} cy={spot.y} r="16" fill={spot.color} opacity="0.07">
              <animate attributeName="r"       values="10;20;10"    dur="2.8s" repeatCount="indefinite" begin={spot.delay}/>
              <animate attributeName="opacity" values="0.07;0.02;0.07" dur="2.8s" repeatCount="indefinite" begin={spot.delay}/>
            </circle>
            {/* Mid ring */}
            <circle cx={spot.x} cy={spot.y} r="9" fill="none" stroke={spot.color} strokeWidth="1.5"
              opacity={active === spot.id ? 1 : 0.55}>
              <animate attributeName="r"       values="6;11;6"   dur="2.8s" repeatCount="indefinite" begin={spot.delay}/>
              <animate attributeName="opacity" values="0.55;0.2;0.55" dur="2.8s" repeatCount="indefinite" begin={spot.delay}/>
            </circle>
            {/* Core dot */}
            <circle cx={spot.x} cy={spot.y} r="4.5" fill={spot.color} opacity={active === spot.id ? 1 : 0.82}>
              <animate attributeName="opacity" values="0.82;1;0.82" dur="2.8s" repeatCount="indefinite" begin={spot.delay}/>
            </circle>
            {/* Tag label */}
            <text x={spot.x + 7} y={spot.y - 7} fontSize="6.2" fill={spot.color} opacity="0.72"
              fontFamily="'JetBrains Mono',monospace" fontWeight="500">{spot.tag}</text>
          </g>
        ))}
      </svg>

      {/* ═══ FLOATING GLASSMORPHISM KNOWLEDGE PANELS ═══ */}
      {/* Full-screen dismiss overlay — closes any open panel when tapping outside */}
      {active && <div className="fixed inset-0 z-40" onClick={() => setActive(null)}/>}

      {SPOTS.map((spot) => active === spot.id && (
        <div key={spot.id} className="absolute z-50 rounded-2xl overflow-hidden"
          style={{
            width: 228,
            left: `clamp(6px, calc(${(spot.x / 380) * 100}% - 114px), calc(100% - 234px))`,
            ...(spot.y / 270 > 0.55
              ? { bottom: `calc(${((270 - spot.y) / 270) * 100}% + 14px)` }
              : { top:    `calc(${(spot.y / 270) * 100}% + 14px)` }),
            background:        "rgba(6,13,24,0.94)",
            backdropFilter:    "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            border:            `1px solid ${spot.color}38`,
            boxShadow:         `0 8px 36px rgba(0,0,0,0.65), 0 0 0 1px ${spot.color}18`,
          }}>

          {/* Photo banner */}
          <div className="relative">
            <img src={spot.photo} alt={spot.label} className="w-full object-cover block"
              style={{ height: 84, background: "#0A1520" }}/>
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(to top, rgba(6,13,24,0.78) 0%, transparent 55%)" }}/>
            {/* Close */}
            <button onClick={(e) => { e.stopPropagation(); toggle(spot.id); }}
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all active:scale-90"
              style={{ background: "rgba(0,0,0,0.55)", color: "#94A3B8", backdropFilter: "blur(4px)" }}>
              ✕
            </button>
            {/* Tag badge */}
            <div className="absolute bottom-2 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ background: `${spot.color}22`, color: spot.color, border: `1px solid ${spot.color}40`, fontFamily: "'JetBrains Mono',monospace", fontSize: 10 }}>
              {spot.tag}
            </div>
          </div>

          <div className="p-3.5">
            {/* Name */}
            <h3 className="font-bold mb-1.5 leading-snug"
              style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 15, color: "#F1F5F9", letterSpacing: "0.04em" }}>
              {spot.label}
            </h3>
            {/* Description */}
            <p className="text-xs leading-relaxed mb-3.5" style={{ color: "#546880" }}>
              {spot.desc}
            </p>
            {/* Actions */}
            <div className="flex flex-col gap-1.5">
              <button onClick={() => { setActive(null); onEquipmentClick?.(spot.id); }}
                className="w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-[0.97]"
                style={{ background: `linear-gradient(135deg,${spot.color},${spot.color}CC)`, color: "#060D18" }}>
                Overview
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => { setActive(null); onEquipmentClick?.(spot.id); }}
                  className="py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#7A9BBF", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Videos
                </button>
                <button onClick={() => { setActive(null); onEquipmentClick?.(spot.id); }}
                  className="py-2 rounded-xl text-xs font-medium transition-all active:scale-[0.97]"
                  style={{ background: "rgba(255,255,255,0.05)", color: "#7A9BBF", border: "1px solid rgba(255,255,255,0.07)" }}>
                  Documents
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Search Bar with suggestions ────────────────────────────────────────────
function SmartSearch({ placeholder = "Search equipment, failures, procedures, videos, manuals…", onSearch, onSubmit, initialValue = "" }: { placeholder?: string; onSearch?: (q: string) => void; onSubmit?: (q:string)=>void; initialValue?: string }) {
  const [q, setQ] = useState(initialValue);
  const [focused, setFocused] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setFocused(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  useEffect(()=>{ setQ(initialValue || ""); },[initialValue]);
  const go = (val: string) => { setQ(val); setFocused(false); onSearch?.(val); onSubmit?.(val); };
  // Only show suggestions when actively typing — no history ever shown
  const suggestions = q.trim().length > 0
    ? Array.from(new Set(SEARCH_SUGGESTIONS.filter(s => s.toLowerCase().includes(q.toLowerCase())))).slice(0, 5)
    : [];
  const showDropdown = focused && suggestions.length > 0;
  return (
    <div ref={ref} className="relative z-[100] isolate">
      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#3D5270" }}/>
        <input type="text" value={q}
          onChange={e => { const next = e.target.value; setQ(next); onSearch?.(next); if (!next.trim()) setFocused(false); }}
          onFocus={() => setFocused(true)}
          onKeyDown={e => { if (e.key === "Enter") { go(q); } if (e.key === "Escape") setFocused(false); }}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-11 pr-10 py-3.5 rounded-2xl text-sm outline-none transition-all duration-300"
          style={{ background: "rgba(12,22,38,0.95)", border: focused ? `1px solid ${gold}55` : `1px solid ${cardBorder}`, color: "#E2E8F0", boxShadow: focused ? `0 0 0 3px ${gold}08, 0 4px 24px rgba(0,0,0,0.4)` : "none" }}/>
        {q && <button type="button" onClick={() => { setQ(""); setFocused(false); onSearch?.(""); }} className="absolute right-3.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "rgba(255,255,255,0.08)" }}><X size={11} style={{ color: "#64748B" }}/></button>}
      </div>
      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 rounded-2xl z-[120] overflow-y-auto"
          style={{ background: "rgba(10,24,40,0.99)", border: `1px solid ${cardBorder}`, boxShadow: "0 20px 48px rgba(0,0,0,0.75)", backdropFilter: "blur(16px)", maxHeight: "220px" }}>
          {suggestions.map(s => (
            <button key={s} onMouseDown={(e) => { e.preventDefault(); go(s); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-white/[0.04]">
              <Search size={12} style={{ color: "#2D4060" }}/>
              <span className="text-sm" style={{ color: "#94A3B8" }}>{s}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceThumbnail({ r }: { r: any }) {
  const src = r.thumbnailUrl || r.thumbnailLink || r.generatedThumbnailUrl || r.autoThumbnailUrl || r.thumb || r.thumbnail || "";
  const url = getResourceUrl(r);
  const isVideo = String(r.type || "").toLowerCase() === "video";
  const canUseVideoPreview = isVideo && url && /\.(mp4|webm|mov)(\?|#|$)/i.test(String(url));

  if (src && !isLegacyPlaceholderThumb(src)) {
    return <img src={src} alt={r.title} className="w-full h-full object-cover" style={{ background: "#111C30" }}/>;
  }

  if (canUseVideoPreview) {
    return (
      <video
        src={url}
        muted
        playsInline
        preload="metadata"
        className="w-full h-full object-cover"
        style={{ background: "#111C30" }}
      />
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg,#0D1829,#111C30)" }}>
      <Video size={28} style={{ color: "#3D5270" }}/>
    </div>
  );
}

// ─── Resource Card (no instructor) ─────────────────────────────────────────
function ResourceCard({ r, compact = false }: { r: any; compact?: boolean }) {
  const cfg = RESOURCE_TYPE_CONFIG[(r.type || "video") as ResourceType] || RESOURCE_TYPE_CONFIG.video;
  const canOpen = !!getResourceUrl(r);
  return (
    <GlassCard className={`overflow-hidden group ${compact ? "w-52 flex-shrink-0" : ""}`} onClick={canOpen ? () => openExternalResource(r) : undefined}>
      <div className="relative" style={{ height: compact ? 112 : 144 }}>
        <ResourceThumbnail r={r} />
        <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(8,15,28,0.88) 0%, transparent 55%)" }}/>
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1 px-2 py-1 rounded-lg"
          style={{ background: `${cfg.color}22`, border: `1px solid ${cfg.color}30`, backdropFilter: "blur(6px)" }}>
          <cfg.icon size={11} style={{ color: cfg.color }}/><span className="text-xs font-medium" style={{ color: cfg.color, fontSize: "10px" }}>{cfg.label}</span>
        </div>
        {r.new && <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: `${gold}22`, color: gold, border: `1px solid ${gold}35`, fontSize: "9px" }}>NEW</div>}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300" style={{ background: "rgba(0,0,0,0.35)" }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.95)", boxShadow: `0 0 24px ${gold}45` }}>
            {r.type === "video" || r.type === "3d" ? <Play size={16} style={{ color: navy }} className="ml-0.5"/> : <Eye size={16} style={{ color: navy }}/>}          
          </div>
        </div>
        <div className="absolute bottom-2 left-2.5 right-2.5 flex items-end justify-between">
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "rgba(8,15,28,0.8)", color: "#64748B", backdropFilter: "blur(4px)", fontSize: "10px" }}>{r.equipment || r.category || "General"}</span>
          <span className="text-xs" style={{ color: "#64748B", fontSize: "10px" }}>{r.duration || r.dur || r.size || "Open"}</span>
        </div>
      </div>
      <div className="p-3">
        <p className={`font-semibold leading-snug mb-2 line-clamp-2 ${compact ? "text-xs" : "text-sm"}`}>{r.title}</p>
        <Pill text={r.difficulty || r.level || "Beginner"}/>
      </div>
    </GlassCard>
  );
}

function toPublicAssetSrc(path: any) {
  const value = String(path || "").trim();
  if (!value) return "";
  if (/^(https?:|data:|blob:)/i.test(value)) return value;
  if (value.startsWith("./") || value.startsWith("/")) return value;
  return `./${value}`;
}

function normalizeEquipmentItem(eq: any) {
  return {
    id: eq.id,
    name: eq.name || eq.label || "Untitled Equipment",
    label: eq.label || eq.name || "Untitled Equipment",
    category: eq.category || eq.cat || "General",
    cat: eq.cat || eq.category || "General",
    tag: eq.tag || eq.equipmentTag || "No Tag",
    description: eq.description || "No description available yet.",
    status: eq.status || (eq.live === false ? "Inactive" : "Active"),
    live: eq.live !== false && eq.status !== "Inactive",
    videos: Number(eq.videos || 0),
    docs: Number(eq.docs || 0),
    icon: eq.icon || eq.iconPath || "",
    color: eq.color || "#3B82F6",
  };
}

function equipmentIconNode(eq: any, size = 17) {
  const iconValue = eq?.icon || eq?.iconPath || "";
  if (typeof iconValue === "function") {
    const IconComponent = iconValue;
    return <IconComponent size={size} style={{ color: eq?.color || "#3B82F6" }} />;
  }
  const iconSrc = toPublicAssetSrc(iconValue);
  if (iconSrc) {
    return <img src={iconSrc} alt={eq?.name || eq?.label || "Equipment icon"} style={{ width:size, height:size, objectFit:"contain", display:"block" }} onError={(e)=>{ e.currentTarget.style.display="none"; }} />;
  }
  return <Cpu size={size} style={{ color:eq?.color || "#3B82F6" }} />;
}

// ─── HOME PAGE ──────────────────────────────────────────────────────────────
function HomePage({
  setNav,
  firebaseEquipment,
  firebaseVideos,
  firebaseDocuments,
  homepageSettings,
  heroHotspots,
  onGlobalSearch,
  onHeroHotspot,
}: {
  setNav: (n: NavId) => void;
  firebaseEquipment: any[];
  firebaseVideos: any[];
  firebaseDocuments: any[];
  homepageSettings: any[];
  heroHotspots: any[];
  onGlobalSearch: (q:string)=>void;
  onHeroHotspot: (hotspot:any)=>void;
}) {

  const resourceData = buildResourceData(firebaseVideos, []).filter((r:any) => r.type === "video");
  const homepage = getHomepageConfig(homepageSettings);
  const popularTechnicalVideos = getPopularTechnicalVideos(resourceData, homepage).slice(0, homepage.popularCount);
  const [ready, setReady] = useState(false);
  useEffect(() => { const t = setTimeout(() => setReady(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="flex flex-col pb-8">
      {/* ─ Hero ─ */}
      <div className="relative overflow-hidden px-4 pt-6 pb-8"
        style={{ background: `linear-gradient(165deg, ${navy} 0%, #0A1525 55%, ${navy} 100%)` }}>
        <div className="absolute inset-0 pointer-events-none opacity-[0.032]"
          style={{ backgroundImage: "linear-gradient(#4B72A0 1px,transparent 1px),linear-gradient(90deg,#4B72A0 1px,transparent 1px)", backgroundSize: "36px 36px" }}/>
        <div className="absolute top-0 right-0 w-80 h-80 pointer-events-none" style={{ background: "radial-gradient(ellipse at top right,rgba(59,130,246,0.07) 0%,transparent 65%)" }}/>
        <div className="absolute bottom-0 left-0 w-60 h-60 pointer-events-none" style={{ background: `radial-gradient(ellipse at bottom left,${gold}08 0%,transparent 65%)` }}/>

        {/* Badge */}
        <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full mb-5 text-xs font-semibold tracking-widest uppercase transition-all duration-500 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`}
          style={{ background: `${gold}0E`, border: `1px solid ${gold}22`, color: gold }}>
          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/>{homepage.badge}
        </div>

        {/* Title */}
        <div className={`mb-3 transition-all duration-500 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "70ms" }}>
          <h1 className="text-[2.6rem] font-bold leading-tight" style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.02em" }}>
            {homepage.title.includes("FALTAH") ? homepage.title.split("FALTAH")[0].trim() || "Welcome to" : homepage.title}{" "}
            {homepage.title.includes("FALTAH") && <span style={{ background: `linear-gradient(135deg,${gold} 0%,#F0C84A 50%,${gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FALTAH</span>}
          </h1>
          <h2 className="text-lg font-light" style={{ color: "#4A6A8A", fontFamily: "'Rajdhani',sans-serif" }}>{homepage.subtitle}</h2>
        </div>

        {/* Pillars */}
        <div className={`flex items-center gap-4 mb-6 transition-all duration-500 ${ready ? "opacity-100" : "opacity-0"}`} style={{ transitionDelay: "130ms" }}>
          {["Search", "Learn", "Apply", "Excel"].map((t, i) => (
            <div key={t} className="flex items-center gap-1.5 text-xs" style={{ color: "#3D5270" }}>
              {i > 0 && <span className="w-1 h-1 rounded-full" style={{ background: "#1E3050" }}/>}
              <span>{t}</span>
            </div>
          ))}
        </div>

        {/* Hydrocarbon facility hero with CMS-managed interactive hotspots */}
        <div className="relative w-full h-[230px] sm:h-[240px] mb-5 rounded-2xl overflow-hidden" style={{ border:"1px solid rgba(59,130,246,0.18)", background:"#050D1A", boxShadow:"0 18px 44px rgba(0,0,0,0.32)" }}>
          <img src="./faltah-hydrocarbon-facility-hero.webp" alt="Interactive FALTAH hydrocarbon facility" className="absolute inset-0 w-full h-full object-cover object-[15%_16%] pointer-events-none" />
          <div className="absolute inset-0 pointer-events-none" style={{ background:"linear-gradient(180deg,rgba(4,13,29,0.02),rgba(4,13,29,0.12))" }}/>
          {((heroHotspots && heroHotspots.length) ? heroHotspots : DEFAULT_HERO_HOTSPOTS).filter((h:any)=>h.live !== false).sort((a:any,b:any)=>Number(a.order||9999)-Number(b.order||9999)).map((h:any)=><button key={h.id || h.label} type="button" onClick={()=>onHeroHotspot(h)} className="absolute -translate-x-1/2 -translate-y-1/2 group" style={{ left:`${Number(h.x ?? 50)}%`, top:`${Number(h.y ?? 50)}%` }} aria-label={`Explore ${h.label}`}>
            <span className="relative flex w-5 h-5 items-center justify-center"><span className="absolute inset-0 rounded-full animate-ping opacity-40" style={{ background:h.color || gold }}/><span className="relative w-3 h-3 rounded-full border-2" style={{ background:"#08111F", borderColor:h.color || gold, boxShadow:`0 0 14px ${h.color || gold}` }}/></span>
            <span className="absolute left-1/2 top-6 -translate-x-1/2 whitespace-nowrap px-2 py-1 rounded-lg text-[9px] font-bold opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity" style={{ background:"rgba(5,13,27,.92)", color:h.color || gold, border:`1px solid ${h.color || gold}55` }}>{h.label}</span>
          </button>)}
        </div>

        {/* Search */}
        <div className={`relative z-[80] mb-5 transition-all duration-500 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"}`} style={{ transitionDelay: "280ms" }}>
          <SmartSearch onSubmit={(q)=>{ if(q.trim()) onGlobalSearch(q.trim()); }}/>
        </div>

        {/* 3 CTAs */}
        <div className={`relative z-0 flex flex-col gap-3 transition-all duration-500 ${ready ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`} style={{ transitionDelay: "340ms" }}>
          <button onClick={() => setNav("tree")}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl text-sm font-bold tracking-wide transition-all duration-200 active:scale-[0.97]"
            style={{ background: `linear-gradient(135deg,${gold},#C49B28)`, color: navy, boxShadow: `0 4px 24px ${gold}28` }}
            onMouseEnter={e => (e.currentTarget.style.boxShadow = `0 6px 28px ${gold}45`)}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = `0 4px 24px ${gold}28`)}>
            <TreePine size={16}/> Explore Knowledge Tree
          </button>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setNav("library")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
              style={{ background: "rgba(59,130,246,0.09)", color: "#60A5FA", border: "1px solid rgba(59,130,246,0.2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.16)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(59,130,246,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(59,130,246,0.09)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <BookOpen size={15}/> Knowledge Library
            </button>
            <button onClick={() => setNav("ai")}
              className="flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
              style={{ background: "rgba(139,92,246,0.09)", color: "#A78BFA", border: "1px solid rgba(139,92,246,0.2)" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.16)"; (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(139,92,246,0.15)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(139,92,246,0.09)"; (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}>
              <MessageSquare size={15}/> Ask FALTAH AI
            </button>
          </div>
          <IntroVideoCard />
        </div>
      </div>

      {/* Stats — 2 only */}
      <div className="grid grid-cols-2 gap-3 px-4 mt-5">
      {[
  {
    label: "Equipment Items",
    value: firebaseEquipment.length > 0
      ? firebaseEquipment.length
      : equipment.length,
    icon: Cpu,
    color: "#3B82F6"
  },
  {
    label: "Technical Videos",
    value: resourceData.filter(r => r.type === "video").length,
    icon: Video,
    color: gold
  }
].map(s => (
          <GlassCard key={s.label} className="p-4" accent={s.color}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `${s.color}12`, border: `1px solid ${s.color}22` }}>
              <s.icon size={18} style={{ color: s.color }}/>
            </div>
            <div className="text-2xl font-bold mb-0.5" style={{ fontFamily: "'Rajdhani',sans-serif" }}><AnimatedCount to={s.value}/></div>
            <div className="text-xs" style={{ color: "#3D5270" }}>{s.label}</div>
          </GlassCard>
        ))}
      </div>

      {/* Recently Added */}
      <div className="mt-8">
        <SectionHead title="Recently Added" action="See all" onAction={() => setNav("library")}/>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {resourceData.filter(r => r.new).slice(0, homepage.recentCount).map(r => <div key={r.id} className="flex-shrink-0 w-52"><ResourceCard r={r} compact/></div>)}
        </div>
      </div>

      {/* Popular Videos */}
      <div className="mt-8">
        <SectionHead title="Popular Technical Videos" action="See all" onAction={() => setNav("library")}/>
        <div className="flex gap-3 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
          {popularTechnicalVideos.map((r:any) => <div key={r.id} className="flex-shrink-0 w-52"><ResourceCard r={r} compact/></div>)}
        </div>
      </div>
    </div>
  );
}

// ─── KNOWLEDGE TREE ─────────────────────────────────────────────────────────
function KnowledgeTree({ firebaseCategories, firebaseEquipment, firebaseVideos, firebaseDocuments, initialEquipmentId = "", onInitialEquipmentConsumed }: { firebaseCategories: any[]; firebaseEquipment: any[]; firebaseVideos: any[]; firebaseDocuments: any[]; initialEquipmentId?: string; onInitialEquipmentConsumed?: () => void }) {
  const [view, setView] = useState<TreeView>({ level: "root" });
  const [expandedDomains, setExpandedDomains] = useState<string[]>([]);
  const [expandedSubs, setExpandedSubs] = useState<string[]>([]);
  const [activeItemTab, setActiveItemTab] = useState("Videos");
  const domains = buildTreeDomains(firebaseCategories, firebaseEquipment);
  const resourceData = buildResourceData(firebaseVideos, firebaseDocuments);

  const toggleDomain = (id: string) => setExpandedDomains(p => p.includes(id) ? p.filter(e => e !== id) : [...p, id]);
  const toggleSub = (id: string) => setExpandedSubs(p => p.includes(id) ? p.filter(e => e !== id) : [...p, id]);

  useEffect(() => {
    const targetId = String(initialEquipmentId || "").trim().toLowerCase();
    if (!targetId) return;

    for (const domain of domains) {
      const directItem = (domain.directItems || []).find((item:any) => String(item.id || "").trim().toLowerCase() === targetId);
      if (directItem) {
        setView({ level:"item", domainId:String(domain.id), subId:"__direct__", itemId:String(directItem.id) });
        setExpandedDomains(prev => prev.includes(String(domain.id)) ? prev : [...prev, String(domain.id)]);
        setActiveItemTab("Videos");
        onInitialEquipmentConsumed?.();
        return;
      }

      for (const sub of domain.subs || []) {
        const nestedItem = (sub.items || []).find((item:any) => String(item.id || "").trim().toLowerCase() === targetId);
        if (nestedItem) {
          setView({ level:"item", domainId:String(domain.id), subId:String(sub.id), itemId:String(nestedItem.id) });
          setExpandedDomains(prev => prev.includes(String(domain.id)) ? prev : [...prev, String(domain.id)]);
          setExpandedSubs(prev => prev.includes(String(sub.id)) ? prev : [...prev, String(sub.id)]);
          setActiveItemTab("Videos");
          onInitialEquipmentConsumed?.();
          return;
        }
      }
    }

    // The linked equipment may be inactive or no longer assigned to a visible tree category.
    // Clear the one-time request and leave the user at the Knowledge Tree root.
    setView({ level:"root" });
    onInitialEquipmentConsumed?.();
  }, [initialEquipmentId, domains, onInitialEquipmentConsumed]);

  if (view.level === "item") {
    const domain = domains.find(d => d.id === view.domainId) || domains[0];
    const isDirectItem = view.subId === "__direct__";
    const sub = isDirectItem ? null : domain?.subs.find((s:any) => s.id === view.subId);
    const item = isDirectItem
      ? domain?.directItems?.find((i:any) => i.id === view.itemId)
      : sub?.items.find((i:any) => i.id === view.itemId);
    const selectedItem = item || { label: "Knowledge Item" };
    const itemKey = String(selectedItem.id || "").trim().toLowerCase();
    const itemNames = [selectedItem.label, (selectedItem as any).name, (selectedItem as any).tag].map((v:any)=>String(v||"").trim().toLowerCase()).filter(Boolean);
    const related = resourceData.filter((r:any) => {
      if (r.type !== "video") return false;
      const linkedId = String(r.equipmentId || r.equipmentDocId || "").trim().toLowerCase();
      if (linkedId) return linkedId === itemKey;
      const linkedName = String(r.equipment || r.equip || r.equipmentName || "").trim().toLowerCase();
      return itemNames.includes(linkedName);
    });
    const videosForItem = related.filter((r:any) => r.type === "video");
    return (
      <div className="flex flex-col pb-8">
        <div className="px-4 pt-2 pb-3"><button onClick={() => setView({ level: "root" })} className="flex items-center gap-2 text-sm" style={{ color: "#3D5270" }}><ChevronLeft size={16}/> Knowledge Tree</button></div>
        <div className="mx-4 mb-4 p-4 rounded-2xl" style={{ background: `${domain.color}08`, border: `1px solid ${domain.color}20` }}>
          <div className="flex items-center gap-2 mb-1"><div className="w-2 h-2 rounded-full" style={{ background: domain.color }}/><span className="text-xs" style={{ color: domain.color }}>{domain.label}{!isDirectItem && sub ? ` → ${sub.label}` : ""}</span></div>
          <h2 className="text-xl font-bold" style={{ fontFamily: "'Rajdhani',sans-serif" }}>{selectedItem.label}</h2>
        </div>
        <div className="flex overflow-x-auto px-4 gap-2 pb-3" style={{ scrollbarWidth: "none" }}>{ITEM_TABS.map(tab => <button key={tab} onClick={() => setActiveItemTab(tab)} className="flex-shrink-0 px-3.5 py-2 rounded-xl text-xs font-medium transition-all duration-200" style={activeItemTab === tab ? { background: domain.color, color: navy } : { background: "rgba(255,255,255,0.04)", color: "#64748B", border: `1px solid ${cardBorder}` }}>{tab}</button>)}</div>
        <div className="px-4">
          <div className="flex flex-col gap-4">{videosForItem.length ? videosForItem.map((r:any) => <ResourceCard key={r.id} r={r}/>) : <GlassCard className="p-5 text-center"><Video size={22} className="mx-auto mb-2" style={{ color:"#3B82F6", opacity:0.55 }}/><p className="text-sm" style={{ color:"#64748B" }}>No videos linked yet.</p></GlassCard>}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col pb-8">
      <div className="px-4 pt-2 pb-2"><div className="flex items-center gap-3 p-3.5 rounded-2xl mb-5" style={{ background: `${gold}07`, border: `1px solid ${gold}1A` }}><div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:`linear-gradient(135deg,${gold},#C49B28)` }}><Globe size={18} style={{ color:navy }}/></div><div><p className="font-bold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>FALTAH Enterprise</p><p className="text-xs" style={{ color:"#3D5270" }}>Engineering Knowledge Root</p></div></div></div>
      <div className="px-4 mb-1"><p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color:"#2D4060" }}>Active Domains</p></div>
      <div className="flex flex-col gap-2 px-4 mb-5">{domains.filter((d:any) => d.phase === 1).map((domain:any) => { const domOpen=expandedDomains.includes(domain.id); return <div key={domain.id} className="rounded-2xl overflow-hidden" style={{ background:card, border:`1px solid ${cardBorder}` }}><button className="w-full flex items-center gap-3 px-4 py-3.5" onClick={()=>toggleDomain(domain.id)}><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${domain.color}12`, border:`1px solid ${domain.color}22` }}><domain.icon size={16} style={{ color:domain.color }}/></div><span className="flex-1 text-sm font-bold text-left" style={{ fontFamily:"'Rajdhani',sans-serif", color:"#E2E8F0" }}>{domain.label}</span><span className="text-xs mr-2" style={{ color:"#2D4060" }}>{(domain.directItems?.length || 0) + domain.subs.length}</span><div className="transition-transform duration-300" style={{ transform: domOpen ? "rotate(180deg)" : "rotate(0deg)" }}><ChevronDown size={14} style={{ color:"#3D5270" }}/></div></button>{domOpen && <div className="border-t" style={{ borderColor:"rgba(255,255,255,0.04)" }}>{(domain.directItems || []).map((item:any)=><button key={item.id} onClick={()=>{ setView({ level:"item", domainId:domain.id, subId:"__direct__", itemId:item.id }); setActiveItemTab("Videos"); }} className="w-full flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.025] active:bg-white/[0.04]"><ChevronRight size={11} style={{ color:domain.color, opacity:0.65 }}/><span className="flex-1 text-sm text-left" style={{ color:"#94A3B8" }}>{item.label}</span><div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:`${domain.color}10` }}><ChevronRight size={11} style={{ color:domain.color }}/></div></button>)}{domain.subs.map((sub:any)=>{ const subOpen=expandedSubs.includes(sub.id); return <div key={sub.id}><button className="w-full flex items-center gap-3 px-5 py-3 transition-colors hover:bg-white/[0.025]" onClick={()=>toggleSub(sub.id)}><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:domain.color, opacity:0.5 }}/><sub.icon size={14} style={{ color:"#64748B" }}/><span className="flex-1 text-sm text-left" style={{ color:"#94A3B8" }}>{sub.label}</span><span className="text-xs mr-2" style={{ color:"#2D4060" }}>{sub.items.length}</span><div className="transition-transform duration-300" style={{ transform: subOpen ? "rotate(180deg)" : "rotate(0deg)" }}><ChevronDown size={12} style={{ color:"#2D4060" }}/></div></button>{subOpen && <div className="border-t" style={{ borderColor:"rgba(255,255,255,0.03)" }}>{sub.items.map((item:any)=><button key={item.id} onClick={()=>{ setView({ level:"item", domainId:domain.id, subId:sub.id, itemId:item.id }); setActiveItemTab("Videos"); }} className="w-full flex items-center gap-3 px-7 py-2.5 transition-colors hover:bg-white/[0.025] active:bg-white/[0.04]"><ChevronRight size={11} style={{ color:domain.color, opacity:0.5 }}/><span className="flex-1 text-sm text-left" style={{ color:"#64748B" }}>{item.label}</span><div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:`${domain.color}10` }}><ChevronRight size={11} style={{ color:domain.color }}/></div></button>)}</div>}</div>})}</div>}</div> })}</div>
      {domains.some((d:any) => d.phase === 2) && <><div className="px-4 mb-1"><p className="text-xs uppercase tracking-widest font-medium mb-3" style={{ color:"#1A2A3F" }}>Coming Soon</p></div><div className="flex flex-col gap-2 px-4">{domains.filter((d:any)=>d.phase===2).map((domain:any)=><div key={domain.id} className="rounded-2xl px-4 py-3.5 flex items-center gap-3 opacity-35" style={{ background:"rgba(10,18,32,0.5)", border:"1px solid rgba(255,255,255,0.04)" }}><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(255,255,255,0.04)" }}><Lock size={14} style={{ color:"#1E3050" }}/></div><span className="flex-1 text-sm font-semibold" style={{ fontFamily:"'Rajdhani',sans-serif", color:"#2D4060" }}>{domain.label}</span><span className="text-xs px-2 py-0.5 rounded-full" style={{ background:"rgba(255,255,255,0.03)", color:"#1E3050" }}>Soon</span></div>)}</div></>}
    </div>
  );
}

// ─── KNOWLEDGE LIBRARY ──────────────────────────────────────────────────────
function KnowledgeLibrary({ firebaseEquipment: _firebaseEquipment, firebaseVideos, firebaseDocuments, initialSearch = "" }: { firebaseEquipment: any[]; firebaseVideos: any[]; firebaseDocuments: any[]; initialSearch?: string }) {
  const [search, setSearch] = useState(initialSearch);
  const [diff, setDiff] = useState("All");
  const resourceData = buildResourceData(firebaseVideos, firebaseDocuments);
  const diffs = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

  const filtered = resourceData.filter((r:any) => {
    const matchType = r.type === "video";
    const matchDiff = diff === "All" || r.difficulty === diff;
    const normalizedSearch = search.trim().toLowerCase();
    const matchSearch = !normalizedSearch ||
      String(r.title || "").toLowerCase().includes(normalizedSearch) ||
      String(r.equipment || "").toLowerCase().includes(normalizedSearch) ||
      String(r.category || "").toLowerCase().includes(normalizedSearch) ||
      String(r.description || "").toLowerCase().includes(normalizedSearch);
    return matchType && matchDiff && matchSearch && r.live !== false;
  });

  return (
    <div className="flex flex-col pb-8">
      <div className="px-4 pt-2 pb-4"><SmartSearch placeholder="Search technical videos…" onSearch={setSearch} initialValue={initialSearch}/></div>
      <div className="px-4 pb-3"><div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold" style={{ background:"rgba(59,130,246,0.12)", color:"#60A5FA", border:"1px solid rgba(59,130,246,0.25)" }}><Video size={13}/> Technical Videos</div></div>
      <div className="flex gap-2 overflow-x-auto px-4 pb-4" style={{ scrollbarWidth: "none" }}>{diffs.map(d => <button key={d} onClick={()=>setDiff(d)} className="flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-all duration-200" style={diff===d ? { background:gold, color:navy } : { background:"rgba(255,255,255,0.04)", color:"#3D5270", border:`1px solid ${cardBorder}` }}>{d}</button>)}</div>
      <div className="px-4 mb-4"><p className="text-xs" style={{ color:"#2D4060" }}>{filtered.length} video{filtered.length!==1?"s":""} found</p></div>
      <div className="px-4"><SectionHead title="Video Library"/></div>
      <div className="flex flex-col gap-4 px-4">{filtered.length > 0 ? filtered.map((r:any) => <ResourceCard key={r.id} r={r}/>) : <div className="py-16 text-center"><Search size={28} className="mx-auto mb-3 opacity-20"/><p className="text-sm" style={{ color:"#2D4060" }}>No videos found</p></div>}</div>
    </div>
  );
}

// ─── INSPIRE ────────────────────────────────────────────────────────────────
const INSPIRE_THEMES = [
  "All",
  "Safety",
  "Leadership",
  "Teamwork",
  "Operational Excellence",
  "Discipline",
  "Communication",
  "Knowledge Sharing",
  "Motivation",
];

function InspirePage({ inspireVideos }: { inspireVideos: any[] }) {
  const [theme, setTheme] = useState("All");
  const [selected, setSelected] = useState<any | null>(null);
  const items = (inspireVideos || [])
    .filter((v:any) => v.live !== false)
    .map((v:any) => ({
      ...normalizeResourceItem(v, "video"),
      type: "video",
      resourceType: "inspire",
      theme: v.theme || v.category || "Motivation",
      difficulty: v.theme || v.category || "Motivation",
      equipment: v.theme || v.category || "Inspire",
    }));
  const filtered = theme === "All" ? items : items.filter((v:any) => v.theme === theme);
  const featured = filtered.find((v:any)=>v.featured) || filtered[0];

  return (
    <div className="flex flex-col pb-8">
      <div className="px-4 pt-2 pb-4">
        <div className="rounded-3xl p-5 relative overflow-hidden" style={{ background:`linear-gradient(145deg,rgba(245,158,11,0.16),rgba(18,28,46,0.94) 58%,rgba(8,15,28,0.98))`, border:"1px solid rgba(245,158,11,0.24)" }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:"rgba(245,158,11,0.14)", border:"1px solid rgba(245,158,11,0.26)" }}><Flame size={23} style={{ color:"#F59E0B" }}/></div>
            <div><p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color:"#F59E0B" }}>Inspire</p><h1 className="text-2xl font-black" style={{ fontFamily:"'Rajdhani',sans-serif" }}>Professional Shorts</h1></div>
          </div>
          <p className="text-sm leading-relaxed" style={{ color:"#94A3B8" }}>Short work-related videos covering safety, leadership, teamwork, communication, discipline, knowledge sharing, and operational excellence.</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto px-4 pb-4" style={{ scrollbarWidth:"none" }}>
        {INSPIRE_THEMES.map(t => <button key={t} onClick={()=>setTheme(t)} className="flex-shrink-0 px-3.5 py-1.5 rounded-xl text-xs font-semibold" style={theme===t ? { background:"#F59E0B", color:navy } : { background:"rgba(255,255,255,0.04)", color:"#64748B", border:`1px solid ${cardBorder}` }}>{t}</button>)}
      </div>

      {featured && <div className="px-4 mb-5"><SectionHead title="Featured Inspiration"/><GlassCard onClick={()=>setSelected(featured)} className="overflow-hidden"><div className="relative h-48"><ResourceThumbnail r={featured}/><div className="absolute inset-0" style={{ background:"linear-gradient(to top,rgba(8,15,28,0.94),transparent 60%)" }}/><div className="absolute left-4 right-4 bottom-4"><Pill text={featured.theme}/><h2 className="text-xl font-bold mt-2" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{featured.title}</h2><p className="text-xs mt-1 line-clamp-2" style={{ color:"#94A3B8" }}>{featured.description || "Professional development short video."}</p></div><div className="absolute right-4 top-4 w-11 h-11 rounded-full flex items-center justify-center" style={{ background:"rgba(245,158,11,0.92)" }}><Play size={16} style={{ color:navy }}/></div></div></GlassCard></div>}

      <div className="px-4"><SectionHead title={theme === "All" ? "Inspire Library" : theme}/><div className="flex flex-col gap-4">{filtered.length ? filtered.map((r:any)=><ResourceCard key={r.id || r.title} r={r}/>) : <GlassCard className="p-6 text-center"><Flame size={24} className="mx-auto mb-2 opacity-30"/><p className="text-sm" style={{ color:"#64748B" }}>No videos published in this category yet.</p></GlassCard>}</div></div>
      {selected && <ResourceViewer resource={selected} onClose={()=>setSelected(null)}/>} 
    </div>
  );
}

// ─── AI COMING SOON ─────────────────────────────────────────────────────────
function AIAssistant({ aiResponses }: { aiResponses: any[] }) {
  const planned = [
    "Answer engineering questions from approved FALTAH knowledge",
    "Summarize videos and equipment pages",
    "Recommend related learning resources",
    "Support troubleshooting and lessons learned",
  ];
  return (
    <div className="flex flex-col pb-8 px-4 pt-2">
      <div className="rounded-[2rem] p-5 mb-5 relative overflow-hidden" style={{ background:"linear-gradient(145deg,rgba(139,92,246,0.18),rgba(18,28,46,0.94) 58%,rgba(8,15,28,0.98))", border:"1px solid rgba(139,92,246,0.28)" }}>
        <div className="flex items-center gap-3 mb-5"><div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background:"rgba(139,92,246,0.16)", border:"1px solid rgba(139,92,246,0.30)" }}><Brain size={23} style={{ color:"#C4B5FD" }}/></div><div><p className="text-xs uppercase tracking-[0.26em] font-bold" style={{ color:gold }}>Coming Soon</p><h1 className="text-2xl font-black" style={{ fontFamily:"'Rajdhani',sans-serif" }}>Ask FALTAH AI</h1></div></div>
        <p className="text-sm leading-relaxed mb-5" style={{ color:"#CBD5E1" }}>FALTAH AI is currently under development. It will be released when it is ready to answer from approved platform knowledge rather than generic responses.</p>
        <div className="rounded-2xl px-4 py-3 mb-5" style={{ background:"rgba(212,175,55,0.08)", border:`1px solid ${gold}25` }}><div className="flex items-center gap-2"><Lock size={14} style={{ color:gold }}/><span className="text-xs uppercase tracking-widest font-bold" style={{ color:gold }}>Version 3.0 Preview</span></div><p className="text-xs mt-1" style={{ color:"#94A3B8" }}>Locked until the knowledge base and AI governance are finalized.</p></div>
        <div className="grid grid-cols-2 gap-2.5">{[{label:"Videos",icon:Video,color:"#3B82F6"},{label:"Equipment",icon:Cpu,color:gold},{label:"Knowledge Tree",icon:TreePine,color:"#8B5CF6"},{label:"Inspire",icon:Flame,color:"#F59E0B"}].map(x=><div key={x.label} className="rounded-2xl p-3" style={{ background:"rgba(255,255,255,0.035)", border:"1px solid rgba(255,255,255,0.07)" }}><x.icon size={16} style={{ color:x.color }}/><p className="text-xs font-semibold mt-2">{x.label}</p></div>)}</div>
      </div>
      <SectionHead title="Planned Features"/>
      <div className="flex flex-col gap-2.5">{planned.map((p,i)=><GlassCard key={p} className="px-4 py-3.5 flex items-center gap-3"><div className="w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background:"rgba(139,92,246,0.12)", color:"#C4B5FD" }}>{i+1}</div><p className="text-sm" style={{ color:"#CBD5E1" }}>{p}</p></GlassCard>)}</div>
      <p className="text-center text-xs mt-5" style={{ color:"#2D4060" }}>{aiResponses.filter((x:any)=>x.live!==false).length} draft AI knowledge entries are stored for future activation.</p>
    </div>
  );
}

// ─── MORE / ADMIN ────────────────────────────────────────────────────────────
// Sample data for admin previews
const SAMPLE_EQ = [
  { id: 1, name: "Centrifugal Pump",       cat: "Rotating Equipment", tag: "P-101",   videos: 4, docs: 3, live: true  },
  { id: 2, name: "Reciprocating Compressor",cat: "Rotating Equipment", tag: "K-101",   videos: 3, docs: 5, live: true  },
  { id: 3, name: "Shell & Tube HEX",       cat: "Static Equipment",   tag: "E-101",   videos: 2, docs: 4, live: true  },
  { id: 4, name: "Gate Valve",             cat: "Valves",             tag: "GV-101",  videos: 2, docs: 2, live: true  },
  { id: 5, name: "Atmospheric Tank",       cat: "Static Equipment",   tag: "TK-101",  videos: 1, docs: 3, live: false },
  { id: 6, name: "PSV / Relief Valve",     cat: "Valves",             tag: "PSV-101", videos: 3, docs: 4, live: true  },
];
const SAMPLE_VIDS = [
  { id: 1, title: "Centrifugal Pump Fundamentals",   equip: "Pumps",         dur: "18:24", live: true  },
  { id: 2, title: "Compressor Surge Control",         equip: "Compressors",   dur: "28:45", live: true  },
  { id: 3, title: "PSV Sizing — API 520",             equip: "Safety Valves", dur: "23:15", live: false },
  { id: 4, title: "HEX Fouling & Cleaning",           equip: "Heat Exchangers",dur: "24:33", live: true  },
];
const SAMPLE_DOCS = [
  { id: 1, title: "API 610 — Centrifugal Pumps",          type: "Standard", equip: "Pumps",         size: "4.2 MB" },
  { id: 2, title: "API 520 — Pressure Relieving Systems",  type: "Standard", equip: "Safety Valves", size: "2.8 MB" },
  { id: 3, title: "Pump Installation Manual",              type: "Manual",   equip: "Pumps",         size: "8.1 MB" },
  { id: 4, title: "P&ID Centrifugal Pump Package",         type: "Drawing",  equip: "Pumps",         size: "1.5 MB" },
];

function EmptyState({ label }: { label: string }) {
  return (
    <div className="text-center py-8 text-xs rounded-xl" style={{ color:"#2D4060", background:"rgba(255,255,255,0.02)", border:`1px solid ${cardBorder}` }}>
      {label}
    </div>
  );
}

function MorePage({
  isAdmin,
  setIsAdmin,
  firebaseEquipment,
  firebaseCategories,
  onEquipmentSaved,
  onEquipmentDeleted,
  onEquipmentUpdated,
  onCategorySaved,
  onCategoryDeleted,
  onCategoryUpdated,
  onCmsChanged,
}: {
  isAdmin: boolean;
  setIsAdmin: (v: boolean) => void;
  firebaseEquipment: any[];
  firebaseCategories: any[];
  onEquipmentSaved: (item: any) => Promise<void>;
  onEquipmentDeleted: (id: string) => Promise<void>;
  onEquipmentUpdated: (id: string, item: any) => Promise<void>;
  onCategorySaved: (item: any) => Promise<void>;
  onCategoryDeleted: (id: string) => Promise<void>;
  onCategoryUpdated: (id: string, item: any) => Promise<void>;
  onCmsChanged: () => Promise<void>;
}) {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [saving, setSaving] = useState(false);

  const emptyEquipmentForm = { name: "", tag: "", domainId: "", parentCategoryId: "", category: "", status: "Active", icon: "", description: "", videos: 0, docs: 0, live: true };
  const emptyCategoryForm = { name: "", description: "", color: gold, live: true, count: 0, level: "domain", parentId: "", order: 1 };
  const emptyVideoForm = { title: "", equipmentId: "", equip: "", dur: "", difficulty: "Beginner", url: "", videoFileName: "", thumbnailUrl: "", thumbnailLink: "", thumbnailSource: "", thumbnailGeneratedAt: "", views: 0, likes: 0, popular: false, featured: false, new: true, createdAt: "", live: true };
  const emptyInspireForm = { title: "", theme: "Safety", dur: "", url: "", videoFileName: "", thumbnailUrl: "", thumbnailLink: "", thumbnailSource: "", thumbnailGeneratedAt: "", description: "", featured: false, live: true, order: 1 };
  const emptyDocumentForm = { title: "", type: "Standard", equip: "", size: "", fileUrl: "", live: true };
  const emptyAiForm = { q: "", answer: "", tokens: 0, live: true };
  const emptyUserForm = { name: "", email: "", role: "Viewer", live: true };
  const emptyNotificationForm = { title: "", time: "Just now", live: true, order: 1 };
  const emptyHotspotForm = { label:"", x:50, y:50, target:"tree", equipmentId:"", color:gold, live:true, order:1 };
  const defaultHomepageForm = { title: "Welcome to FALTAH", subtitle: "Enterprise", badge: "Digital Knowledge Platform", recentCount: 4, popularCount: 4, autoUpdateRecent: true, autoUpdatePopular: true, popularMinViews: 0, popularLikeWeight: 5, popularFeaturedBoost: 250, popularRecentDays: 30, popularRecentBoost: 100, live: true };

  const [equipmentForm, setEquipmentForm] = useState<any>(emptyEquipmentForm);
  const [categoryForm, setCategoryForm] = useState<any>(emptyCategoryForm);
  const [videoForm, setVideoForm] = useState<any>(emptyVideoForm);
  const [inspireForm, setInspireForm] = useState<any>(emptyInspireForm);
  const [documentForm, setDocumentForm] = useState<any>(emptyDocumentForm);
  const [aiForm, setAiForm] = useState<any>(emptyAiForm);
  const [userForm, setUserForm] = useState<any>(emptyUserForm);
  const [notificationForm, setNotificationForm] = useState<any>(emptyNotificationForm);
  const [homepageForm, setHomepageForm] = useState<any>(defaultHomepageForm);
  const [hotspotForm, setHotspotForm] = useState<any>(emptyHotspotForm);

  const [editingEquipmentId, setEditingEquipmentId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingInspireId, setEditingInspireId] = useState<string | null>(null);
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null);
  const [editingAiId, setEditingAiId] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [editingNotificationId, setEditingNotificationId] = useState<string | null>(null);
  const [homepageDocId, setHomepageDocId] = useState<string | null>(null);
  const [editingHotspotId, setEditingHotspotId] = useState<string | null>(null);

  const [adminVideos, setAdminVideos] = useState<any[]>([]);
  const [adminInspireVideos, setAdminInspireVideos] = useState<any[]>([]);
  const [adminDocuments, setAdminDocuments] = useState<any[]>([]);
  const [adminAiResponses, setAdminAiResponses] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminNotifications, setAdminNotifications] = useState<any[]>([]);
  const [adminHeroHotspots, setAdminHeroHotspots] = useState<any[]>([]);
  const [settingsState, setSettingsState] = useState<any>({ aiAssistant: true, knowledgeTree: true, library: true, apiAccess: false });

  const normalizeEquipment = (eq: any) => ({
    id: eq.id,
    name: eq.name || eq.label || "Untitled Equipment",
    tag: eq.tag || eq.typeId || "N/A",
    domainId: eq.domainId || "",
    parentCategoryId: eq.parentCategoryId || eq.subcategoryId || "",
    category: eq.category || eq.cat || eq.categoryId || "",
    status: eq.status || (eq.live === false ? "Inactive" : "Active"),
    icon: eq.icon || "",
    description: eq.description || eq.overview || "",
    videos: Array.isArray(eq.videos) ? eq.videos.length : Number(eq.videos || 0),
    docs: Array.isArray(eq.documents) ? eq.documents.length : Number(eq.docs || 0),
    live: eq.live !== false && eq.status !== "Inactive",
  });
  const adminEquipmentData = (firebaseEquipment.length > 0 ? firebaseEquipment : equipment).map(normalizeEquipment);
  const adminCategoryData = (firebaseCategories.length > 0 ? firebaseCategories : categories).map((cat: any) => ({
    id: cat.id,
    name: cat.name || cat.label || "Untitled Category",
    label: cat.label || cat.name || "Untitled Category",
    description: cat.description || "",
    color: cat.color || gold,
    live: cat.live !== false && cat.status !== "Inactive" && cat.status !== "coming-soon",
    status: cat.status || (cat.live === false ? "Inactive" : "Active"),
    count: Array.isArray(cat.types) ? cat.types.length : Number(cat.count || 0),
    level: cat.level || cat.type || "domain",
    parentId: cat.parentId || cat.parent || "",
    order: Number(cat.order || 9999),
  })).sort((a:any,b:any)=>Number(a.order||9999)-Number(b.order||9999));
  const activeEquipmentCount = adminEquipmentData.filter((eq: any) => eq.live).length;
  const inactiveEquipmentCount = adminEquipmentData.length - activeEquipmentCount;
  const activeCategoryCount = adminCategoryData.filter((cat: any) => cat.live).length;
  const categoryParentOptions = adminCategoryData.filter((cat:any) => cat.id !== editingCategoryId && (categoryForm.level === "category" ? (cat.level === "domain" || !cat.parentId) : cat.level === "category"));
  const equipmentDomainOptions = adminCategoryData
    .filter((cat:any)=>cat.live !== false && !cat.parentId && String(cat.level || "domain") === "domain")
    .map((cat:any)=>({ value:String(cat.id), label:String(cat.label || cat.name) }));
  const equipmentSubcategoryOptions = adminCategoryData
    .filter((cat:any)=>cat.live !== false && ["category","sub"].includes(String(cat.level || "category")) && String(cat.parentId) === String(equipmentForm.domainId))
    .map((cat:any)=>({ value:String(cat.id), label:String(cat.label || cat.name) }));

  const loadAdminCollections = useCallback(async () => {
    try {
      const [v, iv, d, a, u, n, h, st, hs] = await Promise.all([
        getCmsItems("videos"),
        getCmsItems("inspireVideos"),
        getCmsItems("documents"),
        getCmsItems("aiResponses"),
        getCmsItems("users"),
        getCmsItems("notifications"),
        getCmsItems("homepageSettings"),
        getCmsItems("platformSettings"),
        getCmsItems("heroHotspots"),
      ]);
      setAdminVideos(v);
      setAdminInspireVideos(iv);
      setAdminDocuments(d);
      setAdminAiResponses(a);
      setAdminUsers(u);
      setAdminNotifications(n);
      setAdminHeroHotspots(hs);
      if (h[0]) { setHomepageDocId(h[0].id); setHomepageForm({ ...defaultHomepageForm, ...h[0] }); }
      if (st[0]) setSettingsState((prev: any) => ({ ...prev, ...st[0], id: st[0].id }));
    } catch (error) {
      console.error("Admin collections load failed:", error);
    }
  }, []);

  useEffect(() => { if (isAdmin) loadAdminCollections(); }, [isAdmin, loadAdminCollections]);

  const handleLogin = () => { if (loginPassword === "faltah2026") { setIsAdmin(true); setLoginPassword(""); setLoginError(false); setShowLogin(false); } else { setLoginError(true); } };
  const handleLogout = () => { setIsAdmin(false); setPage("dashboard"); setLoginPassword(""); };

  const up = (setter: any) => (field: string, value: any) => setter((prev: any) => ({ ...prev, [field]: value }));
  const updateEquipmentForm = up(setEquipmentForm);
  const updateCategoryForm = up(setCategoryForm);
  const updateVideoForm = up(setVideoForm);
  const updateInspireForm = up(setInspireForm);
  const updateDocumentForm = up(setDocumentForm);
  const updateAiForm = up(setAiForm);
  const updateUserForm = up(setUserForm);
  const updateNotificationForm = up(setNotificationForm);
  const updateHomepageForm = up(setHomepageForm);
  const updateHotspotForm = up(setHotspotForm);

  const saveCms = async (collectionName: string, id: string | null, payload: any) => {
    if (id) await updateCmsItem(collectionName, id, payload);
    else await addCmsItem(collectionName, payload);
    await loadAdminCollections();
    await onCmsChanged();
  };
  const deleteCms = async (collectionName: string, id: string) => { if (!id || !confirm("Delete this item?")) return; await deleteCmsItem(collectionName, id); await loadAdminCollections(); await onCmsChanged(); };
  const toggleCms = async (collectionName: string, item: any) => { if (!item.id) return; await updateCmsItem(collectionName, item.id, { ...item, live: !item.live, status: item.live ? "Inactive" : "Active" }); await loadAdminCollections(); await onCmsChanged(); };

  const startAddHotspot = () => { setEditingHotspotId(null); setHotspotForm(emptyHotspotForm); setPage("hero-hotspot-add"); };
  const startEditHotspot = (item:any) => { setEditingHotspotId(item.id || null); setHotspotForm({ ...emptyHotspotForm, ...item }); setPage("hero-hotspot-add"); };
  const handleSaveHotspot = async () => { if(!String(hotspotForm.label||"").trim()) return; setSaving(true); try { await saveCms("heroHotspots", editingHotspotId, { ...hotspotForm, label:String(hotspotForm.label).trim(), x:Number(hotspotForm.x||0), y:Number(hotspotForm.y||0), order:Number(hotspotForm.order||9999), live:hotspotForm.live!==false }); setEditingHotspotId(null); setHotspotForm(emptyHotspotForm); setPage("hero-hotspots"); } finally { setSaving(false); } };

  const startAddEquipment = () => { setEditingEquipmentId(null); setEquipmentForm(emptyEquipmentForm); setPage("equipment-add"); };
  const startEditEquipment = (eq: any) => {
    const legacyMatch = adminCategoryData.find((cat:any)=>String(cat.label || cat.name).trim().toLowerCase()===String(eq.category || eq.cat || "").trim().toLowerCase());
    const inferredDomainId = eq.domainId || (legacyMatch ? (legacyMatch.parentId || legacyMatch.id) : "");
    const inferredParentCategoryId = eq.parentCategoryId || eq.subcategoryId || (legacyMatch?.parentId ? legacyMatch.id : "");
    setEditingEquipmentId(eq.id);
    setEquipmentForm({ ...emptyEquipmentForm, ...eq, domainId:String(inferredDomainId || ""), parentCategoryId:String(inferredParentCategoryId || ""), status: eq.status || (eq.live ? "Active" : "Inactive") });
    setPage("equipment-add");
  };
  const handleSaveEquipment = async () => {
    if (!String(equipmentForm.name || "").trim() || !equipmentForm.domainId) return;
    const selectedDomain = adminCategoryData.find((cat:any)=>String(cat.id)===String(equipmentForm.domainId));
    const selectedSubcategory = adminCategoryData.find((cat:any)=>String(cat.id)===String(equipmentForm.parentCategoryId));
    setSaving(true);
    try {
      const payload = {
        ...equipmentForm,
        name: equipmentForm.name.trim(),
        domainId: String(equipmentForm.domainId),
        parentCategoryId: equipmentForm.parentCategoryId ? String(equipmentForm.parentCategoryId) : "",
        category: selectedSubcategory?.label || selectedDomain?.label || "",
        live: equipmentForm.status !== "Inactive",
        status: equipmentForm.status || "Active",
        videos: Number(equipmentForm.videos || 0),
        docs: Number(equipmentForm.docs || 0),
      };
      if (editingEquipmentId) await onEquipmentUpdated(editingEquipmentId, payload); else await onEquipmentSaved(payload);
      setPage("equipment"); setEquipmentForm(emptyEquipmentForm); setEditingEquipmentId(null);
    } finally { setSaving(false); }
  };
  const handleDeleteEquipment = async (id: string) => { if (!id || !confirm("Delete this equipment item?")) return; await onEquipmentDeleted(id); };
  const handleToggleEquipmentLive = async (eq: any) => { if (!eq.id) return; await onEquipmentUpdated(eq.id, { ...eq, live: !eq.live, status: eq.live ? "Inactive" : "Active" }); };

  const startAddCategory = () => { setEditingCategoryId(null); setCategoryForm(emptyCategoryForm); setPage("categories-add"); };
  const startEditCategory = (cat: any) => { setEditingCategoryId(cat.id); setCategoryForm({ ...emptyCategoryForm, ...cat, name: cat.name || cat.label || "" }); setPage("categories-add"); };
  const handleSaveCategory = async () => {
    if (!String(categoryForm.name || "").trim()) return;
    setSaving(true);
    try {
      const payload = { ...categoryForm, name: categoryForm.name.trim(), label: categoryForm.name.trim(), color: categoryForm.color || gold, live: categoryForm.live !== false, status: categoryForm.live === false ? "Inactive" : "Active", count: Number(categoryForm.count || 0), level: categoryForm.level || "domain", parentId: categoryForm.level === "domain" ? "" : (categoryForm.parentId || ""), order: Number(categoryForm.order || 9999) };
      if (editingCategoryId) await onCategoryUpdated(editingCategoryId, payload); else await onCategorySaved(payload);
      setPage("categories"); setCategoryForm(emptyCategoryForm); setEditingCategoryId(null);
    } finally { setSaving(false); }
  };
  const handleDeleteCategory = async (id: string) => { if (!id || !confirm("Delete this category?")) return; await onCategoryDeleted(id); };
  const handleToggleCategoryLive = async (cat: any) => { if (!cat.id) return; await onCategoryUpdated(cat.id, { ...cat, live: !cat.live, status: cat.live ? "Inactive" : "Active" }); };

  const startAddVideo = () => { setEditingVideoId(null); setVideoForm(emptyVideoForm); setPage("videos-upload"); };
  const startEditVideo = (v: any) => { setEditingVideoId(v.id); setVideoForm({ ...emptyVideoForm, ...v }); setPage("videos-upload"); };
  const handleSaveVideo = async () => {
    if (!String(videoForm.title || "").trim()) return;
    setSaving(true);
    try {
      let thumbnailLink = videoForm.thumbnailLink || videoForm.thumbnailUrl || "";
      if (!thumbnailLink && videoForm.url && /\.(mp4|mov|webm)(\?|#|$)/i.test(String(videoForm.url))) {
        try {
          thumbnailLink = await captureVideoThumbnail(String(videoForm.url));
        } catch {
          thumbnailLink = "";
        }
      }

      const selectedEquipment = adminEquipmentData.find((eq:any)=>String(eq.id)===String(videoForm.equipmentId));
      await saveCms("videos", editingVideoId, {
        ...videoForm,
        equipmentId: selectedEquipment?.id || videoForm.equipmentId || "",
        equip: selectedEquipment?.name || videoForm.equip || "",
        equipment: selectedEquipment?.name || videoForm.equip || "",
        title: videoForm.title.trim(),
        views: Number(videoForm.views || 0),
        likes: Number(videoForm.likes || 0),
        popular: videoForm.popular === true,
        featured: videoForm.featured === true,
        createdAt: videoForm.createdAt || new Date().toISOString(),
        thumbnailLink,
        thumbnailUrl: thumbnailLink,
        thumbnailSource: thumbnailLink ? (videoForm.thumbnailSource || "auto-generated-from-video") : "",
        thumbnailGeneratedAt: thumbnailLink ? (videoForm.thumbnailGeneratedAt || new Date().toISOString()) : "",
        live: videoForm.live !== false,
      });
      setVideoForm(emptyVideoForm);
      setEditingVideoId(null);
      setPage("videos");
    } finally {
      setSaving(false);
    }
  };

  const startAddInspire = () => { setEditingInspireId(null); setInspireForm(emptyInspireForm); setPage("inspire-upload"); };
  const startEditInspire = (v: any) => { setEditingInspireId(v.id); setInspireForm({ ...emptyInspireForm, ...v }); setPage("inspire-upload"); };
  const handleSaveInspire = async () => {
    if (!String(inspireForm.title || "").trim()) return;
    setSaving(true);
    try {
      let thumbnailLink = inspireForm.thumbnailLink || inspireForm.thumbnailUrl || "";
      if (!thumbnailLink && inspireForm.url && /\.(mp4|mov|webm)(\?|#|$)/i.test(String(inspireForm.url))) {
        try { thumbnailLink = await captureVideoThumbnail(String(inspireForm.url)); } catch { thumbnailLink = ""; }
      }
      await saveCms("inspireVideos", editingInspireId, { ...inspireForm, title: inspireForm.title.trim(), type:"video", resourceType:"inspire", category: inspireForm.theme, difficulty: inspireForm.theme, thumbnailLink, thumbnailUrl: thumbnailLink, live: inspireForm.live !== false, order: Number(inspireForm.order || 9999) });
      setInspireForm(emptyInspireForm); setEditingInspireId(null); setPage("inspire");
    } finally { setSaving(false); }
  };

  const startAddDocument = () => { setEditingDocumentId(null); setDocumentForm(emptyDocumentForm); setPage("documents-upload"); };
  const startEditDocument = (d: any) => { setEditingDocumentId(d.id); setDocumentForm({ ...emptyDocumentForm, ...d }); setPage("documents-upload"); };
  const handleSaveDocument = async () => { if (!String(documentForm.title || "").trim()) return; setSaving(true); try { await saveCms("documents", editingDocumentId, { ...documentForm, title: documentForm.title.trim(), live: documentForm.live !== false }); setDocumentForm(emptyDocumentForm); setEditingDocumentId(null); setPage("documents"); } finally { setSaving(false); } };

  const startAddAi = () => { setEditingAiId(null); setAiForm(emptyAiForm); setPage("ai-upload"); };
  const startEditAi = (a: any) => { setEditingAiId(a.id); setAiForm({ ...emptyAiForm, ...a }); setPage("ai-upload"); };
  const handleSaveAi = async () => { if (!String(aiForm.q || "").trim()) return; setSaving(true); try { await saveCms("aiResponses", editingAiId, { ...aiForm, q: aiForm.q.trim(), tokens: Number(aiForm.tokens || 0), live: aiForm.live !== false }); setAiForm(emptyAiForm); setEditingAiId(null); setPage("ai-responses"); } finally { setSaving(false); } };

  const startAddUser = () => { setEditingUserId(null); setUserForm(emptyUserForm); setPage("users-add"); };
  const startEditUser = (u: any) => { setEditingUserId(u.id); setUserForm({ ...emptyUserForm, ...u }); setPage("users-add"); };
  const handleSaveUser = async () => { if (!String(userForm.email || "").trim()) return; setSaving(true); try { await saveCms("users", editingUserId, { ...userForm, live: userForm.live !== false }); setUserForm(emptyUserForm); setEditingUserId(null); setPage("users"); } finally { setSaving(false); } };

  const startAddNotification = () => { setEditingNotificationId(null); setNotificationForm(emptyNotificationForm); setPage("notifications-add"); };
  const startEditNotification = (n: any) => { setEditingNotificationId(n.id); setNotificationForm({ ...emptyNotificationForm, ...n, title: n.title || n.message || "" }); setPage("notifications-add"); };
  const handleSaveNotification = async () => { if (!String(notificationForm.title || "").trim()) return; setSaving(true); try { await saveCms("notifications", editingNotificationId, { ...notificationForm, title: notificationForm.title.trim(), live: notificationForm.live !== false, order: Number(notificationForm.order || 9999) }); setNotificationForm(emptyNotificationForm); setEditingNotificationId(null); setPage("notifications"); } finally { setSaving(false); } };

  const handleSaveHomepage = async () => { setSaving(true); try { await setCmsDocument("homepageSettings", "main", homepageForm); setHomepageDocId("main"); await loadAdminCollections(); await onCmsChanged(); setPage("homepage"); } finally { setSaving(false); } };
  const toggleSetting = async (key: string) => {
    const next = { ...settingsState, [key]: !settingsState[key] };
    setSettingsState(next);
    const { id, ...payload } = next;
    await setCmsDocument("platformSettings", "main", payload);
    setSettingsState({ ...next, id: "main" });
    await onCmsChanged();
  };

  const BackBtn = ({ to = "dashboard" as AdminPage, label = "Admin Panel" }) => <button onClick={() => setPage(to)} className="flex items-center gap-2 text-sm mb-4" style={{ color: "#3D5270" }}><ChevronLeft size={16}/> {label}</button>;
  const SH = ({ icon: Icon, title, color, action, onAction }: { icon: any; title: string; color: string; action?: string; onAction?: () => void }) => <div className="flex items-center justify-between mb-5"><div className="flex items-center gap-2.5"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}14`, border: `1px solid ${color}25` }}><Icon size={16} style={{ color }}/></div><h2 className="font-bold text-sm" style={{ fontFamily: "'Rajdhani',sans-serif", color: "#E2E8F0", letterSpacing: "0.06em" }}>{title.toUpperCase()}</h2></div>{action && <button onClick={onAction} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all active:scale-[0.96]" style={{ background: `linear-gradient(135deg,${gold},#C49B28)`, color: navy }}><Plus size={12}/> {action}</button>}</div>;
  const StatusBadge = ({ live }: { live: boolean }) => <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: live ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.1)", color: live ? "#10B981" : "#EF4444", border: `1px solid ${live ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.2)"}` }}>{live ? "Live" : "Off"}</span>;
  const Toggle = ({ on = true }) => <div className="w-10 h-5 rounded-full flex items-center px-0.5 flex-shrink-0 cursor-pointer" style={{ background: on ? "#10B981" : "#334155" }}><div className="w-4 h-4 rounded-full bg-white transition-all" style={{ marginLeft: on ? "auto" : 0, boxShadow: "0 1px 3px rgba(0,0,0,0.4)" }}/></div>;
  const Field = ({ label, value, onChange, placeholder, type = "text" }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string; type?: string }) => <div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label><input type={type} value={value ?? ""} onChange={e=>onChange(type === "number" ? Number(e.target.value) : e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background: "rgba(8,15,28,0.8)", border: `1px solid ${cardBorder}`, color: "#E2E8F0" }}/></div>;
  const Area = ({ label, value, onChange, placeholder }: { label: string; value: any; onChange: (v: any) => void; placeholder?: string }) => <div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color: "#64748B" }}>{label}</label><textarea rows={3} value={value ?? ""} onChange={e=>onChange(e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none" style={{ background: "rgba(8,15,28,0.8)", border: `1px solid ${cardBorder}`, color: "#E2E8F0" }}/></div>;

  const FormActions = ({ cancelTo, onSave, disabled }: { cancelTo: AdminPage; onSave: () => void; disabled?: boolean }) => <div className="flex gap-3 mt-2"><button onClick={() => setPage(cancelTo)} className="flex-1 py-3 rounded-2xl text-sm font-medium" style={{ background:"rgba(255,255,255,0.05)", color:"#64748B" }}>Cancel</button><button onClick={onSave} disabled={saving || disabled} className="flex-1 py-3 rounded-2xl text-sm font-bold disabled:opacity-50" style={{ background:`linear-gradient(135deg,${gold},#C49B28)`, color:navy }}>{saving ? "Saving..." : "Save"}</button></div>;

  const renderAdminLogin = () => !isAdmin ? <div className="flex flex-col pb-8 px-4 pt-2"><GlassCard className="p-4 mb-4" accent={gold} onClick={() => setPage("about")}><div className="flex items-center gap-3"><FaltahCharacter size={54}/><div className="flex-1"><p className="text-sm font-bold">About FALTAH</p><p className="text-xs" style={{ color:"#64748B" }}>Intro video, vision, and how to use the platform</p></div><ChevronRight size={16} style={{ color:"#2D4060" }}/></div></GlassCard><div className="mb-5">{!showLogin ? <button onClick={()=>setShowLogin(true)} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-semibold transition-all duration-200 active:scale-[0.97]" style={{ background:"rgba(255,255,255,0.04)", color:"#3D5270", border:`1px solid ${cardBorder}` }}><LogIn size={15}/> Admin Login</button> : <GlassCard className="p-4"><p className="text-sm font-semibold mb-3">Admin Login</p><input type="password" value={loginPassword} onChange={e=>setLoginPassword(e.target.value)} onKeyDown={e=>{ if(e.key === "Enter") handleLogin(); }} placeholder="Enter admin password" className="w-full px-4 py-3 rounded-xl text-sm outline-none mb-3" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${loginError ? "#EF4444" : cardBorder}`, color:"#E2E8F0" }}/>{loginError && <p className="text-xs mb-3" style={{ color:"#EF4444" }}>Incorrect password.</p>}<button onClick={handleLogin} className="w-full py-3 rounded-xl text-sm font-bold" style={{ background:`linear-gradient(135deg,${gold},#C49B28)`, color:navy }}>Login</button></GlassCard>}</div></div> : null;
  if (!isAdmin && page === "about") return <AboutFaltahPage onBack={() => setPage("dashboard")} />;
  if (!isAdmin) return renderAdminLogin();

  if (page === "hero-hotspots") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={MapPin} title="Hero Hotspots" color={gold} action="Add" onAction={startAddHotspot}/><GlassCard className="p-4 mb-4"><p className="text-xs leading-relaxed" style={{color:"#94A3B8"}}>Positions use percentages. X moves left/right and Y moves up/down over the facility image.</p></GlassCard><div className="flex flex-col gap-2.5">{(adminHeroHotspots.length ? adminHeroHotspots : DEFAULT_HERO_HOTSPOTS).sort((a:any,b:any)=>Number(a.order||9999)-Number(b.order||9999)).map((h:any)=><GlassCard key={h.id} className="p-4"><div className="flex items-start gap-3"><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{background:`${h.color||gold}18`}}><MapPin size={15} style={{color:h.color||gold}}/></div><div className="flex-1"><p className="text-sm font-semibold">{h.label}</p><p className="text-xs" style={{color:"#3D5270"}}>X {h.x}% · Y {h.y}% · {h.target || "tree"}</p></div><button onClick={()=>toggleCms("heroHotspots",h)}><Toggle on={h.live!==false}/></button></div><div className="flex gap-1.5 mt-3"><button onClick={()=>startEditHotspot(h)} className="flex-1 py-1.5 rounded-xl text-xs" style={{background:"rgba(255,255,255,.05)",color:"#94A3B8"}}>Edit</button><button disabled={!h.id} onClick={()=>h.id&&deleteCms("heroHotspots",h.id)} className="flex-1 py-1.5 rounded-xl text-xs disabled:opacity-30" style={{background:"rgba(239,68,68,.08)",color:"#EF4444"}}>Delete</button></div></GlassCard>)}</div></div>;
  if (page === "hero-hotspot-add") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="hero-hotspots" label="Hero Hotspots"/><SH icon={MapPin} title={editingHotspotId?"Edit Hotspot":"Add Hotspot"} color={gold}/><GlassCard className="p-4 mb-4"><AdminField label="Label" value={hotspotForm.label} onChange={v=>updateHotspotForm("label",v)} placeholder="Pump"/><AdminField label="X Position (%)" type="number" value={hotspotForm.x} onChange={v=>updateHotspotForm("x",v)} placeholder="50"/><AdminField label="Y Position (%)" type="number" value={hotspotForm.y} onChange={v=>updateHotspotForm("y",v)} placeholder="50"/><AdminSelect label="Open" value={hotspotForm.target} onChange={v=>updateHotspotForm("target",v)} options={[{value:"tree",label:"Knowledge Tree"},{value:"library",label:"Library"}]}/><AdminSelect label="Linked Equipment (optional)" value={hotspotForm.equipmentId} onChange={v=>updateHotspotForm("equipmentId",v)} options={adminEquipmentData.map((eq:any)=>({value:String(eq.id),label:eq.name}))} placeholder="Select equipment"/><AdminField label="Color" value={hotspotForm.color} onChange={v=>updateHotspotForm("color",v)} placeholder="#D4AF37"/><AdminField label="Order" type="number" value={hotspotForm.order} onChange={v=>updateHotspotForm("order",v)} placeholder="1"/><div className="flex items-center justify-between"><span className="text-xs" style={{color:"#64748B"}}>Live</span><button onClick={()=>updateHotspotForm("live",!hotspotForm.live)}><Toggle on={hotspotForm.live!==false}/></button></div></GlassCard><FormActions cancelTo="hero-hotspots" onSave={handleSaveHotspot} disabled={!String(hotspotForm.label||"").trim()}/></div>;

  if (page === "equipment") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Cpu} title="Equipment" color="#3B82F6" action="Add New" onAction={startAddEquipment}/><div className="flex gap-2.5 mb-4">{[{ v:String(adminEquipmentData.length),l:"Total",c:"#3B82F6" },{v:String(activeEquipmentCount),l:"Active",c:"#10B981"},{v:String(inactiveEquipmentCount),l:"Off",c:"#EF4444"}].map(s=><div key={s.l} className="flex-1 p-3 rounded-2xl text-center" style={{ background:card, border:`1px solid ${s.c}20` }}><div className="text-xl font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", color:s.c }}>{s.v}</div><div className="text-xs" style={{ color:"#3D5270" }}>{s.l}</div></div>)}</div><div className="flex flex-col gap-2.5">{adminEquipmentData.map((eq:any)=><GlassCard key={eq.id} className="p-4"><div className="flex items-start gap-3 mb-3"><div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:"rgba(59,130,246,0.1)", border:"1px solid rgba(59,130,246,0.2)" }}>{equipmentIconNode(eq,18)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-0.5 flex-wrap"><p className="text-sm font-semibold">{eq.name}</p><StatusBadge live={eq.live}/></div><p className="text-xs" style={{ color:"#3D5270" }}>{eq.tag} · {eq.category}</p></div><button onClick={()=>handleToggleEquipmentLive(eq)}><Toggle on={eq.live}/></button></div><div className="flex gap-1.5"><button onClick={()=>startEditEquipment(eq)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(255,255,255,0.05)", color:"#94A3B8" }}>Edit</button><button onClick={()=>handleDeleteEquipment(eq.id)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></div></GlassCard>)}</div></div>;
  if (page === "equipment-add") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="equipment" label="Equipment"/><SH icon={Cpu} title={editingEquipmentId ? "Edit Equipment" : "Add Equipment"} color="#3B82F6"/><GlassCard className="p-4 mb-4"><AdminField label="Name" value={equipmentForm.name} onChange={v=>updateEquipmentForm("name", v)} placeholder="Gas Detector"/><AdminField label="Tag" value={equipmentForm.tag} onChange={v=>updateEquipmentForm("tag", v)} placeholder="GD-001"/><AdminSelect label="Main Domain" value={equipmentForm.domainId} onChange={v=>setEquipmentForm((prev:any)=>({ ...prev, domainId:v, parentCategoryId:"" }))} options={equipmentDomainOptions} placeholder="Select main domain"/><AdminSelect label="Subcategory — Optional" value={equipmentForm.parentCategoryId} onChange={v=>updateEquipmentForm("parentCategoryId", v)} options={[{ value:"", label:"None — show directly under domain" }, ...equipmentSubcategoryOptions]} placeholder="None — show directly under domain"/><AdminField label="Icon / Path" value={equipmentForm.icon} onChange={v=>updateEquipmentForm("icon", v)} placeholder="icons/equipment/gas-detector.svg"/><AdminArea label="Description" value={equipmentForm.description} onChange={v=>updateEquipmentForm("description", v)} placeholder="Short description"/><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Active</span><button onClick={()=>updateEquipmentForm("status", equipmentForm.status === "Inactive" ? "Active" : "Inactive")}><Toggle on={equipmentForm.status !== "Inactive"}/></button></div></GlassCard><FormActions cancelTo="equipment" onSave={handleSaveEquipment} disabled={!equipmentForm.name.trim() || !equipmentForm.domainId}/></div>;

  if (page === "tree") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={TreePine} title="Knowledge Tree" color="#10B981" action="Add Category" onAction={startAddCategory}/><div className="flex gap-2 mb-4"><button onClick={startAddCategory} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background:"rgba(16,185,129,0.1)", color:"#10B981", border:"1px solid rgba(16,185,129,0.25)" }}>+ Category</button><button onClick={startAddEquipment} className="flex-1 py-2.5 rounded-xl text-xs font-semibold" style={{ background:"rgba(212,175,55,0.1)", color:gold, border:`1px solid ${gold}30` }}>+ Equipment</button></div>{adminCategoryData.map((cat:any)=><GlassCard key={cat.id || cat.label} className="mb-3 overflow-hidden"><div className="flex items-center gap-3 px-4 py-3.5 border-b" style={{ borderColor:"rgba(255,255,255,0.05)" }}><div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background:`${cat.color}12` }}><Layers size={15} style={{ color:cat.color }}/></div><span className="flex-1 text-sm font-bold" style={{ fontFamily:"'Rajdhani',sans-serif" }}>{cat.label || cat.name}</span><button onClick={()=>handleToggleCategoryLive(cat)}><Toggle on={cat.live}/></button><button onClick={()=>startEditCategory(cat)} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(255,255,255,0.04)", color:"#64748B" }}>Edit</button></div><div className="flex items-center gap-3 px-5 py-2.5" style={{ background:"rgba(255,255,255,0.015)" }}><div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:cat.color, opacity:0.7 }}/><span className="flex-1 text-sm" style={{ color:"#94A3B8" }}>{cat.description || "No description yet"}</span><span className="text-xs mr-2" style={{ color:"#2D4060" }}>{cat.count || 0}</span><button onClick={()=>handleDeleteCategory(cat.id)} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></div></GlassCard>)}</div>;

  if (page === "categories") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Layers} title="Categories" color={gold} action="Add" onAction={startAddCategory}/><div className="flex gap-2.5 mb-4">{[{ v:String(adminCategoryData.length),l:"Total",c:gold },{v:String(activeCategoryCount),l:"Active",c:"#10B981"},{v:String(adminCategoryData.length-activeCategoryCount),l:"Off",c:"#EF4444"}].map(s=><div key={s.l} className="flex-1 p-3 rounded-2xl text-center" style={{ background:card, border:`1px solid ${s.c}20` }}><div className="text-lg font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", color:s.c }}>{s.v}</div><div className="text-xs" style={{ color:"#3D5270" }}>{s.l}</div></div>)}</div><div className="flex flex-col gap-2.5">{adminCategoryData.map((cat:any)=><GlassCard key={cat.id || cat.label} className="px-4 py-3.5 flex items-center gap-3"><div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background:cat.color }}/><div className="flex-1"><p className="text-sm font-medium">{cat.label || cat.name}</p><p className="text-xs" style={{ color:"#3D5270" }}>{cat.count} subcategories</p></div><button onClick={()=>handleToggleCategoryLive(cat)}><StatusBadge live={cat.live}/></button><button onClick={()=>startEditCategory(cat)} className="text-xs px-2.5 py-1.5 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", color:"#64748B" }}>Edit</button><button onClick={()=>handleDeleteCategory(cat.id)} className="text-xs px-2.5 py-1.5 rounded-xl" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></GlassCard>)}</div></div>;
  if (page === "categories-add") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="categories" label="Categories"/><SH icon={Layers} title={editingCategoryId ? "Edit Tree Item" : "Add Tree Item"} color={gold}/><GlassCard className="p-4 mb-4"><AdminField label="Name" value={categoryForm.name} onChange={v=>updateCategoryForm("name", v)} placeholder="Pumps / Centrifugal Pumps"/><AdminArea label="Description" value={categoryForm.description} onChange={v=>updateCategoryForm("description", v)} placeholder="Short description"/><div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color:"#64748B" }}>Tree Level</label><select value={categoryForm.level || "domain"} onChange={e=>{ updateCategoryForm("level", e.target.value); if(e.target.value === "domain") updateCategoryForm("parentId", ""); }} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${cardBorder}`, color:"#E2E8F0" }}><option value="domain">Domain</option><option value="category">Category under Domain</option><option value="item">Sub-list Item under Category</option></select></div>{categoryForm.level !== "domain" && <div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color:"#64748B" }}>Parent</label><select value={categoryForm.parentId || ""} onChange={e=>updateCategoryForm("parentId", e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${cardBorder}`, color:"#E2E8F0" }}><option value="">Select parent</option>{categoryParentOptions.map((p:any)=><option key={p.id} value={p.id}>{p.label || p.name}</option>)}</select></div>}<AdminField label="Display Order" type="number" value={categoryForm.order} onChange={v=>updateCategoryForm("order", v)} placeholder="1"/><div className="mb-4"><label className="block text-xs font-medium mb-2" style={{ color:"#64748B" }}>Accent Color</label><div className="flex gap-2 flex-wrap">{["#3B82F6","#10B981","#D4AF37","#8B5CF6","#F59E0B","#EF4444","#06B6D4"].map(c=><button key={c} onClick={()=>updateCategoryForm("color", c)} className="w-8 h-8 rounded-xl cursor-pointer border-2 transition-all" style={{ background:c, borderColor:categoryForm.color===c ? "#FFFFFF" : "transparent" }}/>)}</div></div><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Enable immediately</span><button onClick={()=>updateCategoryForm("live", !categoryForm.live)}><Toggle on={categoryForm.live}/></button></div></GlassCard><FormActions cancelTo="categories" onSave={handleSaveCategory} disabled={!categoryForm.name.trim() || (categoryForm.level !== "domain" && !categoryForm.parentId)}/></div>;

  if (page === "videos") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Video} title="Videos" color="#8B5CF6" action="Upload" onAction={startAddVideo}/><div className="flex gap-2.5 mb-4">{[{v:String(adminVideos.length),l:"Total",c:"#8B5CF6"},{v:String(adminVideos.filter(v=>v.live!==false).length),l:"Live",c:"#10B981"},{v:String(adminVideos.filter(v=>v.live===false).length),l:"Draft",c:"#F59E0B"}].map(s=><div key={s.l} className="flex-1 p-3 rounded-2xl text-center" style={{ background:card, border:`1px solid ${s.c}20` }}><div className="text-lg font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", color:s.c }}>{s.v}</div><div className="text-xs" style={{ color:"#3D5270" }}>{s.l}</div></div>)}</div><div className="flex flex-col gap-2.5">{adminVideos.map((vid:any)=><GlassCard key={vid.id} className="p-4"><div className="flex items-start gap-3 mb-3"><div className="w-14 h-10 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0" style={{ background:"rgba(139,92,246,0.1)", border:"1px solid rgba(139,92,246,0.2)" }}>{(vid.thumbnailUrl || vid.thumbnailLink || vid.thumb) ? <img src={vid.thumbnailUrl || vid.thumbnailLink || vid.thumb} className="w-full h-full object-cover"/> : <Play size={16} style={{ color:"#8B5CF6" }}/>}</div><div className="flex-1"><p className="text-sm font-medium leading-snug mb-1">{vid.title}</p><div className="flex items-center gap-2 flex-wrap"><span className="text-xs" style={{ color:"#3D5270" }}>{vid.equip || "Unassigned"}</span><span className="text-xs" style={{ color:"#3D5270" }}>{vid.dur}</span><StatusBadge live={vid.live !== false}/></div></div></div><div className="flex gap-1.5"><button onClick={()=>startEditVideo(vid)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(255,255,255,0.05)", color:"#94A3B8" }}>Edit</button><button onClick={()=>toggleCms("videos", vid)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(255,255,255,0.05)", color:"#94A3B8" }}>{vid.live===false ? "Enable" : "Disable"}</button><button onClick={()=>deleteCms("videos", vid.id)} className="flex-1 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></div></GlassCard>)}{adminVideos.length===0 && <EmptyState label="No videos yet"/>}</div></div>;
  if (page === "videos-upload") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="videos" label="Videos"/><SH icon={Upload} title={editingVideoId ? "Edit Video" : "Upload Video"} color="#8B5CF6"/><GlassCard className="p-4 mb-4"><VideoFilePicker videoForm={videoForm} updateVideoForm={updateVideoForm}/><AdminField label="Video Title" value={videoForm.title} onChange={v=>updateVideoForm("title", v)} placeholder="Centrifugal Pump Fundamentals"/><AdminSelect label="Assign Equipment" value={videoForm.equipmentId} onChange={v=>{ updateVideoForm("equipmentId",v); const eq=adminEquipmentData.find((x:any)=>String(x.id)===String(v)); updateVideoForm("equip",eq?.name||""); }} options={adminEquipmentData.map((eq:any)=>({ value:String(eq.id), label:`${eq.name}${eq.tag && eq.tag!=="N/A" ? ` · ${eq.tag}` : ""}` }))} placeholder="Select exact equipment"/><AdminField label="Duration" value={videoForm.dur} onChange={v=>updateVideoForm("dur", v)} placeholder="18:24"/><AdminField label="Video URL / R2 Storage Path" value={videoForm.url} onChange={v=>updateVideoForm("url", v)} placeholder="https://.../video.mp4 or videos/pump.mp4"/><div className="mb-4 rounded-xl p-3" style={{ background:"rgba(212,175,55,0.08)", border:`1px solid ${gold}24`, color:"#CBD5E1" }}><p className="text-xs leading-relaxed"><strong style={{ color:gold }}>Thumbnail:</strong> generated automatically from the selected video. No thumbnail URL is required.</p></div><div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color:"#64748B" }}>Difficulty</label><select value={videoForm.difficulty} onChange={e=>updateVideoForm("difficulty", e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${cardBorder}`, color:"#E2E8F0" }}><option>Beginner</option><option>Intermediate</option><option>Advanced</option></select></div><div className="grid grid-cols-2 gap-3"><AdminField label="Views" type="number" value={videoForm.views} onChange={v=>updateVideoForm("views", v)} placeholder="0"/><AdminField label="Likes" type="number" value={videoForm.likes} onChange={v=>updateVideoForm("likes", v)} placeholder="0"/></div><div className="flex items-center justify-between mb-3"><span className="text-xs" style={{ color:"#64748B" }}>Manual Popular</span><button onClick={()=>updateVideoForm("popular", !videoForm.popular)}><Toggle on={videoForm.popular}/></button></div><div className="flex items-center justify-between mb-3"><span className="text-xs" style={{ color:"#64748B" }}>Featured Boost</span><button onClick={()=>updateVideoForm("featured", !videoForm.featured)}><Toggle on={videoForm.featured}/></button></div><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Live</span><button onClick={()=>updateVideoForm("live", !videoForm.live)}><Toggle on={videoForm.live}/></button></div></GlassCard><FormActions cancelTo="videos" onSave={handleSaveVideo} disabled={!videoForm.title.trim()}/></div>;

  if (page === "inspire") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Flame} title="Inspire" color="#F59E0B" action="Add" onAction={startAddInspire}/><div className="grid grid-cols-3 gap-2.5 mb-4">{[{v:String(adminInspireVideos.length),l:"Total",c:"#F59E0B"},{v:String(adminInspireVideos.filter((v:any)=>v.live!==false).length),l:"Live",c:"#10B981"},{v:String(adminInspireVideos.filter((v:any)=>v.featured).length),l:"Featured",c:gold}].map(x=><GlassCard key={x.l} className="p-3 text-center" accent={x.c}><div className="text-lg font-bold" style={{fontFamily:"'Rajdhani',sans-serif",color:x.c}}>{x.v}</div><div className="text-xs" style={{color:"#3D5270"}}>{x.l}</div></GlassCard>)}</div><div className="flex flex-col gap-2.5">{adminInspireVideos.map((v:any)=><GlassCard key={v.id} className="p-4"><div className="flex items-start gap-3"><Flame size={17} style={{color:"#F59E0B",marginTop:3}}/><div className="flex-1"><p className="text-sm font-semibold">{v.title}</p><p className="text-xs" style={{color:"#3D5270"}}>{v.theme || v.category || "Motivation"} · {v.dur || "Short"}</p></div><button onClick={()=>toggleCms("inspireVideos",v)}><StatusBadge live={v.live!==false}/></button></div><div className="flex gap-1.5 mt-3"><button onClick={()=>startEditInspire(v)} className="flex-1 py-1.5 rounded-xl text-xs" style={{background:"rgba(255,255,255,0.05)",color:"#94A3B8"}}>Edit</button><button onClick={()=>deleteCms("inspireVideos",v.id)} className="flex-1 py-1.5 rounded-xl text-xs" style={{background:"rgba(239,68,68,0.08)",color:"#EF4444"}}>Delete</button></div></GlassCard>)}{adminInspireVideos.length===0&&<EmptyState label="No Inspire videos yet"/>}</div></div>;
  if (page === "inspire-upload") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="inspire" label="Inspire"/><SH icon={Flame} title={editingInspireId?"Edit Inspire Video":"Add Inspire Video"} color="#F59E0B"/><GlassCard className="p-4 mb-4"><VideoFilePicker videoForm={inspireForm} updateVideoForm={updateInspireForm}/><AdminField label="Title" value={inspireForm.title} onChange={v=>updateInspireForm("title",v)} placeholder="Teamwork and ownership"/><AdminSelect label="Category" value={inspireForm.theme} onChange={v=>updateInspireForm("theme",v)} options={INSPIRE_THEMES.filter(t=>t!=="All").map(t=>({value:t,label:t}))}/><AdminField label="Duration" value={inspireForm.dur} onChange={v=>updateInspireForm("dur",v)} placeholder="0:45"/><AdminField label="Video URL / R2 Storage Path" value={inspireForm.url} onChange={v=>updateInspireForm("url",v)} placeholder="https://.../video.mp4"/><AdminArea label="Description" value={inspireForm.description} onChange={v=>updateInspireForm("description",v)} placeholder="Short professional message"/><AdminField label="Order" type="number" value={inspireForm.order} onChange={v=>updateInspireForm("order",v)} placeholder="1"/><div className="flex items-center justify-between mb-3"><span className="text-xs" style={{color:"#64748B"}}>Featured</span><button onClick={()=>updateInspireForm("featured",!inspireForm.featured)}><Toggle on={!!inspireForm.featured}/></button></div><div className="flex items-center justify-between"><span className="text-xs" style={{color:"#64748B"}}>Live</span><button onClick={()=>updateInspireForm("live",!inspireForm.live)}><Toggle on={inspireForm.live!==false}/></button></div></GlassCard><FormActions cancelTo="inspire" onSave={handleSaveInspire} disabled={!inspireForm.title.trim()}/></div>;

  if (page === "documents") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={FileText} title="Documents" color="#06B6D4" action="Upload" onAction={startAddDocument}/>{["Standard","Manual","Drawing","PDF"].map((type,i)=>{ const color=["#F59E0B","#10B981","#06B6D4","#EF4444"][i]; const filtered=adminDocuments.filter((d:any)=>d.type===type); return <div key={type} className="mb-5"><div className="flex items-center gap-2 mb-2 px-1"><div className="w-1 h-4 rounded-full" style={{ background:color }}/><p className="text-xs font-semibold uppercase tracking-wider" style={{ color:"#64748B" }}>{type}s</p></div><div className="flex flex-col gap-2">{filtered.map((doc:any)=><GlassCard key={doc.id} className="px-4 py-3 flex items-center gap-3"><FileText size={16} style={{ color }}/><div className="flex-1 min-w-0"><p className="text-sm truncate">{doc.title}</p><p className="text-xs" style={{ color:"#3D5270" }}>{doc.equip || "Unassigned"} · {doc.size || "File"}</p></div><button onClick={()=>toggleCms("documents", doc)}><StatusBadge live={doc.live !== false}/></button><button onClick={()=>startEditDocument(doc)} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(255,255,255,0.04)", color:"#64748B" }}>Edit</button><button onClick={()=>deleteCms("documents", doc.id)} className="text-xs px-2 py-1 rounded-lg" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Del</button></GlassCard>)}{filtered.length===0 && <div className="text-center py-3 text-xs rounded-xl" style={{ color:"#2D4060", background:"rgba(255,255,255,0.02)", border:`1px solid ${cardBorder}` }}>No {type.toLowerCase()} uploaded yet</div>}</div></div>})}</div>;
  if (page === "documents-upload") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="documents" label="Documents"/><SH icon={Upload} title={editingDocumentId ? "Edit Document" : "Upload Document"} color="#06B6D4"/><GlassCard className="p-4 mb-4"><AdminField label="Document Title" value={documentForm.title} onChange={v=>updateDocumentForm("title", v)} placeholder="API 610 Centrifugal Pumps"/><div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color:"#64748B" }}>Type</label><select value={documentForm.type} onChange={e=>updateDocumentForm("type", e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${cardBorder}`, color:"#E2E8F0" }}><option>Standard</option><option>Manual</option><option>Drawing</option><option>PDF</option></select></div><AdminField label="Assign Equipment" value={documentForm.equip} onChange={v=>updateDocumentForm("equip", v)} placeholder="Pumps"/><AdminField label="Size" value={documentForm.size} onChange={v=>updateDocumentForm("size", v)} placeholder="4.2 MB"/><AdminField label="File URL / Storage Path" value={documentForm.fileUrl} onChange={v=>updateDocumentForm("fileUrl", v)} placeholder="documents/api-610.pdf"/><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Live</span><button onClick={()=>updateDocumentForm("live", !documentForm.live)}><Toggle on={documentForm.live}/></button></div></GlassCard><FormActions cancelTo="documents" onSave={handleSaveDocument} disabled={!documentForm.title.trim()}/></div>;

  if (page === "homepage") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Home} title="Homepage" color="#F59E0B"/><GlassCard className="p-4 mb-4"><AdminField label="Main Title" value={homepageForm.title} onChange={v=>updateHomepageForm("title", v)} placeholder="Welcome to FALTAH"/><AdminField label="Subtitle" value={homepageForm.subtitle} onChange={v=>updateHomepageForm("subtitle", v)} placeholder="Enterprise"/><AdminField label="Badge Text" value={homepageForm.badge} onChange={v=>updateHomepageForm("badge", v)} placeholder="Digital Knowledge Platform"/><AdminField label="Recently Added Count" type="number" value={homepageForm.recentCount} onChange={v=>updateHomepageForm("recentCount", v)} placeholder="4"/><AdminField label="Popular Technical Videos Count" type="number" value={homepageForm.popularCount} onChange={v=>updateHomepageForm("popularCount", v)} placeholder="4"/><div className="flex items-center justify-between mb-3"><span className="text-xs" style={{ color:"#64748B" }}>Auto-update Recently Added</span><button onClick={()=>updateHomepageForm("autoUpdateRecent", !homepageForm.autoUpdateRecent)}><Toggle on={homepageForm.autoUpdateRecent}/></button></div><div className="flex items-center justify-between mb-4"><span className="text-xs" style={{ color:"#64748B" }}>Automatic Popularity Ranking</span><button onClick={()=>updateHomepageForm("autoUpdatePopular", !homepageForm.autoUpdatePopular)}><Toggle on={homepageForm.autoUpdatePopular}/></button></div><div className="rounded-xl p-3 mb-3" style={{ background:"rgba(59,130,246,0.06)", border:"1px solid rgba(59,130,246,0.16)" }}><p className="text-xs font-semibold mb-2" style={{ color:"#60A5FA" }}>Popularity Criteria</p><AdminField label="Minimum Views" type="number" value={homepageForm.popularMinViews} onChange={v=>updateHomepageForm("popularMinViews", v)} placeholder="0"/><AdminField label="Like Weight" type="number" value={homepageForm.popularLikeWeight} onChange={v=>updateHomepageForm("popularLikeWeight", v)} placeholder="5"/><AdminField label="Featured / Manual Popular Boost" type="number" value={homepageForm.popularFeaturedBoost} onChange={v=>updateHomepageForm("popularFeaturedBoost", v)} placeholder="250"/><AdminField label="Recent Window (Days)" type="number" value={homepageForm.popularRecentDays} onChange={v=>updateHomepageForm("popularRecentDays", v)} placeholder="30"/><AdminField label="Recent Video Boost" type="number" value={homepageForm.popularRecentBoost} onChange={v=>updateHomepageForm("popularRecentBoost", v)} placeholder="100"/><p className="text-[11px] leading-relaxed" style={{ color:"#64748B" }}>Automatic score = views + (likes × weight) + featured/manual boost + recent boost. Turn automatic ranking off to show only videos marked Popular or Featured.</p></div></GlassCard><button onClick={handleSaveHomepage} className="w-full py-3 rounded-2xl text-sm font-bold" style={{ background:`linear-gradient(135deg,${gold},#C49B28)`, color:navy }}>{saving ? "Saving..." : "Save Homepage"}</button></div>;

  if (page === "ai") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Brain} title="AI Knowledge" color="#EC4899" action="Add" onAction={startAddAi}/><div className="grid grid-cols-2 gap-3 mb-5">{[{v:String(adminDocuments.length),l:"Documents",c:"#10B981"},{v:String(adminVideos.length),l:"Videos",c:"#3B82F6"},{v:String(adminAiResponses.length),l:"Q&A Pairs",c:"#EC4899"},{v:"Ready",l:"Status",c:gold}].map(s=><GlassCard key={s.l} className="p-3 text-center" accent={s.c}><div className="text-xl font-bold mb-0.5" style={{ fontFamily:"'Rajdhani',sans-serif", color:s.c }}>{s.v}</div><div className="text-xs" style={{ color:"#3D5270" }}>{s.l}</div></GlassCard>)}</div><div className="flex flex-col gap-3"><GlassCard onClick={startAddAi} className="px-4 py-4 flex items-center gap-3"><Brain size={18} style={{ color:"#EC4899" }}/><div className="flex-1"><p className="text-sm font-semibold">Add AI Response</p><p className="text-xs" style={{ color:"#3D5270" }}>Create Q&A pair</p></div><ChevronRight size={14}/></GlassCard><GlassCard onClick={()=>setPage("ai-responses")} className="px-4 py-4 flex items-center gap-3"><MessageSquare size={18} style={{ color:"#8B5CF6" }}/><div className="flex-1"><p className="text-sm font-semibold">Manage AI Responses</p><p className="text-xs" style={{ color:"#3D5270" }}>Edit / delete responses</p></div><ChevronRight size={14}/></GlassCard></div></div>;
  if (page === "ai-upload") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="ai-responses" label="AI Responses"/><SH icon={Upload} title={editingAiId ? "Edit AI Response" : "Add AI Response"} color="#EC4899"/><GlassCard className="p-4 mb-4"><AdminField label="Question" value={aiForm.q} onChange={v=>updateAiForm("q", v)} placeholder="What causes pump cavitation?"/><AdminArea label="Answer" value={aiForm.answer} onChange={v=>updateAiForm("answer", v)} placeholder="Write the approved AI response"/><AdminField label="Token Estimate" type="number" value={aiForm.tokens} onChange={v=>updateAiForm("tokens", v)} placeholder="142"/><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Live</span><button onClick={()=>updateAiForm("live", !aiForm.live)}><Toggle on={aiForm.live}/></button></div></GlassCard><FormActions cancelTo="ai-responses" onSave={handleSaveAi} disabled={!aiForm.q.trim()}/></div>;
  if (page === "ai-responses") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="ai" label="AI Knowledge"/><SH icon={MessageSquare} title="Manage AI Responses" color="#8B5CF6" action="Add" onAction={startAddAi}/><div className="flex flex-col gap-3">{adminAiResponses.map((qa:any)=><GlassCard key={qa.id} className="p-4"><p className="text-sm font-medium mb-2">{qa.q}</p><p className="text-xs mb-3 line-clamp-2" style={{ color:"#64748B" }}>{qa.answer}</p><div className="flex items-center gap-2"><span className="text-xs" style={{ color:"#3D5270" }}>{qa.tokens || 0} tokens</span><StatusBadge live={qa.live !== false}/><div className="flex gap-1.5 ml-auto"><button onClick={()=>startEditAi(qa)} className="text-xs px-2.5 py-1 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", color:"#64748B" }}>Edit</button><button onClick={()=>toggleCms("aiResponses", qa)} className="text-xs px-2.5 py-1 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", color:"#64748B" }}>{qa.live===false ? "Enable" : "Disable"}</button><button onClick={()=>deleteCms("aiResponses", qa.id)} className="text-xs px-2.5 py-1 rounded-xl" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></div></div></GlassCard>)}{adminAiResponses.length===0 && <EmptyState label="No AI responses yet"/>}</div></div>;

  if (page === "users") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Users} title="Users" color="#64748B" action="Add" onAction={startAddUser}/><div className="flex flex-col gap-2.5">{adminUsers.map((u:any)=><GlassCard key={u.id} className="px-4 py-3.5 flex items-center gap-3"><Users size={16} style={{ color:"#64748B" }}/><div className="flex-1"><p className="text-sm font-medium">{u.name || u.email}</p><p className="text-xs" style={{ color:"#3D5270" }}>{u.email} · {u.role}</p></div><button onClick={()=>toggleCms("users", u)}><StatusBadge live={u.live !== false}/></button><button onClick={()=>startEditUser(u)} className="text-xs px-2.5 py-1.5 rounded-xl" style={{ background:"rgba(255,255,255,0.05)", color:"#64748B" }}>Edit</button><button onClick={()=>deleteCms("users", u.id)} className="text-xs px-2.5 py-1.5 rounded-xl" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></GlassCard>)}{adminUsers.length===0 && <EmptyState label="No users yet"/>}</div></div>;
  if (page === "users-add") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="users" label="Users"/><SH icon={Users} title={editingUserId ? "Edit User" : "Add User"} color="#64748B"/><GlassCard className="p-4 mb-4"><AdminField label="Name" value={userForm.name} onChange={v=>updateUserForm("name", v)} placeholder="User name"/><AdminField label="Email" value={userForm.email} onChange={v=>updateUserForm("email", v)} placeholder="user@company.com"/><div className="mb-4"><label className="block text-xs font-medium mb-1.5" style={{ color:"#64748B" }}>Role</label><select value={userForm.role} onChange={e=>updateUserForm("role", e.target.value)} className="w-full px-4 py-3 rounded-xl text-sm outline-none" style={{ background:"rgba(8,15,28,0.8)", border:`1px solid ${cardBorder}`, color:"#E2E8F0" }}><option>Super Admin</option><option>Editor</option><option>Viewer</option></select></div><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Enabled</span><button onClick={()=>updateUserForm("live", !userForm.live)}><Toggle on={userForm.live}/></button></div></GlassCard><FormActions cancelTo="users" onSave={handleSaveUser} disabled={!userForm.email.trim()}/></div>;

  if (page === "notifications") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Bell} title="Notifications" color={gold} action="Add" onAction={startAddNotification}/><div className="flex flex-col gap-2.5">{adminNotifications.map((n:any)=><GlassCard key={n.id} className="px-4 py-3.5"><div className="flex items-start gap-3"><div className="w-2 h-2 rounded-full mt-1.5" style={{ background: gold }}/><div className="flex-1"><p className="text-sm font-semibold">{n.title || n.message}</p><p className="text-xs" style={{ color:"#3D5270" }}>{n.time || "Just now"}</p></div><button onClick={()=>toggleCms("notifications", n)}><Toggle on={n.live !== false}/></button></div><div className="flex gap-1.5 mt-3"><button onClick={()=>startEditNotification(n)} className="flex-1 py-1.5 rounded-xl text-xs" style={{ background:"rgba(255,255,255,0.05)", color:"#94A3B8" }}>Edit</button><button onClick={()=>deleteCms("notifications", n.id)} className="flex-1 py-1.5 rounded-xl text-xs" style={{ background:"rgba(239,68,68,0.08)", color:"#EF4444" }}>Delete</button></div></GlassCard>)}{adminNotifications.length===0 && <EmptyState label="No notifications yet"/>}</div></div>;
  if (page === "notifications-add") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn to="notifications" label="Notifications"/><SH icon={Bell} title={editingNotificationId ? "Edit Notification" : "Add Notification"} color={gold}/><GlassCard className="p-4 mb-4"><AdminField label="Notification Text" value={notificationForm.title} onChange={v=>updateNotificationForm("title", v)} placeholder="New video added"/><AdminField label="Time Label" value={notificationForm.time} onChange={v=>updateNotificationForm("time", v)} placeholder="2 min ago"/><AdminField label="Order" type="number" value={notificationForm.order} onChange={v=>updateNotificationForm("order", v)} placeholder="1"/><div className="flex items-center justify-between"><span className="text-xs" style={{ color:"#64748B" }}>Live</span><button onClick={()=>updateNotificationForm("live", !notificationForm.live)}><Toggle on={notificationForm.live}/></button></div></GlassCard><FormActions cancelTo="notifications" onSave={handleSaveNotification} disabled={!notificationForm.title.trim()}/></div>;

  if (page === "about") return <AboutFaltahPage onBack={() => setPage("dashboard")} />;

  if (page === "settings") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={Settings} title="Settings" color="#94A3B8"/>{[{ section:"MODULES", items:[{ key:"aiAssistant", label:"AI Assistant", value:"Active", icon:Brain },{ key:"knowledgeTree", label:"Knowledge Tree", value:"Active", icon:TreePine },{ key:"library", label:"Library", value:"Active", icon:BookOpen },{ key:"apiAccess", label:"API Access", value:"Restricted", icon:Lock }]}].map(group=><div key={group.section} className="mb-4"><p className="text-xs uppercase tracking-widest font-semibold mb-2 px-1" style={{ color:"#2D4060" }}>{group.section}</p><div className="flex flex-col gap-2">{group.items.map(item=><GlassCard key={item.label} className="px-4 py-3.5 flex items-center gap-3"><item.icon size={16} style={{ color:"#64748B" }}/><div className="flex-1"><p className="text-sm">{item.label}</p><p className="text-xs" style={{ color:"#3D5270" }}>{settingsState[item.key] ? item.value : "Off"}</p></div><button onClick={()=>toggleSetting(item.key)}><Toggle on={!!settingsState[item.key]}/></button></GlassCard>)}</div></div>)}</div>;

  if (page === "analytics") return <div className="flex flex-col pb-8 px-4 pt-2"><BackBtn/><SH icon={BarChart3} title="Analytics" color="#EF4444"/><div className="grid grid-cols-2 gap-3 mb-5">{[{v:String(adminEquipmentData.length),l:"Equipment",c:"#3B82F6"},{v:String(adminVideos.length),l:"Videos",c:gold},{v:String(adminDocuments.length),l:"Documents",c:"#10B981"},{v:String(adminAiResponses.length),l:"AI Responses",c:"#8B5CF6"}].map(s=><GlassCard key={s.l} className="p-4" accent={s.c}><div className="text-2xl font-bold" style={{ fontFamily:"'Rajdhani',sans-serif", color:s.c }}>{s.v}</div><div className="text-xs" style={{ color:"#3D5270" }}>{s.l}</div></GlassCard>)}</div></div>;

  const ADMIN_MENU: { id: AdminPage; label: string; sub: string; icon: any; color: string }[] = [
    { id:"equipment", label:"Equipment", sub:`${adminEquipmentData.length} items`, icon:Cpu, color:"#3B82F6" },
    { id:"tree", label:"Knowledge Tree", sub:"Manage structure", icon:TreePine, color:"#10B981" },
    { id:"categories", label:"Categories", sub:`${activeCategoryCount} active`, icon:Layers, color:gold },
    { id:"videos", label:"Videos", sub:`${adminVideos.length} videos`, icon:Video, color:"#8B5CF6" },
    { id:"inspire", label:"Inspire", sub:`${adminInspireVideos.length} shorts`, icon:Flame, color:"#F59E0B" },
    { id:"documents", label:"Documents", sub:`${adminDocuments.length} files`, icon:FileText, color:"#06B6D4" },
    { id:"homepage", label:"Homepage", sub:"Edit content", icon:Home, color:"#F59E0B" },
    { id:"hero-hotspots", label:"Hero Hotspots", sub:`${adminHeroHotspots.length} points`, icon:MapPin, color:"#38BDF8" },
    { id:"ai", label:"AI Knowledge", sub:`${adminAiResponses.length} responses`, icon:Brain, color:"#EC4899" },
    { id:"users", label:"Users", sub:`${adminUsers.length} users`, icon:Users, color:"#64748B" },
    { id:"analytics", label:"Analytics", sub:"View stats", icon:BarChart3, color:"#EF4444" },
    { id:"notifications", label:"Notifications", sub:`${adminNotifications.length} items`, icon:Bell, color:gold },
    { id:"about", label:"About FALTAH", sub:"Intro and vision", icon:BookOpen, color:"#06B6D4" },
    { id:"settings", label:"Settings", sub:"Configuration", icon:Settings, color:"#94A3B8" },
  ];

  return <div className="flex flex-col pb-8 px-4 pt-2"><div className="mb-5 p-4 rounded-2xl" style={{ background:`linear-gradient(135deg,${gold}10,${gold}06)`, border:`1px solid ${gold}22` }}><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background:`${gold}18`, border:`1px solid ${gold}30` }}><Shield size={18} style={{ color:gold }}/></div><div><p className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif", color:gold }}>Admin Mode Active</p><p className="text-xs flex items-center gap-1" style={{ color:"#3D5270" }}><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block animate-pulse"/>Full access</p></div></div><button onClick={handleLogout} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium" style={{ background:"rgba(239,68,68,0.1)", color:"#EF4444", border:"1px solid rgba(239,68,68,0.2)" }}><LogOut size={12}/> Logout</button></div></div><SectionHead title="Admin Panel"/><div className="grid grid-cols-2 gap-3">{ADMIN_MENU.map(item=><button key={item.id} onClick={()=>setPage(item.id)} className="p-4 rounded-2xl text-left transition-all active:scale-[0.97]" style={{ background:`linear-gradient(135deg,${item.color}10,rgba(18,28,46,0.75))`, border:`1px solid ${item.color}25`, minHeight:110 }}><div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background:`${item.color}15`, border:`1px solid ${item.color}25` }}><item.icon size={18} style={{ color:item.color }}/></div><p className="font-bold text-sm mb-0.5" style={{ fontFamily:"'Rajdhani',sans-serif", color:"#E2E8F0" }}>{item.label}</p><p className="text-xs" style={{ color:"#3D5270" }}>{item.sub}</p></button>)}</div><div className="mt-8 text-center"><div className="flex items-center justify-center gap-2 mb-1"><div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background:`linear-gradient(135deg,${gold},#C49B28)` }}><Zap size={12} style={{ color:navy }}/></div><span className="font-bold text-sm" style={{ fontFamily:"'Rajdhani',sans-serif", letterSpacing:"0.1em" }}>FALTAH ENTERPRISE</span></div><p className="text-xs" style={{ color:"#1A2A3F" }}>Version 2.4.7 · Exact Hero Hotspot Linking · © 2026</p></div></div>;
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────
export default function App() {
  const [nav, setNav] = useState<NavId>("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [firebaseEquipment, setFirebaseEquipment] = useState<any[]>([]);
  const [firebaseCategories, setFirebaseCategories] = useState<any[]>([]);
  const [firebaseVideos, setFirebaseVideos] = useState<any[]>([]);
  const [firebaseInspireVideos, setFirebaseInspireVideos] = useState<any[]>([]);
  const [firebaseDocuments, setFirebaseDocuments] = useState<any[]>([]);
  const [firebaseAiResponses, setFirebaseAiResponses] = useState<any[]>([]);
  const [homepageSettings, setHomepageSettings] = useState<any[]>([]);
  const [heroHotspots, setHeroHotspots] = useState<any[]>([]);
  const [treeEquipmentId, setTreeEquipmentId] = useState("");
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [platformSettings, setPlatformSettings] = useState<any>({ aiAssistant: true, knowledgeTree: true, library: true, apiAccess: false });
  const [notificationItems, setNotificationItems] = useState<any[]>([]);
  const [dataError, setDataError] = useState("");
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [showSplash, setShowSplash] = useState(true);
  const [showWelcomeTour, setShowWelcomeTour] = useState(false);
  const welcomeStorageKey = "faltah_v2_character_intro_seen";

  useEffect(() => {
    const splashTimer = setTimeout(() => setShowSplash(false), 1200);
    const hasSeenTour = typeof window !== "undefined" && localStorage.getItem(welcomeStorageKey) === "true";
    if (!hasSeenTour) {
      const tourTimer = setTimeout(() => setShowWelcomeTour(true), 1400);
      return () => { clearTimeout(splashTimer); clearTimeout(tourTimer); };
    }
    return () => clearTimeout(splashTimer);
  }, []);

  const closeWelcomeTour = (doNotShowAgain = false) => {
    if (doNotShowAgain) {
      localStorage.setItem(welcomeStorageKey, "true");
    } else {
      localStorage.removeItem(welcomeStorageKey);
    }
    setShowWelcomeTour(false);
  };

  const loadFirebaseEquipment = useCallback(async () => {
    try {
      const data = await getEquipment();
      setFirebaseEquipment(data);
      console.log("Firebase equipment loaded:", data);
    } catch (error) {
      console.error("Error loading Firebase equipment:", error);
    }
  }, []);

  const loadFirebaseCategories = useCallback(async () => {
    try {
      const data = await getCategories();
      setFirebaseCategories(data);
      console.log("Firebase categories loaded:", data);
    } catch (error) {
      console.error("Error loading Firebase categories:", error);
    }
  }, []);


  const loadPublicCms = useCallback(async () => {
    try {
      const [v, iv, d, a, h, st, n, hs] = await Promise.all([
        getCmsItems("videos"),
        getCmsItems("inspireVideos"),
        getCmsItems("documents"),
        getCmsItems("aiResponses"),
        getCmsItems("homepageSettings"),
        getCmsItems("platformSettings"),
        getCmsItems("notifications"),
        getCmsItems("heroHotspots"),
      ]);
      setFirebaseVideos(v);
      setFirebaseInspireVideos(iv);
      setFirebaseDocuments(d);
      setFirebaseAiResponses(a);
      setHomepageSettings(h);
      setNotificationItems(n);
      setHeroHotspots(hs);
      if (st[0]) setPlatformSettings((prev:any) => ({ ...prev, ...st[0] }));
      setDataError("");
    } catch (error) {
      console.error("Error loading public CMS:", error);
      setDataError("Some CMS data could not be loaded. Check Firestore connection.");
    }
  }, []);

  const refreshAllCms = useCallback(async () => {
    await Promise.all([loadFirebaseEquipment(), loadFirebaseCategories(), loadPublicCms()]);
  }, [loadFirebaseEquipment, loadFirebaseCategories, loadPublicCms]);

  useEffect(() => {
    loadFirebaseEquipment();
    loadFirebaseCategories();
    loadPublicCms();
  }, [loadFirebaseEquipment, loadFirebaseCategories, loadPublicCms]);

  const handleEquipmentSaved = async (item: any) => {
    await addEquipment(item);
    await loadFirebaseEquipment();
  };

  const handleEquipmentDeleted = async (id: string) => {
    await deleteEquipment(id);
    await loadFirebaseEquipment();
  };

  const handleEquipmentUpdated = async (id: string, item: any) => {
    await updateEquipment(id, item);
    await loadFirebaseEquipment();
  };

  const handleCategorySaved = async (item: any) => {
    await addCategory(item);
    await loadFirebaseCategories();
  };

  const handleCategoryDeleted = async (id: string) => {
    await deleteCategory(id);
    await loadFirebaseCategories();
  };

  const handleCategoryUpdated = async (id: string, item: any) => {
    await updateCategory(id, item);
    await loadFirebaseCategories();
  };


  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) setSelectedResource(detail);
    };
    window.addEventListener("faltah:open-resource", handler as EventListener);
    return () => window.removeEventListener("faltah:open-resource", handler as EventListener);
  }, []);

  const handleHeroHotspot = useCallback((hotspot:any) => {
    const target = hotspot?.target === "library" ? "library" : "tree";
    const equipmentId = String(hotspot?.equipmentId || hotspot?.equipmentDocId || "").trim();

    if (target === "tree") {
      setTreeEquipmentId(equipmentId);
      setNav("tree");
      return;
    }

    if (equipmentId) {
      const linkedEquipment = firebaseEquipment.find((eq:any) => String(eq.id) === equipmentId);
      setGlobalSearchQuery(String(linkedEquipment?.name || linkedEquipment?.label || linkedEquipment?.tag || ""));
    } else {
      setGlobalSearchQuery("");
    }
    setNav("library");
  }, [firebaseEquipment]);

  const NAV_ITEMS: { id: NavId; label: string; icon: React.FC<any> }[] = [
    { id: "home", label: "Home", icon: Home },
    ...(platformSettings.knowledgeTree === false ? [] : [{ id: "tree" as NavId, label: "Tree", icon: TreePine }]),
    ...(platformSettings.library === false ? [] : [{ id: "library" as NavId, label: "Library", icon: BookOpen }]),
    { id: "inspire" as NavId, label: "Inspire", icon: Flame },
    ...(platformSettings.aiAssistant === false ? [] : [{ id: "ai" as NavId, label: "AI", icon: MessageSquare }]),
    { id: "more", label: "More", icon: MoreHorizontal },
  ];

  const renderPage = () => {
    switch (nav) {
      case "home": return <HomePage setNav={setNav} firebaseEquipment={firebaseEquipment} firebaseVideos={firebaseVideos} firebaseDocuments={firebaseDocuments} homepageSettings={homepageSettings} heroHotspots={heroHotspots} onGlobalSearch={(q)=>{setGlobalSearchQuery(q);setNav("library");}} onHeroHotspot={handleHeroHotspot} />;
      case "tree": return <KnowledgeTree firebaseCategories={firebaseCategories} firebaseEquipment={firebaseEquipment} firebaseVideos={firebaseVideos} firebaseDocuments={firebaseDocuments} initialEquipmentId={treeEquipmentId} onInitialEquipmentConsumed={()=>setTreeEquipmentId("")} />;
      case "library": return <KnowledgeLibrary firebaseEquipment={firebaseEquipment} firebaseVideos={firebaseVideos} firebaseDocuments={firebaseDocuments} initialSearch={globalSearchQuery}/>;
      case "inspire": return <InspirePage inspireVideos={firebaseInspireVideos}/>;
      case "ai": return <AIAssistant aiResponses={firebaseAiResponses}/>;
      case "more": return <MorePage isAdmin={isAdmin} setIsAdmin={setIsAdmin} firebaseEquipment={firebaseEquipment} firebaseCategories={firebaseCategories} onEquipmentSaved={handleEquipmentSaved} onEquipmentDeleted={handleEquipmentDeleted} onEquipmentUpdated={handleEquipmentUpdated} onCategorySaved={handleCategorySaved} onCategoryDeleted={handleCategoryDeleted} onCategoryUpdated={handleCategoryUpdated} onCmsChanged={refreshAllCms}/>;
    }
  };

  return (
    <div className="flex flex-col overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Inter',sans-serif", maxWidth: 430, margin: "0 auto", height: "100dvh", background: navy }}>

      {showSplash && <SplashScreen />}
      {showWelcomeTour && !showSplash && <WelcomeTour onClose={closeWelcomeTour} />}
      {dataError && <div className="px-4 py-2 text-xs" style={{ background:"rgba(239,68,68,0.12)", color:"#FCA5A5", borderBottom:"1px solid rgba(239,68,68,0.2)" }}>{dataError}</div>}
      {/* ── TOP BAR ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4"
        style={{ height: 56, background: `${navy}F8`, borderBottom: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", zIndex: 50 }}>
        <div className="flex items-center gap-2">
          <FaltahCharacter size={30} animated={false} subtle />
          <div className="flex items-baseline gap-1.5">
            <span className="font-bold text-sm" style={{ fontFamily: "'Rajdhani',sans-serif", letterSpacing: "0.1em", color: "#E2E8F0" }}>FALTAH</span>
            <span className="text-xs" style={{ color: gold, letterSpacing: "0.12em", fontFamily: "'Rajdhani',sans-serif" }}>ENTERPRISE</span>
          </div>
          {isAdmin && (
            <span className="text-xs px-2 py-0.5 rounded-full ml-1" style={{ background: `${gold}15`, color: gold, border: `1px solid ${gold}30`, fontSize: "9px" }}>ADMIN</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setNotifOpen(!notifOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 active:scale-[0.92]"
              style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${cardBorder}` }}>
              <Bell size={16} style={{ color: notificationItems.filter((n:any)=>n.live !== false).length ? gold : "#3D5270" }}/>
              {notificationItems.filter((n:any)=>n.live !== false).length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full border border-background" style={{ background: "#EF4444" }}/>
              )}
            </button>
            {notifOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)}/>
                <div className="absolute right-0 top-11 w-72 rounded-2xl z-50 overflow-hidden"
                  style={{ background: "#0A1828", border: `1px solid ${cardBorder}`, boxShadow: "0 20px 48px rgba(0,0,0,0.65)" }}>
                  <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <p className="text-sm font-semibold">Notifications</p>
                    <button onClick={() => setNotifOpen(false)}><X size={14} style={{ color: "#3D5270" }}/></button>
                  </div>
                  {notificationItems.filter((n:any)=>n.live !== false).length === 0 ? (
                    <div className="px-4 py-5 text-center">
                      <p className="text-xs" style={{ color: "#64748B" }}>No active notifications</p>
                    </div>
                  ) : notificationItems.filter((n:any)=>n.live !== false).map((n:any, i:number) => (
                    <button key={n.id || i} onClick={() => { setNotifOpen(false); setNav("library"); }} className="w-full flex items-start gap-3 px-4 py-3 border-b last:border-b-0 text-left transition-colors active:bg-white/5 hover:bg-white/[0.03]" style={{ borderColor: "rgba(255,255,255,0.04)" }}>
                      <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: gold }}/>
                      <div><p className="text-xs leading-snug">{n.title || n.message}</p><p className="text-xs mt-0.5" style={{ color: "#2D4060" }}>{n.time || "Just now"}</p></div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── PAGE ── */}
      <main className="flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
        <div style={{ paddingTop: 14 }}>
          {renderPage()}
        </div>
        {nav !== "ai" && (
          <div className="py-8 text-center">
            <div className="flex items-center justify-center gap-3">
              <div className="h-px w-10" style={{ background: `linear-gradient(90deg,transparent,${gold})` }}/>
              <span className="text-xs font-bold tracking-[0.2em] uppercase" style={{ color: gold, fontFamily: "'Rajdhani',sans-serif" }}>Learn · Apply · Excel</span>
              <div className="h-px w-10" style={{ background: `linear-gradient(90deg,${gold},transparent)` }}/>
            </div>
            <p className="text-xs mt-2" style={{ color: "#111D30" }}>© 2026 FALTAH Enterprise</p>
          </div>
        )}
      </main>

      {selectedResource && <ResourceViewer resource={selectedResource} onClose={() => setSelectedResource(null)} />}

      {/* ── BOTTOM NAV ── */}
      <nav className="flex-shrink-0 flex items-center"
        style={{ height: 64, background: `${navy}FA`, borderTop: "1px solid rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", paddingBottom: "env(safe-area-inset-bottom)" }}>
        {NAV_ITEMS.map(item => {
          const active = nav === item.id;
          const isMore = item.id === "more";
          return (
            <button key={item.id} onClick={() => setNav(item.id)}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 relative py-2 transition-all duration-200 active:scale-90">
              {active && <span className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full" style={{ background: `linear-gradient(90deg,transparent,${gold},transparent)` }}/>}
              <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200 relative"
                style={active ? { background: `${gold}10` } : {}}>
                <item.icon size={17} style={{ color: active ? gold : "#2D4060" }}/>
                {isMore && isAdmin && <span className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: gold }}/>}
              </div>
              <span style={{ fontSize: "9px", color: active ? gold : "#2D4060", fontWeight: active ? 600 : 400, letterSpacing: "0.02em", lineHeight: 1 }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
