
# Tài Liệu Kỹ Thuật: Kiến Trúc Hệ Thống

## 1. Tổng Quan
Ứng dụng "Tân Phong Inventory" được xây dựng dưới dạng một **Progressive Web App (PWA)**, sử dụng một ngăn xếp công nghệ hiện đại tập trung vào JavaScript/TypeScript. Kiến trúc này được thiết kế để tối ưu hóa trải nghiệm trên thiết bị di động, cho phép cài đặt ứng dụng lên màn hình chính và có khả năng hoạt động offline.

## 2. Công Nghệ Sử Dụng

### 2.1. Frontend
- **Framework:** **Next.js (App Router)**
  - Sử dụng React Server Components (RSC) để tối ưu hóa hiệu suất tải trang.
  - Cấu trúc thư mục dựa trên `app/` router giúp quản lý các trang và layout một cách trực quan.
- **Ngôn ngữ:** **TypeScript**
  - Đảm bảo an toàn kiểu dữ liệu và tăng cường khả năng bảo trì code.
- **Styling:**
  - **Tailwind CSS:** Một framework CSS utility-first để xây dựng giao diện nhanh chóng và nhất quán.
  - **ShadCN/UI:** Một bộ sưu tập các component React được xây dựng sẵn, đẹp mắt và dễ tùy chỉnh, dựa trên Radix UI và Tailwind CSS.
- **Quản lý State:**
  - **Zustand:** Một thư viện quản lý state nhỏ gọn và mạnh mẽ, được sử dụng cho các state cục bộ phức tạp như trên trang quét (`scanning-store`).
  - **React Context & Hooks:** Được sử dụng cho các state đơn giản hơn.
- **Form:**
  - **React Hook Form:** Thư viện để quản lý form một cách hiệu quả và hiệu suất cao.
  - **Zod:** Thư viện để định nghĩa schema và xác thực dữ liệu cho form.

### 2.2. Backend & Dịch Vụ
- **Backend as a Service (BaaS):** **Teable** (hoặc một dịch vụ tương tự)
  - Đóng vai trò là cơ sở dữ liệu và hệ thống backend. Toàn bộ dữ liệu (phiếu nhập, xuất, chi tiết, người dùng) được lưu trữ tại đây.
  - Cung cấp các API endpoint để ứng dụng frontend tương tác (thêm, sửa, xóa, truy vấn dữ liệu).
- **AI & Nhận Dạng Hình Ảnh:** **Genkit (Google AI)**
  - Genkit là một framework mã nguồn mở của Google để xây dựng các ứng dụng AI.
  - Trong dự án này, Genkit được sử dụng để định nghĩa các "flow" (luồng xử lý AI).
  - Các flow này nhận hình ảnh (dưới dạng Data URI) từ frontend, gửi đến mô hình Generative AI (Gemini) để xử lý và trả về kết quả nhận dạng (số DOT, số Series) dưới dạng JSON có cấu trúc.

## 3. Luồng Dữ Liệu & Tương Tác
1.  **Người dùng (Client):** Tương tác với giao diện Next.js chạy trên trình duyệt.
2.  **Next.js Frontend:**
    - Khi cần dữ liệu (ví dụ: tải danh sách phiếu), nó sẽ gọi đến các **API Route** của chính nó (trong `src/app/api/...`).
    - Khi thực hiện quét, nó gửi hình ảnh đến các API Route này.
3.  **Next.js API Routes:**
    - Đóng vai trò là một lớp trung gian (proxy/BFF - Backend for Frontend).
    - Nhận yêu cầu từ client.
    - **Xác thực:** Kiểm tra cookie session của người dùng.
    - **Tương tác với Teable:** Gọi đến các API endpoint của Teable để đọc/ghi dữ liệu kho.
    - **Tương tác với Genkit:** Khi có yêu cầu nhận dạng ảnh, nó gọi đến các AI flow đã được định nghĩa.
    - Trả về kết quả cho client.
4.  **Genkit AI Flows:**
    - Nhận yêu cầu từ API Route.
    - Giao tiếp với Google AI Platform (Gemini) để xử lý hình ảnh.
    - Trả kết quả nhận dạng về cho API Route.
5.  **Teable BaaS:**
    - Lưu trữ toàn bộ dữ liệu của ứng dụng.
    - Xử lý xác thực người dùng ban đầu (đăng nhập).

## 4. Triển Khai (Deployment)
- **CI/CD:** Sử dụng **GitHub Actions** để tự động hóa quy trình build và deploy.
- **Containerization:** **Docker** được sử dụng để đóng gói ứng dụng Next.js.
- **Hạ tầng:** Ứng dụng được deploy lên một máy chủ ảo (VPS) và được quản lý thông qua **Docker Compose** và **Traefik** (làm reverse proxy và quản lý SSL).
- **PWA:** Cấu hình Next.js PWA (`@ducanh2912/next-pwa`) để build service worker, cho phép ứng dụng được cài đặt và hoạt động offline.
