import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false); // New state

  const navigate = useNavigate();
  const { token } = useParams(); // Extract token from URL parameters

  const handleReset = async (e) => {
    e.preventDefault();

    if (!password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!token) {
      toast.error("Reset token is missing");
      return;
    }

    try {
      setIsSubmitting(true);

      await axios.post(
        `${import.meta.env.VITE_BACKEND_URI}/users/reset-password`,
        { token, newPassword: password }
      );

      setResetSuccess(true); // Show success message
      toast.success("Password reset successful!");

      // Optional: redirect after short delay
      setTimeout(() => {
        navigate("/");
      }, 3000); // Redirect after 3 seconds
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-center text-[#1a2a52] mb-6">
          Reset Your Password
        </h2>

        {resetSuccess ? (
          <div className="text-center text-green-600 font-semibold">
            Your password has been reset successfully! Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2a52] mb-1">
                New Password
              </label>
              <input
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#bfa75a]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#1a2a52] mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#bfa75a]"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2 px-4 rounded-md bg-[#bfa75a] text-[#1a2a52] font-semibold hover:bg-[#a88f3f] transition-colors duration-200 disabled:opacity-50"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
