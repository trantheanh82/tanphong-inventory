
# Yêu Cầu Chức Năng: Quy Trình Nhập Kho

## 1. Tổng Quan
- **Mã chức năng:** IMP-01
- **Mô tả:** Cho phép người dùng tạo phiếu nhập kho và ghi nhận số lượng lốp xe được nhập vào bằng cách quét mã DOT.
- **Mục tiêu:** Đơn giản hóa và số hóa việc kiểm đếm lốp xe khi nhập hàng, đảm bảo số liệu chính xác và giảm thiểu công sức thủ công.

## 2. Luồng Nghiệp Vụ

### 2.1. Tạo Phiếu Nhập Kho
- **Mô tả:** Người dùng khai báo các thông tin cơ bản cho một lần nhập hàng.
- **Các bước:**
  1.  Từ màn hình Dashboard hoặc Bottom Navigation, nhấn vào chức năng "Nhập Kho".
  2.  Điền "Tên phiếu" (bắt buộc), ví dụ: "Nhập hàng Contio 10/10/2024".
  3.  Điền "Khách hàng/Nhà cung cấp" (tùy chọn).
  4.  Với mỗi loại lốp xe cần nhập, người dùng thêm một mục và điền:
      - **DOT (2 số cuối):** 2 chữ số cuối của mã DOT.
      - **Số lượng:** Tổng số lốp xe của loại đó cần nhập.
  5.  Người dùng có thể thêm nhiều mục lốp xe khác nhau trong cùng một phiếu.
  6.  Khi đã khai báo xong, nhấn nút "Quét Mã".
- **Logic hệ thống:**
  - Khi nhấn "Quét Mã", hệ thống sẽ gọi API `POST /api/import-note`.
  - API này sẽ tạo một bản ghi **Phiếu Nhập** và các bản ghi **Phiếu Nhập Chi Tiết** tương ứng với từng loại lốp đã khai báo.
  - Sau khi tạo thành công, hệ thống tự động chuyển hướng người dùng đến trang quét mã (`/scanning`) và truyền `noteId` cùng với `type=import` qua URL parameters.

### 2.2. Quét Mã DOT Ghi Nhận Nhập Kho
- **Mô tả:** Người dùng sử dụng camera của thiết bị để quét mã DOT trên từng lốp xe và hệ thống sẽ tự động cập nhật số lượng đã quét.
- **Các bước:**
  1.  Tại trang quét, màn hình camera sẽ được kích hoạt.
  2.  Người dùng hướng camera vào mã DOT trên lốp xe.
  3.  Nhấn nút chụp hình để hệ thống xử lý.
  4.  Hệ thống (thông qua AI) sẽ nhận dạng mã DOT 4 chữ số từ hình ảnh.
- **Logic hệ thống:**
  - Client gửi hình ảnh đã chụp đến API `POST /api/scan`.
  - API thực hiện các bước sau:
    a. Nhận dạng mã DOT 4 chữ số (`fullRecognizedDot`).
    b. Trích xuất 2 chữ số cuối (`recognizedLastTwoDigits`).
    c. Tìm kiếm trong các **Phiếu Nhập Chi Tiết** của `noteId` hiện tại một mục có `dot` khớp với `recognizedLastTwoDigits`.
    d. Nếu tìm thấy và số lượng đã quét (`scanned`) chưa đủ so với số lượng tổng (`quantity`):
        - Tăng `scanned` lên 1.
        - Tải hình ảnh đã chụp lên làm tệp đính kèm cho mục chi tiết đó.
        - Cập nhật trạng thái của mục chi tiết (ví dụ: "Đã scan đủ" khi `scanned === quantity`).
        - Trả về thông báo thành công cho người dùng.
    e. Nếu không tìm thấy hoặc đã quét đủ, trả về thông báo lỗi/cảnh báo tương ứng.
  - Giao diện người dùng sẽ cập nhật lại tiến độ quét dựa trên phản hồi từ API.
  - Khi tất cả các mục trong phiếu đã được quét đủ, trạng thái của **Phiếu Nhập** chính sẽ được cập nhật thành "Đã scan đủ".
