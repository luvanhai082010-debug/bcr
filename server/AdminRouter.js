const express = require('express');
const router = express.Router();
const logic = require('./GameLogic'); 

function isAdmin(req, res, next) {
    const userId = req.headers['x-user-id'] || req.body.userId; 
    if (logic.MOCK_USERS[userId] && logic.MOCK_USERS[userId].role === 'admin') {
        req.userId = userId; 
        next();
    } else {
        res.status(403).json({ success: false, message: 'Truy cập bị từ chối. Không phải Admin.' });
    }
}

// 1. LẤY DANH SÁCH YÊU CẦU CẤP XU
router.get('/requests', isAdmin, (req, res) => {
    const pendingRequests = logic.getAllGrantRequests().filter(r => r.status === 'Pending');
    res.json({ success: true, requests: pendingRequests });
});

// 2. PHÊ DUYỆT (CẤP) XU
router.post('/grant', isAdmin, (req, res) => {
    const { requestId, amount } = req.body;
    
    if (!requestId || amount === undefined || parseFloat(amount) < 0) {
        return res.status(400).json({ success: false, message: 'Dữ liệu không hợp lệ.' });
    }

    const result = logic.approveGrant(requestId, req.userId, parseFloat(amount));
    res.json(result);
});

// 3. CẤP QUYỀN SỬ DỤNG TOOL SOI BÀI
router.post('/grant-cheat-tool', isAdmin, (req, res) => {
    const { targetUserId } = req.body;
    
    if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Thiếu ID người dùng đích.' });
    }

    const result = logic.grantCheatToolAccess(targetUserId);
    res.json(result);
});

module.exports = router;
