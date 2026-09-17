import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../api/client";

function Marketplace() {
  const { user } = useAuth();
  const isProvider = user?.role === "pharmacy" || user?.role === "lab";
  const isPatient = user?.role === "patient";

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(user?.role === "lab" ? "lab_test" : "medicine");
  const [price, setPrice] = useState("");
  const [stockQuantity, setStockQuantity] = useState("");

  const [resultInputs, setResultInputs] = useState({});

  const fetchData = async () => {
    try {
      if (isProvider) {
        const ordersRes = await apiClient.get("/orders");
        setOrders(ordersRes.data);
      } else {
        const productsRes = await apiClient.get("/products");
        setProducts(productsRes.data);
        const ordersRes = await apiClient.get("/orders");
        setOrders(ordersRes.data);
      }
    } catch (err) {
      setError("Failed to load marketplace data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/products", {
        name,
        description,
        category,
        price: parseFloat(price),
        stock_quantity: parseInt(stockQuantity),
      });
      setName("");
      setDescription("");
      setPrice("");
      setStockQuantity("");
      setSuccess("Listed successfully.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to list product");
    }
  };

  const handleOrder = async (productId) => {
    setError("");
    setSuccess("");
    try {
      await apiClient.post("/orders", { product_id: productId, quantity: 1 });
      setSuccess("Order placed.");
      fetchData();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to place order");
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status });
      fetchData();
    } catch (err) {
      setError("Failed to update order");
    }
  };

  const handleAttachResult = async (orderId) => {
    const result = resultInputs[orderId];
    if (!result) return;
    try {
      await apiClient.patch(`/orders/${orderId}/result`, { result });
      setResultInputs((prev) => ({ ...prev, [orderId]: "" }));
      fetchData();
    } catch (err) {
      setError("Failed to attach result");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-gradient-to-r from-[#3B2E8A] to-[#4C3AA8]">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <Link to="/dashboard" className="text-sm text-white/80 hover:text-white transition-colors">
            &larr; Back to Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <h1 className="text-xl font-semibold text-slate-900 mb-6">Marketplace</h1>

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
        {success && <p className="text-emerald-600 text-sm mb-3">{success}</p>}

        {isProvider && (
          <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">
              List a New {user.role === "lab" ? "Test" : "Product"}
            </h2>
            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
              />
              <textarea
                placeholder="Description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
              />
              <div className="flex gap-3">
                <input
                  type="number"
                  placeholder="Price (KES)"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
                />
                <input
                  type="number"
                  placeholder="Stock quantity"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  required
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
                />
              </div>
              <button
                type="submit"
                className="bg-[#4C3AA8] text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-[#3B2E8A] hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0"
              >
                List {user.role === "lab" ? "Test" : "Product"}
              </button>
            </form>
          </div>
        )}

        {isPatient && (
          <>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Available Products &amp; Tests
            </h2>
            {loading ? (
              <span className="inline-block w-5 h-5 border-2 border-[#4C3AA8]/30 border-t-[#4C3AA8] rounded-full animate-spin" />
            ) : products.length === 0 ? (
              <p className="text-slate-500 text-sm mb-8">Nothing available right now.</p>
            ) : (
              <div className="space-y-3 mb-8">
                {products.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-slate-900 text-sm">
                          {p.name}{" "}
                          <span className="text-xs text-slate-400 font-normal">
                            ({p.category})
                          </span>
                        </p>
                        <p className="text-sm text-slate-600 mt-1">{p.description}</p>
                        <p className="text-sm text-slate-500 mt-2">
                          KES {p.price} &mdash; {p.stock_quantity} in stock
                        </p>
                      </div>
                      <button
                        onClick={() => handleOrder(p.id)}
                        className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-[#4C3AA8]/5 hover:border-[#4C3AA8]/40 shrink-0"
                      >
                        Order
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        <h2 className="text-sm font-semibold text-slate-900 mb-3">
          {isProvider ? "Orders Received" : "My Orders"}
        </h2>
        {orders.length === 0 ? (
          <p className="text-slate-500 text-sm">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white border border-slate-200 rounded-xl p-4 transition-all duration-200 hover:shadow-md"
              >
                <p className="text-sm text-slate-900">
                  Order #{order.id} &mdash; Qty: {order.quantity} &mdash; Status:{" "}
                  <span className="font-medium">{order.status}</span>
                </p>
                {order.result && (
                  <p className="text-sm bg-slate-50 border border-slate-200 rounded-lg p-2 mt-2">
                    Result: {order.result}
                  </p>
                )}

                {user.role === "pharmacy" &&
                  order.status !== "completed" &&
                  order.status !== "cancelled" && (
                    <div className="mt-3 flex gap-2">
                      {["processing", "shipped", "completed"].map((s) => (
                        <button
                          key={s}
                          onClick={() => handleOrderStatus(order.id, s)}
                          className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-[#4C3AA8]/5 hover:border-[#4C3AA8]/40"
                        >
                          Mark {s}
                        </button>
                      ))}
                    </div>
                  )}

                {user.role === "lab" && !order.result && (
                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter result"
                      value={resultInputs[order.id] || ""}
                      onChange={(e) =>
                        setResultInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                      }
                      className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[#4C3AA8]/30 focus:border-[#4C3AA8]"
                    />
                    <button
                      onClick={() => handleAttachResult(order.id)}
                      className="text-sm px-3 py-1.5 border border-slate-300 rounded-lg transition-colors hover:bg-[#4C3AA8]/5 hover:border-[#4C3AA8]/40"
                    >
                      Attach Result
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default Marketplace;