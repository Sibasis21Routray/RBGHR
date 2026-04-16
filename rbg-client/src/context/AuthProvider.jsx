import { useReducer, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import AuthContext from './AuthContext';

// Initial state
const initialState = {
  user: null,
  token: null,
  role: null,
  isAuthenticated: false,
  loading: true,
};

// Auth reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
      };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        role: action.payload.role,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        role: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
};

// Auth provider component
const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const navigate = useNavigate();

  // Initialize auth state from localStorage on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    if (token && user && role) {
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          token,
          user: JSON.parse(user),
          role,
        },
      });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Handle role-based routing after login
  useEffect(() => {
    if (state.isAuthenticated && state.role && !state.loading) {
      // Only redirect if we're on the root path (login page)
      // Don't redirect if user is already on a valid route
      if (window.location.pathname === '/') {
        console.log('AuthProvider: Navigating based on role:', state.role);
        const roleLower = state.role.toLowerCase();
        if (roleLower === 'admin') {
          navigate('/admin');
        } else if (roleLower === 'sub-admin' || roleLower === 'subadmin') {
          navigate('/sub-admin');
        } else if (roleLower === 'sub-user' || roleLower === 'subuser' || roleLower === 'sub_user') {
          navigate('/sub-user');
        } else {
          navigate('/user');
        }
      }
    }
  }, [state.isAuthenticated, state.role, state.loading, navigate]);

  // Login function
  const login = async (userData, token) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      if (!userData || !token) {
        throw new Error('User data or token is missing');
      }

      // Get role from userData, default to 'user' if not specified
      const userRole = userData.role || 'user';

      // Store in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      localStorage.setItem('role', userRole);

      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: {
          user: userData,
          token,
          role: userRole,
        },
      });

      return { success: true };
    } catch (error) {
      dispatch({ type: 'LOGIN_FAILURE' });
      return { success: false, error: error.message };
    }
  };

  // Logout function
  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');

    dispatch({ type: 'LOGOUT' });

    // Redirect to login page after logout
    navigate('/');
  };

  // Check if user has required role
  const hasRole = (requiredRoles) => {
    if (!state.role) return false;
    if (Array.isArray(requiredRoles)) {
      return requiredRoles.includes(state.role.toLowerCase());
    }
    return state.role.toLowerCase() === requiredRoles.toLowerCase();
  };

  const value = {
    ...state,
    login,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// PropTypes validation
AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export default AuthProvider;
