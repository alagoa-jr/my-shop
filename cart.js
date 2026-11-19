// ---------- Basic helpers ----------
const CART_KEY = "myShopCart";

function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatNaira(amount) {
  return "₦" + amount.toLocaleString("en-NG");
}

function getTotal(cart) {
  return cart.reduce(function (sum, item) {
    return sum + item.price * item.qty;
  }, 0);
}

// ---------- Cart actions ----------
function addToCart(id, name, price) {
  const cart = getCart();
  const existing = cart.find(function (item) {
    return item.id === id;
  });

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, name: name, price: price, qty: 1 });
  }

  saveCart(cart);
  refreshCart();
}

function changeQty(id, change) {
  let cart = getCart();
  const item = cart.find(function (i) {
    return i.id === id;
  });
  if (!item) return;

  item.qty += change;
  cart = cart.filter(function (i) {
    return i.qty > 0;
  });

  saveCart(cart);
  refreshCart();
}

function removeItem(id) {
  const cart = getCart().filter(function (i) {
    return i.id !== id;
  });
  saveCart(cart);
  refreshCart();
}

// ---------- Showing the cart on the page ----------
function updateCartCount() {
  const link = document.getElementById("cart-count");
  if (!link) return;

  const count = getCart().reduce(function (sum, item) {
    return sum + item.qty;
  }, 0);
  link.textContent = "Cart (" + count + ")";
}

function renderCart() {
  const box = document.getElementById("cart-items");
  if (!box) return; // this page has no cart section

  const cart = getCart();

  if (cart.length === 0) {
    box.innerHTML = '<p class="empty-cart">Your cart is empty. Add something from the products above.</p>';
  } else {
    let html = "";
    cart.forEach(function (item) {
      html +=
        '<div class="cart-row">' +
          '<div class="cart-info">' +
            '<strong>' + item.name + '</strong>' +
            '<span>' + formatNaira(item.price) + ' each</span>' +
          '</div>' +
          '<div class="cart-controls">' +
            '<button class="qty-button" onclick="changeQty(\'' + item.id + '\', -1)">−</button>' +
            '<span class="qty">' + item.qty + '</span>' +
            '<button class="qty-button" onclick="changeQty(\'' + item.id + '\', 1)">+</button>' +
          '</div>' +
          '<div class="cart-line-total">' + formatNaira(item.price * item.qty) + '</div>' +
          '<button class="remove-button" onclick="removeItem(\'' + item.id + '\')">Remove</button>' +
        '</div>';
    });
    box.innerHTML = html;
  }

  document.getElementById("cart-total").textContent = formatNaira(getTotal(cart));

  const checkoutLink = document.getElementById("checkout-link");
  if (checkoutLink) {
    checkoutLink.style.display = cart.length === 0 ? "none" : "inline-block";
  }
}

function renderSummary() {
  const box = document.getElementById("summary-items");
  if (!box) return; // this page has no order summary

  const cart = getCart();

  if (cart.length === 0) {
    box.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
  } else {
    let html = "";
    cart.forEach(function (item) {
      html +=
        '<div class="summary-row">' +
          '<span>' + item.name + ' &times; ' + item.qty + '</span>' +
          '<span>' + formatNaira(item.price * item.qty) + '</span>' +
        '</div>';
    });
    box.innerHTML = html;
  }

  document.getElementById("summary-total").textContent = formatNaira(getTotal(cart));

  const orderButton = document.getElementById("place-order");
  if (orderButton) {
    orderButton.disabled = cart.length === 0;
  }
}

function refreshCart() {
  updateCartCount();
  renderCart();
  renderSummary();
}

// ---------- Connect the "Add to Cart" buttons ----------
document.querySelectorAll(".add-to-cart").forEach(function (button) {
  button.addEventListener("click", function () {
    addToCart(
      button.dataset.id,
      button.dataset.name,
      Number(button.dataset.price)
    );
  });
});

// ---------- Checkout form ----------
// ---------- Sending the order ----------
const SHOP_WHATSAPP = "2348133368584"; // change to YOUR number

const buildOrderMessage = (order) => {
  const itemLines = order.items
    .map((item) => `- ${item.name} × ${item.qty} = ${formatNaira(item.price * item.qty)}`)
    .join("\n");

  return `*NEW ORDER*

*Items*
${itemLines}

*Subtotal:* ${formatNaira(order.total)}

*Customer*
Name: ${order.name}
Phone: ${order.phone}
Alt phone: ${order.altPhone || "-"}
Area: ${order.area}
Address: ${order.address}
Landmark: ${order.landmark || "-"}
Delivery time: ${order.deliveryTime}
Notes: ${order.notes || "-"}
Payment: ${order.payment === "transfer" ? "Bank transfer" : "Pay on delivery"}`;
};

const checkoutForm = document.getElementById("checkout-form");

if (checkoutForm) {
  checkoutForm.addEventListener("submit", (event) => {
    event.preventDefault(); // stop the page from reloading

    const cart = getCart();
    if (cart.length === 0) return;

    const data = Object.fromEntries(new FormData(checkoutForm));

    const order = {
      items: cart,
      total: getTotal(cart),
      name: data["full-name"],
      phone: data["phone-number"],
      altPhone: data["alt-phone"],
      area: data["area"],
      address: data["address"],
      landmark: data["landmark"],
      deliveryTime: data["delivery-time"],
      notes: data["notes"],
      payment: data["payment"],
    };

    const message = buildOrderMessage(order);
    const link = `https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(message)}`;

    // Keep the link for the confirmation page, then empty the cart
    localStorage.setItem("myShopLastOrder", link);
    saveCart([]);

    window.location.href = "order-success.html";
  });
}
// Run once when the page loads
refreshCart();
