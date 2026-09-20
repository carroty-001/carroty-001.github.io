let products = [];
let selectedCategory = "전체";
let selectedStatus = "all";
let selectedSort = "recommended";
let searchTerm = "";
let favorites = JSON.parse(localStorage.getItem("dangniFavorites") || "[]");

const $ = (sel) => document.querySelector(sel);

async function loadProducts() {
  try {
    const res = await fetch("products.json");
    products = await res.json();
  } catch (e) {
    products = [];
    showToast("상품 데이터를 불러오지 못했어요.");
  }
  renderCategories();
  renderProducts();
  renderRecommendations();
  updateFavoriteCount();
}

function won(n) {
  return new Intl.NumberFormat("ko-KR").format(n) + "원";
}

function statusLabel(status) {
  return {selling:"판매중", reserved:"예약중", soldout:"판매완료"}[status] || status;
}

function statusClass(status) {
  return status === "selling" ? "" : status;
}

function renderCategories() {
  const categories = ["전체", ...new Set(products.map(p => p.category))];
  $("#categories").innerHTML = categories.map(c =>
    `<button class="category-btn ${c === selectedCategory ? "active" : ""}" data-category="${escapeHtml(c)}">${escapeHtml(c)}</button>`
  ).join("");
  document.querySelectorAll(".category-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedCategory = btn.dataset.category;
      renderCategories();
      renderProducts();
    });
  });
}

function filteredProducts() {
  let list = products.filter(p => {
    const cat = selectedCategory === "전체" || p.category === selectedCategory;
    const stat = selectedStatus === "all" || p.status === selectedStatus;
    const haystack = [p.name, p.category, p.description, ...(p.tags || [])].join(" ").toLowerCase();
    return cat && stat && haystack.includes(searchTerm.toLowerCase());
  });

  if (selectedSort === "newest") list.sort((a,b) => b.date.localeCompare(a.date));
  if (selectedSort === "priceAsc") list.sort((a,b) => a.price - b.price);
  if (selectedSort === "priceDesc") list.sort((a,b) => b.price - a.price);
  if (selectedSort === "name") list.sort((a,b) => a.name.localeCompare(b.name, "ko"));
  return list;
}

function renderProducts() {
  const list = filteredProducts();
  $("#resultCount").textContent = `${list.length}개 상품`;
  $("#productHeading").textContent = searchTerm ? `"${searchTerm}" 검색 결과` : (selectedCategory === "전체" ? "추천 상품" : selectedCategory);

  $("#products").innerHTML = list.map(productCard).join("");
  $("#emptyState").classList.toggle("hidden", list.length !== 0);

  document.querySelectorAll(".product-card").forEach(card => {
    card.addEventListener("click", e => {
      if (e.target.closest(".heart")) return;
      openModal(card.dataset.id);
    });
  });

  document.querySelectorAll(".heart").forEach(btn => {
    btn.addEventListener("click", e => {
      e.stopPropagation();
      toggleFavorite(btn.dataset.id);
    });
  });
}

function imageMarkup(p, className = "") {
  const src = p.image || (p.images && p.images[0]);
  if (!src) return `<span class="${className} image-fallback">${escapeHtml(p.emoji || "🥕")}</span>`;
  return `<img class="${className}" src="${escapeHtml(src)}" alt="${escapeHtml(p.name)}" loading="lazy" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'"><span class="image-fallback" style="display:none">${escapeHtml(p.emoji || "🥕")}</span>`;
}

function productCard(p) {
  const faved = favorites.includes(p.id);
  const sold = p.status === "soldout";
  return `
    <article class="product-card" data-id="${escapeHtml(p.id)}">
      <div class="product-image">
        ${imageMarkup(p)}
        <button class="heart ${faved ? "faved" : ""}" data-id="${escapeHtml(p.id)}" aria-label="찜하기">${faved ? "♥" : "♡"}</button>
        ${sold ? `<div class="sold-overlay">SOLD OUT</div>` : ""}
      </div>
      <div class="product-info">
        <span class="status-badge ${statusClass(p.status)}">${statusLabel(p.status)}</span>
        <div class="product-name">${escapeHtml(p.name)}</div>
        <div class="product-price">${won(p.price)}</div>
        <div class="tags">${(p.tags || []).slice(0,3).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function renderRecommendations() {
  const list = products.filter(p => p.status !== "soldout").slice(0,4);
  $("#miniRecommendations").innerHTML = list.map(p => `
    <div class="mini-item" data-id="${escapeHtml(p.id)}">
      <div class="mini-image">${imageMarkup(p)}</div>
      <div><strong>${escapeHtml(p.name)}</strong><span>${won(p.price)}</span></div>
    </div>
  `).join("");
  document.querySelectorAll(".mini-item").forEach(x => x.addEventListener("click", () => openModal(x.dataset.id)));
}

function renderModalImages(p) {
  const gallery = Array.isArray(p.images) && p.images.length ? p.images : (p.image ? [p.image] : []);
  const container = $("#modalImage");
  const thumbs = $("#modalThumbs");
  container.innerHTML = "";
  thumbs.innerHTML = "";

  const fallback = () => {
    container.innerHTML = `<span class="image-fallback large">${escapeHtml(p.emoji || "🥕")}</span>`;
  };

  if (!gallery.length) {
    fallback();
    return;
  }

  const show = (src) => {
    container.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='grid'"><span class="image-fallback large" style="display:none">${escapeHtml(p.emoji || "🥕")}</span>`;
  };

  gallery.forEach((src, i) => {
    const thumb = document.createElement("button");
    thumb.className = "modal-thumb" + (i === 0 ? " active" : "");
    thumb.innerHTML = `<img src="${escapeHtml(src)}" alt="${escapeHtml(p.name)} ${i+1}" onerror="this.style.display='none'; this.textContent='🥕'">`;
    thumb.addEventListener("click", () => {
      document.querySelectorAll(".modal-thumb").forEach(t => t.classList.remove("active"));
      thumb.classList.add("active");
      show(src);
    });
    thumbs.appendChild(thumb);
  });
  show(gallery[0]);
}

function openModal(id) {
  const p = products.find(x => x.id === id);
  if (!p) return;
  renderModalImages(p);
  $("#modalName").textContent = p.name;
  $("#modalPrice").textContent = won(p.price);
  $("#modalStatus").textContent = statusLabel(p.status);
  $("#modalStatus").className = "status-badge " + statusClass(p.status);
  $("#modalTags").innerHTML = (p.tags || []).map(t => `<span class="tag">#${escapeHtml(t)}</span>`).join("");
  $("#modalDescription").textContent = p.description || "당그니샵의 귀여운 아이템이에요 ♡";
  $("#modalId").textContent = p.id;
  $("#modalCategory").textContent = p.category;
  $("#modalDate").textContent = p.date;
  $("#modalFavorite").textContent = favorites.includes(p.id) ? "♥ 찜 취소" : "♡ 찜하기";
  $("#modalFavorite").onclick = () => {
    toggleFavorite(p.id);
    $("#modalFavorite").textContent = favorites.includes(p.id) ? "♥ 찜 취소" : "♡ 찜하기";
  };
  $("#modalContact").disabled = p.status === "soldout";
  $("#modalContact").onclick = () => {
    if (p.status !== "soldout") {
      navigator.clipboard?.writeText(`[${p.id}] ${p.name}`);
      showToast("상품번호와 이름을 복사했어요! 문의창에 붙여넣어 주세요 🥕");
      // 아래 링크를 실제 문의 링크로 바꾸면 바로 이동할 수 있어요.
    }
  };
  $("#productModal").classList.remove("hidden");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  $("#productModal").classList.add("hidden");
  document.body.style.overflow = "";
}

function toggleFavorite(id) {
  favorites = favorites.includes(id) ? favorites.filter(x => x !== id) : [...favorites, id];
  localStorage.setItem("dangniFavorites", JSON.stringify(favorites));
  updateFavoriteCount();
  renderProducts();
  const modalOpen = !$("#productModal").classList.contains("hidden");
  if (modalOpen) {
    const p = products.find(x => x.id === id);
    if (p) $("#modalFavorite").textContent = favorites.includes(id) ? "♥ 찜 취소" : "♡ 찜하기";
  }
}

function updateFavoriteCount() {
  $("#favoriteCount").textContent = favorites.length;
}

function showToast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => t.classList.remove("show"), 2500);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[ch]));
}

$("#searchInput").addEventListener("input", e => {
  searchTerm = e.target.value.trim();
  $("#clearSearch").style.display = searchTerm ? "block" : "none";
  renderProducts();
});
$("#clearSearch").addEventListener("click", () => {
  $("#searchInput").value = "";
  searchTerm = "";
  $("#clearSearch").style.display = "none";
  renderProducts();
});
$("#statusFilter").addEventListener("change", e => {
  selectedStatus = e.target.value;
  renderProducts();
});
$("#sortSelect").addEventListener("change", e => {
  selectedSort = e.target.value;
  renderProducts();
});
$("#resetFilters").addEventListener("click", () => {
  selectedCategory = "전체";
  selectedStatus = "all";
  selectedSort = "recommended";
  searchTerm = "";
  $("#searchInput").value = "";
  $("#statusFilter").value = "all";
  $("#sortSelect").value = "recommended";
  renderCategories();
  renderProducts();
});
$("#favoritesBtn").addEventListener("click", () => {
  if (!favorites.length) return showToast("아직 찜한 상품이 없어요 ♡");
  selectedCategory = "전체";
  selectedStatus = "all";
  searchTerm = "";
  const list = products.filter(p => favorites.includes(p.id));
  $("#productHeading").textContent = "♡ 찜한 상품";
  $("#resultCount").textContent = `${list.length}개 상품`;
  $("#products").innerHTML = list.map(productCard).join("");
  document.querySelectorAll(".product-card").forEach(card => card.addEventListener("click", e => {
    if (!e.target.closest(".heart")) openModal(card.dataset.id);
  }));
  document.querySelectorAll(".heart").forEach(btn => btn.addEventListener("click", e => {
    e.stopPropagation(); toggleFavorite(btn.dataset.id);
  }));
});
$("#contactBtn").addEventListener("click", () => showToast("script.js의 문의 링크를 내 카카오톡 링크로 바꿔주세요 💬"));
$("#cartBtn").addEventListener("click", () => showToast("마음에 드는 상품은 ♡ 버튼으로 찜할 수 있어요!"));
document.querySelectorAll("[data-close-modal]").forEach(x => x.addEventListener("click", closeModal));
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
$("#mobileMenuBtn").addEventListener("click", () => {
  document.querySelector(".nav").style.display = document.querySelector(".nav").style.display === "flex" ? "" : "flex";
  document.querySelector(".nav").style.position = "absolute";
  document.querySelector(".nav").style.right = "15px";
  document.querySelector(".nav").style.top = "58px";
  document.querySelector(".nav").style.height = "auto";
  document.querySelector(".nav").style.padding = "10px 16px";
  document.querySelector(".nav").style.background = "#fffdf9";
  document.querySelector(".nav").style.border = "1px solid #f2ddd0";
  document.querySelector(".nav").style.borderRadius = "15px";
});

loadProducts();
