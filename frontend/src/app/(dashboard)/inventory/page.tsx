'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/utils/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  AlertTriangle,
  X,
  Package,
  Truck,
  ShieldAlert
} from 'lucide-react';

interface Product {
  id: string;
  productName: string;
  category: string;
  price: number;
  quantity: number;
  supplier: string;
  createdAt: string;
}

const Inventory = () => {
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  // Form states
  const [productName, setProductName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplier, setSupplier] = useState('');
  const [formError, setFormError] = useState('');

  // Fetch products
  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => {
      const res = await api.get(`/inventory?search=${search}`);
      return res.data.data as Product[];
    },
  });

  const products = productsData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (newProd: Omit<Product, 'id' | 'createdAt'>) => api.post('/inventory', newProd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving product details.');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Omit<Product, 'id' | 'createdAt'> }) => 
      api.put(`/inventory/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowModal(false);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Error occurred while saving product details.');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/inventory/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Failed to remove product.');
    }
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductName('');
    setCategory('');
    setPrice('');
    setQuantity('');
    setSupplier('');
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingProduct(prod);
    setProductName(prod.productName);
    setCategory(prod.category);
    setPrice(String(prod.price));
    setQuantity(String(prod.quantity));
    setSupplier(prod.supplier);
    setFormError('');
    setShowModal(true);
  };

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete product "${name}" from the inventory?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!productName || !category || price === '' || quantity === '' || !supplier) {
      setFormError('All fields are required.');
      return;
    }

    const payload = {
      productName,
      category,
      price: Number(price),
      quantity: Number(quantity),
      supplier,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="relative space-y-8 px-6 py-8 lg:px-8">
      {/* Decorative Glow Orbs */}
      <div className="bg-glow-purple top-20 left-10"></div>
      <div className="bg-glow-cyan bottom-20 right-10"></div>

      {/* Header toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between z-10 relative">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-white font-sans">Inventory Catalog</h3>
          <p className="text-sm text-gray-400 mt-1">Audit stock levels, update SKU pricing, and manage supplier records.</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex self-start items-center gap-2 rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-4 py-3 text-sm font-semibold text-white shadow-md shadow-accentPurple/20 hover:brightness-110 active:scale-98 transition duration-200"
        >
          <Plus className="h-4.5 w-4.5" />
          Add Product
        </button>
      </div>

      {/* Low Stock Warning Banner */}
      {products.some(p => p.quantity <= 10) && (
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs font-semibold text-rose-400 flex items-start gap-3 z-10 relative">
          <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-white text-sm">Critical Stock Alert</p>
            <p className="text-rose-400 mt-0.5 leading-normal">
              One or more items in the warehouse catalog are running low (below 10 units). Please check supplier information and schedule procurement orders.
            </p>
          </div>
        </div>
      )}

      {/* Filter and stats overview */}
      <div className="glass-card rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-center z-10 relative">
        <div className="relative w-full md:max-w-md">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
            <Search className="h-4.5 w-4.5" />
          </span>
          <input
            type="text"
            placeholder="Search by product name, category or supplier..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
          />
        </div>
        <div className="text-xs font-semibold text-gray-500">
          Showing {products.length} registered product{products.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Database connection error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-xs font-semibold text-red-400 flex items-center gap-2 z-10 relative">
          <AlertTriangle className="h-4.5 w-4.5" />
          Could not connect to the inventory database server.
        </div>
      )}

      {/* Catalog Table */}
      <div className="glass-card rounded-2xl shadow-xl overflow-hidden z-10 relative">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.02]">
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Product details</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Category</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Unit Price</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Stock Qty</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400">Supplier Name</th>
                <th className="p-4 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent border-accentPurple mx-auto mb-2"></div>
                    <span className="text-xs text-gray-400 font-semibold">Updating catalog logs...</span>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((prod) => {
                  const isLow = prod.quantity <= 10;
                  return (
                    <tr key={prod.id} className="glass-table-row">
                      <td className="p-4 font-bold text-white">{prod.productName}</td>
                      <td className="p-4 text-sm text-gray-300 font-semibold">{prod.category}</td>
                      <td className="p-4 text-sm font-bold text-accentCyan">${prod.price.toLocaleString()}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-black ${isLow ? 'text-rose-400' : 'text-emerald-400'}`}>
                            {prod.quantity} units
                          </span>
                          {isLow ? (
                            <span className="flex items-center gap-0.5 rounded bg-rose-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-rose-400 border border-rose-500/15">
                              Low Stock
                            </span>
                          ) : (
                            <span className="flex items-center gap-0.5 rounded bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-extrabold uppercase text-emerald-400 border border-emerald-500/15">
                              In Stock
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-4 text-xs text-gray-400 font-semibold">{prod.supplier}</td>
                      <td className="p-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(prod)}
                            title="Edit Product"
                            className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-accentCyan transition"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(prod.id, prod.productName)}
                            title="Delete Product"
                            className="rounded-lg p-2 text-gray-400 hover:bg-red-500/10 hover:text-red-400 transition"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-xs text-gray-500 font-medium">
                    No matching products found in database.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Dialog Form */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fadeIn">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-scaleUp">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.01] px-6 py-4">
              <h4 className="text-base font-bold text-white">
                {editingProduct ? 'Edit Catalog Product' : 'Create Product Entry'}
              </h4>
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3.5 text-xs font-semibold text-red-400">
                  {formError}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                  Product Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                    <Package className="h-4.5 w-4.5" />
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="E.g. ThinkPad T14"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Category Name
                  </label>
                  <select
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs appearance-none"
                  >
                    <option value="" disabled className="bg-slate-900 text-gray-400">Select Category</option>
                    <option value="Hardware" className="bg-slate-900 text-white">Hardware</option>
                    <option value="Software" className="bg-slate-900 text-white">Software</option>
                    <option value="Accessories" className="bg-slate-900 text-white">Accessories</option>
                    <option value="Furniture" className="bg-slate-900 text-white">Furniture</option>
                    <option value="Office Supplies" className="bg-slate-900 text-white">Office Supplies</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Supplier Partner
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                      <Truck className="h-4.5 w-4.5" />
                    </span>
                    <input
                      type="text"
                      required
                      placeholder="Lenovo distributor"
                      value={supplier}
                      onChange={(e) => setSupplier(e.target.value)}
                      className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Unit Price (USD)
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 text-xs">
                      $
                    </span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      placeholder="1200"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="glass-input w-full rounded-xl py-2.5 pl-7 pr-4 text-xs"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1.5">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="25"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="glass-input w-full rounded-xl py-2.5 px-4 text-xs"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 border-t border-white/5 pt-4 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/15 bg-transparent px-5 py-2.5 text-xs font-semibold text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="rounded-xl bg-gradient-to-r from-accentPurple to-accentCyan px-6 py-2.5 text-xs font-semibold text-white hover:brightness-110 active:scale-98 shadow-md shadow-accentPurple/25 disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? 'Saving...' : editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
