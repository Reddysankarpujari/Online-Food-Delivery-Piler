// ====================== CONFIG ==========================
const API_BASE = 'https://reddys-kitchen-backend.onrender.com';

// Global data
let restaurantsData = [];
let cart = [];
let orders = [];
let currentCuisine = "all";
let currentType = "all";
let currentSearchTerm = "";

// -------------- BACKEND FUNCTIONS ------------
async function loadRestaurantsFromServer() {
  try {
    const res = await fetch(`${API_BASE}/api/restaurants`);
    if (!res.ok) throw new Error('API error');
    restaurantsData = await res.json();
    
    // Transform backend data to match frontend format
    restaurantsData = restaurantsData.map(r => ({
      id: r._id,
      name: r.name,
      cuisine: r.cuisine,
      rating: r.rating,
      time: r.time,
      image: r.image || 'https://images.pexels.com/photos/11170284/pexels-photo-11170284.jpeg',
      emoji: r.emoji || '🍛',
      menu: r.menu.map((item, index) => ({
        id: `${r._id}-m${index}`,
        name: item.name,
        desc: item.desc || '',
        price: item.price,
        veg: item.veg || false,
        rating: item.rating || 4.5,
        category: item.category || 'Main Course',
        tags: item.veg ? 'Veg' : 'Non-Veg'
      }))
    }));
    
    updateRestaurantView();
    console.log('✅ Restaurants loaded from backend:', restaurantsData.length);
  } catch (err) {
    console.error("Failed to load restaurants:", err);
    // Fallback to demo data if backend fails
    loadDemoData();
  }
}

async function loadOrdersFromServer() {
  try {
    const res = await fetch(`${API_BASE}/api/orders`);
    orders = await res.json();
    renderOrders();
  } catch (err) {
    console.error("Failed to load orders:", err);
    orders = [];
  }
}

// Fallback demo data (if backend fails)
function loadDemoData() {
  restaurantsData = [
    {
      id: "r1", name: "Reddys Kitchen", cuisine: "Indian", rating: 4.6, time: "30 mins",
      image: "https://images.pexels.com/photos/11170284/pexels-photo-11170284.jpeg",
      menu: [{id: "r1m1", name: "Chicken Biryani", price: 240, veg: false, category: "Biryani", tags: "Non-Veg"}]
    },
    {
      id: "r2", name: "Shoel Biriyani", cuisine: "Arabian", rating: 4.5, time: "32 mins", 
      image: "https://images.pexels.com/photos/11232406/pexels-photo-11232406.jpeg",
      menu: [{id: "r2m1", name: "Mandi Special", price: 420, veg: false, category: "Mandi", tags: "Non-Veg"}]
    }
  ];
  updateRestaurantView();
}

// =======================================================
document.addEventListener("DOMContentLoaded", async () => {
  // DOM elements
  const views = document.querySelectorAll(".view");
  const navLinks = document.querySelectorAll(".nav-link");
  const goRestaurantsButtons = document.querySelectorAll(".go-restaurants");
  const mainCategoryCards = document.querySelectorAll(".main-category-card");
  const restaurantListEl = document.getElementById("restaurant-list");
  const searchInput = document.getElementById("search-input");
  const searchBtn = document.getElementById("search-btn");
  const cartEmptyEl = document.getElementById("cart-empty");
  const cartContentEl = document.getElementById("cart-content");
  const cartItemsEl = document.getElementById("cart-items");
  const cartSubtotalEl = document.getElementById("cart-subtotal");
  const cartDeliveryEl = document.getElementById("cart-delivery");
  const cartTotalEl = document.getElementById("cart-total");
  const checkoutForm = document.getElementById("checkout-form");
  const ordersEmptyEl = document.getElementById("orders-empty");
  const ordersListEl = document.getElementById("orders-list");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Flatten dishes for home page
  function getAllDishes() {
    return restaurantsData.flatMap((r) =>
      r.menu.map((item) => ({
        ...item,
        restaurantId: r.id,
        restaurantName: r.name,
        rating: r.rating
      }))
    );
  }

  // -------------- NAVIGATION -----------------
  function showView(id) {
    views.forEach((v) => v.classList.toggle("active", v.id === id));
    navLinks.forEach((link) => link.classList.toggle("active", link.dataset.target === id));
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target = link.dataset.target;
      if (target) showView(target);
    });
  });

  goRestaurantsButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      if (type) {
        currentType = type;
        updateFilterTypeButtons(type);
      }
      showView("restaurants");
      updateRestaurantView();
    });
  });

  mainCategoryCards.forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.jumpType;
      if (type) {
        currentType = type;
        updateFilterTypeButtons(type);
      }
      showView("restaurants");
      updateRestaurantView();
    });
  });

  function updateFilterTypeButtons(type) {
    document.querySelectorAll(".filter-type-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.type === type);
    });
  }

  // -------------- RESTAURANTS LIST -------------
  function createRestaurantCard(restaurant) {
    let visibleMenu = restaurant.menu;
    if (currentType !== "all") {
      visibleMenu = restaurant.menu.filter((item) => {
        if (currentType === "Veg") return item.veg === true;
        if (currentType === "Non-Veg") return item.veg === false;
        return item.category === currentType;
      });
      if (visibleMenu.length === 0) visibleMenu = restaurant.menu.slice(0, 3);
    }

    return `
      <article class="restaurant-card">
        <div class="restaurant-header">
          <div class="restaurant-image-wrapper">
            <div class="restaurant-image" style="background-image:url('${restaurant.image}')"></div>
            <span class="restaurant-tag">${restaurant.emoji || "🍛"}</span>
          </div>
          <div class="restaurant-main">
            <h3>${restaurant.name}</h3>
            <div class="restaurant-meta">
              <span class="restaurant-pill">${restaurant.cuisine}</span>
              <span class="restaurant-pill restaurant-rating">★ ${restaurant.rating}</span>
              <span class="restaurant-pill">${restaurant.time || '30 mins'}</span>
            </div>
          </div>
        </div>
        <div class="menu">
          ${visibleMenu.slice(0, 3).map((item) => `
            <div class="menu-item">
              <div class="menu-info">
                <span class="menu-name">${item.name}</span>
                <span class="menu-meta">${item.tags || ''}</span>
              </div>
              <div class="menu-actions">
                <span class="menu-price">₹${item.price}</span>
                <button class="menu-add-btn" data-add-to-cart="true" 
                  data-restaurant-id="${restaurant.id}" data-item-id="${item.id}">
                  Add
                </button>
              </div>
            </div>
          `).join("")}
        </div>
      </article>
    `;
  }

  function renderRestaurants(data) {
    restaurantListEl.innerHTML = data.length 
      ? data.map(createRestaurantCard).join('') 
      : '<div class="empty-state">No restaurants found. Try another filter.</div>';
  }

  function updateRestaurantView() {
    let data = restaurantsData.filter((r) => {
      if (currentCuisine !== "all" && r.cuisine !== currentCuisine) return false;
      if (currentSearchTerm) {
        const term = currentSearchTerm.toLowerCase();
        return r.name.toLowerCase().includes(term) || 
               r.cuisine.toLowerCase().includes(term) || 
               r.menu.some(m => m.name.toLowerCase().includes(term));
      }
      if (currentType !== "all") {
        return r.menu.some((m) => {
          if (currentType === "Veg") return m.veg === true;
          if (currentType === "Non-Veg") return m.veg === false;
          return m.category === currentType;
        });
      }
      return true;
    });
    renderRestaurants(data);
  }

  // Initial restaurant load
  await loadRestaurantsFromServer();

  // Filters
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentCuisine = btn.dataset.cuisine || "all";
      updateRestaurantView();
    });
  });

  document.querySelectorAll(".filter-type-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-type-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      currentType = btn.dataset.type || "all";
      updateRestaurantView();
    });
  });

  // Search
  searchBtn.addEventListener("click", () => {
    currentSearchTerm = searchInput.value.trim();
    showView("restaurants");
    updateRestaurantView();
  });
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      currentSearchTerm = searchInput.value.trim();
      showView("restaurants");
      updateRestaurantView();
    }
  });

  // -------------- CART LOGIC ------------------
  function addToCart(restaurantId, itemId) {
    const restaurant = restaurantsData.find((r) => r.id === restaurantId);
    const item = restaurant?.menu.find((m) => m.id === itemId);
    if (!item) return;

    const existing = cart.find((c) => c.itemId === itemId && c.restaurantId === restaurantId);
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        restaurantId, restaurantName: restaurant.name,
        itemId: item.id, name: item.name, price: item.price, qty: 1
      });
    }
    renderCart();
    showView("cart");
  }

  function renderCart() {
    if (cart.length === 0) {
      cartEmptyEl.classList.remove("hidden");
      cartContentEl.classList.add("hidden");
      return;
    }

    cartEmptyEl.classList.add("hidden");
    cartContentEl.classList.remove("hidden");

    cartItemsEl.innerHTML = cart.map((row) => {
      const itemTotal = row.qty * row.price;
      return `
        <div class="cart-item">
          <div class="cart-item-main">
            <span class="cart-item-name">${row.name}</span>
            <span class="cart-item-restaurant">${row.restaurantName}</span>
          </div>
          <div class="cart-controls">
            <div class="cart-qty">
              <button data-cart-minus="true" data-restaurant-id="${row.restaurantId}" data-item-id="${row.itemId}">-</button>
              <span>${row.qty}</span>
              <button data-cart-plus="true" data-restaurant-id="${row.restaurantId}" data-item-id="${row.itemId}">+</button>
            </div>
            <span class="cart-price">₹${itemTotal}</span>
            <button class="cart-remove" data-cart-remove="true" data-restaurant-id="${row.restaurantId}" data-item-id="${row.itemId}">Remove</button>
          </div>
        </div>
      `;
    }).join("");

    const subtotal = cart.reduce((sum, row) => sum + (row.qty * row.price), 0);
    const delivery = subtotal > 0 ? 40 : 0;
    const total = subtotal + delivery;

    cartSubtotalEl.textContent = `₹${subtotal}`;
    cartDeliveryEl.textContent = `₹${delivery}`;
    cartTotalEl.textContent = `₹${total}`;
  }

  // Cart event handlers
  document.addEventListener("click", (e) => {
    const addBtn = e.target.closest("[data-add-to-cart]");
    if (addBtn) {
      addToCart(addBtn.dataset.restaurantId, addBtn.dataset.itemId);
      return;
    }

    const plusBtn = e.target.closest("[data-cart-plus]");
    if (plusBtn) {
      const row = cart.find(c => c.itemId === plusBtn.dataset.itemId && c.restaurantId === plusBtn.dataset.restaurantId);
      if (row) row.qty += 1;
      renderCart();
      return;
    }

    const minusBtn = e.target.closest("[data-cart-minus]");
    if (minusBtn) {
      const row = cart.find(c => c.itemId === minusBtn.dataset.itemId && c.restaurantId === minusBtn.dataset.restaurantId);
      if (row) {
        row.qty -= 1;
        if (row.qty <= 0) cart = cart.filter(c => !(c.itemId === row.itemId && c.restaurantId === row.restaurantId));
      }
      renderCart();
      return;
    }

    const removeBtn = e.target.closest("[data-cart-remove]");
    if (removeBtn) {
      cart = cart.filter(c => !(c.itemId === removeBtn.dataset.itemId && c.restaurantId === removeBtn.dataset.restaurantId));
      renderCart();
      return;
    }
  });

  // -------------- ORDERS (BACKEND) ------------
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Your cart is empty.");
      return;
    }

    const formData = new FormData(checkoutForm);
    const subtotal = cart.reduce((sum, row) => sum + (row.qty * row.price), 0);
    const delivery = 40;
    const total = subtotal + delivery;

    const payload = {
      customerName: formData.get("name"),
      phone: formData.get("phone"),
      address: formData.get("address"),
      payment: formData.get("payment"),
      total,
      items: cart.map((c) => ({
        restaurantName: c.restaurantName,
        name: c.name,
        qty: c.qty,
        price: c.price
      }))
    };

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Order failed");

      cart = [];
      checkoutForm.reset();
      renderCart();
      await loadOrdersFromServer();
      alert("✅ Order placed successfully!");
      showView("orders");
    } catch (err) {
      console.error("Order error:", err);
      alert("Failed to place order. Please try again.");
    }
  });

  function renderOrders() {
    if (!orders || orders.length === 0) {
      ordersEmptyEl.classList.remove("hidden");
      ordersListEl.innerHTML = "";
      return;
    }

    ordersEmptyEl.classList.add("hidden");
    ordersListEl.innerHTML = orders.map((order) => {
      const placedAt = new Date(order.createdAt || order.placedAt).toLocaleString();
      return `
        <article class="order-card">
          <div class="order-header">
            <div>
              <div class="order-id">Order #${order._id?.slice(-6) || 'N/A'}</div>
              <div class="order-meta">${placedAt}</div>
            </div>
            <div class="order-total">₹${order.total}</div>
          </div>
          <div class="order-meta">${order.customerName} • ${order.phone}</div>
          <div class="order-items">
            <strong>Items:</strong>
            <ul>${order.items?.map(item => `<li>${item.qty} × ${item.name} (${item.restaurantName})</li>`).join("") || '<li>No items</li>'}</ul>
          </div>
        </article>
      `;
    }).join("");
  }

  // Home page category rows (using backend data)
  function renderHomeCategory(filterFn, containerId) {
    const container = document.getElementById(containerId);
    if (!container || !restaurantsData.length) return;

    const dishes = getAllDishes().filter(filterFn).slice(0, 6);
    if (!dishes.length) {
      container.innerHTML = '<div class="empty-state small">Loading...</div>';
      return;
    }

    container.innerHTML = dishes.map((d) => `
      <article class="dish-card">
        <div class="dish-main">
          <div class="dish-name">${d.name}</div>
          <div class="dish-meta">${d.restaurantName} • ★ ${d.rating}</div>
          <div class="dish-tags">${d.tags}</div>
        </div>
        <div class="dish-side">
          <div class="dish-price">₹${d.price}</div>
          <button class="dish-add-btn" data-add-to-cart="true" 
            data-restaurant-id="${d.restaurantId}" data-item-id="${d.id}">Add</button>
        </div>
      </article>
    `).join("");
  }

  // Initial render
  renderCart();
  await loadOrdersFromServer();

  // Home page categories (after restaurants load)
  setTimeout(() => {
    renderHomeCategory((d) => d.category === "Biryani", "home-biryani-list");
    renderHomeCategory((d) => d.category === "Mandi", "home-mandi-list");
    renderHomeCategory((d) => ["Pizza", "Burger", "Veg"].includes(d.category), "home-fastfood-list");
    renderHomeCategory((d) => ["Dessert", "Beverage"].includes(d.category), "home-dessert-list");
  }, 500);
});
