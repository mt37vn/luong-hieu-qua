import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';

const FinancialInputs = () => {
    const { month } = useOutletContext();
    const [inputs, setInputs] = useState([]);
    const [form, setForm] = useState({ fixed_cost: 0, financial_profit: 0, other_profit: 0 });
    const [loading, setLoading] = useState(true);

    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleCurrencyChange = (e, field) => {
        const rawValue = e.target.value.replace(/\./g, '');
        if (rawValue === '' || !isNaN(rawValue)) {
            setForm({ ...form, [field]: rawValue === '' ? 0 : Number(rawValue) });
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        const current = inputs.find(d => d.month === month);
        if (current) {
            setForm({ fixed_cost: current.fixed_cost, financial_profit: current.financial_profit, other_profit: current.other_profit });
        } else {
            setForm({ fixed_cost: 0, financial_profit: 0, other_profit: 0 });
        }
    }, [month, inputs]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/financial_inputs');
            setInputs(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const saveInput = async (e) => {
        e.preventDefault();
        try {
            await axios.post('/api/financial_inputs', { month, ...form });
            alert('Đã lưu thành công!');
            fetchData();
        } catch (err) { alert('Lỗi khi lưu dữ liệu'); }
    };

    const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 2fr', alignItems: 'start' }}>
            <div className="glass-panel" style={{ padding: 24 }}>
                <h3 className="mb-4">Nhập liệu tài chính tháng</h3>
                <form onSubmit={saveInput}>
                    <div className="form-group border-glass">
                        <label className="form-label">Chi phí cố định (Phí vận hành chung)</label>
                        <input required type="text" className="form-control" value={formatNumber(form.fixed_cost)} onChange={e => handleCurrencyChange(e, 'fixed_cost')} />
                    </div>
                    <div className="form-group border-glass" style={{ borderColor: 'var(--accent)' }}>
                        <label className="form-label">Lợi nhuận tài chính (Lãi suất, đầu tư...)</label>
                        <input required type="text" className="form-control" value={formatNumber(form.financial_profit)} onChange={e => handleCurrencyChange(e, 'financial_profit')} />
                    </div>
                    <div className="form-group border-glass" style={{ borderColor: 'var(--accent)' }}>
                        <label className="form-label">Lợi nhuận khác</label>
                        <input required type="text" className="form-control" value={formatNumber(form.other_profit)} onChange={e => handleCurrencyChange(e, 'other_profit')} />
                    </div>
                    <button type="submit" className="btn btn-primary w-full mt-4">Lưu dữ liệu tháng</button>
                </form>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Tháng</th>
                            <th>Chi phí cố định</th>
                            <th>LN Tài chính</th>
                            <th>LN Khác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="4">Đang tải...</td></tr> :
                            inputs.length === 0 ? <tr><td colSpan="4">Chưa có lịch sử nhập liệu.</td></tr> :
                                inputs.map(i => (
                                    <tr key={i.id}>
                                        <td style={{ fontWeight: 600 }}>{i.month}</td>
                                        <td style={{ color: 'var(--danger)' }}>{formatVND(i.fixed_cost)}</td>
                                        <td style={{ color: 'var(--accent)' }}>{formatVND(i.financial_profit)}</td>
                                        <td style={{ color: 'var(--accent)' }}>{formatVND(i.other_profit)}</td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FinancialInputs;
