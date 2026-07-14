import { RiMenuLine } from 'react-icons/ri';

export default function Header({ onMenuClick }) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
      <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={onMenuClick}>
        <RiMenuLine className="text-xl text-slate-700" />
      </button>
      <div className="hidden lg:block" />
      <div className="text-sm text-slate-500">{new Date().toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
    </header>
  );
}
