import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, Edit3, Trash2, RefreshCw, Shield, Users, Key, MoveLeftIcon } from "lucide-react";
import {
  getSubAdmins,
  getSubUsers,
  updateSubAdmin,
  updateSubUser,
  deleteSubAdmin,
  deleteSubUser,
  createUser,
} from "../api/adminApi";

const AdminPanel = () => {
  const [subAdmins, setSubAdmins] = useState([]);
  const [subUsers, setSubUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '', role: 'sub-admin' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");
      const resAdmins = await getSubAdmins();
      const resUsers = await getSubUsers();
      setSubAdmins(resAdmins.data.data || []);
      setSubUsers(resUsers.data.data || []);
    } catch (error) {
      console.error("Error fetching admin panel data:", error);
      setError("Error loading admin panel data: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user, type) => {
    setEditingUser({ ...user, type });
    setNewEmail(user.email);
    setNewPassword("");
    setIsEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;
    try {
      const updateData = { email: newEmail };
      if (newPassword.trim()) {
        updateData.password = newPassword;
      }

      if (editingUser.type === "sub-admin") {
        await updateSubAdmin(editingUser._id, updateData);
      } else {
        await updateSubUser(editingUser._id, updateData);
      }
      setIsEditModalOpen(false);
      setEditingUser(null);
      fetchData();
    } catch (error) {
      console.error("Error updating user:", error);
      alert("Error updating user: " + error.message);
    }
  };

  const handleCloseModal = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
    setNewEmail("");
    setNewPassword("");
  };

  const handleDelete = async (id, type) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      if (type === "sub-admin") {
        await deleteSubAdmin(id);
      } else {
        await deleteSubUser(id);
      }
      fetchData();
    }
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateForm({ name: '', email: '', password: '', role: 'sub-admin' });
  };

  const handleCreateSubmit = async () => {
    try {
      await createUser(createForm);
      setIsCreateModalOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'sub-admin' });
      fetchData();
      alert('User created successfully!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Error creating user: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-screen bg-[#f8f6f0]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a2a52]"></div>
        <span className="mt-4 text-[#1a2a52] font-medium">Loading admin panel...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-red-700 m-6 max-w-2xl mx-auto">
        <p className="font-medium text-lg mb-2">Error loading admin panel</p>
        <p className="mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-[#1a2a52] text-white rounded-lg text-sm hover:bg-[#2a3a72] transition-colors flex items-center"
        >
          <RefreshCw size={16} className="mr-2" />
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] p-6">
      <div className="max-w-6xl mx-auto">
         <button
              onClick={() => navigate('/admin')}
              className="px-4 py-2  text-[#2a3a72] rounded-lg  transition-colors flex items-center"
            >
              <MoveLeftIcon size={26} className="mr-2" />
            </button>
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-[#1a2a52] mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage sub-admins and sub-users in your system</p>
          </div>
          <div className="flex space-x-3">
          
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-4 py-2 bg-[#bfa75a] text-white rounded-lg hover:bg-[#a89548] transition-colors flex items-center"
            >
              <Users size={16} className="mr-2" />
              Create User
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 bg-[#bfa75a] bg-opacity-20 rounded-full mr-4">
              <Shield className="text-[#1a2a52]" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1a2a52]">Sub-Admins</h3>
              <p className="text-2xl font-bold text-[#1a2a52]">{subAdmins.length}</p>
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center">
            <div className="p-3 bg-[#bfa75a] bg-opacity-20 rounded-full mr-4">
              <Users className="text-[#1a2a52]" size={28} />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#1a2a52]">Sub-Users</h3>
              <p className="text-2xl font-bold text-[#1a2a52]">{subUsers.length}</p>
            </div>
          </div>
        </div>

        {/* Sub-Admins Section */}
        <div className="mb-12 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-[#bfa75a] p-4 flex items-center">
            <Shield className="text-white mr-3" size={24} />
            <h2 className="text-xl font-semibold text-white">Sub-Admins</h2>
            <span className="ml-3 bg-white text-[#1a2a52] px-2 py-1 rounded-full text-sm font-medium">
              {subAdmins.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Email</th>
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Created At</th>
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subAdmins.map((admin, index) => (
                  <tr key={admin._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-4 border-b">{admin.email}</td>
                    <td className="p-4 border-b">
                      {new Date(admin.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 bg-[#bfa75a] text-white rounded-lg hover:bg-[#a89548] transition-colors"
                          onClick={() => handleEdit(admin, "sub-admin")}
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(admin._id, "sub-admin")}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {subAdmins.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Shield size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No sub-admins found</p>
              </div>
            )}
          </div>
        </div>

        {/* Sub-Users Section */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-[#bfa75a] p-4 flex items-center">
            <Users className="text-white mr-3" size={24} />
            <h2 className="text-xl font-semibold text-white">Sub-Users</h2>
            <span className="ml-3 bg-white text-[#1a2a52] px-2 py-1 rounded-full text-sm font-medium">
              {subUsers.length}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Email</th>
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Created At</th>
                  <th className="p-4 text-left text-sm font-medium text-[#1a2a52]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {subUsers.map((user, index) => (
                  <tr key={user._id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-4 border-b">{user.email}</td>
                    <td className="p-4 border-b">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 border-b">
                      <div className="flex space-x-2">
                        <button
                          className="p-2 bg-[#bfa75a] text-white rounded-lg hover:bg-[#a89548] transition-colors"
                          onClick={() => handleEdit(user, "sub-user")}
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                          onClick={() => handleDelete(user._id, "sub-user")}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {subUsers.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                <Users size={48} className="mx-auto mb-4 text-gray-300" />
                <p>No sub-users found</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="bg-[#bfa75a] text-white p-4 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-semibold">
                Edit {editingUser.type === "sub-admin" ? "Sub-Admin" : "Sub-User"}
              </h3>
              <button onClick={handleCloseModal} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">New Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent pr-10"
                    placeholder="Enter new password"
                  />
                  <Key className="absolute right-3 top-2.5 text-gray-400" size={20} />
                </div>
                <p className="text-xs text-gray-500 mt-2">Leave blank to keep current password</p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-[#1a2a52] bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-[#1a2a52] text-white rounded-lg hover:bg-[#2a3a72] focus:outline-none focus:ring-2 focus:ring-[#1a2a52] transition-colors"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create User Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="bg-[#bfa75a] text-white p-4 rounded-t-xl flex justify-between items-center">
              <h3 className="text-lg font-semibold">Create User</h3>
              <button onClick={handleCloseCreateModal} className="text-white hover:text-gray-200">
                <X size={24} />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">Name</label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent"
                  placeholder="Enter name"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">Email Address</label>
                <input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent"
                  placeholder="Enter email address"
                />
              </div>

              <div className="mb-5">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">Password</label>
                <div className="relative">
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent pr-10"
                    placeholder="Enter password"
                  />
                  <Key className="absolute right-3 top-2.5 text-gray-400" size={20} />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-[#1a2a52] mb-2">Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-transparent"
                >
                  <option value="sub-admin">Sub-Admin</option>
                  <option value="sub-user">Sub-User</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCloseCreateModal}
                  className="px-4 py-2 text-[#1a2a52] bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSubmit}
                  className="px-4 py-2 bg-[#1a2a52] text-white rounded-lg hover:bg-[#2a3a72] focus:outline-none focus:ring-2 focus:ring-[#1a2a52] transition-colors"
                >
                  Create User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;