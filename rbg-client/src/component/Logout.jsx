import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Logout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Call logout function which clears localStorage and updates auth state
    logout();
    // Redirect to login page
    navigate('/', { replace: true });
  }, [logout, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a2a52] mx-auto"></div>
        <p className="mt-2 text-[#1a2a52]">Logging out...</p>
      </div>
    </div>
  );
};

export default Logout;
