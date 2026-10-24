// ==UserScript==
// @name         Mobifone SmartW
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  gachipper
// @match        *://smartw.mobifone.vn/smartw/*form.htm*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let initInterval = setInterval(function() {
        if (document.readyState === 'complete') {
            clearInterval(initInterval);
            initTool();
        }
    }, 500);

    function initTool() {
        if (document.getElementById('btnAutoFillForm')) return;

        const btn = document.createElement('button');
        btn.id = 'btnAutoFillForm';
        btn.innerHTML = ' gachipper';
        btn.style.position = 'fixed';
        btn.style.top = '10px';
        btn.style.right = '250px';
        btn.style.zIndex = '999999';
        btn.style.padding = '10px 15px';
        btn.style.background = '#e4e4e4';
        btn.style.color = '#000000';
        btn.style.border = 'none';
        btn.style.borderRadius = '1px';
        btn.style.fontWeight = 'bold';
        btn.style.cursor = 'pointer';
        btn.style.boxShadow = '0px 4px 6px rgba(0,0,0,0.3)';

        document.body.appendChild(btn);

        function formatTime(timeStr) {
            if (!timeStr) return '';
            let match = timeStr.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})/);
            if (match) {
                return `${match[3]}/${match[2]}/${match[1]} ${match[4]}:${match[5]}`;
            }
            return timeStr;
        }

        function executeScript(code) {
            let script = document.createElement('script');
            script.textContent = code;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        }

        btn.onclick = async function() {
            try {
                let text = "";
                try {
                    text = await navigator.clipboard.readText();
                } catch (err) {}

                if (!text || !text.includes("Tên sự cố")) {
                    text = prompt(" Trình duyệt chặn tự động đọc.\nBấm Ctrl+V để dán Log vào đây:");
                }

                if (!text || !text.includes("Tên sự cố")) {
                    alert("Không có log hợp lệ!");
                    return;
                }

                btn.innerText = " Đang xử lý...";

                
                let tenSuCo = text.match(/(?:1\.\s*)?Tên sự cố:\s*([\s\S]*?)(?=(?:2\.\s*)?Thời gian)/i)?.[1]?.trim();
                let tgBatDau = text.match(/\+\s*Bắt đầu:\s*([^\r\n]*)/i)?.[1]?.trim();
                let nhanSuFO = text.match(/-\s*Nhân sự FO\/ Xử lý:\s*([^\r\n]*)/i)?.[1]?.trim();

                const prefix = "Lỗi truyền dẫn - ";
                let finalTenSuCo = "";
                let actionText = "";

                if(tenSuCo) {
                    finalTenSuCo = tenSuCo;
                    if (!finalTenSuCo.toLowerCase().includes("lỗi truyền dẫn")) {
                        finalTenSuCo = prefix + finalTenSuCo;
                    }
                }

                if (nhanSuFO) {
                    let parts = nhanSuFO.split('/');
                    let partner = parts[parts.length - 1].trim();
                    actionText = partner + " xử lý";
                }

                let timeStartParsed = tgBatDau ? formatTime(tgBatDau) : "";

                
                let lowerText = text.toLowerCase();
                let vendorValue = 'CISCO';

                if (lowerText.includes("huawei")) {
                    vendorValue = 'HUAWEI';
                }
                else if (lowerText.includes("mp1") || lowerText.includes("mp2")) {
                    vendorValue = 'NOKIA SIEMENS';
                }
                else if (lowerText.includes("đứt cáp") || lowerText.includes("dut cap")) {
                    vendorValue = 'CIENA';
                }
                else if (lowerText.includes("downlink")) {
                    vendorValue = 'CISCO';
                }

                let injectionCode = `
                    try {
                        // 1. Gán text thuần
                        $('#tenSuCo').val(${JSON.stringify(finalTenSuCo)});
                        $('#moTa').val(${JSON.stringify(finalTenSuCo)});
                        $('#tgBatDau').val('${timeStartParsed}');
                        $('#tgKetThuc').val('');
                        $('#anhHuong').val('Không ảnh hưởng');
                        $('#thongTinDieuHanh').val('');
                        $('#doiTacXlNgoai').val('${actionText}');
                        $('#bienPhapXl').val('${actionText}');
                        
                        // Bỏ tick ô Gửi Email
                        $('#guiEmail').prop('checked', false);

                        // 2. Ép jQWidgets nhận lệnh
                        setTimeout(() => {
                            if($('#mangSuCo').length) $('#mangSuCo').jqxDropDownList('checkItem', 'TRUYEN_DAN');
                            if($('#nguyenNhanSc').length) $('#nguyenNhanSc').jqxDropDownList('selectItem', 'Lỗi do các đơn vị khác');
                            if($('#donViWo').length) $('#donViWo').jqxDropDownList('checkItem', 'TT_NET_MBF');
                            if($('#mucDo').length) $('#mucDo').jqxDropDownList('selectItem', 'Nhỏ');
                            if($('#vendor').length) $('#vendor').jqxComboBox('selectItem', '${vendorValue}');

                            // 3. Dropdown thuần
                            $('#loaiSuCoTruyenDan').val('Cáp').trigger('change');
                            $('#phongBanXl').val('Đài VHKT miền Nam').trigger('change');

                            // 4. Chọn Người xử lý (Cần chờ Phòng load)
                            setTimeout(() => {
                                if($('#nguoiXuLy').length) $('#nguoiXuLy').jqxComboBox('checkItem', 'hoa.chau10');
                                if($('#nguyenNhanSc').length) $('#nguyenNhanSc').jqxComboBox('selectItem', 'Lỗi do các đơn vị khác');
                            }, 1000);
                        }, 200);

                    } catch(err) {
                        console.error('Lỗi khi Injection:', err);
                    }
                `;

                executeScript(injectionCode);

                setTimeout(() => { btn.innerText = ' đã bị gàchipper'; }, 500);
                setTimeout(() => { btn.innerText = ' đã bị gàchipper'; }, 3500);

            } catch (error) {
                console.error(error);
                btn.innerText = ' Lỗi! F5 thử lại';
            }
        };
    }
})();
