import { useEffect, useRef, useState } from "react";
import { Camera, Mail, Phone, Save, UserRound } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUser(user);
      setFullName(user.user_metadata?.full_name || "");
      setEmail(user.email || "");
      setPhone(user.user_metadata?.phone || "");
      setAvatarUrl(user.user_metadata?.avatar_url || "");
      setPreview(user.user_metadata?.avatar_url || "");
    }
    load();
  }, []);

  function chooseAvatar(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      setError("Profile image must be smaller than 3 MB.");
      return;
    }
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
    setError("");
  }

  async function uploadAvatar() {
    if (!avatarFile || !user) return avatarUrl;

    const ext = avatarFile.name.split(".").pop()?.toLowerCase() || "jpg";
    const path = `${user.id}/profile.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, avatarFile, {
        upsert: true,
        contentType: avatarFile.type,
        cacheControl: "3600"
      });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from("avatars").getPublicUrl(path);
    return `${data.publicUrl}?v=${Date.now()}`;
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      const nextAvatarUrl = await uploadAvatar();

      const updates = {
        data: {
          ...user.user_metadata,
          full_name: fullName.trim(),
          phone: phone.trim(),
          avatar_url: nextAvatarUrl
        }
      };

      if (email.trim() && email.trim().toLowerCase() !== (user.email || "").toLowerCase()) {
        updates.email = email.trim();
      }

      const { data, error } = await supabase.auth.updateUser(updates);
      if (error) throw error;

      setUser(data.user);
      setAvatarUrl(nextAvatarUrl);
      setPreview(nextAvatarUrl);
      setAvatarFile(null);

      setMessage(
        updates.email
          ? "Profile saved. Supabase may send confirmation links to approve the email change."
          : "Profile updated successfully."
      );
    } catch (err) {
      setError(
        err.message?.includes("Bucket not found")
          ? "Avatar storage is not configured yet. Run the included supabase_avatar_setup.sql file in Supabase SQL Editor."
          : err.message
      );
    } finally {
      setSaving(false);
    }
  }

  const initial = (fullName || email || "U").charAt(0).toUpperCase();

  return (
    <div className="page settingsPage">
      <div className="pageHeader">
        <div><h1>Account Settings</h1><p>Update your user information and profile picture.</p></div>
      </div>

      <form className="settingsLayout" onSubmit={save}>
        <section className="panel profilePhotoPanel">
          <div className="profilePhotoWrap">
            {preview ? <img src={preview} alt="Profile" className="profilePhotoLarge"/> : <div className="profilePhotoFallback">{initial}</div>}
            <button type="button" className="cameraButton" onClick={() => inputRef.current?.click()}><Camera size={17}/></button>
          </div>
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={chooseAvatar}/>
          <h2>{fullName || "User"}</h2>
          <p>{email}</p>
          <button type="button" className="secondaryBtn" onClick={() => inputRef.current?.click()}><Camera size={16}/> Change Photo</button>
          <small>JPG, PNG or WebP · Max 3 MB</small>
        </section>

        <section className="panel settingsFormPanel">
          <div className="sectionTitle"><h2>Personal Information</h2><p>Changes are stored in your Supabase Auth profile.</p></div>

          {message && <div className="successBanner">{message}</div>}
          {error && <div className="errorBanner">{error}</div>}

          <div className="settingsFields">
            <label>
              Full Name
              <div className="settingsInput"><UserRound size={17}/><input value={fullName} onChange={(e) => setFullName(e.target.value)} required/></div>
            </label>

            <label>
              Email Address
              <div className="settingsInput"><Mail size={17}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required/></div>
            </label>

            <label>
              Phone Number
              <div className="settingsInput"><Phone size={17}/><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+94 ..."/></div>
            </label>
          </div>

          <div className="settingsInfo">
            Changing your email can require confirmation depending on your Supabase Authentication settings.
          </div>

          <button className="primaryBtn settingsSaveBtn" disabled={saving}><Save size={17}/>{saving ? "Saving..." : "Save Changes"}</button>
        </section>
      </form>
    </div>
  );
}
