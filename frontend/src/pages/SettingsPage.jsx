import { useEffect, useState } from "react";
import { api } from "../lib/api";

export function SettingsPage() {
  const [displayName, setDisplayName] = useState("");
  const [channelDescription, setChannelDescription] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api
      .getSettings()
      .then((data) => {
        const settings = data.settings || {};
        setDisplayName(settings.display_name || "");
        setChannelDescription(settings.channel_description || "");
        setPhotoUrl(settings.photo_url || "");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setWorking(true);

    const formData = new FormData();
    formData.append("display_name", displayName);
    formData.append("channel_description", channelDescription);
    if (photoFile) formData.append("photo_file", photoFile);

    try {
      const data = await api.updateSettings(formData);
      const settings = data.settings || {};
      setPhotoUrl(settings.photo_url || "");
      setSuccess("Settings updated.");
      setPhotoFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  if (loading) return <p className="text-neutral-600 dark:text-neutral-400">Loading settings...</p>;

  return (
    <form
      className="mx-auto max-w-2xl space-y-4 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      onSubmit={submit}
    >
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Account settings</h1>
      {error ? <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p> : null}
      {success ? <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{success}</p> : null}

      <div className="flex items-center gap-4">
        <div className="h-16 w-16 overflow-hidden rounded-full bg-neutral-200 dark:bg-neutral-700">
          {photoUrl ? (
            <img src={photoUrl} alt="Profile" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <input
          type="file"
          accept="image/*"
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
          onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
        />
      </div>

      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Display name"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
      />

      <textarea
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        rows={4}
        placeholder="Channel description"
        value={channelDescription}
        onChange={(e) => setChannelDescription(e.target.value)}
      />

      <button
        className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={working}
      >
        {working ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
