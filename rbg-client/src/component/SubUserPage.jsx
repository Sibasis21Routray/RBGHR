import React, { useState, useEffect } from "react";
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  LogOut,
  MessageSquare,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

// Department options for filter dropdown
const DEPARTMENT_OPTIONS = [
  "Agency",
  "Banca",
  "Direct",
  "Training",
  "Operations / Back-office",
  "Underwriting",
  "NPS",
  "Strategy",
  "Product Development",
  "Claims Management",
  "Retension",
  "Actuarial",
  "Broking Channel",
  "SME Agency",
  "Defence",
  "Reinsurance",
  "Online/Digital Sales",
  "Telly - VRM",
  "Policy Servicing / Customer Service",
  "Compliance & Legal",
  "Risk Management",
  "Regulatory compliance",
  "Finance & Accounts",
  "Investments / Fund Management",
  "Human Resources (HR)",
  "IT / Technology",
  "Administration & Facilities",
  "Marketing & Brand Management",
  "Analytics & Business Intelligence",
  "Partnership & Alliances Acquisition",
  "Corportate Sales",
  "OEM",
  "Group Insurance",
  "Other"
];

// Company options for filter dropdown
const COMPANY_OPTIONS = [
  // Life Insurance
  "Acko Life Insurance Ltd",
  "Aditya Birla Sun Life Insurance Co. Ltd",
  "Ageas Federal Life Insurance Company Limited",
  "Aviva Life Insurance Company India Limited",
  "Bajaj Allianz Life Insurance Co. Ltd.",
  "Bandhan Life Insurance (formerly Aegon Life)",
  "Canara HSBC Life Insurance Company Limited",
  "Edelweiss Life Insurance Company Limited",
  "Future Generali India Life Insurance Company limited",
  "Go Digit Life Insurance Limited",
  "HDFC Life Insurance Co. Ltd",
  "ICICI Prudential Life Insurance Co. Ltd",
  "IndiaFirst Life Insurance Company Limited",
  "Kotak Mahindra life Insurance Co. Ltd",
  "Life Insurance Corporation of India",
  "PNB MetLife India Insurance Company Limited",
  "Reliance Nippon Life Insurance Company Limited",
  "Sahara India Life Insurance Company Limited",
  "SBI Life Insurance Co. Ltd",
  "Shriram Life Insurance Company Limited",
  "Star Union Dai-ichi Life Insurance Company Limited",
  "TATA AIA Life Insurance Co. Ltd",
  // General Insurance
  "Acko General Insurance Ltd",
  "Agriculture Insurance Company of India Limited",
  "Bajaj Allianz General Insurance",
  "Cholamandalam MS General Insurance Company Limited",
  "ECGC Limited",
  "Go Digit General Insurance Limited",
  "HDFC ERGO General Insurance Company Limited",
  "ICICI Lombard General Insurance",
  "IFFCO TOKIO General Insurance Company Limited",
  "Kotak Mahindra General Insurance",
  "Liberty General Insurance Limited",
  "Magma HDI General Insurance Company Limited",
  "National Insurance Company Limited",
  "Navi General Insurance Limited",
  "New India Assurance",
  "Raheja QBE General Insurance Co. Ltd.",
  "Reliance General Insurance",
  "Royal Sundaram General Insurance",
  "SBI General Insurance",
  "Shriram General Insurance",
  "Tata AIG General Insurance",
  "The Oriental Insurance Co",
  "United India Insurance Co",
  "Universal Sompo General Insurance",
  "Zuno General Insurance (formerly Edelweiss)",
  // Health Insurance
  "Aditya Birla Health Insurance",
  "Care Health Insurance",
  "ManipalCigna Health Insurance",
  "Niva Bupa Health Insurance",
  "Star Health & Allied Insurance",
  "Galaxy Health Insurance Company Limited",
  "Narayana Health Insurance Ltd",
  // Insurance Broker
  "Marsh India Insurance Brokers",
  "Mahindra Insurance Brokers Ltd",
  "Policybazaar Insurance Brokers Pvt. Ltd",
  "Howden Insurance Brokers India Pvt. Ltd",
];

const SubUserPage = () => {
  const { logout } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsersCount, setTotalUsersCount] = useState(0);

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    gender: "",
    currentState: "",
    preferredState: "",
    currentCity: "",
    preferredCity: "",
    designation: "",
    department: "",
    experienceMin: "",
    experienceMax: "",
    ctcMin: "",
    ctcMax: "",
    companyName: "",
    ageMin: "", // Min age filter
    ageMax: "", // Max age filter
    uploadDate: "",
  });

  // Comments modal states
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [userComments, setUserComments] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsUserInfo, setCommentsUserInfo] = useState({});

  // Handle logout
  const handleLogout = () => {
    logout();
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers(1, filters);
    }, 800);
    return () => clearTimeout(timer);
  }, [filters]);


  // Fetch all users (without pagination for client-side filtering)
  const fetchUsers = async (page = 1, currentFilters = filters) => {
    try {
      setLoading(true);
      setError("");
      
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', itemsPerPage);

      const filterMapping = {
        ctcMin: "minCtc",
        ctcMax: "maxCtc",
        experienceMin: "minExperience",
        experienceMax: "maxExperience",
        ageMin: "minAge",
        ageMax: "maxAge",
        search: "search",
        gender: "gender",
        currentState: "currentState",
        preferredState: "preferredState",
        currentCity: "currentCity",
        preferredCity: "preferredCity",
        designation: "designation",
        department: "department",
        companyName: "currentEmployer",
      };

      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value && filterMapping[key]) {
          params.append(filterMapping[key], value);
        }
      });
      
      if (currentFilters.uploadDate) {
        const start = new Date(currentFilters.uploadDate);
        start.setHours(0,0,0,0);
        const end = new Date(currentFilters.uploadDate);
        end.setHours(23,59,59,999);
        params.append("startDate", start.toISOString());
        params.append("endDate", end.toISOString());
      }
      
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/forms?${params.toString()}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      setUsers(data.data || []);
      setCurrentPage(page);
      
      if (data.pagination) {
        setTotalPages(data.pagination.totalPages || 1);
        setTotalUsersCount(data.pagination.totalUsers || 0);
      } else {
        setTotalPages(1);
        setTotalUsersCount(data.data ? data.data.length : 0);
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Error fetching user data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
  };

  // Clear all filters
  const clearFilters = () => {
    const emptyFilters = {
      search: "",
      gender: "",
      currentState: "",
      preferredState: "",
      currentCity: "",
      preferredCity: "",
      designation: "",
      department: "",
      experienceMin: "",
      experienceMax: "",
      ctcMin: "",
      ctcMax: "",
      companyName: "",
      ageMin: "",
      ageMax: "",
      uploadDate: "",
    };
    setFilters(emptyFilters);
  };

  // Fetch user comments function
  const fetchUserComments = async (userId) => {
    try {
      setCommentsLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/forms/${userId}/comments`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }

      const result = await response.json();

      if (result.success) {
        setUserComments(result.data.comments || []);
        setCommentsUserInfo({
          userName: result.data.userName,
          userId: result.data.userId,
          totalComments: result.data.totalComments,
        });
        setIsCommentsModalOpen(true);
      } else {
        throw new Error(result.message || "Failed to fetch comments");
      }
    } catch (error) {
      console.error('Comments fetch error:', error);
      alert('Failed to fetch comments: ' + error.message);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Download resume function
  const handleDownloadResume = async (userId, fileName) => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URI}/forms/${userId}/download-file`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const contentType = response.headers.get('content-type');
      let extension = 'pdf';
      if (contentType === 'application/pdf') {
        extension = 'pdf';
      } else if (contentType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        extension = 'docx';
      } else if (contentType === 'application/msword') {
        extension = 'doc';
      }
      const downloadName = fileName ? fileName.replace(/\.pdf$/, `.${extension}`) : `resume_${userId}.${extension}`;
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      alert('Failed to download resume: ' + error.message);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Pagination calculations
  // totalPages is now state
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users;

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis logic
      if (currentPage <= 3) {
        // Show first few pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last few pages
        pages.push(1);
        pages.push("...");
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push("...");
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push("...");
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, filters);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1B2951]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-3 text-red-700 m-4">
        <p className="font-medium text-sm">Error loading data</p>
        <p className="text-xs">{error}</p>
        <button
          onClick={fetchUsers}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 bg-[#1B2951]">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-white">
                Sub-User Dashboard
              </h1>
              <p className="text-[#B99D54] text-sm mt-0.5">
                Total: {totalUsersCount} users
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors flex items-center justify-center gap-1 w-full sm:w-auto"
              >
                <LogOut className="h-3 w-3" />
                <span className="hidden xs:inline">Logout</span>
                <span className="xs:hidden">Logout</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-3 h-3 w-3 text-gray-500" />
              <input
                type="text"
                placeholder="Search name, email, phone..."
                className="pl-7 pr-2 py-1.5 border border-gray-300 rounded text-sm w-full focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
                value={filters.search}
                onChange={(e) => handleFilterChange("search", e.target.value)}
              />
            </div>

            {/* Gender */}
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.gender}
              onChange={(e) => handleFilterChange("gender", e.target.value)}
            >
              <option value="">Genders</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>

            {/* Current State */}
            <input
              type="text"
              placeholder="Current state"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.currentState}
              onChange={(e) =>
                handleFilterChange("currentState", e.target.value)
              }
            />

            {/* Preferred State */}
            <input
              type="text"
              placeholder="Preferred state"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.preferredState}
              onChange={(e) =>
                handleFilterChange("preferredState", e.target.value)
              }
            />

            {/* Current City */}
            <input
              type="text"
              placeholder="Current city"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.currentCity}
              onChange={(e) =>
                handleFilterChange("currentCity", e.target.value)
              }
            />

            {/* Preferred City */}
            <input
              type="text"
              placeholder="Preferred city"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.preferredCity}
              onChange={(e) =>
                handleFilterChange("preferredCity", e.target.value)
              }
            />

            {/* Designation */}
            <input
              type="text"
              placeholder="Designation"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.designation}
              onChange={(e) =>
                handleFilterChange("designation", e.target.value)
              }
            />

            {/* Department */}
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.department}
              onChange={(e) => handleFilterChange("department", e.target.value)}
            >
              <option value="">All Departments</option>
              {DEPARTMENT_OPTIONS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            {/* Company Name */}
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.companyName}
              onChange={(e) => handleFilterChange("companyName", e.target.value)}
            >
              <option value="">All Companies</option>
              {COMPANY_OPTIONS.map((company) => (
                <option key={company} value={company}>
                  {company}
                </option>
              ))}
            </select>

            {/* Experience Range - Min */}
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.experienceMin}
              onChange={(e) => handleFilterChange("experienceMin", e.target.value)}
            >
              <option value="">Min Experience</option>
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 35 ? "35+" : `${i} `}
                </option>
              ))}
            </select>

            {/* Experience Range - Max */}
            <select
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.experienceMax}
              onChange={(e) => handleFilterChange("experienceMax", e.target.value)}
            >
              <option value="">Max Experience</option>
              {Array.from({ length: 36 }, (_, i) => (
                <option key={i} value={i}>
                  {i === 35 ? "35+" : `${i} `}
                </option>
              ))}
            </select>

            {/* CTC Range - Two Dropdowns */}
            <div className="col-span-1">
              <label className="block text-xs text-gray-600 mb-1">CTC</label>
              <div className="grid grid-cols-2 gap-1">
                <select
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951] w-full"
                  value={filters.ctcMin || ""}
                  onChange={(e) => handleFilterChange("ctcMin", e.target.value)}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 100 }, (_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951] w-full"
                  value={filters.ctcMax || ""}
                  onChange={(e) => handleFilterChange("ctcMax", e.target.value)}
                >
                  <option value="">Select</option>
                  {Array.from({ length: 100 }, (_, i) => (
                    <option key={i} value={String(i).padStart(2, '0')}>
                      {String(i).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Age Range - Min and Max */}
            <div className="col-span-1">

              <div className="grid grid-cols-2 gap-1">
                <select
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951] w-full"
                  value={filters.ageMin}
                  onChange={(e) => handleFilterChange("ageMin", e.target.value)}
                >
                  <option value="">Min Age</option>
                  {Array.from({ length: 41 }, (_, i) => (
                    <option key={i + 20} value={i + 20}>
                      {i + 20}
                    </option>
                  ))}
                </select>
                <select
                  className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951] w-full"
                  value={filters.ageMax}
                  onChange={(e) => handleFilterChange("ageMax", e.target.value)}
                >
                  <option value="">Max Age</option>
                  {Array.from({ length: 41 }, (_, i) => (
                    <option key={i + 20} value={i + 20}>
                      {i + 20}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Upload Date */}
            <input
              type="date"
              className="px-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-[#1B2951] focus:border-[#1B2951]"
              value={filters.uploadDate}
              onChange={(e) =>
                handleFilterChange("uploadDate", e.target.value)
              }
            />
          </div>

          <div className="mt-2 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 text-[#1B2951] hover:text-[#B99D54] hover:bg-gray-100 rounded text-sm transition-colors"
            >
              Clear Filters
            </button>
            <button
              onClick={clearFilters}
              className="px-3 py-1.5 bg-[#1B2951] text-white rounded text-sm hover:bg-[#1B2951]/90 transition-colors"
            >
              Refresh Data
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[#1B2951]">
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Upload Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Personal Details
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Location
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Employment
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Experience
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Comments
                </th>
                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {currentUsers.map((user, index) => (
                <tr
                  key={user.id || `user-${index}`}
                  className={`hover:bg-gray-50 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="px-3 py-2">
                    <div className="text-sm text-[#1B2951] font-medium">
                      Uploaded By: {user.uploadedBy}&nbsp;
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      Date of Upload: {formatDate(user.dateOfUpload)}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-[#1B2951]">
                      {`${user.firstName || ""} ${user.middleName || ""} ${
                        user.lastName || ""
                      }`.trim()}
                    </div>
                    <div className="text-sm text-[#1B2951]">{user.gender}</div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      DOB: {formatDate(user.dateOfBirth)}
                    </div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      Father&apos;s name: {user.fatherName}
                    </div>
                    <div className="text-sm text-[#1B2951] font-medium">
                      PAN no: {user.panNo}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-[#1B2951] font-medium">
                      {user.contactNo}
                    </div>
                    {user.alternateContactNo && (
                      <div className="text-sm text-[#1B2951]">
                        Alt: {user.alternateContactNo}
                      </div>
                    )}
                    <div className="text-sm text-[#1B2951] font-medium">
                      {user.mailId}
                    </div>
                    {user.alternateMailId && (
                      <div className="text-sm text-[#1B2951]">
                        Alt: {user.alternateMailId}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm text-[#1B2951]">
                      <span className="font-medium">Current:</span>{" "}
                      {user.currentCity}, {user.currentState}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      <span className="font-medium">Preferred:</span>{" "}
                      {user.preferredCity}, {user.preferredState}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-sm font-medium text-[#1B2951]">
                      Current Employer: {user.currentEmployer}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      Designation: {user.designation}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      Department: {user.department}
                    </div>
                    <div className="text-sm text-[#1B2951]">
                      CTC: ₹{user.ctcInLakhs || 'N/A'} Lakhs
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-[#B99D54]/20 text-[#1B2951] border border-[#B99D54]/30">
                        {user.totalExperience ? `${user.totalExperience} ${parseInt(user.totalExperience) === 1 ? 'year' : 'years'}` : 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchUserComments(user._id || user.id)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="View Comments"
                      >
                        <MessageSquare className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDownloadResume(user._id || user.id, `${user.firstName}_${user.lastName}_resume.pdf`)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                        title="Download Resume"
                      >
                        <Download className="h-3 w-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {currentUsers.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500 text-sm">
                No users found matching your criteria.
              </p>
            </div>
          )}
        </div>

        {/* Enhanced Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {startIndex + 1} to{" "}
                {Math.min(endIndex, totalUsersCount)} of{" "}{totalUsersCount} results
                <span className="ml-2 text-xs text-gray-500">
                  (Page {currentPage} of {totalPages})
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {/* Previous button */}
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  Previous
                </button>

                {/* Page numbers */}
                <div className="flex items-center space-x-1">
                  {generatePageNumbers().map((page, index) => (
                    <React.Fragment key={index}>
                      {page === "..." ? (
                        <span className="px-2 py-1.5 text-sm text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-1.5 rounded text-sm ${
                            currentPage === page
                              ? "bg-[#1B2951] text-white"
                              : "border border-gray-300 hover:bg-gray-100 text-[#1B2951]"
                          }`}
                        >
                          {page}
                        </button>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                {/* Next button */}
                <button
                  onClick={() =>
                    handlePageChange(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Comments Modal */}
      {isCommentsModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-[#1B2951]">
                  User Comments
                </h3>
                <p className="text-sm text-[#B99D54]">
                  {commentsUserInfo.userName} ({commentsUserInfo.totalComments || 0} comments)
                </p>
              </div>
              <button
                onClick={() => {
                  setIsCommentsModalOpen(false);
                  setUserComments([]);
                  setCommentsUserInfo({});
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="px-6 py-4">
              {commentsLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#1B2951]"></div>
                </div>
              ) : userComments.length > 0 ? (
                <div className="space-y-4">
                  {userComments.map((comment, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium text-[#1B2951]">
                          {comment.commentedBy || 'Anonymous'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {comment.text}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500 text-sm">No comments available for this user.</p>
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setIsCommentsModalOpen(false)}
                className="px-4 py-2 bg-[#1B2951] text-white rounded text-sm hover:bg-[#1B2951]/90 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubUserPage;
