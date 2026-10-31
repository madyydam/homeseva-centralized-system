import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#06080e] text-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-extrabold mb-2">404</h1>
      <p className="text-slate-400 text-sm mb-6">The page or resource you are looking for was not found.</p>
      <Link
        href="/"
        className="inline-flex items-center space-x-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-xs font-bold text-white transition"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Return to Workspaces</span>
      </Link>
    </div>
  );
}
