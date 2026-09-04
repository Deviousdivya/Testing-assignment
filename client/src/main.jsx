import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const emptyClient = { name: '', email: '', phone: '', billingAddress: '' };
const emptyLine = { description: '', quantity: 1, unitPrice: 0 };
const statuses = ['draft', 'sent', 'paid', 'overdue'];

function money(value) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value || 0));
}

function todayPlus(days) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function App() {
  const [page, setPage] = useState('clients');
  const [role, setRole] = useState('free');
  const [clients, setClients] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [profile, setProfile] = useState(null);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ status: '', clientId: '', from: '', to: '' });

  const headers = useMemo(() => ({ 'Content-Type': 'application/json', 'x-user-id': 'demo-owner', 'x-user-role': role }), [role]);

  async function request(path, options = {}) {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: options.body instanceof FormData ? { 'x-user-id': 'demo-owner', 'x-user-role': role } : { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'Request failed.');
    }

    if (response.status === 204) return null;
    return response.json();
  }

  async function loadClients() {
    const data = await request('/api/clients');
    setClients(data);
  }

  async function loadInvoices(nextFilters = filters) {
    const params = new URLSearchParams(Object.entries(nextFilters).filter(([, value]) => value));
    const data = await request(`/api/invoices?${params.toString()}`);
    setInvoices(data);
  }

  async function loadProfile() {
    const data = await request('/api/profile');
    setProfile(data);
  }

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      await Promise.all([loadClients(), loadInvoices(), loadProfile()]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, [role]);

  async function saveClient(client, id) {
    setError('');
    try {
      await request(id ? `/api/clients/${id}` : '/api/clients', {
        method: id ? 'PATCH' : 'POST',
        body: JSON.stringify(client)
      });
      await loadClients();
      setPage('clients');
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteClient(id) {
    setError('');
    try {
      await request(`/api/clients/${id}`, { method: 'DELETE' });
      await loadClients();
    } catch (err) {
      setError(err.message);
    }
  }

  async function createInvoice(invoice) {
    setError('');
    try {
      const saved = await request('/api/invoices', { method: 'POST', body: JSON.stringify(invoice) });
      await loadInvoices();
      setSelectedInvoice(saved);
      setPage('invoice-detail');
    } catch (err) {
      setError(err.message);
    }
  }

  async function updateStatus(id, status) {
    setError('');
    try {
      const saved = await request(`/api/invoices/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setSelectedInvoice(saved);
      await loadInvoices();
    } catch (err) {
      setError(err.message);
    }
  }

  async function openInvoice(id) {
    setLoading(true);
    setError('');
    try {
      const invoice = await request(`/api/invoices/${id}`);
      setSelectedInvoice(invoice);
      setPage('invoice-detail');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function uploadLogo(file) {
    setError('');
    const formData = new FormData();
    formData.append('logo', file);
    try {
      const updated = await request('/api/profile/logo', { method: 'POST', body: formData });
      setProfile(updated);
    } catch (err) {
      setError(err.message);
    }
  }

  async function applyFilters(nextFilters) {
    setFilters(nextFilters);
    setLoading(true);
    setError('');
    try {
      await loadInvoices(nextFilters);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <p className="eyebrow">Owner workspace</p>
          <h1>Invoice Studio</h1>
        </div>
        <nav>
          <button className={page === 'clients' ? 'active' : ''} onClick={() => setPage('clients')}>Clients</button>
          <button className={page === 'client-form' ? 'active' : ''} onClick={() => setPage('client-form')}>New Client</button>
          <button className={page === 'invoices' ? 'active' : ''} onClick={() => setPage('invoices')}>Invoices</button>
          <button className={page === 'invoice-form' ? 'active' : ''} onClick={() => setPage('invoice-form')}>New Invoice</button>
          <button className={page === 'settings' ? 'active' : ''} onClick={() => setPage('settings')}>Settings</button>
        </nav>
        <label className="role-switch">
          <span>{role === 'premium' ? 'Premium' : 'Free'}</span>
          <input type="checkbox" checked={role === 'premium'} onChange={(event) => setRole(event.target.checked ? 'premium' : 'free')} />
        </label>
      </header>

      <main>
        {error && <div className="alert">{error}</div>}
        {loading && <div className="loading">Loading...</div>}
        {page === 'clients' && <ClientsList clients={clients} onEdit={(client) => setPage({ name: 'client-form', client })} onDelete={deleteClient} />}
        {page === 'client-form' && <ClientForm onSubmit={saveClient} onCancel={() => setPage('clients')} />}
        {typeof page === 'object' && page.name === 'client-form' && <ClientForm client={page.client} onSubmit={saveClient} onCancel={() => setPage('clients')} />}
        {page === 'invoices' && <InvoicesList invoices={invoices} clients={clients} filters={filters} onFilters={applyFilters} onOpen={openInvoice} />}
        {page === 'invoice-form' && <InvoiceForm clients={clients} onSubmit={createInvoice} />}
        {page === 'invoice-detail' && selectedInvoice && (
          <InvoiceDetail invoice={selectedInvoice} profile={profile} role={role} onStatus={updateStatus} onBack={() => setPage('invoices')} />
        )}
        {page === 'settings' && <Settings role={role} profile={profile} onUpload={uploadLogo} />}
      </main>
    </div>
  );
}

function ClientsList({ clients, onEdit, onDelete }) {
  return (
    <section>
      <div className="section-head">
        <h2>Clients</h2>
        <span>{clients.length} total</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Phone</th><th>Billing Address</th><th></th></tr>
          </thead>
          <tbody>
            {clients.map((client) => (
              <tr key={client._id}>
                <td>{client.name}</td>
                <td>{client.email}</td>
                <td>{client.phone || '-'}</td>
                <td>{client.billingAddress || '-'}</td>
                <td className="actions">
                  <button onClick={() => onEdit(client)}>Edit</button>
                  <button className="danger" onClick={() => onDelete(client._id)}>Delete</button>
                </td>
              </tr>
            ))}
            {clients.length === 0 && <tr><td colSpan="5" className="empty">No clients yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ClientForm({ client = emptyClient, onSubmit, onCancel }) {
  const [form, setForm] = useState(client);
  const [errors, setErrors] = useState({});

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = 'Required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = 'Enter a valid email';
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(form, client._id);
  }

  return (
    <section className="form-shell">
      <h2>{client._id ? 'Edit Client' : 'Create Client'}</h2>
      <form onSubmit={submit}>
        <Field label="Name" error={errors.name}><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Email" error={errors.email}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></Field>
        <Field label="Billing Address"><textarea value={form.billingAddress} onChange={(e) => setForm({ ...form, billingAddress: e.target.value })} /></Field>
        <div className="form-actions">
          <button type="submit">Save Client</button>
          <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        </div>
      </form>
    </section>
  );
}

function InvoicesList({ invoices, clients, filters, onFilters, onOpen }) {
  function change(key, value) {
    onFilters({ ...filters, [key]: value });
  }

  return (
    <section>
      <div className="section-head">
        <h2>Invoices</h2>
        <span>{invoices.length} shown</span>
      </div>
      <div className="filters">
        <select value={filters.status} onChange={(e) => change('status', e.target.value)}>
          <option value="">All statuses</option>
          {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
        </select>
        <select value={filters.clientId} onChange={(e) => change('clientId', e.target.value)}>
          <option value="">All clients</option>
          {clients.map((client) => <option key={client._id} value={client._id}>{client.name}</option>)}
        </select>
        <input type="date" value={filters.from} onChange={(e) => change('from', e.target.value)} />
        <input type="date" value={filters.to} onChange={(e) => change('to', e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Number</th><th>Client</th><th>Due</th><th>Status</th><th>Total</th><th></th></tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice._id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.client?.name || 'Unknown'}</td>
                <td>{new Date(invoice.dueDate).toLocaleDateString()}</td>
                <td><span className={`status ${invoice.status}`}>{invoice.status}</span></td>
                <td>{money(invoice.total)}</td>
                <td className="actions"><button onClick={() => onOpen(invoice._id)}>View</button></td>
              </tr>
            ))}
            {invoices.length === 0 && <tr><td colSpan="6" className="empty">No invoices match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function InvoiceForm({ clients, onSubmit }) {
  const [form, setForm] = useState({
    invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
    clientId: clients[0]?._id || '',
    dueDate: todayPlus(14),
    status: 'draft',
    taxRate: 8,
    lineItems: [{ ...emptyLine }]
  });
  const [errors, setErrors] = useState({});
  const totals = calculateTotals(form.lineItems, form.taxRate);

  function updateLine(index, patch) {
    const next = form.lineItems.map((line, itemIndex) => itemIndex === index ? { ...line, ...patch } : line);
    setForm({ ...form, lineItems: next });
  }

  function submit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.invoiceNumber.trim()) nextErrors.invoiceNumber = 'Required';
    if (!form.clientId) nextErrors.clientId = 'Choose a client';
    if (!form.dueDate) nextErrors.dueDate = 'Required';
    form.lineItems.forEach((line, index) => {
      if (!line.description.trim()) nextErrors[`line-${index}`] = 'Every line needs a description';
    });
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) onSubmit(form);
  }

  return (
    <section className="form-shell wide">
      <h2>Create Invoice</h2>
      {clients.length === 0 && <div className="alert">Create a client before making an invoice.</div>}
      <form onSubmit={submit}>
        <div className="grid-4">
          <Field label="Invoice Number" error={errors.invoiceNumber}><input value={form.invoiceNumber} onChange={(e) => setForm({ ...form, invoiceNumber: e.target.value })} /></Field>
          <Field label="Client" error={errors.clientId}>
            <select value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })}>
              <option value="">Select client</option>
              {clients.map((client) => <option key={client._id} value={client._id}>{client.name}</option>)}
            </select>
          </Field>
          <Field label="Due Date" error={errors.dueDate}><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></Field>
          <Field label="Status">
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
          </Field>
        </div>
        <div className="line-editor">
          <div className="line-head"><span>Description</span><span>Qty</span><span>Unit Price</span><span>Line Total</span><span></span></div>
          {form.lineItems.map((line, index) => (
            <div className="line-row" key={index}>
              <input value={line.description} onChange={(e) => updateLine(index, { description: e.target.value })} />
              <input type="number" min="0.01" step="0.01" value={line.quantity} onChange={(e) => updateLine(index, { quantity: e.target.value })} />
              <input type="number" min="0" step="0.01" value={line.unitPrice} onChange={(e) => updateLine(index, { unitPrice: e.target.value })} />
              <strong>{money(Number(line.quantity || 0) * Number(line.unitPrice || 0))}</strong>
              <button type="button" className="danger" disabled={form.lineItems.length === 1} onClick={() => setForm({ ...form, lineItems: form.lineItems.filter((_, itemIndex) => itemIndex !== index) })}>Remove</button>
            </div>
          ))}
          {Object.keys(errors).some((key) => key.startsWith('line-')) && <small className="error">Every line needs a description.</small>}
          <button type="button" className="secondary" onClick={() => setForm({ ...form, lineItems: [...form.lineItems, { ...emptyLine }] })}>Add Line</button>
        </div>
        <div className="totals-editor">
          <Field label="Tax %"><input type="number" min="0" max="100" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} /></Field>
          <dl>
            <div><dt>Subtotal</dt><dd>{money(totals.subtotal)}</dd></div>
            <div><dt>Tax</dt><dd>{money(totals.tax)}</dd></div>
            <div className="grand"><dt>Total</dt><dd>{money(totals.total)}</dd></div>
          </dl>
        </div>
        <div className="form-actions"><button type="submit" disabled={clients.length === 0}>Create Invoice</button></div>
      </form>
    </section>
  );
}

function InvoiceDetail({ invoice, profile, role, onStatus, onBack }) {
  const logoUrl = role === 'premium' && profile?.logoUrl ? `${API_URL}${profile.logoUrl}` : '';

  return (
    <section>
      <div className="invoice-toolbar">
        <button className="secondary" onClick={onBack}>Back</button>
        <button onClick={() => onStatus(invoice._id, 'paid')} disabled={invoice.status === 'paid'}>Mark Paid</button>
        <button className="secondary" onClick={() => window.print()}>Print</button>
      </div>
      <article className="printable">
        <div className="invoice-title">
          <div>
            {logoUrl && <img src={logoUrl} alt="Business logo" className="logo" />}
            <h2>Invoice</h2>
            <p>{invoice.invoiceNumber}</p>
          </div>
          <span className={`status ${invoice.status}`}>{invoice.status}</span>
        </div>
        <div className="invoice-meta">
          <div>
            <h3>Bill To</h3>
            <p><strong>{invoice.client?.name}</strong></p>
            <p>{invoice.client?.email}</p>
            <p>{invoice.client?.phone}</p>
            <p>{invoice.client?.billingAddress}</p>
          </div>
          <div>
            <h3>Due Date</h3>
            <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
        <table>
          <thead><tr><th>Description</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
          <tbody>
            {invoice.lineItems.map((item, index) => (
              <tr key={index}>
                <td>{item.description}</td>
                <td>{item.quantity}</td>
                <td>{money(item.unitPrice)}</td>
                <td>{money(item.quantity * item.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <dl className="invoice-totals">
          <div><dt>Subtotal</dt><dd>{money(invoice.subtotal)}</dd></div>
          <div><dt>Tax ({invoice.taxRate}%)</dt><dd>{money(invoice.tax)}</dd></div>
          <div className="grand"><dt>Total</dt><dd>{money(invoice.total)}</dd></div>
        </dl>
      </article>
    </section>
  );
}

function Settings({ role, profile, onUpload }) {
  return (
    <section className="form-shell">
      <h2>Branding</h2>
      {role !== 'premium' && <div className="alert">Custom logo upload is available to premium users only.</div>}
      {role === 'premium' && (
        <div className="settings-panel">
          {profile?.logoUrl && <img className="logo-preview" src={`${API_URL}${profile.logoUrl}`} alt="Current logo" />}
          <label className="field">
            <span>Upload Logo</span>
            <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => e.target.files[0] && onUpload(e.target.files[0])} />
          </label>
        </div>
      )}
    </section>
  );
}

function Field({ label, error, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small className="error">{error}</small>}
    </label>
  );
}

function calculateTotals(lineItems, taxRate) {
  const subtotal = lineItems.reduce((sum, item) => sum + Number(item.quantity || 0) * Number(item.unitPrice || 0), 0);
  const tax = subtotal * (Number(taxRate || 0) / 100);
  return { subtotal, tax, total: subtotal + tax };
}

createRoot(document.getElementById('root')).render(<App />);
