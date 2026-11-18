import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Download, CheckCircle, TrendingUp } from 'lucide-react';

const KPI = () => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const { month } = useOutletContext();

    useEffect(() => {
        fetchKPI();
    }, [month]);

    const fetchKPI = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/kpi_results?month=${month}`);
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    const formatPct = (val) => ((val || 0) * 100).toFixed(1) + '%';

    const exportExcel = () => {
        // Generate simple CSV
        let csv = '\uFEFF';
        csv += "Nhân viên,Chức vụ,Tháng,LNG Thực tế,Chuyển kỳ trước,Mục tiêu hiệu quả,Hoàn thành %,Tỷ lệ LHQ,Hoa hồng bán hàng,Lương thực nhận\n";

        data.forEach(row => {
            const isSales = String(row.role).includes('Sales');
            csv += `"${row.name}","${row.role}","${month}",${row.actual_LNG},${row.carry_over_last_month},${row.effective_target},${row.completion_percent},${row.lhq_rate},${isSales ? row.actual_LNG : 0},${row.final_salary}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bang_Luong_Export_${month}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="m-0">KPI & Lương Thực Nhận</h2>
                    <span className="text-muted" style={{ fontSize: 14 }}>Kết quả hiệu quả cho tháng {month}</span>
                </div>
                <div className="flex gap-4">
                    <button className="btn btn-success" onClick={exportExcel}>
                        <Download size={16} /> Xuất CSV
                    </button>
                </div>
            </div>

            <div className="table-container mb-6">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Nhân viên</th>
                            <th>LNG Thực tế</th>
                            <th>Mục tiêu <span className="text-muted text-sm">(gồm chuyển kỳ)</span></th>
                            <th>Hoàn thành</th>
                            <th>Tỷ lệ LHQ</th>
                            <th>Lương thực nhận</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="6" className="text-center">Đang tính toán KPI...</td></tr> :
                            data.length === 0 ? <tr><td colSpan="6" className="text-center">Không tìm thấy dữ liệu.</td></tr> :
                                data.map(emp => {
                                    const isSales = typeof emp.role === 'string' && emp.role.includes('Sales');
                                    return (
                                        <tr key={emp.employee_id}>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{emp.name}</div>
                                                <div className="text-muted" style={{ fontSize: 12 }}>{emp.role}</div>
                                            </td>
                                            <td>
                                                {formatVND(emp.actual_LNG)}
                                                {isSales && <div className="text-muted" style={{ fontSize: 12 }}>(Hoa hồng)</div>}
                                            </td>
                                            <td>
                                                {isSales ? '-' : (
                                                    <>
                                                        <div style={{ color: 'var(--text-main)' }}>{formatVND(emp.effective_target)}</div>
                                                        {emp.carry_over_last_month > 0 && <div style={{ color: 'var(--danger)', fontSize: 12 }}>+{formatVND(emp.carry_over_last_month)} ck</div>}
                                                    </>
                                                )}
                                            </td>
                                            <td>
                                                {isSales ? '-' : (
                                                    <div className="flex items-center gap-2">
                                                        <div style={{
                                                            width: 40, height: 40, borderRadius: '50%', border: '3px solid',
                                                            borderColor: emp.completion_percent >= 1 ? 'var(--accent)' : 'var(--danger)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11
                                                        }}>
                                                            {formatPct(emp.completion_percent)}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ fontWeight: 600, color: emp.lhq_rate > 1 ? 'var(--accent)' : 'inherit' }}>
                                                {isSales ? '-' : formatPct(emp.lhq_rate)}
                                            </td>
                                            <td>
                                                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--primary)' }}>
                                                    {formatVND(emp.final_salary)}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default KPI;
