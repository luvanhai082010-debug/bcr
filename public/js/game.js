let socket;
let currentUserId = null; 
let currentUserRole = 'player';
let cheatToolEnabled = false;

// *** ĐÃ CẬP NHẬT: URL Render chính thức ***
const SOCKET_SERVER_URL = "https://bcr-vhai.onrender.com"; 

// ===================================
// LOGIC CHUYỂN ĐỔI GIAO DIỆN & AUTH
// ===================================

function hideAllForms() {
    document.getElementById('auth-buttons').style.display = 'none';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
}

function showAuthButtons() {
    document.getElementById('auth-buttons').style.display = 'block';
    document.getElementById('register-form').style.display = 'none';
    document.getElementById('login-form').style.display = 'none';
}

function showRegistrationForm() {
    hideAllForms();
    document.getElementById('register-form').style.display = 'block';
    document.getElementById('reg-message').textContent = '';
}

function showLoginForm(role) {
    hideAllForms();
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('login-message').textContent = '';
    
    if (role === 'Lvh210') {
        document.getElementById('login-title').textContent = 'Đăng Nhập Admin';
        document.getElementById('login-username').value = 'Lvh210';
    } else {
        document.getElementById('login-title').textContent = 'Đăng Nhập';
        document.getElementById('login-username').value = '';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Xử lý Form Đăng Ký
    document.getElementById('register-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const confirmPassword = document.getElementById('reg-confirm-password').value;
        const messageEl = document.getElementById('reg-message');

        if (password !== confirmPassword) {
            return messageEl.textContent = 'Lỗi: Mật khẩu xác nhận không khớp!';
        }
        
        const response = await fetch(`${SOCKET_SERVER_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            messageEl.textContent = `Đăng ký thành công! Mã xác minh của bạn là: ${data.code}. Vui lòng đăng nhập.`;
            setTimeout(() => showLoginForm(), 3000); 
        } else {
            messageEl.textContent = `Lỗi: ${data.message}`;
        }
    });

    // Xử lý Form Đăng Nhập
    document.getElementById('login-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        
        const response = await fetch(`${SOCKET_SERVER_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('userToken', data.token);
            localStorage.setItem('userId', data.userId);
            
            document.getElementById('auth-screen').style.display = 'none';
            document.getElementById('loading-screen').style.display = 'flex';
            
            startLoading(); 
        } else {
            document.getElementById('login-message').textContent = `Lỗi: ${data.message}`;
        }
    });

    // Khởi tạo ban đầu
    document.getElementById('auth-screen').style.display = 'flex';
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'none';
    showAuthButtons();
});

// ===================================
// LOGIC GAME VÀ SOCKET.IO
// ===================================

function initGame() {
    currentUserId = localStorage.getItem('userId'); 

    socket = io(SOCKET_SERVER_URL);
    
    // Gửi yêu cầu lấy thông tin người dùng ngay sau khi kết nối
    socket.emit('send_user_info', { userId: currentUserId });

    // Lắng nghe thông tin người dùng
    socket.on('user_info', (data) => {
        currentUserId = data.userId;
        currentUserRole = data.role;
        cheatToolEnabled = data.cheat_enabled;
        document.getElementById('user-balance').textContent = formatCurrency(data.balance);
        
        // Hiển thị nút Admin/Tool
        document.getElementById('admin-panel-btn').style.display = (currentUserRole === 'admin') ? 'block' : 'none';
        
        // Thêm/hiển thị nút Tool Soi Bài nếu người dùng có quyền (không phải admin)
        let toolBtn = document.getElementById('cheat-tool-btn');
        if (!toolBtn && currentUserRole === 'player') {
             toolBtn = document.createElement('button');
             toolBtn.id = 'cheat-tool-btn';
             toolBtn.textContent = 'Chạy Tool Soi Bài';
             toolBtn.onclick = runCheatTool;
             document.getElementById('betting-area').appendChild(toolBtn);
        }
        if (toolBtn) toolBtn.style.display = (cheatToolEnabled) ? 'block' : 'none';
    });

    // Lắng nghe cập nhật số dư từ server
    socket.on('balance_update', (data) => {
        if (data.userId === currentUserId) {
            document.getElementById('user-balance').textContent = formatCurrency(data.balance);
        }
    });
    
    // Lắng nghe kết quả Tool Soi Bài
    socket.on('cheat_tool_result', (data) => {
        const resultDiv = document.getElementById('cheat-tool-display');
        resultDiv.style.color = data.success ? '#32cd32' : 'yellow';
        resultDiv.textContent = data.message;
    });

    // Thiết lập sự kiện cho nút điểm danh
    document.getElementById('checkin-btn').addEventListener('click', () => {
        socket.emit('check_in', { userId: currentUserId });
    });
}

async function requestGrant() {
    const amount = 100000; // Yêu cầu 100k
    const response = await fetch(`${SOCKET_SERVER_URL}/request-grant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUserId, amount })
    });
    const data = await response.json();
    alert(data.message);
}

function placeBet(type, amount) {
    if (!socket || amount <= 0) return alert("Vui lòng nhập số tiền cược hợp lệ.");
    
    const betData = { userId: currentUserId, bets: { [type]: amount } };
    socket.emit('place_bet', betData);
    
    alert(`Đã đặt cược ${formatCurrency(amount)} vào cửa ${type}. Chờ kết quả...`);
}

function runCheatTool() {
    if (!cheatToolEnabled) {
        return alert("Bạn chưa được cấp quyền Tool Soi Bài. Hãy yêu cầu Admin.");
    }
    document.getElementById('cheat-tool-display').textContent = 'ROBOT: Đang phân tích...';
    socket.emit('run_cheat_tool', { userId: currentUserId });
}

function logout() {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userId');
    window.location.reload(); 
}

function startLoading() {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingBar = document.getElementById('loading-bar');
    const gameContainer = document.getElementById('game-container');
    
    let currentProgress = 0;
    const totalSteps = 100;
    const intervalTime = 50; 

    function updateLoading() {
        if (currentProgress >= totalSteps) {
            clearInterval(loadingInterval);
            
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                gameContainer.style.display = 'block';
                initGame(); 
            }, 500); 
            return;
        }

        currentProgress += 1; 
        
        loadingBar.style.width = currentProgress + '%';
        document.getElementById('loading-percentage').textContent = currentProgress + '%';
    }

    const loadingInterval = setInterval(updateLoading, intervalTime);
  }
