
# Yêu Cầu Chức Năng: Quy Trình Bảo Hành

## 1. Tổng Quan
- **Mã chức năng:** WAR-01
- **Mô tả:** Cho phép người dùng tạo phiếu bảo hành cho một số lượng lốp nhất định, sau đó quét số Series của từng lốp để ghi nhận thông tin bảo hành.
- **Mục tiêu:** Tự động hóa và chuẩn hóa quy trình tiếp nhận bảo hành, đảm bảo mỗi lốp được ghi nhận đều có trong lịch sử xuất kho.

## 2. Luồng Nghiệp Vụ

### 2.1. Tạo Phiếu Bảo Hành
- **Mô tả:** Người dùng tạo một phiếu bảo hành mới, chỉ định tên và tổng số lượng lốp cần bảo hành.
- **Các bước:**
  1.  Điều hướng đến trang "Bảo Hành" từ Dashboard hoặc Bottom Navigation.
  2.  Nhập "Tên phiếu bảo hành" (bắt buộc).
  3.  Nhập "Số lượng lốp" cần bảo hành.
  4.  Nhấn nút "Quét Mã".
- **Logic hệ thống:**
  - Hệ thống gọi API `POST /api/warranty-search`.
  - API này sẽ:
    a. Tạo một bản ghi **Phiếu Bảo Hành** mới.
    b. Tạo ra chính xác số lượng bản ghi **Phiếu Bảo Hành Chi Tiết** rỗng (chưa có thông tin series/dot) tương ứng với số lượng đã nhập.
  - Sau khi tạo thành công, hệ thống chuyển hướng người dùng đến trang quét (`/scanning`) với `noteId` của phiếu vừa tạo và `type=warranty`.

### 2.2. Quét Series Ghi Nhận Bảo Hành
- **Mô tả:** Người dùng quét số Series trên lốp để ghi nhận vào một trong các mục chi tiết rỗng đã được tạo ở bước trước.
- **Luồng quét:**
  1.  Tại trang quét, người dùng hướng camera vào số Series của lốp và chụp ảnh.
  2.  Client gửi hình ảnh đến API `POST /api/warranty-scan`.
  3.  **Logic API (`/api/warranty-scan`):**
      a. **Nhận dạng Series:** Gọi AI flow (`recognizeSeriesNumber`) để lấy số Series từ ảnh.
      b. **Kiểm tra trùng lặp trong phiếu hiện tại:** Đảm bảo số Series này chưa được quét cho cùng một phiếu bảo hành. Nếu có, báo lỗi.
      c. **Xác thực trong lịch sử xuất kho:** Tìm kiếm số Series này trong toàn bộ các bản ghi **Phiếu Xuất Chi Tiết**. Nếu không tìm thấy, báo lỗi "Không tìm thấy series trong hệ thống".
      d. **Tìm mục chi tiết rỗng:** Tìm một bản ghi **Phiếu Bảo Hành Chi Tiết** (thuộc phiếu hiện tại) mà chưa có số Series.
      e. **Cập nhật thông tin:** Nếu tìm thấy mục rỗng:
          - Cập nhật số **Series** đã quét được vào mục đó.
          - Lấy thông tin **DOT** từ bản ghi xuất kho tương ứng và điền vào.
          - Cập nhật trạng thái (`scanned = 1`, `status = 'Đã scan'`).
          - Trả về thông báo thành công.
      f. Nếu không còn mục chi tiết rỗng nào (đã quét đủ số lượng), trả về cảnh báo "Đã quét đủ số lượng cho phiếu này."
- **Cập nhật giao diện:**
  - Sau mỗi lần quét thành công, tiến độ trên trang quét sẽ được cập nhật.
  - Khi tất cả các mục đã được quét, trạng thái của Phiếu Bảo Hành chính sẽ được cập nhật là "Đã scan đủ".
