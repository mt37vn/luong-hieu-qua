# Lương Hiệu Quả

Ứng dụng quản lý lương theo hiệu quả: nhân sự, dự án, KPI, tỷ lệ hoa hồng và quy tắc tính lương.

## Tính năng

- Quản lý nhân sự và vai trò.
- Nhập dự án, doanh thu, chi phí, lợi nhuận gộp và người phụ trách.
- Cấu hình KPI theo vai trò, quy tắc quy đổi tỷ lệ lương hiệu quả.
- Cấu hình hoa hồng inbound/outbound và mức lương cơ bản.
- Nhập chi phí cố định, lợi nhuận tài chính và lợi nhuận khác theo tháng.
- Dashboard tổng hợp và tính lương.

## Công nghệ

Node.js · Express 5 · SQLite (`sqlite3`) · React 19 · Vite · Chart.js

## Chạy local

```bash
npm install
npm --prefix frontend install

npm run dev       # chạy song song server và frontend
```

Hoặc chạy riêng:

```bash
npm run server    # http://localhost:3001
npm run client    # frontend Vite
```

Lần chạy đầu, server tự tạo `server/data.db` và seed dữ liệu mẫu (tên nhân sự giả, KPI mặc định).

## Cấu trúc

```
server/
  index.js       # REST API
  db.js          # Khởi tạo schema và dữ liệu mặc định
frontend/        # Giao diện React
```

## Lưu ý

- `server/data.db` chứa dữ liệu lương thực tế, đã được `.gitignore` loại trừ.
- Ứng dụng không có xác thực; chỉ chạy trong mạng nội bộ.
- Dữ liệu mẫu chỉ để minh họa, không phải mức lương thật.
