import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Projects = () => {
    const [projects, setProjects] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const { month } = useOutletContext();
    const [modalOpen, setModalOpen] = useState(false);

    const initialForm = { project_name: '', segment: 'SERVICE', hardware_revenue: 0, hardware_cost: 0, service_revenue: 0, service_cost: 0, sales_role: 'Inbound', sales_owner: '', responsible_technical: '', recognition_date: new Date().toISOString().slice(0, 10), status: 'Draft' };
    const [form, setForm] = useState(initialForm);
    const [editId, setEditId] = useState(null);

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
    }, [month]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const pRes = await axios.get(`/api/projects?month=${month}`);
            setProjects(pRes.data);
            const eRes = await axios.get('/api/employees');
            setEmployees(eRes.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const openModal = (project = null) => {
        if (project) {
            setForm(project);
            setEditId(project.id);
        } else {
            setForm(initialForm);
            setEditId(null);
        }
        setModalOpen(true);
    };

    const saveProject = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...form, month };
            if (editId) {
                await axios.put(`/api/projects/${editId}`, payload);
            } else {
                await axios.post('/api/projects', payload);
            }
            setModalOpen(false);
            fetchData();
        } catch (err) {
            alert("Lỗi khi lưu dự án");
        }
    };

    const toggleStatus = async (project) => {
        try {
            const newStatus = project.status === 'Draft' ? 'Closed' : 'Draft';
            await axios.put(`/api/projects/${project.id}`, { ...project, status: newStatus });
            fetchData();
        } catch (err) {
            alert("Lỗi khi cập nhật trạng thái");
        }
    };

    const deleteProject = async (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa dự án này?")) {
            await axios.delete(`/api/projects/${id}`);
            fetchData();
        }
    };

    const formatVND = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="m-0">Dự án</h2>
                <div className="flex gap-4">
                    <button className="btn btn-primary" onClick={() => openModal()}>
                        <Plus size={16} /> Thêm dự án
                    </button>
                </div>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Trạng thái</th>
                            <th>Ngày ghi nhận</th>
                            <th>Tên dự án</th>
                            <th>Phân loại</th>
                            <th>Doanh thu / Giá vốn</th>
                            <th>LNG</th>
                            <th>Tỷ suất LNG</th>
                            <th>Hoa hồng</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="8" className="text-center">Đang tải...</td></tr> :
                            projects.length === 0 ? <tr><td colSpan="8" className="text-center">Không tìm thấy dự án nào.</td></tr> :
                                projects.map(p => (
                                    <tr key={p.id}>
                                        <td>
                                            <button
                                                className={`badge badge-${p.status.toLowerCase()}`}
                                                style={{ border: 'none', cursor: 'pointer', padding: '6px 14px' }}
                                                onClick={() => toggleStatus(p)}
                                            >
                                                {p.status === 'Closed' ? 'Đã Chốt' : 'Bản Nháp'}
                                            </button>
                                        </td>
                                        <td>{p.recognition_date || 'N/A'}</td>
                                        <td style={{ fontWeight: 500 }}>{p.project_name}</td>
                                        <td><span className="text-muted">{p.segment}</span></td>
                                        <td>
                                            <div className="flex flex-col">
                                                <span style={{ color: 'var(--accent)' }}>+ {formatVND(p.revenue)}</span>
                                                <span style={{ color: 'var(--danger)' }}>- {formatVND(p.cost)}</span>
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: 600 }}>{formatVND(p.total_gp)}</td>
                                        <td>{(p.margin * 100).toFixed(1)}%</td>
                                        <td>{formatVND(p.sale_commission)}</td>
                                        <td>
                                            <div className="flex gap-2">
                                                <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => openModal(p)}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => deleteProject(p.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                    </tbody>
                </table>
            </div>

            {modalOpen && (
                <div className="modal-overlay" onClick={() => setModalOpen(false)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editId ? 'Chỉnh sửa dự án' : 'Thêm dự án mới'}</h2>
                            <button className="modal-close" onClick={() => setModalOpen(false)}>&times;</button>
                        </div>
                        <form onSubmit={saveProject}>
                            <div className="modal-body">
                                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
                                    <div className="form-group">
                                        <label className="form-label">Tên dự án</label>
                                        <input required className="form-control" value={form.project_name} onChange={e => setForm({ ...form, project_name: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Ngày ghi nhận doanh số</label>
                                        <input required type="date" className="form-control" value={form.recognition_date} onChange={e => setForm({ ...form, recognition_date: e.target.value })} />
                                    </div>
                                </div>

                                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
                                    <div className="form-group">
                                        <label className="form-label">Phân loại</label>
                                        <select className="form-control" value={form.segment} onChange={e => {
                                            const newSegment = e.target.value;
                                            setForm({
                                                ...form,
                                                segment: newSegment,
                                                responsible_technical: newSegment === 'COMMERCIAL' ? '' : form.responsible_technical,
                                                hardware_revenue: newSegment === 'SERVICE' ? 0 : form.hardware_revenue,
                                                hardware_cost: newSegment === 'SERVICE' ? 0 : form.hardware_cost,
                                                service_revenue: newSegment === 'COMMERCIAL' ? 0 : form.service_revenue,
                                                service_cost: newSegment === 'COMMERCIAL' ? 0 : form.service_cost,
                                            });
                                        }}>
                                            <option value="SERVICE">Dịch vụ (SERVICE)</option>
                                            <option value="COMMERCIAL">Thương mại (COMMERCIAL)</option>
                                            <option value="HYBRID">Phức hợp (HYBRID)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Trạng thái</label>
                                        <select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="Draft">Bản Nháp</option>
                                            <option value="Closed">Đã Chốt</option>
                                        </select>
                                    </div>
                                </div>

                                {(form.segment === 'COMMERCIAL' || form.segment === 'HYBRID') && (
                                    <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--accent)' }}>Doanh thu phần cứng</label>
                                            <input type="text" required className="form-control" value={formatNumber(form.hardware_revenue)} onChange={e => handleCurrencyChange(e, 'hardware_revenue')} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--danger)' }}>Giá vốn phần cứng</label>
                                            <input type="text" required className="form-control" value={formatNumber(form.hardware_cost)} onChange={e => handleCurrencyChange(e, 'hardware_cost')} />
                                        </div>
                                    </div>
                                )}

                                {(form.segment === 'SERVICE' || form.segment === 'HYBRID') && (
                                    <div className="dashboard-grid mt-4" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--accent)' }}>Doanh thu dịch vụ</label>
                                            <input type="text" required className="form-control" value={formatNumber(form.service_revenue)} onChange={e => handleCurrencyChange(e, 'service_revenue')} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label" style={{ color: 'var(--danger)' }}>Giá vốn dịch vụ</label>
                                            <input type="text" required className="form-control" value={formatNumber(form.service_cost)} onChange={e => handleCurrencyChange(e, 'service_cost')} />
                                        </div>
                                    </div>
                                )}

                                <div className="dashboard-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 0 }}>
                                    <div className="form-group">
                                        <label className="form-label">Vai trò Sale</label>
                                        <select className="form-control" value={form.sales_role} onChange={e => setForm({ ...form, sales_role: e.target.value })}>
                                            <option value="Inbound">Inbound</option>
                                            <option value="Outbound">Outbound</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Người phụ trách Sale</label>
                                        <select className="form-control" value={form.sales_owner} onChange={e => setForm({ ...form, sales_owner: e.target.value })}>
                                            <option value="">-- Chọn --</option>
                                            {employees.filter(e => e.role.includes('Sales')).map(e => <option key={e.id} value={e.id}>{e.name} ({e.role})</option>)}
                                        </select>
                                    </div>
                                </div>

                                {form.segment !== 'COMMERCIAL' && (
                                    <div className="form-group" style={{ marginBottom: 0 }}>
                                        <label className="form-label">Kỹ thuật phụ trách</label>
                                        <select className="form-control" value={form.responsible_technical} onChange={e => setForm({ ...form, responsible_technical: e.target.value })}>
                                            <option value="">-- Chọn --</option>
                                            {employees.filter(e => e.role === 'Technical Staff').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                                        </select>
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>Hủy</button>
                                <button type="submit" className="btn btn-primary">Lưu dự án</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Projects;
