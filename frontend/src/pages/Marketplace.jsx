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
      setSuccess("Product listed!");
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
      setSuccess("Order placed!");
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
    <div style={{ maxWidth: "700px", margin: "40px auto", padding: "20px" }}>
      <Link to="/dashboard">&larr; Back to Dashboard</Link>
      <h1>Marketplace</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}

      {isProvider && (
        <form onSubmit={handleCreateProduct} style={{ marginBottom: "30px" }}>
          <h3>List a New {user.role === "lab" ? "Test" : "Product"}</h3>
          <div style={{ marginBottom: "10px" }}>
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{ width: "100%", padding: "8px" }}
            />
          </div>
          <div style={{ marginBottom: "10px" }}>
            <textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: "100%", padding: "8px" }}
              rows={2}
            />
          </div>
          <div style={{ marginBottom: "10px", display: "flex", gap: "10px" }}>
            <input
              type="number"
              placeholder="Price (KES)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              style={{ flex: 1, padding: "8px" }}
            />
            <input
              type="number"
              placeholder="Stock quantity"
              value={stockQuantity}
              onChange={(e) => setStockQuantity(e.target.value)}
              required
              style={{ flex: 1, padding: "8px" }}
            />
          </div>
          <button type="submit" style={{ padding: "10px 20px" }}>
            List {user.role === "lab" ? "Test" : "Product"}
          </button>
        </form>
      )}

      {isPatient && (
        <>
          <h3>Available Products & Tests</h3>
          {loading ? (
            <p>Loading...</p>
          ) : products.length === 0 ? (
            <p>Nothing available right now.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {products.map((p) => (
                <li
                  key={p.id}
                  style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "12px",
                    marginBottom: "10px",
                  }}
                >
                  <strong>{p.name}</strong> ({p.category})
                  <p style={{ margin: "4px 0" }}>{p.description}</p>
                  <p>
                    KES {p.price} &mdash; {p.stock_quantity} in stock
                  </p>
                  <button onClick={() => handleOrder(p.id)} style={{ padding: "6px 12px" }}>
                    Order
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h3>{isProvider ? "Orders Received" : "My Orders"}</h3>
      {orders.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0 }}>
          {orders.map((order) => (
            <li
              key={order.id}
              style={{
                border: "1px solid #ccc",
                borderRadius: "6px",
                padding: "12px",
                marginBottom: "10px",
              }}
            >
              <p>
                Order #{order.id} &mdash; Qty: {order.quantity} &mdash; Status:{" "}
                <strong>{order.status}</strong>
              </p>
              {order.result && (
                <p style={{ backgroundColor: "#f0f0f0", padding: "8px", borderRadius: "4px" }}>
                  Result: {order.result}
                </p>
              )}

              {user.role === "pharmacy" && order.status !== "completed" && order.status !== "cancelled" && (
                <div style={{ marginTop: "8px" }}>
                  {["processing", "shipped", "completed"].map((s) => (
                    <button
                      key={s}
                      onClick={() => handleOrderStatus(order.id, s)}
                      style={{ marginRight: "6px", padding: "6px 10px" }}
                    >
                      Mark {s}
                    </button>
                  ))}
                </div>
              )}

              {user.role === "lab" && !order.result && (
                <div style={{ marginTop: "8px" }}>
                  <input
                    type="text"
                    placeholder="Enter result"
                    value={resultInputs[order.id] || ""}
                    onChange={(e) =>
                      setResultInputs((prev) => ({ ...prev, [order.id]: e.target.value }))
                    }
                    style={{ padding: "6px", marginRight: "6px", width: "60%" }}
                  />
                  <button onClick={() => handleAttachResult(order.id)} style={{ padding: "6px 10px" }}>
                    Attach Result
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default Marketplace;