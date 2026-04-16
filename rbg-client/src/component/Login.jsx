import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

const Login = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const { login } = useAuth();

  // --- Login Submit ---
  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/users/login`,
        data
      );

      let user, token;
      if (response.data.data) {
        user = response.data.data;
        token = response.data.token || "default-token";
      } else {
        user = response.data;
        token = response.data.token || "default-token";
      }

      await login(user, token);
      toast.success("Login successful!");
    } catch (error) {
      if (error.response) {
        // Server responded with error status
        const status = error.response.status;
        if (status === 401) {
          toast.error("Invalid credentials. Please try again.");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(error.response.data?.message || "Login failed due to server error.");
        }
      } else if (error.request) {
        // Network error
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        // Other error
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- Forgot Password Request ---
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    // Basic email validation
    const emailRegex = /^\S+@\S+$/i;
    if (!emailRegex.test(resetEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsResetSubmitting(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/users/forgot-password`,
        { email: resetEmail }
      );
      toast.success("Password reset link sent! Check your email.");
      setIsResetOpen(false);
      setResetEmail("");
    } catch (error) {
      if (error.response) {
        const status = error.response.status;
        if (status === 404) {
          toast.error("Email not found. Please check your email address.");
        } else if (status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error(error.response.data?.message || "Failed to send reset email.");
        }
      } else if (error.request) {
        toast.error("Network error. Please check your internet connection and try again.");
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-[#1a2a52] rounded-t-lg py-6 px-8">
          <h2 className="text-white text-center text-3xl font-extrabold">
            Sign in to your account
          </h2>
        </div>
        <form
          className="mt-8 px-8 pb-8 space-y-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-[#1a2a52]"
            >
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email address",
                },
              })}
              className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-[#bfa75a] ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-[#1a2a52]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              {...register("password", { required: "Password is required" })}
              className={`appearance-none block w-full px-3 py-2 border rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#bfa75a] focus:border-[#bfa75a] ${
                errors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="text-red-500 text-xs mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Forgot Password link */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setIsResetOpen(true)}
              className="text-sm font-medium text-[#1a2a52] hover:text-[#bfa75a] transition-colors duration-200"
            >
              Forgot Password?
            </button>
          </div>

          {/* Submit Button */}
          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md text-[#1a2a52] font-semibold bg-[#bfa75a] hover:bg-[#a88f3f] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#bfa75a] disabled:opacity-50 transition-colors duration-200"
            >
              {isSubmitting ? "Signing in..." : "Sign in"}
            </button>
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600">
              Do not have an account?{" "}
              <Link
                to="/register"
                className="font-medium text-[#1a2a52] hover:text-[#bfa75a] transition-colors duration-200"
              >
                Register now
              </Link>
            </p>
          </div>
        </form>
      </div>

      {/* Reset Password Modal */}
      {isResetOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-sm">
            <h3 className="text-lg font-bold text-[#1a2a52] mb-4">
              Reset Password
            </h3>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <input
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#bfa75a]"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetOpen(false)}
                  disabled={isResetSubmitting}
                  className="px-4 py-2 rounded-md border text-gray-600 hover:bg-gray-100 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="px-4 py-2 rounded-md bg-[#bfa75a] text-[#1a2a52] font-semibold hover:bg-[#a88f3f] disabled:opacity-50"
                >
                  {isResetSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Login;
