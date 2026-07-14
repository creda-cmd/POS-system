import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  RiDashboardLine,
  RiShoppingCart2Line,
  RiBox3Line,
  RiCalculatorLine,
  RiHistoryLine,
  RiUser3Line,
  RiMoneyDollarCircleLine,
  RiBarChartBoxLine,
  RiSettings3Line,
  RiLogoutBoxRLine,
} from 'react-icons/ri';

const navItems = [
  { to: '/', label: 'Dashboard', icon: RiDashboardLine },
  { to: '/pos', label: 'POS Sales', icon: RiCalculatorLine },
  { to: '/sales', label: 'Sales History', icon: RiHistoryLine },
  { to: '/products', label: 'Products', icon: RiShoppingCart2Line },
  { to: '/inventory', label: 'Inventory', icon: RiBox3Line },
  { to: '/customers', label: 'Customers', icon: RiUser3Line },
  { to: '/expenses', label: 'Expenses', icon: RiMoneyDollarCircleLine },
  { to: '/reports', label: 'Reports', icon: RiBarChartBoxLine },
  { to: '/settings', label: 'Settings', icon: RiSettings3Line },
];

export default function Sidebar({ onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className="w-64 bg-brand-dark text-white h-screen flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <h1 className="text-xl font-bold text-primary-400">SmartBiz Solo</h1>
        <p className="text-xs text-slate-400 mt-1 truncate">{user?.businessName || 'Your Business'}</p>
      </div>
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <item.icon className="text-lg" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-700">
        <div className="mb-3 px-4 text-sm text-slate-300">
          <p className="font-medium truncate">{user?.fullName}</p>
        </div>
        <button onClick={logout} className="sidebar-link w-full text-left text-red-400 hover:text-red-300 hover:bg-slate-800">
          <RiLogoutBoxRLine className="text-lg" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
