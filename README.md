# 🧾 Chia Hóa Đơn · Share Bill

Ứng dụng web **chia hóa đơn nhóm** — nhập người, khoản chi và xem ngay **ai nợ ai bao nhiêu**.
Không cần tài khoản, không cần đăng nhập, không cần backend. Giao diện lấy cảm hứng từ **tờ hóa đơn giấy**, tối giản và tiếng Việt.

## ✨ Tính năng

- **Hai tab** — _Khoản chi_ để nhập liệu, _Thanh toán_ là tờ hóa đơn kết quả: Cân đối → Chi tiết → Cần thanh toán. Thẻ tóm tắt trên cùng: tổng chi · cần mấy lần chuyển là xong.
- **Người tham gia** — thêm / sửa / xóa, không cho trùng tên. Chạm vào tên để sửa hoặc xóa.
- **Một nút "Thêm khoản"** mở bảng trượt, chọn loại ngay trong form:
  - _Chi tiêu_ — ai trả, chia đều cả nhóm (mặc định) hoặc _Tuỳ chỉnh_ chọn người. Tạm ứng / chi hộ cũng ghi ở đây.
  - _Tài trợ_ — một thành viên tài trợ cho nhóm (không đòi lại), giảm phần cho những người được chọn.
  - _Chuyển tiền_ — ghi lại khi ai đó đã trả nợ, số dư tự cập nhật.
- **Nhập tiền nhanh** — hiểu `50k`, `1tr2`, `1.5tr`; gõ số ngắn thì gợi ý `×1.000 / ×10.000 / ×100.000`.
- **Không chọn sẵn người trả** — lần nào cũng phải tự chọn cho đỡ nhầm; câu tóm tắt ngay trên nút Lưu ("An trả 1.200.000 ₫ · chia đều cả nhóm (4 người) · mỗi người 300.000 ₫"), thiếu gì báo nấy.
- **Hoàn tác** — xóa khoản, xóa người hay làm mới đều có nút _Hoàn tác_ trong 5 giây.
- **Cân đối** — mỗi người một dòng + thanh xanh/đỏ; chạm để xem cách tính (đã trả · phần chịu · được tài trợ · đã chuyển…).
- **Cần thanh toán** — thuật toán rút gọn công nợ, giảm tối đa số lần chuyển khoản.
- **Lưu tự động** trên trình duyệt (localStorage) — dữ liệu bản cũ có mục "Tạm ứng" được tự chuyển sang "Chi tiêu".
- **In / Lưu PDF** — in tờ hóa đơn ở tab Thanh toán.

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
pnpm test       # tự kiểm tra phần tính tiền (Node ≥ 22.18)
```

## 📁 Cấu trúc

```
src/
├─ App.tsx                # Bố cục hóa đơn, ghép các mục
├─ types.ts               # Kiểu dữ liệu (Person, Expense…)
├─ lib/
│  ├─ calc.ts             # Tính cân đối + rút gọn công nợ
│  ├─ calc.test.ts        # Tự kiểm tra (pnpm test)
│  └─ format.ts           # Định dạng / đọc tiền VND ("50k", "1tr2"), tên viết tắt…
├─ store/
│  ├─ useBillStore.ts     # State chính (persist localStorage)
│  └─ useToast.ts         # Thông báo nhỏ
└─ components/            # Các mục hóa đơn & thành phần UI
```

## 🎨 Bảng màu

`#F3F1EA` giấy · `#D8D4C7` nền · `#232220` mực · `#C23B3B` nhấn (nợ) · `#2F6B52` xanh (được nhận).
