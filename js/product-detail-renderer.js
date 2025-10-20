// Product Detail Renderer
class ProductDetailRenderer {
    constructor(dataFile = 'data/product-detail.json') {
        this.dataFile = dataFile;
        this.data = null;
    }

    // Lấy product ID từ URL parameters
    getProductIdFromUrl() {
        const params = new URLSearchParams(window.location.search);
        return params.get('id');
    }

    // Load dữ liệu sản phẩm theo ID
    async loadById(productId) {
        try {
            const response = await fetch('data/data-main.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const mainData = await response.json();
            
            // Tìm sản phẩm có ID trùng khớp
            const product = mainData.products.find(p => p.id == productId);
            
            if (product) {
                // Load thêm chi tiết từ product-detail.json
                const detailResponse = await fetch(this.dataFile);
                const detailData = await detailResponse.json();
                
                // Merge dữ liệu
                this.data = { ...detailData, ...product };
                return this.data;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading product detail by ID:', error);
            return null;
        }
    }

    async load() {
        try {
            const response = await fetch(this.dataFile);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.data = await response.json();
            return this.data;
        } catch (error) {
            console.error('Error loading product detail:', error);
            return null;
        }
    }

    formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
            minimumFractionDigits: 0
        }).format(price);
    }

    renderProductDetail(containerId = 'product-detail-container') {
        if (!this.data) {
            console.error('No product data found');
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        const mainImagePath = this.data.mainImage.startsWith('http') ? this.data.mainImage : `../${this.data.mainImage}`;
        const galleryImages = this.data.gallery.map(img => img.startsWith('http') ? img : `../${img}`);
        
        let html = `
            <div class="product-detail-wrapper">
                <!-- Product Images -->
                <div class="product-images">
                    <div class="main-image position-relative" style="position:relative;">
                        <button class="wishlist-btn" title="Yêu thích">
                            <i class="bi bi-heart"></i>
                        </button>
                        <img id="main-product-image" src="${mainImagePath}" alt="${this.data.name}" class="img-fluid">
                    </div>
                    <div class="gallery-thumbnails">
                        ${galleryImages.map((img, idx) => `
                            <img src="${img}" alt="Gallery ${idx + 1}" class="thumbnail" onclick="document.getElementById('main-product-image').src='${img}'">
                        `).join('')}
                    </div>
                </div>

                <!-- Product Info -->
                <div class="product-info">
                    <div class="category-tag">${this.data.category || 'Lego'}</div>
                    <h1 class="product-title">${this.data.name}</h1>
                    <p class="product-meta">${this.data.category || 'Lego'}, đồ chơi thông minh</p>

                    <div class="product-price">
                        <div class="price-display">
                            <span class="price-currency">VND</span>
                            <div class="price-values">
                                ${this.data.originalPrice ? `
                                    <span class="original-price">${this.formatPrice(this.data.originalPrice).replace(/\D₫/g, '')}</span>
                                ` : ''}
                                <span class="sale-price">${this.formatPrice(this.data.salePrice).replace(/\D₫/g, '')}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Attributes -->
                    <div class="product-attributes">
                        ${this.data.attributes.map(attr => `
                            <div class="attribute-group">
                                <label class="attribute-label">${attr.name}</label>
                                <select class="attribute-select">
                                    ${attr.options.map(opt => `
                                        <option value="${opt}" ${opt === attr.defaultValue ? 'selected' : ''}>${opt}</option>
                                    `).join('')}
                                </select>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Buy Button Only -->
                    <button class="btn-action btn-buy" onclick="if(typeof showToast==='function'){showToast('Đã thêm sản phẩm vào giỏ hàng!','success');}else{alert('Đã thêm vào giỏ hàng!');}">Mua ngay</button>

                    <!-- Description Section -->
                    <div class="product-description-box">
                        <div class="description-header" onclick="this.parentElement.classList.toggle('active')">
                            <span>Mô tả</span>
                            <i class="expand-icon bi bi-chevron-down"></i>
                        </div>
                        <div class="description-content">
                            ${this.data.details ? this.data.details.content : 'Không có mô tả'}
                        </div>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML = html;
    }

    renderProductDetails(containerId = 'product-description-container') {
        // Đã render mô tả trong renderProductDetail, không cần làm gì ở đây để tránh lỗi.
        return;
    }

    renderReviews(containerId = 'reviews-container') {
        if (!this.data || !this.data.reviews_list) {
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        let html = '<div class="reviews-list">';

        this.data.reviews_list.forEach(review => {
            html += `
                <div class="review-item">
                    <div class="review-header">
                        <h5 class="review-author">${review.author}</h5>
                        <div class="review-rating">
                            ${'⭐'.repeat(review.rating)}
                        </div>
                    </div>
                    <p class="review-date">${new Date(review.date).toLocaleDateString('vi-VN')}</p>
                    <p class="review-comment">${review.comment}</p>
                </div>
            `;
        });

        html += '</div>';
        container.innerHTML = html;
    }

    renderRelatedProducts(containerId = 'related-products-container') {
        if (!this.data) {
            return;
        }

        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container with id '${containerId}' not found`);
            return;
        }

        // Nếu không có relatedProducts, tạo 3 bản sao từ sản phẩm hiện tại
        let related = Array.isArray(this.data.relatedProducts) && this.data.relatedProducts.length > 0
            ? this.data.relatedProducts.slice(0, 3)
            : [this.data, this.data, this.data];

        let html = '<div class="related-products-row">';
        related.forEach((product, idx) => {
            const relatedImage = (product.image || product.mainImage).startsWith('http') ? (product.image || product.mainImage) : `../${product.image || product.mainImage}`;
            html += `
                <div class="related-product-card">
                    <img src="${relatedImage}" alt="${product.name}" class="related-product-image">
                    <div class="related-product-actions">
                        <a href="product-detail.html?id=${product.id || ''}" class="related-btn">Xem ngay</a>
                        <button class="related-btn" onclick="if(typeof showToast==='function'){showToast('Đã thêm sản phẩm vào giỏ hàng!','success');}else{alert('Đã thêm vào giỏ hàng!');}">Thêm vào giỏ</button>
                    </div>
                    <div class="related-product-name">Tên sản phẩm: ${product.name}</div>
                    <div class="related-product-price">Giá: ${this.formatPrice(product.salePrice)}</div>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
    }
}

// Utility functions
function increaseQuantity() {
    const input = document.getElementById('quantity');
    input.value = parseInt(input.value) + 1;
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
    }
}
