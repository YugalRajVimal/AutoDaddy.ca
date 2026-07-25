/**
 * Smart City GIS Portal - Main JavaScript
 * Bootstrap 5.3 Based
 */

// ===== Initialize AOS (Animate On Scroll) =====
document.addEventListener('DOMContentLoaded', function() {
    if (typeof AOS !== 'undefined') {
        AOS.init({
            duration: 800,
            easing: 'ease-in-out',
            once: true,
            offset: 100
        });
    }
});

// ===== Navbar Scroll Effect =====
window.addEventListener('scroll', function() {
    const navbar = document.getElementById('mainNav');
    if (navbar) {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
});

// ===== Smooth Scroll for Anchor Links =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== Form Validation =====
(function() {
    'use strict';
    const forms = document.querySelectorAll('.needs-validation');
    Array.prototype.slice.call(forms).forEach(function(form) {
        form.addEventListener('submit', function(event) {
            if (!form.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            form.classList.add('was-validated');
        }, false);
    });
})();

// ===== Toastr Notification Helper =====
const showNotification = (type, message, title = '') => {
    if (typeof toastr !== 'undefined') {
        toastr.options = {
            "closeButton": true,
            "progressBar": true,
            "positionClass": "toast-top-right",
            "timeOut": "3000"
        };
        toastr[type](message, title);
    } else {
        console.log(`${type.toUpperCase()}: ${message}`);
    }
};

// ===== Loading Spinner =====
const showLoading = () => {
    const loadingHTML = `
        <div id="globalLoading" class="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
             style="background: rgba(0,0,0,0.7); z-index: 9999;">
            <div class="loading-spinner"></div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', loadingHTML);
};

const hideLoading = () => {
    const loading = document.getElementById('globalLoading');
    if (loading) {
        loading.remove();
    }
};

// ===== Sidebar Toggle for Mobile =====
const toggleSidebar = () => {
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
        sidebar.classList.toggle('show');
    }
};

// Mobile menu toggle button (add to your dashboard pages)
document.addEventListener('DOMContentLoaded', function() {
    const mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleSidebar);
    }
});

// ===== API Helper Functions =====
const API = {
    baseURL: '/api',
    
    // GET Request
    get: async function(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API GET Error:', error);
            throw error;
        }
    },
    
    // POST Request
    post: async function(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API POST Error:', error);
            throw error;
        }
    },
    
    // PUT Request
    put: async function(endpoint, data) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(data)
            });
            return await response.json();
        } catch (error) {
            console.error('API PUT Error:', error);
            throw error;
        }
    },
    
    // DELETE Request
    delete: async function(endpoint) {
        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('API DELETE Error:', error);
            throw error;
        }
    }
};

// ===== Local Storage Helper =====
const Storage = {
    set: function(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    },
    
    get: function(key) {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    },
    
    remove: function(key) {
        localStorage.removeItem(key);
    },
    
    clear: function() {
        localStorage.clear();
    }
};

// ===== Date Formatter =====
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    if (format === 'YYYY-MM-DD') {
        return `${year}-${month}-${day}`;
    } else if (format === 'DD/MM/YYYY') {
        return `${day}/${month}/${year}`;
    }
    return d.toLocaleDateString();
};

// ===== File Size Formatter =====
const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

// ===== Number Formatter =====
const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// ===== Copy to Clipboard =====
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('success', 'Copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
    });
};

// ===== Debounce Function =====
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// ===== Search Handler with Debounce =====
const searchHandler = debounce(function(searchTerm) {
    console.log('Searching for:', searchTerm);
    // Implement your search logic here
}, 500);

// ===== Image Preview on Upload =====
const previewImage = (input, previewElement) => {
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function(e) {
            previewElement.src = e.target.result;
        };
        reader.readAsDataURL(input.files[0]);
    }
};

// ===== Confirm Dialog =====
const confirmDialog = (message, callback) => {
    if (confirm(message)) {
        callback();
    }
};

// ===== Modal Helper =====
const Modal = {
    show: function(modalId) {
        const modal = new bootstrap.Modal(document.getElementById(modalId));
        modal.show();
    },
    
    hide: function(modalId) {
        const modal = bootstrap.Modal.getInstance(document.getElementById(modalId));
        if (modal) {
            modal.hide();
        }
    }
};

// ===== Table Search Filter =====
const filterTable = (inputId, tableId) => {
    const input = document.getElementById(inputId);
    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    
    input.addEventListener('keyup', function() {
        const filter = this.value.toUpperCase();
        
        for (let i = 1; i < rows.length; i++) {
            let found = false;
            const cells = rows[i].getElementsByTagName('td');
            
            for (let j = 0; j < cells.length; j++) {
                const cell = cells[j];
                if (cell) {
                    const textValue = cell.textContent || cell.innerText;
                    if (textValue.toUpperCase().indexOf(filter) > -1) {
                        found = true;
                        break;
                    }
                }
            }
            
            rows[i].style.display = found ? '' : 'none';
        }
    });
};

// ===== Export Table to CSV =====
const exportTableToCSV = (tableId, filename = 'export.csv') => {
    const table = document.getElementById(tableId);
    let csv = [];
    const rows = table.querySelectorAll('tr');
    
    for (let i = 0; i < rows.length; i++) {
        const row = [];
        const cols = rows[i].querySelectorAll('td, th');
        
        for (let j = 0; j < cols.length; j++) {
            row.push(cols[j].innerText);
        }
        
        csv.push(row.join(','));
    }
    
    // Download CSV
    const csvFile = new Blob([csv.join('\n')], { type: 'text/csv' });
    const downloadLink = document.createElement('a');
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = 'none';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};

// ===== Print Page Section =====
const printSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    const printWindow = window.open('', '', 'height=600,width=800');
    
    printWindow.document.write('<html><head><title>Print</title>');
    printWindow.document.write('<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">');
    printWindow.document.write('</head><body>');
    printWindow.document.write(section.innerHTML);
    printWindow.document.write('</body></html>');
    
    printWindow.document.close();
    printWindow.print();
};

// ===== Generate Random Color =====
const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
};

// ===== Validate Email =====
const isValidEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

// ===== Validate Phone Number (Indian) =====
const isValidPhone = (phone) => {
    const re = /^[6-9]\d{9}$/;
    return re.test(phone);
};

// ===== Initialize Tooltips =====
document.addEventListener('DOMContentLoaded', function() {
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
});

// ===== Initialize Popovers =====
document.addEventListener('DOMContentLoaded', function() {
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });
});

// ===== Auto-dismiss Alerts =====
document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll('.alert-auto-dismiss');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
});

// ===== Back to Top Button =====
const backToTopButton = document.getElementById('backToTop');
if (backToTopButton) {
    window.addEventListener('scroll', function() {
        if (window.pageYOffset > 300) {
            backToTopButton.style.display = 'block';
        } else {
            backToTopButton.style.display = 'none';
        }
    });
    
    backToTopButton.addEventListener('click', function() {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// ===== Export Functions for Global Use =====
window.GISPortal = {
    API,
    Storage,
    showLoading,
    hideLoading,
    showNotification,
    formatDate,
    formatFileSize,
    formatNumber,
    copyToClipboard,
    debounce,
    previewImage,
    confirmDialog,
    Modal,
    filterTable,
    exportTableToCSV,
    printSection,
    getRandomColor,
    isValidEmail,
    isValidPhone
};

console.log('GIS Portal JavaScript Initialized ✓');
