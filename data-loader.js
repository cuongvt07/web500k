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

    // Render products từ data
    renderProducts(containerId = 'products-container') {
        if (!this.data || !this.data.products) {
            console.error('No products data found');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        let html = '<div class="row">';

        this.data.products.forEach(product => {
            const priceHtml = product.originalPrice 
                ? `<span class="original-price">${this.formatPrice(product.originalPrice)}</span> <span class="sale-price">${this.formatPrice(product.salePrice)}</span>`
                : `<span class="sale-price">${this.formatPrice(product.salePrice)}</span>`;

            html += `
                <div class="col-md-4">
                    <div class="product-card">
                        <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                            <img src="${product.image}" alt="${product.name}" class="product-image" style="cursor: pointer;">
                        </a>
                        <a href="product-detail.html?id=${product.id}" style="text-decoration: none; color: inherit;">
                            <div class="product-name" style="cursor: pointer;">${product.name}</div>
                        </a>
                        <div class="product-price">Giá: ${priceHtml}</div>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
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

        let html = '<div class="cart-items">';

        this.data.items.forEach(item => {
            html += `
                <div class="cart-item">
                    <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                    <div class="cart-item-info">
                        <h5>${item.name}</h5>
                        <p>Giá: ${this.formatPrice(item.price)}</p>
                        <p>Số lượng: ${item.quantity}</p>
                        <p>Tổng: ${this.formatPrice(item.total)}</p>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        html += `
            <div class="cart-summary">
                <p>Subtotal: ${this.formatPrice(this.data.subtotal)}</p>
                <p>Shipping: ${this.formatPrice(this.data.shipping)}</p>
                <h4>Total: ${this.formatPrice(this.data.total)}</h4>
            </div>
        `;

        container.innerHTML = html;
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
