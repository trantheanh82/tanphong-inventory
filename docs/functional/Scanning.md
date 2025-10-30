
# Yêu Cầu Chức Năng: Module Quét Mã & Nhận Dạng

## 1. Tổng Quan
- **Mã chức năng:** SCAN-01
- **Mô tả:** Đây là chức năng cốt lõi của ứng dụng, cho phép người dùng sử dụng camera trên thiết bị di động để chụp ảnh lốp xe. Hệ thống sẽ sử dụng công nghệ AI (Genkit) để tự động nhận dạng các thông tin quan trọng như mã DOT và số Series từ hình ảnh.
- **Mục tiêu:** Tự động hóa việc nhập liệu, giảm thiểu sai sót do con người, và tăng tốc độ các quy trình nghiệp vụ kho.

## 2. Giao Diện Người Dùng (Trang `/scanning`)

- **Hiển thị Camera:** Chiếm phần lớn màn hình, hiển thị hình ảnh trực tiếp từ camera sau của thiết bị.
- **Vùng Quét:** Một khung hình chữ nhật được vẽ giữa màn hình để hướng dẫn người dùng đặt đúng vị trí mã DOT/Series cần quét.
- **Nút Chụp:** Một nút lớn, dễ bấm để người dùng chụp lại hình ảnh trong vùng quét.
- **Nút Đèn Flash:** Cho phép bật/tắt đèn flash của camera để hỗ trợ quét trong điều kiện thiếu sáng.
- **Nút Quay Lại:** Cho phép người dùng thoát khỏi màn hình quét và quay về trang trước.
- **Bảng Thông Tin Phiếu:** Một khu vực (thường ở dưới) hiển thị danh sách các mục cần quét trong phiếu hiện tại, cùng với tiến độ (đã quét / tổng số).
- **Khu vực chọn chế độ (chỉ dành cho phiếu xuất):** Cho phép người dùng chọn chế dộ quét: "DOT", "Series", hoặc "Cả hai".

## 3. Luồng Xử Lý Kỹ Thuật (Khi người dùng chụp ảnh)

1.  **Client-Side (Trang `/scanning`):**
    - Chụp ảnh từ `video stream` và cắt cúp theo vùng quét, chuyển đổi thành định dạng Data URI (base64).
    - Hiển thị trạng thái đang xử lý (`loading`).
    - Gửi yêu cầu `POST` đến API endpoint tương ứng (`/api/scan`, `/api/export-scan`, `/api/warranty-scan`) với payload chứa `noteId`, `noteType`, và `imageDataUri`.

2.  **Server-Side (API Endpoint):**
    - API nhận yêu cầu.
    - Gọi đến **Genkit Flow** tương ứng (`recognizeTireInfo`, `recognizeDotNumber`, `recognizeSeriesNumber`).
    - **Genkit Flow** thực hiện:
        - Xây dựng một `prompt` (câu lệnh) chi tiết, hướng dẫn mô hình AI cách nhận dạng thông tin từ hình ảnh. Ví dụ: "Bạn là một chuyên gia kiểm tra lốp xe. Hãy tìm một chuỗi 4 chữ số nằm trong hình bầu dục...".
        - Gửi `prompt` và `imageDataUri` đến mô hình Generative AI (ví dụ: Gemini).
        - Nhận kết quả có cấu trúc (JSON) từ AI (ví dụ: `{ "dotNumber": "4020" }`).
        - Flow có thể thực hiện một số bước xác thực hoặc xử lý hậu kỳ (ví dụ: kiểm tra độ dài series, chuyển đổi ký tự 'O' thành '0').
    - API nhận kết quả từ Flow.
    - Dựa trên kết quả và logic nghiệp vụ (kiểm tra trùng lặp, so khớp DOT, kiểm tra số lượng), API thực hiện cập nhật cơ sở dữ liệu (Teable).
    - API gửi phản hồi (thành công hoặc lỗi) về cho client.

3.  **Client-Side (Cập nhật giao diện):**
    - Nhận phản hồi từ API.
    - Hiển thị thông báo (toast) cho người dùng (ví dụ: "Đã ghi nhận DOT 4020 thành công").
    - Cập nhật lại trạng thái và tiến độ trên bảng thông tin phiếu.

## 4. Các Luồng AI (Genkit Flows)

- **`src/ai/flows/export-scan-flow.ts` (`recognizeTireInfo`):**
  - Luồng phức tạp nhất, được huấn luyện để nhận dạng đồng thời cả DOT và Series.
  - Prompt được tối ưu để phân biệt giữa DOT (4 chữ số, thường trong hình bầu dục) và Series (chuỗi chữ và số, tối đa 11 ký tự).
  - Có logic hậu xử lý để tăng độ chính xác.

- **`src/ai/flows/scan-flow.ts` (`recognizeDotNumber`):**
  - Tập trung chuyên biệt vào việc nhận dạng mã DOT 4 chữ số.

- **`src/ai/flows/warranty-scan-flow.ts` (`recognizeSeriesNumber`):**
  - Tập trung chuyên biệt vào việc nhận dạng số Series.
  - Có quy tắc đặc biệt để xử lý ký tự (chuyển 'O' thành '0').
