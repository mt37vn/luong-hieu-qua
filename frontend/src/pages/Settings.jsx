import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Settings = () => {
    const [data, setData] = useState({ kpi: [], salary: [], kpi_rules: [], commission_outbound: [], commission_inbound: null });
    const [loading, setLoading] = useState(true);

    const formatNumber = (num) => {
        if (num === null || num === undefined || isNaN(num)) return '0';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    };

    const handleArrayCurrencyChange = (arrayName, index, field, valueStr) => {
        const rawValue = valueStr.replace(/\./g, '');
        if (rawValue === '' || !isNaN(rawValue)) {
            updateArrayItem(arrayName, index, field, rawValue === '' ? 0 : Number(rawValue));
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/settings');
            setData(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const handleKpiSave = async (e, item) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings/kpi', item);
            alert('Đã lưu chỉ tiêu KPI');
        } catch (err) { alert('Lỗi khi lưu'); }
    };

    const handleSalarySave = async (e, item) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings/salary', item);
            alert('Đã lưu cài đặt lương');
        } catch (err) { alert('Lỗi khi lưu'); }
    };

    const updateArrayItem = (arrayName, index, field, value) => {
        const newArr = [...data[arrayName]];
        newArr[index] = { ...newArr[index], [field]: value };
        setData({ ...data, [arrayName]: newArr });
    };

    const handleKpiRuleSave = async (e, rule) => {
        e.preventDefault();
        try {
            await axios.put(`/api/settings/kpi_rule/${rule.id}`, rule);
            alert('Đã lưu quy tắc KPI');
        } catch (err) { alert('Lỗi khi lưu'); }
    };

    const handleCommissionInboundSave = async (e) => {
        e.preventDefault();
        try {
            await axios.put('/api/settings/commission_inbound', data.commission_inbound);
            alert('Đã lưu hoa hồng Inbound');
        } catch (err) { alert('Lỗi khi lưu'); }
    };

    const handleCommissionOutboundSave = async (e, rule) => {
        e.preventDefault();
        try {
            await axios.put(`/api/settings/commission_outbound/${rule.id}`, rule);
            alert('Đã lưu quy tắc hoa hồng Outbound');
        } catch (err) { alert('Lỗi khi lưu'); }
    };

    if (loading) return <div>Đang tải cài đặt...</div>;

    return (
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <h2 className="mb-6">Cài đặt hệ thống</h2>

            <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 1fr' }}>

                {/* KPI Target Settings */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 className="mb-4">Chỉ tiêu KPI tháng</h3>
                    {data.kpi.map((k, i) => (
                        <form key={k.id} className="form-group border-glass" style={{ paddingBottom: 16, marginBottom: 16 }} onSubmit={e => handleKpiSave(e, k)}>
                            <label className="form-label">{k.role}</label>
                            <div className="flex gap-2">
                                <input required type="text" className="form-control" value={formatNumber(k.monthly_kpi)} onChange={e => handleArrayCurrencyChange('kpi', i, 'monthly_kpi', e.target.value)} />
                                <button type="submit" className="btn btn-primary">Lưu</button>
                            </div>
                        </form>
                    ))}
                </div>

                {/* Salary Settings */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 className="mb-4">Lương cơ bản & Mức trần</h3>
                    {data.salary.map((s, i) => (
                        <form key={s.id} className="form-group border-glass" style={{ paddingBottom: 16, marginBottom: 16 }} onSubmit={e => handleSalarySave(e, s)}>
                            <label className="form-label text-md" style={{ color: 'var(--primary)', fontWeight: 600 }}>{s.role}</label>
                            <div className="flex gap-2 mb-2">
                                <div className="w-full">
                                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Lương cơ bản</div>
                                    <input required type="text" className="form-control" value={formatNumber(s.base_salary)} onChange={e => handleArrayCurrencyChange('salary', i, 'base_salary', e.target.value)} />
                                </div>
                                <div className="w-full">
                                    <div className="text-muted" style={{ fontSize: 12, marginBottom: 4 }}>Trần lương (Cap)</div>
                                    <input required type="text" className="form-control" value={formatNumber(s.salary_cap)} onChange={e => handleArrayCurrencyChange('salary', i, 'salary_cap', e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" className="btn btn-primary w-full" style={{ padding: '6px 16px' }}>Lưu cài đặt</button>
                        </form>
                    ))}
                </div>

            </div>

            <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: 'minmax(350px, 1fr) 1fr' }}>
                {/* KPI Rules */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 className="mb-4">Quy tắc hoàn thành KPI</h3>
                    <p className="text-muted mb-4" style={{ fontSize: 13 }}>Hệ số LHQ dựa trên % hoàn thành. (Vd: Nhập 80 cho 80%)</p>
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Từ %</th>
                                <th>Đến %</th>
                                <th>Hệ số LHQ</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.kpi_rules.map((r, i) => (
                                <tr key={r.id}>
                                    <td><input className="form-control form-control-sm" type="number" step="0.1" value={r.completion_from * 100} onChange={e => updateArrayItem('kpi_rules', i, 'completion_from', Number(e.target.value) / 100)} /></td>
                                    <td><input className="form-control form-control-sm" type="number" step="0.1" value={r.completion_to * 100} onChange={e => updateArrayItem('kpi_rules', i, 'completion_to', Number(e.target.value) / 100)} /></td>
                                    <td><input className="form-control form-control-sm" style={{ fontWeight: 600, color: 'var(--accent)' }} type="number" step="0.1" value={r.lhq_rate * 100} onChange={e => updateArrayItem('kpi_rules', i, 'lhq_rate', Number(e.target.value) / 100)} /></td>
                                    <td><button className="btn btn-primary btn-sm" onClick={e => handleKpiRuleSave(e, r)}>Lưu</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Commission Rules */}
                <div className="glass-panel" style={{ padding: 24 }}>
                    <h3 className="mb-4">Quy tắc hoa hồng</h3>

                    <div className="mb-6">
                        <h4 style={{ color: 'var(--text-muted)' }} className="mb-2">Kinh doanh Inbound</h4>
                        <form className="flex gap-2" onSubmit={handleCommissionInboundSave}>
                            <div className="w-full flex items-center gap-2 form-control" style={{ background: 'rgba(0,0,0,0.2)' }}>
                                <span className="text-sm">Tỷ lệ hoa hồng (%)</span>
                                <input className="form-control" style={{ width: 100, background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 600 }} type="number" step="0.1" value={data.commission_inbound.commission_rate * 100} onChange={e => setData({ ...data, commission_inbound: { ...data.commission_inbound, commission_rate: Number(e.target.value) / 100 } })} />
                            </div>
                            <button type="submit" className="btn btn-primary">Lưu</button>
                        </form>
                    </div>

                    <div>
                        <h4 style={{ color: 'var(--text-muted)' }} className="mb-2">Kinh doanh Outbound (Theo tỷ suất LNG)</h4>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>Từ %</th>
                                    <th>Đến %</th>
                                    <th>Hoa hồng %</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.commission_outbound.map((r, i) => (
                                    <tr key={r.id}>
                                        <td><input className="form-control form-control-sm" type="number" step="1" value={r.margin_from * 100} onChange={e => updateArrayItem('commission_outbound', i, 'margin_from', Number(e.target.value) / 100)} /></td>
                                        <td><input className="form-control form-control-sm" type="number" step="1" value={r.margin_to * 100} onChange={e => updateArrayItem('commission_outbound', i, 'margin_to', Number(e.target.value) / 100)} /></td>
                                        <td><input className="form-control form-control-sm" style={{ fontWeight: 600, color: 'var(--accent)' }} type="number" step="0.1" value={r.commission_rate * 100} onChange={e => updateArrayItem('commission_outbound', i, 'commission_rate', Number(e.target.value) / 100)} /></td>
                                        <td><button className="btn btn-primary btn-sm" onClick={e => handleCommissionOutboundSave(e, r)}>Lưu</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
