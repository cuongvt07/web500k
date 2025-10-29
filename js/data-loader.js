// moved to js/data-loader.js
// Data Loader - Load dữ liệu sản phẩm từ JSON và render
class DataLoader {
    constructor(dataFile = 'data/data-main.json') {
        this.dataFile = dataFile;
        this.data = null;
    }

    // Load dữ liệu từ file JSON
    async load() {
        try {
            const response = await fetch(this.dataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Error loading data:', error);
            return null;
        }
    }

    // Format tiền tệ VND
    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    }

    // Render products từ data, hỗ trợ filter và phân trang (nếu không filter)
    // options: { filter: (product) => boolean, page, itemsPerPage }
    renderProducts(containerId = 'products-container', options = {}) {
        if (!this.data || !this.data.products) {
            console.error('No products data found');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        let products = this.data.products;
        if (options.filter) {
            products = products.filter(options.filter);
        }

        // Nếu có filter thì không phân trang, hiển thị hết (dùng cho từng section)
        let page = options.page || 1;
        let itemsPerPage = options.itemsPerPage || 9;
        let totalPages = 1;
        let productsToShow = products;
        if (!options.filter) {
            totalPages = Math.ceil(products.length / itemsPerPage);
            const startIndex = (page - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            productsToShow = products.slice(startIndex, endIndex);
        }

        let html = '<div class="row">';

        productsToShow.forEach(product => {
            const priceHtml = product.originalPrice 
                ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span> <span class="sale-price">${this.formatPrice(product.salePrice)}</span>`
                : `<span class="sale-price">${this.formatPrice(product.salePrice)}</span>`;

            const newBadge = product.new ? '<span class="new-badge"><img src="../images/New.png" alt="NEW"></span>' : '';
            const productImage = product.image.startsWith('http') ? product.image : `../${product.image}`;
            const dataName = (product.name || '').replace(/"/g, '&quot;');

            html += `
                <div class="col-md-4">
                    <div class="product-card">
                        <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                            <div class="product-image-wrapper">
                                ${newBadge}
                                <img src="${productImage}" alt="${product.name}" class="product-image" style="cursor: pointer;">
                            </div>
                        </a>
                        <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                            <div class="product-name" style="cursor: pointer;">${product.name}</div>
                        </a>
                        <div class="product-price">Giá: ${priceHtml}</div>

                        <!-- ACTIONS: Thêm vào giỏ & Mua ngay -->
                        <div class="product-actions" style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap;">
                            <button class="btn-add" 
                                data-id="${product.id}" 
                                data-name="${dataName}" 
                                data-price="${product.salePrice}" 
                                data-image="${productImage}"
                                onclick="addToCartFromButton(this)"
                                type="button">Thêm vào giỏ hàng</button>
                            <button class="btn-buy-now" 
                                data-id="${product.id}" 
                                data-name="${dataName}" 
                                data-price="${product.salePrice}" 
                                data-image="${productImage}"
                                onclick="buyNowFromButton(this)"
                                type="button">Mua ngay</button>
                        </div>
                    </div>
                </div>
            `;
        });

        html += '</div>';

        // Add pagination nếu không filter và có nhiều trang
        if (!options.filter && totalPages > 1) {
            html += '<div class="pagination-container" style="display: flex; justify-content: center; align-items: center; gap: 10px; margin-top: 40px; flex-wrap: wrap;">';
            // Previous button
            if (page > 1) {
                html += `<button class="pagination-btn" data-page="${page - 1}" style="padding: 8px 16px; background: #d4a574; border: 1px solid #333; border-radius: 5px; font-family: 'Markazi Text', serif; font-size: 18px; cursor: pointer; transition: background 0.2s;">‹ Trước</button>`;
            }
            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const isActive = i === page;
                html += `<button class="pagination-btn ${isActive ? 'active' : ''}" data-page="${i}" style="padding: 8px 16px; background: ${isActive ? '#333' : '#d4a574'}; color: ${isActive ? '#fff' : '#000'}; border: 1px solid #333; border-radius: 5px; font-family: 'Markazi Text', serif; font-size: 18px; cursor: pointer; transition: background 0.2s; min-width: 40px;">${i}</button>`;
            }
            // Next button
            if (page < totalPages) {
                html += `<button class="pagination-btn" data-page="${page + 1}" style="padding: 8px 16px; background: #d4a574; border: 1px solid #333; border-radius: 5px; font-family: 'Markazi Text', serif; font-size: 18px; cursor: pointer; transition: background 0.2s;">Sau ›</button>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;

        // Add click events to pagination buttons nếu có
        if (!options.filter) {
            container.querySelectorAll('.pagination-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const newPage = parseInt(btn.getAttribute('data-page'));
                    this.renderProducts(containerId, { page: newPage, itemsPerPage });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                });
            });
        }
    }

    // Render cart items
    renderCart(containerId = 'cart-container') {
        if (!this.data || !this.data.items) {
            console.error('No cart data found');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        // State for cart
        let items = JSON.parse(JSON.stringify(this.data.items));
        let paymentMethod = 'cod';

        function updateCart() {
            let subtotal = 0;
            items.forEach(item => {
                item.total = item.price * item.quantity;
                subtotal += item.total;
            });
            let shipping = 50000;
            let total = subtotal + shipping;

            let html = `<div class="row" style="justify-content: center;">
                <div class="col-lg-6 col-md-8 col-12">
                    <div class="cart-items">`;
            items.forEach((item, idx) => {
                const itemImage = item.image.startsWith('http') ? item.image : `../${item.image}`;
                html += `
                    <div class="cart-item" style="background: #c4c4c4ff; border-radius: 10px; padding: 16px 20px; display: flex; align-items: center; margin-bottom: 18px; gap: 16px;">
                        <img src="${itemImage}" alt="${item.name}" class="cart-item-image" style="width: 90px; height: 90px; object-fit: contain; background: #fff; border-radius: 8px; flex-shrink: 0;">
                        <div style="flex: 1;">
                            <div style="font-size: 20px; font-family: 'Markazi Text', serif; font-weight: 700; color: #222; margin-bottom: 6px;">${item.name}</div>
                            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 6px;">
                                <button class="btn-qty" data-idx="${idx}" data-action="dec" style="background: none; border: none; color: #F0473C; font-size: 24px; font-weight: bold;">-</button>
                                <span style="color: #F0473C; font-size: 20px; font-weight: bold; min-width: 32px; text-align: center;">${item.quantity}</span>
                                <button class="btn-qty" data-idx="${idx}" data-action="inc" style="background: none; border: none; color: #F0473C; font-size: 24px; font-weight: bold;">+</button>
                                <span style="font-size: 18px; color: #222; margin-left: 16px;">x</span>
                                <span style="font-size: 20px; color: #F0473C; font-weight: bold;">${this.formatPrice(item.price)}</span>
                            </div>
                            <div style="font-size: 18px; color: #222;">Tổng: <span style="color: #F0473C; font-weight: bold;">${this.formatPrice(item.total)}</span></div>
                        </div>
                    </div>`;
            });
            html += `</div>
                </div>
                <div class="col-lg-5 col-md-8 col-12">
                    <div style="background: #fff; border-radius: 16px; padding: 32px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 2px solid #4A8C45; margin-bottom: 24px;">
                        <div style="font-size: 24px; font-family: 'Markazi Text', serif; font-weight: 700; color: #222; margin-bottom: 16px;">Thành tiền:</div>
                        <div style="font-size: 20px; font-family: 'Markazi Text', serif; color: #222; margin-bottom: 8px;">Giá trị đơn hàng: ${this.formatPrice(subtotal)}</div>
                        <div style="font-size: 20px; font-family: 'Markazi Text', serif; color: #222; margin-bottom: 8px;">Giảm giá: 0</div>
                        <div style="font-size: 22px; font-family: 'Markazi Text', serif; font-weight: 700; color: #F0473C; margin-bottom: 16px;">Tổng thanh toán: ${this.formatPrice(total)}</div>
                        <div style="margin-bottom: 16px;">
                            <label style="font-size: 18px; font-family: 'Markazi Text', serif; font-weight: 700; color: #222;">Chọn phương thức thanh toán:</label>
                            <div style="margin-top: 8px;">
                                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <input type="radio" name="payment" value="cod" ${paymentMethod==='cod'?'checked':''}> Thanh toán khi nhận hàng
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                                    <input type="radio" name="payment" value="momo" ${paymentMethod==='momo'?'checked':''}> QR Code MOMO
                                </label>
                                <label style="display: flex; align-items: center; gap: 8px;">
                                    <input type="radio" name="payment" value="bank" ${paymentMethod==='bank'?'checked':''}> QR Code NH
                                </label>
                            </div>
                        </div>
                        <div class="d-flex justify-content-center mt-3">
                            <button id="btn-checkout-inner" class="btn btn-dark btn-lg" style="font-family: 'Markazi Text', serif; font-size: 24px; font-weight: 700;">Thanh toán ngay</button>
                        </div>
                    </div>
                </div>
            </div>`;

            container.innerHTML = html;

            // Gắn sự kiện tăng/giảm số lượng
            container.querySelectorAll('.btn-qty').forEach(btn => {
                btn.onclick = (e) => {
                    const idx = parseInt(btn.getAttribute('data-idx'));
                    const action = btn.getAttribute('data-action');
                    if (action === 'inc') items[idx].quantity++;
                    if (action === 'dec' && items[idx].quantity > 1) items[idx].quantity--;
                    updateCart();
                };
            });
            // Gắn sự kiện chọn phương thức thanh toán
            container.querySelectorAll('input[name="payment"]').forEach(radio => {
                radio.onchange = (e) => {
                    paymentMethod = radio.value;
                };
            });
            // Nút thanh toán trong khối thành tiền
            const btnCheckoutInner = container.querySelector('#btn-checkout-inner');
            if (btnCheckoutInner) {
                    const self = this;
                    btnCheckoutInner.onclick = function() {
                        if (paymentMethod === 'momo' || paymentMethod === 'bank') {
                            // QR popup
                            const BANK_ID = paymentMethod === 'momo' ? '970422' : '970436'; // demo: MOMO/VCB
                            const BANK_ACCOUNT_NO = paymentMethod === 'momo' ? '999999999' : '123456789';
                            const BANK_ACCOUNT_NAME = paymentMethod === 'momo' ? 'MOMO DEMO' : 'NGUYEN VAN A';
                            const TEMPLATE = 'compact';
                            const AMOUNT = subtotal; // Lấy giá trị đơn hàng
                            const DESCRIPTION = encodeURIComponent('Thanh toan don hang SuSu Toys');
                            const qrCode = `https://img.vietqr.io/image/${BANK_ID}-${BANK_ACCOUNT_NO}-${TEMPLATE}.png?amount=${AMOUNT}&addInfo=${DESCRIPTION}&accountName=${BANK_ACCOUNT_NAME}`;

                            let popup = document.createElement('div');
                            popup.innerHTML = `
                                <div id="qr-modal-bg" style="position:fixed;top:0;left:0;width:100vw;height:100vh;background:rgba(0,0,0,0.4);z-index:9999;display:flex;align-items:center;justify-content:center;">
                                    <div style="background:#fff;border-radius:16px;padding:32px;min-width:340px;max-width:90vw;box-shadow:0 2px 16px rgba(0,0,0,0.2);position:relative;">
                                        <div style="font-size:28px;font-family:'Markazi Text',serif;font-weight:700;color:#222;margin-bottom:16px;text-align:center;">Quét mã QR để thanh toán</div>
                                        <img src="${qrCode}" alt="QR Code" style="width:220px;height:220px;display:block;margin:0 auto 16px auto;border-radius:8px;">
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Số tiền: <span style="color:#F0473C;font-weight:bold;">${self.formatPrice(subtotal)}</span></div>
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Tên tài khoản: <span style="font-weight:bold;">${BANK_ACCOUNT_NAME}</span></div>
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Nội dung: <span style="font-weight:bold;">Thanh toan don hang SuSu Toys</span></div>
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Phí ship: <span style="font-weight:bold;">50.000 ₫</span></div>
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Giảm giá: <span style="font-weight:bold;">0 ₫</span></div>
                                        <div style="font-size:18px;color:#222;margin-bottom:8px;text-align:center;">Tổng thanh toán: <span style="font-weight:bold;">${self.formatPrice(subtotal + 50000)}</span></div>
                                        <div id="qr-timer" style="font-size:20px;color:#F0473C;font-weight:bold;text-align:center;margin-top:16px;">Đang xử lý... 10s</div>
                                        <button id="qr-close" style="position:absolute;top:12px;right:12px;background:none;border:none;font-size:28px;color:#888;cursor:pointer;">&times;</button>
                                    </div>
                                </div>
                            `;
                            document.body.appendChild(popup);
                            let timer = 10;
                            const timerEl = popup.querySelector('#qr-timer');
                            const interval = setInterval(() => {
                                timer--;
                                timerEl.textContent = `Đang xử lý... ${timer}s`;
                                if (timer === 0) {
                                    clearInterval(interval);
                                    document.body.removeChild(popup);
                                    window.location.href = 'index.html';
                                }
                            }, 1000);
                            popup.querySelector('#qr-close').onclick = function() {
                                clearInterval(interval);
                                document.body.removeChild(popup);
                            };
                        } else {
                            if (typeof showToast === 'function') {
                                showToast('Đặt hàng thành công! Cảm ơn bạn đã mua hàng.', 'success');
                                setTimeout(() => window.location.href = 'index.html', 1500);
                            } else {
                                alert('Cảm ơn bạn đã đặt hàng!');
                                window.location.href = 'index.html';
                            }
                        }
                    };
            }
        }
        updateCart = updateCart.bind(this);
        updateCart();
    }

    // Render login form
    renderLoginForm(containerId = 'login-container') {
        if (!this.data || !this.data.formFields) {
            console.error('No login form data found');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        let html = '<form class="login-form">';

        this.data.formFields.forEach(field => {
            html += `
                <div class="form-group mb-3">
                    <label for="${field.name}" class="form-label">${field.label}</label>
                    <input type="${field.type}" class="form-control" id="${field.name}" 
                           placeholder="${field.placeholder}" ${field.required ? 'required' : ''}>
                </div>
            `;
        });

        html += '<div class="button-group">';
        this.data.buttons.forEach(btn => {
            if (btn.type === 'link') {
                html += `<a href="#" class="btn btn-link">${btn.text}</a>`;
            } else {
                html += `<button type="button" class="btn btn-${btn.type === 'primary' ? 'primary' : 'secondary'}">${btn.text}</button>`;
            }
        });
        html += '</div>';

        html += '</form>';
        container.innerHTML = html;
    }

    // Get page title
    getTitle() {
        return this.data ? this.data.title : 'Page';
    }

    // Get page type
    getPageType() {
        return this.data ? this.data.page : 'unknown';
    }
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataLoader;
}

/* ====== GLOBAL CART HELPERS (used by product action buttons) ====== */
window.addToCartFromButton = function(btn) {
    try {
        const id = Number(btn.dataset.id);
        const name = btn.dataset.name || '';
        const price = Number(btn.dataset.price) || 0;
        const image = btn.dataset.image || '';

        const KEY = 'susu_cart';
        const raw = localStorage.getItem(KEY);
        const cart = raw ? JSON.parse(raw) : [];

        const existing = cart.find(item => item.id === id);
        if (existing) {
            existing.quantity = (existing.quantity || 1) + 1;
        } else {
            cart.push({ id, name, price, quantity: 1, image });
        }
        localStorage.setItem(KEY, JSON.stringify(cart));

        if (typeof showToast === 'function') {
            showToast('Đã thêm vào giỏ hàng', 'success');
        }
    } catch (e) {
        console.error('addToCartFromButton error', e);
    }
};

window.buyNowFromButton = function(btn) {
    // Thêm vào giỏ rồi chuyển đến trang cart
    addToCartFromButton(btn);
    // Redirect to cart page
    window.location.href = 'cart.html';
};
