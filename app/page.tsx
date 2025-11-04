import Link from 'next/link';

export default async function Home() {
  return (
    <div>
      <h1>Hello Expenses!</h1>
      <div>
        <Link
          href="/login"
          className="flex items-center gap-5 self-start rounded-lg bg-gray-500 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-grey-400 md:text-base"
        >
          <span>Log in</span>
        </Link>
      </div>
    </div>
  );
}
