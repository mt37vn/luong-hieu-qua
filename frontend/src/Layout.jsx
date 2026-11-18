import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Users, FileBarChart, Settings as SettingsIcon, DollarSign } from 'lucide-react';

const Sidebar = () => {
    const location = useLocation();
    const path = location.pathname;

    const getLinkClass = (route) => {
        return `nav-item ${path.startsWith(route) ? 'active' : ''}`;
    };

    return (
        <div className="sidebar">
            <Link to="/" className="sidebar-logo">
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                    LHQ
                </div>
                Lương Hiệu Quả
            </Link>

            <ul className="nav-links">
                <li>
                    <Link to="/dashboard" className={getLinkClass('/dashboard')}>
                        <LayoutDashboard size={20} />
                        Tổng quan
                    </Link>
                </li>
                <li>
                    <Link to="/kpi" className={getLinkClass('/kpi')}>
                        <FileBarChart size={20} />
                        KPI & Bảng lương
                    </Link>
                </li>
                <li>
                    <Link to="/projects" className={getLinkClass('/projects')}>
                        <Briefcase size={20} />
                        Dự án
                    </Link>
                </li>
                <li>
                    <Link to="/employees" className={getLinkClass('/employees')}>
                        <Users size={20} />
                        Nhân viên
                    </Link>
                </li>
                <li>
                    <Link to="/financial" className={getLinkClass('/financial')}>
                        <DollarSign size={20} />
                        Nhập liệu tài chính
                    </Link>
                </li>
                <li>
                    <Link to="/settings" className={getLinkClass('/settings')}>
                        <SettingsIcon size={20} />
                        Cài đặt
                    </Link>
                </li>
            </ul>
        </div>
    );
};

const Header = ({ month, setMonth }) => {
    const location = useLocation();
    const path = location.pathname.substring(1);
    const titles = {
        'dashboard': 'Tổng quan kinh doanh',
        'kpi': 'KPI & Lương thực nhận',
        'projects': 'Quản lý dự án',
        'employees': 'Danh sách nhân viên',
        'financial': 'Thông tin tài chính khác',
        'settings': 'Cài đặt hệ thống'
    };
    const title = titles[path] || 'Hệ thống LHQ';

    return (
        <div className="top-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="page-title">{title}</div>

            <div className="flex items-center gap-4">
                <input
                    type="month"
                    className="form-control"
                    style={{ width: 200 }}
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                />

                <div className="user-profile flex items-center gap-4">
                    <span className="text-muted" style={{ fontSize: 14 }}>Công cụ nội bộ</span>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
};

const Layout = ({ month, setMonth }) => {
    return (
        <div className="app-container">
            <Sidebar />
            <div className="main-content">
                <Header month={month} setMonth={setMonth} />
                <div className="content-area">
                    <Outlet context={{ month }} />
                </div>
            </div>
        </div>
    );
};

export default Layout;
