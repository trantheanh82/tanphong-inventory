
# Yêu Cầu Chức Năng: Quy Trình Xuất Kho

## 1. Tổng Quan
- **Mã chức năng:** EXP-01
- **Mô tả:** Cho phép người dùng tạo phiếu xuất kho, khai báo các loại lốp và số lượng cần xuất, sau đó thực hiện quét để ghi nhận việc xuất kho.
- **Điểm đặc biệt:** Quy trình này xử lý 3 loại lốp khác nhau với các yêu cầu quét riêng:
  1.  **Lốp Nội địa:** Chỉ cần quét mã DOT.
  2.  **Lốp Nước ngoài (không DOT):** Chỉ cần quét số Series.
  3.  **Lốp Nước ngoài (có DOT):** Cần quét cả mã DOT và số Series.

## 2. Luồng Nghiệp Vụ

### 2.1. Tạo Phiếu Xuất Kho
- **Mô tả:** Người dùng khai báo thông tin ban đầu cho phiếu xuất.
- **Các bước:**
  1.  Điều hướng đến trang "Xuất Kho" từ Dashboard hoặc Bottom Navigation.
  2.  Nhập "Tên phiếu xuất" (bắt buộc).
  3.  Nhập "Khách hàng" (tùy chọn).
  4.  Thêm các loại lốp cần xuất vào một trong ba danh mục:
      - **DOT:** Nhập DOT (2 số cuối) và Số lượng.
      - **Series:** Chỉ nhập Số lượng. Mỗi đơn vị số lượng tương ứng một lốp cần quét Series.
      - **DOT & Series:** Nhập DOT (2 số cuối) và Số lượng. Mỗi đơn vị số lượng tương ứng một lốp cần quét cả DOT và Series.
  5.  Sau khi điền đủ thông tin, nhấn nút "Tạo và Quét".
- **Logic hệ thống:**
  - Hệ thống gọi API `/api/export-note` để tạo một bản ghi Phiếu Xuất và các bản ghi Phiếu Xuất Chi Tiết tương ứng.
  - Sau khi tạo thành công, tự động chuyển hướng người dùng đến trang quét (`/scanning`) với `noteId` và `type=export`.
- **API liên quan:** `POST /api/export-note`

### 2.2. Quét Ghi Nhận Xuất Kho
- **Mô tả:** Người dùng sử dụng camera để quét thông tin trên lốp xe và cập nhật vào phiếu xuất chi tiết.
- **Trang quét (`/scanning`):**
  - Hiển thị danh sách các mục cần quét trong phiếu.
  - Cung cấp các chế độ quét phù hợp với các loại lốp có trong phiếu: "Quét DOT", "Quét Series", "Cả hai".
- **Luồng quét:**
  - **Chế độ "Quét DOT":**
    - Người dùng quét lốp. AI nhận dạng DOT 4 chữ số.
    - Hệ thống lấy 2 số cuối và so sánh với các mục "DOT" trong phiếu.
    - Nếu khớp và chưa đủ số lượng, cập nhật mục đó, tăng `scanned` và tải ảnh lên.
  - **Chế độ "Quét Series":**
    - Người dùng quét lốp. AI nhận dạng số Series.
    - Hệ thống kiểm tra số Series có trùng lặp trong hệ thống không.
    - Nếu không, tìm một mục "Series" chưa quét, cập nhật số Series vào, tăng `scanned` và tải ảnh lên.
  - **Chế độ "Cả hai" (DOT & Series):**
    - **Luồng linh hoạt:** Người dùng có thể quét DOT trước hoặc Series trước.
    - **Bước 1 (Quét DOT/Series):**
      - Nếu quét DOT: Hệ thống tìm mục "DOT & Series" khớp với 2 số cuối DOT, tải ảnh DOT lên, và giữ lại `recordId` của mục đó. Giao diện thông báo người dùng quét tiếp Series.
      - Nếu quét Series: Hệ thống tìm mục "DOT & Series" còn trống, cập nhật số Series và tải ảnh lên, giữ lại `recordId`. Giao diện thông báo người dùng quét tiếp DOT.
    - **Bước 2 (Quét thông tin còn lại):**
      - Người dùng quét thông tin còn lại. Hệ thống sử dụng `recordId` từ bước 1 để cập nhật nốt thông tin vào đúng bản ghi đó, tăng `scanned` và tải ảnh thứ hai lên.
- **Logic hệ thống:**
  - Tất cả các thao tác quét đều được xử lý bởi API `/api/export-scan`.
  - API chịu trách nhiệm nhận dạng, xác thực, kiểm tra trùng lặp và cập nhật cơ sở dữ liệu.
  - Sau mỗi lần quét thành công, danh sách các mục cần quét trên giao diện sẽ được cập nhật.
- **API liên quan:** `POST /api/export-scan`
