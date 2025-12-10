// *** ĐÃ CẬP NHẬT: URL Render chính thức ***
const ADMIN_API_URL = "https://bcr-vhai.onrender.com/admin"; 
const adminId = localStorage.getItem('userId'); 
const adminToken = localStorage.getItem('userToken');

// Kiểm tra quyền truy cập Admin
if (!adminId || adminId !== 'Lvh210') {
    window.location.href = '../index.html';
}

// ----------------------------------------------------
// 1. XỬ LÝ YÊU CẦU CẤP XU
// ----------------------------------------------------

async function fetchRequests() {
    const listEl = document.getElementById('request-list');
    listEl.innerHTML = 'Đang tải...';

    const response = await fetch(`${ADMIN_API_URL}/requests`, {
        headers: { 'X-User-Id': adminId, 'Authorization': `Bearer ${adminToken}` }
    });
    const data = await response.json();

    if (data.success && data.requests.length > 0) {
        listEl.innerHTML = '';
        data.requests.forEach(req => {
            const reqDiv = document.createElement('div');
            reqDiv.style.border = '1px solid #777';
            reqDiv.style.padding = '10px';
            reqDiv.style.marginBottom = '10px';
            reqDiv.innerHTML = `
                <p><strong>ID: ${req.id}</strong> | User: ${req.userId} | Yêu cầu: ${req.amount} xu</p>
                <input type="number" id="amount-${req.id}" value="${req.amount}" style="width: 100px; padding: 5px;">
                <button onclick="grantCoins(${req.id}, document.getElementById('amount-${req.id}').value)">Cấp Xu</button>
            `;
            listEl.appendChild(reqDiv);
        });
    } else {
        listEl.innerHTML = '<p>Không có yêu cầu cấp xu đang chờ.</p>';
    }
}

async function grantCoins(requestId, amount) {
    if (amount <= 0) return alert('Số lượng cấp phải lớn hơn 0.');

    const response = await fetch(`${ADMIN_API_URL}/grant`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': adminId,
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({ requestId, amount: parseFloat(amount), userId: adminId }) 
    });
    const data = await response.json();

    if (data.success) {
        alert(`Đã cấp ${amount} xu cho người dùng!`);
        fetchRequests(); 
    } else {
        alert(`Lỗi cấp xu: ${data.message}`);
    }
}

// ----------------------------------------------------
// 2. LOGIC CẤP QUYỀN SỬ DỤNG TOOL SOI BÀI
// ----------------------------------------------------

async function grantCheatToolAccess() {
    const targetUserId = document.getElementById('tool-user-id').value;
    const messageEl = document.getElementById('tool-grant-message');

    if (!targetUserId) {
        return messageEl.textContent = 'Vui lòng nhập ID người dùng.';
    }

    const response = await fetch(`${ADMIN_API_URL}/grant-cheat-tool`, {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'X-User-Id': adminId
        },
        body: JSON.stringify({ targetUserId })
    });
    const data = await response.json();

    if (data.success) {
        messageEl.textContent = data.message;
        messageEl.style.color = '#32cd32';
    } else {
        messageEl.textContent = `Lỗi: ${data.message}`;
        messageEl.style.color = 'red';
    }
}

// Tải yêu cầu khi trang được tải
window.onload = fetchRequests;
