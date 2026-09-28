/* =========================================================
   AutoBill — Vehicle Showroom Billing (Demo)
   Plain vanilla JS. All data lives in the browser (localStorage).
   This recreates the KIND of billing software built at a real
   dealership job, using fictional vehicles — no real company
   data or code is used here.
   ========================================================= */

const STORAGE_KEYS = {
  stock: "autobill_stock",
  customers: "autobill_customers",
  invoices: "autobill_invoices",
  counter: "autobill_counter",
};

/* ---------- tiny storage helpers ---------- */
function loadData(key, fallback) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function nextId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
function money(n) {
  return "₹" + Number(n).toLocaleString("en-IN", { maximumFractionDigits: 2 });
}

/* ---------- seed sample data (fictional vehicles) ---------- */
const SEED_STOCK = [
  { id: nextId(), model: "Zephyr 125", variant: "Standard", color: "Red", price: 85000, gst: 28, qty: 6 },
  { id: nextId(), model: "Raptor 150", variant: "Sport", color: "Black", price: 110000, gst: 28, qty: 4 },
  { id: nextId(), model: "Cruiser X", variant: "Deluxe", color: "Matte Grey", price: 145000, gst: 28, qty: 3 },
  { id: nextId(), model: "CityLine", variant: "LXI", color: "White", price: 650000, gst: 28, qty: 5 },
  { id: nextId(), model: "Voyager", variant: "VXI", color: "Silver", price: 920000, gst: 28, qty: 3 },
  { id: nextId(), model: "Trailblazer", variant: "SUV Turbo", color: "Blue", price: 1280000, gst: 28, qty: 2 },
];

let stock = loadData(STORAGE_KEYS.stock, null) || (saveData(STORAGE_KEYS.stock, SEED_STOCK), SEED_STOCK);
let customers = loadData(STORAGE_KEYS.customers, []);
let invoices = loadData(STORAGE_KEYS.invoices, []);
let invoiceCounter = loadData(STORAGE_KEYS.counter, 1000);

/* current invoice being built (in memory, not yet saved) */
let currentLines = [];

/* =========================================================
   TAB NAVIGATION
   ========================================================= */
document.querySelectorAll(".tab-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => (p.style.display = "none"));
    btn.classList.add("active");
    document.getElementById("tab-" + btn.dataset.tab).style.display = "block";
    if (btn.dataset.tab === "dashboard") renderDashboard();
    if (btn.dataset.tab === "report") renderReport();
  });
});

/* =========================================================
   DASHBOARD
   ========================================================= */
function renderDashboard() {
  document.getElementById("stat-stock").textContent = stock.reduce((s, v) => s + Number(v.qty), 0);
  document.getElementById("stat-customers").textContent = customers.length;
  document.getElementById("stat-invoices").textContent = invoices.length;
  const revenue = invoices.reduce((s, i) => s + i.total, 0);
  document.getElementById("stat-revenue").textContent = money(revenue);

  const tbody = document.querySelector("#recent-invoices-table tbody");
  tbody.innerHTML = "";
  const recent = [...invoices].reverse().slice(0, 6);
  document.getElementById("recent-empty").style.display = recent.length ? "none" : "block";
  recent.forEach((inv) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${inv.invoiceNo}</td><td>${inv.date}</td><td>${inv.customerName}</td><td>${money(inv.total)}</td>`;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   STOCK TAB
   ========================================================= */
function renderStock() {
  const tbody = document.querySelector("#stock-table tbody");
  tbody.innerHTML = "";
  stock.forEach((v) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${v.model}</td><td>${v.variant}</td><td>${v.color}</td>
      <td>${money(v.price)}</td><td>${v.gst}%</td><td>${v.qty}</td>
      <td><button class="danger" data-id="${v.id}" data-action="del-stock">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  // also refresh the vehicle dropdown on the invoice tab
  const sel = document.getElementById("inv-vehicle");
  sel.innerHTML = stock
    .filter((v) => v.qty > 0)
    .map((v) => `<option value="${v.id}">${v.model} ${v.variant} — ${money(v.price)} (${v.qty} left)</option>`)
    .join("");
}

document.getElementById("btn-add-stock").addEventListener("click", () => {
  const model = document.getElementById("stock-model").value.trim();
  const variant = document.getElementById("stock-variant").value.trim();
  const color = document.getElementById("stock-color").value.trim();
  const price = Number(document.getElementById("stock-price").value);
  const gst = Number(document.getElementById("stock-gst").value) || 0;
  const qty = Number(document.getElementById("stock-qty").value) || 0;
  if (!model || !price) { alert("Model and price are required."); return; }
  stock.push({ id: nextId(), model, variant, color, price, gst, qty });
  saveData(STORAGE_KEYS.stock, stock);
  ["stock-model", "stock-variant", "stock-color", "stock-price"].forEach((id) => (document.getElementById(id).value = ""));
  renderStock();
});

document.querySelector("#stock-table tbody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "del-stock") {
    stock = stock.filter((v) => v.id !== e.target.dataset.id);
    saveData(STORAGE_KEYS.stock, stock);
    renderStock();
  }
});

/* =========================================================
   CUSTOMERS TAB
   ========================================================= */
function renderCustomers() {
  const tbody = document.querySelector("#customers-table tbody");
  tbody.innerHTML = "";
  customers.forEach((c) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${c.name}</td><td>${c.phone}</td><td>${c.address}</td>
      <td><button class="danger" data-id="${c.id}" data-action="del-cust">Delete</button></td>`;
    tbody.appendChild(tr);
  });
  const sel = document.getElementById("inv-customer");
  sel.innerHTML =
    `<option value="">— Select customer —</option>` +
    customers.map((c) => `<option value="${c.id}">${c.name} (${c.phone})</option>`).join("");
}

function addCustomer(name, phone, address) {
  if (!name || !phone) { alert("Name and phone are required."); return null; }
  const c = { id: nextId(), name, phone, address };
  customers.push(c);
  saveData(STORAGE_KEYS.customers, customers);
  renderCustomers();
  return c;
}

document.getElementById("btn-add-customer").addEventListener("click", () => {
  const name = document.getElementById("cust-name").value.trim();
  const phone = document.getElementById("cust-phone").value.trim();
  const address = document.getElementById("cust-address").value.trim();
  if (addCustomer(name, phone, address)) {
    ["cust-name", "cust-phone", "cust-address"].forEach((id) => (document.getElementById(id).value = ""));
  }
});

document.querySelector("#customers-table tbody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "del-cust") {
    customers = customers.filter((c) => c.id !== e.target.dataset.id);
    saveData(STORAGE_KEYS.customers, customers);
    renderCustomers();
  }
});

document.getElementById("btn-quick-customer").addEventListener("click", () => {
  const name = prompt("Customer name?");
  if (!name) return;
  const phone = prompt("Phone number?") || "";
  const address = prompt("Address?") || "";
  const c = addCustomer(name, phone, address);
  if (c) document.getElementById("inv-customer").value = c.id;
});

/* =========================================================
   NEW INVOICE TAB
   ========================================================= */
function renderInvoiceLines() {
  const tbody = document.querySelector("#invoice-lines-table tbody");
  tbody.innerHTML = "";
  let subtotal = 0, gstTotal = 0;
  currentLines.forEach((line, idx) => {
    const lineBase = line.price * line.qty;
    const lineGst = (lineBase * line.gst) / 100;
    subtotal += lineBase;
    gstTotal += lineGst;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${line.model}</td><td>${line.qty}</td><td>${money(line.price)}</td>
      <td>${line.gst}%</td><td>${money(lineBase + lineGst)}</td>
      <td><button class="danger" data-idx="${idx}" data-action="del-line">✕</button></td>`;
    tbody.appendChild(tr);
  });

  const discount = Number(document.getElementById("inv-discount").value) || 0;
  const total = Math.max(subtotal + gstTotal - discount, 0);

  document.getElementById("inv-subtotal").textContent = money(subtotal);
  document.getElementById("inv-gst").textContent = money(gstTotal);
  document.getElementById("inv-discount-amt").textContent = money(discount);
  document.getElementById("inv-total").textContent = money(total);
}

document.getElementById("btn-add-line").addEventListener("click", () => {
  const vehicleId = document.getElementById("inv-vehicle").value;
  const qty = Number(document.getElementById("inv-qty").value) || 1;
  const vehicle = stock.find((v) => v.id === vehicleId);
  if (!vehicle) { alert("Please add a vehicle to stock first."); return; }
  if (qty > vehicle.qty) { alert(`Only ${vehicle.qty} unit(s) of ${vehicle.model} in stock.`); return; }
  currentLines.push({ stockId: vehicle.id, model: `${vehicle.model} ${vehicle.variant}`, qty, price: vehicle.price, gst: vehicle.gst });
  renderInvoiceLines();
});

document.querySelector("#invoice-lines-table tbody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "del-line") {
    currentLines.splice(Number(e.target.dataset.idx), 1);
    renderInvoiceLines();
  }
});
document.getElementById("inv-discount").addEventListener("input", renderInvoiceLines);

document.getElementById("btn-generate-invoice").addEventListener("click", () => {
  const custId = document.getElementById("inv-customer").value;
  const customer = customers.find((c) => c.id === custId);
  const msg = document.getElementById("invoice-msg");

  if (!customer) { msg.textContent = "Please select a customer."; return; }
  if (currentLines.length === 0) { msg.textContent = "Add at least one vehicle to the invoice."; return; }

  let subtotal = 0, gstTotal = 0;
  currentLines.forEach((l) => {
    subtotal += l.price * l.qty;
    gstTotal += (l.price * l.qty * l.gst) / 100;
  });
  const discount = Number(document.getElementById("inv-discount").value) || 0;
  const total = Math.max(subtotal + gstTotal - discount, 0);

  invoiceCounter += 1;
  saveData(STORAGE_KEYS.counter, invoiceCounter);

  const invoice = {
    id: nextId(),
    invoiceNo: "INV-" + invoiceCounter,
    date: new Date().toISOString().slice(0, 10),
    customerId: customer.id,
    customerName: customer.name,
    customerPhone: customer.phone,
    lines: currentLines,
    subtotal, gst: gstTotal, discount, total,
  };
  invoices.push(invoice);
  saveData(STORAGE_KEYS.invoices, invoices);

  // reduce stock quantities
  currentLines.forEach((l) => {
    const v = stock.find((s) => s.id === l.stockId);
    if (v) v.qty = Math.max(v.qty - l.qty, 0);
  });
  saveData(STORAGE_KEYS.stock, stock);

  msg.textContent = `Invoice ${invoice.invoiceNo} generated.`;
  printInvoice(invoice);

  currentLines = [];
  renderInvoiceLines();
  renderStock();
  document.getElementById("inv-discount").value = 0;
});

/* =========================================================
   PRINT / PDF (uses the browser's own print → save as PDF)
   ========================================================= */
function printInvoice(invoice) {
  const rows = invoice.lines
    .map((l) => `<tr><td>${l.model}</td><td>${l.qty}</td><td>₹${l.price}</td><td>${l.gst}%</td><td>₹${(l.price * l.qty * (1 + l.gst / 100)).toFixed(2)}</td></tr>`)
    .join("");

  document.getElementById("print-invoice").innerHTML = `
    <h2>AutoBill — Tax Invoice (Demo)</h2>
    <p><strong>Invoice No:</strong> ${invoice.invoiceNo} &nbsp; <strong>Date:</strong> ${invoice.date}</p>
    <p><strong>Customer:</strong> ${invoice.customerName} (${invoice.customerPhone})</p>
    <table>
      <thead><tr><th>Vehicle</th><th>Qty</th><th>Price</th><th>GST</th><th>Line Total</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p style="margin-top:14px;">
      Subtotal: ₹${invoice.subtotal.toFixed(2)}<br/>
      GST: ₹${invoice.gst.toFixed(2)}<br/>
      Discount: ₹${invoice.discount}<br/>
      <strong>Grand Total: ₹${invoice.total.toFixed(2)}</strong>
    </p>
    <p style="margin-top:24px;font-size:12px;color:#555;">
      This is a demo invoice generated for portfolio purposes only.
    </p>
  `;
  document.body.classList.add("printing-invoice");
  window.print();
  setTimeout(() => document.body.classList.remove("printing-invoice"), 300);
}

/* =========================================================
   SALES REPORT TAB
   ========================================================= */
function renderReport() {
  const from = document.getElementById("rep-from").value;
  const to = document.getElementById("rep-to").value;
  let list = [...invoices];
  if (from) list = list.filter((i) => i.date >= from);
  if (to) list = list.filter((i) => i.date <= to);

  const tbody = document.querySelector("#report-table tbody");
  tbody.innerHTML = "";
  let total = 0;
  list.reverse().forEach((inv) => {
    total += inv.total;
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${inv.invoiceNo}</td><td>${inv.date}</td><td>${inv.customerName}</td>
      <td>${inv.lines.length}</td><td>${money(inv.total)}</td>
      <td><button class="secondary" data-id="${inv.id}" data-action="reprint">Print</button></td>`;
    tbody.appendChild(tr);
  });
  document.getElementById("report-total").textContent = money(total);
}

document.getElementById("btn-filter-report").addEventListener("click", renderReport);
document.getElementById("btn-clear-report").addEventListener("click", () => {
  document.getElementById("rep-from").value = "";
  document.getElementById("rep-to").value = "";
  renderReport();
});
document.querySelector("#report-table tbody").addEventListener("click", (e) => {
  if (e.target.dataset.action === "reprint") {
    const inv = invoices.find((i) => i.id === e.target.dataset.id);
    if (inv) printInvoice(inv);
  }
});

/* =========================================================
   INIT
   ========================================================= */
renderDashboard();
renderStock();
renderCustomers();
renderInvoiceLines();
renderReport();
