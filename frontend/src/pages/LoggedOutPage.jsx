import { Link } from "react-router-dom";

export function LoggedOutPage() {
  return (
    <section className="mx-auto mt-10 max-w-md rounded-2xl border border-neutral-200 bg-white p-6 text-center shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">Signed out</h1>
      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        You have been signed out successfully.
      </p>
      <Link
        className="mt-5 inline-block rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
        to="/login"
      >
        Sign in again
      </Link>
    </section>
  );
}
