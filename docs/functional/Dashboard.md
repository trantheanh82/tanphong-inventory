
# Yêu Cầu Chức Năng: Bảng Điều Khiển (Dashboard)

## 1. Tổng Quan
- **Mã chức năng:** DASH-01
- **Mô tả:** Màn hình chính của ứng dụng, cung cấp lối tắt đến các chức năng cốt lõi và hiển thị tóm tắt các hoạt động gần đây.
- **Mục tiêu:** Giúp người dùng nắm bắt nhanh tình hình công việc và truy cập nhanh các tác vụ thường dùng.

## 2. Bố Cục Giao Diện

### 2.1. Lối Tắt Chức Năng
- Hiển thị 3 nút chức năng chính một cách nổi bật:
  - **Nhập Kho:** Điều hướng đến trang tạo phiếu nhập kho.
  - **Xuất Kho:** Điều hướng đến trang tạo phiếu xuất kho.
  - **Bảo Hành:** Điều hướng đến trang tạo phiếu bảo hành.

### 2.2. Danh sách Hoạt Động Gần Đây
- Hiển thị 3 danh sách riêng biệt cho các hoạt động gần đây nhất:
  - **Nhập Kho Gần Đây:** Liệt kê 3-5 phiếu nhập kho mới nhất.
  - **Xuất Kho Gần Đây:** Liệt kê 3-5 phiếu xuất kho mới nhất.
  - **Bảo Hành Gần Đây:** Liệt kê 3-5 phiếu bảo hành mới nhất.

### 2.3. Thông tin hiển thị cho mỗi phiếu
Mỗi phiếu trong danh sách tóm tắt cần hiển thị các thông tin cơ bản:
- Tên phiếu.
- Trạng thái phiếu (ví dụ: "Mới tạo", "Chưa scan đủ", "Đã scan đủ").
- Số lượng đã quét / Tổng số lượng.
- Ngày tạo.
- Nút "Xem thêm" ở cuối mỗi danh sách để điều hướng người dùng đến trang danh sách chi tiết tương ứng (ví dụ: `/listing?type=import`).

## 3. Tương Tác Người Dùng
- Nhấn vào một phiếu trong danh sách sẽ mở ra một cửa sổ (dialog) hiển thị chi tiết thông tin của phiếu đó.
- Cửa sổ chi tiết cho phép người dùng thực hiện hành động "Tiếp tục quét" nếu phiếu đó chưa hoàn thành.

## 4. API Liên Quan
- `/api/dashboard`: API `GET` để lấy dữ liệu cho cả 3 danh sách (nhập, xuất, bảo hành).
- `/api/note-detail`: API `GET` để lấy thông tin chi tiết của một phiếu khi người dùng nhấn vào.
