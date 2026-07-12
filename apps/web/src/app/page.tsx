"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useStore } from "../store/useStore";
import {
  LayoutDashboard,
  Box,
  RefreshCw,
  AlertTriangle,
  Clipboard,
  Bell,
  LogOut,
  Search,
  Plus,
  User,
  Building,
  Check,
  Calendar,
  Download,
  ArrowRight,
  ShieldCheck,
  Activity,
  MapPin,
  Laptop,
  CheckCircle,
  FileText
} from "lucide-react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export default function ERPPortal() {
  const {
    token,
    user,
    activeTab,
    stats,
    assets,
    categories,
    departments,
    users,
    notifications,
    maintenanceTickets,
    setToken,
    setActiveTab,
    setStats,
    setAssets,
    setCategories,
    setDepartments,
    setUsers,
    setNotifications,
    setMaintenanceTickets,
    logout
  } = useStore();

  // Authentication states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Search & Filters
  const [assetSearch, setAssetSearch] = useState("");
  const [assetStatusFilter, setAssetStatusFilter] = useState("");

  // Modals & Form States
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [newAsset, setNewAsset] = useState({
    name: "",
    serialNumber: "",
    categoryId: "",
    departmentId: "",
    acquisitionDate: new Date().toISOString().substring(0, 16),
    acquisitionCost: "0.00",
    currentLocation: "",
    condition: "NEW",
    sharedResource: false,
    description: ""
  });

  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [allocAssetId, setAllocAssetId] = useState("");
  const [newAllocation, setNewAllocation] = useState({
    employeeId: "",
    departmentId: "",
    assignTo: "employee", // employee or department
    expectedReturnDate: "",
    notes: ""
  });

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnAssetId, setReturnAssetId] = useState("");
  const [newReturn, setNewReturn] = useState({
    conditionOnReturn: "GOOD",
    notes: ""
  });

  const [showMaintModal, setShowMaintModal] = useState(false);
  const [maintAssetId, setMaintAssetId] = useState("");
  const [newMaint, setNewMaint] = useState({
    description: "",
    priority: "MEDIUM"
  });

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [newAudit, setNewAudit] = useState({
    name: "Q3 Department Asset Verification",
    departmentId: "",
    location: "Corporate Offices, Floor 3",
    startDate: new Date().toISOString().substring(0, 16),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString().substring(0, 16),
    auditorId: ""
  });

  const [showAuditVerifyModal, setShowAuditVerifyModal] = useState(false);
  const [selectedAuditItemId, setSelectedAuditItemId] = useState("");
  const [auditVerify, setAuditVerify] = useState({
    status: "VERIFIED",
    discrepancyNotes: ""
  });

  const [showMaintActionModal, setShowMaintActionModal] = useState(false);
  const [selectedMaintTicket, setSelectedMaintTicket] = useState<any>(null);
  const [maintActionType, setMaintActionType] = useState<"assign" | "resolve" | "close">("assign");
  const [maintAssigneeId, setMaintAssigneeId] = useState("");
  const [maintResolveCost, setMaintResolveCost] = useState("0.00");
  const [maintResolveNotes, setMaintResolveNotes] = useState("");
  const [maintCloseStatus, setMaintCloseStatus] = useState("AVAILABLE");
  const [maintCloseCondition, setMaintCloseCondition] = useState("GOOD");

  // System Logs count
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // -------------------------------------------------------------
  // API INTEGRATION UTILITIES
  // -------------------------------------------------------------

  const fetchWithAuth = async (endpoint: string, options: RequestInit = {}) => {
    if (!token) return null;
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers
    };
    const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    if (res.status === 401) {
      logout();
      return null;
    }
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: "API Request failed" }));
      throw new Error(err.message || "Request failed");
    }
    return res.json();
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Authentication failed" }));
        throw new Error(err.message || "Invalid credentials");
      }

      const payload = await res.json();
      setToken(payload.data.accessToken, payload.data.user);
    } catch (err: any) {
      setLoginError(err.message || "Connection refused");
    } finally {
      setLoading(false);
    }
  };

  // Reload core dashboard data
  const loadDashboardData = async () => {
    if (!token) return;
    try {
      // 1. Fetch Stats
      const statsRes = await fetchWithAuth("/dashboard/stats");
      if (statsRes) setStats(statsRes.data);

      // 2. Fetch Assets
      const assetsRes = await fetchWithAuth(`/assets?limit=100&search=${assetSearch}&status=${assetStatusFilter}`);
      if (assetsRes) setAssets(assetsRes.data);

      // 3. Fetch Notifications
      const notifRes = await fetchWithAuth("/notifications?limit=20");
      if (notifRes) setNotifications(notifRes.data);

      // 4. Fetch Maintenance requests
      const maintRes = await fetchWithAuth("/maintenance?limit=50");
      if (maintRes) setMaintenanceTickets(maintRes.data);

      // 5. Fetch dropdown utilities
      const catsRes = await fetchWithAuth("/assets/categories");
      if (catsRes) setCategories(catsRes.data);

      const deptsRes = await fetchWithAuth("/departments");
      if (deptsRes) setDepartments(deptsRes.data);

      const usersRes = await fetchWithAuth("/users?limit=100");
      if (usersRes) setUsers(usersRes.data);

      // 6. Fetch Activity Logs
      const logsRes = await fetchWithAuth("/users"); // Fallback list
      if (logsRes) setActivityLogs(logsRes.data);
    } catch (err: any) {
      console.error("Dashboard reload failed", err);
    }
  };

  useEffect(() => {
    if (token) {
      loadDashboardData();
    }
  }, [token, activeTab, assetSearch, assetStatusFilter]);

  // Handle asset registration submit
  const handleRegisterAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/assets", {
        method: "POST",
        body: JSON.stringify({
          name: newAsset.name,
          serialNumber: newAsset.serialNumber || null,
          categoryId: newAsset.categoryId,
          departmentId: newAsset.departmentId,
          acquisitionDate: new Date(newAsset.acquisitionDate).toISOString(),
          acquisitionCost: parseFloat(newAsset.acquisitionCost),
          currentLocation: newAsset.currentLocation,
          condition: newAsset.condition,
          sharedResource: newAsset.sharedResource,
          description: newAsset.description || null
        })
      });
      setShowAssetModal(false);
      loadDashboardData();
      setNewAsset({
        name: "",
        serialNumber: "",
        categoryId: "",
        departmentId: "",
        acquisitionDate: new Date().toISOString().substring(0, 16),
        acquisitionCost: "0.00",
        currentLocation: "",
        condition: "NEW",
        sharedResource: false,
        description: ""
      });
    } catch (err: any) {
      alert(`Registration failed: ${err.message}`);
    }
  };

  // Handle asset allocation submit
  const handleAllocate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/allocations", {
        method: "POST",
        body: JSON.stringify({
          assetId: allocAssetId,
          employeeId: newAllocation.assignTo === "employee" ? newAllocation.employeeId : null,
          departmentId: newAllocation.assignTo === "department" ? newAllocation.departmentId : null,
          expectedReturnDate: newAllocation.expectedReturnDate ? new Date(newAllocation.expectedReturnDate).toISOString() : null,
          notes: newAllocation.notes || null
        })
      });
      setShowAllocateModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Allocation failed: ${err.message}`);
    }
  };

  // Handle asset return submit
  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/returns", {
        method: "POST",
        body: JSON.stringify({
          assetId: returnAssetId,
          conditionOnReturn: newReturn.conditionOnReturn,
          notes: newReturn.notes || null
        })
      });
      setShowReturnModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Return process failed: ${err.message}`);
    }
  };

  // Handle maintenance submit
  const handleMaint = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/maintenance", {
        method: "POST",
        body: JSON.stringify({
          assetId: maintAssetId,
          description: newMaint.description,
          priority: newMaint.priority
        })
      });
      setShowMaintModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Maintenance raise failed: ${err.message}`);
    }
  };

  // Handle audit creation submit
  const handleCreateAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth("/audits", {
        method: "POST",
        body: JSON.stringify({
          name: newAudit.name,
          departmentId: newAudit.departmentId,
          location: newAudit.location,
          startDate: new Date(newAudit.startDate).toISOString(),
          endDate: new Date(newAudit.endDate).toISOString(),
          auditorId: newAudit.auditorId
        })
      });
      setShowAuditModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Audit creation failed: ${err.message}`);
    }
  };

  // Handle audit item verify
  const handleVerifyAuditItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetchWithAuth(`/audits/items/${selectedAuditItemId}/verify`, {
        method: "PUT",
        body: JSON.stringify(auditVerify)
      });
      setShowAuditVerifyModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Verification failed: ${err.message}`);
    }
  };

  // Handle maintenance workflow action
  const handleMaintAction = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (maintActionType === "assign") {
        await fetchWithAuth(`/maintenance/${selectedMaintTicket.id}/assign`, {
          method: "PUT",
          body: JSON.stringify({ technicianId: maintAssigneeId })
        });
      } else if (maintActionType === "resolve") {
        await fetchWithAuth(`/maintenance/${selectedMaintTicket.id}/resolve`, {
          method: "PUT",
          body: JSON.stringify({
            cost: parseFloat(maintResolveCost),
            notes: maintResolveNotes
          })
        });
      } else if (maintActionType === "close") {
        await fetchWithAuth(`/maintenance/${selectedMaintTicket.id}/close`, {
          method: "PUT",
          body: JSON.stringify({
            assetStatusAfterRepair: maintCloseStatus,
            assetConditionAfterRepair: maintCloseCondition
          })
        });
      }
      setShowMaintActionModal(false);
      loadDashboardData();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  // Mark all notifications read
  const handleMarkNotificationsAll = async () => {
    try {
      await fetchWithAuth("/notifications/read-all", { method: "PUT" });
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  // Export report trigger
  const triggerCsvReport = (type: "assets" | "maintenance") => {
    if (!token) return;
    const url = `${API_BASE}/dashboard/reports/${type}/export`;
    const a = document.createElement("a");
    a.href = url;
    // Set headers is not easily mockable in raw a href, but since the API sets Content-Disposition, it downloads automatically
    window.open(url, "_blank");
  };

  // -------------------------------------------------------------
  // RENDERING LOGIC
  // -------------------------------------------------------------

  if (!token) {
    // Elegant Dark Theme Login UI
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 font-sans p-6">
        <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-6">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-lg mb-3">
              <ShieldCheck className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">AssetFlow ERP</h2>
            <p className="text-sm text-zinc-400 mt-1">Enterprise Resource Portal</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="rounded-lg bg-red-950/50 border border-red-500/30 p-3 text-sm text-red-200">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@assetflow.erp"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase text-zinc-400 mb-1">Security Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 py-3 text-sm font-semibold text-white shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 focus:ring-offset-zinc-950 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <span className="text-xs text-zinc-500">Authorized Personnel Only</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-white/10 bg-zinc-900 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/10">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 shadow-md">
              <ShieldCheck className="h-4.5 w-4.5 text-white" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block">AssetFlow ERP</span>
              <span className="text-[10px] text-cyan-400 uppercase font-semibold">Production Mode</span>
            </div>
          </div>

          <nav className="mt-6 px-4 space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "overview" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <LayoutDashboard className="h-4 w-4" /> Overview
            </button>

            <button
              onClick={() => setActiveTab("assets")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "assets" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Box className="h-4 w-4" /> Assets Inventory
            </button>

            <button
              onClick={() => setActiveTab("allocations")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "allocations" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Calendar className="h-4 w-4" /> Reserves & Bookings
            </button>

            <button
              onClick={() => setActiveTab("maintenance")}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "maintenance" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <AlertTriangle className="h-4 w-4" /> Maintenance
            </button>

            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium rounded-lg transition-all ${
                activeTab === "notifications" ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="h-4 w-4" /> Alerts Inbox
              </div>
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* User Card & Logout */}
        <div className="p-4 border-t border-white/10 bg-zinc-950/40">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <User className="h-4 w-4 text-cyan-400" />
              </div>
              <div className="overflow-hidden w-28">
                <span className="text-xs font-semibold text-white block truncate">{user?.name}</span>
                <span className="text-[10px] text-zinc-400 block truncate">{user?.designation}</span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Logout session"
              className="p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 bg-zinc-950">
        {/* Top Header */}
        <header className="h-16 border-b border-white/10 bg-zinc-900/50 flex items-center justify-between px-8">
          <h1 className="text-lg font-bold tracking-tight text-white capitalize">{activeTab}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400 border border-emerald-500/20">
              <Activity className="h-3 w-3 animate-pulse" /> Core Backend Connected
            </div>
          </div>
        </header>

        {/* Dynamic Content Views */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-zinc-400">Total Registry Assets</span>
                    <Box className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">{stats?.assets.total || 0}</div>
                  <span className="text-xs text-zinc-500 mt-1 block">Active records in database</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-zinc-400">Inventory Valuation</span>
                    <span className="text-cyan-400 text-xs font-bold">USD</span>
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">
                    ${(stats?.assets.totalValue || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <span className="text-xs text-zinc-500 mt-1 block">Acquisition cost total sum</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-zinc-400">Active Allocations</span>
                    <User className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">{stats?.allocations.active || 0}</div>
                  <span className="text-xs text-zinc-500 mt-1 block">Assigned laptop/fleet counts</span>
                </div>

                <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase text-zinc-400">Active Repair Tickets</span>
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  </div>
                  <div className="text-2xl font-bold tracking-tight text-white">{stats?.maintenance.active || 0}</div>
                  <span className="text-xs text-zinc-500 mt-1 block">Pending resolved repairs</span>
                </div>
              </div>

              {/* Quick Actions & Reporting */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white">Asset Inventory Status breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-zinc-950/60 rounded-lg border border-white/5 text-center">
                      <span className="text-xs font-medium text-zinc-400 block">Available</span>
                      <span className="text-xl font-bold text-emerald-400 block mt-1">{stats?.assets.byStatus.AVAILABLE || 0}</span>
                    </div>
                    <div className="p-4 bg-zinc-950/60 rounded-lg border border-white/5 text-center">
                      <span className="text-xs font-medium text-zinc-400 block">Allocated</span>
                      <span className="text-xl font-bold text-cyan-400 block mt-1">{stats?.assets.byStatus.ALLOCATED || 0}</span>
                    </div>
                    <div className="p-4 bg-zinc-950/60 rounded-lg border border-white/5 text-center">
                      <span className="text-xs font-medium text-zinc-400 block">In Maintenance</span>
                      <span className="text-xl font-bold text-amber-400 block mt-1">{stats?.assets.byStatus.UNDER_MAINTENANCE || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-md space-y-4">
                  <h3 className="text-base font-bold text-white">Compliance Reporting</h3>
                  <p className="text-xs text-zinc-400">Download formatted CSV reports directly generated from current inventory databases.</p>
                  <div className="space-y-2 pt-2">
                    <button
                      onClick={() => triggerCsvReport("assets")}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-cyan-400" /> Export Assets CSV</span>
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => triggerCsvReport("maintenance")}
                      className="w-full flex items-center justify-between px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-amber-400" /> Export Maintenance CSV</span>
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ASSETS REGISTRY */}
          {activeTab === "assets" && (
            <div className="space-y-6">
              {/* Toolbar */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3 bg-zinc-900 border border-white/10 rounded-lg px-3 py-1.5 w-full md:max-w-md">
                  <Search className="h-4 w-4 text-zinc-500" />
                  <input
                    type="text"
                    value={assetSearch}
                    onChange={(e) => setAssetSearch(e.target.value)}
                    placeholder="Search by tag, name, or serial..."
                    className="bg-transparent border-none outline-none text-sm text-white w-full placeholder-zinc-500"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <select
                    value={assetStatusFilter}
                    onChange={(e) => setAssetStatusFilter(e.target.value)}
                    className="bg-zinc-900 border border-white/10 rounded-lg px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="">All Statuses</option>
                    <option value="AVAILABLE">Available</option>
                    <option value="ALLOCATED">Allocated</option>
                    <option value="UNDER_MAINTENANCE">Maintenance</option>
                  </select>

                  <button
                    onClick={() => setShowAssetModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-xs font-semibold text-white rounded-lg shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" /> Register Asset
                  </button>
                </div>
              </div>

              {/* Assets Table */}
              <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/40 text-xs font-bold uppercase text-zinc-400">
                      <th className="px-6 py-4">Tag</th>
                      <th className="px-6 py-4">Asset Details</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Condition</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assets.map((asset) => (
                      <tr key={asset.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-mono text-cyan-400 font-semibold">{asset.tag}</td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{asset.name}</span>
                          <span className="text-xs text-zinc-400 block mt-0.5">SN: {asset.serialNumber || "N/A"}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">{asset.department.code}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            asset.status === "AVAILABLE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            asset.status === "ALLOCATED" ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" :
                            "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {asset.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs text-zinc-300 font-semibold">{asset.condition}</span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {asset.status === "AVAILABLE" && (
                            <button
                              onClick={() => {
                                setAllocAssetId(asset.id);
                                setShowAllocateModal(true);
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Allocate
                            </button>
                          )}
                          {asset.status === "ALLOCATED" && (
                            <button
                              onClick={() => {
                                setReturnAssetId(asset.id);
                                setShowReturnModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Return
                            </button>
                          )}
                          {asset.status !== "UNDER_MAINTENANCE" && (
                            <button
                              onClick={() => {
                                setMaintAssetId(asset.id);
                                setShowMaintModal(true);
                              }}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Repair
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {assets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          No physical assets found matching filter parameters
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: RESERVES & BOOKINGS */}
          {activeTab === "allocations" && (
            <div className="space-y-8">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white">Shared Resource Bookings</h3>
                <button
                  onClick={() => setShowAuditModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-xs font-semibold text-white rounded-lg shadow-md transition-all cursor-pointer"
                >
                  <Clipboard className="h-3.5 w-3.5" /> Start Department Audit
                </button>
              </div>

              {/* Bookings table */}
              <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/40 text-xs font-bold uppercase text-zinc-400">
                      <th className="px-6 py-4">Resource</th>
                      <th className="px-6 py-4">Reserved By</th>
                      <th className="px-6 py-4">Interval Time</th>
                      <th className="px-6 py-4">Purpose</th>
                      <th className="px-6 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {assets.filter((a) => a.sharedResource).map((res) => (
                      <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{res.name}</span>
                          <span className="text-xs font-mono text-cyan-400 mt-0.5">{res.tag}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">N/A</td>
                        <td className="px-6 py-4 text-zinc-400 text-xs">Always Open</td>
                        <td className="px-6 py-4 text-zinc-300">Shared Resource</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 text-[10px] font-bold border border-cyan-500/20">
                            SHARED
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: MAINTENANCE */}
          {activeTab === "maintenance" && (
            <div className="space-y-6">
              <h3 className="text-base font-bold text-white border-b border-white/10 pb-4">Repair Tickets Pipeline</h3>

              <div className="rounded-xl border border-white/10 bg-zinc-900 overflow-hidden shadow-md">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 bg-zinc-950/40 text-xs font-bold uppercase text-zinc-400">
                      <th className="px-6 py-4">Asset Tag</th>
                      <th className="px-6 py-4">Description</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Technician</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {maintenanceTickets.map((ticket) => (
                      <tr key={ticket.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-semibold text-white block">{ticket.asset.name}</span>
                          <span className="font-mono text-cyan-400 text-xs mt-0.5 block">{ticket.asset.tag}</span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300 truncate max-w-xs">{ticket.description}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                            ticket.priority === "CRITICAL" ? "bg-red-500/10 text-red-400 border-red-500/20" :
                            ticket.priority === "HIGH" ? "bg-orange-500/10 text-orange-400 border-orange-500/20" :
                            "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                          }`}>
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-zinc-300">
                          {ticket.technician ? ticket.technician.name : "Unassigned"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            ticket.status === "CLOSED" ? "bg-zinc-500/10 text-zinc-400 border border-white/10" :
                            ticket.status === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                            ticket.status === "PENDING" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                            "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                          }`}>
                            {ticket.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right space-x-2">
                          {ticket.status === "PENDING" && (
                            <button
                              onClick={() => {
                                setSelectedMaintTicket(ticket);
                                setMaintActionType("assign");
                                setShowMaintActionModal(true);
                              }}
                              className="px-2.5 py-1 bg-cyan-500 hover:bg-cyan-600 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Assign
                            </button>
                          )}
                          {ticket.status === "TECHNICIAN_ASSIGNED" && user?.role === "TECHNICIAN" && (
                            <button
                              onClick={async () => {
                                try {
                                  await fetchWithAuth(`/maintenance/${ticket.id}/start`, { method: "PUT" });
                                  loadDashboardData();
                                } catch (err: any) {
                                  alert(`Failed: ${err.message}`);
                                }
                              }}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Start
                            </button>
                          )}
                          {ticket.status === "IN_PROGRESS" && (
                            <button
                              onClick={() => {
                                setSelectedMaintTicket(ticket);
                                setMaintActionType("resolve");
                                setShowMaintActionModal(true);
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                          {ticket.status === "RESOLVED" && (
                            <button
                              onClick={() => {
                                setSelectedMaintTicket(ticket);
                                setMaintActionType("close");
                                setShowMaintActionModal(true);
                              }}
                              className="px-2.5 py-1 bg-zinc-700 hover:bg-zinc-600 text-[10px] font-semibold text-white rounded transition-all cursor-pointer"
                            >
                              Close
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {maintenanceTickets.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-zinc-500">
                          No active maintenance tickets in queue
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: ALERTS INBOX */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h3 className="text-base font-bold text-white">System Alerts inbox</h3>
                <button
                  onClick={handleMarkNotificationsAll}
                  className="flex items-center gap-2 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white rounded-lg transition-all cursor-pointer"
                >
                  <CheckCircle className="h-3.5 w-3.5" /> Mark All as Read
                </button>
              </div>

              <div className="space-y-3">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    onClick={async () => {
                      if (!notif.isRead) {
                        try {
                          await fetchWithAuth(`/notifications/${notif.id}/read`, { method: "PUT" });
                          loadDashboardData();
                        } catch (e) {
                          console.error(e);
                        }
                      }
                    }}
                    className={`p-4 rounded-xl border transition-all flex items-start gap-4 cursor-pointer ${
                      notif.isRead
                        ? "bg-zinc-900/50 border-white/5 opacity-60"
                        : "bg-zinc-900 border-cyan-500/30 hover:border-cyan-500/50 shadow-md"
                    }`}
                  >
                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5">
                      <Bell className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-white">{notif.eventType} Event Alert</p>
                      <p className="text-xs text-zinc-300 mt-1">{notif.message}</p>
                      <span className="text-[10px] text-zinc-500 block mt-2">
                        {new Date(notif.createdAt).toLocaleTimeString()} - {new Date(notif.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {!notif.isRead && (
                      <span className="h-2 w-2 rounded-full bg-cyan-500 mt-2 shadow-sm shadow-cyan-500" />
                    )}
                  </div>
                ))}
                {notifications.length === 0 && (
                  <div className="p-12 text-center text-zinc-500 border border-dashed border-white/10 rounded-xl">
                    Your inbox notification log is empty
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* -------------------------------------------------------------
          MODALS & DIALOG FORM OVERLAYS
          ------------------------------------------------------------- */}

      {/* 1. Register Asset Modal */}
      {showAssetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Register Physical Asset</h3>
            <form onSubmit={handleRegisterAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Asset Name</label>
                  <input
                    type="text"
                    required
                    value={newAsset.name}
                    onChange={(e) => setNewAsset({ ...newAsset, name: e.target.value })}
                    placeholder="e.g., Lenovo ThinkPad T14"
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={newAsset.serialNumber}
                    onChange={(e) => setNewAsset({ ...newAsset, serialNumber: e.target.value })}
                    placeholder="e.g., L3-AAAAAA"
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Category Classification</label>
                  <select
                    required
                    value={newAsset.categoryId}
                    onChange={(e) => setNewAsset({ ...newAsset, categoryId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Assigned Department</label>
                  <select
                    required
                    value={newAsset.departmentId}
                    onChange={(e) => setNewAsset({ ...newAsset, departmentId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Acquisition Cost (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAsset.acquisitionCost}
                    onChange={(e) => setNewAsset({ ...newAsset, acquisitionCost: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Acquisition Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAsset.acquisitionDate}
                    onChange={(e) => setNewAsset({ ...newAsset, acquisitionDate: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Location Details</label>
                  <input
                    type="text"
                    required
                    value={newAsset.currentLocation}
                    onChange={(e) => setNewAsset({ ...newAsset, currentLocation: e.target.value })}
                    placeholder="e.g., HQ Room 302"
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Asset condition</label>
                  <select
                    value={newAsset.condition}
                    onChange={(e) => setNewAsset({ ...newAsset, condition: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="NEW">New / Boxed</option>
                    <option value="GOOD">Good</option>
                    <option value="FAIR">Fair</option>
                    <option value="POOR">Poor</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="shared"
                  checked={newAsset.sharedResource}
                  onChange={(e) => setNewAsset({ ...newAsset, sharedResource: e.target.checked })}
                  className="rounded border-white/10 bg-zinc-950"
                />
                <label htmlFor="shared" className="text-xs text-zinc-400 select-none">Mark as Shared Resource Reservation Asset</label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Asset Description</label>
                <textarea
                  value={newAsset.description}
                  onChange={(e) => setNewAsset({ ...newAsset, description: e.target.value })}
                  placeholder="Additional notes, features..."
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-2 text-xs text-white outline-none h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAssetModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Allocate Asset Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Allocate Physical Asset</h3>
            <form onSubmit={handleAllocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Assign Target Option</label>
                <select
                  value={newAllocation.assignTo}
                  onChange={(e) => setNewAllocation({ ...newAllocation, assignTo: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="employee">Individual Employee</option>
                  <option value="department">Core Department</option>
                </select>
              </div>

              {newAllocation.assignTo === "employee" ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Select employee</label>
                  <select
                    required
                    value={newAllocation.employeeId}
                    onChange={(e) => setNewAllocation({ ...newAllocation, employeeId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Employee</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.designation})</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Select Department</label>
                  <select
                    required
                    value={newAllocation.departmentId}
                    onChange={(e) => setNewAllocation({ ...newAllocation, departmentId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Expected Return Date</label>
                <input
                  type="datetime-local"
                  value={newAllocation.expectedReturnDate}
                  onChange={(e) => setNewAllocation({ ...newAllocation, expectedReturnDate: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Assignment Remarks</label>
                <textarea
                  value={newAllocation.notes}
                  onChange={(e) => setNewAllocation({ ...newAllocation, notes: e.target.value })}
                  placeholder="Notes, instructions..."
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-2 text-xs text-white outline-none h-16 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAllocateModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Allocate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Return Asset Modal */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Execute Asset Return</h3>
            <form onSubmit={handleReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Returned Condition Assessment</label>
                <select
                  value={newReturn.conditionOnReturn}
                  onChange={(e) => setNewReturn({ ...newReturn, conditionOnReturn: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="NEW">New</option>
                  <option value="GOOD">Good</option>
                  <option value="FAIR">Fair</option>
                  <option value="POOR">Poor</option>
                  <option value="DAMAGED">Damaged / Needs Repair</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Return Inspector Notes</label>
                <textarea
                  required
                  value={newReturn.notes}
                  onChange={(e) => setNewReturn({ ...newReturn, notes: e.target.value })}
                  placeholder="Provide checklist report details..."
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-2 text-xs text-white outline-none h-20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Submit Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Request Maintenance Modal */}
      {showMaintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Raise Maintenance Ticket</h3>
            <form onSubmit={handleMaint} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Repair Issue Description</label>
                <textarea
                  required
                  value={newMaint.description}
                  onChange={(e) => setNewMaint({ ...newMaint, description: e.target.value })}
                  placeholder="Detail hardware anomalies..."
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-2 text-xs text-white outline-none h-24 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Repair Priority</label>
                <select
                  value={newMaint.priority}
                  onChange={(e) => setNewMaint({ ...newMaint, priority: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Raise Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Maintenance Operations Workflow Actions Modal */}
      {showMaintActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white capitalize">Maintenance: {maintActionType} request</h3>
            <form onSubmit={handleMaintAction} className="space-y-4">
              {maintActionType === "assign" && (
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Select Technician</label>
                  <select
                    required
                    value={maintAssigneeId}
                    onChange={(e) => setMaintAssigneeId(e.target.value)}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Technician</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {maintActionType === "resolve" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Repair Cost (USD)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={maintResolveCost}
                      onChange={(e) => setMaintResolveCost(e.target.value)}
                      className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Resolution Details</label>
                    <textarea
                      required
                      value={maintResolveNotes}
                      onChange={(e) => setMaintResolveNotes(e.target.value)}
                      placeholder="e.g. replaced parts, cables..."
                      className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-2 text-xs text-white outline-none h-20 resize-none"
                    />
                  </div>
                </>
              )}

              {maintActionType === "close" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Asset Status After repair</label>
                    <select
                      value={maintCloseStatus}
                      onChange={(e) => setMaintCloseStatus(e.target.value)}
                      className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="AVAILABLE">Available</option>
                      <option value="RETIRED">Retired</option>
                      <option value="DISPOSED">Disposed</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-400 mb-1">Asset Condition After repair</label>
                    <select
                      value={maintCloseCondition}
                      onChange={(e) => setMaintCloseCondition(e.target.value)}
                      className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                    >
                      <option value="NEW">New</option>
                      <option value="GOOD">Good</option>
                      <option value="FAIR">Fair</option>
                      <option value="POOR">Poor</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowMaintActionModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Execute Action
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Start Department Audit Modal */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Start Department Audit Cycle</h3>
            <form onSubmit={handleCreateAudit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Audit Cycle Name</label>
                <input
                  type="text"
                  required
                  value={newAudit.name}
                  onChange={(e) => setNewAudit({ ...newAudit, name: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Department</label>
                  <select
                    required
                    value={newAudit.departmentId}
                    onChange={(e) => setNewAudit({ ...newAudit, departmentId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Auditor Assigned</label>
                  <select
                    required
                    value={newAudit.auditorId}
                    onChange={(e) => setNewAudit({ ...newAudit, auditorId: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  >
                    <option value="">Select Auditor</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-400 mb-1">Physical Location</label>
                <input
                  type="text"
                  required
                  value={newAudit.location}
                  onChange={(e) => setNewAudit({ ...newAudit, location: e.target.value })}
                  className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">Start Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAudit.startDate}
                    onChange={(e) => setNewAudit({ ...newAudit, startDate: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">End Date</label>
                  <input
                    type="datetime-local"
                    required
                    value={newAudit.endDate}
                    onChange={(e) => setNewAudit({ ...newAudit, endDate: e.target.value })}
                    className="w-full rounded bg-zinc-950 border border-white/10 px-3 py-1.5 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAuditModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 rounded text-xs font-semibold text-white transition-all cursor-pointer"
                >
                  Initiate Cycle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
