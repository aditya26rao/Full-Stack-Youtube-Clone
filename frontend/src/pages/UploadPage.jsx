import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";

export function UploadPage() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!videoFile) {
      setError("Select a video file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("video_file", videoFile);
    if (thumbnailFile) {
      formData.append("thumbnail_file", thumbnailFile);
    }

    try {
      setError("");
      setWorking(true);
      const response = await api.uploadVideo(formData);
      navigate(`/videos/${response.video_id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  return (
    <form
      className="mx-auto max-w-2xl space-y-3 rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      onSubmit={submit}
    >
      <h2 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Create video</h2>
      {error && <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>}
      <input
        className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-3 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-red-500 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
        rows={4}
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Upload Video File
        </label>
        <input
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:text-neutral-800 dark:file:bg-neutral-800 dark:file:text-neutral-200"
          type="file"
          accept="video/*"
          onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700 dark:text-neutral-300">
          Upload Thumbnail Image (Optional)
        </label>
        <input
          className="w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-sm dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:text-neutral-800 dark:file:bg-neutral-800 dark:file:text-neutral-200"
          type="file"
          accept="image/*"
          onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
        />
      </div>
      <button
        className="h-11 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        disabled={working}
      >
        {working ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
