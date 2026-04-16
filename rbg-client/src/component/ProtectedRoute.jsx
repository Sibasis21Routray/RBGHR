import { Navigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, hasRole, role } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1a2a52]"></div>
        <span className="ml-2 text-[#1a2a52]">Loading...</span>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // Check role-based access if requiredRoles is specified
  if (requiredRoles.length > 0 && !hasRole(requiredRoles)) {
    // Redirect based on user role
    const userRole = role?.toLowerCase();
    if (userRole === 'admin') {
      return <Navigate to="/admin" replace />;
    } else if (userRole === 'sub-admin' || userRole === 'subadmin') {
      return <Navigate to="/sub-admin" replace />;
    } else if (userRole === 'sub-user' || userRole === 'subuser') {
      return <Navigate to="/sub-user" replace />;
    } else {
      return <Navigate to="/user" replace />;
    }
  }

  return children;
};

// PropTypes validation
ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRoles: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
