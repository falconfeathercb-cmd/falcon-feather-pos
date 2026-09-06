import {
  NavLink,
  Outlet,
  useNavigate
} from "react-router-dom";

import {
  LayoutDashboard,
  ShoppingCart,
  PackageSearch,
  Boxes,
  Truck,
  TriangleAlert,
  ReceiptText,
  BookOpen,
  LogOut,
  ChartNoAxesCombined
} from "lucide-react";

import ConnectionBadge from "./ConnectionBadge";
import { supabase } from "../lib/supabase";

const links = [
  ["/", "Overview", LayoutDashboard],
  ["/pos", "Point of Sale", ShoppingCart],
  ["/products", "Products", PackageSearch],
  ["/inventory", "Inventory", Boxes],
  ["/stock-in", "Stock Receiving", Truck],
  ["/alerts", "Stock Alerts", TriangleAlert],
  ["/sales", "Sales History", ReceiptText],
  ["/reports", "Profit & Loss", ChartNoAxesCombined]
];

export default function Layout({ session }) {
  const navigate = useNavigate();

  const user = session?.user;

  const fullName =
    user?.user_metadata?.full_name ||
    user?.email ||
    "Cashier";

  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    "";

  const initial =
    fullName
      ?.charAt(0)
      ?.toUpperCase() ||
    "C";


  async function logout() {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      console.error(
        "Logout error:",
        error.message
      );

      alert(
        "Logout failed: " +
        error.message
      );

      return;
    }

    navigate(
      "/login",
      {
        replace: true
      }
    );
  }


  return (
    <div className="app">

      <aside className="sidebar">

        {/* BRAND */}
        <div className="brand">

          <div className="brandIcon">
            <BookOpen size={22} />
          </div>

          <div>

            <strong>
              Falcon Feather
            </strong>

            <small>
              Book House & Communication
            </small>

          </div>

        </div>


        {/* STORE */}
        <div className="storeCard">

          <span className="storeDot"></span>

          <div>

            <strong>
              Main Store
            </strong>

            <small>
              Register 01
            </small>

          </div>

        </div>


        {/* NAVIGATION */}
        <nav>

          {links.map(
            ([to, label, Icon]) => (

              <NavLink
                key={to}
                to={to}
                className={({
                  isActive
                }) =>
                  `navLink ${
                    isActive
                      ? "active"
                      : ""
                  }`
                }
              >

                <Icon size={19} />

                <span>
                  {label}
                </span>

              </NavLink>

            )
          )}

        </nav>


        {/* USER */}
        <div className="sidebarFooter">

          <button
            className="userProfileButton"
            onClick={() =>
              navigate("/settings")
            }
            title="Account settings"
          >

            {avatarUrl ? (

              <img
                className="cashierAvatarImage"
                src={avatarUrl}
                alt="Profile"
              />

            ) : (

              <div className="cashierAvatar">
                {initial}
              </div>

            )}


            <div className="cashierInfo">

              <strong
                title={fullName}
              >
                {fullName}
              </strong>

              <small
                title={
                  user?.email ||
                  "Active session"
                }
              >
                {user?.email ||
                  "Active session"}
              </small>

            </div>

          </button>


          <button
            className="logoutIconBtn"
            onClick={logout}
            title="Logout"
          >

            <LogOut size={18} />

          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="content">

        <div className="topbar">

          <div>

            <strong>
              Falcon Feather POS
            </strong>

            <span className="mutedTop">
              Real-time store operations
            </span>

          </div>


          <ConnectionBadge />

        </div>


        <Outlet />

      </main>

    </div>
  );
}