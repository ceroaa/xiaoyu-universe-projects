/**
 * 兌換系統管理器
 */

class ExchangeSystem {
    constructor() {
        this.exchangeRate = 1; // 100 積分 = 100 XYC (1:1 比例)
        this.pointsBalance = 1250;
        this.xycBalance = 5000;
        this.init();
    }

    init() {
        // 更新顯示
        this.updateDisplay();
        
        // 綁定事件
        const pointsInput = document.getElementById('points-input');
        const exchangeBtn = document.getElementById('exchange-btn');
        
        if (pointsInput) {
            pointsInput.addEventListener('input', () => this.calculateExchange());
        }
        
        if (exchangeBtn) {
            exchangeBtn.addEventListener('click', () => this.doExchange());
        }
    }

    updateDisplay() {
        const pointsBalanceEl = document.getElementById('points-balance');
        const xycBalanceEl = document.getElementById('xyc-balance');
        
        if (pointsBalanceEl) pointsBalanceEl.textContent = this.pointsBalance;
        if (xycBalanceEl) xycBalanceEl.textContent = this.xycBalance;
    }

    calculateExchange() {
        const pointsInput = document.getElementById('points-input');
        const xycOutput = document.getElementById('xyc-output');
        
        const points = parseInt(pointsInput.value) || 0;
        const xyc = Math.floor(points / this.exchangeRate);
        
        xycOutput.textContent = xyc;
    }

    doExchange() {
        const pointsInput = document.getElementById('points-input');
        const points = parseInt(pointsInput.value) || 0;
        
        if (points < 100) {
            alert('最少需要 100 積分才能兌換');
            return;
        }
        
        if (points > this.pointsBalance) {
            alert('積分不足');
            return;
        }
        
        const xyc = Math.floor(points / this.exchangeRate);
        
        // 執行兌換
        this.pointsBalance -= points;
        this.xycBalance += xyc;
        
        this.updateDisplay();
        pointsInput.value = '';
        document.getElementById('xyc-output').textContent = '0';
        
        alert(`兌換成功！獲得 ${xyc} XYC`);
    }
}

// 初始化
const exchangeSystem = new ExchangeSystem();
