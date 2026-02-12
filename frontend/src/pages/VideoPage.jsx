import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

export function VideoPage({ me }) {
  const { videoId } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [error, setError] = useState("");
  const [working, setWorking] = useState(false);

  useEffect(() => {
    api
      .getVideo(videoId)
      .then(setVideo)
      .catch((err) => setError(err.message));
  }, [videoId]);

  const vote = async (type) => {
    try {
      const data = await api.voteVideo(videoId, type);
      setVideo((prev) =>
        prev
          ? { ...prev, likes: data.likes, dislikes: data.dislikes, user_vote: data.user_vote }
          : prev
      );
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleWatchLater = async () => {
    try {
      const data = await api.toggleWatchLater(videoId);
      setVideo((prev) => (prev ? { ...prev, is_watch_later: data.is_watch_later } : prev));
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteVideo = async () => {
    if (!window.confirm("Delete this video?")) return;
    try {
      setWorking(true);
      await api.deleteVideo(videoId);
      navigate("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setWorking(false);
    }
  };

  if (error) return <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>;
  if (!video) return <p className="text-neutral-600 dark:text-neutral-400">Loading...</p>;

  return (
    <section className="mx-auto max-w-5xl">
      <video
        className="aspect-video w-full rounded-xl bg-black"
        src={video.optimized_url}
        controls
        autoPlay
        playsInline
        poster={video.thumbnail_url}
      />

      <h1 className="mt-3 text-xl font-semibold text-neutral-900 dark:text-neutral-100">{video.title}</h1>

      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-neutral-200" />
          <div>
            <Link className="font-semibold text-neutral-900 dark:text-neutral-100" to={`/channel/${video.channel}`}>
              {video.channel}
            </Link>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{video.views} views</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            className={
              video.is_watch_later
                ? "rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white"
                : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            }
            onClick={toggleWatchLater}
            disabled={!me}
          >
            {video.is_watch_later ? "Saved" : "Watch later"}
          </button>
          <button
            className={
              video.user_vote === 1
                ? "rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            }
            onClick={() => vote("like")}
            disabled={!me}
          >
            Like {video.likes}
          </button>
          <button
            className={
              video.user_vote === -1
                ? "rounded-full bg-black px-4 py-2 text-sm font-medium text-white"
                : "rounded-full bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:hover:bg-neutral-700"
            }
            onClick={() => vote("dislike")}
            disabled={!me}
          >
            Dislike {video.dislikes}
          </button>
          {me?.username === video.channel && (
            <button
              className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
              disabled={working}
              onClick={deleteVideo}
            >
              {working ? "Deleting..." : "Delete"}
            </button>
          )}
        </div>
      </div>

      {!me && <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Login to vote</p>}

      <div className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200">
        <p className="mb-2 font-medium">
          {video.views} views • {new Date(video.created_at).toLocaleDateString()}
        </p>
        <p>{video.description || "No description."}</p>
      </div>
    </section>
  );
}
