import React, { useState } from "react";
import { FaShoppingCart } from "react-icons/fa";
import products from "../assets/data/products.json";
import discounts from "../assets/data/discounts.json";
import "./Home.css";

const Home = () => {
  const [cartItems, setCartItems] = useState({});
  const [selectedDiscounts, setSelectedDiscounts] = useState([]);

  const addToCart = (productId) => {
    const existingItem = cartItems[productId];

    if (existingItem) {
      const updatedCartItems = { ...cartItems, [productId]: existingItem + 1 };
      setCartItems(updatedCartItems);
    } else {
      setCartItems({ ...cartItems, [productId]: 1 });
    }
  };

  const handleSelectDiscount = (couponId) => {
    const coupon = discounts.find((coupon) => coupon.id === couponId);
    if (!coupon) return;

    const category = coupon.category;
    const isSelected = selectedDiscounts.includes(couponId);

    if (isSelected) {
      setSelectedDiscounts(selectedDiscounts.filter((id) => id !== couponId));
    } else {
      const previousSelectedInCategory = selectedDiscounts.find((id) => {
        const prevCoupon = discounts.find((coupon) => coupon.id === id);
        return prevCoupon && prevCoupon.category === category;
      });

      setSelectedDiscounts([
        ...selectedDiscounts.filter((id) => id !== previousSelectedInCategory),
        couponId,
      ]);
    }
  };

  const total = Object.entries(cartItems).reduce(
    (acc, [productId, quantity]) => {
      const product = products.find(
        (product) => product.id === parseInt(productId)
      );
      const totalPrice = product ? product.price * quantity : 0;
      return acc + totalPrice;
    },
    0
  );

  const calculateTotalPrice = () => {
    let totalPrice = Object.entries(cartItems).reduce(
      (acc, [productId, quantity]) => {
        const product = products.find(
          (product) => product.id === parseInt(productId)
        );
        const productPrice = product ? product.price * quantity : 0;
        return acc + productPrice;
      },
      0
    );

    let couponDiscount = 0;
    let onTopDiscount = 0;
    let seasonalDiscount = 0;

    const couponDiscountSelected = selectedDiscounts.some((discountId) => {
      const coupon = discounts.find((coupon) => coupon.id === discountId);
      return coupon && coupon.category === "Coupon";
    });

    if (couponDiscountSelected) {
      selectedDiscounts.forEach((couponId) => {
        const coupon = discounts.find((coupon) => coupon.id === couponId);
        if (!coupon || coupon.category !== "Coupon") return;

        const { parameters } = coupon;

        switch (coupon.campaign) {
          case "Fixed amount":
            if (parameters.amount) {
              couponDiscount = parameters.amount;
              totalPrice -= couponDiscount;
            }
            break;
          case "Percentage discount":
            if (parameters.percentage) {
              couponDiscount = (totalPrice * parameters.percentage) / 100;
              totalPrice -= couponDiscount;
            }
            break;
          default:
            break;
        }
      });
    }

    const onTopDiscountSelected = selectedDiscounts.some((discountId) => {
      const coupon = discounts.find((coupon) => coupon.id === discountId);
      return coupon && coupon.category === "On Top";
    });

    if (onTopDiscountSelected) {
      selectedDiscounts.forEach((couponId) => {
        const coupon = discounts.find((coupon) => coupon.id === couponId);
        if (!coupon || coupon.category !== "On Top") return;

        const { parameters } = coupon;

        switch (coupon.campaign) {
          case "Percentage discount by item category":
            if (parameters.category && parameters.percentage) {
              const categoryTotal = Object.entries(cartItems).reduce(
                (acc, [productId, quantity]) => {
                  const product = products.find(
                    (product) => product.id === parseInt(productId)
                  );
                  if (product && product.category === parameters.category) {
                    return acc + product.price * quantity;
                  }
                  return acc;
                },
                0
              );
              onTopDiscount = (categoryTotal * parameters.percentage) / 100;
              totalPrice -= onTopDiscount;
            }
            break;
          case "Discount by points":
            if (parameters.points) {
              const maxPoints = totalPrice * 0.2;
              onTopDiscount = Math.min(maxPoints, parameters.points);
              totalPrice -= onTopDiscount;
            }
            break;
          default:
            break;
        }
      });
    }

    const seasonalDiscountSelected = selectedDiscounts.some((discountId) => {
      const coupon = discounts.find((coupon) => coupon.id === discountId);
      return coupon && coupon.category === "Seasonal";
    });

    if (seasonalDiscountSelected) {
      selectedDiscounts.forEach((couponId) => {
        const coupon = discounts.find((coupon) => coupon.id === couponId);
        if (!coupon || coupon.category !== "Seasonal") return;

        const { parameters } = coupon;

        switch (coupon.campaign) {
          case "Special campaigns":
            if (parameters.everyXTHB && parameters.discountYTHB) {
              seasonalDiscount =
                Math.floor(totalPrice / parameters.everyXTHB) *
                parameters.discountYTHB;
              totalPrice -= seasonalDiscount;
            }
            break;
          default:
            break;
        }
      });
    }

    return {
      total: totalPrice,
      couponDiscount: couponDiscount,
      onTopDiscount: onTopDiscount,
      seasonalDiscount: seasonalDiscount,
    };
  };

  const totalPriceInfo = calculateTotalPrice();

  return (
    <div className="home-container">
      <div className="cart-icon">
        <FaShoppingCart />
        <span className="cart-item-count">
          {Object.values(cartItems).reduce((total, count) => total + count, 0)}
        </span>
      </div>

      <div className="products-container">
        {products.map((product) => (
          <div className="product" key={product.id}>
            <div className="product-img">
              <img src={product.image} alt={product.name} />
            </div>
            <div className="product-info">
              <h2>{product.name}</h2>
              <p>Price: {product.price} THB</p>
              <p>Category: {product.category}</p>
              <button onClick={() => addToCart(product.id)}>Add to Cart</button>
            </div>
          </div>
        ))}
      </div>

      <div className="cart">
        <h2>Items in cart:</h2>
        {Object.entries(cartItems).map(([productId, quantity]) => {
          const product = products.find(
            (product) => product.id === parseInt(productId)
          );
          const totalPrice = product ? product.price * quantity : 0;

          return (
            <div key={productId} className="cart-item">
              <p>{quantity}</p>
              <p>{product.name}</p>
              <p>{product.price} THB</p>
            </div>
          );
        })}

        <div class="subtotal-container">
          <h3>
            Merchandise Subtotal(
            {Object.values(cartItems).reduce(
              (total, count) => total + count,
              0
            )}{" "}
            Items)
          </h3>
          <h3>{total}THB</h3>
        </div>

        <div className="discounts-container">
          {Object.values(
            discounts.reduce((acc, coupon) => {
              if (!acc[coupon.category]) {
                acc[coupon.category] = [];
              }
              acc[coupon.category].push(coupon);
              return acc;
            }, {})
          ).map((categoryDiscounts, index) => (
            <div key={index} className="category-discounts">
              <h3>{categoryDiscounts[0].category}</h3>
              <div className="coupon-items">
                {categoryDiscounts.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`coupon-item ${
                      selectedDiscounts.includes(coupon.id) ? "selected" : ""
                    }`}
                  >
                    <p>{coupon.campaign}</p>
                    {coupon.campaign === "Fixed amount" && (
                      <p>{coupon.parameters.amount}THB off</p>
                    )}
                    {coupon.campaign === "Percentage discount" && (
                      <p>{coupon.parameters.percentage}% off</p>
                    )}
                    {coupon.campaign ===
                      "Percentage discount by item category" && (
                      <p>
                        Discount: {coupon.parameters.percentage}% off on{" "}
                        {coupon.parameters.category}
                      </p>
                    )}
                    {coupon.campaign === "Discount by points" && (
                      <p>Spent Points: {coupon.parameters.points}</p>
                    )}
                    {coupon.campaign === "Special campaigns" && (
                      <p>
                        Every {coupon.parameters.everyXTHB} THB Discount{" "}
                        {coupon.parameters.discountYTHB} THB
                      </p>
                    )}
                    <button onClick={() => handleSelectDiscount(coupon.id)}>
                      {selectedDiscounts.includes(coupon.id)
                        ? "Selected"
                        : "Select"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p>Coupon Discount: {totalPriceInfo.couponDiscount}THB</p>
        <p>On Top Discount: {totalPriceInfo.onTopDiscount}THB</p>
        <p>Seasonal Discount: {totalPriceInfo.seasonalDiscount}THB</p>
        <h2>Total Price: {totalPriceInfo.total}THB</h2>
      </div>
    </div>
  );
};

export default Home;
