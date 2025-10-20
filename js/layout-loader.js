// Layout Loader - Tải header và footer từ component files
document.addEventListener('DOMContentLoaded', function() {
    // Load header
    fetch('../components/header.html')
        .then(response => response.text())
        .then(html => {
            const headerContainer = document.getElementById('header-container');
            if (headerContainer) {
                headerContainer.innerHTML = html;
                // After injecting header, update auth state in nav
                try {
                    const CURRENT_USER_KEY = 'susu_current_user';
                    const userRaw = localStorage.getItem(CURRENT_USER_KEY);
                    const user = userRaw ? JSON.parse(userRaw) : null;
                    const loginLink = headerContainer.querySelector('a[href="login.html"]');
                    if (loginLink) {
                        if (user) {
                            loginLink.textContent = 'Đăng xuất';
                            loginLink.href = '#';
                            loginLink.addEventListener('click', (e) => {
                                e.preventDefault();
                                localStorage.removeItem(CURRENT_USER_KEY);
                                // Optional: feedback
                                alert('Bạn đã đăng xuất.');
                                // Refresh to update UI on current page
                                window.location.href = 'index.html';
                            });
                        } else {
                            loginLink.textContent = 'Đăng nhập';
                            loginLink.href = 'login.html';
                        }
                    }
                } catch (e) {
                    console.warn('Auth nav update failed:', e);
                }
            }
        })
        .catch(error => console.error('Error loading header:', error));

    // Load footer
    fetch('../components/footer.html')
        .then(response => response.text())
        .then(html => {
            const footerContainer = document.getElementById('footer-container');
            if (footerContainer) {
                footerContainer.innerHTML = html;
            }
        })
        .catch(error => console.error('Error loading footer:', error));
});
