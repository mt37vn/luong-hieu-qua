import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Employees = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: '', role: 'CEO' });
    const [editId, setEditId] = useState(null);

    const roles = [
        'CEO', 'Deputy Director', 'Technical Staff', 'Inbound Sales', 'Outbound Sales'
    ];

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/employees');
            setEmployees(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    const saveEmployee = async (e) => {
        e.preventDefault();
        try {
            if (editId) {
                await axios.put(`/api/employees/${editId}`, form);
                setEditId(null);
            } else {
                await axios.post('/api/employees', form);
            }
            setForm({ name: '', role: 'CEO' });
            fetchEmployees();
        } catch (err) { alert('Lỗi khi lưu nhân viên'); }
    };

    const deleteEmployee = async (id) => {
        if (window.confirm("Xóa nhân viên này?")) {
            await axios.delete(`/api/employees/${id}`);
            fetchEmployees();
        }
    };

    return (
        <div className="dashboard-grid" style={{ gridTemplateColumns: 'minmax(300px, 1fr) 2fr', alignItems: 'start' }}>
            <div className="glass-panel" style={{ padding: 24 }}>
                <h3 className="mb-4">{editId ? 'Sửa nhân viên' : 'Thêm nhân viên'}</h3>
                <form onSubmit={saveEmployee}>
                    <div className="form-group">
                        <label className="form-label">Tên nhân viên</label>
                        <input required className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Họ và tên" />
                    </div>
                    <div className="form-group border-glass">
                        <label className="form-label">Chức vụ</label>
                        <select className="form-control" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button type="submit" className="btn btn-primary w-full">Lưu</button>
                        {editId && <button type="button" className="btn btn-ghost w-full" onClick={() => { setEditId(null); setForm({ name: '', role: 'CEO' }); }}>Hủy</button>}
                    </div>
                </form>
            </div>

            <div className="table-container">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Họ và tên</th>
                            <th>Chức vụ</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? <tr><td colSpan="4">Đang tải...</td></tr> :
                            employees.map(e => (
                                <tr key={e.id}>
                                    <td>{e.id}</td>
                                    <td style={{ fontWeight: 600 }}>{e.name}</td>
                                    <td><span className="badge badge-draft">{e.role}</span></td>
                                    <td>
                                        <div className="flex gap-2">
                                            <button className="btn btn-ghost" style={{ padding: 8 }} onClick={() => { setForm({ name: e.name, role: e.role }); setEditId(e.id); }}>
                                                <Edit2 size={16} />
                                            </button>
                                            <button className="btn btn-ghost" style={{ padding: 8, color: 'var(--danger)' }} onClick={() => deleteEmployee(e.id)}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Employees;
