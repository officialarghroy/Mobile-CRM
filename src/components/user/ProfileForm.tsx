"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { PasswordField } from "@/components/ui/PasswordField";
import { removeMyAvatar, updateMyDisplayName, updateMyPassword, uploadMyAvatar } from "@/app/profile/actions";

type ProfileFormProps = {
  email: string;
  initialDisplayName: string;
  initialAvatarUrl: string | null;
};

export function ProfileForm({ email, initialDisplayName, initialAvatarUrl }: ProfileFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [pendingProfile, startProfile] = useTransition();
  const [pendingPassword, startPassword] = useTransition();
  const [pendingAvatar, startAvatar] = useTransition();
  const [pendingRemoveAvatar, startRemoveAvatar] = useTransition();

  const handleProfileSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileError(null);
    setProfileMessage(null);
    const fd = new FormData(e.currentTarget);
    startProfile(async () => {
      try {
        await updateMyDisplayName(fd);
        setProfileMessage("Saved");
        router.refresh();
      } catch (err) {
        setProfileError(err instanceof Error ? err.message : "Could not save.");
      }
    });
  };

  const handlePasswordSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordMessage(null);
    const fd = new FormData(e.currentTarget);
    startPassword(async () => {
      try {
        await updateMyPassword(fd);
        setPasswordMessage("Password updated");
        e.currentTarget.reset();
        router.refresh();
      } catch (err) {
        setPasswordError(err instanceof Error ? err.message : "Could not update password.");
      }
    });
  };

  const handleAvatarFile = (fileList: FileList | null) => {
    const file = fileList?.[0];
    if (!file || !file.type.startsWith("image/")) {
      setUploadError("Choose an image file.");
      return;
    }
    if (file.size > 2_000_000) {
      setUploadError("Image must be under 2 MB.");
      return;
    }
    setUploadError(null);
    startAvatar(async () => {
      try {
        const fd = new FormData();
        fd.set("avatar", file);
        const result = await uploadMyAvatar(fd);
        setAvatarUrl(result.publicUrl);
        router.refresh();
      } catch (err) {
        const raw = err instanceof Error ? err.message : "Upload failed.";
        const friendly =
          /bucket not found/i.test(raw)
            ? "Photo storage is not ready. Add SUPABASE_SERVICE_ROLE_KEY to your server env and try again, or create an \"avatars\" bucket in Supabase."
            : raw;
        setUploadError(friendly);
      }
    });
  };

  const handleRemoveAvatar = () => {
    setUploadError(null);
    startRemoveAvatar(async () => {
      try {
        await removeMyAvatar();
        setAvatarUrl(null);
        router.refresh();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Could not remove photo.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-5">
      <Card className="flex flex-col gap-4">
        <p className="crm-section-label">Photo</p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-lg font-semibold text-[var(--text-secondary)]">
                {(initialDisplayName || email).slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(ev) => handleAvatarFile(ev.target.files)}
            />
            <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap">
              <Button
                type="button"
                variant="ghost"
                className="w-full sm:w-auto"
                onClick={() => fileRef.current?.click()}
                disabled={pendingAvatar || pendingRemoveAvatar}
              >
                {pendingAvatar ? "Uploading…" : "Upload photo"}
              </Button>
              {avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-[var(--text-danger)] hover:bg-red-50 hover:text-red-700 sm:w-auto"
                  onClick={handleRemoveAvatar}
                  disabled={pendingAvatar || pendingRemoveAvatar}
                >
                  {pendingRemoveAvatar ? "Removing…" : "Remove photo"}
                </Button>
              ) : null}
            </div>
            {uploadError ? <p className="crm-meta text-[var(--text-danger)]">{uploadError}</p> : null}
          </div>
        </div>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="crm-section-label">Profile</p>
        <p className="crm-meta text-[var(--text-secondary)]">Signed in as {email}</p>
        <form className="flex flex-col gap-3" onSubmit={handleProfileSubmit}>
          <Input name="displayName" label="Display name" defaultValue={initialDisplayName} autoComplete="name" />
          {profileError ? (
            <p className="crm-meta text-[var(--text-danger)]" role="alert">
              {profileError}
            </p>
          ) : null}
          {profileMessage ? <p className="crm-meta text-[var(--success)]">{profileMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={pendingProfile}>
            {pendingProfile ? "Saving…" : "Save profile"}
          </Button>
        </form>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="crm-section-label">Password</p>
        <p className="crm-meta text-[var(--text-secondary)]">
          Set a new password for your account. Use the eye icon to show or hide what you type.
        </p>
        <form className="flex flex-col gap-3" onSubmit={handlePasswordSubmit}>
          <PasswordField name="newPassword" label="New password (min 8 characters)" autoComplete="new-password" required minLength={8} />
          <PasswordField name="confirmPassword" label="Confirm new password" autoComplete="new-password" required minLength={8} />
          {passwordError ? (
            <p className="crm-meta text-[var(--text-danger)]" role="alert">
              {passwordError}
            </p>
          ) : null}
          {passwordMessage ? <p className="crm-meta text-[var(--success)]">{passwordMessage}</p> : null}
          <Button type="submit" className="w-full" disabled={pendingPassword}>
            {pendingPassword ? "Updating…" : "Update password"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
