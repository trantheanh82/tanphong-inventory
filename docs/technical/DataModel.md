
# Tài Liệu Kỹ Thuật: Mô Hình Dữ Liệu

## 1. Giới Thiệu
Tài liệu này mô tả các thực thể dữ liệu chính được sử dụng trong hệ thống "Tân Phong Inventory". Backend của ứng dụng được quản lý bởi dịch vụ bên thứ ba (ví dụ: Teable), và ứng dụng tương tác với nó thông qua các API RESTful.

Mỗi thực thể dưới đây tương ứng với một "bảng" (table) trong hệ thống backend.

## 2. Các Thực Thể Chính

### 2.1. Phiếu Nhập (`import_notes`)
- **Mô tả:** Lưu trữ thông tin tổng quan về một lần nhập kho.
- **Các trường chính:**
  - `id`: Khóa chính, định danh duy nhất cho phiếu.
  - `name`: Tên của phiếu nhập (ví dụ: "Nhập hàng tháng 10/2024").
  - `customer`: Tên nhà cung cấp (tùy chọn).
  - `status`: Trạng thái của phiếu ("Mới tạo", "Chưa scan đủ", "Đã scan đủ").
  - `total_quantity`: Tổng số lượng lốp cần nhập trong phiếu.
  - `scanned`: Tổng số lượng lốp đã quét.
  - `createdAt`: Thời gian tạo phiếu.

### 2.2. Phiếu Nhập Chi Tiết (`import_note_details`)
- **Mô tả:** Lưu trữ thông tin chi tiết về từng loại lốp trong một phiếu nhập.
- **Các trường chính:**
  - `id`: Khóa chính.
  - `import_note`: Khóa ngoại, liên kết đến `id` của `import_notes`.
  - `dot`: Mã DOT (2 số cuối) của loại lốp.
  - `quantity`: Số lượng cần nhập của loại lốp này.
  - `scanned`: Số lượng đã quét của loại lốp này.
  - `status`: Trạng thái của mục ("Chưa scan", "Đã scan đủ").
  - `dot_image`: Trường đính kèm (attachment) để lưu hình ảnh quét DOT.

### 2.3. Phiếu Xuất (`export_notes`)
- **Mô tả:** Lưu trữ thông tin tổng quan về một lần xuất kho.
- **Các trường chính:** Tương tự Phiếu Nhập, bao gồm `id`, `name`, `customer`, `status`, `total_quantity`, `scanned`, `createdAt`.

### 2.4. Phiếu Xuất Chi Tiết (`export_note_details`)
- **Mô tả:** Lưu trữ thông tin chi tiết về từng lốp hoặc nhóm lốp trong một phiếu xuất. Đây là thực thể phức tạp nhất.
- **Các trường chính:**
  - `id`: Khóa chính.
  - `export_note`: Khóa ngoại, liên kết đến `id` của `export_notes`.
  - `tire_type`: Loại lốp ("Nội địa", "Nước ngoài").
  - `has_dot`: Cờ boolean, xác định lốp "Nước ngoài" có cần quét DOT hay không.
  - `dot`: Mã DOT (2 số cuối), nếu có.
  - `series`: Số series của lốp, nếu có. Có thể là một chuỗi các series cách nhau bằng dấu phẩy nếu `quantity` > 1.
  - `quantity`: Số lượng của mục này. Thường là 1 cho lốp cần series.
  - `scanned`: Số lượng đã quét.
  - `status`: Trạng thái của mục.
  - `series_image`: Trường đính kèm ảnh quét Series.
  - `dot_image`: Trường đính kèm ảnh quét DOT.

### 2.5. Phiếu Bảo Hành (`warranty_notes`)
- **Mô tả:** Lưu trữ thông tin tổng quan về một phiếu tiếp nhận bảo hành.
- **Các trường chính:** `id`, `name`, `status`, `total_warranty_note` (tổng số lượng), `scanned`, `createdAt`.

### 2.6. Phiếu Bảo Hành Chi Tiết (`warranty_note_details`)
- **Mô tả:** Lưu thông tin từng lốp được bảo hành.
- **Các trường chính:**
  - `id`: Khóa chính.
  - `warranty_note`: Khóa ngoại, liên kết đến `id` của `warranty_notes`.
  - `series`: Số series của lốp được bảo hành (được điền sau khi quét).
  - `dot`: Mã DOT của lốp (được tự động điền sau khi quét series thành công).
  - `scanned`: Cờ xác nhận đã quét (0 hoặc 1).
  - `quantity`: Luôn là 1.

### 2.7. Nhân Viên (`employees`) & Người Dùng (`users`)
- **Mô tả:** Lưu thông tin tài khoản người dùng và hồ sơ nhân viên liên quan.
- **Các trường chính:**
  - `users`: `id`, `email`, `name`, `avatarUrl`.
  - `employees`: `id`, `name`, `position`, và một trường liên kết đến `users`.
