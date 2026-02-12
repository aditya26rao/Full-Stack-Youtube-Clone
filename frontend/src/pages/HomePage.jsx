import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";

const categories = ["All", "Music", "Gaming", "News", "Live"];

function matchCategory(video, category) {
  if (category === "All") return true;
  const text = `${video.title || ""} ${video.description || ""}`.toLowerCase();
  if (category === "Music") return text.includes("music") || text.includes("song");
  if (category === "Gaming") return text.includes("game") || text.includes("gaming");
  if (category === "News") return text.includes("news");
  if (category === "Live") return text.includes("live");
  return true;
}

export function HomePage({ searchQuery = "", initialCategory = "All" }) {
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState(initialCategory);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    api
      .listVideos()
      .then((data) => setVideos(data.results || []))
      .catch((err) => setError(err.message));
  }, []);

  const filteredVideos = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    return videos.filter((video) => {
      const inCategory = matchCategory(video, activeCategory);
      if (!inCategory) return false;
      if (!q) return true;
      const text = `${video.title || ""} ${video.channel || ""} ${video.description || ""}`.toLowerCase();
      return text.includes(q);
    });
  }, [videos, activeCategory, searchQuery]);

  if (error) return <p className="text-sm font-medium text-red-700 dark:text-red-400">{error}</p>;

  return (
    <section>
      <div className="mb-4 flex items-center gap-2 overflow-x-auto pb-1 text-sm">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={
              activeCategory === category
                ? "rounded-lg bg-black px-3 py-1.5 text-white dark:bg-white dark:text-black"
                : "rounded-lg bg-neutral-100 px-3 py-1.5 dark:bg-neutral-800"
            }
          >
            {category}
          </button>
        ))}
      </div>
      {searchQuery ? (
        <p className="mb-4 text-sm text-neutral-600 dark:text-neutral-400">
          Search results for: <span className="font-medium">{searchQuery}</span>
        </p>
      ) : null}
      <div className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filteredVideos.map((video) => (
          <Link
            className="group"
            to={`/videos/${video.id}`}
            key={video.id}
          >
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
            <div className="mt-3 flex gap-3">
              <div className="mt-0.5 h-9 w-9 rounded-full bg-neutral-200" />
              <div className="min-w-0">
                <h3 className="max-h-10 overflow-hidden text-sm font-semibold leading-5 text-neutral-900 dark:text-neutral-100">
                  {video.title}
                </h3>
                <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{video.channel}</p>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">{video.views} views</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
      {filteredVideos.length === 0 ? (
        <p className="mt-6 text-sm text-neutral-600 dark:text-neutral-400">No videos found.</p>
      ) : null}
    </section>
  );
}
