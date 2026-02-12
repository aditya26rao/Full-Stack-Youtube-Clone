import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export function LikedVideosPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listLikedVideos()
      .then((data) => setVideos(data.results || []))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>;

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">Liked videos</h1>
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videos.map((video) => (
          <Link className="group" to={`/videos/${video.id}`} key={video.id}>
            <div className="overflow-hidden rounded-xl">
              <img
                className="aspect-video w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                src={video.thumbnail_url}
                alt={video.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${video.video_url}/ik-thumbnail.jpg?tr=so-0,w-480,h-270`;
                }}
              />
            </div>
            <div className="mt-3 min-w-0">
              <h3 className="max-h-10 overflow-hidden text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
                {video.title}
              </h3>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{video.channel}</p>
            </div>
          </Link>
        ))}
      </div>
      {videos.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">No liked videos yet.</p>
      ) : null}
    </section>
  );
}
