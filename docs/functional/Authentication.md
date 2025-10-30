
# Yêu Cầu Chức Năng: Xác thực & Quản lý Người dùng

## 1. Đăng Nhập
- **Mã chức năng:** AUTH-01
- **Mô tả:** Người dùng cung cấp email và mật khẩu để truy cập vào hệ thống.
- **Yêu cầu:**
  - Form đăng nhập gồm 2 trường: "Email" và "Mật khẩu".
  - Có tùy chọn "Ghi nhớ đăng nhập". Nếu chọn, thông tin đăng nhập sẽ được lưu trữ an toàn trên thiết bị cho lần truy cập sau.
  - Hệ thống xác thực thông tin với backend. Nếu thành công, người dùng được chuyển đến trang Dashboard và một session cookie được tạo.
  - Nếu thất bại, hiển thị thông báo lỗi "Email hoặc mật khẩu không đúng".
- **API liên quan:** `/api/auth/signin`

## 2. Đăng Xuất
- **Mã chức năng:** AUTH-02
- **Mô tả:** Người dùng đăng xuất khỏi hệ thống một cách an toàn.
- **Yêu cầu:**
  - Nút "Đăng xuất" có sẵn trên trang Cá nhân và Header.
  - Khi nhấn, session hiện tại của người dùng sẽ bị hủy.
  - Người dùng được chuyển hướng về trang Đăng nhập.
- **API liên quan:** `/api/auth/logout`

## 3. Thay Đổi Mật Khẩu
- **Mã chức năng:** AUTH-03
- **Mô tả:** Người dùng có thể tự thay đổi mật khẩu của mình.
- **Yêu cầu:**
  - Chức năng này có thể truy cập từ trang Cá nhân.
  - Người dùng phải cung cấp: Mật khẩu hiện tại, Mật khẩu mới, Xác nhận mật khẩu mới.
  - Hệ thống kiểm tra mật khẩu hiện tại có đúng không.
  - Hệ thống kiểm tra mật khẩu mới và mật khẩu xác nhận có trùng khớp không.
  - Mật khẩu mới phải có độ dài tối thiểu 6 ký tự.
  - Sau khi đổi mật khẩu thành công, người dùng sẽ bị buộc đăng xuất và phải đăng nhập lại với mật khẩu mới.
- **API liên quan:** `/api/auth/change-password`
