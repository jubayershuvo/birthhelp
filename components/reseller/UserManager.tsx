"use client";
import React, { useState, useEffect } from "react";
import {
  Search,
  UserPlus,
  Edit2,
  Ban,
  Trash2,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
  Mail,
  Calendar,
  User,
  Shield,
  CreditCard,
} from "lucide-react";
import toast from "react-hot-toast";

interface Service {
  _id: string;
  name: string;
  fee: number;
}

interface ServiceAccess {
  service: string; // service ID
  fee: number; // reseller fee
  _id?: string;
  serviceName?: string;
}

interface User {
  _id: string;
  name: string;
  username: string;
  email: string;
  balance: number;
  isActive: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  lastLogin: Date | null;
  loginAttempts: number;
  createdAt: Date;
  services: ServiceAccess[];
  reseller?: string;
}

interface ApiUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  password: string;
  isEmailVerified: boolean;
  isBanned: boolean;
  services: Array<{
    service: string;
    fee: number;
    _id: string;
  }>;
  reseller: string;
  loginAttempts: number;
  lastLogin: Date | null;
  lastSeen: Date | null;
  lastLoginIp: string;
  location: string;
  lockUntil: Date | null;
  balance: number;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

interface ApiService {
  _id: string;
  name: string;
  fee: number;
}

interface ApiResponse<T> {
  success?: boolean;
  error?: string;
  message?: string;
  data?: T;
}

interface FormData {
  name: string;
  username: string;
  email: string;
  password: string;
  balance: number;
  isActive: boolean;
  isBanned: boolean;
  isEmailVerified: boolean;
  services: ServiceAccess[];
}

const UserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    username: "",
    email: "",
    password: "",
    balance: 0,
    isActive: true,
    isBanned: false,
    isEmailVerified: true,
    services: [],
  });

  // Fetch users and services
  useEffect(() => {
    fetchUsers();
    fetchServices();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/reseller/users");

      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }

      const result: ApiUser[] = await response.json();
      
      const mappedUsers: User[] = result.map((user: ApiUser) => ({
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        balance: user.balance,
        isActive: !user.isBanned,
        isBanned: user.isBanned,
        isEmailVerified: user.isEmailVerified,
        lastLogin: user.lastLogin,
        loginAttempts: user.loginAttempts,
        createdAt: new Date(user.createdAt),
        reseller: user.reseller,
        services: user.services.map((service) => {
          const fullService = services.find((s: Service) => s._id === service.service);
          return {
            service: service.service,
            fee: service.fee, // This is the reseller fee
            _id: service._id,
            serviceName: fullService?.name || `Service ${service.service.substring(0, 8)}...`,
          };
        })
      }));

      setUsers(mappedUsers);
      setFilteredUsers(mappedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const response = await fetch("/api/reseller/services");

      if (!response.ok) {
        throw new Error(`Failed to fetch services: ${response.status}`);
      }

      const result: ApiService[] = await response.json();
      setServices(result);
    } catch (error) {
      console.error("Error fetching services:", error);
      toast.error("Failed to fetch services");
    }
  };

  // Refresh users when services are loaded to update service names
  useEffect(() => {
    if (services.length > 0 && users.length > 0) {
      const updatedUsers: User[] = users.map(user => ({
        ...user,
        services: user.services.map(service => {
          const fullService = services.find((s: Service) => s._id === service.service);
          return {
            ...service,
            serviceName: fullService?.name || `Service ${service.service.substring(0, 8)}...`,
          };
        })
      }));
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
    }
  }, [services, users.length]);

  // Search filter
  useEffect(() => {
    const filtered = users.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // Format currency with BDT symbol
  const formatCurrency = (amount: number): string => {
    return `৳${amount.toFixed(2)}`;
  };

  // Get official fee for a service
  const getOfficialFee = (serviceId: string): number => {
    const service = services.find((s) => s._id === serviceId);
    return service?.fee || 0;
  };

  // Get full service details for a service ID
  const getFullServiceDetails = (serviceId: string): Service | undefined => {
    return services.find((s) => s._id === serviceId);
  };

  // Calculate total fee (official + reseller)
  const calculateTotalFee = (serviceId: string, resellerFee: number): number => {
    const officialFee = getOfficialFee(serviceId);
    return officialFee + resellerFee;
  };

  // Validate service data before submission
  const validateServices = (services: ServiceAccess[]): boolean => {
    const serviceIds = services.map((s) => s.service);
    const uniqueServiceIds = new Set(serviceIds);

    if (serviceIds.length !== uniqueServiceIds.size) {
      toast.error(
        "Duplicate services are not allowed. Please remove duplicate service entries."
      );
      return false;
    }

    if (services.some((s) => s.fee < 0)) {
      toast.error("Reseller fees cannot be negative.");
      return false;
    }

    return true;
  };

  // Validate form data
  const validateFormData = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Name is required");
      return false;
    }

    if (!formData.username.trim()) {
      toast.error("Username is required");
      return false;
    }

    if (!formData.email.trim()) {
      toast.error("Email is required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    if (modalMode === "create" && !formData.password) {
      toast.error("Password is required for new users");
      return false;
    }

    return true;
  };

  const openModal = (mode: "create" | "edit", user: User | null = null) => {
    setModalMode(mode);
    setSelectedUser(user);

    if (mode === "create") {
      setFormData({
        name: "",
        username: "",
        email: "",
        password: "",
        balance: 0,
        isActive: true,
        isBanned: false,
        isEmailVerified: false,
        services: [],
      });
    } else if (mode === "edit" && user) {
      setFormData({
        name: user.name,
        username: user.username,
        email: user.email,
        password: "", // Don't show password in edit mode
        balance: user.balance,
        isActive: user.isActive,
        isBanned: user.isBanned,
        isEmailVerified: user.isEmailVerified,
        services: user.services.map(service => ({
          service: service.service,
          fee: service.fee, // This is the reseller fee
          _id: service._id,
          serviceName: service.serviceName,
        })),
      });
    }
    setShowModal(true);
    setShowPassword(false);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFormData()) {
      return;
    }

    if (!validateServices(formData.services)) {
      return;
    }

    setLoading(true);

    const submitPromise = new Promise(async (resolve, reject) => {
      try {
        const url =
          modalMode === "create"
            ? "/api/reseller/users"
            : `/api/reseller/users/${selectedUser?._id}`;
        const method = modalMode === "create" ? "POST" : "PUT";

        // Prepare the data for API submission
        const submitData = {
          name: formData.name,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          isBanned: formData.isBanned,
          isEmailVerified: formData.isEmailVerified,
          services: formData.services.map(service => ({
            service: service.service,
            fee: service.fee, // reseller fee
          })),
        };



        const response = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(submitData),
        });

        if (!response.ok) {
          const errorData: ApiResponse<never> = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message || `HTTP error! status: ${response.status}`
          );
        }

        const result: ApiResponse<User> = await response.json();

        if (result.error) {
          throw new Error(result.error);
        }

        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    toast
      .promise(submitPromise, {
        loading:
          modalMode === "create" ? "Creating user..." : "Updating user...",
        success: () => {
          fetchUsers();
          closeModal();
          return modalMode === "create"
            ? "User created successfully!"
            : "User updated successfully!";
        },
        error: (error: Error) => {
          console.error("Error saving user:", error);
          return error.message || "Failed to save user";
        },
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const handleBanToggle = async (userId: string) => {
    const user = users.find((u) => u._id === userId);
    const newBanStatus = !user?.isBanned;

    const banPromise = new Promise(async (resolve, reject) => {
      try {
        const response = await fetch(`/api/reseller/users/${userId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ isBanned: newBanStatus }),
        });

        if (!response.ok) {
          const errorData: ApiResponse<never> = await response.json().catch(() => ({}));
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const result: ApiResponse<User> = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Something went wrong");
        }

        fetchUsers();
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(banPromise, {
      loading: newBanStatus ? "Banning user..." : "Unbanning user...",
      success: () =>
        newBanStatus
          ? "User banned successfully!"
          : "User unbanned successfully!",
      error: (error: Error) => error.message || "Failed to update user",
    });
  };

  const addService = () => {
    const availableServices = services.filter(
      (service) => !formData.services.some((s) => s.service === service._id)
    );

    if (availableServices.length === 0) {
      toast.error("All available services have already been added.");
      return;
    }

    const firstAvailableService = availableServices[0];
    
    setFormData((prev) => ({
      ...prev,
      services: [
        ...prev.services,
        {
          service: firstAvailableService._id,
          fee: 0, // Default reseller fee
          serviceName: firstAvailableService.name
        },
      ],
    }));

    toast.success(`Added ${firstAvailableService.name} service`);
  };

  const updateService = (
    index: number,
    field: keyof ServiceAccess,
    value: string | number
  ) => {
    setFormData((prev) => {
      const updatedServices = prev.services.map((service, i) => {
        if (i === index) {
          if (field === "service" && typeof value === "string") {
            const selectedService = getFullServiceDetails(value);
            return {
              ...service,
              service: value,
              serviceName: selectedService?.name
            };
          }

          return {
            ...service,
            [field]: value
          };
        }
        return service;
      });

      return { ...prev, services: updatedServices };
    });
  };

  const removeService = (index: number) => {
    const serviceToRemove = formData.services[index];
    const serviceName = serviceToRemove.serviceName || "Service";

    setFormData((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));

    toast.success(`Removed ${serviceName} service`);
  };

  const getAvailableServices = (currentServiceId: string = ""): Service[] => {
    return services.filter(
      (service) =>
        !formData.services.some((s) => s.service === service._id) ||
        service._id === currentServiceId
    );
  };

  // Format date for display
  const formatDate = (date: Date | null): string => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // User Card Component
  const UserCard = ({ user }: { user: User }) => {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 transition-all duration-200 hover:shadow-lg">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white font-semibold text-lg truncate">{user.name}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">@{user.username}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => openModal("edit", user)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 className="w-4 h-4 text-blue-500" />
            </button>
            <button
              onClick={() => handleBanToggle(user._id)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={user.isBanned ? "Unban" : "Ban"}
            >
              <Ban className={`w-4 h-4 ${user.isBanned ? "text-green-500" : "text-yellow-500"}`} />
            </button>
          </div>
        </div>

        {/* Email and Verification */}
        <div className="flex items-center gap-2 mb-4">
          <Mail className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600 dark:text-gray-300 text-sm truncate flex-1">{user.email}</span>
          {user.isEmailVerified ? (
            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          )}
        </div>

        {/* Balance Section */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-green-500" />
              <span className="text-gray-600 dark:text-gray-300">Balance</span>
            </div>
            <span className="text-gray-900 dark:text-white font-semibold text-lg">
              ৳{user.balance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Services Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-300">Services</span>
            </div>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {user.services.length} service{user.services.length !== 1 ? 's' : ''}
            </span>
          </div>
          
          <div className="space-y-2">
            {user.services.slice(0, 3).map((service, index) => {
              const officialFee = getOfficialFee(service.service);
              const totalFee = officialFee + service.fee;
              
              return (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-gray-900 dark:text-white truncate flex-1 mr-2">
                    {service.serviceName || `Service ${index + 1}`}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-green-600 dark:text-green-400 font-medium whitespace-nowrap">
                      ৳{totalFee}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      (Admin: ৳{officialFee} + Reseller: ৳{service.fee})
                    </span>
                  </div>
                </div>
              );
            })}
            {user.services.length > 3 && (
              <div className="text-center pt-1">
                <span className="text-gray-500 dark:text-gray-400 text-xs">
                  +{user.services.length - 3} more services
                </span>
              </div>
            )}
            {user.services.length === 0 && (
              <div className="text-center py-2">
                <span className="text-gray-500 dark:text-gray-400 text-xs">No services assigned</span>
              </div>
            )}
          </div>
        </div>

        {/* Status and Info Section */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
              <span className={`text-xs ${user.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-500'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {user.isBanned && (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-xs text-red-600 dark:text-red-400">Banned</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <Calendar className="w-3 h-3" />
              <span>{formatDate(user.lastLogin)}</span>
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500">
              Created: {formatDate(user.createdAt)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            User Management
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Manage users, permissions, and account status
          </p>
        </div>

        {/* Search and Controls Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-center w-full lg:w-auto">
              <div className="relative flex-1 w-full lg:w-96">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "grid" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  title="Grid View"
                >
                  <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                    <div className="bg-current rounded-sm"></div>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-md transition-all ${
                    viewMode === "list" 
                      ? "bg-blue-500 text-white" 
                      : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                  }`}
                  title="List View"
                >
                  <div className="w-4 h-4 flex flex-col gap-0.5">
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                    <div className="bg-current rounded-sm h-1"></div>
                  </div>
                </button>
              </div>
            </div>
            
            <button
              onClick={() => openModal("create")}
              className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
              disabled={loading}
            >
              <UserPlus className="w-5 h-5" />
              Create User
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && users.length === 0 && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Users Grid/List View */}
        {!loading && (
          <div>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredUsers.map((user) => (
                  <UserCard key={user._id} user={user} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          User
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Email
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Balance
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Services
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Status
                        </th>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Last Login
                        </th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-600 dark:text-gray-300">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      {filteredUsers.map((user) => (
                        <tr
                          key={user._id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-300">
                                @{user.username}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-gray-600 dark:text-gray-300">{user.email}</span>
                              {user.isEmailVerified ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-1">
                              <span className="text-green-600 dark:text-green-400 font-medium">৳</span>
                              <span className="text-gray-900 dark:text-white font-medium">
                                {user.balance.toFixed(2)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {user.services.map((service, index) => {
                                const officialFee = getOfficialFee(service.service);
                                const totalFee = officialFee + service.fee;
                                
                                return (
                                  <div
                                    key={index}
                                    className="inline-flex flex-col px-3 py-1 rounded-lg text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700"
                                    title={`${service.serviceName} - Total: ৳${totalFee} (Admin: ৳${officialFee} + Reseller: ৳${service.fee})`}
                                  >
                                    <div className="flex items-center gap-1">
                                      <span className="truncate max-w-20">
                                        {service.serviceName || `Service ${index + 1}`}
                                      </span>
                                      <span className="text-green-600 dark:text-green-400 font-medium">
                                        ৳{totalFee}
                                      </span>
                                    </div>
                                    <div className="text-[10px] text-gray-600 dark:text-gray-400">
                                      (A:৳{officialFee} + R:৳{service.fee})
                                    </div>
                                  </div>
                                );
                              })}
                              {user.services.length === 0 && (
                                <span className="text-gray-400 dark:text-gray-500 text-sm">
                                  No services
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                  user.isActive
                                    ? "bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200"
                                    : "bg-gray-100 dark:bg-gray-900 text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {user.isActive ? "Active" : "Inactive"}
                              </span>
                              {user.isBanned && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                                  Banned
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-600 dark:text-gray-300 text-sm">
                            {formatDate(user.lastLogin)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => openModal("edit", user)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 className="w-4 h-4 text-blue-500" />
                              </button>
                              <button
                                onClick={() => handleBanToggle(user._id)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                title={user.isBanned ? "Unban" : "Ban"}
                              >
                                <Ban
                                  className={`w-4 h-4 ${
                                    user.isBanned
                                      ? "text-green-500"
                                      : "text-yellow-500"
                                  }`}
                                />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredUsers.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <UserPlus className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">No users found</p>
                <p className="text-sm mt-2">
                  {searchTerm
                    ? "Try adjusting your search terms"
                    : "Create your first user to get started"}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {modalMode === "create" ? "Create New User" : "Edit User"}
                </h2>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(e) =>
                        setFormData({ ...formData, username: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    {modalMode === "create"
                      ? "Password"
                      : "Password (leave blank to keep current)"}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required={modalMode === "create"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium mb-2">
                    Balance
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400">৳</span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.balance}
                      onChange={(e) =>
                        setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Enhanced Services Section */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-gray-700 dark:text-gray-300 text-sm font-medium">
                      Services Access & Pricing
                    </label>
                    <button
                      type="button"
                      onClick={addService}
                      className="flex items-center gap-2 px-3 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      Add Service
                    </button>
                  </div>

                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {formData.services.map((service, index) => {
                      const fullService = getFullServiceDetails(service.service);
                      const officialFee = getOfficialFee(service.service);
                      const totalFee = officialFee + service.fee;

                      return (
                        <div
                          key={index}
                          className="flex gap-3 items-start p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Service
                              </label>
                              <select
                                value={service.service}
                                onChange={(e) =>
                                  updateService(
                                    index,
                                    "service",
                                    e.target.value
                                  )
                                }
                                className="w-full px-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              >
                                <option value="">Select a Service</option>
                                {getAvailableServices(service.service).map(
                                  (svc) => (
                                    <option key={svc._id} value={svc._id}>
                                      {svc.name} (Admin: ৳{svc.fee})
                                    </option>
                                  )
                                )}
                              </select>
                              {fullService && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                  Current Admin Fee: ৳{officialFee}
                                </div>
                              )}
                            </div>
                            
                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Admin Fee (৳)
                                <span className="text-blue-600 dark:text-blue-400 ml-1">
                                  Inner Fee
                                </span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">৳</span>
                                <input
                                  type="number"
                                  step="1"
                                  value={officialFee}
                                  readOnly
                                  className="w-full pl-10 pr-3 py-2 bg-gray-100 dark:bg-gray-500 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none cursor-not-allowed"
                                />
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                Set by admin (read-only)
                              </div>
                            </div>

                            <div>
                              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                                Reseller Fee (৳)
                                <span className="text-green-600 dark:text-green-400 ml-1">
                                  Outer Fee
                                </span>
                              </label>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">৳</span>
                                <input
                                  type="number"
                                  step="1"
                                  min="0"
                                  placeholder="0"
                                  value={service.fee}
                                  onChange={(e) =>
                                    updateService(
                                      index,
                                      "fee",
                                      parseFloat(e.target.value) || 0
                                    )
                                  }
                                  className="w-full pl-10 pr-3 py-2 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                              <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                                Total: ৳{totalFee}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeService(index)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors mt-6"
                            title="Remove Service"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}

                    {formData.services.length === 0 && (
                      <div className="text-center py-6 text-gray-500 dark:text-gray-400 text-sm">
                        <UserPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        No services added. Click &quot;Add Service&quot; to
                        grant access.
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isBanned}
                      onChange={(e) =>
                        setFormData({ ...formData, isBanned: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Banned</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isEmailVerified}
                      onChange={(e) =>
                        setFormData({ ...formData, isEmailVerified: e.target.checked })
                      }
                      className="w-5 h-5 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-blue-500 focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-gray-700 dark:text-gray-300">Email Verified</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading
                      ? "Saving..."
                      : modalMode === "create"
                      ? "Create User"
                      : "Save Changes"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;