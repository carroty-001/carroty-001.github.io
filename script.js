// 당그니 컨셉 상품 데이터
const products = [
  { id: 1, name: "당그니 메모패드 🥕", price: 3800, img: "https://images.unsplash.com/photo-1517842645767-c639042777db?auto=format&fit=crop&w=400&q=80" },
  { id: 2, name: "푹신한 당근 인형 키링", price: 7500, img: "https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=400&q=80" },
  { id: 3, name: "당근 젤펜 3색 세트", price: 4200, img: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80" },
  { id: 4, name: "당그니 다이어리 조각 스티커", price: 2500, img: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80" }
];

let cart = [];

// Render Products
function renderProducts() {
  const grid = document.getElementById('product-grid');
  grid.innerHTML = products.map(product => `
    <div class="product-card">
      <img src="${product.img}" alt="${product.name}" />
      <div class="product-info">
        <div class="product-title">${product.name}</div>
        <div class="product-price">${product.price.toLocaleString()}원</div>
        <button class="add-to-cart-btn" onclick="addToCart(${product.id})">장바구니 담기</button>
      </div>
    </div>
  `).join('');
}

// Cart Logic
function addToCart(productId) {
  const product = products.find(p => p.id === productId);
  cart.push(product);
  updateCart();
}

function updateCart() {
  // Count
  document.getElementById('cart-count').innerText = cart.length;

  // List
  const itemsContainer = document.getElementById('cart-items');
  if (cart.length === 0) {
    itemsContainer.innerHTML = '<li style="text-align:center; color:#999; padding:2rem 0;">장바구니에 담긴 당근이 없습니다! 🥕</li>';
  } else {
    itemsContainer.innerHTML = cart.map((item, index) => `
      <li class="cart-item">
        <span>${item.name}</span>
        <span><b>${item.price.toLocaleString()}원</b></span>
      </li>
    `).join('');
  }

  // Total
  const total = cart.reduce((sum, item) => sum + item.price, 0);
  document.getElementById('cart-total').innerText = total.toLocaleString();
}

function toggleCart() {
  const modal = document.getElementById('cart-modal');
  modal.style.display = modal.style.display === 'flex' ? 'none' : 'flex';
}

function checkout() {
  if (cart.length === 0) {
    alert('장바구니가 비어있습니다!');
    return;
  }
  alert('당그니 쇼핑몰 주문이 완료되었습니다! 🥕');
  cart = [];
  updateCart();
  toggleCart();
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  updateCart();
});