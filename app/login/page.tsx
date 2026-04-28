export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="mx-auto mt-24 max-w-sm rounded-lg border bg-white p-6 shadow-sm">
      <h1 className="mb-4 text-lg font-semibold">Sign in</h1>
      <form action="/api/auth/login" method="post" className="space-y-3">
        <input
          name="password"
          type="password"
          placeholder="Shared password"
          className="w-full rounded border px-3 py-2"
          autoFocus
        />
        {error && (
          <p className="text-sm text-red-600">Wrong password — try again.</p>
        )}
        <button
          type="submit"
          className="w-full rounded bg-gray-900 px-3 py-2 text-white hover:bg-gray-700"
        >
          Sign in
        </button>
      </form>
    </div>
  );
}
