import { Link, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { api } from "./lib/api";
import { HomePage } from "./pages/HomePage";
import { VideoPage } from "./pages/VideoPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { UploadPage } from "./pages/UploadPage";
import { ChannelPage } from "./pages/ChannelPage";
import { LoggedOutPage } from "./pages/LoggedOutPage";
import { ShortsPage } from "./pages/ShortsPage";
import { HistoryPage } from "./pages/HistoryPage";
import { WatchLaterPage } from "./pages/WatchLaterPage";
import { LikedVideosPage } from "./pages/LikedVideosPage";
import { SettingsPage } from "./pages/SettingsPage";

function applyTheme(nextTheme) {
  const isDark = nextTheme === "dark";
  document.documentElement.classList.remove("dark");
  document.body.classList.remove("dark");
  if (isDark) {
    document.documentElement.classList.add("dark");
    document.body.classList.add("dark");
  }
}

function App() {
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [theme, setTheme] = useState(() => (localStorage.getItem("theme") === "dark" ? "dark" : "light"));
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const refreshMe = async () => {
    try {
      const data = await api.me();
      setMe(data.authenticated ? data.user : null);
    } catch {
      setMe(null);
    } finally {
      setLoadingUser(false);
    }
  };

  useEffect(() => {
    refreshMe();
  }, []);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    applyTheme(theme);
  }, [theme]);

  const logout = async () => {
    await api.logout();
    setMe(null);
    navigate("/signed-out");
  };

  const onSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput.trim());
    navigate("/");
  };

  if (loadingUser) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-neutral-900 dark:bg-neutral-950 dark:text-neutral-100">
      <header className="fixed left-0 right-0 top-0 z-20 border-b border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950">
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-4">
          <div className="min-w-0">
            <Link to="/" className="text-base font-bold tracking-tight sm:text-lg">
              <span className="rounded bg-red-600 px-1.5 py-0.5 text-white">YT</span> YouTube
            </Link>
          </div>

          <form onSubmit={onSearch} className="mx-2 hidden max-w-xl flex-1 items-center md:flex">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 w-full rounded-l-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Search"
            />
            <button
              type="submit"
              className="h-10 rounded-r-full border border-l-0 border-neutral-300 bg-neutral-50 px-5 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Search
            </button>
          </form>

          <nav className="flex items-center gap-1 text-xs sm:gap-2 sm:text-sm">
            <div className="flex overflow-hidden rounded-full border border-neutral-300 dark:border-neutral-700">
              <button
                className={`px-2 py-2 sm:px-3 ${theme === "light" ? "bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                onClick={() => setTheme("light")}
              >
                Light
              </button>
              <button
                className={`px-2 py-2 sm:px-3 ${theme === "dark" ? "bg-neutral-200 text-black dark:bg-neutral-700 dark:text-white" : "hover:bg-neutral-100 dark:hover:bg-neutral-800"}`}
                onClick={() => setTheme("dark")}
              >
                Dark
              </button>
            </div>
            {me && (
              <Link className="rounded-full px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:px-3" to="/upload">
                + Create
              </Link>
            )}
            {me && (
              <Link className="rounded-full px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:px-3" to="/settings">
                Settings
              </Link>
            )}
            {!me && (
              <Link className="rounded-full px-2 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:px-3" to="/login">
                Login
              </Link>
            )}
            {!me && (
              <Link className="hidden rounded-full px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 sm:inline-block" to="/register">
                Register
              </Link>
            )}
            {me && <span className="hidden text-neutral-600 dark:text-neutral-300 sm:inline">Hi, {me.username}</span>}
            {me && (
              <button
                className="rounded-full bg-neutral-100 px-2 py-2 text-neutral-800 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-200 dark:hover:bg-neutral-700 sm:px-3"
                onClick={logout}
              >
                Logout
              </button>
            )}
          </nav>
        </div>
        <form onSubmit={onSearch} className="px-3 pb-2 md:hidden">
          <div className="flex items-center">
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 w-full rounded-l-full border border-neutral-300 bg-white px-4 text-sm outline-none focus:border-blue-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
              placeholder="Search"
            />
            <button
              type="submit"
              className="h-9 rounded-r-full border border-l-0 border-neutral-300 bg-neutral-50 px-4 text-sm hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-neutral-800"
            >
              Go
            </button>
          </div>
        </form>
      </header>

      <div className="pt-24 md:pt-14">
        <aside className="fixed bottom-0 left-0 top-14 hidden w-56 border-r border-neutral-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-950 lg:block">
          <nav className="space-y-1 text-sm">
            <Link className="block rounded-lg bg-neutral-100 px-3 py-2 font-medium dark:bg-neutral-800" to="/">
              Home
            </Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/shorts">
              Shorts
            </Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/music">
              Music
            </Link>
            <div className="my-2 border-t border-neutral-200 dark:border-neutral-800" />
            <Link className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/history">
              History
            </Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/watch-later">
              Watch later
            </Link>
            <Link className="block rounded-lg px-3 py-2 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/liked">
              Liked videos
            </Link>
          </nav>
        </aside>

        <main className="px-3 py-5 pb-24 sm:px-5 lg:ml-56 lg:pb-5">
          <div className="mx-auto max-w-[1400px]">
            <Routes>
              <Route path="/" element={<HomePage searchQuery={searchQuery} />} />
              <Route path="/music" element={<HomePage searchQuery={searchQuery} initialCategory="Music" />} />
              <Route path="/shorts" element={<ShortsPage />} />
              <Route path="/history" element={me ? <HistoryPage /> : <Navigate to="/login" replace />} />
              <Route path="/watch-later" element={me ? <WatchLaterPage /> : <Navigate to="/login" replace />} />
              <Route path="/liked" element={me ? <LikedVideosPage /> : <Navigate to="/login" replace />} />
              <Route path="/videos/:videoId" element={<VideoPage me={me} />} />
              <Route path="/channel/:username" element={<ChannelPage />} />
              <Route path="/login" element={<LoginPage onLogin={refreshMe} />} />
              <Route path="/register" element={<RegisterPage onRegister={refreshMe} />} />
              <Route path="/signed-out" element={<LoggedOutPage />} />
              <Route path="/settings" element={me ? <SettingsPage /> : <Navigate to="/login" replace />} />
              <Route
                path="/upload"
                element={me ? <UploadPage /> : <Navigate to="/login" replace />}
              />
            </Routes>
          </div>
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-950 lg:hidden">
        <div className="grid grid-cols-5 text-center text-xs">
          <Link className="px-2 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/">Home</Link>
          <Link className="px-2 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/shorts">Shorts</Link>
          <Link className="px-2 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/music">Music</Link>
          <Link className="px-2 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/history">History</Link>
          <Link className="px-2 py-3 hover:bg-neutral-100 dark:hover:bg-neutral-800" to="/upload">Create</Link>
        </div>
      </nav>
    </div>
  );
}

export default App;
