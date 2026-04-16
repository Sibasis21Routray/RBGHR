const fs = require('fs');
const filepath = 'src/component/AdminPage.jsx';
let content = fs.readFileSync(filepath, 'utf8');

// 1. Add new state for pagination
content = content.replace(
  'const [itemsPerPage] = useState(10);',
  'const [itemsPerPage] = useState(10);\n  const [totalPages, setTotalPages] = useState(1);\n  const [totalUsersCount, setTotalUsersCount] = useState(0);'
);

// 2. Replace fetchUsers
const fetchUsersStart = content.indexOf('const fetchUsers = async () => {');
const useEffectStart = content.indexOf('useEffect(() => {', fetchUsersStart);
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
content = content.substring(0, fetchUsersStart) + fetchUsersNew + content.substring(useEffectStart);

// 3. Replace applyFilters, handleFilterChange, clearFilters
const applyFiltersStart = content.indexOf('const applyFilters =');
const filterFormatDateStart = content.indexOf('const formatDate = (dateString)');
const newFiltersLogic = `const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    fetchUsers(1, newFilters);
  };

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
content = content.substring(0, applyFiltersStart) + newFiltersLogic + content.substring(filterFormatDateStart);

// 4. Update pagination calculations and UI
content = content.replace(
  'const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);',
  '// totalPages is now state'
);
content = content.replace(
  'const currentUsers = filteredUsers.slice(startIndex, endIndex);',
  'const currentUsers = users;'
);
content = content.replace(
  'Total: {filteredUsers.length} users{" "}',
  'Total: {totalUsersCount} users{" "}'
);
content = content.replace(
  '{filteredUsers.length !== users.length &&',
  '{/* filtered info omitted as handled by server */ false &&'
);

// We need to also find lines around 1156 and replace them safely:
content = content.replace(
  '{Math.min(endIndex, filteredUsers.length)} of{" "}',
  '{Math.min(endIndex, totalUsersCount)} of{" "}'
);
content = content.replace(
  '{filteredUsers.length} results',
  '{totalUsersCount} results'
);

// Modify pagination buttons to call fetchUsers(page) instead of setCurrentPage(page)
// We need to replace all instances of setCurrentPage(pageNumber) in the pagination UI with fetchUsers(pageNumber)
// The easy way is to redefine handlePageChange
const generatePagesEnd = content.indexOf('return pages;\n  };');
const handleExportExcelStart = content.indexOf('const handleExportExcel =');
const handlePageChange = `  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchUsers(newPage, filters);
    }
  };

  `;
content = content.substring(0, generatePagesEnd + 15) + '\n\n' + handlePageChange + content.substring(handleExportExcelStart);

// Now in the JSX we must replace onClick={() => setCurrentPage(...)} with onClick={() => handlePageChange(...)}
content = content.replace(/setCurrentPage\(/g, 'handlePageChange(');
// ... except for where setCurrentPage is legally used inside fetchUsers directly!
// But we just did a global replace. Let's fix fetchUsers back.
content = content.replace('handlePageChange(page);', 'setCurrentPage(page);');

// The newFilters update in handleFilterChange didn't have setCurrentPage, so that's fine.

fs.writeFileSync(filepath, content);
console.log("Updated AdminPage.jsx");
