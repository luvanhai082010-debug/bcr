// MOCK DATABASE - Dữ liệu người dùng
const MOCK_USERS = {
    // Tài khoản người dùng mẫu
    'user123': { 
        password_hash: 'user123_hash', // Mật khẩu: 123
        balance: 100000, 
        last_checkin_date: null, 
        verification_code: 'A1B2C3',
        role: 'player',
        cheat_tool_enabled: false // Trạng thái cấp Tool
    },
    // Tài khoản Admin mẫu
    'Lvh210': { 
        password_hash: '1_hash', // Mật khẩu: 1
        balance: 99999999,
        last_checkin_date: null,
        verification_code: 'ADMIN',
        role: 'admin',
        cheat_tool_enabled: true 
    }
};

const MOCK_REQUESTS = []; // Lưu trữ yêu cầu cấp xu

function hashPassword(password) {
    return password + '_hash'; 
}

function generateVerificationCode() {
    return Math.random().toString(36).substring(2, 8).toUpperCase(); 
}

// Logic Baccarat (Mô phỏng)
function calculateScore(hand) {
    let total = hand.reduce((sum, card) => {
        const rank = card.rank;
        let value = (['10', 'J', 'Q', 'K'].includes(rank)) ? 0 : (rank === 'A' ? 1 : parseInt(rank));
        return sum + value;
    }, 0);
    return total % 10;
}

function startGameRound(bets) {
    const playerHand = [{ rank: '7', suit: 'H' }, { rank: '8', suit: 'C' }];
    const bankerHand = [{ rank: '2', suit: 'S' }, { rank: '5', suit: 'D' }];

    let playerScore = calculateScore(playerHand); 
    let bankerScore = calculateScore(bankerHand); 

    let winner = (playerScore === bankerScore) ? 'Tie' : (playerScore > bankerScore ? 'Player' : 'Banker');
    
    return { winner, player: playerScore, banker: bankerScore, playerHand, bankerHand };
}

function grantDailyCheckin(userId) {
    const user = MOCK_USERS[userId];
    if (!user) return { success: false };

    const today = new Date().toDateString();
    if (user.last_checkin_date === today) {
        return { success: false, message: 'Already checked in' };
    }
    
    const reward = 2000; 
    user.balance += reward;
    user.last_checkin_date = today;
    
    return { success: true, reward, balance: user.balance };
}

// Logic Cấp Xu/Yêu cầu
function requestGrant(userId, amount) {
    if (amount <= 0 || !MOCK_USERS[userId]) return false;
    
    const request = {
        id: Date.now(), userId: userId, amount: amount, status: 'Pending', timestamp: new Date().toISOString()
    };
    MOCK_REQUESTS.push(request);
    return true;
}

function approveGrant(requestId, adminId, amount) {
    const requestIndex = MOCK_REQUESTS.findIndex(r => r.id == requestId && r.status === 'Pending');
    if (requestIndex === -1) return { success: false, message: 'Yêu cầu không hợp lệ hoặc đã được xử lý.' };
    
    const request = MOCK_REQUESTS[requestIndex];
    const targetUser = MOCK_USERS[request.userId];

    const grantAmount = amount || request.amount; 
    targetUser.balance += grantAmount;

    MOCK_REQUESTS[requestIndex].status = 'Approved';
    MOCK_REQUESTS[requestIndex].granted_by = adminId;
    MOCK_REQUESTS[requestIndex].granted_amount = grantAmount;

    return { success: true, newBalance: targetUser.balance, targetUserId: targetUser.userId };
}

function getAllGrantRequests() {
    return MOCK_REQUESTS;
}

// Logic Tool Soi Bài
function grantCheatToolAccess(userId) {
    const user = MOCK_USERS[userId];
    if (user && user.role === 'player') {
        user.cheat_tool_enabled = true;
        return { success: true, message: `Đã cấp Tool Soi Bài cho ${userId}` };
    }
    return { success: false, message: 'Người dùng không tồn tại hoặc là Admin.' };
}

function getCheatPrediction(userId, currentGameState) {
    const user = MOCK_USERS[userId];
    if (!user || !user.cheat_tool_enabled) {
        return { success: false, prediction: 'ACCESS_DENIED', message: 'Bạn chưa được cấp quyền sử dụng Tool Soi Bài.' };
    }
    
    // MÔ PHỎNG KẾT QUẢ TOOL:
    const predictions = ['Banker', 'Player', 'Tie'];
    const prediction = predictions[Math.floor(Math.random() * predictions.length)];
    
    return { success: true, prediction: prediction, message: `ROBOT BÁO: Dự đoán ${prediction} thắng!` };
}

module.exports = {
    MOCK_USERS, hashPassword, generateVerificationCode,
    startGameRound, grantDailyCheckin,
    requestGrant, approveGrant, getAllGrantRequests,
    grantCheatToolAccess, getCheatPrediction
};
