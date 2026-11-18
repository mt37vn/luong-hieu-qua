import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import { TrendingUp, DollarSign, PieChart, Activity } from 'lucide-react';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
);

const Dashboard = () => {
    const [data, setData] = useState(null);
    const [kpiData, setKpiData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { month } = useOutletContext();

    useEffect(() => {
        fetchDashboard();
    }, [month]);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/dashboard?month=${month}`);
            setData(res.data);
            const kpiRes = await axios.get(`/api/kpi_results?month=${month}`);
            setKpiData(kpiRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="text-center mt-4">Đang tải dữ liệu...</div>;
    if (!data) return <div>Lỗi tải dữ liệu.</div>;

    const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    const profitChartData = {
        labels: ['LNG vận hành', 'Chi phí cố định', 'LN tài chính', 'LN khác', 'LN trước thuế'],
        datasets: [
            {
                label: 'Dòng tiền (VND)',
                data: [
                    data.operating_profit,
                    -data.fixed_cost,
                    data.financial_profit,
                    data.other_profit,
                    data.profit_before_tax
                ],
                backgroundColor: [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(239, 68, 68, 0.8)',
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(139, 92, 246, 0.8)',
                    data.profit_before_tax > 0 ? 'rgba(16, 185, 129, 1)' : 'rgba(239, 68, 68, 1)'
                ]
            }
        ]
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: { color: '#94a3b8' },
                grid: { color: 'rgba(255, 255, 255, 0.1)' }
            },
            x: {
                ticks: { color: '#94a3b8' },
                grid: { display: false }
            }
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="m-0">Tổng quan kinh doanh</h2>
            </div>

            <div className="dashboard-grid">
                <div className="glass-panel stat-card success">
                    <div className="stat-title">LNG Tổng (LN Vận hành)</div>
                    <div className="stat-value">{formatVND(data.operating_profit)}</div>
                </div>
                <div className="glass-panel stat-card" style={{ borderTop: '4px solid var(--accent)' }}>
                    <div className="stat-title">LNG Phần cứng</div>
                    <div className="stat-value">{formatVND(data.hardware_gp)}</div>
                </div>
                <div className="glass-panel stat-card" style={{ borderTop: '4px solid #f59e0b' }}>
                    <div className="stat-title">LNG Dịch vụ</div>
                    <div className="stat-value">{formatVND(data.service_gp)}</div>
                </div>
                <div className="glass-panel stat-card warning">
                    <div className="stat-title">Lợi nhuận phân phối</div>
                    <div className="stat-value">{formatVND(data.distributable_profit)}</div>
                </div>
                <div className="glass-panel stat-card">
                    <div className="stat-title">Tổng hoa hồng KD</div>
                    <div className="stat-value">{formatVND(data.total_sales_commission)}</div>
                </div>
                <div className={`glass-panel stat-card ${data.profit_before_tax < 0 ? 'danger' : 'success'}`}>
                    <div className="stat-title">Lợi nhuận trước thuế</div>
                    <div className="stat-value">{formatVND(data.profit_before_tax)}</div>
                </div>
            </div>

            <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr' }}>
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 className="mb-4">Phân bổ dòng tiền</h3>
                    <div className="chart-container">
                        <Bar data={profitChartData} options={chartOptions} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
