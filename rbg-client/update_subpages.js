const fs = require('fs');

function updatePage(filepath, isSubUserPage) {
  let content = fs.readFileSync(filepath, 'utf8');

  // 1. Add new state for pagination
  content = content.replace(
    'const [itemsPerPage] = useState(10);',
    'const [itemsPerPage] = useState(10);\n  const [totalPages, setTotalPages] = useState(1);\n  const [totalUsersCount, setTotalUsersCount] = useState(0);'
  );

  // Fix state variables for SubUserPage
  if (isSubUserPage) {
    if (content.includes('const [filteredUsers, setFilteredUsers] = useState([]);')) {
      content = content.replace('const [filteredUsers, setFilteredUsers] = useState([]);\n', '');
    }
  } else {
    // For SubAdminPage it's the same
    if (content.includes('const [filteredUsers, setFilteredUsers] = useState([]);')) {
      content = content.replace('const [filteredUsers, setFilteredUsers] = useState([]);\n', '');
    }
  }

  // Ensure ctcMin and ctcMax replace ctcMain/ctcAdditional in JSX (for SubUserPage)
  if (isSubUserPage) {
    content = content.replace(/ctcMain/g, 'ctcMin');
    content = content.replace(/ctcAdditional/g, 'ctcMax');
  }

  // 2. Replace fetchUsers
  const fetchUsersStart = content.indexOf('const fetchUsers = async () => {');
  // the end of fetchUsers could be right before useEffect
  const applyFiltersStart = content.indexOf('// Apply filters');
  if (fetchUsersStart === -1 || applyFiltersStart === -1) {
    console.error("Could not find fetchUsers or applyFilters in", filepath);
    return;
  }

  const fetchUsersNew = `const fetchUsers = async (page = 1, currentFilters = filters) => {
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
        \`\${import.meta.env.VITE_BACKEND_URI}/forms?\${params.toString()}\`
      );
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
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

  `;
  
  // Also we want to eliminate calculateAge since it's backend now
  const calcAgeStart = content.indexOf('// Calculate age from date of birth');
  const calcAgeHelperStart = content.indexOf('// Helper to calculate age from DOB');
  let startToReplaceFunction = fetchUsersStart;
  if (calcAgeStart !== -1 && calcAgeStart < fetchUsersStart) {
    startToReplaceFunction = calcAgeStart;
  }
  if (calcAgeHelperStart !== -1 && calcAgeHelperStart < fetchUsersStart) {
    startToReplaceFunction = calcAgeHelperStart;
  }

  // We are removing `applyFilters` as well.
  // We should find the end of `clearFilters`! 
  const fetchUserCommentsStart = content.indexOf('// Fetch user comments');
  const handleFormSuccessStart = content.indexOf('// Handle form success');
  const downloadResumeStart = content.indexOf('// Download resume function');

  let endOfOldFunctions = fetchUserCommentsStart;
  if (endOfOldFunctions === -1 || (handleFormSuccessStart !== -1 && handleFormSuccessStart < endOfOldFunctions)) {
    endOfOldFunctions = handleFormSuccessStart;
  }
  if (endOfOldFunctions === -1 || (downloadResumeStart !== -1 && downloadResumeStart < endOfOldFunctions)) {
    endOfOldFunctions = downloadResumeStart;
  }

  const newFiltersLogic = `const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
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
    fetchUsers(1, emptyFilters);
  };

  `;

  content = content.substring(0, startToReplaceFunction) + fetchUsersNew + newFiltersLogic + content.substring(endOfOldFunctions);

  // 3. Update pagination calculations and UI
  content = content.replace(
    'const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);',
    '// totalPages is now state'
  );
  content = content.replace(
    'const currentUsers = filteredUsers.slice(startIndex, endIndex);',
    'const currentUsers = users;'
  );
  content = content.replace(
    /Total: \{filteredUsers\.length\} users\{" "\}\s*\{filteredUsers\.length !== users\.length &&\s*`\(filtered from \$\{users\.length\}\)`\}/g,
    'Total: {totalUsersCount} users'
  );
  
  content = content.replace(
    /\{Math\.min\(endIndex, filteredUsers\.length\)\} of\{" "\}\s*\{filteredUsers\.length\} results/g,
    '{Math.min(endIndex, totalUsersCount)} of{" "}{totalUsersCount} results'
  );

  // handlePageChange injection
  const generatePagesEnd = content.indexOf('return pages;\n  };');
  if (generatePagesEnd !== -1) {
    const nextBlockStart = content.indexOf('if (loading)', generatePagesEnd);
    const handlePageChangeStr = `
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, filters);
    }
  };

`;
    if (nextBlockStart !== -1) {
      content = content.substring(0, generatePagesEnd + 15) + handlePageChangeStr + content.substring(nextBlockStart);
    }
  }

  // Replace setCurrentPage with handlePageChange in pagination UI
  content = content.replace(/onClick=\{\(\) => setCurrentPage\((.*?)\)\}/g, 'onClick={() => handlePageChange($1)}');

  fs.writeFileSync(filepath, content);
  console.log("Updated", filepath);
}

// Ensure the backend endpoint expects ctcInLakhs... wait, filterMapping has it as minCtc -> maxCtc, 
// let's just make it the same as what AdminPage does.

updatePage('src/component/SubUserPage.jsx', true);
updatePage('src/component/SubAdminPage.jsx', false);
