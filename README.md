# 🧾 Chia Hóa Đơn · Share Bill

Ứng dụng web **chia hóa đơn nhóm** — nhập người, khoản chi và xem ngay **ai nợ ai bao nhiêu**.
Không cần tài khoản, không cần đăng nhập, không cần backend. Giao diện lấy cảm hứng từ **tờ hóa đơn giấy**, tối giản và tiếng Việt.

## ✨ Tính năng

- **Người tham gia** — thêm / sửa / xóa, không giới hạn số lượng.
- **Khoản chi** — tên, số tiền, người trả, và cách chia:
  - _Chia đều_ cho cả nhóm (tự cập nhật khi thêm/bớt người).
  - _Chia theo món_ — chỉ những người được chọn mới gánh.
- **Tạm ứng / Chi hộ** — ghi lại ai ứng tiền mua đồ chung (có đòi lại, tính như một khoản chi).
- **Tài trợ / Bao** — một thành viên bao / tài trợ một khoản cho nhóm (không đòi lại). Người tài trợ gánh khoản này thay, giảm phần cho những người được chọn — chọn _Cả nhóm_ để giảm đều cho mọi người, hoặc _Chọn người_ (bỏ chọn chính mình) để bao cho người khác.
- **Cân đối** — mỗi người: đã trả · phần phải chịu · tài trợ · số dư (+ được nhận / − phải trả).
- **Cần thanh toán** — thuật toán rút gọn công nợ, giảm tối đa số giao dịch ("Chi trả An 305.000 ₫").
- **Lưu tự động** trên trình duyệt (localStorage) — không mất dữ liệu khi tải lại.
- **In / Lưu PDF** — bản in sạch, đúng chất hóa đơn.

## 🛠️ Công nghệ

| | |
|---|---|
| Framework | **React 19** + **TypeScript** (strict) |
| Build tool | **Vite 8** |
| Styling | **Tailwind CSS v4** |
| State | **Zustand 5** (+ persist) |
| Icons | **lucide-react** |

## 🚀 Chạy dự án

> ⚠️ Cần **Node.js ≥ 20.19** (Vite 8). Nếu dùng `nvm`: `nvm use` (đã có sẵn `.nvmrc`).

```bash
pnpm install
pnpm dev        # chạy dev server (http://localhost:5173)
pnpm build      # build production vào dist/
pnpm preview    # xem thử bản build
pnpm typecheck  # kiểm tra kiểu TypeScript
```

## 📁 Cấu trúc

```
src/
├─ App.tsx                # Bố cục hóa đơn, ghép các mục
├─ types.ts               # Kiểu dữ liệu (Person, Expense…)
├─ lib/
│  ├─ calc.ts             # Tính cân đối + rút gọn công nợ
│  └─ format.ts           # Định dạng tiền VND, tên viết tắt…
├─ store/
│  ├─ useBillStore.ts     # State chính (persist localStorage)
│  └─ useToast.ts         # Thông báo nhỏ
└─ components/            # Các mục hóa đơn & thành phần UI
```

## 🎨 Bảng màu

`#F3F1EA` giấy · `#D8D4C7` nền · `#232220` mực · `#C23B3B` nhấn (nợ) · `#2F6B52` xanh (được nhận).
