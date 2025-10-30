
# Tài Liệu Phân Tích Nghiệp Vụ (BA) - Dự Án Quản Lý Kho Tân Phong

## 1. Giới Thiệu

### 1.1. Mục Đích Tài Liệu
Tài liệu này nhằm mục đích định nghĩa và làm rõ các yêu cầu nghiệp vụ, chức năng và phi chức năng cho ứng dụng di động "Tân Phong Inventory". Nó đóng vai trò là nguồn thông tin trung tâm cho các bên liên quan, bao gồm đội ngũ phát triển, quản lý dự án, và người dùng cuối, để đảm bảo tất cả đều có chung một sự hiểu biết về sản phẩm.

### 1.2. Tổng Quan Dự Án
"Tân Phong Inventory" là một ứng dụng web di động (Progressive Web App - PWA) được thiết kế để hiện đại hóa và số hóa quy trình quản lý kho lốp xe của công ty Tân Phong. Ứng dụng tập trung vào việc đơn giản hóa các thao tác nhập, xuất và bảo hành lốp xe thông qua việc sử dụng camera trên thiết bị di động để quét và nhận dạng mã DOT và số Series, giảm thiểu sai sót và tăng hiệu quả công việc.

### 1.3. Phạm Vi Dự Án
- **Trong phạm vi:**
  - Quản lý người dùng: Đăng nhập, Đăng xuất, Đổi mật khẩu.
  - Quy trình Nhập kho: Tạo phiếu nhập và quét mã DOT để xác nhận.
  - Quy trình Xuất kho: Tạo phiếu xuất và quét mã DOT và/hoặc Series để xác nhận.
  - Quy trình Bảo hành: Tạo phiếu bảo hành và quét Series để ghi nhận.
  - Quản lý phiếu: Xem danh sách, tìm kiếm, và xem chi tiết các phiếu nhập/xuất/bảo hành.
  - Trang cá nhân: Xem thông tin và truy cập các chức năng người dùng.
  - Hướng dẫn sử dụng.

- **Ngoài phạm vi:**
  - Quản lý vai trò và quyền hạn chi tiết (chỉ có một vai trò người dùng).
  - Phân tích và báo cáo thống kê phức tạp.
  - Quản lý nhà cung cấp, khách hàng (chỉ lưu dạng văn bản).
  - Tích hợp với các hệ thống kế toán hoặc ERP khác.

## 2. Yêu Cầu Chức Năng (Functional Requirements)

Dưới đây là các liên kết đến tài liệu mô tả chi tiết cho từng nhóm chức năng:

- **[Xác thực & Quản lý Người dùng](./functional/Authentication.md)**
- **[Bảng điều khiển (Dashboard)](./functional/Dashboard.md)**
- **[Quy trình Nhập Kho](./functional/ImportWorkflow.md)**
- **[Quy trình Xuất Kho](./functional/ExportWorkflow.md)**
- **[Quy trình Bảo Hành](./functional/WarrantyWorkflow.md)**
- **[Module Quét Mã & Nhận Dạng](./functional/Scanning.md)**

## 3. Yêu Cầu Phi Chức Năng (Non-Functional Requirements)

| Thuộc tính | Yêu cầu |
| --- | --- |
| **Hiệu suất** | - Thời gian tải trang ban đầu dưới 3 giây.<br>- Thời gian phản hồi của các thao tác chính (tạo phiếu, quét) dưới 2 giây.<br>- API nhận dạng hình ảnh phải xử lý trong vòng 5 giây. |
| **Tính khả dụng** | - Ứng dụng phải hoạt động 24/7.<br>- Giao diện thân thiện, dễ sử dụng trên các thiết bị di động, không yêu cầu đào tạo phức tạp. |
| **Bảo mật** | - Mật khẩu người dùng phải được lưu trữ an toàn.<br>- Sử dụng session cookie để quản lý phiên đăng nhập. |
| **Khả năng tương thích**| - Hoạt động tốt trên các trình duyệt di động phổ biến (Chrome, Safari). |
| **Khả năng mở rộng**| - Kiến trúc phải cho phép dễ dàng thêm các quy trình nghiệp vụ mới trong tương lai. |
| **PWA** | - Có khả năng cài đặt lên màn hình chính của điện thoại.<br>- Có khả năng hoạt động offline ở mức độ cơ bản và tự động cập nhật khi có phiên bản mới. |

## 4. Tổng Quan Kỹ Thuật

- **[Kiến trúc hệ thống](./technical/SystemArchitecture.md)**
- **[Mô hình dữ liệu](./technical/DataModel.md)**
