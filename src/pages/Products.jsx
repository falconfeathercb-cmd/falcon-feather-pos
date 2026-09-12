import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  Search,
  Plus,
  X,
  Package,
  Boxes,
  Pencil,
  Truck,
  Save,
  RotateCcw,
  Barcode as BarcodeIcon,
  Trash2
} from "lucide-react";

import JsBarcode from "jsbarcode";

import { supabase } from "../lib/supabase";


export default function Products() {

  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);

  const [q, setQ] = useState("");

  const [selected, setSelected] = useState(null);

  const [editing, setEditing] = useState(false);

  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(false);

  const [message, setMessage] = useState("");

  const [editForm, setEditForm] = useState(null);

  const barcodeRef = useRef(null);


  /* =========================
     LOAD PRODUCTS
     ========================= */

  async function load() {

    const [
      { data: products, error: productsError },
      { data: cats, error: categoriesError }
    ] = await Promise.all([

      supabase
        .from("products")
        .select("*,categories(name)")
        .eq("is_active", true)
        .order("name"),

      supabase
        .from("categories")
        .select("*")
        .order("name")

    ]);


    if (productsError) {

      console.error(
        "Product load error:",
        productsError
      );

      setMessage(
        productsError.message
      );

    }


    if (categoriesError) {

      console.error(
        "Category load error:",
        categoriesError
      );

    }


    setRows(products || []);

    setCategories(cats || []);


    if (selected) {

      const fresh =
        (products || []).find(
          (product) =>
            product.id === selected.id
        );


      if (fresh) {

        setSelected(fresh);

      }

    }

  }


  useEffect(() => {

    load();

  }, []);



  /* =========================
     BARCODE
     ========================= */

  useEffect(() => {

    if (
      selected?.barcode &&
      barcodeRef.current &&
      !editing
    ) {

      try {

        JsBarcode(
          barcodeRef.current,
          selected.barcode,
          {
            format: "CODE128",
            width: 1.7,
            height: 52,
            displayValue: true,
            fontSize: 12,
            margin: 7
          }
        );

      } catch (error) {

        console.error(
          "Barcode error:",
          error
        );

      }

    }

  }, [selected, editing]);



  /* =========================
     OPEN PRODUCT
     ========================= */

  function openProduct(product) {

    setSelected(product);

    setEditing(false);

    setMessage("");

  }



  /* =========================
     EDIT PRODUCT
     ========================= */

  function startEdit() {

    setEditForm({

      name:
        selected.name || "",

      category_id:
        selected.category_id || "",

      barcode:
        selected.barcode || "",

      barcode_type:
        selected.barcode_type ||
        "INTERNAL",

      cost_price:
        selected.cost_price ?? 0,

      selling_price:
        selected.selling_price ?? 0,

      stock_quantity:
        selected.stock_quantity ?? 0,

      reorder_level:
        selected.reorder_level ?? 10,

      description:
        selected.description || "",

      is_active:
        selected.is_active ?? true

    });


    setEditing(true);

    setMessage("");

  }



  function cancelEdit() {

    setEditing(false);

    setEditForm(null);

    setMessage("");

  }



  function editChange(event) {

    const {
      name,
      value,
      type,
      checked
    } = event.target;


    setEditForm(
      (previous) => ({
        ...previous,

        [name]:
          type === "checkbox"
            ? checked
            : value
      })
    );

  }



  /* =========================
     SAVE EDIT
     ========================= */

  async function saveEdit() {

    if (!editForm.name.trim()) {

      setMessage(
        "Product name is required."
      );

      return;

    }


    if (
      Number(editForm.selling_price) < 0 ||
      Number(editForm.cost_price) < 0
    ) {

      setMessage(
        "Prices cannot be negative."
      );

      return;

    }


    if (
      Number(editForm.stock_quantity) < 0
    ) {

      setMessage(
        "Stock quantity cannot be negative."
      );

      return;

    }


    setSaving(true);

    setMessage("");


    const payload = {

      name:
        editForm.name.trim(),

      category_id:
        editForm.category_id || null,

      barcode:
        editForm.barcode.trim() || null,

      barcode_type:
        editForm.barcode_type ||
        "INTERNAL",

      cost_price:
        Number(
          editForm.cost_price || 0
        ),

      selling_price:
        Number(
          editForm.selling_price || 0
        ),

      stock_quantity:
        Number(
          editForm.stock_quantity || 0
        ),

      reorder_level:
        Number(
          editForm.reorder_level || 0
        ),

      description:
        editForm.description.trim() ||
        null,

      is_active:
        Boolean(
          editForm.is_active
        ),

      updated_at:
        new Date().toISOString()

    };


    const {
      data,
      error
    } = await supabase

      .from("products")

      .update(payload)

      .eq(
        "id",
        selected.id
      )

      .select(
        "*,categories(name)"
      )

      .single();


    setSaving(false);


    if (error) {

      console.error(
        "Product update error:",
        error
      );

      setMessage(
        error.message
      );

      return;

    }


    setSelected(data);

    setEditing(false);

    setEditForm(null);

    setMessage(
      "Product updated successfully."
    );


    await load();

  }



  /* =========================
     DELETE PRODUCT
     SAFE / SOFT DELETE
     ========================= */

  async function deleteProduct() {

    if (!selected) return;


    const confirmed =
      window.confirm(
        `Are you sure you want to delete "${selected.name}"?\n\nThe product will be removed from the POS and catalogue, but previous sales and receipts will remain available.`
      );


    if (!confirmed) {

      return;

    }


    setDeleting(true);

    setMessage("");


    const {
      error
    } = await supabase

      .from("products")

      .update({
        is_active: false,
        updated_at:
          new Date().toISOString()
      })

      .eq(
        "id",
        selected.id
      );


    setDeleting(false);


    if (error) {

      console.error(
        "Delete product error:",
        error
      );

      setMessage(
        error.message
      );

      return;

    }


    setRows(
      (currentRows) =>
        currentRows.filter(
          (product) =>
            product.id !== selected.id
        )
    );


    setSelected(null);

    setEditing(false);

    setEditForm(null);

  }



  /* =========================
     SEARCH
     ========================= */

  const filtered =
    rows.filter(
      (product) => {

        const search =
          q
            .trim()
            .toLowerCase();


        if (!search) {

          return true;

        }


        return (

          (
            product.name ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          (
            product.barcode ||
            ""
          )
            .toLowerCase()
            .includes(search)

          ||

          (
            product.categories?.name ||
            ""
          )
            .toLowerCase()
            .includes(search)

        );

      }
    );



  /* =========================
     STOCK STATUS
     ========================= */

  function stockStatus(product) {

    if (
      Number(
        product.stock_quantity
      ) === 0
    ) {

      return {
        text:
          "Out of Stock",
        className:
          "red"
      };

    }


    if (
      Number(
        product.stock_quantity
      )
      <=
      Number(
        product.reorder_level
      )
    ) {

      return {
        text:
          "Low Stock",
        className:
          "amber"
      };

    }


    return {
      text:
        "In Stock",
      className:
        "green"
    };

  }



  return (

    <div className="page">


      {/* =====================
          PAGE HEADER
          ===================== */}

      <div className="pageHeader">

        <div>

          <h1>
            Product Catalogue
          </h1>

          <p>
            Manage books,
            stationery and store products.
          </p>

        </div>


        <Link
          to="/products/new"
          className="primaryBtn"
        >

          <Plus size={17} />

          Add Product

        </Link>

      </div>



      {/* =====================
          PRODUCT TABLE
          ===================== */}

      <section className="panel">

        <div className="toolbar">

          <div className="searchField">

            <Search size={17} />

            <input
              value={q}
              onChange={
                (event) =>
                  setQ(
                    event.target.value
                  )
              }
              placeholder="Search product, category or barcode..."
            />

          </div>

        </div>


        <div className="tableWrap">

          <table>

            <thead>

              <tr>

                <th>
                  Product
                </th>

                <th>
                  Barcode
                </th>

                <th>
                  Category
                </th>

                <th>
                  Cost
                </th>

                <th>
                  Selling
                </th>

                <th>
                  Stock
                </th>

                <th>
                  Status
                </th>

              </tr>

            </thead>


            <tbody>

              {
                filtered.length > 0
                ? (

                  filtered.map(
                    (product) => {

                      const status =
                        stockStatus(
                          product
                        );


                      return (

                        <tr
                          key={
                            product.id
                          }
                          className="productRow"
                          onClick={() =>
                            openProduct(
                              product
                            )
                          }
                        >

                          <td>

                            <strong>
                              {
                                product.name
                              }
                            </strong>

                          </td>


                          <td className="mono">

                            {
                              product.barcode ||
                              "-"
                            }

                          </td>


                          <td>

                            {
                              product
                                .categories
                                ?.name ||
                              "-"
                            }

                          </td>


                          <td>

                            LKR{" "}

                            {
                              Number(
                                product.cost_price ||
                                0
                              )
                                .toFixed(2)
                            }

                          </td>


                          <td>

                            <strong>

                              LKR{" "}

                              {
                                Number(
                                  product.selling_price ||
                                  0
                                )
                                  .toFixed(2)
                              }

                            </strong>

                          </td>


                          <td>

                            {
                              product.stock_quantity
                            }

                          </td>


                          <td>

                            <span
                              className={
                                `pill ${status.className}`
                              }
                            >

                              {
                                status.text
                              }

                            </span>

                          </td>

                        </tr>

                      );

                    }
                  )

                )
                : (

                  <tr>

                    <td
                      colSpan="7"
                      className="emptyTableCell"
                    >

                      No products found.

                    </td>

                  </tr>

                )
              }

            </tbody>

          </table>

        </div>

      </section>



      {/* =====================
          PRODUCT DRAWER
          ===================== */}

      {
        selected && (

          <div
            className="productDrawerOverlay"

            onMouseDown={
              (event) => {

                if (
                  event.target ===
                  event.currentTarget
                ) {

                  setSelected(null);

                }

              }
            }
          >

            <aside className="productDrawer">


              {/* DRAWER HEADER */}

              <div className="drawerHeader">

                <div>

                  <span className="drawerLabel">

                    {
                      editing
                        ? "Edit Product"
                        : "Product Details"
                    }

                  </span>


                  <h2>

                    {
                      editing
                        ? (
                          editForm?.name ||
                          selected.name
                        )
                        : selected.name
                    }

                  </h2>

                </div>


                <button
                  className="drawerClose"

                  onClick={() =>
                    setSelected(null)
                  }
                >

                  <X size={20} />

                </button>

              </div>



              {/* MESSAGE */}

              {
                message && (

                  <div
                    className={
                      message.includes(
                        "successfully"
                      )
                        ? "drawerSuccess"
                        : "drawerError"
                    }
                  >

                    {message}

                  </div>

                )
              }



              {/* =================
                  VIEW MODE
                  ================= */}

              {
                !editing
                ? (

                  <>

                    <div className="drawerScroll">


                      {/* HERO */}

                      <div className="productHero">

                        <div className="productHeroIcon">

                          <Package
                            size={30}
                          />

                        </div>


                        <div>

                          <strong>

                            {
                              selected.name
                            }

                          </strong>


                          <span>

                            {
                              selected
                                .categories
                                ?.name ||
                              "Uncategorized"
                            }

                          </span>

                        </div>

                      </div>



                      {/* BARCODE */}

                      <div className="drawerSection">

                        <h3>
                          Barcode
                        </h3>


                        <div className="barcodeCard">

                          {
                            selected.barcode
                              ? (
                                <svg
                                  ref={
                                    barcodeRef
                                  }
                                />
                              )
                              : (
                                <span>
                                  No barcode
                                </span>
                              )
                          }


                          <span className="mono">

                            {
                              selected.barcode ||
                              "-"
                            }

                          </span>


                          <small>

                            {
                              selected.barcode_type ||
                              "INTERNAL"
                            }

                          </small>

                        </div>

                      </div>



                      {/* PRICING */}

                      <div className="drawerSection">

                        <h3>
                          Pricing
                        </h3>


                        <div className="detailGrid">

                          <div>

                            <span>
                              Cost Price
                            </span>

                            <strong>

                              LKR{" "}

                              {
                                Number(
                                  selected.cost_price ||
                                  0
                                )
                                  .toFixed(2)
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Selling Price
                            </span>

                            <strong>

                              LKR{" "}

                              {
                                Number(
                                  selected.selling_price ||
                                  0
                                )
                                  .toFixed(2)
                              }

                            </strong>

                          </div>

                        </div>

                      </div>



                      {/* INVENTORY */}

                      <div className="drawerSection">

                        <h3>
                          Inventory
                        </h3>


                        <div className="detailGrid">

                          <div>

                            <span>
                              Current Stock
                            </span>

                            <strong>

                              {
                                selected.stock_quantity
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Reorder Level
                            </span>

                            <strong>

                              {
                                selected.reorder_level
                              }

                            </strong>

                          </div>

                        </div>


                        <div className="stockStatusBox">

                          <Boxes
                            size={18}
                          />


                          <div>

                            <span>
                              Stock Status
                            </span>

                            <strong>

                              {
                                stockStatus(
                                  selected
                                ).text
                              }

                            </strong>

                          </div>

                        </div>

                      </div>



                      {/* DESCRIPTION */}

                      <div className="drawerSection">

                        <h3>
                          Description
                        </h3>


                        <p className="productDescription">

                          {
                            selected.description ||
                            "No description has been added."
                          }

                        </p>

                      </div>



                      {/* SYSTEM INFO */}

                      <div className="drawerSection">

                        <h3>
                          System Information
                        </h3>


                        <div className="systemInfo">

                          <div>

                            <span>
                              Product ID
                            </span>

                            <code>

                              {
                                selected.id
                              }

                            </code>

                          </div>


                          <div>

                            <span>
                              Created
                            </span>

                            <strong>

                              {
                                selected.created_at

                                  ? new Date(
                                      selected.created_at
                                    )
                                      .toLocaleString()

                                  : "-"
                              }

                            </strong>

                          </div>


                          <div>

                            <span>
                              Last Updated
                            </span>

                            <strong>

                              {
                                selected.updated_at

                                  ? new Date(
                                      selected.updated_at
                                    )
                                      .toLocaleString()

                                  : "-"
                              }

                            </strong>

                          </div>

                        </div>

                      </div>

                    </div>



                    {/* ACTION BUTTONS */}

                    <div className="drawerActions drawerActionsThree">


                      <button
                        className="dangerBtn"

                        onClick={
                          deleteProduct
                        }

                        disabled={
                          deleting
                        }
                      >

                        <Trash2
                          size={16}
                        />

                        {
                          deleting
                            ? "Deleting..."
                            : "Delete"
                        }

                      </button>


                      <button
                        className="secondaryBtn"

                        onClick={
                          startEdit
                        }
                      >

                        <Pencil
                          size={16}
                        />

                        Edit Product

                      </button>


                      <Link
                        to="/stock-in"
                        className="primaryBtn"
                      >

                        <Truck
                          size={16}
                        />

                        Add Stock

                      </Link>

                    </div>

                  </>

                )



                /* =================
                   EDIT MODE
                   ================= */

                : (

                  <>

                    <div className="drawerScroll">

                      <div className="editDrawerForm">


                        <label>

                          Product Name

                          <input
                            name="name"
                            value={
                              editForm.name
                            }
                            onChange={
                              editChange
                            }
                          />

                        </label>



                        <label>

                          Category

                          <select
                            name="category_id"

                            value={
                              editForm.category_id
                            }

                            onChange={
                              editChange
                            }
                          >

                            <option value="">
                              Uncategorized
                            </option>


                            {
                              categories.map(
                                (
                                  category
                                ) => (

                                  <option
                                    key={
                                      category.id
                                    }

                                    value={
                                      category.id
                                    }
                                  >

                                    {
                                      category.name
                                    }

                                  </option>

                                )
                              )
                            }

                          </select>

                        </label>



                        <label>

                          Barcode

                          <div className="inputWithIcon">

                            <BarcodeIcon
                              size={16}
                            />

                            <input
                              name="barcode"

                              value={
                                editForm.barcode
                              }

                              onChange={
                                editChange
                              }
                            />

                          </div>

                        </label>



                        <label>

                          Barcode Type

                          <select
                            name="barcode_type"

                            value={
                              editForm.barcode_type
                            }

                            onChange={
                              editChange
                            }
                          >

                            <option value="MANUFACTURER">
                              Manufacturer
                            </option>

                            <option value="INTERNAL">
                              Internal
                            </option>

                          </select>

                        </label>



                        <div className="editTwoCol">


                          <label>

                            Cost Price

                            <input
                              name="cost_price"

                              type="number"

                              min="0"

                              step="0.01"

                              value={
                                editForm.cost_price
                              }

                              onChange={
                                editChange
                              }
                            />

                          </label>



                          <label>

                            Selling Price

                            <input
                              name="selling_price"

                              type="number"

                              min="0"

                              step="0.01"

                              value={
                                editForm.selling_price
                              }

                              onChange={
                                editChange
                              }
                            />

                          </label>

                        </div>



                        <div className="editTwoCol">


                          <label>

                            Current Stock

                            <input
                              name="stock_quantity"

                              type="number"

                              min="0"

                              value={
                                editForm.stock_quantity
                              }

                              onChange={
                                editChange
                              }
                            />

                          </label>



                          <label>

                            Reorder Level

                            <input
                              name="reorder_level"

                              type="number"

                              min="0"

                              value={
                                editForm.reorder_level
                              }

                              onChange={
                                editChange
                              }
                            />

                          </label>

                        </div>



                        <label>

                          Description

                          <textarea
                            name="description"

                            rows="5"

                            value={
                              editForm.description
                            }

                            onChange={
                              editChange
                            }
                          />

                        </label>



                        <label className="toggleRow">

                          <input
                            name="is_active"

                            type="checkbox"

                            checked={
                              editForm.is_active
                            }

                            onChange={
                              editChange
                            }
                          />

                          <span>
                            Active Product
                          </span>

                        </label>



                        <div className="editNote">

                          Stock can be edited here
                          for corrections.

                          For normal supplier
                          deliveries, use Stock
                          Receiving so the stock
                          movement is recorded.

                        </div>

                      </div>

                    </div>



                    {/* EDIT ACTIONS */}

                    <div className="drawerActions">

                      <button
                        className="secondaryBtn"

                        onClick={
                          cancelEdit
                        }

                        disabled={
                          saving
                        }
                      >

                        <RotateCcw
                          size={16}
                        />

                        Cancel

                      </button>


                      <button
                        className="primaryBtn"

                        onClick={
                          saveEdit
                        }

                        disabled={
                          saving
                        }
                      >

                        <Save
                          size={16}
                        />

                        {
                          saving
                            ? "Saving..."
                            : "Save Changes"
                        }

                      </button>

                    </div>

                  </>

                )
              }

            </aside>

          </div>

        )
      }

    </div>

  );

}