const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const logic = require('./GameLogic'); 
const adminRouter = require('./AdminRouter');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

const io = new Server(server, {
    cors: {
        origin: "*", 
        methods: ["GET", "POST"]
    }
});

app.use(express.json()); 
app.use('/admin', adminRouter);

// ===================================
// API XÁC THỰC (AUTHENTICATION API)
// ===================================

app.post('/register', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Vui lòng điền đủ thông tin.' });
    }
    if (logic.MOCK_USERS[username]) {
        return res.status(409).json({ success: false, message: 'Tên đăng nhập đã tồn tại.' });
    }
    
    const passwordHash = logic.hashPassword(password);
    const verificationCode = logic.generateVerificationCode();

    logic.MOCK_USERS[username] = {
        password_hash: passwordHash,
        balance: 50000,
        last_checkin_date: null,
        verification_code: verificationCode,
        role: 'player',
        cheat_tool_enabled: false
    };
    
    res.json({ success: true, message: 'Đăng ký thành công. Mã xác minh của bạn:', code: verificationCode });
});


app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const user = logic.MOCK_USERS[username];

    if (!user || user.password_hash !== logic.hashPassword(password)) {
        return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu.' });
    }

    const token = `JWT_${username}_${Date.now()}`; 
    
    res.json({ 
        success: true, 
        token: token, 
        userId: username, 
        role: user.role 
    });
});

// API YÊU CẦU CẤP XU (Người dùng gọi)
app.post('/request-grant', (req, res) => {
    const { userId, amount } = req.body;
    const success = logic.requestGrant(userId, parseFloat(amount));
    if (success) {
        res.json({ success: true, message: 'Yêu cầu cấp xu đã được gửi đến Admin.' });
    } else {
        res.status(400).json({ success: false, message: 'Gửi yêu cầu thất bại.' });
    }
});


// ===================================
// SOCKET.IO (Giao tiếp Game)
// ===================================
io.on('connection', (socket) => {
    socket.on('send_user_info', (data) => {
        const user = logic.MOCK_USERS[data.userId];
        if (user) {
            socket.emit('user_info', { userId: data.userId, balance: user.balance, role: user.role, cheat_enabled: user.cheat_tool_enabled });
        }
    });

    socket.on('place_bet', (data) => {
        const result = logic.startGameRound(data.bets);
        io.emit('game_result', result);
    });

    socket.on('check_in', (data) => {
        const checkinResult = logic.grantDailyCheckin(data.userId);
        socket.emit('checkin_status', checkinResult);
        if (checkinResult.success) {
            io.emit('balance_update', { userId: data.userId, balance: checkinResult.balance }); 
        }
    });

    socket.on('run_cheat_tool', (data) => {
        const mockGameState = { card1: 'A', card2: '5', card3: 'K', card4: '3' }; 
        const predictionResult = logic.getCheatPrediction(data.userId, mockGameState);
        socket.emit('cheat_tool_result', predictionResult);
    });
});

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
