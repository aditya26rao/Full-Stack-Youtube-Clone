import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

export function ShortsPage() {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .listVideos()
      .then((data) => setVideos((data.results || []).slice(0, 12)))
      .catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>;

  return (
    <section>
      <h1 className="mb-4 text-xl font-semibold">Shorts</h1>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {videos.map((video) => (
          <Link key={video.id} to={`/videos/${video.id}`} className="group">
            <div className="aspect-[9/16] overflow-hidden rounded-xl bg-black">
              <img
                src={video.thumbnail_url}
                alt={video.title}
                className="h-full w-full object-cover transition group-hover:scale-105"
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = `${video.video_url}/ik-thumbnail.jpg?tr=so-0,w-480,h-270`;
                }}
              />
            </div>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
              {video.title}
            </p>
            <p className="text-xs text-neutral-600 dark:text-neutral-400">{video.views} views</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
