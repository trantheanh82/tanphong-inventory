
"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowDownCircle, ArrowUpCircle, ScanLine, ShieldCheck, LayoutGrid, CircleUser } from "lucide-react";

export default function GuidePage() {
    const [activeItem, setActiveItem] = useState("item-1");
    const sectionRefs = {
        'item-1': useRef<HTMLDivElement>(null),
        'item-2': useRef<HTMLDivElement>(null),
        'item-3': useRef<HTMLDivElement>(null),
        'item-4': useRef<HTMLDivElement>(null),
        'item-5': useRef<HTMLDivElement>(null),
    };

    const handleLinkClick = (itemId: keyof typeof sectionRefs) => {
        setActiveItem(itemId);
        setTimeout(() => {
             sectionRefs[itemId].current?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }, 100); // Small delay to allow accordion to open
    };
    
    return (
        <div className="p-4 space-y-6 animate-in fade-in-0 duration-500">
            <Card className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50">
                <CardHeader>
                    <CardTitle className="text-2xl text-[#333]">Hướng Dẫn Sử Dụng Ứng Dụng</CardTitle>
                    <CardDescription className="text-gray-600">
                        Chào mừng bạn đến với hệ thống quản lý kho Tân Phong. Dưới đây là hướng dẫn chi tiết về cách sử dụng các tính năng chính của ứng dụng.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-gray-800">
                    <h3 className="font-semibold text-lg mb-2 text-[#333]">Mục lục</h3>
                    <ul className="list-disc list-inside space-y-1">
                        <li><button onClick={() => handleLinkClick('item-1')} className="text-blue-700 hover:underline">1. Quy trình Nhập Kho</button></li>
                        <li><button onClick={() => handleLinkClick('item-2')} className="text-blue-700 hover:underline">2. Quy trình Xuất Kho</button></li>
                        <li><button onClick={() => handleLinkClick('item-3')} className="text-blue-700 hover:underline">3. Quy trình Bảo Hành</button></li>
                        <li><button onClick={() => handleLinkClick('item-4')} className="text-blue-700 hover:underline">4. Xem và Quản lý các Phiếu</button></li>
                        <li><button onClick={() => handleLinkClick('item-5')} className="text-blue-700 hover:underline">5. Quản lý Thông tin Cá nhân</button></li>
                    </ul>
                </CardContent>
            </Card>

            <Accordion type="single" collapsible value={activeItem} onValueChange={setActiveItem} className="space-y-4">
                <div ref={sectionRefs['item-1']}>
                    <AccordionItem value="item-1" id="nhap-kho" className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 px-6">
                        <AccordionTrigger className="text-lg font-bold text-[#333] hover:no-underline">1. Quy trình Nhập Kho</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700 space-y-4">
                            <p>Chức năng này cho phép bạn tạo phiếu nhập kho và ghi nhận số lượng lốp xe được nhập vào kho thông qua việc quét mã DOT.</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>
                                    <strong>Tạo Phiếu Nhập Kho:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1">
                                        <li>Từ màn hình chính, nhấn vào nút <span className="inline-flex items-center"><ArrowDownCircle className="w-5 h-5 mx-1"/> <strong>Nhập Kho</strong></span>.</li>
                                        <li>Điền "Tên phiếu" (ví dụ: "Nhập hàng từ nhà cung cấp A - 10/10/2024").</li>
                                        <li>Với mỗi loại lốp xe, nhập <strong>DOT</strong> (4 chữ số) và <strong>Số lượng</strong> tương ứng.</li>
                                        <li>Nhấn nút "Thêm" để thêm các loại lốp khác vào cùng một phiếu.</li>
                                        <li>Sau khi điền đủ thông tin, nhấn nút <span className="inline-flex items-center"><ScanLine className="w-5 h-5 mx-1"/> <strong>Quét Mã</strong></span>.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Quét Mã DOT:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1">
                                        <li>Màn hình camera sẽ hiện ra. Đưa camera vào mã DOT trên lốp xe sao cho rõ nét trong khung quét.</li>
                                        <li>Nhấn nút chụp hình <ScanLine className="inline w-5 h-5" /> để hệ thống nhận dạng.</li>
                                        <li>Hệ thống sẽ tự động ghi nhận số lượng đã quét cho DOT tương ứng.</li>
                                        <li>Tiếp tục quét cho đến khi đủ số lượng của tất cả các loại lốp trong phiếu.</li>
                                    </ul>
                                </li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </div>

                <div ref={sectionRefs['item-2']}>
                    <AccordionItem value="item-2" id="xuat-kho" className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 px-6">
                        <AccordionTrigger className="text-lg font-bold text-[#333] hover:no-underline">2. Quy trình Xuất Kho</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700 space-y-4">
                            <p>Tương tự như nhập kho, chức năng này dùng để ghi nhận lốp xe xuất ra khỏi kho. Đối với lốp "Nước ngoài", cần phải quét cả số series.</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>
                                    <strong>Tạo Phiếu Xuất Kho:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1">
                                        <li>Từ màn hình chính, nhấn vào nút <span className="inline-flex items-center"><ArrowUpCircle className="w-5 h-5 mx-1"/> <strong>Xuất Kho</strong></span>.</li>
                                        <li>Điền "Tên phiếu".</li>
                                        <li>Chọn loại lốp: "Nội địa" hoặc "Nước ngoài".</li>
                                        <li>Nhập <strong>DOT</strong> và <strong>Số lượng</strong>.</li>
                                        <li>Nếu là lốp "Nước ngoài", trường "Series Number" sẽ xuất hiện. Số series sẽ được quét và điền tự động ở bước sau.</li>
                                        <li>Nhấn <span className="inline-flex items-center"><ScanLine className="w-5 h-5 mx-1"/> <strong>Quét Mã</strong></span> để bắt đầu.</li>
                                    </ul>
                                </li>
                                <li>
                                    <strong>Quét Mã DOT và Series:</strong>
                                    <ul className="list-disc list-inside pl-4 mt-1">
                                        <li>Quy trình quét DOT tương tự như nhập kho.</li>
                                        <li>Đối với lốp "Nước ngoài", sau khi quét đủ DOT, hệ thống có thể yêu cầu quét thêm số series cho từng chiếc lốp.</li>
                                    </ul>
                                </li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </div>

                <div ref={sectionRefs['item-3']}>
                    <AccordionItem value="item-3" id="bao-hanh" className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 px-6">
                        <AccordionTrigger className="text-lg font-bold text-[#333] hover:no-underline">3. Quy trình Bảo Hành</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700 space-y-4">
                            <p>Chức năng này cho phép bạn nhanh chóng tạo phiếu bảo hành bằng cách quét số series của lốp xe đã được xuất bán trước đó.</p>
                            <ol className="list-decimal list-inside space-y-2">
                                <li>Từ màn hình chính, nhấn vào nút <span className="inline-flex items-center"><ShieldCheck className="w-5 h-5 mx-1"/> <strong>Bảo Hành</strong></span>.</li>
                                <li>Màn hình camera sẽ mở ra. Hướng camera vào số series trên lốp xe.</li>
                                <li>Nhấn nút chụp hình <ScanLine className="inline w-5 h-5" />.</li>
                                <li>Hệ thống sẽ tự động tìm kiếm lốp xe dựa trên series trong các phiếu xuất đã có.</li>
                                <li>Nếu tìm thấy, một phiếu bảo hành và chi tiết phiếu bảo hành sẽ được tự động tạo. Nếu không tìm thấy, hệ thống sẽ báo lỗi.</li>
                            </ol>
                        </AccordionContent>
                    </AccordionItem>
                </div>
                
                <div ref={sectionRefs['item-4']}>
                    <AccordionItem value="item-4" id="quan-ly-phieu" className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 px-6">
                        <AccordionTrigger className="text-lg font-bold text-[#333] hover:no-underline">4. Xem và Quản lý các Phiếu</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700 space-y-4">
                            <p>Bạn có thể xem lại danh sách các phiếu nhập, xuất, bảo hành và tiếp tục các công việc còn dang dở.</p>
                            <ul className="list-disc list-inside space-y-2">
                            <li><strong>Thanh điều hướng dưới cùng:</strong> Sử dụng các biểu tượng <LayoutGrid className="inline w-4 h-4"/>, <ArrowDownCircle className="inline w-4 h-4"/>, <ArrowUpCircle className="inline w-4 h-4"/>, <ShieldCheck className="inline w-4 h-4"/> để truy cập nhanh danh sách các loại phiếu tương ứng.</li>
                            <li><strong>Tìm kiếm:</strong> Sử dụng thanh tìm kiếm ở đầu trang danh sách để lọc các phiếu theo tên.</li>
                            <li><strong>Xem chi tiết:</strong> Nhấn vào một phiếu bất kỳ trong danh sách để xem thông tin chi tiết, bao gồm các loại lốp, số lượng, và tiến độ đã quét.</li>
                            <li><strong>Tiếp tục quét:</strong> Nếu một phiếu chưa được quét đủ số lượng, nút "Tiếp tục quét" sẽ xuất hiện trong cửa sổ chi tiết, cho phép bạn hoàn thành công việc.</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </div>
                
                <div ref={sectionRefs['item-5']}>
                    <AccordionItem value="item-5" id="ca-nhan" className="bg-white/50 backdrop-blur-md rounded-xl shadow-lg border border-white/50 px-6">
                        <AccordionTrigger className="text-lg font-bold text-[#333] hover:no-underline">5. Quản lý Thông tin Cá nhân</AccordionTrigger>
                        <AccordionContent className="text-base text-gray-700 space-y-4">
                            <p>Xem thông tin tài khoản của bạn và thực hiện các thay đổi cần thiết.</p>
                            <ul className="list-disc list-inside space-y-2">
                            <li>Nhấn vào biểu tượng <CircleUser className="inline w-4 h-4"/> ở thanh điều hướng dưới cùng để vào trang cá nhân.</li>
                            <li>Tại đây, bạn có thể xem lại thông tin cá nhân và chức vụ.</li>
                            <li>Nhấn nút "Change Password" để thay đổi mật khẩu đăng nhập của bạn.</li>
                            <li>Nhấn nút "Hướng dẫn" để xem lại trang hướng dẫn này bất cứ lúc nào.</li>
                            </ul>
                        </AccordionContent>
                    </AccordionItem>
                </div>
            </Accordion>
        </div>
    );
}

    

    