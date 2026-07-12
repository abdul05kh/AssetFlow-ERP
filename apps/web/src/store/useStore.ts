import { create } from "zustand";

interface User {
  id: string;
  email: string;
  name: string;
  designation: string;
  role: string;
}

interface ERPState {
  token: string | null;
  user: User | null;
  activeTab: string;
  stats: any | null;
  assets: any[];
  categories: any[];
  departments: any[];
  users: any[];
  notifications: any[];
  maintenanceTickets: any[];
  setToken: (token: string | null, user: User | null) => void;
  setActiveTab: (tab: string) => void;
  setStats: (stats: any) => void;
  setAssets: (assets: any[]) => void;
  setCategories: (categories: any[]) => void;
  setDepartments: (departments: any[]) => void;
  setUsers: (users: any[]) => void;
  setNotifications: (notifications: any[]) => void;
  setMaintenanceTickets: (tickets: any[]) => void;
  logout: () => void;
}

const getInitialUser = (): User | null => {
  if (typeof window === "undefined") return null;
  const userStr = localStorage.getItem("user");
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    localStorage.removeItem("user");
    return null;
  }
};

export const useStore = create<ERPState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  user: getInitialUser(),
  activeTab: "overview",
  stats: null,
  assets: [],
  categories: [],
  departments: [],
  users: [],
  notifications: [],
  maintenanceTickets: [],
  setToken: (token, user) => {
    if (token && user) {
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      set({ token, user });
    } else {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      set({ token: null, user: null });
    }
  },
  setActiveTab: (activeTab) => set({ activeTab }),
  setStats: (stats) => set({ stats }),
  setAssets: (assets) => set({ assets }),
  setCategories: (categories) => set({ categories }),
  setDepartments: (departments) => set({ departments }),
  setUsers: (users) => set({ users }),
  setNotifications: (notifications) => set({ notifications }),
  setMaintenanceTickets: (tickets) => set({ maintenanceTickets: tickets }),
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({
      token: null,
      user: null,
      activeTab: "overview",
      stats: null,
      assets: [],
      categories: [],
      departments: [],
      users: [],
      notifications: [],
      maintenanceTickets: [],
    });
  },
}));
