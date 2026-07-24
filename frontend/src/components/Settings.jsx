import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import api from "../utils/api";
import GlassCard from "./GlassCard";
import {
  User, Mail, Lock, Palette, CheckCircle2, AlertTriangle,
  Loader2, Phone, Image, Settings as LucideSettings, Info
} from "lucide-react";

export default function Settings() {
  const { user, updateProfile } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const [activeSubTab, setActiveSubTab] = useState("profile");

  // --- Profile Section States ---
  const [profileForm, setProfileForm] = useState({
    fullName: "",
    username: "",
    email: "",
    phoneNumber: "",
    profilePicture: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // Sync profileForm with AuthContext user details on mount or change
  useEffect(() => {
    if (user) {
      setProfileForm({
        fullName: user.full_name || "",
        username: user.username || "",
        email: user.email || "",
        phoneNumber: user.phone_number || "",
        profilePicture: user.profile_picture || "",
      });
    }
  }, [user]);

  // --- Email Section States ---
  const [emailForm, setEmailForm] = useState({
    currentEmail: "",
    newEmail: "",
  });
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // --- Password Section States ---
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // --- Theme/Appearance States ---
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState("");
  const [themeSuccess, setThemeSuccess] = useState("");

  // --- Profile Handler ---
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    // Front-end validations
    const username = profileForm.username.trim();
    const email = profileForm.email.trim();
    const fullName = profileForm.fullName.trim();
    const phoneNumber = profileForm.phoneNumber.trim();
    const profilePicture = profileForm.profilePicture.trim();

    if (!username) {
      setProfileError("Username is required.");
      return;
    }
    if (username.length < 3) {
      setProfileError("Username must be at least 3 characters.");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setProfileError("Username can only contain letters, numbers, and underscores.");
      return;
    }

    if (!email) {
      setProfileError("Email is required.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setProfileError("Please enter a valid email address.");
      return;
    }

    if (phoneNumber && !/^\+?[0-9\s-]{7,15}$/.test(phoneNumber)) {
      setProfileError("Please enter a valid phone number.");
      return;
    }

    if (profilePicture && !/^https?:\/\/.+/i.test(profilePicture)) {
      setProfileError("Please enter a valid URL for the profile picture.");
      return;
    }

    setProfileLoading(true);
    try {
      const response = await api.put("/auth/users/me/profile", {
        full_name: fullName || null,
        username,
        email,
        phone_number: phoneNumber || null,
        profile_picture: profilePicture || null,
      });

      setProfileSuccess(response.data.message || "Profile updated successfully.");
      // Sync state with AuthContext
      updateProfile(response.data.user, response.data.access_token);
    } catch (err) {
      console.error(err);
      setProfileError(err.response?.data?.detail || "Failed to update profile.");
    } finally {
      setProfileLoading(false);
    }
  };

  // --- Email Handler ---
  const handleUpdateEmail = async (e) => {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    const currentEmail = emailForm.currentEmail.trim();
    const newEmail = emailForm.newEmail.trim();

    if (!currentEmail || !newEmail) {
      setEmailError("Both current and new email addresses are required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(currentEmail) || !emailRegex.test(newEmail)) {
      setEmailError("Please enter valid email addresses.");
      return;
    }

    if (currentEmail.toLowerCase() !== user.email.toLowerCase()) {
      setEmailError("Current email entered does not match your account email.");
      return;
    }

    if (currentEmail.toLowerCase() === newEmail.toLowerCase()) {
      setEmailError("New email must be different from current email.");
      return;
    }

    setEmailLoading(true);
    try {
      const response = await api.put("/auth/users/me/email", {
        current_email: currentEmail,
        new_email: newEmail,
      });
      setEmailSuccess(response.data.message || "Email updated successfully.");
      updateProfile(response.data.user);
      setEmailForm({ currentEmail: "", newEmail: "" });
    } catch (err) {
      console.error(err);
      setEmailError(err.response?.data?.detail || "Failed to update email.");
    } finally {
      setEmailLoading(false);
    }
  };

  // --- Password Handler ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }

    // Password strength check
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      return;
    }
    if (!/[A-Z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one uppercase letter.");
      return;
    }
    if (!/[a-z]/.test(newPassword)) {
      setPasswordError("Password must contain at least one lowercase letter.");
      return;
    }
    if (!/[0-9]/.test(newPassword)) {
      setPasswordError("Password must contain at least one number.");
      return;
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(newPassword)) {
      setPasswordError("Password must contain at least one special character.");
      return;
    }

    setPasswordLoading(true);
    try {
      await api.put("/auth/users/me/password", {
        current_password: currentPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setPasswordSuccess("Password changed successfully. You can now use your new password.");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (err) {
      console.error(err);
      setPasswordError(err.response?.data?.detail || "Failed to update password.");
    } finally {
      setPasswordLoading(false);
    }
  };

  // --- Theme Handler ---
  const handleThemeChange = async (themeName) => {
    setThemeError("");
    setThemeSuccess("");
    setThemeSaving(true);

    try {
      // Optimistically update theme locally
      setTheme(themeName);

      const response = await api.put("/auth/users/me/theme", {
        theme: themeName,
      });

      // Update AuthContext user object with new theme
      if (user) {
        updateProfile({ ...user, theme: themeName });
      }

      setThemeSuccess(`Theme successfully changed to ${themeName.charAt(0).toUpperCase() + themeName.slice(1)}.`);
    } catch (err) {
      console.error(err);
      setThemeError("Failed to save theme preference in the database.");
    } finally {
      setThemeSaving(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "email", label: "Change Email", icon: Mail },
    { id: "password", label: "Change Password", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Palette },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, var(--border-focus), var(--border-hover))",
            boxShadow: "var(--shadow-neon-cyan)",
          }}
        >
          <LucideSettings size={20} className="text-white" />
        </div>
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>
            Account Settings
          </h1>
          <p className="text-xs uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
            Manage your personal profile and appearance preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Settings Tab Sidebar */}
        <div className="w-full md:w-60 flex-shrink-0">
          <GlassCard className="p-3">
            <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setProfileError("");
                      setProfileSuccess("");
                      setEmailError("");
                      setEmailSuccess("");
                      setPasswordError("");
                      setPasswordSuccess("");
                      setThemeError("");
                      setThemeSuccess("");
                    }}
                    className={`nav-item flex items-center justify-start gap-2.5 px-4 py-2.5 rounded-xl cursor-pointer w-full text-xs font-semibold transition-all border-none ${
                      isActive ? "active" : ""
                    }`}
                    style={{
                      background: isActive ? "var(--bg-hover)" : "transparent",
                    }}
                  >
                    <Icon size={15} />
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </GlassCard>
        </div>

        {/* Settings Tab Content */}
        <div className="flex-grow">
          {activeSubTab === "profile" && (
            <GlassCard>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <User size={16} style={{ color: "var(--border-focus)" }} /> Edit Profile
              </h2>

              {profileError && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{profileError}</span>
                </div>
              )}

              {profileSuccess && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={profileForm.fullName}
                      onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      placeholder="Enter full name"
                      className="glass-input text-sm"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                      Username
                    </label>
                    <input
                      type="text"
                      value={profileForm.username}
                      onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
                      placeholder="Enter username"
                      className="glass-input text-sm"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={profileForm.email}
                      onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                      placeholder="Enter email address"
                      className="glass-input text-sm"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={profileForm.phoneNumber}
                      onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                      placeholder="Enter phone number"
                      className="glass-input text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Profile Picture URL (Optional)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={profileForm.profilePicture}
                      onChange={(e) => setProfileForm({ ...profileForm, profilePicture: e.target.value })}
                      placeholder="https://example.com/avatar.jpg"
                      className="glass-input text-sm"
                    />
                    {profileForm.profilePicture && (
                      <div className="w-10 h-10 rounded-xl overflow-hidden border flex-shrink-0 flex items-center justify-center bg-black/10" style={{ borderColor: "var(--border-color)" }}>
                        <img
                          src={profileForm.profilePicture}
                          alt="Avatar Preview"
                          onError={(e) => { e.target.style.display = "none"; }}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <button type="submit" disabled={profileForm.username === "" || profileForm.email === "" || profileLoading} className="glass-btn mt-2 px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer">
                  {profileLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  Save Changes
                </button>
              </form>
            </GlassCard>
          )}

          {activeSubTab === "email" && (
            <GlassCard>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Mail size={16} style={{ color: "var(--border-focus)" }} /> Change Email
              </h2>

              {emailError && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{emailError}</span>
                </div>
              )}

              {emailSuccess && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{emailSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdateEmail} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Current Email Address
                  </label>
                  <input
                    type="email"
                    value={emailForm.currentEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, currentEmail: e.target.value })}
                    placeholder="Enter current email address"
                    className="glass-input text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    New Email Address
                  </label>
                  <input
                    type="email"
                    value={emailForm.newEmail}
                    onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                    placeholder="Enter new email address"
                    className="glass-input text-sm"
                    required
                  />
                </div>

                <button type="submit" disabled={emailLoading} className="glass-btn mt-2 px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer">
                  {emailLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  Change Email
                </button>
              </form>
            </GlassCard>
          )}

          {activeSubTab === "password" && (
            <GlassCard>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Lock size={16} style={{ color: "var(--border-focus)" }} /> Change Password
              </h2>

              {passwordError && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{passwordError}</span>
                </div>
              )}

              {passwordSuccess && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    className="glass-input text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="Enter new password (min. 8 characters)"
                    className="glass-input text-sm"
                    required
                  />
                  <span className="text-[10px] mt-1 block leading-relaxed" style={{ color: "var(--text-faint)" }}>
                    Password must be at least 8 characters, and contain at least one uppercase letter, one lowercase letter, one number, and one special character.
                  </span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider block" style={{ color: "var(--text-muted)" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                    className="glass-input text-sm"
                    required
                  />
                </div>

                <button type="submit" disabled={passwordLoading} className="glass-btn mt-2 px-6 py-2.5 text-xs flex items-center gap-2 cursor-pointer">
                  {passwordLoading ? <Loader2 size={13} className="animate-spin" /> : null}
                  Change Password
                </button>
              </form>
            </GlassCard>
          )}

          {activeSubTab === "appearance" && (
            <GlassCard>
              <h2 className="text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
                <Palette size={16} style={{ color: "var(--border-focus)" }} /> Theme Settings
              </h2>

              {themeError && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#ef4444" }}>
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{themeError}</span>
                </div>
              )}

              {themeSuccess && (
                <div className="mb-4 p-3 rounded-xl flex items-start gap-2 text-xs" style={{ background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", color: "#10b981" }}>
                  <CheckCircle2 size={14} className="flex-shrink-0 mt-0.5" />
                  <span>{themeSuccess}</span>
                </div>
              )}

              <p className="text-xs mb-5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                Choose your visual theme preference. The setting will apply instantly and persist across refreshes, logouts, restarts, and other devices.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dark Theme Option */}
                <button
                  onClick={() => handleThemeChange("dark")}
                  disabled={themeSaving}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left cursor-pointer transition-all w-full"
                  style={{
                    background: theme === "dark" ? "rgba(124,58,237,0.1)" : "var(--bg-hover)",
                    borderColor: theme === "dark" ? "var(--border-focus)" : "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Dark Theme</span>
                    <div className="w-4 h-4 rounded-full bg-slate-900 border" style={{ borderColor: theme === "dark" ? "var(--border-focus)" : "var(--border-color)" }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Sleek dark glassmorphism layout tailored for low light environments.</span>
                </button>

                {/* Light Theme Option */}
                <button
                  onClick={() => handleThemeChange("light")}
                  disabled={themeSaving}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left cursor-pointer transition-all w-full"
                  style={{
                    background: theme === "light" ? "rgba(37,99,235,0.06)" : "var(--bg-hover)",
                    borderColor: theme === "light" ? "var(--border-focus)" : "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Light Theme</span>
                    <div className="w-4 h-4 rounded-full bg-slate-100 border" style={{ borderColor: theme === "light" ? "var(--border-focus)" : "var(--border-color)" }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Crisp white layouts offering peak productivity during daylight hours.</span>
                </button>

                {/* Ocean Theme Option */}
                <button
                  onClick={() => handleThemeChange("ocean")}
                  disabled={themeSaving}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left cursor-pointer transition-all w-full"
                  style={{
                    background: theme === "ocean" ? "rgba(14,165,233,0.08)" : "var(--bg-hover)",
                    borderColor: theme === "ocean" ? "#0EA5E9" : "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Ocean Theme</span>
                    <div className="w-4 h-4 rounded-full bg-[#0EA5E9] border" style={{ borderColor: theme === "ocean" ? "#0EA5E9" : "var(--border-color)" }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Calming blue colors with soft gradients, ocean grids, and blue-tinted charts.</span>
                </button>

                {/* Nature Theme Option */}
                <button
                  onClick={() => handleThemeChange("nature")}
                  disabled={themeSaving}
                  className="flex flex-col items-start gap-2 p-4 rounded-xl border text-left cursor-pointer transition-all w-full"
                  style={{
                    background: theme === "nature" ? "rgba(22,163,74,0.08)" : "var(--bg-hover)",
                    borderColor: theme === "nature" ? "#16A34A" : "var(--border-color)",
                  }}
                >
                  <div className="flex items-center gap-2 w-full justify-between">
                    <span className="font-bold text-xs uppercase tracking-wider" style={{ color: "var(--text-primary)" }}>Nature Theme</span>
                    <div className="w-4 h-4 rounded-full bg-[#16A34A] border" style={{ borderColor: theme === "nature" ? "#16A34A" : "var(--border-color)" }} />
                  </div>
                  <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>Fresh leafy green accents offering maximum readability and organic vibes.</span>
                </button>
              </div>

              {themeSaving && (
                <div className="mt-4 flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                  <Loader2 size={13} className="animate-spin" />
                  Saving preference in database...
                </div>
              )}
            </GlassCard>
          )}
        </div>
      </div>
    </div>
  );
}
