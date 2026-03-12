"use client";

import { useState, useEffect } from "react";
import { updateProfile, updatePassword } from "@/server/actions/settings";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "@/components/theme-provider";

const inputClass =
  "mt-1 block w-full rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-zinc-100 placeholder-zinc-500 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/30";

const btnClass =
  "rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50";

interface SettingsFormProps {
  initialEmail: string;
  initialFullName: string;
  initialAvatarUrl: string | null;
}

function Avatar({
  fullName,
  avatarUrl,
}: {
  fullName: string;
  avatarUrl: string | null;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className="h-16 w-16 rounded-full object-cover"
      />
    );
  }

  const initials = (fullName || "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/20 text-lg font-semibold text-indigo-300">
      {initials}
    </div>
  );
}

export function SettingsForm({
  initialEmail,
  initialFullName,
  initialAvatarUrl,
}: SettingsFormProps) {
  const { theme, setTheme } = useTheme();

  // -- Profile section --
  const [fullName, setFullName] = useState(initialFullName);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");

  // -- Email section --
  const [newEmail, setNewEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [emailSuccess, setEmailSuccess] = useState("");

  // -- Password section --
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  // Auto-dismiss success messages
  useEffect(() => {
    if (profileSuccess) {
      const t = setTimeout(() => setProfileSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [profileSuccess]);
  useEffect(() => {
    if (emailSuccess) {
      const t = setTimeout(() => setEmailSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [emailSuccess]);
  useEffect(() => {
    if (passwordSuccess) {
      const t = setTimeout(() => setPasswordSuccess(""), 4000);
      return () => clearTimeout(t);
    }
  }, [passwordSuccess]);

  // -- Handlers --

  async function handleProfileSave() {
    setProfileError("");
    setProfileSuccess("");
    setProfileSaving(true);

    const result = await updateProfile(fullName);

    if (result.error) {
      setProfileError(result.error);
    } else {
      setProfileSuccess("Profile updated");
    }
    setProfileSaving(false);
  }

  async function handleEmailUpdate(e: React.FormEvent) {
    e.preventDefault();
    setEmailError("");
    setEmailSuccess("");

    if (!newEmail.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    setEmailSaving(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(
        "Confirmation email sent. Check your inbox to complete the change.",
      );
      setNewEmail("");
    }
    setEmailSaving(false);
  }

  async function handlePasswordUpdate(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess("");

    if (!currentPassword) {
      setPasswordError("Current password is required");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match");
      return;
    }

    setPasswordSaving(true);

    const result = await updatePassword(currentPassword, newPassword);

    if (result.error) {
      setPasswordError(result.error);
    } else {
      setPasswordSuccess("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordSaving(false);
  }

  return (
    <div className="mt-8 space-y-8">
      {/* ── Profile ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6">
        <h2 className="text-lg font-semibold">Profile</h2>
        <div className="mt-4 flex items-center gap-5">
          <Avatar fullName={fullName} avatarUrl={initialAvatarUrl} />
          <div className="flex-1">
            <label
              htmlFor="fullName"
              className="block text-sm font-medium text-zinc-300"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your name"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleProfileSave}
            disabled={profileSaving}
            className={btnClass}
          >
            {profileSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                Saving...
              </span>
            ) : (
              "Save"
            )}
          </button>
          {profileError && (
            <p className="text-sm text-red-400">{profileError}</p>
          )}
          {profileSuccess && (
            <p className="text-sm text-emerald-400">{profileSuccess}</p>
          )}
        </div>
      </div>

      {/* ── Email ── */}
      <form
        onSubmit={handleEmailUpdate}
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
      >
        <h2 className="text-lg font-semibold">Email Address</h2>
        <p className="mt-1 text-sm text-zinc-400">
          Currently signed in as{" "}
          <span className="text-zinc-200">{initialEmail}</span>
        </p>
        <div className="mt-4">
          <label
            htmlFor="newEmail"
            className="block text-sm font-medium text-zinc-300"
          >
            New Email
          </label>
          <input
            id="newEmail"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="new@example.com"
            className={inputClass}
          />
          <p className="mt-2 text-xs text-zinc-500">
            A confirmation link will be sent to your new email address.
          </p>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={emailSaving || !newEmail.trim()}
            className={btnClass}
          >
            {emailSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                Sending...
              </span>
            ) : (
              "Update Email"
            )}
          </button>
          {emailError && <p className="text-sm text-red-400">{emailError}</p>}
          {emailSuccess && (
            <p className="text-sm text-emerald-400">{emailSuccess}</p>
          )}
        </div>
      </form>

      {/* ── Password ── */}
      <form
        onSubmit={handlePasswordUpdate}
        className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-6"
      >
        <h2 className="text-lg font-semibold">Password</h2>
        <div className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-zinc-300"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Enter current password"
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-zinc-300"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 6 characters"
              minLength={6}
              className={inputClass}
            />
          </div>
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-zinc-300"
            >
              Confirm New Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              className={inputClass}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={passwordSaving}
            className={btnClass}
          >
            {passwordSaving ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-indigo-400/30 border-t-indigo-400" />
                Updating...
              </span>
            ) : (
              "Update Password"
            )}
          </button>
          {passwordError && (
            <p className="text-sm text-red-400">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-emerald-400">{passwordSuccess}</p>
          )}
        </div>
      </form>

      {/* ── Appearance ── */}
      <div className="rounded-xl border border-line bg-surface-card p-6">
        <h2 className="text-lg font-heading font-semibold text-content-primary mb-1">Appearance</h2>
        <p className="text-sm text-content-muted mb-4">Choose your preferred theme.</p>
        <div className="flex gap-3">
          {(["light", "dark", "system"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setTheme(option)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors capitalize ${
                theme === option
                  ? "bg-indigo-600 text-white"
                  : "bg-surface-secondary text-content-secondary hover:bg-surface-tertiary hover:text-content-primary"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
